const versionElement = document.getElementById('version');

versionElement.innerText = `This app is using Chrome (v${window.versions.chrome()}), Node.js (v${window.versions.node()}), and Electron (v${window.versions.electron()})`


const inputElement = document.getElementById('input');
const btnElement = document.getElementById('btn');

btnElement.addEventListener('click', () => {
    window.electron.setTitle(inputElement.value)
})

const iptElement = document.getElementById('ipt');
const handleElement = document.getElementById('handle');
const lenElement = document.getElementById('len');
handleElement.addEventListener('click', async () => {
    const strLength = await window.electron.writeFile(iptElement.value)
    lenElement.innerText = strLength
})

const counterElement = document.getElementById('counter');
window.electron.onUpdateCounter((value) => {
    console.log('update counter', value)
    counterElement.innerText = value
})