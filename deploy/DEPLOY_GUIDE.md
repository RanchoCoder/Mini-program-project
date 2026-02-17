# 二手车搜索系统 - 生产环境部署指南

## 📋 部署前准备

### 1. 阿里云服务器要求
- **操作系统**: Ubuntu 20.04/22.04 LTS 或 CentOS 7/8
- **配置**: 至少 2核4G 内存
- **带宽**: 建议 5Mbps 以上
- **存储**: 至少 40GB SSD

### 2. 域名准备
- 注册一个域名（如：your-domain.com）
- 在阿里云控制台添加A记录指向服务器IP
- 等待DNS解析生效（通常10-30分钟）

### 3. 安全组配置
在阿里云控制台配置安全组规则：
- 开放 80 端口（HTTP）
- 开放 443 端口（HTTPS）
- 开放 22 端口（SSH，建议限制IP）

---

## 🚀 部署方式一：自动化脚本部署（推荐）

### 步骤1：上传代码到服务器

```bash
# 在本地打包项目
cd used_car_search
tar -czf deploy.tar.gz backend/ miniprogram/ deploy/

# 上传到服务器（替换为你的服务器IP）
scp deploy.tar.gz root@your-server-ip:/root/
```

### 步骤2：在服务器上执行部署

```bash
# 登录服务器
ssh root@your-server-ip

# 解压项目
tar -xzf deploy.tar.gz
cd used_car_search

# 编辑环境变量
vim deploy/.env
# 修改以下配置：
# - DOMAIN=your-domain.com
# - WX_APPID=你的小程序AppID
# - WX_SECRET=你的小程序AppSecret
# - MYSQL_ROOT_PASSWORD=强密码
# - MYSQL_PASSWORD=强密码

# 执行部署脚本
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

### 步骤3：配置SSL证书

```bash
# 替换为你的域名和邮箱
./deploy/setup-ssl.sh your-domain.com admin@your-domain.com
```

---

## 🐳 部署方式二：Docker部署

### 步骤1：安装Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh
systemctl enable docker
systemctl start docker

# 安装Docker Compose
pip3 install docker-compose
```

### 步骤2：配置环境变量

```bash
cd used_car_search/deploy

# 复制环境变量模板
cp .env.example .env

# 编辑配置
vim .env
```

### 步骤3：启动服务

```bash
# 构建并启动
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止服务
docker-compose down
```

---

## ⚙️ 阿里云RDS数据库配置（可选）

如果使用阿里云RDS MySQL数据库：

### 1. 创建RDS实例
- 在阿里云控制台创建MySQL 8.0实例
- 创建数据库：used_car_db
- 创建用户：used_car_user

### 2. 配置白名单
在RDS控制台添加服务器IP到白名单

### 3. 修改环境变量

```bash
# 编辑 .env 文件
MYSQL_HOST=your-rds-endpoint.mysql.rds.aliyuncs.com
MYSQL_PORT=3306
MYSQL_USER=used_car_user
MYSQL_PASSWORD=your-password
MYSQL_DATABASE=used_car_db
```

---

## 🔧 生产环境配置

### 1. 微信小程序配置

登录[微信公众平台](https://mp.weixin.qq.com/)：

1. **开发管理** → **开发设置**
   - 添加服务器域名：
     - request合法域名: `https://your-domain.com`
     - uploadFile合法域名: `https://your-domain.com`
     - downloadFile合法域名: `https://your-domain.com`

2. **业务域名**（如果使用web-view）
   - 添加：`https://your-domain.com`

### 2. 更新小程序代码

修改 `miniprogram/config.js`：

```javascript
module.exports = {
  API_BASE: 'https://your-domain.com',  // 替换为你的域名
  // ... 其他配置
}
```

### 3. 安全配置

```bash
# 修改默认密码
passwd

# 配置防火墙
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 'Nginx Full'
ufw enable

# 禁用root远程登录
vim /etc/ssh/sshd_config
# 修改：PermitRootLogin no
systemctl restart sshd
```

---

## 📊 监控与维护

### 查看日志

```bash
# 应用日志
tail -f /var/log/used_car_search/app.log

# Nginx日志
tail -f /var/log/nginx/access.log

# 错误日志
tail -f /var/log/used_car_search/app_error.log
```

### 服务管理

```bash
# 重启API服务
supervisorctl restart used-car-api

# 查看服务状态
supervisorctl status

# 重启Nginx
systemctl restart nginx

# 查看资源使用
htop
df -h
```

### 数据库备份

```bash
# 创建备份脚本
vim /opt/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# 备份数据库
mysqldump -h localhost -u root -p'your-password' used_car_db > "$BACKUP_DIR/backup_$DATE.sql"

# 保留最近7天的备份
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

```bash
# 添加定时任务
crontab -e
# 添加：0 3 * * * /opt/backup.sh
```

---

## 🆘 常见问题

### 1. 无法连接到数据库

```bash
# 检查MySQL服务
systemctl status mysql

# 检查连接
mysql -u root -p -e "SHOW DATABASES;"

# 检查防火墙
ufw status
```

### 2. API返回500错误

```bash
# 查看详细错误
tail -f /var/log/used_car_search/app_error.log

# 检查数据库表是否存在
mysql -u root -p used_car_db -e "SHOW TABLES;"
```

### 3. SSL证书过期

```bash
# 手动续期
certbot renew

# 强制续期
certbot renew --force-renewal

# 重启Nginx
systemctl restart nginx
```

### 4. 小程序无法访问

- 检查域名是否已备案（国内服务器需要）
- 检查小程序后台服务器域名配置
- 检查HTTPS证书是否有效
- 检查CORS配置

---

## 📞 技术支持

如有问题，请检查：
1. 服务器日志：`/var/log/used_car_search/`
2. Nginx日志：`/var/log/nginx/`
3. 系统日志：`journalctl -xe`

---

## ✅ 部署检查清单

- [ ] 服务器配置满足要求
- [ ] 域名已解析到服务器IP
- [ ] 安全组已开放80/443端口
- [ ] 环境变量已正确配置
- [ ] 微信小程序服务器域名已配置
- [ ] SSL证书已安装
- [ ] 数据库已初始化
- [ ] 服务已启动并运行正常
- [ ] 健康检查接口返回正常
- [ ] 小程序可以正常访问API