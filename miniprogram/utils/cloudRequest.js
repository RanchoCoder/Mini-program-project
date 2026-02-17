// 微信云开发请求工具

/**
 * 调用云函数
 * @param {String} name 云函数名称
 * @param {Object} data 请求参数
 * @returns {Promise}
 */
const callCloudFunction = (name, data = {}) => {
  return new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: name,
      data: data,
      success: (res) => {
        if (res.result.code === 0) {
          resolve(res.result.data)
        } else {
          wx.showToast({
            title: res.result.msg || '请求失败',
            icon: 'none'
          })
          reject(res.result)
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '网络异常，请稍后重试',
          icon: 'none'
        })
        reject(err)
      }
    })
  })
}

/**
 * 获取车辆列表
 * @param {Object} params 查询参数
 * @returns {Promise}
 */
export const getCarList = (params) => {
  wx.showLoading({ title: '查询中...' })
  
  // 转换参数格式
  const cloudParams = {
    q: params.keyword || '',
    brand: params.brand || '',
    min_year: params.min_year || '',
    max_year: params.max_year || '',
    page: params.page || 1,
    page_size: params.page_size || 10
  }
  
  return callCloudFunction('getCarList', cloudParams)
    .finally(() => {
      wx.hideLoading()
    })
}

/**
 * 获取车辆详情
 * @param {String} carId 车辆ID
 * @returns {Promise}
 */
export const getCarDetail = (carId) => {
  wx.showLoading({ title: '加载中...' })
  return callCloudFunction('getCarDetail', { carId })
    .finally(() => {
      wx.hideLoading()
    })
}

/**
 * 微信登录
 * @returns {Promise}
 */
export const wxLogin = () => {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (res) => {
        if (res.code) {
          callCloudFunction('wxLogin', { code: res.code })
            .then((data) => {
              // 保存用户信息
              wx.setStorageSync('userInfo', data)
              resolve(data)
            })
            .catch(reject)
        } else {
          reject(new Error('登录失败'))
        }
      },
      fail: reject
    })
  })
}

/**
 * 初始化数据库
 * @returns {Promise}
 */
export const initDatabase = () => {
  return callCloudFunction('initDatabase')
}

export default {
  getCarList,
  getCarDetail,
  wxLogin,
  initDatabase
}
