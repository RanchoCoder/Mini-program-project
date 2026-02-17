from flask import Flask, request, jsonify
import requests
import random
import logging
import sqlite3
import os

# 配置日志，方便查看真实登录信息
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# -------------------------- 数据库配置 --------------------------
DB_PATH = os.path.join(os.path.dirname(__file__), 'cars.db')

def get_db_connection():
    """获取数据库连接"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row  # 使查询结果可以按列名访问
    return conn

# -------------------------- 微信登录配置（你的真实信息） --------------------------
WX_APPID = "wxd18848e6830ff127"  # 你的小程序AppID
WX_SECRET = "bfa1fb0d3bdb681d8be3c6b085ac5443"  # 你的小程序AppSecret
WX_LOGIN_URL = "https://api.weixin.qq.com/sns/jscode2session"

# -------------------------- 数据库车辆数据 --------------------------


# -------------------------- 接口实现 --------------------------
@app.route("/")
def index():
    """首页 - API文档"""
    return jsonify({
        "message": "二手车搜索API服务",
        "status": "运行中",
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


@app.route("/api/wxlogin", methods=["POST"])
def wx_login():
    """微信登录接口（获取真实openid）"""
    try:
        # 获取小程序传递的code
        code = request.json.get("code")
        if not code:
            logger.error("登录失败：缺少code参数")
            return jsonify({"code": -1, "msg": "缺少code参数"})

        # 调用微信接口换取openid（增加超时+日志）
        params = {
            "appid": WX_APPID,
            "secret": WX_SECRET,
            "js_code": code,
            "grant_type": "authorization_code",
        }

        logger.info(
            f"开始调用微信登录接口，code: {code[:8]}..."
        )  # 隐藏部分code，避免泄露
        # 增加10秒超时，避免卡住
        response = requests.get(WX_LOGIN_URL, params=params, timeout=10)
        res_data = response.json()

        # 打印微信返回的原始数据（关键：查看真实openid）
        logger.info(f"微信接口返回数据：{res_data}")

        # 检查是否获取成功
        if "errcode" in res_data and res_data["errcode"] != 0:
            logger.error(f"微信登录失败：{res_data.get('errmsg')}")
            return jsonify(
                {"code": -1, "msg": f"微信登录失败：{res_data.get('errmsg')}"}
            )

        # 提取真实openid（核心：这是微信用户的唯一标识）
        real_openid = res_data.get("openid")
        real_session_key = res_data.get("session_key")

        # 构造用户信息（昵称用openid后4位，便于识别真实用户）
        user_info = {
            "openid": real_openid,
            "session_key": real_session_key,
            "nickName": (
                f"微信用户_{real_openid[-4:]}"
                if real_openid
                else f"用户{random.randint(1000, 9999)}"
            ),
            "avatarUrl": "https://mmbiz.qpic.cn/mmbiz/icTdbqWNOwNRna42FI242Lcia07jQodd2FJGIYQfG0LAJGFxM4FbnQP6yfMxBgJ0F3YRqJCJ1aPAK2dQagdusBZg/0",
        }

        logger.info(f"登录成功，真实openid：{real_openid[:8]}...")  # 隐藏部分openid
        return jsonify(
            {"code": 0, "msg": "登录成功（已获取真实openid）", "data": user_info}
        )
    except requests.exceptions.Timeout:
        logger.error("微信登录接口超时")
        return jsonify({"code": -1, "msg": "微信服务器超时，请稍后重试"})
    except requests.exceptions.ConnectionError:
        logger.error("无法连接到微信服务器")
        return jsonify({"code": -1, "msg": "网络异常，无法连接微信服务器"})
    except Exception as e:
        logger.error(f"登录服务器错误：{str(e)}")
        return jsonify({"code": -1, "msg": f"服务器错误：{str(e)}"})


@app.route("/api/cars", methods=["GET"])
def get_cars():
    """获取二手车列表接口（支持模糊搜索、筛选、分页）"""
    try:
        # 获取请求参数
        q = request.args.get("q", "")  # 搜索关键词
        brand = request.args.get("brand", "")  # 品牌
        min_year = request.args.get("min_year", "")  # 最小年份
        max_year = request.args.get("max_year", "")  # 最大年份
        page = int(request.args.get("page", 1))  # 当前页
        page_size = int(request.args.get("page_size", 10))  # 每页条数

        # 构建SQL查询
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # 基础查询
        sql = "SELECT * FROM cars WHERE 1=1"
        params = []
        
        # 1. 模糊搜索（关键词匹配标题/品牌/车型）
        if q:
            sql += " AND (title LIKE ? OR make LIKE ? OR model LIKE ?)"
            params.extend([f'%{q}%', f'%{q}%', f'%{q}%'])
        
        # 2. 品牌筛选
        if brand:
            sql += " AND make = ?"
            params.append(brand)
        
        # 3. 年份筛选
        if min_year:
            sql += " AND year >= ?"
            params.append(int(min_year))
        if max_year:
            sql += " AND year <= ?"
            params.append(int(max_year))
        
        # 获取总数
        count_sql = f"SELECT COUNT(*) FROM ({sql})"
        cursor.execute(count_sql, params)
        total = cursor.fetchone()[0]
        
        # 分页查询
        sql += " ORDER BY id LIMIT ? OFFSET ?"
        params.extend([page_size, (page - 1) * page_size])
        
        cursor.execute(sql, params)
        rows = cursor.fetchall()
        
        # 转换为字典格式
        cars_list = []
        for row in rows:
            car = dict(row)
            cars_list.append(car)
        
        conn.close()

        return jsonify(
            {
                "code": 0,
                "msg": "查询成功",
                "data": {
                    "list": cars_list,
                    "total": total,
                    "page": page,
                    "page_size": page_size,
                },
            }
        )
    except Exception as e:
        logger.error(f"查询车辆失败：{str(e)}")
        return jsonify({"code": -1, "msg": f"查询失败：{str(e)}"})


@app.route("/api/cars/<int:car_id>", methods=["GET"])
def get_car_detail(car_id):
    """获取单个车辆详情"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT * FROM cars WHERE id = ?", (car_id,))
        row = cursor.fetchone()
        
        if row:
            car_detail = dict(row)
            conn.close()
            return jsonify({"code": 0, "msg": "查询成功", "data": car_detail})
        else:
            conn.close()
            return jsonify({"code": -1, "msg": "车辆不存在"})
            
    except Exception as e:
        logger.error(f"查询车辆详情失败：{str(e)}")
        return jsonify({"code": -1, "msg": f"查询失败：{str(e)}"})


# -------------------------- 启动服务 --------------------------
if __name__ == "__main__":
    # 允许跨域，监听所有网卡，调试模式开启
    app.run(host="0.0.0.0", port=5000, debug=True)
