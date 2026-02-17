# 微信云开发迁移指南

## 🎯 优势

- ✅ **免费额度**：足够小型项目使用
- ✅ **无需服务器**：省去阿里云服务器费用
- ✅ **自动HTTPS**：无需配置SSL证书
- ✅ **自动域名**：无需备案域名
- ✅ **云数据库**：自带MongoDB数据库
- ✅ **云存储**：可存储图片等文件

---

## 📁 已创建的云函数

```
cloudfunctions/
├── getCarList/          # 获取车辆列表
├── getCarDetail/        # 获取车辆详情
├── wxLogin/             # 微信登录
└── initDatabase/        # 初始化数据库
```

---

## 🚀 迁移步骤

### 步骤1：开通微信云开发

1. 登录微信小程序后台：https://mp.weixin.qq.com
2. 点击左侧菜单 **"云开发"**
3. 点击 **"开通"** 按钮
4. 选择 **"免费版"** 或 **"按量付费"**
5. 记录环境ID（如：`used-car-search-xxx`）

---

### 步骤2：配置小程序

修改 `miniprogram/app.js`：

```javascript
App({
  onLaunch: function () {
    // 初始化云开发
    wx.cloud.init({
      env: '你的环境ID',  // 替换为实际的环境ID
      traceUser: true
    })
  }
})
```

---

### 步骤3：上传云函数

#### 方法1：使用微信开发者工具

1. 打开微信开发者工具
2. 在左侧文件树中找到 `cloudfunctions/`
3. 右键点击 `getCarList` → **"创建并部署：云端安装依赖"**
4. 依次部署其他云函数

#### 方法2：批量部署

在开发者工具终端中运行：
```bash
# 部署所有云函数
cloudbase functions:deploy getCarList
cd cloudfunctions/getCarList && npm install --production && cd ../..
cloudbase functions:deploy getCarDetail
cd cloudfunctions/getCarDetail && npm install --production && cd ../..
cloudbase functions:deploy wxLogin
cd cloudfunctions/wxLogin && npm install --production && cd ../..
cloudbase functions:deploy initDatabase
cd cloudfunctions/initDatabase && npm install --production && cd ../..
```

---

### 步骤4：初始化数据库

1. 在开发者工具中打开 **"云开发"** 控制台
2. 点击 **"数据库"** 标签
3. 创建集合 `cars` 和 `users`
4. 或者调用初始化云函数：

```javascript
// 在小程序中调用
wx.cloud.callFunction({
  name: 'initDatabase'
}).then(res => {
  console.log('数据库初始化完成', res)
})
```

---

### 步骤5：修改小程序代码

#### 更新 `miniprogram/config.js`：

```javascript
module.exports = {
  // 使用云开发，不需要配置API_BASE
  USE_CLOUD: true,
  
  // 分页配置
  PAGE_SIZE: 10,
  
  // 品牌列表
  BRANDS: ['全部', '宝马', '奔驰', '大众', '丰田', '本田'],
  
  // 年份范围
  MIN_YEAR: 2010,
  MAX_YEAR: new Date().getFullYear(),
  
  // 防抖延迟
  DEBOUNCE_DELAY: 500
}
```

#### 更新 `miniprogram/utils/request.js`：

修改引用，使用云开发版本：

```javascript
// 原来
import { getCarList, getCarDetail, wxLogin } from './request.js'

// 改为
import { getCarList, getCarDetail, wxLogin } from './cloudRequest.js'
```

---

### 步骤6：配置数据库权限

1. 打开云开发控制台 → 数据库
2. 选择 `cars` 集合
3. 点击 **"权限设置"**
4. 选择 **"所有用户可读，仅创建者可读写"** 或 **"所有用户可读"**

---

## 📝 数据库结构

### cars 集合（车辆信息）

```json
{
  "_id": "自动生成的ID",
  "make": "品牌",
  "model": "车型",
  "year": 2015,
  "price": 60000,
  "mileage": 50000,
  "title": "标题",
  "description": "描述",
  "createTime": "创建时间"
}
```

### users 集合（用户信息）

```json
{
  "_id": "自动生成的ID",
  "openid": "用户openid",
  "unionid": "用户unionid",
  "nickName": "昵称",
  "avatarUrl": "头像",
  "createTime": "创建时间",
  "updateTime": "更新时间"
}
```

---

## 🔧 常见问题

### Q1: 云函数部署失败？
- 确保已安装 Node.js
- 检查云开发环境ID是否正确
- 查看开发者工具控制台错误信息

### Q2: 数据库查询为空？
- 检查是否已初始化数据
- 检查数据库权限设置
- 检查集合名称是否正确

### Q3: 调用云函数报错？
- 检查云函数是否已部署
- 检查参数格式是否正确
- 查看云函数日志

### Q4: 免费额度够用吗？
- 免费版：5GB存储、50万调用次数/月
- 一般小型项目足够使用
- 超出后按量付费，费用较低

---

## 💰 费用对比

| 方案 | 月费用 | 优点 | 缺点 |
|------|--------|------|------|
| **阿里云服务器** | 约50-100元 | 完全控制、可扩展 | 需要维护、需要域名备案 |
| **微信云开发** | 免费/按量 | 免维护、自动HTTPS | 依赖微信生态、有一定限制 |
| **ngrok** | 免费/$5月 | 快速测试 | 域名不固定、不稳定 |

---

## ✅ 完成检查清单

- [ ] 开通微信云开发
- [ ] 记录环境ID
- [ ] 配置小程序 app.js
- [ ] 部署所有云函数
- [ ] 初始化数据库
- [ ] 修改小程序代码
- [ ] 配置数据库权限
- [ ] 测试API调用

---

## 📞 需要帮助？

微信云开发文档：https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html

完成迁移后，您的小程序就可以完全运行在微信云开发环境中，无需再维护服务器！