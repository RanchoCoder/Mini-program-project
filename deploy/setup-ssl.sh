#!/bin/bash
# SSL证书配置脚本
# 使用Let's Encrypt免费证书

set -e

DOMAIN=$1
EMAIL=$2

if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
    echo "用法: $0 <域名> <邮箱>"
    echo "示例: $0 api.yourdomain.com admin@yourdomain.com"
    exit 1
fi

echo "========================================"
echo "配置SSL证书 for $DOMAIN"
echo "========================================"

# 安装Certbot
if ! command -v certbot &> /dev/null; then
    echo "安装Certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# 申请证书
echo "申请SSL证书..."
certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email $EMAIL

# 设置自动续期
echo "配置自动续期..."
(crontab -l 2>/dev/null; echo "0 2 * * * certbot renew --quiet") | crontab -

# 测试续期
echo "测试证书续期..."
certbot renew --dry-run

echo "========================================"
echo "SSL证书配置完成！"
echo "域名: $DOMAIN"
echo "证书路径: /etc/letsencrypt/live/$DOMAIN/"
echo "自动续期: 已启用"
echo "========================================"