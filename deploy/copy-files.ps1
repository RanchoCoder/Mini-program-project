# 复制项目文件到部署目录
$source = "C:\Users\Administrator\Desktop\used_car_search\backend"
$dest = "C:\Apps\used_car_search"

# 确保目标目录存在
New-Item -ItemType Directory -Force -Path $dest | Out-Null

# 复制文件
Copy-Item -Path "$source\*" -Destination $dest -Recurse -Force

Write-Host "文件复制完成！" -ForegroundColor Green
Write-Host "目标目录: $dest" -ForegroundColor Green