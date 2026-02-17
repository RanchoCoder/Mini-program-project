// 云函数：初始化数据库
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

const db = cloud.database()

// 示例车辆数据
const CAR_DATA = [
  {
    make: 'Toyota',
    model: 'Corolla',
    year: 2015,
    price: 60000,
    mileage: 50000,
    title: '丰田 卡罗拉 2015年 自动挡 保养良好',
    description: '保养良好，无事故，自动挡，省油',
    createTime: db.serverDate()
  },
  {
    make: 'Honda',
    model: 'Civic',
    year: 2016,
    price: 70000,
    mileage: 60000,
    title: '本田 思域 2016年 手自一体',
    description: '车况优良，原厂漆，定期保养',
    createTime: db.serverDate()
  },
  {
    make: 'Volkswagen',
    model: 'Golf',
    year: 2014,
    price: 50000,
    mileage: 90000,
    title: '大众 高尔夫 2014年',
    description: '家用车，舒适，手动挡',
    createTime: db.serverDate()
  },
  {
    make: 'BMW',
    model: '320',
    year: 2017,
    price: 180000,
    mileage: 40000,
    title: '宝马 320 2017年 豪华型',
    description: '单主要车，内饰完整，动力好',
    createTime: db.serverDate()
  },
  {
    make: 'Audi',
    model: 'A4',
    year: 2018,
    price: 200000,
    mileage: 30000,
    title: '奥迪 A4 2018年 低里程',
    description: '保养记录齐全，无事故',
    createTime: db.serverDate()
  },
  {
    make: 'Toyota',
    model: 'Camry',
    year: 2013,
    price: 80000,
    mileage: 120000,
    title: '丰田 凯美瑞 2013年 舒适家用',
    description: '车况稳定，适合家庭使用',
    createTime: db.serverDate()
  },
  {
    make: 'Nissan',
    model: 'Teana',
    year: 2015,
    price: 65000,
    mileage: 80000,
    title: '日产 天籁 2015年 舒适版',
    description: '空间大，乘坐舒适',
    createTime: db.serverDate()
  },
  {
    make: 'Ford',
    model: 'Focus',
    year: 2012,
    price: 30000,
    mileage: 150000,
    title: '福特 福克斯 2012年 经济型',
    description: '省油，维护简单',
    createTime: db.serverDate()
  },
  {
    make: 'Chevrolet',
    model: 'Cruze',
    year: 2014,
    price: 35000,
    mileage: 110000,
    title: '雪佛兰 科鲁兹 2014年',
    description: '性价比高，适合通勤',
    createTime: db.serverDate()
  },
  {
    make: 'Hyundai',
    model: 'Elantra',
    year: 2016,
    price: 40000,
    mileage: 70000,
    title: '现代 伊兰特 2016年',
    description: '行驶平顺，保养良好',
    createTime: db.serverDate()
  }
]

exports.main = async (event, context) => {
  try {
    // 清空现有数据
    const carsCollection = db.collection('cars')
    const existingCars = await carsCollection.get()
    
    // 删除现有数据
    for (const car of existingCars.data) {
      await carsCollection.doc(car._id).remove()
    }
    
    // 插入新数据
    for (const car of CAR_DATA) {
      await carsCollection.add({
        data: car
      })
    }
    
    return {
      code: 0,
      msg: '数据库初始化成功',
      data: {
        count: CAR_DATA.length
      }
    }
  } catch (err) {
    console.error('初始化失败:', err)
    return {
      code: -1,
      msg: '初始化失败：' + err.message
    }
  }
}
