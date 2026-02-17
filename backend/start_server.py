# 启动脚本 - 明确监听 localhost:5000
from app import app

if __name__ == "__main__":
    # 明确监听 localhost，确保 cpolar 可以连接
    print("正在启动服务器，监听 localhost:5000...")
    app.run(host="localhost", port=5000, debug=True)
