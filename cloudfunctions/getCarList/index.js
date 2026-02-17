// 云函数：获取车辆列表
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()
const _ = db.command

exports.main = async (event, context) => {
  const { 
    q = '',           // 搜索关键词
    brand = '',       // 品牌筛选
    min_year = '',    // 最小年份
    max_year = '',    // 最大年份
    page = 1,         // 当前页
    page_size = 10    // 每页条数
  } = event

  try {
    // 构建查询条件
    let whereCondition = {}
    
    // 1. 模糊搜索
    if (q) {
      whereCondition = _.or([
        { title: db.RegExp({ regexp: q, options: 'i' }) },
        { make: db.RegExp({ regexp: q, options: 'i' }) },
        { model: db.RegExp({ regexp: q, options: 'i' }) }
      ])
    }
    
    // 2. 品牌筛选
    if (brand) {
      whereCondition.make = brand
    }
    
    // 3. 年份筛选
    if (min_year || max_year) {
      whereCondition.year = {}
      if (min_year) whereCondition.year = _.gte(parseInt(min_year))
      if (max_year) whereCondition.year = _.lte(parseInt(max_year))
    }

    // 获取总数
    const countResult = await db.collection('cars')
      .where(whereCondition)
      .count()
    
    const total = countResult.total

    // 分页查询
    const carsResult = await db.collection('cars')
      .where(whereCondition)
      .skip((page - 1) * page_size)
      .limit(page_size)
      .orderBy('_id', 'asc')
      .get()

    return {
      code: 0,
      msg: '查询成功',
      data: {
        list: carsResult.data,
        total: total,
        page: page,
        page_size: page_size
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
