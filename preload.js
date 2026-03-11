const {contextBridge,ipcRenderer} = require('electron')

/**
 * 1. 引入 contextBridge 用于安全地在主进程和渲染进程之间暴露 暴露版本信息
 * 2. 通过 contextBridge.exposeInMainWorld 方法，将一个名为 versions 的对象注入到渲染进程的全局作用域中。
 * 3. versions 对象包含三个方法：
 *     - node() - 返回 Node.js 版本号
 *     - chrome() - 返回 Chromium 版本号
 *     - electron() - 返回 Electron 版本号
 * 总结：
 *    这个预加载脚本的主要目的是让渲染进程能够安全地访问版本信息，而不需要直接访问 Node.js 的 process 对象。在渲染进程中，你可以通过 window.versions.node()等方式来获取这些版本信息。
 *    这种通过 contextBridge 暴露 API 的方式是 Electron 推荐的安全实践，可以避免直接暴露完整的 Node.js 能力给渲染进程。
 */

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
})

contextBridge.exposeInMainWorld('electron', {
    setTitle: (title) => ipcRenderer.send('set-title', title),
    writeFile: ( content) => ipcRenderer.invoke('write-file', content),
})