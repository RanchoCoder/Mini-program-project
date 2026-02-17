import { getCarList } from '../../utils/request.js';

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    searchKeyword: '',
    carList: [],
    hasResult: false,
    isLoading: false
  },

  onLoad() {
    this.initUserInfo();
  },

  // 初始化用户登录状态
  initUserInfo() {
    const app = getApp();
    const userInfo = wx.getStorageSync('userInfo');

    if (userInfo && userInfo.openid) {
      this.setData({
        userInfo: userInfo,
        isLoggedIn: true
      });
    } else {
      // 未登录，跳转到完善信息页
      wx.redirectTo({
        url: '/pages/profile/profile'
      });
    }
  },

  // 输入查询关键词
  onKeywordInput(e) {
    this.setData({
      searchKeyword: e.detail.value.trim()
    });
  },

  // 执行汽车查询
  async searchCar() {
    const { searchKeyword, isLoggedIn, userInfo } = this.data;

    if (!isLoggedIn) {
      wx.redirectTo({ url: '/pages/profile/profile' });
      return;
    }

    if (!searchKeyword) {
      wx.showToast({
        title: '请输入查询关键词（如：宝马、SUV）',
        icon: 'none'
      });
      return;
    }

    this.setData({ isLoading: true });

    try {
      const params = {
        keyword: searchKeyword,
        openid: userInfo.openid
      };

      const carData = await getCarList(params);

      this.setData({
        carList: carData || [],
        hasResult: carData && carData.length > 0,
        isLoading: false
      });

      if (!this.data.hasResult) {
        wx.showToast({
          title: '未查询到相关车辆',
          icon: 'none'
        });
      }
    } catch (err) {
      console.error('查询失败:', err);
      this.setData({
        carList: [],
        hasResult: false,
        isLoading: false
      });
    }
  },

  // 重置查询
  resetSearch() {
    this.setData({
      searchKeyword: '',
      carList: [],
      hasResult: false
    });
  },

  // 查看车辆详情
  viewCarDetail(e) {
    const carId = e.currentTarget.dataset.carid;
    wx.navigateTo({
      url: `/pages/carDetail/carDetail?carId=${carId}`
    });
  }
});