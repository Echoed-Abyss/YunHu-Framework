#!/bin/bash

# 云湖机器人框架 - Linux 一键启动脚本
# 并发安装后端和前端依赖，并发启动前端和后端
# 包含离线/镜像/重试等补救措施

set -e

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
FRONTEND_DIR="$ROOT_DIR/frontend"

# npm 镜像配置（可通过环境变量 NPM_REGISTRY 覆盖，默认为 npmmirror 镜像）
NPM_REGISTRY="${NPM_REGISTRY:-https://registry.npmmirror.com}"

# 重试参数
MAX_RETRY=3
RETRY_DELAY=3

echo "========================================"
echo "  云湖机器人框架 - 一键启动"
echo "========================================"
echo ""

# 检查 Node.js
if ! command -v node &> /dev/null; then
    echo "[错误] 未检测到 Node.js，请先安装 Node.js >= 18"
    exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "[错误] Node.js 版本过低，需要 >= 18，当前: $(node -v)"
    exit 1
fi

echo "[信息] Node.js 版本: $(node -v)"
echo "[信息] 使用 npm 镜像: $NPM_REGISTRY"
echo ""

# 检查并删除旧的 package-lock.json（避免跨平台原生模块问题）
if [ -f "$ROOT_DIR/package-lock.json" ]; then
    echo "[信息] 删除旧的 package-lock.json（避免跨平台原生模块冲突）..."
    rm -f "$ROOT_DIR/package-lock.json"
fi

# 配置 npm 镜像
echo "[信息] 配置 npm 镜像..."
npm config set registry "$NPM_REGISTRY" > /dev/null 2>&1 || true

# 函数：使用重试机制安装依赖
install_with_retry() {
    local name=$1
    local dir=$2
    local attempt=1
    while [ $attempt -le $MAX_RETRY ]; do
        echo "  [$name] 第 $attempt 次安装依赖..."
        if (cd "$dir" && npm install --no-package-lock --prefer-offline --no-audit --no-fund --loglevel=error 2>&1 | tail -5); then
            echo "  [$name] 依赖安装成功"
            return 0
        fi
        echo "  [$name] 第 $attempt 次安装失败，$RETRY_DELAY 秒后重试..."
        sleep $RETRY_DELAY
        attempt=$((attempt + 1))
    done
    return 1
}

# 并发安装依赖
echo ">>> 开始并发安装依赖..."
INSTALL_START=$(date +%s)

(
    install_with_retry "后端" "$BACKEND_DIR"
) &
BACKEND_INSTALL_PID=$!

(
    install_with_retry "前端" "$FRONTEND_DIR"
) &
FRONTEND_INSTALL_PID=$!

# 等待安装完成
wait $BACKEND_INSTALL_PID
BACKEND_INSTALL_EXIT=$?
wait $FRONTEND_INSTALL_PID
FRONTEND_INSTALL_EXIT=$?

INSTALL_END=$(date +%s)
INSTALL_DURATION=$((INSTALL_END - INSTALL_START))

if [ $BACKEND_INSTALL_EXIT -ne 0 ]; then
    echo "[错误] 后端依赖安装失败，请检查网络或手动执行: cd $BACKEND_DIR && npm install --no-package-lock"
    exit 1
fi

if [ $FRONTEND_INSTALL_EXIT -ne 0 ]; then
    echo "[错误] 前端依赖安装失败，请检查网络或手动执行: cd $FRONTEND_DIR && npm install --no-package-lock"
    exit 1
fi

echo ">>> 依赖安装完成 (耗时 ${INSTALL_DURATION}s)"
echo ""

# 创建符号链接到根 node_modules（npm workspace 模式）
if [ ! -e "$FRONTEND_DIR/node_modules" ] || [ ! -e "$BACKEND_DIR/node_modules" ]; then
    echo "[信息] 创建子项目 node_modules 符号链接..."
    [ -d "$ROOT_DIR/node_modules" ] || mkdir -p "$ROOT_DIR/node_modules"
    [ ! -e "$FRONTEND_DIR/node_modules" ] && ln -sf "$ROOT_DIR/node_modules" "$FRONTEND_DIR/node_modules"
    [ ! -e "$BACKEND_DIR/node_modules" ] && ln -sf "$ROOT_DIR/node_modules" "$BACKEND_DIR/node_modules"
fi

# 修复可能缺失的依赖
echo ">>> 检查并修复可能缺失的依赖..."

# 检查后端 @nestjs/cli
if [ ! -d "$BACKEND_DIR/node_modules/@nestjs/cli" ]; then
    echo "  [后端] 修复 @nestjs/cli 依赖..."
    (cd "$BACKEND_DIR" && npm install @nestjs/cli --no-save --no-package-lock --silent 2>&1 | tail -1) || true
fi

# 检查前端 caniuse-lite
if [ ! -d "$FRONTEND_DIR/node_modules/caniuse-lite" ]; then
    echo "  [前端] 修复 caniuse-lite 依赖..."
    (cd "$FRONTEND_DIR" && npm install caniuse-lite --no-save --no-package-lock --silent 2>&1 | tail -1) || true
fi

echo ">>> 依赖修复完成"
echo ""

# 检查后端 .env 文件
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo "[信息] 创建后端 .env 配置文件..."
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env" 2>/dev/null || true
fi

# 并发启动
echo ">>> 开始并发启动服务..."
echo ""

BACKEND_PID=""
FRONTEND_PID=""

cleanup() {
    echo ""
    echo ">>> 正在停止所有服务..."
    if [ -n "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null || true
        echo "  [后端] 已停止"
    fi
    if [ -n "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null || true
        echo "  [前端] 已停止"
    fi
    exit 0
}

trap cleanup SIGINT SIGTERM

# 启动后端
(
    cd "$BACKEND_DIR"
    echo "  [后端] 启动中... (http://localhost:3000, TCP:8888)"
    npm run start:dev 2>&1 | while read line; do
        echo "  [后端] $line"
    done
) &
BACKEND_PID=$!

# 启动前端
(
    cd "$FRONTEND_DIR"
    sleep 2
    echo "  [前端] 启动中... (http://localhost:5173)"
    npm run dev 2>&1 | while read line; do
        echo "  [前端] $line"
    done
) &
FRONTEND_PID=$!

echo "========================================"
echo "  服务已启动！"
echo "  前端管理台: http://localhost:5173"
echo "  后端API:    http://localhost:3000"
echo "  TCP端口:    8888"
echo "  按 Ctrl+C 停止所有服务"
echo "========================================"
echo ""

# 等待子进程
wait