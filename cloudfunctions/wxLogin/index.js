// 云函数：微信登录
const cloud = require('wx-server-sdk')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event, context) => {
  const { code } = event

  if (!code) {
    return {
      code: -1,
      msg: '缺少code参数'
    }
  }

  try {
    // 调用微信接口获取openid
    const wxContext = cloud.getWXContext()
    
    const openid = wxContext.OPENID
    const unionid = wxContext.UNIONID
    
    // 构造用户信息
    const userInfo = {
      openid: openid,
      unionid: unionid || '',
      nickName: `微信用户_${openid.slice(-4)}`,
      avatarUrl: 'https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0'
    }

    // 保存或更新用户信息到数据库
    const db = cloud.database()
    const userCollection = db.collection('users')
    
    // 检查用户是否已存在
    const userResult = await userCollection.where({
      openid: openid
    }).get()
    
    if (userResult.data.length === 0) {
      // 新用户，添加到数据库
      await userCollection.add({
        data: {
          openid: openid,
          unionid: unionid || '',
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          createTime: db.serverDate(),
          updateTime: db.serverDate()
        }
      })
    } else {
      // 更新用户信息
      await userCollection.doc(userResult.data[0]._id).update({
        data: {
          updateTime: db.serverDate()
        }
      })
    }

    return {
      code: 0,
      msg: '登录成功',
      data: userInfo
    }
  } catch (err) {
    console.error('登录失败:', err)
    return {
      code: -1,
      msg: '登录失败：' + err.message
    }
  }
}
