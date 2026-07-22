/**
 * 云湖机器人框架 - Windows EXE 启动器
 * 无UI，并发安装后端和前端依赖，并发启动前端和后端
 * 使用 pkg 打包为 exe: npx pkg launcher.js -t node18-win-x64 -o yunhu-bot.exe
 */

const { spawn, execSync } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

const ROOT_DIR = __dirname;
const BACKEND_DIR = path.join(ROOT_DIR, 'backend');
const FRONTEND_DIR = path.join(ROOT_DIR, 'frontend');

const isWindows = os.platform() === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';

function log(tag, msg) {
  const time = new Date().toLocaleTimeString();
  console.log(`[${time}] [${tag}] ${msg}`);
}

function checkNode() {
  try {
    const version = execSync('node -v', { encoding: 'utf-8' }).trim();
    const major = parseInt(version.replace('v', '').split('.')[0], 10);
    if (major < 18) {
      log('ERROR', `Node.js 版本过低，需要 >= 18，当前: ${version}`);
      process.exit(1);
    }
    log('INFO', `Node.js 版本: ${version}`);
  } catch (e) {
    log('ERROR', '未检测到 Node.js，请先安装 Node.js >= 18');
    process.exit(1);
  }
}

function installDeps(dir, name) {
  return new Promise((resolve, reject) => {
    log(name, '安装依赖...');
    const proc = spawn(npmCmd, ['install', '--silent'], {
      cwd: dir,
      shell: true,
      stdio: 'pipe',
    });
    proc.stdout.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim()) log(name, line.trim());
      });
    });
    proc.stderr.on('data', (data) => {
      const lines = data.toString().trim().split('\n');
      lines.forEach(line => {
        if (line.trim() && !line.includes('npm warn')) log(name, line.trim());
      });
    });
    proc.on('close', (code) => {
      if (code === 0) {
        log(name, '依赖安装完成');
        resolve();
      } else {
        log(name, `依赖安装失败 (exit code: ${code})`);
        reject(new Error(`${name} install failed`));
      }
    });
  });
}

function startService(dir, name, script, delay = 0) {
  return new Promise((resolve) => {
    setTimeout(() => {
      log(name, `启动中...`);
      const proc = spawn(npmCmd, ['run', script], {
        cwd: dir,
        shell: true,
        stdio: 'pipe',
      });
      proc.stdout.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
          if (line.trim()) log(name, line.trim());
        });
      });
      proc.stderr.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
          if (line.trim()) log(name, line.trim());
        });
      });
      proc.on('close', (code) => {
        log(name, `进程退出 (code: ${code})`);
      });
      resolve(proc);
    }, delay * 1000);
  });
}

async function main() {
  console.log('');
  console.log('========================================');
  console.log('  云湖机器人框架 - 一键启动');
  console.log('========================================');
  console.log('');

  checkNode();

  // 并发安装依赖
  console.log('>>> 开始并发安装依赖...');
  const installStart = Date.now();

  try {
    await Promise.all([
      installDeps(BACKEND_DIR, '后端'),
      installDeps(FRONTEND_DIR, '前端'),
    ]);
  } catch (e) {
    log('ERROR', `依赖安装失败: ${e.message}`);
    process.exit(1);
  }

  const installDuration = ((Date.now() - installStart) / 1000).toFixed(1);
  console.log(`>>> 依赖安装完成 (耗时 ${installDuration}s)`);
  console.log('');

  // 检查 .env
  const envPath = path.join(BACKEND_DIR, '.env');
  const envExamplePath = path.join(BACKEND_DIR, '.env.example');
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    log('INFO', '创建后端 .env 配置文件...');
    fs.copyFileSync(envExamplePath, envPath);
  }

  // 并发启动
  console.log('>>> 开始并发启动服务...');
  console.log('');

  const processes = [];

  // 启动后端
  const backendProc = await startService(BACKEND_DIR, '后端', 'start:dev', 0);
  processes.push(backendProc);

  // 启动前端 (延迟2秒)
  const frontendProc = await startService(FRONTEND_DIR, '前端', 'dev', 2);
  processes.push(frontendProc);

  console.log('');
  console.log('========================================');
  console.log('  服务已启动！');
  console.log('  前端管理台: http://localhost:5173');
  console.log('  后端API:    http://localhost:3000');
  console.log('  TCP端口:    8888');
  console.log('  按 Ctrl+C 停止所有服务');
  console.log('========================================');
  console.log('');

  // 优雅退出
  function cleanup() {
    console.log('');
    console.log('>>> 正在停止所有服务...');
    processes.forEach((proc, i) => {
      const name = i === 0 ? '后端' : '前端';
      try {
        if (isWindows) {
          // Windows 下杀进程树
          spawn('taskkill', ['/pid', proc.pid, '/f', '/t'], { shell: true });
        } else {
          process.kill(-proc.pid);
        }
        log(name, '已停止');
      } catch (e) {
        // 进程可能已退出
      }
    });
    process.exit(0);
  }

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);

  // 保持进程运行
  processes.forEach(proc => {
    proc.on('close', () => {
      log('INFO', '子进程退出');
    });
  });
}

main().catch(err => {
  log('ERROR', `启动失败: ${err.message}`);
  process.exit(1);
});
