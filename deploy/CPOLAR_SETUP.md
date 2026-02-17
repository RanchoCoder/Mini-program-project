# cpolar 配置指南 - 阿里云服务器 + 固定域名

## 🎯 为什么选择 cpolar？

- ✅ **国内服务**：比 ngrok 更稳定
- ✅ **免费固定域名**：免费版提供1个固定域名
- ✅ **支持 HTTPS**：微信小程序需要
- ✅ **简单易用**：一行命令启动

---

## 📥 步骤1：注册 cpolar 账号

1. 访问：https://www.cpolar.com/
2. 点击 **"免费注册"**
3. 使用邮箱注册账号
4. 登录后进入控制台

---

## 📥 步骤2：下载安装 cpolar

### 在您的阿里云服务器上操作：

**方法A：浏览器下载**
1. 在服务器上打开浏览器
2. 访问：https://www.cpolar.com/download
3. 下载 Windows 版本
4. 解压到 `C:\cpolar\`

**方法B：命令行下载**
```powershell
# 创建目录
mkdir C:\cpolar

# 下载（在服务器浏览器中访问下载链接）
# 或者手动下载后上传到服务器
```

---

## 🔑 步骤3：获取 Authtoken

1. 登录 cpolar 官网：https://dashboard.cpolar.com/
2. 点击左侧 **"验证"**
3. 复制您的 **authtoken**（格式如：`xxxxx...`）

---

## ⚙️ 步骤4：配置 cpolar

在服务器上打开 PowerShell，运行：

```powershell
cd C:\cpolar
.\cpolar.exe authtoken 你的authtoken
```

---

## 🚀 步骤5：创建固定域名隧道

### 5.1 在 cpolar 官网创建隧道

1. 登录 https://dashboard.cpolar.com/
2. 点击 **"隧道管理"** → **"创建隧道"**
3. 填写信息：
   - **隧道名称**：used-car-api
   - **协议**：http
   - **本地地址**：localhost:5000
   - **域名类型**：免费域名（会分配一个固定域名）
   - **地区**：China Top（或选择最近的）

4. 点击 **"创建"**

### 5.2 获取您的固定域名

创建成功后，您会获得一个固定域名，例如：
```
https://abc123.cpolar.io
```

**这个域名是固定的，重启后不会变化！**

---

## 🚀 步骤6：启动 cpolar

在服务器上运行：

```powershell
cd C:\cpolar
.\cpolar.exe start used-car-api
```

或者启动所有隧道：
```powershell
.\cpolar.exe start-all
```

---

## ✅ 步骤7：验证访问

在浏览器中访问：
```
https://你的域名.cpolar.io/api/cars
```

例如：
```
https://abc123.cpolar.io/api/cars
```

应该能看到车辆列表数据！

---

## 📱 步骤8：配置微信小程序

1. 登录微信小程序后台
2. 进入 **开发管理** → **开发设置** → **服务器域名**
3. 点击 **修改**
4. 在 **request合法域名** 中添加：
   ```
   https://你的域名.cpolar.io
   ```
5. 保存

---

## 📝 步骤9：更新小程序代码

修改 `miniprogram/config.js`：

```javascript
module.exports = {
  API_BASE: 'https://你的域名.cpolar.io',  // 替换为实际域名
  // ... 其他配置
}
```

---

## 🔄 设置开机自启（可选）

创建开机启动脚本 `C:\cpolar\start.bat`：

```batch
@echo off
cd C:\cpolar
cpolar.exe start-all
```

然后添加到 Windows 启动项：
1. 按 `Win + R`，输入 `shell:startup`
2. 创建快捷方式指向 `C:\cpolar\start.bat`

---

## 📊 cpolar 免费版 vs 付费版

| 功能 | 免费版 | 付费版（约9元/月）|
|------|--------|------------------|
| 固定域名 | ✅ 1个 | ✅ 多个 |
| 带宽 | 1Mbps | 更高 |
| 连接数 | 有限制 | 更多 |
| 在线时长 | 24小时 | 无限制 |

**对于测试和小型项目，免费版足够使用！**

---

## 🆘 常见问题

### Q1: cpolar 启动失败？
- 检查 authtoken 是否正确
- 检查 5000 端口是否被占用
- 查看错误日志：`cpolar.exe logs`

### Q2: 域名无法访问？
- 确保 Flask 服务已启动
- 确保阿里云安全组已开放 5000 端口
- 检查 cpolar 状态：`cpolar.exe status`

### Q3: 微信小程序提示不合法？
- 确保使用 **https://** 开头
- 确保域名已添加到 request 合法域名
- 等待 5 分钟后重试

### Q4: 免费域名会过期吗？
- 只要账号活跃，域名一直有效
- 建议定期登录 cpolar 官网保持活跃

---

## 💡 长期建议

**cpolar 适合：**
- ✅ 快速测试和开发
- ✅ 短期项目
- ✅ 不想备案的情况

**正式项目建议：**
- 购买正式域名（约50元/年）
- 完成域名备案
- 配置阿里云免费SSL证书

---

## ✅ 完成检查清单

- [ ] 注册 cpolar 账号
- [ ] 下载安装 cpolar
- [ ] 配置 authtoken
- [ ] 创建隧道并获取固定域名
- [ ] 启动 cpolar
- [ ] 测试域名访问
- [ ] 配置微信小程序服务器域名
- [ ] 更新小程序代码

完成这些步骤后，您的小程序就可以通过固定域名访问您的阿里云服务器了！
