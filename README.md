# Electron 学习笔记与总结

## 项目概述

这是一个Electron学习项目，通过实践逐步掌握了Electron应用开发的核心概念，包括窗口创建、进程通信等关键技术。

## 1. 环境安装与配置

### 安装Electron
```bash
# 使用pnpm安装（项目使用pnpm作为包管理器）
pnpm install electron --save-dev

# 或使用npm
npm install electron --save-dev
```

### ⚠️ 注意事项：安装Electron失败解决方案

**问题**：在中国大陆安装Electron时经常失败，因为需要从GitHub下载二进制文件

**解决方案**：
```bash
# 方法1：设置Electron镜像源
npm config set electron_mirror https://npmmirror.com/mirrors/electron/

# 方法2：使用cnpm安装
cnpm install electron --save-dev

# 方法3：手动下载后安装
# 1. 从 https://npmmirror.com/mirrors/electron/ 下载对应版本
# 2. 设置环境变量
export ELECTRON_SKIP_BINARY_DOWNLOAD=1
npm install
```

### 开发工具配置
- 使用nodemon监听文件变化，实现热重载
- package.json配置：
```json
{
  "scripts": {
    "start": "nodemon --watch main.js --exec \"electron .\""
  }
}
```

## 2. 创建第一个窗口

### 基础窗口创建 (main.js)
```javascript
const { app, BrowserWindow } = require('electron')
const path = require('path')

const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('index.html')
    win.webContents.openDevTools()  // 打开开发者工具

    return win  // 重要：必须返回窗口对象
}

// 应用就绪时创建窗口
app.whenReady().then(() => {
    createWindow()
})
```

### 关键点
- 必须等待 `app.whenReady()` 后再创建窗口
- 预加载脚本(preload.js)是连接主进程和渲染进程的安全桥梁
- 窗口对象需要返回以便后续操作

## 3. 三种进程通信模式

### 3.1 渲染进程 → 主进程（单向通信）

**场景**：渲染进程向主进程发送指令，如修改窗口标题

**预加载脚本 (preload.js)**：
```javascript
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('electron', {
    setTitle: (title) => ipcRenderer.send('set-title', title)
})
```

**主进程监听 (main.js)**：
```javascript
const handleSetTitle = (event, title) => {
    const webContents = event.sender
    const win = BrowserWindow.fromWebContents(webContents)
    win.setTitle(title)
}
ipcMain.on('set-title', handleSetTitle)
```

**渲染进程调用 (renderer.js)**：
```javascript
document.getElementById('btn').addEventListener('click', () => {
    window.electron.setTitle(document.getElementById('input').value)
})
```

### 3.2 渲染进程 ↔ 主进程（双向通信）

**场景**：渲染进程请求主进程执行操作并返回结果，如文件操作

**预加载脚本**：
```javascript
contextBridge.exposeInMainWorld('electron', {
    writeFile: (content) => ipcRenderer.invoke('write-file', content)
})
```

**主进程处理**：
```javascript
const handleWriteFile = async (event, content) => {
    await fs.writeFile('test.txt', content)
    const stats = await fs.stat('test.txt')
    return stats.size  // 返回文件大小
}
ipcMain.handle('write-file', handleWriteFile)
```

**渲染进程使用**：
```javascript
const result = await window.electron.writeFile('文件内容')
console.log('文件大小:', result)
```

### 3.3 主进程 → 渲染进程（单向通信）

**场景**：主进程主动推送消息给渲染进程，如定时更新

**预加载脚本**：
```javascript
contextBridge.exposeInMainWorld('electron', {
    onUpdateCounter: (callback) => {
        ipcRenderer.on('update-counter', (_event, value) => callback(value))
    }
})
```

**主进程发送**：
```javascript
// 等待页面加载完成后发送
win.webContents.on('did-finish-load', () => {
    win.webContents.send('update-counter', 1)
})

// 定时发送
setInterval(() => {
    win.webContents.send('update-counter', count++)
}, 1000)
```

**渲染进程接收**：
```javascript
window.electron.onUpdateCounter((value) => {
    document.getElementById('counter').innerText = value
})
```

## 4. 重要概念与最佳实践

### 4.1 进程架构
- **主进程**：负责窗口管理、系统交互
- **渲染进程**：负责页面渲染、用户交互
- **预加载脚本**：安全桥梁，暴露必要API

### 4.2 安全考虑
- 使用 `contextBridge` 而非直接暴露 Node.js API
- 设置内容安全策略(CSP)
- 避免在渲染进程中直接使用 Node.js 模块

#### ⚠️ nodeIntegration 详解

`nodeIntegration` 控制渲染进程是否可以直接使用 Node.js API：

**nodeIntegration: true（不推荐）**
```javascript
// 渲染进程可以直接使用所有 Node.js API
const fs = require('fs')
const { exec } = require('child_process')
// 安全风险极高！XSS攻击可能导致系统被完全控制
```

**nodeIntegration: false（推荐）**
```javascript
// 现代 Electron 应用的默认配置
webPreferences: {
    nodeIntegration: false,     // 禁用 Node.js 集成
    contextIsolation: true,     // 启用上下文隔离
    preload: path.join(__dirname, 'preload.js')
}

// 通过预加载脚本安全暴露功能
contextBridge.exposeInMainWorld('electronAPI', {
    readFile: (path) => require('fs').readFileSync(path, 'utf8')
})
```

**为什么默认禁用？**
1. **XSS攻击风险**：如果网页存在XSS漏洞，攻击者可以执行任意系统命令
2. **数据泄露**：可以访问系统所有文件和资源
3. **权限过大**：渲染进程本不应该拥有系统级权限

**迁移建议**：
- 新项目始终使用 `nodeIntegration: false`
- 老项目逐步迁移到预加载脚本模式
- 只暴露必要的、安全的功能给渲染进程

### 4.3 通信时机
- 主进程向渲染进程发送消息前，必须确保渲染进程已准备好
- 使用 `did-finish-load` 或 `dom-ready` 事件确保页面加载完成
- 避免在窗口创建后立即发送消息

### 4.4 调试技巧
- 使用 `webContents.openDevTools()` 打开开发者工具
- 主进程日志在终端查看，渲染进程日志在 DevTools 查看
- 使用 `console.log` 跟踪通信流程