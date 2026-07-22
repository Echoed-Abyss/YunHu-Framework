@echo off
chcp 65001 >nul 2>&1
title 构建 yunhu-bot.exe

echo.
echo ========================================
echo   构建 yunhu-bot.exe (Windows)
echo ========================================
echo.

REM 检查 Node.js
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [错误] 未检测到 Node.js，请先安装 Node.js >= 18
    pause
    exit /b 1
)

echo [1/3] 安装 pkg...
call npm install -g pkg
if %errorlevel% neq 0 (
    echo [错误] pkg 安装失败
    pause
    exit /b 1
)

echo [2/3] 打包 EXE...
pkg launcher.js -t node18-win-x64 -o yunhu-bot.exe
if %errorlevel% neq 0 (
    echo [错误] 打包失败
    pause
    exit /b 1
)

echo [3/3] 构建完成！
echo.
echo 已生成: yunhu-bot.exe
echo 使用方法: 将 yunhu-bot.exe 与 backend/ frontend/ proto/ 目录放在同一目录下运行
echo.
pause
