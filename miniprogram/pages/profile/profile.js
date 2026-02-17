Page({
  data: {
    defaultAvatar: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
    avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
    nickName: '',
    openid: '',
    saveEnabled: false,
    hasGotNick: false // 避免重复授权
  },

  onLoad(options) {
    // 修复点1：处理 options.openid 为 undefined 的情况
    const openid = options.openid || wx.getStorageSync('userInfo')?.openid || '';
    this.setData({ openid });
    console.log('Profile页接收的openid:', openid); // 日志：方便排查
  },

  // 选择头像时，同步获取微信昵称
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({ avatarUrl });

    // 首次选择头像时，同步获取昵称
    if (!this.data.hasGotNick) {
      wx.getUserProfile({
        desc: '用于完善用户资料（头像+昵称）',
        success: (res) => {
          const wxNickname = res.userInfo.nickName;
          this.setData({
            nickName: wxNickname,
            hasGotNick: true
          });
          this.checkButtonStatus();
        },
        fail: (err) => {
          console.log('用户拒绝授权昵称:', err);
          wx.showToast({ title: '可手动输入昵称', icon: 'none' });
          this.checkButtonStatus();
        }
      });
    } else {
      this.checkButtonStatus();
    }
  },

  // 手动修改昵称（可选）
  onNickInput(e) {
    const nickName = e.detail.value?.trim();
    this.setData({ nickName });
    this.checkButtonStatus();
  },

  // 检查按钮是否亮起
  checkButtonStatus() {
    const { nickName, avatarUrl, defaultAvatar } = this.data;
    const canSave = nickName.length > 0 && avatarUrl !== defaultAvatar;
    this.setData({ saveEnabled: canSave });
  },

  // 保存并跳转（核心修复）
  onSave() {
    const { nickName, avatarUrl, openid } = this.data;
    
    // 1. 基础校验
    if (!nickName) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    if (avatarUrl === this.data.defaultAvatar) {
      wx.showToast({ title: '请选择头像', icon: 'none' });
      return;
    }

    // 2. 修复点2：即使openid为空，也先保存基础信息，避免跳转卡住
    const realUserInfo = {
      openid: openid || 'temp_openid_' + Date.now(), // 临时ID兜底
      nickName,
      avatarUrl,
      session_key: wx.getStorageSync('userInfo')?.session_key || ''
    };

    // 3. 更新全局+本地存储
    const app = getApp();
    app.globalData.userInfo = realUserInfo;
    app.globalData.isLoggedIn = true;
    wx.setStorageSync('userInfo', realUserInfo);
    console.log('保存的用户信息:', realUserInfo); // 日志：验证保存结果

    // 4. 修复点3：增强跳转容错（redirectTo失败则用reLaunch）
    wx.showToast({ title: '登录成功', icon: 'success', duration: 1500 });
    
    setTimeout(() => {
      wx.redirectTo({
        url: '/pages/search/search',
        success: () => {
          console.log('跳转搜索页成功');
        },
        fail: (err) => {
          console.error('redirectTo失败:', err);
          // 兜底方案：关闭所有页面，直接打开搜索页
          wx.reLaunch({
            url: '/pages/search/search',
            success: () => {
              console.log('reLaunch跳转搜索页成功');
            },
            fail: (err2) => {
              console.error('reLaunch也失败:', err2);
              wx.showToast({ title: '跳转失败，请手动返回', icon: 'none' });
            }
          });
        }
      });
    }, 1500);
  }
});Page({
  data: {
    defaultAvatar: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
    avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0',
    nickName: '',
    openid: '',
    saveEnabled: false,
    hasGotNick: false // 避免重复授权
  },

  onLoad(options) {
    // 修复点1：处理 options.openid 为 undefined 的情况
    const openid = options.openid || wx.getStorageSync('userInfo')?.openid || '';
    this.setData({ openid });
    console.log('Profile页接收的openid:', openid); // 日志：方便排查
  },

  // 选择头像时，同步获取微信昵称
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({ avatarUrl });

    // 首次选择头像时，同步获取昵称
    if (!this.data.hasGotNick) {
      wx.getUserProfile({
        desc: '用于完善用户资料（头像+昵称）',
        success: (res) => {
          const wxNickname = res.userInfo.nickName;
          this.setData({
            nickName: wxNickname,
            hasGotNick: true
          });
          this.checkButtonStatus();
        },
        fail: (err) => {
          console.log('用户拒绝授权昵称:', err);
          wx.showToast({ title: '可手动输入昵称', icon: 'none' });
          this.checkButtonStatus();
        }
      });
    } else {
      this.checkButtonStatus();
    }
  },

  // 手动修改昵称（可选）
  onNickInput(e) {
    const nickName = e.detail.value?.trim();
    this.setData({ nickName });
    this.checkButtonStatus();
  },

  // 检查按钮是否亮起
  checkButtonStatus() {
    const { nickName, avatarUrl, defaultAvatar } = this.data;
    const canSave = nickName.length > 0 && avatarUrl !== defaultAvatar;
    this.setData({ saveEnabled: canSave });
  },

  // 保存并跳转（核心修复）
  onSave() {
    const { nickName, avatarUrl, openid } = this.data;
    
    // 1. 基础校验
    if (!nickName) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    if (avatarUrl === this.data.defaultAvatar) {
      wx.showToast({ title: '请选择头像', icon: 'none' });
      return;
    }

    // 2. 修复点2：即使openid为空，也先保存基础信息，避免跳转卡住
    const realUserInfo = {
      openid: openid || 'temp_openid_' + Date.now(), // 临时ID兜底
      nickName,
      avatarUrl,
      session_key: wx.getStorageSync('userInfo')?.session_key || ''
    };

    // 3. 更新全局+本地存储
    const app = getApp();
    app.globalData.userInfo = realUserInfo;
    app.globalData.isLoggedIn = true;
    wx.setStorageSync('userInfo', realUserInfo);
    console.log('保存的用户信息:', realUserInfo); // 日志：验证保存结果

    // 4. 修复点3：增强跳转容错（redirectTo失败则用reLaunch）
    wx.showToast({ title: '登录成功', icon: 'success', duration: 1500 });
    
    setTimeout(() => {
      wx.redirectTo({
        url: '/pages/search/search',
        success: () => {
          console.log('跳转搜索页成功');
        },
        fail: (err) => {
          console.error('redirectTo失败:', err);
          // 兜底方案：关闭所有页面，直接打开搜索页
          wx.reLaunch({
            url: '/pages/search/search',
            success: () => {
              console.log('reLaunch跳转搜索页成功');
            },
            fail: (err2) => {
              console.error('reLaunch也失败:', err2);
              wx.showToast({ title: '跳转失败，请手动返回', icon: 'none' });
            }
          });
        }
      });
    }, 1500);
  }
});