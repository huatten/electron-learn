const { app, BrowserWindow, ipcMain } = require('electron/main')
const path = require('node:path')
const createWindow = () => {
    const win = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences:{
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('index.html')
    win.webContents.openDevTools()
}

app.whenReady().then(() => {

    ipcMain.handle('ping', () => 'pong')



    const handleSetTitle = (event, title) => {
        console.log('event from ipcRender', event)
        const webContents = event.sender
        const win = BrowserWindow.fromWebContents(webContents)
        console.log('win', win)
        win.setTitle(title)
    }
    ipcMain.on('set-title', handleSetTitle)

    createWindow()

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