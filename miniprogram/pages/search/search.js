// 引入配置
const config = require('../../config.js')

Page({
  data: {
    // 搜索关键词
    q: '',
    // 筛选条件
    brand: '',
    brandIndex: 0,
    minYear: '',
    maxYear: '',
    // 数据
    results: [],
    loading: false,
    loadingMore: false,
    // 分页
    page: 1,
    page_size: config.PAGE_SIZE,
    total: 0,
    totalPages: 0,
    hasMore: true,
    // 筛选选项
    brands: config.BRANDS,
    minYearRange: config.MIN_YEAR,
    maxYearRange: config.MAX_YEAR,
    // 防抖计时器
    searchTimer: null,
    // 是否显示高级筛选
    showAdvanced: false,
    // 用户信息
    userInfo: null,
    isLoggedIn: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {
    this.initData()
    this.initUserInfo()
  },

  /**
   * 初始化年份等基础数据
   */
  initData() {
    const currentYear = new Date().getFullYear()
    this.setData({
      maxYearRange: currentYear,
      maxYear: currentYear
    })
  },

  /**
   * 初始化用户信息（同步全局+本地缓存）
   */
  initUserInfo() {
    const app = getApp()
    // 优先读取全局数据，其次本地缓存
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo')
    const isLoggedIn = app.globalData.isLoggedIn || !!userInfo

    if (userInfo && isLoggedIn) {
      this.setData({
        userInfo,
        isLoggedIn
      })
      // 已登录自动加载数据
      this.search(1)
    }
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    // 清理防抖定时器，避免内存泄漏
    if (this.data.searchTimer) {
      clearTimeout(this.data.searchTimer)
      this.setData({ searchTimer: null })
    }
  },

  /**
   * 搜索框输入处理（带防抖）
   */
  onInput(e) {
    const q = e.detail.value?.trim() || '' // 去除首尾空格
    this.setData({ q })
    this.debounceSearch()
  },

  /**
   * 品牌选择变化
   */
  onBrandChange(e) {
    const index = parseInt(e.detail.value) || 0
    const brand = index === 0 ? '' : this.data.brands[index]
    this.setData({ 
      brandIndex: index,
      brand 
    })
    this.debounceSearch()
  },

  /**
   * 最小年份输入
   */
  onMinYearInput(e) {
    const minYear = e.detail.value?.trim() || ''
    // 简单校验：只能是数字且不超过当前年份
    if (minYear && (isNaN(minYear) || Number(minYear) > this.data.maxYearRange)) {
      wx.showToast({ title: '年份输入有误', icon: 'none' })
      return
    }
    this.setData({ minYear })
    this.debounceSearch()
  },

  /**
   * 最大年份输入
   */
  onMaxYearInput(e) {
    const maxYear = e.detail.value?.trim() || ''
    // 简单校验：只能是数字且不小于最小年份
    if (maxYear && (isNaN(maxYear) || Number(maxYear) < this.data.minYearRange)) {
      wx.showToast({ title: '年份输入有误', icon: 'none' })
      return
    }
    this.setData({ maxYear })
    this.debounceSearch()
  },

  /**
   * 防抖搜索（避免频繁请求）
   */
  debounceSearch() {
    const { searchTimer } = this.data
    if (searchTimer) {
      clearTimeout(searchTimer)
    }

    const timer = setTimeout(() => {
      if (this.data.isLoggedIn) { // 仅登录后执行防抖搜索
        this.search(1)
      }
    }, config.DEBOUNCE_DELAY)

    this.setData({ searchTimer: timer })
  },

  /**
   * 手动点击搜索
   */
  onSearch() {
    // 未登录时引导登录
    if (!this.data.isLoggedIn) {
      wx.showModal({
        title: '提示',
        content: '请先登录后再进行搜索',
        confirmText: '去登录',
        success: (res) => {
          if (res.confirm) {
            this.onLogin() // 点击确认直接跳转到登录
          }
        }
      })
      return
    }
    this.search(1)
  },

  /**
   * 核心搜索逻辑（对接后端/api/cars接口）
   * @param {number} page - 页码，默认1
   */
  search(page = 1) {
    const { q, brand, minYear, maxYear, page_size, isLoggedIn } = this.data

    // 边界校验：未登录/加载中不发起请求
    if (!isLoggedIn || this.data.loading || (page > 1 && this.data.loadingMore)) {
      return
    }

    // 重置分页状态（第一页）
    if (page === 1) {
      this.setData({
        page: 1,
        results: [],
        hasMore: true
      })
    }

    // 设置加载状态
    this.setData({ 
      loading: page === 1,
      loadingMore: page > 1
    })

    // 构造请求参数（过滤空值）
    const params = {
      q,
      page,
      page_size
    }
    if (brand) params.brand = brand
    if (minYear) params.min_year = minYear
    if (maxYear) params.max_year = maxYear
    if (this.data.userInfo?.openid) params.openid = this.data.userInfo.openid

    // 发起网络请求
    wx.request({
      url: `${config.API_BASE}/api/cars`,
      method: 'GET',
      data: params,
      timeout: 10000, // 10秒超时
      success: (res) => {
        // 接口返回成功且业务码正确
        if (res.statusCode === 200 && res.data?.code === 0) {
          const { list = [], total = 0 } = res.data.data || {}
          const currentPage = page
          const totalPages = Math.ceil(total / page_size)
          const newResults = page === 1 ? list : [...this.data.results, ...list]

          this.setData({
            results: newResults,
            total,
            page: currentPage,
            totalPages,
            hasMore: currentPage < totalPages
          })
        } else {
          // 业务异常提示
          wx.showToast({ 
            title: res.data?.msg || '查询失败，请重试', 
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: (err) => {
        // 网络异常处理
        console.error('【搜索请求失败】', err)
        wx.showToast({ 
          title: '网络异常，请检查后重试', 
          icon: 'none',
          duration: 2000
        })
      },
      complete: () => {
        // 无论成败，关闭加载状态
        this.setData({ 
          loading: false,
          loadingMore: false 
        })
      }
    })
  },

  /**
   * 加载更多数据
   */
  loadMore() {
    const { loading, loadingMore, hasMore, page, isLoggedIn } = this.data

    // 边界校验：加载中/无更多/未登录 不处理
    if (loading || loadingMore || !hasMore || !isLoggedIn) {
      return
    }

    this.search(page + 1)
  },

  /**
   * 页面上拉触底事件
   */
  onReachBottom() {
    this.loadMore()
  },

  /**
   * 页面下拉刷新事件
   */
  onPullDownRefresh() {
    if (this.data.isLoggedIn) {
      this.search(1)
    }
    wx.stopPullDownRefresh()
  },

  /**
   * 切换高级筛选显示/隐藏
   */
  toggleAdvanced() {
    this.setData({
      showAdvanced: !this.data.showAdvanced
    })
  },

  /**
   * 重置所有筛选条件
   */
  resetFilters() {
    this.setData({
      q: '',
      brand: '',
      brandIndex: 0,
      minYear: '',
      maxYear: ''
    })
    // 重置后重新搜索
    if (this.data.isLoggedIn) {
      this.search(1)
    }
  },

  /**
   * 清空搜索框
   */
  clearSearch() {
    this.setData({
      q: '',
      results: [],
      total: 0,
      page: 1,
      hasMore: true
    })
  },

  /**
   * 微信登录（获取真实openid + 引导用户填写真实昵称/头像）
   */
  onLogin() {
    const that = this
    // 避免重复点击登录
    if (wx.getStorageSync('isLoggingIn')) {
      return
    }
    wx.setStorageSync('isLoggingIn', true)

    wx.showLoading({ title: '登录中...' })

    // 1. 获取微信登录凭证code（获取真实openid）
    wx.login({
      timeout: 5000,
      success: (loginRes) => {
        if (loginRes.code) {
          // 2. 调用后端接口获取真实openid
          wx.request({
            url: `${config.API_BASE}/api/wxlogin`,
            method: 'POST',
            data: { code: loginRes.code },
            timeout: 10000,
            success: (res) => {
              wx.hideLoading()
              wx.removeStorageSync('isLoggingIn')

              if (res.statusCode === 200 && res.data?.code === 0) {
                const userBase = res.data.data || {} // 仅含openid，无昵称/头像
                const app = getApp()

                // 3. 引导用户完善真实昵称/头像（微信最新规范）
                wx.showModal({
                  title: '完善信息',
                  content: '请填写你的真实昵称和头像，便于使用全部功能',
                  confirmText: '去完善',
                  cancelText: '暂不完善',
                  success: (modalRes) => {
                    if (modalRes.confirm) {
                      // 跳转到信息完善页面（需先创建pages/profile/profile）
                      wx.navigateTo({
                        url: `/pages/profile/profile?openid=${userBase.openid}`,
                        success: () => {
                          // 先保存基础信息（openid）
                          that.setData({
                            userInfo: userBase,
                            isLoggedIn: true
                          })
                          app.globalData.userInfo = userBase
                          app.globalData.isLoggedIn = true
                          app.globalData.openid = userBase.openid
                          wx.setStorageSync('userInfo', userBase)
                        },
                        fail: () => {
                          // 如果没创建profile页面，直接用基础信息登录
                          that.setData({
                            userInfo: userBase,
                            isLoggedIn: true
                          })
                          app.globalData.userInfo = userBase
                          app.globalData.isLoggedIn = true
                          app.globalData.openid = userBase.openid
                          wx.setStorageSync('userInfo', userBase)
                          wx.showToast({ title: '登录成功', icon: 'success' })
                          that.search(1)
                        }
                      })
                    } else {
                      // 暂不完善，仅用openid登录（已获取真实openid）
                      that.setData({
                        userInfo: userBase,
                        isLoggedIn: true
                      })
                      app.globalData.userInfo = userBase
                      app.globalData.isLoggedIn = true
                      app.globalData.openid = userBase.openid
                      wx.setStorageSync('userInfo', userBase)
                      
                      wx.showToast({
                        title: '登录成功',
                        icon: 'success',
                        duration: 1500
                      })
                      that.search(1)
                    }
                  }
                })
              } else {
                // 登录失败提示
                wx.showToast({ 
                  title: res.data?.msg || '登录失败', 
                  icon: 'none',
                  duration: 2000
                })
              }
            },
            fail: (err) => {
              wx.hideLoading()
              wx.removeStorageSync('isLoggingIn')
              console.error('【登录请求失败】', err)
              wx.showToast({ 
                title: '网络异常，登录失败', 
                icon: 'none',
                duration: 2000
              })
            }
          })
        } else {
          wx.hideLoading()
          wx.removeStorageSync('isLoggingIn')
          wx.showToast({ 
            title: '获取登录凭证失败', 
            icon: 'none',
            duration: 2000
          })
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.removeStorageSync('isLoggingIn')
        console.error('【wx.login失败】', err)
        wx.showToast({ 
          title: '登录失败，请重试', 
          icon: 'none',
          duration: 2000
        })
      }
    })
  },

  /**
   * 退出登录
   */
  onLogout() {
    const that = this
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      confirmText: '退出',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          const app = getApp()
          
          // 1. 清空本地存储
          wx.removeStorageSync('userInfo')
          wx.removeStorageSync('token')
          wx.removeStorageSync('openid')

          // 2. 清空全局数据
          app.globalData.userInfo = null
          app.globalData.token = null
          app.globalData.openid = null
          app.globalData.isLoggedIn = false

          // 3. 清空页面数据
          that.setData({
            userInfo: null,
            isLoggedIn: false,
            results: [],
            total: 0,
            page: 1,
            hasMore: true
          })

          // 4. 退出成功提示
          wx.showToast({
            title: '已退出登录',
            icon: 'success',
            duration: 1500
          })
        }
      }
    })
  }
})