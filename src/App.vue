<template>
  <div id="header" class='repel'>
    <b>Pass</b>
    <div>
      <MenuButton v-model:show="showLoginDialog" :disabled="false">
        <i class="icon-user-circle-o" />
        <template v-slot:menu>
          <LoginDialog
            :username="username"
            :password="password"
            :online="online"
            @login="login"
            @logout="logout"
          />
        </template>
      </MenuButton>
      <MenuButton v-model:show="showOptionMenu" :disabled="!online">
        <i class="icon-ellipsis" />
        <template v-slot:menu>
          <OptionMenu @option="option" />
        </template>
      </MenuButton>
    </div>
  </div>
  <div id="content">
    <div id="left-panel">
      <entry-list
        :entry-list="entryList"
        :selected-index="selectedIndex"
        @select="selectEntry"
        :disabled="!online"
      />
    </div>
    <div id="right-panel">
      <entry-editor
        id="right-panel-content"
        :entry="selectedEntry"
        :history="history"
        @back="backToList"
        @remove="removeEntry"
        @change="changeEntry"
        @copy="copy"
      />
    </div>
  </div>
  <pop-message :show="showPopMessage" :message="message" :status="status" />
  <div id="hidden">
    <input id="clipboard" />
    <input id="file-input" type="file" />
  </div>
</template>

<script>
import $ from "jquery";
import Server from "./utils/server";
import Cipher from "./utils/cipher";
import MenuButton from "./components/MenuButton.vue";
import LoginDialog from "./components/LoginDialog.vue";
import OptionMenu from "./components/OptionMenu.vue";
import EntryList from "./components/EntryList.vue";
import EntryEditor from "./components/EntryEditor.vue";
import popMessage from "./components/PopMessage.vue";
import { reactive } from '@vue/reactivity';

