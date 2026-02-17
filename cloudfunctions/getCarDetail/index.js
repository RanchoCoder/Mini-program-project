// 云函数：获取车辆详情
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

exports.main = async (event, context) => {
  const { carId } = event

  if (!carId) {
    return {
      code: -1,
      msg: '缺少车辆ID参数'
    }
  }

  try {
    const carResult = await db.collection('cars')
      .doc(carId)
      .get()

    if (carResult.data) {
      return {
        code: 0,
        msg: '查询成功',
        data: carResult.data
      }
    } else {
      return {
        code: -1,
        msg: '车辆不存在'
      }
    }
  } catch (err) {
    console.error('查询失败:', err)
    return {
      code: -1,
      msg: '查询失败：' + err.message
    }
  }
}
