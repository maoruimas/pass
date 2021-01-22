function q(s) {
    return document.querySelector(s);
}

const parent = window.parent;
let data = {};
let history = []; // [{usr: '', cnt: 0}]

const backBtn = q('.icon-left-open');
const viewBtn = q('#viewbuttons i:nth-child(1)');
const editBtn = q('.icon-pencil');
const viewBtns = q('#viewbuttons');
const addBtn = q('.icon-plus');
const saveBtn = q('.icon-ok');
const editBtns = q('#editbuttons');
const listview = q('#listview');
const pageTitle = q('#page-title');
const gen = q('#gen');
const genError = q('#gen .dialog-error');
const genCancel = q('#gen .dialog-cancel');
const genConfirm = q('#gen .dialog-button');
const genInputs = document.querySelectorAll('#gen input');
let genTarget;
const hisMenu = q('#history .menu');
const hisPop = q('#history');
let hisTarget;

const num = '0123456789';
const low = 'abcdefghijklmnopqrstuvwxyz';
const upp = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const pun = '!@#$%^&*()[]{}-_=+|;:,.?';

function init() {
    data = parent.getItem();
    history = parent.getHistory();
    if (data) {
        displayData();
    } else {
        data = { tit: '', des: '', usr: '', pwd: '', fds: [] };
        displayEditableData();
    }
}

function displayData() {
    if ($(viewBtn).hasClass('icon-eye'))
        $(viewBtn).removeClass('icon-eye').addClass('icon-eye-off');
    pageTitle.textContent = '查看';
    $(editBtns).hide();
    $(viewBtns).show();

    listview.innerHTML = '';
    const fragment = document.createDocumentFragment();
    function insertLi(index, name, cont, disp) {
        const li = document.createElement('li');
        li.id = `li-${index}`;
        li.innerHTML = `<div class='name'><div class='textfield'>${name}</div></div><div class='cont'><div class='textfield'>${disp ? cont : cont ? '••••••' : ''}</div><div class='opt'><i class='icon-clone'></i></div></div>`;
        fragment.appendChild(li);
    }
    insertLi('t', '标题', data.tit, true);
    insertLi('d', '描述', data.des, true);
    insertLi('u', '用户名', data.usr, true);
    insertLi('p', '密码', data.pwd, false);
    data.fds.forEach((triple, index) => {
        insertLi(index, triple.name, triple.cont, triple.disp);
    });
    listview.appendChild(fragment);
}

function displayEditableData() {
    pageTitle.textContent = '编辑';
    $(viewBtns).hide();
    $(editBtns).show();

    listview.innerHTML  = '';
    const fragment = document.createDocumentFragment();
    function insertLi(type, name, cont, disp) {
        const li = document.createElement('li');
        li.innerHTML = `<div class='name'><div class='textfield'${type ? '' : ' contenteditable'}>${name}</div>${type ? '' : "<div class='opt'><i class='icon-move'></i><i class='icon-cancel-circled'></i></div>"}</div><div class='cont'><div class='textfield' contenteditable>${cont}</div><div class='opt'>${(type === 't' || type === 'd') ? '' : `<i class='icon-${type === 'u' ? 'history' : 'magic'}'></i>`}${type ? '' : `<i class='icon-${disp ? 'eye' : 'eye-off'}'></i>`}</div></div>`;
        fragment.appendChild(li);
    }
    insertLi('t', '标题', data.tit);
    insertLi('d', '描述', data.des);
    insertLi('u', '用户名', data.usr);
    insertLi('p', '密码', data.pwd);
    data.fds.forEach(triple => {
        insertLi(0, triple.name, triple.cont, triple.disp);
    });
    listview.appendChild(fragment);
}

function displayHistoryMenu() {
    let html = '';
    for (let h of history) {
        html += `<div class='menu-item'>${h.usr}</div>`
    }
    hisMenu.innerHTML = html;

    $(hisPop).fadeIn(100);
}