export default {
  name: "App",
  components: {
    MenuButton,
    LoginDialog,
    OptionMenu,
    EntryList,
    EntryEditor,
    popMessage,
  },
  data() {
    return {
      entryList: reactive([]),
      selectedIndex: -1,
      showLoginDialog: false,
      showOptionMenu: false,
      showPopMessage: false,
      message: "",
      status: "good",
      username: "",
      password: "",
      online: false,
    };
  },
  computed: {
    selectedEntry() {
      if (this.selectedIndex < 0) {
        return { isNull: true };
      } else if (this.selectedIndex < this.entryList.length) {
        return this.entryList[this.selectedIndex];
      } else {
        return { tit: "", des: "", usr: "", pwd: "", fds: [], isNew: true };
      }
    },
    history() {
      let set = {};
      for (let e of this.entryList) {
        if (e.usr) {
          set[e.usr] = true;
        }
      }
      let ret = [];
      for (let key in set) {
        ret.push(key);
      }
      return ret;
    },
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
    },
  },
  methods: {
    login(username, password, entryList) {
      this.username = username;
      this.password = password;
      this.entryList = entryList;
      this.online = true;
      this.showLoginDialog = false;
      this.popMessage("欢迎，" + this.username, "good", 1000);
    },
    logout() {
      this.username = "";
      this.password = "";
      this.entryList = [];
      this.online = false;
      this.selectedIndex = -1;
    },
    selectEntry(i) {
      if (window.innerWidth <= 600) {
        $("#content").css("left", `-${window.innerWidth}px`);
      }
      this.selectedIndex = i;
    },
    backToList() {
      if (window.innerWidth <= 600) {
        $("#content").css("left", "0px");
      }
      if (this.selectedIndex >= this.entryList.length) {
        this.selectedIndex = -1;
      }
    },
    removeEntry() {
      if (this.selectedIndex < 0) {
        // do nothing
      } else if (this.selectedIndex < this.entryList.length) {
        if (!confirm("确认删除？")) return;
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
        // do nothing
      } else if (this.selectedIndex < this.entryList.length) {
        this.$set(this.entryList, this.selectedIndex, entry);
        this.saveData();
      } else {
        this.entryList.push(entry);
        this.saveData();
      }
    },
    copy(text) {
      let clipboard = document.querySelector("#clipboard");
      clipboard.value = text;
      clipboard.select();
      if (document.execCommand("copy")) {
        this.popMessage("复制成功", "good", 1000);
      } else {
        this.popMessage("无法写入剪贴板", "error", 1000);
      }
    },
    option(op) {
      switch (op) {
        case "import": {
          if (
            this.entryList.length > 0 &&
            !confirm("导入数据将清空原始数据，是否继续？")
          )
            break;
          let fileInput = document.querySelector("#file-input");
          $(fileInput).click();
          fileInput.onchange = () => {
            console.log(fileInput);
            let fr = new FileReader();
            fr.onload = () => {
              try {
                let arr = this.parseDataJson(fr.result);
                this.entryList = arr;
                this.saveData();
              } catch (e) {
                this.popMessage(e.message, "error", 1000);
              }
            };
            fr.readAsText(fileInput.files[0]);
            fileInput.value = "";
          };
          break;
        }
        case "export": {
          var a = document.createElement("a");
          var e = document.createEvent("MouseEvents");
          e.initEvent("click", false, false);
          a.download = this.username;
          var blob = new Blob([JSON.stringify(this.entryList)]);
          a.href = URL.createObjectURL(blob);
          a.dispatchEvent(e);
          break;
        }
        case "changeUsername": {
          let newName = prompt("输入新用户名");
          if (!newName) {
            this.popMessage("用户名不得为空", "error", 1000);
            break;
          }
          this.popMessage("修改中...", "pending");
          Server.request("setUser", {
            name: this.username,
            pwd: this.password,
            newName: newName,
          })
            .then(() => {
              this.username = newName;
              this.popMessage("用户名修改成功", "good", 1000);
            })
            .catch((e) => {
              this.popMessage(e.message, "error", 1000);
            });
          break;
        }
        case "changePassword": {
          let newPwd = prompt("输入新密码");
          if (!newPwd) {
            this.popMessage("密码不得为空", "error", 1000);
            break;
          }

          let hash = Cipher.getHash(newPwd);
          let data = Cipher.encrypt(JSON.stringify(this.entryList), hash);
          this.popMessage("修改中...", "pending");
          Server.request("setUser", {
            name: this.username,
            pwd: this.password,
            newPwd: newPwd,
            data: data,
          })
            .then(() => {
              this.password = newPwd;
              this.popMessage("密码修改成功", "good", 1000);
            })
            .catch((e) => {
              this.popMessage(e.message, "error", 1000);
            });
          break;
        }
        case "deleteAccount": {
          if (!confirm("确认注销账户？")) break;
          this.popMessage("注销中...", "pending");
          Server.request("delUser", {
            name: this.username,
            pwd: this.password,
          })
            .then(() => {
              this.logout();
              this.popMessage("注销成功", "good", 1000);
            })
            .catch((e) => {
              this.popMessage(e.message, "error", 1000);
            });
          break;
        }
        default:
          break;
      }
      this.showOptionMenu = false;
    },
    // help functions
    parseDataJson(json) {
      let arr = JSON.parse(json);
      if (!(arr instanceof Array)) {
        throw new Error("Invalid data format.");
      }
      for (let e of arr) {
        if (typeof e !== "object") {
          throw new Error("Invalid data format.");
        }
        if (
          typeof e.tit !== "string" ||
          typeof e.des !== "string" ||
          typeof e.usr !== "string" ||
          typeof e.pwd !== "string" ||
          !(e.fds instanceof Array)
        ) {
          throw new Error("Invalid data format.");
        }
        for (let f of e.fds) {
          if (typeof f !== "object") {
            throw new Error("Invalid data format.");
          }
          if (
            typeof f.name !== "string" ||
            typeof f.cont !== "string" ||
            typeof f.disp !== "boolean"
          ) {
            throw new Error("Invalid data format.");
          }
        }
      }
      return arr;
    },
    saveData() {
      let hash = Cipher.getHash(this.password);
      let data = Cipher.encrypt(JSON.stringify(this.entryList), hash);

      this.popMessage("保存中...", "pending");
      Server.request("setData", {
        name: this.username,
        pwd: this.password,
        data: data,
      })
        .then(() => {
          this.popMessage("保存成功", "good", 1000);
        })
        .catch((e) => {
          this.popMessage(e.message, "error", 1000);
        });
    },
    popMessage(message, status, ms) {
      this.message = message;
      this.status = status;
      if (ms) {
        setTimeout(() => {
          this.showPopMessage = false;
        }, ms);
      }
      this.showPopMessage = true;
    },
  },
};
</script>

<style>
/* Layout */
#header {
  position: fixed;
  width: 100%;
  height: 40px;
  border-bottom: 1px solid lightgray;
  padding: 0 20px;
  background-color: #f7f7f7;
  z-index: 1;
}
#content {
  position: fixed;
  display: flex;
  justify-content: stretch;
  width: 100%;
  height: calc(100% - 40px);
  top: 40px;
  left: 0px;
  transition: left 0.3s ease;
}
#left-panel {
  width: 300px;
  border-right: 1px solid lightgray;
  overflow-y: auto;
  scrollbar-width: none;
  background-color: white;
}
#left-panel::-webkit-scrollbar {
  display: none;
}
#right-panel {
  flex: 1;
  background-color: #f7f7f7;
  overflow-y: auto;
}
@media screen and (max-width: 600px) {
  #content {
    width: 200%;
  }
  #left-panel {
    width: 50%;
  }
}
#hidden {
  position: fixed;
  top: -999px;
}
</style>
