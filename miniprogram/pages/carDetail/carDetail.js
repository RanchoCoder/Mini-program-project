import { getCarDetail } from '../../utils/request.js';

Page({
  data: {
    carId: '',
    carDetail: null
  },

  onLoad(options) {
    this.setData({ carId: options.carId });
    this.loadCarDetail();
  },

  async loadCarDetail() {
    try {
      const detail = await getCarDetail(this.data.carId);
      this.setData({ carDetail: detail });
    } catch (err) {
      console.error('加载详情失败:', err);
    }
  }
});