function buildBindings() {
    backBtn.onclick = parent.closePage;
    viewBtn.onclick = toggleView;
    listview.onclick = e => {
        if (e.target.className === 'icon-clone') {
            let id = e.target.parentNode.parentNode.parentNode.id.replace('li-', '');
            if (isNaN(parseInt(id))) {
                switch(id) {
                    case 't': parent.writeClipboard(data.tit); break;
                    case 'd': parent.writeClipboard(data.des); break;
                    case 'u': parent.writeClipboard(data.usr); break;
                    case 'p': parent.writeClipboard(data.pwd); break;
                }
            } else {
                parent.writeClipboard(data.fds[parseInt(id)].cont);
            }
        } else if (e.target.className === 'icon-eye') {
            e.target.className = 'icon-eye-off';
        } else if (e.target.className === 'icon-eye-off') {
            e.target.className = 'icon-eye';
        } else if (e.target.className === 'icon-magic') {
            genTarget = e.target.parentNode.parentNode.firstChild;
            $(gen).fadeIn(100);
        } else if (e.target.className === 'icon-history') {
            hisTarget = e.target.parentNode.parentNode.firstChild;
            displayHistoryMenu();
        } else if (e.target.className === 'icon-cancel-circled') {
            if (confirm('确认删除？')) {
                $(e.target.parentNode.parentNode.parentNode).remove();
            }
        }
    }
    editBtn.onclick = displayEditableData;
    saveBtn.onclick = save;
    genCancel.onclick = () => $(gen).fadeOut(100);
    genConfirm.onclick = genRandKey;
    addBtn.onclick = add;
    hisPop.onclick = e => {
        if (e.target.id === 'history') {
        } else if (e.target.className === 'menu-item') {
            hisTarget.textContent = e.target.textContent;
        }
        $(hisPop).fadeOut();
    }

}

function toggleView() {
    if ($(viewBtn).hasClass('icon-eye-off')) {
        $(viewBtn).removeClass('icon-eye-off').addClass('icon-eye');
        $('#li-p .cont .textfield').text(data.pwd);
        data.fds.forEach((triple, index) => {
            if (!triple.disp) {
                $(`#li-${index} .cont .textfield`).text(triple.cont);
            }
        })
    } else {
        $(viewBtn).removeClass('icon-eye').addClass('icon-eye-off');
        let tf = $('#li-p .cont .textfield');
        if (tf.text()) tf.text('●●●●●●');
        data.fds.forEach((triple, index) => {
            if (!triple.disp) {
                tf = $(`#li-${index} .cont .textfield`)
                if (tf.text()) tf.text('●●●●●●');
            }
        })
    }
}

function save() {
    data.fds = [];
    $('#listview li').each((index, li) => {
        let cont = $(li).find('.cont .textfield').text();
        switch(index) {
            case 0: data.tit = cont; break;
            case 1: data.des = cont; break;
            case 2: data.usr = cont; break;
            case 3: data.pwd = cont; break;
            default: data.fds[index - 4] = {
                name: $(li).find('.name .textfield').text(),
                cont: cont,
                disp: $(li).find('.cont i:nth-of-type(2)').prop('class') === 'icon-eye'
            };
        }
    });
    parent.setItem(data);

    displayData();
}

function add() {
    $(listview).append("<li><div class='name'><div class='textfield' contenteditable></div><div class='opt'><i class='icon-move'></i><i class='icon-cancel-circled'></i></div></div><div class='cont'><div class='textfield' contenteditable></div><div class='opt'><i class='icon-magic'></i><i class='icon-eye'></i></div></div></li>");
}

function rand(n) {
    return Math.floor(Math.random() * n);
}

function genRandKey() {
    let length = genInputs[0].value;
    
    let srcArr = [];
    if (genInputs[1].checked) srcArr.push(num);
    if (genInputs[2].checked) srcArr.push(low);
    if (genInputs[3].checked) srcArr.push(upp);
    if (genInputs[4].checked) srcArr.push(pun);

    if (srcArr.length === 0  || srcArr.length > length) {
        genError.textContent = '参数不合法';
        return;
    }

    let keyArr = [], i, j;
    for (i = 0; i < srcArr.length; ++i) {
        keyArr.push(srcArr[i][rand(srcArr[i].length)]);
    }
    for (j = srcArr.length; j < length; ++j) {
        i = rand(srcArr.length);
        keyArr.push(srcArr[i][rand(srcArr[i].length)]);
    }

    for (i = 0; i < length - 1; ++i) {
        j = i + rand(length - i);
        [keyArr[i], keyArr[j]] = [keyArr[j], keyArr[i]];
    }

    genTarget.textContent = keyArr.join('');
    $(gen).fadeOut(100);
}

buildBindings();
