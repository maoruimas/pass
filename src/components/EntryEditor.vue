<template>
  <div id="right-panel-content" v-if="!entry.isNull">
    <div id="right-panel-header" class="repel">
      <i class="button icon-left-big" @click="$emit('back')"></i>
      <div v-if="editing">
        <i class="button icon-plus" @click="addField"></i>
        <i class="button icon-floppy" @click="save"></i>
        <i class="button icon-cancel" @click="cancel"></i>
      </div>
      <div v-else>
        <i
          :class="[display ? 'button icon-eye-off' : 'button icon-eye']"
          @click="display = !display"
        ></i>
        <i class="button icon-trash" @click="$emit('remove')"></i>
        <i class="button icon-edit" @click="edit"></i>
      </div>
    </div>
    <div v-for="(f, i) in tempField" class="field" :key="i">
      <div v-if="editing">
        <div class="repel">
          <div class="field-name">字段名</div>
          <div v-if="i > 3">
            <i class="icon-cancel-circled" @click="removeField(i)"></i>
          </div>
        </div>
        <input class="textfield" v-model="f.name" :disabled="i < 4" />
        <div class="repel">
          <div class="field-name">字段内容</div>
          <div>
            <i
              :class="[f.disp ? 'icon-eye' : 'icon-eye-off']"
              v-if="i > 3"
              @click="f.disp = !f.disp"
            ></i>
            <i
              class="icon-lightbulb"
              v-if="i > 1"
              @click="genRandomString(i)"
            ></i>
          </div>
        </div>
        <input
          class="textfield"
          v-model="f.cont"
          @focus="showHistory = i === 2"
        />
        <div
          id="history"
          v-if="i === 2 && showHistory && filteredHistory.length"
        >
          <div v-for="h in filteredHistory" @click="f.cont = h" :key="h">
            {{ h }}
          </div>
        </div>
      </div>
      <div v-else>
        <div class="field-name">{{ f.name }}</div>
        <div class="repel" v-if="f.cont">
          <div class="field-content" v-html="getFieldContent(f.cont, f.disp, display)" />
          <i class="icon-clone" @click="$emit('copy', f.cont)"></i>
        </div>
      </div>
    </div>
    <div v-if="editing" class="generator">
      <div>
        <i class="icon-lightbulb"></i>
        <span>随机生成器设置</span>
      </div>
      <div class="repel">
        <span>
          <input type="checkbox" v-model="genUseNum" />
          <span>0-9</span>
        </span>
        <span>
          <input type="checkbox" v-model="genUseLow" />
          <span>a-z</span>
        </span>
        <span>
          <input type="checkbox" v-model="genUseUpp" />
          <span>A-Z</span>
        </span>
        <span>
          <input type="checkbox" v-model="genUseSym" />
          <span>特殊符号</span>
        </span>
      </div>
      <div class="repel">
        <span>长度</span>
        <input
          type="range"
          class="generator-range"
          min="1"
          max="30"
          v-model="genLength"
        />
        <span>{{ genLength }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import linkifyHtml from 'linkifyjs/html';

export default {
  props: {
    entry: Object,
    history: Array,
  },
  emits: ["back", "remove", "change", "copy"],
  data() {
    return {
      editing: false,
      display: false,
      tempField: [],
      genUseNum: true,
      genUseLow: true,
      genUseUpp: true,
      genUseSym: true,
      genLength: 15,
      showHistory: false,
    };
  },
  computed: {
    filteredHistory() {
      let t = this.tempField[2].cont;
      if (t === "") {
        return [];
      }
      let ret = [];
      for (let h of this.history) {
        if (h.indexOf(t) === 0 && t.length < h.length) {
          ret.push(h);
        }
      }
      return ret;
    },
  },
  methods: {
    save() {
      if (!confirm("确认保存？")) return;
      let tempEntry = {};
      tempEntry["tit"] = this.tempField[0].cont;
      tempEntry["des"] = this.tempField[1].cont;
      tempEntry["usr"] = this.tempField[2].cont;
      tempEntry["pwd"] = this.tempField[3].cont;
      tempEntry["fds"] = [];
      for (let i = 4; i < this.tempField.length; ++i) {
        tempEntry["fds"].push({
          name: this.tempField[i].name,
          cont: this.tempField[i].cont,
          disp: this.tempField[i].disp,
        });
      }
      this.$emit("change", tempEntry);
      this.editing = false;
    },
    edit() {
      this.editing = true;
    },
    cancel() {
      if (!confirm("确认丢弃未保存的更改？")) return;
      this.constructTempField();
      this.editing = false;
    },
    constructTempField() {
      this.tempField = [];
      this.tempField.push({
        name: "标题",
        cont: this.entry.tit,
        disp: true,
      });
      this.tempField.push({
        name: "详情",
        cont: this.entry.des,
        disp: true,
      });
      this.tempField.push({
        name: "用户",
        cont: this.entry.usr,
        disp: true,
      });
      this.tempField.push({
        name: "密码",
        cont: this.entry.pwd,
        disp: false,
      });
      for (let f of this.entry.fds) {
        this.tempField.push({
          name: f.name,
          cont: f.cont,
          disp: f.disp,
        });
      }
    },
    addField() {
      this.tempField.push({ name: "", cont: "", disp: true });
    },
    removeField(i) {
      this.tempField.splice(i, 1);
    },
    genRandomString(i) {
      let charset = [];
      if (this.genUseNum) charset.push("0123456789");
      if (this.genUseLow) charset.push("abcdefghijklmnopqrstuvwxyz");
      if (this.genUseUpp) charset.push("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
      if (this.genUseSym) charset.push("!@#$%^&*()[]{}-_=+|;:,.?");

      if (charset.length === 0) {
        // Output an empty string if no type is selected
        this.tempField[i].cont = "";
        return;
      }

      let chararr = [];
      for (let i = 0; i < this.genLength; ++i) {
        if (i < charset.length) {
          // Use at least one of the chosen type if possible
          chararr.push(charset[i][this.rand(charset[i].length)]);
        } else {
          let j = this.rand(charset.length);
          chararr.push(charset[j][this.rand(charset[j].length)]);
        }
      }

      // Shuffle
      for (let i = 0; i < chararr.length; ++i) {
        let j = this.rand(chararr.length - i);
        [chararr[i], chararr[j]] = [chararr[j], chararr[i]];
      }

      this.tempField[i].cont = chararr.join("");
    },
    getFieldContent(cont, notPwd, disp) {
      if (!cont) {
        return '';
      } else if (notPwd) {
        return linkifyHtml(cont, { target: { url: '_blank' } });
      } else if (disp) {
        return cont;
      } else {
        return '●●●●●●';
      }
    },
    isUrl(s) {
      return s.indexOf("http://") === 0 || s.indexOf("https://") === 0;
    },
    rand(n) {
      return Math.floor(Math.random() * n);
    },
  },
  watch: {
    entry() {
      if (!this.entry.isNull) {
        this.constructTempField();
        this.display = false;
        this.editing = this.entry.isNew ? true : false;
      } else {
        this.tempField = [];
      }
    },
  },
  mounted() {
    if (!this.entry.isNull) {
      this.constructTempField();
    }
  },
};
</script>

<style>
#right-panel-content {
  max-width: 600px;
}
#right-panel-content > * {
  margin: 40px;
}
#right-panel-header {
  position: sticky;
  top: 0;
  margin-top: 30px;
  padding: 10px 0;
  border-bottom: 1px solid lightgray;
  background-color: #f7f7f7;
  z-index: 1;
}
.field-name {
  font-size: smaller;
  color: gray;
}
.field-content {
  word-wrap: break-word;
  word-break: break-all;
}
.field {
  position: relative;
}
.field [class^="icon-"] {
  margin: 0 3px;
  cursor: pointer;
}
.field .textfield {
  width: 100%;
}
#history {
  position: absolute;
  top: calc(100% + 5px);
  width: 100%;
  border: 1px solid lightgray;
  border-radius: 5px;
  z-index: 1;
  overflow: hidden;
}
#history > * {
  padding: 10px;
  background-color: white;
  cursor: pointer;
}
#history > *:hover {
  background-color: #f7f7f7;
}
.generator {
  border: 1px solid lightgray;
  border-radius: 5px;
}
.generator > * {
  margin: 10px;
}
.generator-range {
  margin: 0 10px;
  flex: 1;
}
</style>