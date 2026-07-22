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

REM 并发安装依赖
echo ^>^>^> 开始并发安装依赖...
set INSTALL_START=%time%

start /b "后端安装" cmd /c "cd /d "%~dp0backend" && npm install --silent && echo [后端] 依赖安装完成"
start /b "前端安装" cmd /c "cd /d "%~dp0frontend" && npm install --silent && echo [前端] 依赖安装完成"

REM 等待安装完成
timeout /t 30 /nobreak >nul

echo ^>^>^> 依赖安装完成
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
