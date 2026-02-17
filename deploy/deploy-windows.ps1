# 二手车搜索系统 - Windows服务器部署脚本
# 适用于阿里云Windows Server

param(
    [string]$Domain = "your-domain.com",
    [string]$Email = "admin@your-domain.com"
)

# 设置错误处理
$ErrorActionPreference = "Stop"

# 颜色输出函数
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Green }
function Write-Warn { param($Message) Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

# 配置变量
$ProjectName = "used_car_search"
$DeployDir = "C:\Apps\$ProjectName"
$LogDir = "C:\Apps\Logs\$ProjectName"
$ServiceName = "UsedCarAPI"

Write-Info "========================================"
Write-Info "二手车搜索系统 - Windows部署脚本"
Write-Info "========================================"

# 1. 检查管理员权限
function Test-Admin {
    $currentPrincipal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
    if (-not $currentPrincipal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Error "请使用管理员权限运行此脚本"
        exit 1
    }
}

# 2. 安装依赖
function Install-Dependencies {
    Write-Info "安装依赖..."
    
    # 检查Python
    if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
        Write-Info "正在下载Python..."
        $pythonUrl = "https://www.python.org/ftp/python/3.11.8/python-3.11.8-amd64.exe"
        $pythonInstaller = "$env:TEMP\python-installer.exe"
        Invoke-WebRequest -Uri $pythonUrl -OutFile $pythonInstaller
        Start-Process -FilePath $pythonInstaller -ArgumentList "/quiet InstallAllUsers=1 PrependPath=1" -Wait
        Remove-Item $pythonInstaller
        Write-Info "Python安装完成，请重启PowerShell后重新运行脚本"
        exit 0
    }
    
    # 安装Python包
    python -m pip install --upgrade pip
    pip install flask requests gunicorn waitress pymysql flask-cors
    
    Write-Info "依赖安装完成"
}

# 3. 创建目录结构
function New-ProjectDirectories {
    Write-Info "创建项目目录..."
    New-Item -ItemType Directory -Force -Path $DeployDir | Out-Null
    New-Item -ItemType Directory -Force -Path $LogDir | Out-Null
    Write-Info "目录创建完成"
}

# 4. 部署代码
function Deploy-Code {
    Write-Info "部署项目代码..."
    
    # 复制后端代码
    $SourceDir = Join-Path $PSScriptRoot "..\backend"
    Copy-Item -Path "$SourceDir\*" -Destination $DeployDir -Recurse -Force
    
    # 创建环境变量文件
    $envContent = @"
# Flask配置
FLASK_ENV=production
FLASK_DEBUG=False
SECRET_KEY=$(-join ((65..90) + (97..122) | Get-Random -Count 32 | ForEach-Object { [char]$_ }))

# 微信小程序配置
WX_APPID=wxd18848e6830ff127
WX_SECRET=bfa1fb0d3bdb681d8be3c6b085ac5443

# 数据库配置（使用SQLite，如需MySQL请修改）
DATABASE_TYPE=sqlite
DATABASE_PATH=$DeployDir\cars.db

# CORS配置
CORS_ORIGINS=https://$Domain,http://$Domain
"@
    
    $envContent | Out-File -FilePath "$DeployDir\.env" -Encoding UTF8
    Write-Info "代码部署完成"
}

# 5. 初始化数据库
function Initialize-Database {
    Write-Info "初始化数据库..."
    
    # 复制本地数据库或创建新的
    $LocalDb = Join-Path $PSScriptRoot "..\backend\cars.db"
    if (Test-Path $LocalDb) {
        Copy-Item -Path $LocalDb -Destination "$DeployDir\cars.db" -Force
        Write-Info "数据库已复制"
    } else {
        # 运行数据库初始化
        Set-Location $DeployDir
        python init_db.py
        Write-Info "数据库初始化完成"
    }
}

