const versionElement = document.getElementById('version');

versionElement.innerText = `This app is using Chrome (v${window.versions.chrome()}), Node.js (v${window.versions.node()}), and Electron (v${window.versions.electron()})`


const receiveElement = document.getElementById('receive');
const receiveFun = async() => {
    const response = await window.versions.ping()
    receiveElement.innerText = response
    console.log( response)
}

receiveFun()