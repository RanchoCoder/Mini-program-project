# ngrok 配置脚本
# 用于创建内网穿透，获得临时域名

Write-Host "========================================" -ForegroundColor Green
Write-Host "    ngrok 内网穿透配置" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

# 1. 下载 ngrok
$ngrokPath = "C:\ngrok\ngrok.exe"
if (-not (Test-Path $ngrokPath)) {
    Write-Host "[1/4] 正在下载 ngrok..." -ForegroundColor Yellow
    
    New-Item -ItemType Directory -Force -Path "C:\ngrok" | Out-Null
    
    # 下载 ngrok Windows 版本
    $ngrokUrl = "https://bin.equinox.io/c/bNyj1mQVY4c/ngrok-v3-stable-windows-amd64.zip"
    $ngrokZip = "$env:TEMP\ngrok.zip"
    
    try {
        Invoke-WebRequest -Uri $ngrokUrl -OutFile $ngrokZip
        Expand-Archive -Path $ngrokZip -DestinationPath "C:\ngrok" -Force
        Remove-Item $ngrokZip
        Write-Host "✅ ngrok 下载完成" -ForegroundColor Green
    } catch {
        Write-Host "❌ 下载失败，请手动下载: https://ngrok.com/download" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "✅ ngrok 已存在" -ForegroundColor Green
}

# 2. 添加到环境变量
Write-Host ""
Write-Host "[2/4] 配置环境变量..." -ForegroundColor Yellow
$currentPath = [Environment]::GetEnvironmentVariable("Path", "Machine")
if ($currentPath -notlike "*C:\ngrok*") {
    [Environment]::SetEnvironmentVariable("Path", $currentPath + ";C:\ngrok", "Machine")
    Write-Host "✅ 环境变量已添加" -ForegroundColor Green
} else {
    Write-Host "✅ 环境变量已存在" -ForegroundColor Green
}

# 3. 提示用户注册
Write-Host ""
Write-Host "[3/4] 注册 ngrok 账号" -ForegroundColor Yellow
Write-Host "请访问: https://dashboard.ngrok.com/signup" -ForegroundColor Cyan
Write-Host "注册后获取 authtoken" -ForegroundColor Cyan
Write-Host ""

$authtoken = Read-Host "请输入您的 ngrok authtoken"

if ($authtoken) {
    # 配置 authtoken
    & $ngrokPath config add-authtoken $authtoken
    Write-Host "✅ authtoken 配置完成" -ForegroundColor Green
} else {
    Write-Host "⚠️ 未输入 authtoken，稍后请手动运行: ngrok config add-authtoken YOUR_TOKEN" -ForegroundColor Yellow
}

# 4. 启动 ngrok
Write-Host ""
Write-Host "[4/4] 启动 ngrok..." -ForegroundColor Yellow
Write-Host "正在创建内网穿透，将本地5000端口映射到公网..." -ForegroundColor Yellow
Write-Host ""

# 创建启动脚本
$startScript = @"
@echo off
echo 启动 ngrok 内网穿透...
echo 访问地址将显示在下方
echo.
C:\ngrok\ngrok.exe http 5000
pause
"@

$startScript | Out-File -FilePath "C:\ngrok\start-ngrok.bat" -Encoding ASCII

Write-Host "========================================" -ForegroundColor Green
Write-Host "    配置完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "启动方式:" -ForegroundColor Yellow
Write-Host "  1. 双击运行: C:\ngrok\start-ngrok.bat" -ForegroundColor Cyan
Write-Host "  2. 或在命令行运行: ngrok http 5000" -ForegroundColor Cyan
Write-Host ""
Write-Host "启动后，你会看到类似: https://xxxx.ngrok.io" -ForegroundColor Yellow
Write-Host "将这个地址添加到微信小程序的服务器域名中" -ForegroundColor Yellow
Write-Host ""
Write-Host "注意: 免费版 ngrok 域名每次重启都会变化" -ForegroundColor Red
Write-Host "如需固定域名，请购买 ngrok 付费版或申请正式域名" -ForegroundColor Red
Write-Host ""

# 询问是否立即启动
$startNow = Read-Host "是否立即启动 ngrok? (y/n)"
if ($startNow -eq "y" -or $startNow -eq "Y") {
    Write-Host ""
    Write-Host "正在启动 ngrok..." -ForegroundColor Green
    Start-Process -FilePath "C:\ngrok\ngrok.exe" -ArgumentList "http 5000" -NoNewWindow
}