// 后端API基础地址（开发环境使用本地服务器）
const config = require('../config.js');
const baseUrl = config.API_BASE;

/**
 * 通用请求方法
 * @param {String} url 接口路径，如 '/api/car/search'
 * @param {Object} data 请求参数
 * @param {String} method 请求方法，GET 或 POST
 * @returns {Promise}
 */
const request = (url, data = {}, method = 'GET') => {
  // 从本地存储中获取用户信息，用于鉴权
  const userInfo = wx.getStorageSync('userInfo');

  return new Promise((resolve, reject) => {
    wx.request({
      url: `${baseUrl}${url}`,
      data: data,
      method: method,
      header: {
        'content-type': 'application/json',
        'openid': userInfo?.openid || '',
        'token': userInfo?.session_key || ''
      },
      success: (res) => {
        if (res.data.code === 200) {
          resolve(res.data.data);
        } else {
          wx.showToast({
            title: res.data.msg || '请求失败',
            icon: 'none'
          });
          reject(res.data);
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络异常，请稍后重试',
          icon: 'none'
        });
        reject(err);
      },
      complete: () => {
        wx.hideLoading();
      }
    });
  });
};

/**
 * 汽车查询接口
 * @param {Object} params 查询参数，如 { keyword: '宝马', openid: 'xxx' }
 * @returns {Promise}
 */
export const getCarList = (params) => {
  wx.showLoading({ title: '查询中...' });
  // 将keyword转换为q参数，匹配后端API
  const apiParams = {
    q: params.keyword || '',
    page: 1,
    page_size: 10
  };
  return request('/api/cars', apiParams, 'GET');
};

/**
 * 获取汽车详情接口
 * @param {String} carId 汽车ID
 * @returns {Promise}
 */
export const getCarDetail = (carId) => {
  wx.showLoading({ title: '加载中...' });
  return new Promise((resolve) => {
    setTimeout(() => {
      wx.hideLoading();
      // Mock 详情数据
      const mockDetail = {
        id: carId,
        brand: carId === '1001' ? '宝马' : carId === '1002' ? '奔驰' : '奥迪',
        model: carId === '1001' ? 'X3 2022款 xDrive28i' : carId === '1002' ? 'GLC 260L 动感型' : 'Q5L 40TFSI 时尚型',
        price: carId === '1001' ? 35.8 : carId === '1002' ? 32.5 : 28.9,
        mileage: carId === '1001' ? 2.5 : carId === '1002' ? 3.1 : 4.2,
        carImage: 'https://via.placeholder.com/750x400',
        description: carId === '1001' 
          ? '2022年上牌，个人一手车，全程4S店保养，车况极佳，支持分期，首付10万即可提车' 
          : carId === '1002'
            ? '2021年上牌，无重大事故，原版原漆，内饰九成新，配置全景天窗、电动尾门'
            : '2020年上牌，四驱，全景天窗，定速巡航，油耗低，适合家用'
      };
      resolve(mockDetail);
    }, 800);
  });
};

export default request;