function q(s) {
    return document.querySelector(s);
}

const listview = q('#listview');
const mainpage = q('#mainpage');
const page = q('iframe#page');
const login = q('#login');
const loginTitle = q('#login .dialog-title');
const loginOpt = q('#login a.dialog-a');
const loginUsr = q('#login #login-usr');
const loginPwd = q('#login #login-pwd');
const loginErr = q('#login .dialog-error');
const loginConfirm = q('#login .dialog-button');
const tip = q('#tip');
const drawer = q('.drawer');
const drawerTitle = q('.drawer-title');
const menu = q('#menu');
const menuBtn = q('#toolbar .icon-menu');
const importBtn = q('#import-btn');
const exportBtn = q('#export-btn');
const renameBtn = q('#rename-btn');
const deleteBtn = q('#delete-btn');
const logoutBtn = q('#logout-btn');
const uploadFile = q('#upload-file');
const searchField = q('#search');
const clipboard = q('#clipboard');
const addBtn = q('#toolbar .icon-plus');
const rn = q('#rename');
const rnUsr = q('#rename-usr');
const rnError = q('#rename .dialog-error');
const rnCancel = q('#rename .dialog-cancel');
const rnConfirm = q('#rename .dialog-button');

let data = [];
let viewId = 0;

function displayData() {
    listview.innerHTML = '';
    const fragment = document.createDocumentFragment();
    data.forEach((item, index) => {
        // set options
        let opt = '';
        if (item.usr) opt += `<i class='icon-user'></i>`;
        if (item.pwd) opt += `<i class='icon-key'></i>`;
        opt += `<i class='icon-trash'></i>`;
        // set li
        const li = document.createElement('li');
        li.innerHTML = `<a class='tit'>${item.tit}</a><br><span class='des'>${item.des}</span><div class='opt'>${opt}</div>`;
        li.id = `li-${index}`;
        // append
        fragment.appendChild(li);
    });
    listview.appendChild(fragment);
}

function buildBindings() {
    listview.addEventListener('click', e => {
        if (e.target.nodeName === 'I') {
            let index = parseInt(e.target.parentNode.parentNode.id.replace('li-', ''));
            if (e.target.className === 'icon-user') {
                writeClipboard(data[index].usr);
            } else if (e.target.className === 'icon-key') {
                writeClipboard(data[index].pwd);
            } else if (e.target.className === 'icon-trash') {
                if (confirm('确认删除？')) {
                    data.splice(index, 1);
                    update();
                }
            }
        } else if (e.target.className === 'tit') {
            viewId = parseInt(e.target.parentNode.id.replace('li-', ''));
            loadPage();
        } else if (e.target.className === 'des') {
            let index = parseInt(e.target.parentNode.id.replace('li-', ''));
            writeClipboard(data[index].des);
        }
    });
    rnUsr.onclick = e => isEnter(e, rename);
    menuBtn.onclick = openDrawer;
    menu.onclick = closeDrawer;
    searchField.oninput = search;
    addBtn.onclick = add;
    importBtn.onclick = function() {
        if (data.length === 0 || confirm('导入数据将清空原始数据，是否继续？')) {
            $(uploadFile).click();
        }
    }
    uploadFile.onchange = function() {
        importFile(this.files[0]);
        this.value = '';
    }
    exportBtn.onclick = exportFile;
    logoutBtn.onclick = logout;
    renameBtn.onclick = openRenameDialog;
    rnCancel.onclick = () => $(rn).fadeOut(100);
    rnConfirm.onclick = rename;
    deleteBtn.onclick = deleteAccount;
}

let scrollT;

function loadPage() {
    page.contentWindow.init();
    $(page).show();
    scrollT = $('html').scrollTop();
    $(mainpage).hide();
}

function closePage() {
    $(mainpage).show();
    $('html').scrollTop(scrollT);
    $(page).fadeOut(100);
}

function getItem() {
    return data[viewId];
}

function setItem(item) {
    data[viewId] = item;
    update();
}

function writeClipboard(text) {
    clipboard.value = text;
    clipboard.select();
    if (document.execCommand('copy')) {
        toggleTip('已复制');
    } else {
        toggleTip('无法写入剪贴板', true);
    }
}

function toggleTip(text, error) {
    tip.textContent = text;
    tip.style.background = error ? 'red' : 'green';
    $(tip).fadeIn(100).delay(1000).fadeOut(100);
}

async function post(method, form) {
    let response = await fetch(`php/${method}.php`, {
        method: 'POST',
        body: form
    });
    if (!response.ok) {
        loginErr.textContent = '网络错误';
        return false;
    }
    return response.text();
}

async function signin() {
    let form = new FormData()
    form.append('username', loginUsr.value);
    let result = await post('signin', form);
    if (result === '') {
        loginErr.textContent = '用户不存在';
    } else if (result) {
        try {
            getDecryptedData(result);
        } catch(e) {
            loginErr.textContent = '密码错误';
            return;
        }
        drawerTitle.textContent = loginUsr.value;
        $(login).fadeOut(100);
        displayData();
        toggleTip('登录成功');
    }
}

async function signup() {
    data = [];
    let form = new FormData()
    form.append('username', loginUsr.value);
    form.append('data', getEncryptedData());
    let result = await post('signup', form);
    if (result) {
        loginErr.textContent = result;
    } else if (result === '') {
        drawerTitle.textContent = loginUsr.value;
        $(login).fadeOut(100);
        displayData();
        toggleTip('注册成功');
    }
}

