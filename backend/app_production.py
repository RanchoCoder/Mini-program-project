"""
生产环境Flask应用
支持SQLite（开发）和MySQL（生产）数据库
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import random
import logging
import sqlite3
import os

# 尝试导入MySQL连接库
try:
    import pymysql
    MYSQL_AVAILABLE = True
except ImportError:
    MYSQL_AVAILABLE = False

# 导入配置
from config import config

# 配置日志
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 创建Flask应用
app = Flask(__name__)
app.config.from_object(config)

# 启用CORS
CORS(app, origins=config.CORS_ORIGINS)

# -------------------------- 数据库连接管理 --------------------------

def get_db_connection():
    """获取数据库连接（支持SQLite和MySQL）"""
    if config.DATABASE_TYPE == 'mysql' and MYSQL_AVAILABLE:
        return get_mysql_connection()
    else:
        return get_sqlite_connection()

def get_sqlite_connection():
    """获取SQLite连接"""
    conn = sqlite3.connect(config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def get_mysql_connection():
    """获取MySQL连接"""
    try:
        conn = pymysql.connect(
            host=config.MYSQL_HOST,
            port=config.MYSQL_PORT,
            user=config.MYSQL_USER,
            password=config.MYSQL_PASSWORD,
            database=config.MYSQL_DATABASE,
            charset='utf8mb4',
            cursorclass=pymysql.cursors.DictCursor
        )
        return conn
    except Exception as e:
        logger.error(f"MySQL连接失败: {e}")
        # 回退到SQLite
        logger.info("回退到SQLite数据库")
        return get_sqlite_connection()

def init_mysql_tables():
    """初始化MySQL表结构"""
    if config.DATABASE_TYPE != 'mysql' or not MYSQL_AVAILABLE:
        return
    
    try:
        conn = get_mysql_connection()
        with conn.cursor() as cursor:
            # 创建cars表
            cursor.execute('''
                CREATE TABLE IF NOT EXISTS cars (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    make VARCHAR(100),
                    model VARCHAR(100),
                    year INT,
                    price INT,
                    mileage INT,
                    title VARCHAR(255),
                    description TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
            ''')
            conn.commit()
            logger.info("MySQL表初始化完成")
        conn.close()
    except Exception as e:
        logger.error(f"MySQL表初始化失败: {e}")

# -------------------------- 首页 --------------------------
@app.route("/")
def index():
    """首页 - API文档"""
    return jsonify({
        "message": "二手车搜索API服务",
        "status": "运行中",
        "environment": "production" if not app.debug else "development",
        "database": config.DATABASE_TYPE,
        "apis": {
            "GET /api/cars": "获取车辆列表（支持搜索、筛选、分页）",
            "GET /api/cars/<id>": "获取单个车辆详情",
            "POST /api/wxlogin": "微信登录接口"
        },
        "examples": {
            "获取所有车辆": "/api/cars",
            "搜索车辆": "/api/cars?q=丰田",
            "品牌筛选": "/api/cars?brand=BMW",
            "年份筛选": "/api/cars?min_year=2015&max_year=2020",
            "分页": "/api/cars?page=1&page_size=5",
            "车辆详情": "/api/cars/21"
        }
    })

# -------------------------- 微信登录接口 --------------------------
@app.route("/api/wxlogin", methods=["POST"])
def wx_login():
    """微信登录接口"""
    try:
        code = request.json.get("code")
        if not code:
            return jsonify({"code": -1, "msg": "缺少code参数"})

        params = {
            "appid": config.WX_APPID,
            "secret": config.WX_SECRET,
            "js_code": code,
            "grant_type": "authorization_code",
        }

        response = requests.get(config.WX_LOGIN_URL, params=params, timeout=10)
        res_data = response.json()

        if "errcode" in res_data and res_data["errcode"] != 0:
            return jsonify({"code": -1, "msg": f"微信登录失败：{res_data.get('errmsg')}"})

        real_openid = res_data.get("openid")
        real_session_key = res_data.get("session_key")

        user_info = {
            "openid": real_openid,
            "session_key": real_session_key,
            "nickName": f"微信用户_{real_openid[-4:]}" if real_openid else f"用户{random.randint(1000, 9999)}",
            "avatarUrl": "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0",
        }

        return jsonify({"code": 0, "msg": "登录成功", "data": user_info})
    except Exception as e:
        logger.error(f"登录失败: {e}")
        return jsonify({"code": -1, "msg": f"服务器错误：{str(e)}"})

# -------------------------- 车辆列表接口 --------------------------
@app.route("/api/cars", methods=["GET"])
def get_cars():
    """获取车辆列表"""
    try:
        q = request.args.get("q", "")
        brand = request.args.get("brand", "")
        min_year = request.args.get("min_year", "")
        max_year = request.args.get("max_year", "")
        page = int(request.args.get("page", 1))
        page_size = int(request.args.get("page_size", 10))

        conn = get_db_connection()
        cursor = conn.cursor()

        # 构建SQL查询
        sql = "SELECT * FROM cars WHERE 1=1"
        params = []

        if q:
            sql += " AND (title LIKE %s OR make LIKE %s OR model LIKE %s)"
            params.extend([f'%{q}%', f'%{q}%', f'%{q}%'])

        if brand:
            sql += " AND make = %s"
            params.append(brand)

        if min_year:
            sql += " AND year >= %s"
            params.append(int(min_year))
        if max_year:
            sql += " AND year <= %s"
            params.append(int(max_year))

        # 获取总数
        count_sql = f"SELECT COUNT(*) as count FROM ({sql}) as t"
        cursor.execute(count_sql, params)
        total = cursor.fetchone()['count'] if config.DATABASE_TYPE == 'mysql' else cursor.fetchone()[0]

        # 分页查询
        if config.DATABASE_TYPE == 'mysql':
            sql += " ORDER BY id LIMIT %s OFFSET %s"
        else:
            sql += " ORDER BY id LIMIT ? OFFSET ?"
        params.extend([page_size, (page - 1) * page_size])

        cursor.execute(sql, params)
        rows = cursor.fetchall()

        # 转换为列表
        cars_list = []
        for row in rows:
            if config.DATABASE_TYPE == 'mysql':
                cars_list.append(row)
            else:
                cars_list.append(dict(row))

        conn.close()

        return jsonify({
            "code": 0,
            "msg": "查询成功",
            "data": {
                "list": cars_list,
                "total": total,
                "page": page,
                "page_size": page_size,
            },
        })
    except Exception as e:
        logger.error(f"查询车辆失败: {e}")
        return jsonify({"code": -1, "msg": f"查询失败：{str(e)}"})

# -------------------------- 车辆详情接口 --------------------------
@app.route("/api/cars/<int:car_id>", methods=["GET"])
def get_car_detail(car_id):
    """获取单个车辆详情"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()

        if config.DATABASE_TYPE == 'mysql':
            cursor.execute("SELECT * FROM cars WHERE id = %s", (car_id,))
        else:
            cursor.execute("SELECT * FROM cars WHERE id = ?", (car_id,))

        row = cursor.fetchone()

        if row:
            car_detail = row if config.DATABASE_TYPE == 'mysql' else dict(row)
            conn.close()
            return jsonify({"code": 0, "msg": "查询成功", "data": car_detail})
        else:
            conn.close()
            return jsonify({"code": -1, "msg": "车辆不存在"})

    except Exception as e:
        logger.error(f"查询车辆详情失败: {e}")
        return jsonify({"code": -1, "msg": f"查询失败：{str(e)}"})

# -------------------------- 健康检查 --------------------------
@app.route("/health")
def health_check():
    """健康检查接口"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1")
        conn.close()
        return jsonify({"status": "healthy", "database": "connected"})
    except Exception as e:
        return jsonify({"status": "unhealthy", "error": str(e)}), 500

# -------------------------- 启动服务 --------------------------
if __name__ == "__main__":
    # 初始化MySQL表（如果是生产环境）
    if config.DATABASE_TYPE == 'mysql':
        init_mysql_tables()
    
    # 生产环境使用0.0.0.0监听所有接口
    host = os.getenv('FLASK_HOST', '0.0.0.0')
    port = int(os.getenv('FLASK_PORT', '5000'))
    debug = os.getenv('FLASK_DEBUG', 'False').lower() == 'true'
    
    logger.info(f"启动服务器: {host}:{port}, 调试模式: {debug}")
    app.run(host=host, port=port, debug=debug)