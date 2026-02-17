from flask import Flask, request, jsonify
import requests
import random
import logging

# 配置日志，方便查看真实登录信息
logging.basicConfig(
    level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

# -------------------------- 微信登录配置（你的真实信息） --------------------------
WX_APPID = "wxd18848e6830ff127"  # 你的小程序AppID
WX_SECRET = "bfa1fb0d3bdb681d8be3c6b085ac5443"  # 你的小程序AppSecret
WX_LOGIN_URL = "https://api.weixin.qq.com/sns/jscode2session"

# -------------------------- 模拟二手车数据 --------------------------
CAR_DATA = [
    {
        "id": 1,
        "title": "宝马3系 2020款",
        "make": "宝马",
        "model": "3系",
        "year": 2020,
        "price": 258000,
        "mileage": 35000,
        "description": "精品车况，全程4S店保养",
    },
    {
        "id": 2,
        "title": "奔驰C级 2021款",
        "make": "奔驰",
        "model": "C级",
        "year": 2021,
        "price": 285000,
        "mileage": 28000,
        "description": "原版原漆，一手车",
    },
    {
        "id": 3,
        "title": "大众迈腾 2019款",
        "make": "大众",
        "model": "迈腾",
        "year": 2019,
        "price": 168000,
        "mileage": 52000,
        "description": "家用代步车，省油耐用",
    },
    {
        "id": 4,
        "title": "丰田凯美瑞 2022款",
        "make": "丰田",
        "model": "凯美瑞",
        "year": 2022,
        "price": 218000,
        "mileage": 18000,
        "description": "混动版本，油耗低",
    },
    {
        "id": 5,
        "title": "本田雅阁 2020款",
        "make": "本田",
        "model": "雅阁",
        "year": 2020,
        "price": 195000,
        "mileage": 42000,
        "description": "空间大，适合家用",
    },
    {
        "id": 6,
        "title": "宝马5系 2021款",
        "make": "宝马",
        "model": "5系",
        "year": 2021,
        "price": 388000,
        "mileage": 25000,
        "description": "豪华轿车，配置齐全",
    },
    {
        "id": 7,
        "title": "奔驰E级 2020款",
        "make": "奔驰",
        "model": "E级",
        "year": 2020,
        "price": 365000,
        "mileage": 32000,
        "description": "商务用车，车况优秀",
    },
    {
        "id": 8,
        "title": "大众途观L 2021款",
        "make": "大众",
        "model": "途观L",
        "year": 2021,
        "price": 228000,
        "mileage": 30000,
        "description": "SUV，四驱版本",
    },
    {
        "id": 9,
        "title": "丰田汉兰达 2022款",
        "make": "丰田",
        "model": "汉兰达",
        "year": 2022,
        "price": 328000,
        "mileage": 20000,
        "description": "7座SUV，家用首选",
    },
    {
        "id": 10,
        "title": "本田CR-V 2020款",
        "make": "本田",
        "model": "CR-V",
        "year": 2020,
        "price": 188000,
        "mileage": 45000,
        "description": "紧凑型SUV，省油",
    },
    {
        "id": 11,
        "title": "宝马X3 2022款",
        "make": "宝马",
        "model": "X3",
        "year": 2022,
        "price": 398000,
        "mileage": 15000,
        "description": "豪华SUV，操控好",
    },
    {
        "id": 12,
        "title": "奔驰GLC 2021款",
        "make": "奔驰",
        "model": "GLC",
        "year": 2021,
        "price": 378000,
        "mileage": 22000,
        "description": "四驱，全景天窗",
    },
]


# -------------------------- 接口实现 --------------------------
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

        # 数据筛选
        filtered_cars = CAR_DATA
        # 1. 模糊搜索（关键词匹配标题/品牌/车型）
        if q:
            filtered_cars = [
                car
                for car in filtered_cars
                if q in car["title"] or q in car["make"] or q in car["model"]
            ]
        # 2. 品牌筛选
        if brand:
            filtered_cars = [car for car in filtered_cars if car["make"] == brand]
        # 3. 年份筛选
        if min_year:
            filtered_cars = [
                car for car in filtered_cars if car["year"] >= int(min_year)
            ]
        if max_year:
            filtered_cars = [
                car for car in filtered_cars if car["year"] <= int(max_year)
            ]

        # 分页处理
        total = len(filtered_cars)
        start = (page - 1) * page_size
        end = start + page_size
        paginated_cars = filtered_cars[start:end]

        return jsonify(
            {
                "code": 0,
                "msg": "查询成功",
                "data": {
                    "list": paginated_cars,
                    "total": total,
                    "page": page,
                    "page_size": page_size,
                },
            }
        )
    except Exception as e:
        logger.error(f"查询车辆失败：{str(e)}")
        return jsonify({"code": -1, "msg": f"查询失败：{str(e)}"})


# -------------------------- 启动服务 --------------------------
if __name__ == "__main__":
    # 允许跨域，监听所有网卡，调试模式开启
    app.run(host="0.0.0.0", port=5000, debug=True)