async function update() {
    let form = new FormData()
    form.append('username', loginUsr.value);
    form.append('data', getEncryptedData());
    let result = await post('update', form);
    if (result) {
        toggleTip(result, true);
    } else if (result === '') {
        displayData();
        toggleTip('更新成功');
    }
}

async function rename() {
    if (rnUsr.value === '') {
        rnError.textContent = '用户名不得为空'
        return;
    }
    let form = new FormData()
    form.append('old', loginUsr.value);
    form.append('new', rnUsr.value);
    let result = await post('rename', form);
    if (result) {
        rnError.textContent = result;
    } else if (result === '') {
        loginUsr.value = rnUsr.value;
        drawerTitle.textContent = rnUsr.value;
        $(rn).fadeOut(100);
        toggleTip('重命名成功');
    }
}

async function deleteAccount() {
    if (!confirm('删除后账户信息无法找回，是否继续？')) {
        return;
    }
    let form = new FormData()
    form.append('username', loginUsr.value);
    let result = await post('delete', form);
    if (result) {
        toggleTip(result, true);
    } else if (result === '') {
        toggleTip('删除成功');
        openSigninDialog();
    }
}

function openSigninDialog() {
    loginTitle.textContent = '登录';
    loginOpt.textContent = '注册';
    loginUsr.value = '';
    loginPwd.value = '';
    loginErr.textContent = '';
    loginConfirm.textContent = '登录';

    loginOpt.onclick = openSignupDialog;
    loginPwd.onkeydown = e => isEnter(e, signin);
    loginConfirm.onclick = signin;
    $(login).show();
}

function openSignupDialog() {
    loginTitle.textContent = '注册';
    loginOpt.textContent = '登录';
    loginUsr.value = '';
    loginPwd.value = '';
    loginErr.textContent = '';
    loginConfirm.textContent = '注册';

    loginOpt.onclick = openSigninDialog;
    loginPwd.onkeydown = e => isEnter(e, signup);
    loginConfirm.onclick = signup;
    $(login).show();
}

function openRenameDialog() {
    rnUsr.value = '';
    rnError.textContent = '';
    $(rn).fadeIn(100);
}

function openDrawer() {
    $(menu).show();
    drawer.style.left = -drawer.offsetWidth + 'px';
    $(drawer).animate({left: '0'}, 100);
}

function closeDrawer() {
    $(drawer).animate({left: -drawer.offsetWidth + 'px'}, 100, () => $(menu).hide());
}

function validateJson(json) {
    let arr;
    try {
        arr = JSON.parse(json);
    } catch(e) {
        return false;
    }
    if (!(arr instanceof Array)) {
        return false;
    }
    for (var obj of arr) {
        if (typeof obj !== 'object') {
            return false;
        }
        if (typeof obj.tit !== 'string' || typeof obj.des !== 'string' || typeof obj.usr !== 'string' || typeof obj.pwd !== 'string') {
            return false;
        }
        if (!(obj.fds instanceof Array)) {
            return false;
        }
        for (var fd of obj.fds) {
            if (typeof fd !== 'object') {
                return false;
            }
            if (typeof fd.name !== 'string' || typeof fd.cont !== 'string' || typeof fd.disp !== 'boolean') {
                return false;
            }
        }
    }
    return arr;
}

function importFile(file) {
    let fr = new FileReader();
    fr.onload = evt => {
        let arr = validateJson(fr.result);
        if (arr) {
            data = arr;
            update();
        }
    };
    fr.readAsText(file);
}

function download(text, name) {
    var a = document.createElement('a');
    var e = document.createEvent('MouseEvents');
    e.initEvent('click', false, false);
    a.download = name;
    var blob = new Blob([text]);
    a.href = URL.createObjectURL(blob);
    a.dispatchEvent(e);
}

function exportFile() {
    download(JSON.stringify(data), loginUsr.value);
}

function getEncryptedData() {
    return CryptoJS.AES.encrypt(JSON.stringify(data), loginPwd.value).toString();
}

function getDecryptedData(encrypted) {
    let decrypted = CryptoJS.AES.decrypt(encrypted, loginPwd.value);
    let json = CryptoJS.enc.Utf8.stringify(decrypted);
    data = JSON.parse(json); // may throw an error
}

function search() {
    let keywords = searchField.value.trim().split(/\s+/);
    if (keywords.length === 0) {
        $('#listview li').each((index, li) => $(li).show());
        return;
    }
    $('#listview li').each((index, li) => {
        let target = $(li).find('.tit').text() + $(li).find('.des').text();
        let found = false;
        for (var keyword of keywords) {
            if (target.search(new RegExp(keyword, 'i')) !== -1) {
                found = true;
                break;
            }
        }
        if (found) {
            $(li).show();
        } else {
            $(li).hide();
        }
    });
}

function add() {
    if (!(data instanceof Array)) {
        alert('未知错误');
    }
    viewId = data.length;
    loadPage();
}

function logout() {
    data = [];
    listview.innerHTML = '';
    searchField.value = '';
    openSigninDialog();
}

function isEnter(evt, callback) {
    if (evt.key === 'Enter' && typeof callback === 'function') {
        callback();
    }
}

// do stuffs

buildBindings();
openSigninDialog();