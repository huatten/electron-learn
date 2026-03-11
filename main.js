const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const fs = require('node:fs/promises')
const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences:{
            nodeIntegration: true,
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('index.html')
    win.webContents.openDevTools()

    return win  // ✅ 返回窗口对象
}

app.whenReady().then(() => {

    const handleSetTitle = (event, title) => {
        console.log('event from ipcRender', event)
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        console.log('win', win)
        win.setTitle(title)
    }
    ipcMain.on('set-title', handleSetTitle)


    const handleWriteFile = async (event, content) => {
        console.log('content', content)
        await fs.writeFile('test.txt', content)
        const stats = await fs.stat('test.txt')
        console.log('stats', stats)
        return stats.size
    }

    ipcMain.handle('write-file',handleWriteFile)

    let count = 0
    const win = createWindow()
    // 等待页面加载完成后立即发送第一条消息
    win.webContents.on('did-finish-load', () => {
        win.webContents.send('update-counter', count)
    })
    setInterval(() => {
        count++
        win.webContents.send('update-counter', count)
    },1000)

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow()
        }
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit()
    }
})