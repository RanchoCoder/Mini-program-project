# ngrok 内网穿透配置指南

## 📥 步骤1：下载 ngrok

### 方法A：手动下载（推荐）
1. 访问：https://ngrok.com/download
2. 下载 Windows 版本（64位）
3. 解压到 `C:\ngrok\` 文件夹

### 方法B：使用PowerShell下载
```powershell
# 创建目录
mkdir C:\ngrok

# 下载（如果上面的方法失败，请使用手动下载）
Invoke-WebRequest -Uri "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip" -OutFile "$env:TEMP\ngrok.zip"
Expand-Archive -Path "$env:TEMP\ngrok.zip" -DestinationPath "C:\ngrok"
```

---

## 🔑 步骤2：注册并获取 Authtoken

1. 访问：https://dashboard.ngrok.com/signup
2. 使用邮箱注册账号
3. 登录后进入：https://dashboard.ngrok.com/get-started/your-authtoken
4. 复制你的 authtoken（格式如：`2K9x...`）

---

## ⚙️ 步骤3：配置 ngrok

在服务器上打开 PowerShell，运行：

```powershell
cd C:\ngrok
.\ngrok.exe config add-authtoken 你的authtoken
```

---

## 🚀 步骤4：启动 ngrok

### 方法1：直接运行
```powershell
cd C:\ngrok
.\ngrok.exe http 5000
```

### 方法2：创建启动脚本
创建一个文件 `C:\ngrok\start.bat`，内容：
```batch
@echo off
cd C:\ngrok
ngrok.exe http 5000
pause
```

然后双击运行 `start.bat`

---

## 🌐 步骤5：获取公网地址

启动后，你会看到类似这样的输出：

```
Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123-def.ngrok.io -> http://localhost:5000
```

**重要**：复制 `Forwarding` 后面的 HTTPS 地址，例如：
```
https://abc123-def.ngrok.io
```

---

## 📱 步骤6：配置微信小程序

1. 登录微信小程序后台：https://mp.weixin.qq.com
2. 进入：开发管理 → 开发设置 → 服务器域名
3. 点击"修改"
4. 在 **request合法域名** 中添加：
   ```
   https://abc123-def.ngrok.io
   ```
   （替换为你实际的 ngrok 地址）
5. 保存

---

## 📝 步骤7：更新小程序代码

修改 `miniprogram/config.js`：

```javascript
module.exports = {
  // 使用 ngrok 提供的 HTTPS 地址
  API_BASE: 'https://abc123-def.ngrok.io',
  // ... 其他配置
}
```

---

## ⚠️ 重要提示

### 免费版限制：
- ✅ 随机域名（每次重启都会变化）
- ✅ 每月 40 个连接/分钟
- ❌ 域名不固定（每次重启会变）

### 解决方案：
1. **开发测试**：使用免费版，每次重启后更新域名
2. **长期稳定**：购买 ngrok 付费版（约 $5/月），获得固定域名
3. **正式环境**：申请正式域名 + 备案

---

## 🔧 常见问题

### Q1: ngrok 启动后无法访问？
- 确保 Flask 服务已启动（python app.py）
- 确保阿里云安全组已开放 5000 端口
- 检查 ngrok 状态是否为 "online"

### Q2: 微信小程序提示域名不合法？
- 确保使用 **https://** 开头的地址
- 确保域名已添加到 request 合法域名
- 等待 5 分钟后重试（配置有缓存）

### Q3: ngrok 域名每次都变？
- 免费版就是这样，正常行为
- 如需固定域名，购买 ngrok 付费版
- 或申请正式域名

---

## 💡 替代方案

如果 ngrok 不方便，还可以使用：

1. **花生壳**（国内）：https://hsk.oray.com/
2. **cpolar**：https://cpolar.com/
3. **natapp**：https://natapp.cn/

这些工具使用方式类似，都是创建内网穿透获得公网域名。

---

## ✅ 完成！

配置完成后，您的小程序就可以通过 ngrok 提供的 HTTPS 域名访问您的服务器API了！

**测试地址**：`https://你的ngrok域名/api/cars`