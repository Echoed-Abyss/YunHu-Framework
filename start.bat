@echo off
chcp 65001 >nul 2>&1
title 云湖机器人框架

echo.
echo ========================================
echo   云湖机器人框架 - 一键启动
echo ========================================
echo.

REM 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js >= 18
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VERSION=%%v
echo [信息] Node.js 版本: %NODE_VERSION%
echo.

REM 删除旧的 package-lock.json（避免跨平台原生模块问题）
if exist "%~dp0package-lock.json" (
    echo [信息] 删除旧的 package-lock.json（避免跨平台原生模块冲突）...
    del "%~dp0package-lock.json" >nul 2>&1
)

REM 并发安装依赖
echo ^>^>^> 开始并发安装依赖...
set INSTALL_START=%time%

start /b "后端安装" cmd /c "cd /d "%~dp0backend" && npm install --no-package-lock --silent && echo [后端] 依赖安装完成"
start /b "前端安装" cmd /c "cd /d "%~dp0frontend" && npm install --no-package-lock --silent && echo [前端] 依赖安装完成"

REM 等待安装完成（最多60秒）
timeout /t 60 /nobreak >nul

echo ^>^>^> 依赖安装完成
echo.

REM Windows 下修复跨平台原生模块
echo ^>^>^> 检查并修复跨平台原生模块...
cd /d "%~dp0frontend"
if exist "node_modules\rollup\dist\native.js" (
    if not exist "node_modules\@rollup\rollup-win32-x64-msvc" (
        echo   [前端] 修复 rollup 跨平台原生模块...
        npm install @rollup/rollup-win32-x64-msvc --no-save --silent
    )
)
if not exist "node_modules\caniuse-lite" (
    echo   [前端] 修复 caniuse-lite 依赖...
    npm install caniuse-lite --no-save --silent
)
cd /d "%~dp0backend"
if not exist "node_modules\@nestjs\cli" (
    echo   [后端] 修复 @nestjs/cli 依赖...
    npm install @nestjs/cli --no-save --silent
)
cd /d "%~dp0"

echo ^>^>^> 原生模块修复完成
echo.

REM 检查 .env
if not exist "%~dp0backend\.env" (
    if exist "%~dp0backend\.env.example" (
        echo [信息] 创建后端 .env 配置文件...
        copy "%~dp0backend\.env.example" "%~dp0backend\.env" >nul
    )
)

REM 并发启动
echo ^>^>^> 开始并发启动服务...
echo.

start "后端服务" cmd /c "cd /d "%~dp0backend" && npm run start:dev"
timeout /t 2 /nobreak >nul
start "前端服务" cmd /c "cd /d "%~dp0frontend" && npm run dev"

echo ========================================
echo   服务已启动！
echo   前端管理台: http://localhost:5173
echo   后端API:    http://localhost:3000
echo   TCP端口:    8888
echo   关闭此窗口不会停止服务
echo   要停止服务请关闭后端和前端窗口
echo ========================================
echo.
pause