# 二手车查询系统（后端 + 小程序前端）

## 项目概述
完整的二手车查询系统，包含 Flask 后端 API 和微信小程序前端。支持关键词搜索、高级筛选、分页加载、防抖搜索等功能。

## 新特性
- ✅ 后端输入验证（年份、分页参数安全限制）
- ✅ 数据库路径统一（backend/cars.db）
- ✅ 前端配置化（环境变量支持）
- ✅ 实时搜索防抖（300ms延迟）
- ✅ 高级筛选（品牌、年份范围）
- ✅ 分页加载（触底加载更多）
- ✅ 下拉刷新
- ✅ 响应式UI设计
- ✅ 微信登录系统（支持真实登录和模拟登录）
- ✅ 模糊搜索（支持多字段模糊匹配）
- ✅ 用户信息管理（头像、昵称）

## 快速启动

### 1. 环境配置
```powershell
# 创建虚拟环境
python -m venv venv

# 激活虚拟环境（Windows PowerShell）
.\venv\Scripts\Activate.ps1

# 安装依赖
pip install -r backend\requirements.txt
```

### 2. 数据库初始化
```powershell
python backend\init_db.py
```
> 数据库文件将创建在 `backend/cars.db`

### 3. 启动后端服务
```powershell
python backend\app.py
```
服务地址：`http://127.0.0.1:5000`

### 4. 小程序前端配置
1. 将 `miniprogram` 目录内容复制到你的小程序项目
2. 在 `app.json` 中注册页面（已配置）：
```json
"pages": [
  "pages/search/search"
]
```
3. 修改配置文件 `miniprogram/config.js`：
```javascript
// 开发环境
API_BASE: 'http://127.0.0.1:5000'

// 生产环境（真机调试需要HTTPS）
// API_BASE: 'https://your-domain.com'
```
4. 微信登录配置：
   - 如需真实微信登录，设置环境变量 `WX_APPSECRET`
   - 不设置则使用模拟登录（开发测试用）
5. 在微信开发者工具中导入项目，使用AppID: `wxd18848e6830ff127`

## 配置说明

### 后端配置 (`backend/app.py`)
- 端口：5000（可修改第64行）
- 数据库路径：`backend/cars.db`
- 分页限制：每页最大100条
- 年份验证：1900-当前年份+1

### 前端配置 (`miniprogram/config.js`)
```javascript
const config = {
  API_BASE: 'http://127.0.0.1:5000',  // API地址
  PAGE_SIZE: 20,                       // 每页条数
  DEBOUNCE_DELAY: 300,                 // 防抖延迟(ms)
  BRANDS: ['Toyota', 'Honda', ...],    // 品牌列表
  MIN_YEAR: 2000,                      // 最小年份
  MAX_YEAR: 2026                       // 最大年份
}
```

## API接口说明

### 搜索接口
```
GET /api/search
```

#### 请求参数
| 参数 | 类型 | 说明 | 默认值 |
|------|------|------|--------|
| q | string | 搜索关键词（品牌/车型/描述） | 空 |
| brand | string | 品牌筛选 | 空 |
| min_year | integer | 最小年份 | 空 |
| max_year | integer | 最大年份 | 空 |
| page | integer | 页码（≥1） | 1 |
| page_size | integer | 每页数量（1-100） | 20 |

#### 响应示例
```json
{
  "total": 45,
  "page": 1,
  "page_size": 20,
  "pages": 3,
  "data": [
    {
      "id": 1,
      "make": "Toyota",
      "model": "Corolla",
      "year": 2015,
      "price": 60000,
      "mileage": 50000,
      "title": "丰田 卡罗拉 2015年 自动挡 保养良好",
      "description": "保养良好，无事故，自动挡，省油"
    }
  ]
}
```

### 登录接口
```
POST /api/login
```
#### 请求参数
| 参数 | 类型 | 说明 | 必填 |
|------|------|------|------|
| code | string | 微信登录code | 是 |

#### 响应示例
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "openid": "o6_bmjrPTlm6_2sgVt7hMZOPfL2M",
  "userInfo": {
    "openid": "o6_bmjrPTlm6_2sgVt7hMZOPfL2M",
    "nickname": "微信用户",
    "avatarUrl": "https://thirdwx.qlogo.cn/..."
  },
  "expires_at": 1740787200
}
```

### 用户信息接口
```
GET /api/user/info
```
#### 请求参数
| 参数 | 类型 | 说明 | 必填 |
|------|------|------|------|
| token | string | 登录token | 是 |

### 更新用户信息接口
```
POST /api/user/profile
```
#### 请求参数
| 参数 | 类型 | 说明 | 必填 |
|------|------|------|------|
| token | string | 登录token | 是 |
| nickname | string | 用户昵称 | 否 |
| avatarUrl | string | 用户头像URL | 否 |

## 前端功能

### 搜索功能
- 实时搜索（防抖300ms）
- 关键词高亮显示
- 清空搜索按钮

### 高级筛选
- 品牌选择（下拉菜单）
- 年份范围筛选
- 重置筛选功能

### 分页加载
- 触底自动加载更多
- 手动加载更多按钮
- 下拉刷新数据
- 页码显示

### 数据展示
- 卡片式布局
- 价格高亮显示
- 完整车辆信息
- 空状态提示

### 微信登录功能
- 自动登录（启动时检查登录状态）
- 用户信息显示（头像、昵称）
- 登录/退出功能
- 支持模拟登录（开发测试）
- 支持真实微信登录（配置WX_APPSECRET）

## 调试说明

### 本地开发
1. 后端运行在 `http://127.0.0.1:5000`
2. 小程序开发者工具设置：
   - 关闭域名校验
   - 开启开发环境不校验请求域名

### 真机调试
1. 后端需要部署到服务器
2. 修改 `config.js` 中的 `API_BASE` 为服务器地址
3. 确保HTTPS证书有效（小程序要求）
4. 配置服务器跨域（CORS）

### 常见问题
1. **跨域问题**：后端已配置CORS，确保Flask-CORS已安装
2. **数据库路径**：确认 `backend/cars.db` 文件存在
3. **端口占用**：修改 `app.py` 第64行端口号
4. **小程序网络请求失败**：检查开发者工具中的域名白名单

## 数据示例
系统预置10条二手车数据，包含丰田、本田、大众、宝马、奥迪等品牌，年份范围2012-2018年。

## 更新日志
- 2025-02-16: 重构项目，添加高级筛选、防抖搜索、分页加载
- 2025-02-16: 修复安全漏洞，添加输入验证
- 2025-02-16: 统一配置管理，优化UI设计