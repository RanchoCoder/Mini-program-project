# 二手车查询示例（后端 + 小程序前端）

后端：Flask 提供 `/api/search` 接口，支持模糊查询（使用 SQL LIKE 匹配 `make/model/title/description`）。

快速启动：

1. 创建并激活虚拟环境（Windows PowerShell）：

```powershell
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r backend\requirements.txt
```

2. 初始化数据库并启动后端：

```powershell
python backend\init_db.py
python backend\app.py
```

3. 小程序前端示例：
- 将 `miniprogram` 内容加入你的小程序项目，或将示例页面 `pages/search` 拷贝到现有项目中。
- 在 `app.json` 中注册页面：

```json
"pages": [
  "pages/search/search"
]
```

4. 调试：
- 在微信开发者工具中运行小程序（注意后端地址如在手机或模拟器上需要改成能访问的 IP，例如 `http://192.168.x.y:5000`）。

接口示例：
`GET /api/search?q=丰田&page=1&page_size=20`
