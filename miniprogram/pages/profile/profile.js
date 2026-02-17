Page({
  data: {
    avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
    nickName: '',
    openid: '',
    saveEnabled: false // 控制按钮是否可用
  },

  onLoad(options) {
    console.log('profile页面加载，openid:', options.openid)
    this.setData({ openid: options.openid })
  },

  // 选择头像
  onChooseAvatar(e) {
    console.log('选择头像:', e.detail.avatarUrl)
    this.setData({ 
      avatarUrl: e.detail.avatarUrl 
    })
    this.checkSaveEnabled()
  },

  // 输入昵称
  onNickInput(e) {
    const nickName = e.detail.value?.trim()
    console.log('输入昵称:', nickName)
    this.setData({ nickName })
    this.checkSaveEnabled()
  },

  // 检查保存按钮是否可用
  checkSaveEnabled() {
    const { nickName, avatarUrl } = this.data
    // 只要昵称不为空，且头像不是默认头像，就启用按钮
    const enabled = nickName && avatarUrl !== this.data.avatarUrl
    console.log('保存按钮可用:', enabled)
    this.setData({ saveEnabled: enabled })
  },

  // 保存真实信息（核心修复）
  onSave() {
    const { nickName, avatarUrl, openid } = this.data

    if (!nickName) {
      wx.showToast({ title: '请输入昵称', icon: 'none' })
      return
    }

    if (avatarUrl === this.data.avatarUrl) {
      wx.showToast({ title: '请选择头像', icon: 'none' })
      return
    }

    // 1. 构造真实用户信息
    const realUserInfo = {
      openid,
      nickName,
      avatarUrl,
      session_key: wx.getStorageSync('userInfo')?.session_key || ''
    }

    console.log('开始保存用户信息:', realUserInfo)

    // 2. 强制更新全局数据
    const app = getApp()
    app.globalData.userInfo = realUserInfo
    app.globalData.isLoggedIn = true
    app.globalData.openid = openid
    console.log('全局数据已更新:', app.globalData.userInfo)

    // 3. 保存到本地存储
    wx.setStorageSync('userInfo', realUserInfo)
    console.log('本地存储已更新:', wx.getStorageSync('userInfo'))

    // 4. 显示成功提示
    wx.showToast({ 
      title: '信息保存成功', 
      icon: 'success',
      duration: 2000
    })

    // 5. 延迟返回上一页，确保提示显示
    setTimeout(() => {
      wx.navigateBack({
        delta: 1,
        success: () => {
          console.log('返回上一页成功')
          // 6. 强制刷新上一页数据
          const pages = getCurrentPages()
          if (pages.length >= 2) {
            const prevPage = pages[pages.length - 2]
            if (prevPage) {
              prevPage.setData({
                userInfo: realUserInfo,
                isLoggedIn: true
              })
              if (typeof prevPage.search === 'function') {
                prevPage.search(1)
              }
            }
          }
        },
        fail: (err) => {
          console.error('返回失败:', err)
          wx.showToast({ title: '返回失败，请手动返回', icon: 'none' })
        }
      })
    }, 2000)
  }
})