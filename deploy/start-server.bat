@echo off
chcp 65001 >nul
echo ========================================
echo 二手车搜索系统 - 启动脚本
echo ========================================
echo.

REM 设置变量
set "DEPLOY_DIR=C:\Apps\used_car_search"
set "LOG_DIR=C:\Apps\Logs\used_car_search"

REM 创建目录
if not exist "%DEPLOY_DIR%" mkdir "%DEPLOY_DIR%"
if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"

echo [INFO] 正在复制项目文件...

REM 复制后端文件
xcopy /Y /E "..\backend\*" "%DEPLOY_DIR%\"

echo [INFO] 文件复制完成
echo.
echo [INFO] 启动Flask服务器...
echo.

REM 进入项目目录
cd /d "%DEPLOY_DIR%"

REM 启动Python应用
python app.py

pause