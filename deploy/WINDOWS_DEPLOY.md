# Windows服务器部署指南

## 📋 服务器信息
- **IP地址**: 8.136.42.59
- **操作系统**: Windows Server
- **区域**: 华东1(杭州)

## 🚀 快速部署步骤

### 方法一：直接运行（最简单）

1. **在您的服务器上，打开PowerShell（管理员）**

2. **进入部署目录**
```powershell
cd C:\Users\Administrator\Desktop\used_car_search\deploy
```

3. **运行启动脚本**
```powershell
.\start-server.bat
```

4. **测试访问**
打开浏览器访问：
- http://8.136.42.59:5000/ - 首页
- http://8.136.42.59:5000/api/cars - 车辆列表API

---

### 方法二：使用PowerShell脚本部署（推荐）

1. **以管理员身份运行PowerShell**

2. **执行部署脚本**
```powershell
cd C:\Users\Administrator\Desktop\used_car_search\deploy
.\deploy-windows.ps1 -Domain "your-domain.com" -Email "admin@your-domain.com"
```

3. **脚本会自动完成以下操作**：
   - ✅ 安装Python（如未安装）
   - ✅ 安装必要的Python包
   - ✅ 创建项目目录
   - ✅ 复制项目文件
   - ✅ 初始化数据库
   - ✅ 创建Windows服务
   - ✅ 配置防火墙规则
   - ✅ 启动服务

---

### 方法三：手动部署

#### 步骤1：安装Python

1. 下载Python 3.11：https://www.python.org/downloads/
2. 安装时勾选 **"Add Python to PATH"**
3. 验证安装：
```powershell
python --version
```

#### 步骤2：安装依赖

```powershell
pip install flask requests gunicorn waitress pymysql flask-cors
```

#### 步骤3：复制项目文件

```powershell
# 创建项目目录
mkdir C:\Apps\used_car_search
mkdir C:\Apps\Logs\used_car_search

# 复制文件
xcopy /Y /E "C:\Users\Administrator\Desktop\used_car_search\backend\*" "C:\Apps\used_car_search\"
```

#### 步骤4：启动服务

```powershell
cd C:\Apps\used_car_search
python app.py
```

---

## 🔧 配置说明

### 1. 环境变量配置

编辑 `C:\Apps\used_car_search\.env` 文件：

```env
# Flask配置
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=your-secret-key-here

# 微信小程序配置
WX_APPID=wxd18848e6830ff127
WX_SECRET=bfa1fb0d3bdb681d8be3c6b085ac5443

# 数据库配置
DATABASE_TYPE=sqlite
DATABASE_PATH=C:\Apps\used_car_search\cars.db
```

### 2. 阿里云安全组配置

在阿里云控制台配置安全组规则：

| 类型 | 端口范围 | 授权对象 | 说明 |
|------|---------|---------|------|
| 自定义TCP | 5000 | 0.0.0.0/0 | Flask API端口 |
| HTTP | 80 | 0.0.0.0/0 | HTTP访问 |
| HTTPS | 443 | 0.0.0.0/0 | HTTPS访问 |

### 3. 域名配置（可选）

如果有域名，在阿里云DNS解析中添加A记录：
- 主机记录：@ 或 www
- 记录值：8.136.42.59

---

## 📊 服务管理

### 查看服务状态
```powershell
# 如果使用Windows服务
Get-Service UsedCarAPI

# 查看进程
Get-Process python
```

### 重启服务
```powershell
# 重启Windows服务
Restart-Service UsedCarAPI

# 或者直接停止Python进程后重新运行
Stop-Process -Name python -Force
python app.py
```

### 查看日志
```powershell
# 查看应用日志
type C:\Apps\Logs\used_car_search\app.log

# 实时查看日志
Get-Content C:\Apps\Logs\used_car_search\app.log -Wait
```

---

## 🌐 访问地址

部署完成后，可以通过以下地址访问：

- **首页**: http://8.136.42.59:5000/
- **API文档**: http://8.136.42.59:5000/
- **车辆列表**: http://8.136.42.59:5000/api/cars
- **健康检查**: http://8.136.42.59:5000/health

---

## 🔒 安全配置

### 1. 修改默认密码
登录服务器后，立即修改Administrator密码。

### 2. 配置Windows防火墙
```powershell
# 开放5000端口
New-NetFirewallRule -DisplayName "UsedCarAPI" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
```

### 3. 禁用不必要的端口
在阿里云安全组中，只开放必要的端口（5000, 80, 443, 3389）。

---

## 🆘 常见问题

### 1. 端口被占用
```powershell
# 查看5000端口占用情况
netstat -ano | findstr :5000

# 结束占用进程
taskkill /PID <进程ID> /F
```

### 2. Python命令找不到
确保Python已添加到系统PATH，或直接使用：
```powershell
C:\Users\Administrator\AppData\Local\Programs\Python\Python311\python.exe app.py
```

### 3. 防火墙阻止访问
```powershell
# 临时关闭防火墙（仅用于测试）
netsh advfirewall set allprofiles state off

# 测试完成后重新开启
netsh advfirewall set allprofiles state on
```

### 4. 无法从外部访问
1. 检查阿里云安全组规则
2. 检查Windows防火墙规则
3. 确认Flask监听的是 `0.0.0.0` 而不是 `127.0.0.1`

---

## 📞 下一步

1. **测试API**: 在浏览器中访问 http://8.136.42.59:5000/api/cars
2. **配置小程序**: 在微信小程序后台添加服务器域名
3. **配置SSL**: 如需HTTPS，可申请SSL证书
4. **配置域名**: 将域名解析到 8.136.42.59

需要我帮您完成其中哪一步？