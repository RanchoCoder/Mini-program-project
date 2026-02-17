"""
项目配置文件
支持开发环境和生产环境
"""
import os

# 环境变量，默认为开发环境
ENV = os.getenv('FLASK_ENV', 'development')

# 基础配置
class Config:
    """基础配置类"""
    SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')
    DEBUG = False
    
    # 微信小程序配置
    WX_APPID = os.getenv('WX_APPID', 'wxd18848e6830ff127')
    WX_SECRET = os.getenv('WX_SECRET', 'bfa1fb0d3bdb681d8be3c6b085ac5443')
    WX_LOGIN_URL = "https://api.weixin.qq.com/sns/jscode2session"
    
    # CORS配置
    CORS_ORIGINS = os.getenv('CORS_ORIGINS', '*').split(',')


class DevelopmentConfig(Config):
    """开发环境配置"""
    DEBUG = True
    # SQLite本地数据库
    DATABASE_TYPE = 'sqlite'
    DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'cars.db')


class ProductionConfig(Config):
    """生产环境配置"""
    DEBUG = False
    
    # MySQL数据库配置（阿里云RDS）
    DATABASE_TYPE = 'mysql'
    MYSQL_HOST = os.getenv('MYSQL_HOST', 'your-rds-endpoint.mysql.rds.aliyuncs.com')
    MYSQL_PORT = int(os.getenv('MYSQL_PORT', '3306'))
    MYSQL_USER = os.getenv('MYSQL_USER', 'your_db_user')
    MYSQL_PASSWORD = os.getenv('MYSQL_PASSWORD', 'your_db_password')
    MYSQL_DATABASE = os.getenv('MYSQL_DATABASE', 'used_car_db')
    
    # 连接池配置
    MYSQL_POOL_SIZE = int(os.getenv('MYSQL_POOL_SIZE', '10'))
    MYSQL_POOL_TIMEOUT = int(os.getenv('MYSQL_POOL_TIMEOUT', '30'))
    
    # 安全配置
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    PERMANENT_SESSION_LIFETIME = 3600  # 1小时


# 配置映射
config_map = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}

# 获取当前配置
def get_config():
    return config_map.get(ENV, DevelopmentConfig)()

# 全局配置对象
config = get_config()