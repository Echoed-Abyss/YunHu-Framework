/**
 * yunhu-bot.exe - Windows 启动器
 * 无UI，并发安装后端和前端依赖，并发启动前端和后端
 */

#include <windows.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <process.h>
#include <tchar.h>

#define MAX_CMD 4096

static char exeDir[MAX_PATH];

void getExeDir() {
    GetModuleFileNameA(NULL, exeDir, MAX_PATH);
    char *lastSlash = strrchr(exeDir, '\\');
    if (lastSlash) *lastSlash = '\0';
}

int checkNode() {
    FILE *fp = _popen("node -v", "r");
    if (!fp) return 0;
    char version[64];
    if (fgets(version, sizeof(version), fp)) {
        version[strcspn(version, "\n")] = 0;
        printf("[INFO] Node.js %s\n", version);
        _pclose(fp);
        return 1;
    }
    _pclose(fp);
    return 0;
}

void removePackageLock() {
    char lockPath[MAX_PATH];
    snprintf(lockPath, MAX_PATH, "%s\\package-lock.json", exeDir);
    if (GetFileAttributesA(lockPath) != INVALID_FILE_ATTRIBUTES) {
        printf("[INFO] Removing old package-lock.json (cross-platform fix)...\n");
        DeleteFileA(lockPath);
    }
}

void fixCrossPlatformModules() {
    char path[MAX_PATH];
    char cmd[MAX_CMD];
    
    // Fix frontend rollup
    snprintf(path, MAX_PATH, "%s\\frontend\\node_modules\\@rollup\\rollup-win32-x64-msvc", exeDir);
    if (GetFileAttributesA(path) == INVALID_FILE_ATTRIBUTES) {
        printf("  [FRONTEND] Fixing rollup cross-platform native module...\n");
        snprintf(cmd, MAX_CMD, "cd /d \"%s\\frontend\" && npm install @rollup/rollup-win32-x64-msvc --no-save --silent", exeDir);
        system(cmd);
    }
    
    // Fix frontend caniuse-lite
    snprintf(path, MAX_PATH, "%s\\frontend\\node_modules\\caniuse-lite", exeDir);
    if (GetFileAttributesA(path) == INVALID_FILE_ATTRIBUTES) {
        printf("  [FRONTEND] Fixing caniuse-lite dependency...\n");
        snprintf(cmd, MAX_CMD, "cd /d \"%s\\frontend\" && npm install caniuse-lite --no-save --silent", exeDir);
        system(cmd);
    }
    
    // Fix backend @nestjs/cli
    snprintf(path, MAX_PATH, "%s\\backend\\node_modules\\@nestjs\\cli", exeDir);
    if (GetFileAttributesA(path) == INVALID_FILE_ATTRIBUTES) {
        printf("  [BACKEND] Fixing @nestjs/cli dependency...\n");
        snprintf(cmd, MAX_CMD, "cd /d \"%s\\backend\" && npm install @nestjs/cli --no-save --silent", exeDir);
        system(cmd);
    }
}

unsigned __stdcall installBackend(void *arg) {
    char cmd[MAX_CMD];
    snprintf(cmd, MAX_CMD, "cd /d \"%s\\backend\" && npm install --no-package-lock --silent", exeDir);
    printf("  [BACKEND] Installing dependencies...\n");
    int ret = system(cmd);
    printf("  [BACKEND] Install %s\n", ret == 0 ? "complete" : "failed");
    return ret;
}

unsigned __stdcall installFrontend(void *arg) {
    char cmd[MAX_CMD];
    snprintf(cmd, MAX_CMD, "cd /d \"%s\\frontend\" && npm install --no-package-lock --silent", exeDir);
    printf("  [FRONTEND] Installing dependencies...\n");
    int ret = system(cmd);
    printf("  [FRONTEND] Install %s\n", ret == 0 ? "complete" : "failed");
    return ret;
}

unsigned __stdcall startBackend(void *arg) {
    char cmd[MAX_CMD];
    snprintf(cmd, MAX_CMD, "cd /d \"%s\\backend\" && npm run start:dev", exeDir);
    printf("  [BACKEND] Starting... (http://localhost:3000, TCP:8888)\n");
    system(cmd);
    return 0;
}

unsigned __stdcall startFrontend(void *arg) {
    Sleep(2000);
    char cmd[MAX_CMD];
    snprintf(cmd, MAX_CMD, "cd /d \"%s\\frontend\" && npm run dev", exeDir);
    printf("  [FRONTEND] Starting... (http://localhost:5173)\n");
    system(cmd);
    return 0;
}

int main() {
    printf("\n========================================\n");
    printf("  YunHu Bot Framework - Launcher\n");
    printf("========================================\n\n");

    getExeDir();

    if (!checkNode()) {
        printf("[ERROR] Node.js not found. Please install Node.js >= 18\n");
        printf("Press any key to exit...\n");
        getchar();
        return 1;
    }

    /* Remove old package-lock.json */
    removePackageLock();

    /* Check .env */
    char envPath[MAX_PATH];
    snprintf(envPath, MAX_PATH, "%s\\backend\\.env", exeDir);
    char envExamplePath[MAX_PATH];
    snprintf(envExamplePath, MAX_PATH, "%s\\backend\\.env.example", exeDir);
    if (GetFileAttributesA(envPath) == INVALID_FILE_ATTRIBUTES &&
        GetFileAttributesA(envExamplePath) != INVALID_FILE_ATTRIBUTES) {
        printf("[INFO] Creating backend .env config file...\n");
        CopyFileA(envExamplePath, envPath, FALSE);
    }

    /* Concurrent install */
    printf(">>> Installing dependencies (concurrent)...\n\n");
    HANDLE threads[2];
    threads[0] = (HANDLE)_beginthreadex(NULL, 0, installBackend, NULL, 0, NULL);
    threads[1] = (HANDLE)_beginthreadex(NULL, 0, installFrontend, NULL, 0, NULL);
    WaitForMultipleObjects(2, threads, TRUE, INFINITE);
    CloseHandle(threads[0]);
    CloseHandle(threads[1]);
    printf("\n>>> Dependencies installed.\n\n");

    /* Fix cross-platform modules */
    printf(">>> Checking cross-platform native modules...\n");
    fixCrossPlatformModules();
    printf(">>> Native modules fixed.\n\n");

    /* Concurrent start */
    printf(">>> Starting services (concurrent)...\n\n");
    threads[0] = (HANDLE)_beginthreadex(NULL, 0, startBackend, NULL, 0, NULL);
    threads[1] = (HANDLE)_beginthreadex(NULL, 0, startFrontend, NULL, 0, NULL);

    printf("\n========================================\n");
    printf("  Services started!\n");
    printf("  Frontend:  http://localhost:5173\n");
    printf("  Backend:   http://localhost:3000\n");
    printf("  TCP:       8888\n");
    printf("  Press Ctrl+C to stop.\n");
    printf("========================================\n\n");

    WaitForMultipleObjects(2, threads, TRUE, INFINITE);
    CloseHandle(threads[0]);
    CloseHandle(threads[1]);

    return 0;
}