#!/bin/bash
# 二手车搜索系统 - 自动化部署脚本
# 用于阿里云服务器部署

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 配置变量
PROJECT_NAME="used_car_search"
DEPLOY_DIR="/opt/$PROJECT_NAME"
BACKUP_DIR="/opt/backups/$PROJECT_NAME"
LOG_DIR="/var/log/$PROJECT_NAME"
SERVICE_NAME="used-car-api"
DOMAIN="your-domain.com"  # 替换为你的域名

# 打印信息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查root权限
check_root() {
    if [[ $EUID -ne 0 ]]; then
        print_error "请使用root权限运行此脚本"
        exit 1
    fi
}

# 安装依赖
install_dependencies() {
    print_info "安装系统依赖..."
    apt-get update
    apt-get install -y python3 python3-pip python3-venv nginx supervisor git
    
    # 安装MySQL客户端（如果使用MySQL）
    apt-get install -y mysql-client libmysqlclient-dev
    
    print_info "系统依赖安装完成"
}

# 创建目录结构
create_directories() {
    print_info "创建项目目录..."
    mkdir -p $DEPLOY_DIR
    mkdir -p $BACKUP_DIR
    mkdir -p $LOG_DIR
    print_info "目录创建完成"
}

# 备份现有项目
backup_project() {
    if [ -d "$DEPLOY_DIR" ] && [ "$(ls -A $DEPLOY_DIR)" ]; then
        print_info "备份现有项目..."
        BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S).tar.gz"
        tar -czf "$BACKUP_DIR/$BACKUP_NAME" -C "$DEPLOY_DIR" .
        print_info "备份完成: $BACKUP_NAME"
    fi
}

# 部署项目代码
deploy_code() {
    print_info "部署项目代码..."
    
    # 清理旧代码
    rm -rf $DEPLOY_DIR/*
    
    # 复制新代码
    cp -r ../backend/* $DEPLOY_DIR/
    cp -r ../miniprogram $DEPLOY_DIR/
    
    # 创建虚拟环境
    cd $DEPLOY_DIR
    python3 -m venv venv
    source venv/bin/activate
    
    # 安装Python依赖
    pip install --upgrade pip
    pip install -r requirements.txt
    pip install gunicorn pymysql flask-cors
    
    print_info "代码部署完成"
}

# 配置环境变量
setup_environment() {
    print_info "配置环境变量..."
    
    cat > $DEPLOY_DIR/.env << EOF
# Flask配置
FLASK_ENV=production
FLASK_HOST=0.0.0.0
FLASK_PORT=5000
FLASK_DEBUG=False
SECRET_KEY=$(openssl rand -hex 32)

# 微信小程序配置
WX_APPID=your_wx_appid
WX_SECRET=your_wx_secret

# MySQL数据库配置（阿里云RDS）
MYSQL_HOST=your-rds-endpoint.mysql.rds.aliyuncs.com
MYSQL_PORT=3306
MYSQL_USER=your_db_user
MYSQL_PASSWORD=your_db_password
MYSQL_DATABASE=used_car_db

# CORS配置
CORS_ORIGINS=https://$DOMAIN,http://$DOMAIN
EOF

    chmod 600 $DEPLOY_DIR/.env
    print_info "环境变量配置完成"
}

# 配置Supervisor
setup_supervisor() {
    print_info "配置Supervisor..."
    
    cat > /etc/supervisor/conf.d/$SERVICE_NAME.conf << EOF
[program:$SERVICE_NAME]
directory=$DEPLOY_DIR
command=$DEPLOY_DIR/venv/bin/gunicorn -w 4 -b 127.0.0.1:5000 app_production:app
autostart=true
autorestart=true
user=www-data
group=www-data
stdout_logfile=$LOG_DIR/app.log
stderr_logfile=$LOG_DIR/app_error.log
environment=FLASK_ENV="production"
EOF

    supervisorctl reread
    supervisorctl update
    print_info "Supervisor配置完成"
}

# 配置Nginx
setup_nginx() {
    print_info "配置Nginx..."
    
    cat > /etc/nginx/sites-available/$SERVICE_NAME << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # 日志配置
    access_log $LOG_DIR/nginx_access.log;
    error_log $LOG_DIR/nginx_error.log;
    
    # 静态文件（如果有）
    location /static {
        alias $DEPLOY_DIR/static;
        expires 30d;
    }
    
    # API代理
    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF

    # 启用站点
    ln -sf /etc/nginx/sites-available/$SERVICE_NAME /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # 测试Nginx配置
    nginx -t
    
    # 重启Nginx
    systemctl restart nginx
    print_info "Nginx配置完成"
}

# 配置SSL证书
setup_ssl() {
    print_info "配置SSL证书..."
    
    # 安装Certbot
    apt-get install -y certbot python3-certbot-nginx
    
    # 申请证书
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    
    # 设置自动续期
    (crontab -l 2>/dev/null; echo "0 2 * * * certbot renew --quiet") | crontab -
    
    print_info "SSL证书配置完成"
}

# 配置防火墙
setup_firewall() {
    print_info "配置防火墙..."
    
    # 允许HTTP/HTTPS
    ufw allow 'Nginx Full'
    
    # 允许SSH
    ufw allow OpenSSH
    
    # 启用防火墙
    ufw --force enable
    
    print_info "防火墙配置完成"
}

# 启动服务
start_services() {
    print_info "启动服务..."
    
    # 启动Supervisor管理的应用
    supervisorctl start $SERVICE_NAME
    
    # 确保Nginx运行
    systemctl restart nginx
    
    print_info "服务启动完成"
}

# 健康检查
health_check() {
    print_info "执行健康检查..."
    
    sleep 3
    
    # 检查API服务
    if curl -s http://127.0.0.1:5000/health | grep -q "healthy"; then
        print_info "✅ API服务运行正常"
    else
        print_error "❌ API服务异常"
        exit 1
    fi
    
    # 检查Nginx
    if systemctl is-active --quiet nginx; then
        print_info "✅ Nginx运行正常"
    else
        print_error "❌ Nginx异常"
        exit 1
    fi
    
    print_info "健康检查通过"
}

# 显示部署信息
show_info() {
    echo ""
    echo "========================================"
    echo "      部署完成！"
    echo "========================================"
    echo ""
    echo "项目目录: $DEPLOY_DIR"
    echo "日志目录: $LOG_DIR"
    echo "访问地址: https://$DOMAIN"
    echo "API地址: https://$DOMAIN/api/cars"
    echo ""
    echo "常用命令:"
    echo "  查看日志: tail -f $LOG_DIR/app.log"
    echo "  重启服务: supervisorctl restart $SERVICE_NAME"
    echo "  查看状态: supervisorctl status"
    echo ""
    echo "========================================"
}

# 主函数
main() {
    print_info "开始部署二手车搜索系统..."
    
    check_root
    install_dependencies
    create_directories
    backup_project
    deploy_code
    setup_environment
    setup_supervisor
    setup_nginx
    setup_ssl
    setup_firewall
    start_services
    health_check
    show_info
    
    print_info "部署完成！"
}

# 执行主函数
main "$@"