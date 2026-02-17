// 引入配置
const config = require('./config.js')

App({
  onLaunch() {
    // 检查登录状态（启动时自动验证）
    this.checkLogin()
  },

  globalData: {
    userInfo: null,    // 用户信息（含openid、昵称、头像）
    token: null,       // 登录令牌
    isLoggedIn: false, // 登录状态
    openid: null       // 用户唯一标识
  },

  // 检查本地登录状态
  checkLogin() {
    const token = wx.getStorageSync('token')
    const userInfo = wx.getStorageSync('userInfo')
    const openid = wx.getStorageSync('openid')
    
    if (token && userInfo && openid) {
      // 本地有缓存，直接恢复登录状态
      this.globalData.token = token
      this.globalData.userInfo = userInfo
      this.globalData.openid = openid
      this.globalData.isLoggedIn = true
      console.log('【全局】从缓存恢复登录状态:', userInfo.nickName)
    } else {
      console.log('【全局】本地无登录缓存，不自动登录（避免打扰用户）')
      // 注释：启动时不自动登录，改为用户手动点击登录按钮触发
      // this.wxLogin() 
    }
  },

  // 微信登录核心方法（供全局调用）
  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.showLoading({ title: '登录中...' })
      
      // 1. 获取微信登录凭证code
      wx.login({
        success: (res) => {
          if (res.code) {
            // 2. 调用后端登录接口（修正为/api/wxlogin）
            this.loginWithCode(res.code).then((loginRes) => {
              wx.hideLoading()
              resolve(loginRes)
            }).catch((err) => {
              wx.hideLoading()
              reject(err)
            })
          } else {
            wx.hideLoading()
            reject(new Error('获取登录凭证失败：' + res.errMsg))
            wx.showToast({ title: '登录失败', icon: 'none' })
          }
        },
        fail: (err) => {
          wx.hideLoading()
          reject(new Error('微信登录接口调用失败：' + err.errMsg))
          console.error('【全局】wx.login失败:', err)
          wx.showToast({ title: '登录失败', icon: 'none' })
        }
      })
    })
  },

  // 用code换取用户信息（对接后端/api/wxlogin）
  loginWithCode(code) {
    return new Promise((resolve, reject) => {
      wx.request({
        url: `${config.API_BASE}/api/wxlogin`, // 修正接口路径
        method: 'POST',
        data: { code },
        success: (res) => {
          if (res.statusCode === 200 && res.data.code === 0) {
            // 后端返回成功（适配之前的后端返回格式）
            const { data } = res.data
            const token = 'wx_token_' + Date.now() // 模拟token（后端可替换为真实值）
            
            // 更新全局数据
            this.globalData.token = token
            this.globalData.userInfo = data
            this.globalData.openid = data.openid
            this.globalData.isLoggedIn = true
            
            // 保存到本地存储
            wx.setStorageSync('token', token)
            wx.setStorageSync('userInfo', data)
            wx.setStorageSync('openid', data.openid)
            
            console.log('【全局】登录成功:', data)
            resolve({
              success: true,
              userInfo: data,
              token,
              openid: data.openid
            })
          } else {
            // 后端返回失败
            const errMsg = res.data?.msg || '登录失败：后端返回异常'
            reject(new Error(errMsg))
            console.log('【全局】登录失败:', errMsg)
            wx.showToast({ title: errMsg, icon: 'none' })
          }
        },
        fail: (err) => {
          // 网络失败，触发模拟登录（仅用于测试）
          console.error('【全局】登录请求失败，触发模拟登录:', err)
          const mockRes = this.mockLogin()
          resolve(mockRes)
        }
      })
    })
  },

  // 模拟登录（仅测试用，后端接口正常时可删除）
  mockLogin() {
    const mockUserInfo = {
      nickName: '微信用户' + Math.floor(Math.random() * 1000),
      avatarUrl: 'https://thirdwx.qlogo.cn/mmopen/vi_32/POgEwh4mIHO4nibH0KlMECNjjGxQUq24ZEaGT4poC6icRiccVGKSyXwibcPq4BWmiaIGuG1icwxaQX6grC9VemZoJ8rg/132',
      openid: 'mock_openid_' + Date.now()
    }
    const mockToken = 'mock_token_' + Date.now()
    
    // 更新全局数据
    this.globalData.userInfo = mockUserInfo
    this.globalData.token = mockToken
    this.globalData.openid = mockUserInfo.openid
    this.globalData.isLoggedIn = true
    
    // 保存到本地
    wx.setStorageSync('userInfo', mockUserInfo)
    wx.setStorageSync('token', mockToken)
    wx.setStorageSync('openid', mockUserInfo.openid)
    
    wx.showToast({ title: '使用模拟登录', icon: 'none' })
    return {
      success: true,
      userInfo: mockUserInfo,
      token: mockToken,
      openid: mockUserInfo.openid
    }
  },

  // 退出登录（全局方法）
  logout() {
    // 清空全局数据
    this.globalData.userInfo = null
    this.globalData.token = null
    this.globalData.openid = null
    this.globalData.isLoggedIn = false
    
    // 清空本地存储
    wx.removeStorageSync('token')
    wx.removeStorageSync('userInfo')
    wx.removeStorageSync('openid')
    
    console.log('【全局】已退出登录')
    wx.showToast({ title: '已退出登录', icon: 'success' })
  }
})