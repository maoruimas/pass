$(function() {
    // Utility functions and classes
    function rand(n) {
        return Math.floor(Math.random() * n);
    }
    function parseDataJson(json) {
        let arr = JSON.parse(json);
        if (!(arr instanceof Array)) {
            throw new Error('Invalid data format.');
        }
        for (let e of arr) {
            if (typeof e !== 'object') {
                throw new Error('Invalid data format.');
            }
            if (typeof e.tit !== 'string' || typeof e.des !== 'string' || typeof e.usr !== 'string' || typeof e.pwd !== 'string' || !(e.fds instanceof Array)) {
                throw new Error('Invalid data format.');
            }
            for (let f of e.fds) {
                if (typeof f !== 'object') {
                    throw new Error('Invalid data format.');
                }
                if (typeof f.name !== 'string' || typeof f.cont !== 'string' || typeof f.disp !== 'boolean') {
                    throw new Error('Invalid data format.');
                }
            }
        }
        return arr;
    }

    let Server = {
        request: async function (api, params) {
            let form = new FormData();
            for (let key in params) {
                form.append(key, params[key]);
            }

            let r = await fetch(`php/${api}.php`, {
                method: 'POST',
                body: form
            });

            if (!r.ok) {
                throw new Error(`${r.status} ${r.statusText}`);
            }

            let json = await r.text();
            let response = JSON.parse(json);

            if (response.retcode === 0) {
                return response.data;
            } else {
                throw new Error(response.message);
            }
        }
    }

    let Cipher = {
        encrypt: function (plainText, key) {
            return CryptoJS.AES.encrypt(plainText, key).toString();
        },
        decrypt: function (cipherText, key) {
            let t = CryptoJS.AES.decrypt(cipherText, key);
            return CryptoJS.enc.Utf8.stringify(t);
        },
        getHash: function (plainText) {
            return CryptoJS.SHA256(plainText).toString();
        }
    }


    // Components

    /**
     * Events
     */
    Vue.component('menu-button', {
        model: {
            prop: 'show',
            event: 'change'
        },
        props: {
            show: Boolean,
            disabled: Boolean
        },
        template: `
<div class='menu-button'>
    <div :class='{button: true, disabled: disabled, checked: show}' @click='if (!disabled) $emit("change", !show)'>
        <slot></slot>
    </div>
    <transition name='drop'>
        <div class='button-menu' v-show='show'>
            <slot name='menu'></slot>
        </div>
    </transition>
</div>
        `
    });

    /**
     * Events:
     * - login(username, password, entryList)
     * - logout()
     */
    Vue.component('login-dialog', {
        props: {
            username: String,
            password: String,
            online: Boolean
        },
        data() {
            return {
                tempUsername: '',
                tempPassword: '',
                status: 'error',
                message: '用户名或密码不得为空'
            };
        },
        methods: {
            signup() {
                this.status = 'pending';
                this.message = '注册中';

                let hash = Cipher.getHash(this.tempPassword);
                let data = Cipher.encrypt('[]', hash);

                Server.request('addUser', {name: this.tempUsername, pwd: this.tempPassword, data: data})
                    .then(() => {
                        this.$emit('login', this.tempUsername, this.tempPassword, []);
                    })
                    .catch(e => {
                        this.status = 'error';
                        this.message = e.message;
                    });
            },
            signin() {
                this.status = 'pending';
                this.message = '登陆中';

                let hash = Cipher.getHash(this.tempPassword);

                Server.request('getData', {name: this.tempUsername, pwd: this.tempPassword})
                    .then(data => {
                        let json = Cipher.decrypt(data, hash);
                        try {
                            this.$emit('login', this.tempUsername, this.tempPassword, JSON.parse(json));
                        } catch(e) {
                            this.status = 'error';
                            this.message = e.message;
                        }
                    })
                    .catch(e => {
                        this.status = 'error';
                        this.message = e.message;
                    });
            },
            signout() {
                this.tempUsername = '';
                this.tempPassword = '';
                this.$emit('logout');
            },
            checkUsernamePassword() {
                if (this.tempUsername && this.tempPassword) {
                    this.status = 'good';
                    this.message = '很好';
                } else {
                    this.status = 'error';
                    this.message = '用户名或密码不得为空';
                }
            }
        },
        watch: {
            tempUsername() {
                this.checkUsernamePassword();
            },
            tempPassword() {
                this.checkUsernamePassword();
            }
        },
        template: `
<div>
    <div v-if='online'>
        <b>{{username}}</b>, <span class='button' @click='signout'><i class='icon-logout'></i> 退出登陆 </span>
    </div>
    <div v-else>
        <input class='textfield' placeholder='用户名' v-model='tempUsername' :disabled='status === "pending"'>
        <input class='textfield' placeholder='密码' v-model='tempPassword' :disabled='status === "pending"'>
        <div>
            <i :class='"icon-"+status'></i>
            <span>{{message}}</span>
        </div>
        <div class='spaced'>
            <span :class='{button: true, disabled: status !== "good"}' @click='if (status === "good") signup()'><i class='icon-user-plus'></i> 注册 </span>
            <div :class='{button: true, disabled: status !== "good"}' @click='if (status === "good") signin()'><i class='icon-login'></i> 登陆 </span>
        </div>
    </div>
</div>
        `
    });

    /**
     * Events:
     * - option(op)
     */
    Vue.component('option-menu', {
        template: `
<div>
    <div @click='$emit("option", "import")'>
        <i class='icon-download'></i>
        <span>导入</span>
    </div>
    <div @click='$emit("option", "export")'>
        <i class='icon-upload'></i>
        <span>导出</span>
    </div>
    <div @click='$emit("option", "changeUsername")'>
        <i class='icon-user'></i>
        <span>修改用户名</span>
    </div>
    <div @click='$emit("option", "changePassword")'>
        <i class='icon-key'></i>
        <span>修改密码</span>
    </div>
    <div @click='$emit("option", "deleteAccount")'>
        <i class='icon-user-times'></i>
        <span>注销账户</span>
    </div>
</div>
        `
    });

    /**
     * Events:
     * - select(index)
     */
    Vue.component('entry-list', {
        props: {
            entryList: Array,
            selectedIndex: Number,
            disabled: Boolean
        },
        data() {
            return {
                keywords: ''
            }
        },
        computed: {
            filteredEntryList() {
                let keys = this.keywords.trim().split(/\s+/);
                let ret = [];

                // newly added entry appears first
                if (this.selectedIndex === this.entryList.length) {
                    ret.push({
                        index: this.selectedIndex,
                        tit: '新建条目标题',
                        des: '新建条目详情'
                    })
                }

                // newest first
                for (let i = this.entryList.length - 1; i >= 0; --i) {
                    let e = this.entryList[i];
                    for (let k of keys) {
                        if (e.tit.indexOf(k) !== -1 || e.des.indexOf(k) !== -1) {
                            ret.push({
                                index: i,
                                tit: e.tit,
                                des: e.des
                            });
                            break;
                        }
                    }
                }
                return ret;
            }
        },
        methods: {
            selectEntry(i) {
                this.$emit('select', i);
            },
            addEntry() {
                this.$emit('select', this.entryList.length);
            }
        },
        /*
        mounted() {
            if (this.entryList.length) {
                this.$emit('select', 0);
            }
        },
        */
        template: `
<div>
    <div id='left-panel-header'>
        <input class='textfield' :placeholder='"搜索 "+entryList.length+" 个条目"' v-model='keywords' :disabled='disabled'>
        <i :class='{button: true, "icon-plus": true, disabled: disabled}' @click='if (!disabled) addEntry()'></i>
    </div>
    <div v-for='e in filteredEntryList' :class='{entry: true, selected: e.index === selectedIndex}' @click='selectEntry(e.index)'>
        <div class='entry-title'>{{e.tit}}</div>
        <div class='entry-description'>{{e.des}}</div>
    </div>
    <div class='list-bottom'>到底了～</div>
</div>
        `
    });

    /**
     * Events:
     * - back()
     * - remove()
     * - change(entry)
     * - copy(text)
     */
    Vue.component('entry-editor', {
        props: ['entry'],
        data() {
            return {
                editing: false,
                display: false,
                tempField: [],
                genUseNum: true,
                genUseLow: true,
                genUseUpp: true,
                genUseSym: true,
                genLength: 15
            }
        },
        methods: {
            save() {
                if (!confirm('确认保存？')) return;
                let tempEntry = {};
                tempEntry['tit'] = this.tempField[0].cont;
                tempEntry['des'] = this.tempField[1].cont;
                tempEntry['usr'] = this.tempField[2].cont;
                tempEntry['pwd'] = this.tempField[3].cont;
                tempEntry['fds'] = [];
                for (let i = 4; i < this.tempField.length; ++i) {
                    tempEntry['fds'].push({
                        'name': this.tempField[i].name,
                        'cont': this.tempField[i].cont,
                        'disp': this.tempField[i].disp
                    });
                }
                this.$emit('change', tempEntry);
                this.editing = false;
            },
            edit() {
                this.editing = true;
            },
            cancel() {
                if (!confirm('确认丢弃未保存的更改？')) return;
                this.constructTempField();
                this.editing = false;
            },
            constructTempField() {
                this.tempField = [];
                this.tempField.push({
                    name: '标题',
                    cont: this.entry.tit,
                    disp: true
                });
                this.tempField.push({
                    name: '详情',
                    cont: this.entry.des,
                    disp: true
                });
                this.tempField.push({
                    name: '用户',
                    cont: this.entry.usr,
                    disp: true
                });
                this.tempField.push({
                    name: '密码',
                    cont: this.entry.pwd,
                    disp: false
                });
                for (let f of this.entry.fds) {
                    this.tempField.push({
                        name: f.name,
                        cont: f.cont,
                        disp: f.disp
                    });
                }
            },
            addField() {
                this.tempField.push({ name: '', cont: '', disp: true });
            },
            removeField(i) {
                this.tempField.splice(i, 1);
            },
            genRandomString(i) {
                let charset = [];
                if (this.genUseNum) charset.push('0123456789');
                if (this.genUseLow) charset.push('abcdefghijklmnopqrstuvwxyz');
                if (this.genUseUpp) charset.push('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
                if (this.genUseSym) charset.push('!@#$%^&*()[]{}-_=+|;:,.?');

                if (charset.length === 0) {
                    // Output an empty string if no type is selected
                    this.tempField[i].cont = '';
                    return;
                }

                let chararr = [];
                for (let i = 0; i < this.genLength; ++i) {
                    if (i < charset.length) {
                        // Use at least one of the chosen type if possible
                        chararr.push(charset[i][rand(charset[i].length)]);
                    } else {
                        let j = rand(charset.length);
                        chararr.push(charset[j][rand(charset[j].length)]);
                    }
                }

                // Shuffle
                for (let i = 0; i < chararr.length; ++i) {
                    let j = rand(chararr.length - i);
                    [chararr[i], chararr[j]] = [chararr[j], chararr[i]];
                }

                this.tempField[i].cont = chararr.join('');
            }
        },
        watch: {
            entry() {
                if (this.entry !== false) {
                    this.constructTempField();
                    this.display = false;
                    this.editing = this.entry.isNew ? true : false;
                } else {
                    this.tempField = [];
                }
            }
        },
        mounted() {
            if (this.entry !== false) {
                this.constructTempField();
            }
        },
        template: `
<div v-if='entry !== false'>
    <div id='right-panel-header' class='repel'>
        <i class='button icon-left-big' @click='$emit("back")'></i>
        <div v-if='editing'>
            <i class='button icon-plus' @click='addField'></i>
            <i class='button icon-floppy' @click='save'></i>
            <i class='button icon-cancel' @click='cancel'></i>
        </div>
        <div v-else>
            <i :class='[display ? "button icon-eye-off" : "button icon-eye"]' @click='display = !display'></i>
            <i class='button icon-trash' @click='$emit("remove")'></i>
            <i class='button icon-edit' @click='edit'></i>
        </div>
    </div>
    <div v-for='(f, i) in tempField' class='field'>
        <div v-if='editing'>
            <div class='repel'>
                <div class='field-name'>字段名</div>
                <div v-if='i > 3'>
                    <i class='icon-cancel-circled' @click='removeField(i)'></i>
                </div>
            </div>
            <input class='textfield' v-model='f.name' :disabled='i < 4'>
            <div class='repel'>
                <div class='field-name'>字段内容</div>
                <div>
                    <i :class='[f.disp ? "icon-eye" : "icon-eye-off"]' v-if='i > 3' @click='f.disp = !f.disp'></i>
                    <i class='icon-lightbulb' v-if='i > 1' @click='genRandomString(i)'></i>
                </div>
            </div>
            <input class='textfield' v-model='f.cont'>
        </div>
        <div v-else>
            <div class='field-name'>{{f.name}}</div>
            <div class='repel' v-if='f.cont'>
                <div class='field-content'>{{display || f.disp ? f.cont : '●●●●●●'}}</div>
                <i class='icon-clone' @click='$emit("copy", f.cont)'></i>
            </div>
        </div>
    </div>
    <div v-if='editing' class='generator'>
        <div>
            <i class='icon-lightbulb'></i>
            <span>随机生成器设置</span>
        </div>
        <div class='repel'>
            <span>
                <input type="checkbox" v-model='genUseNum'>
                <span>0-9</span>
            </span>
            <span>
                <input type="checkbox" v-model='genUseLow'>
                <span>a-z</span>
            </span>
            <span>
                <input type="checkbox" v-model='genUseUpp'>
                <span>A-Z</span>
            </span>
            <span>
                <input type="checkbox" v-model='genUseSym'>
                <span>特殊符号</span>
            </span>
        </div>
        <div class='repel'>
            <span>长度</span>
            <input type="range" class='generator-range' min='1' max='30' v-model='genLength'>
            <span>{{genLength}}</span>
        </div>
    </div>
</div>
        `
    });

    /**
     * Events:
     */
    Vue.component('pop-message', {
        model: {
            prop: 'show',
            event: 'hide'
        },
        props: {
            show: Boolean,
            error: Boolean,
            message: String
        },
        watch: {
            show() {
                if (this.show) {
                    setTimeout(() => {
                        this.$emit('hide', false);
                    }, 1000);
                }
            }
        },
        template: `
<transition name='drop'>
    <div class='message' v-show='show'>
        <span :class='[error ? "message-error" : "message-good"]'>{{message}}</span>
    </div>
</transition>
        `
    });

    // App
    let app = new Vue({
        el: '#app',
        data: {
            entryList: [],
            selectedIndex: -1,
            showLoginDialog: false,
            showOptionMenu: false,
            showPopMessage: false,
            message: '',
            error: false,
            username: '',
            password: '',
            online: false
        },
        computed: {
            selectedEntry() {
                if (this.selectedIndex < 0) {
                    return false;
                } else if (this.selectedIndex < this.entryList.length) {
                    return this.entryList[this.selectedIndex];
                } else {
                    // For editing added entry
                    return { tit: '', des: '', usr: '', pwd: '', fds: [], isNew: true };
                }
            }
        },
        watch: {
            showLoginDialog() {
                if (this.showLoginDialog) {
                    this.showOptionMenu = false;
                }
            },
            showOptionMenu() {
                if (this.showOptionMenu) {
                    this.showLoginDialog = false;
                }
            }
        },
        methods: {
            login(username, password, entryList) {
                this.username = username;
                this.password = password;
                this.setEntryList(entryList);
                this.online = true;
                this.showLoginDialog = false;
                this.popMessage('欢迎，'+this.username, false);
            },
            logout() {
                this.username = '';
                this.password = '';
                this.entryList = [];
                this.online = false;
                this.selectedIndex = -1;
            },
            selectEntry(i) {
                if (window.innerWidth <= 600) {
                    $('#content').animate({left: `-${window.innerWidth}px`}, 'fast');
                }
                this.selectedIndex = i;
            },
            backToList() {
                if (window.innerWidth <= 600) {
                    $('#content').animate({ left: `0px` }, 'fast');
                }
                if (this.selectedIndex >= this.entryList.length) {
                    this.selectedIndex = -1;
                }
            },
            removeEntry() {
                if (this.selectedIndex < 0) {
                } else if (this.selectedIndex < this.entryList.length) {
                    if (!confirm('确认删除？')) return;
                    this.entryList.splice(this.selectedIndex, 1);
                    this.selectedIndex = -1;
                    this.saveData();
                } else {
                    this.selectedIndex = -1;
                }
                this.backToList();
            },
            changeEntry(entry) {
                if (this.selectedIndex < 0) {
                } else if (this.selectedIndex < this.entryList.length) {
                    this.$set(this.entryList, this.selectedIndex, entry);
                    this.saveData();
                } else {
                    this.entryList.push(entry);
                    this.saveData();
                }
            },
            copy(text) {
                let clipboard = document.querySelector('#clipboard');
                clipboard.value = text;
                clipboard.select();
                if (document.execCommand('copy')) {
                    this.popMessage('复制成功', false);
                } else {
                    this.popMessage('无法写入剪贴板', true);
                }
            },
            option(op) {
                switch(op) {
                    case 'import': {
                        if (this.entryList.length > 0 && !confirm('导入数据将清空原始数据，是否继续？')) break;
                        let fileInput = document.querySelector('#file-input');
                        $(fileInput).click();
                        fileInput.onchange = () => {
                            console.log(fileInput);
                            let fr = new FileReader();
                            fr.onload = () => {
                                try {
                                    let arr = parseDataJson(fr.result);
                                    this.setEntryList(arr);
                                    this.saveData();
                                } catch(e) {
                                    this.popMessage(e.message, true);
                                }
                            }
                            fr.readAsText(fileInput.files[0]);
                            fileInput.value = '';
                        }
                        break;
                    }
                    case 'export': {
                        var a = document.createElement('a');
                        var e = document.createEvent('MouseEvents');
                        e.initEvent('click', false, false);
                        a.download = this.username;
                        var blob = new Blob([JSON.stringify(this.entryList)]);
                        a.href = URL.createObjectURL(blob);
                        a.dispatchEvent(e);
                        break;
                    }
                    case 'changeUsername': {
                        let newName = prompt('输入新用户名');
                        if (!newName) {
                            this.popMessage('用户名不得为空', true);
                            break;
                        }
                        Server.request('setUser', {
                            name: this.username,
                            pwd: this.password,
                            newName: newName
                        })
                            .then(() => {
                                this.username = newName;
                                this.popMessage('用户名修改成功', false);
                            })
                            .catch(e => {
                                this.popMessage(e.message, true);
                            });
                        break;
                    }
                    case 'changePassword': {
                        let newPwd = prompt('输入新密码');
                        if (!newPwd) {
                            this.popMessage('密码不得为空', true);
                            break;
                        }
                        Server.request('setUser', {
                            name: this.username,
                            pwd: this.password,
                            newPwd: newPwd
                        })
                            .then(() => {
                                this.password = newPwd;
                                this.popMessage('密码修改成功', false);
                            })
                            .catch(e => {
                                this.popMessage(e.message, true);
                            });
                        break;
                    }
                    case 'deleteAccount': {
                        if (!confirm('确认注销账户？')) break;
                        Server.request('delUser', {
                            name: this.username,
                            pwd: this.password
                        })
                            .then(() => {
                                this.logout();
                                this.popMessage('注销成功', false);
                            })
                            .catch(e => {
                                this.popMessage(e.message, true);
                            });
                        break;
                    }
                    default: break;
                }
                this.showOptionMenu = false;
            },
            // help functions
            saveData() {
                let hash = Cipher.getHash(this.password);
                let data = Cipher.encrypt(JSON.stringify(this.entryList), hash);

                Server.request('setData', {name: this.username, pwd: this.password, data: data})
                    .then(() => {
                        this.popMessage('保存成功', false);
                    })
                    .catch(e => {
                        this.popMessage(e.message, true);
                    });
            },
            setEntryList(entryList) {
                this.entryList = [];
                for (let i = 0; i < entryList.length; ++i) {
                    this.$set(this.entryList, i, entryList[i]);
                }
            },
            popMessage(message, error) {
                this.message = message;
                this.error = error;
                this.showPopMessage = true;
            }
        }
    });
});