# 6. 创建Windows服务
function New-WindowsService {
    Write-Info "创建Windows服务..."
    
    # 使用NSSM创建服务
    $nssmPath = "C:\nssm\nssm.exe"
    if (-not (Test-Path $nssmPath)) {
        Write-Info "下载NSSM..."
        New-Item -ItemType Directory -Force -Path "C:\nssm" | Out-Null
        $nssmUrl = "https://nssm.cc/release/nssm-2.24.zip"
        $nssmZip = "$env:TEMP\nssm.zip"
        Invoke-WebRequest -Uri $nssmUrl -OutFile $nssmZip
        Expand-Archive -Path $nssmZip -DestinationPath "C:\nssm" -Force
        Remove-Item $nssmZip
        $nssmPath = "C:\nssm\nssm-2.24\win64\nssm.exe"
    }
    
    # 删除旧服务
    & $nssmPath stop $ServiceName 2>$null
    & $nssmPath remove $ServiceName confirm 2>$null
    
    # 创建新服务
    & $nssmPath install $ServiceName python
    & $nssmPath set $ServiceName Application python
    & $nssmPath set $ServiceName AppParameters "$DeployDir\app_production.py"
    & $nssmPath set $ServiceName AppDirectory $DeployDir
    & $nssmPath set $ServiceName AppStdout "$LogDir\app.log"
    & $nssmPath set $ServiceName AppStderr "$LogDir\app_error.log"
    & $nssmPath set $ServiceName Start SERVICE_AUTO_START
    
    # 启动服务
    Start-Service $ServiceName
    Write-Info "Windows服务创建并启动完成"
}

# 7. 配置防火墙
function Set-FirewallRules {
    Write-Info "配置防火墙规则..."
    
    # 开放5000端口
    New-NetFirewallRule -DisplayName "UsedCarAPI-5000" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow -ErrorAction SilentlyContinue
    
    # 开放80端口
    New-NetFirewallRule -DisplayName "HTTP-80" -Direction Inbound -Protocol TCP -LocalPort 80 -Action Allow -ErrorAction SilentlyContinue
    
    # 开放443端口
    New-NetFirewallRule -DisplayName "HTTPS-443" -Direction Inbound -Protocol TCP -LocalPort 443 -Action Allow -ErrorAction SilentlyContinue
    
    Write-Info "防火墙配置完成"
}

# 8. 安装和配置IIS反向代理（可选）
function Install-IIS {
    Write-Info "配置IIS反向代理..."
    
    # 安装IIS
    Install-WindowsFeature -name Web-Server -IncludeManagementTools
    
    # 安装ARR（Application Request Routing）
    $arrUrl = "https://download.microsoft.com/download/E/9/8/E9849D6A-020E-47E4-9FD0-A023E99B54EB/requestRouter_amd64.msi"
    $arrInstaller = "$env:TEMP\ARR.msi"
    Invoke-WebRequest -Uri $arrUrl -OutFile $arrInstaller
    Start-Process -FilePath msiexec -ArgumentList "/i", $arrInstaller, "/quiet", "/norestart" -Wait
    Remove-Item $arrInstaller
    
    Write-Info "IIS配置完成"
}

# 9. 健康检查
function Test-Health {
    Write-Info "执行健康检查..."
    
    Start-Sleep -Seconds 3
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:5000/health" -Method GET
        if ($response.status -eq "healthy") {
            Write-Info "✅ API服务运行正常"
        } else {
            Write-Error "❌ API服务异常"
        }
    } catch {
        Write-Error "❌ 无法连接到API服务: $_"
    }
}

# 10. 显示部署信息
function Show-DeploymentInfo {
    Write-Info "========================================"
    Write-Info "      部署完成！"
    Write-Info "========================================"
    Write-Info "项目目录: $DeployDir"
    Write-Info "日志目录: $LogDir"
    Write-Info "访问地址: http://$($Domain):5000"
    Write-Info "API地址: http://$($Domain):5000/api/cars"
    Write-Info ""
    Write-Info "常用命令:"
    Write-Info "  查看日志: Get-Content $LogDir\app.log -Tail 50"
    Write-Info "  重启服务: Restart-Service $ServiceName"
    Write-Info "  查看状态: Get-Service $ServiceName"
    Write-Info "========================================"
}

# 主函数
function Main {
    Test-Admin
    Install-Dependencies
    New-ProjectDirectories
    Deploy-Code
    Initialize-Database
    New-WindowsService
    Set-FirewallRules
    Test-Health
    Show-DeploymentInfo
}

# 执行主函数
Main