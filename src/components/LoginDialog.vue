<template>
  <div id='login-dialog'>
    <div v-if="online">
      <div>
        欢迎，<b>{{ username }}</b>
      </div>
      <div class="center">
        <span class="button text" @click="signout"
          ><i class="icon-logout"></i> 退出登陆</span
        >
      </div>
    </div>
    <div v-else>
      <input
        class="textfield"
        placeholder="用户名"
        v-model="tempUsername"
        :disabled="status === 'pending'"
      />
      <input
        class="textfield"
        placeholder="密码"
        v-model="tempPassword"
        :disabled="status === 'pending'"
        type="password"
      />
      <div>
        <i :class="'icon-' + status"></i>
        <span>{{ ' ' + message }}</span>
      </div>
      <div class="spaced">
        <span
          :class="{ button: true, text: true, disabled: status !== 'good' }"
          @click="if (status === 'good') signup();"
          ><i class="icon-user-plus"></i> 注册</span
        >
        <span
          :class="{ button: true, text: true, disabled: status !== 'good' }"
          @click="if (status === 'good') signin();"
          ><i class="icon-login"></i> 登陆</span
        >
      </div>
    </div>
  </div>
</template>

<script>
import Server from "@/utils/server";
import Cipher from "@/utils/cipher";

export default {
  props: {
    username: String,
    password: String,
    online: Boolean,
  },
  data() {
    return {
      tempUsername: "",
      tempPassword: "",
      status: "error",
      message: "用户名或密码不得为空",
    };
  },
  methods: {
    signup() {
      this.status = "pending";
      this.message = "注册中";

      let hash = Cipher.getHash(this.tempPassword);
      let data = Cipher.encrypt("[]", hash);

      Server.request("addUser", {
        name: this.tempUsername,
        pwd: this.tempPassword,
        data: data,
      })
        .then(() => {
          this.$emit("login", this.tempUsername, this.tempPassword, []);
        })
        .catch((e) => {
          this.status = "error";
          this.message = e.message;
        });
    },
    signin() {
      this.status = "pending";
      this.message = "登陆中";

      let hash = Cipher.getHash(this.tempPassword);

      Server.request("getData", {
        name: this.tempUsername,
        pwd: this.tempPassword,
      })
        .then((data) => {
          let json = Cipher.decrypt(data, hash);
          try {
            this.$emit(
              "login",
              this.tempUsername,
              this.tempPassword,
              JSON.parse(json)
            );
          } catch (e) {
            this.status = "error";
            this.message = e.message;
          }
        })
        .catch((e) => {
          this.status = "error";
          this.message = e.message;
        });
    },
    signout() {
      this.tempUsername = "";
      this.tempPassword = "";
      this.$emit("logout");
    },
    checkUsernamePassword() {
      if (this.tempUsername && this.tempPassword) {
        this.status = "good";
        this.message = "很好";
      } else {
        this.status = "error";
        this.message = "用户名或密码不得为空";
      }
    },
  },
  watch: {
    tempUsername() {
      this.checkUsernamePassword();
    },
    tempPassword() {
      this.checkUsernamePassword();
    },
  },
};
</script>

<style scoped>
#login-dialog {
    min-width: 200px;
}
#login-dialog > div {
    padding: 5px 10px;
}
#login-dialog > div > * {
    margin: 5px 0;
}
.icon-good::before {
    content: '\e813';
    color: green;
}
.icon-error::before {
    content: '\e816';
    color: red;
}
.icon-pending::before {
    content: '\f110';
    color: gray;
    animation: rotate 2s linear infinite;
}
@keyframes rotate {
      0% { transform: rotate(  0deg); }
     50% { transform: rotate(180deg); }
    100% { transform: rotate(360deg); }
}
@-webkit-keyframes rotate {
      0% { -webkit-transform: rotate(  0deg); }
     50% { -webkit-transform: rotate(180deg); }
    100% { -webkit-transform: rotate(360deg); }
}
</style>