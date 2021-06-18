<template>
  <div>
    <div id="left-panel-header">
      <input
        class="textfield"
        :placeholder="'搜索 ' + entryList.length + ' 个条目'"
        v-model="needle"
        :disabled="disabled"
      />
      <i
        :class="{ button: true, 'icon-plus': true, disabled: disabled }"
        @click="if (!disabled) addEntry();"
      ></i>
    </div>
    <div
      v-for="e in filteredEntryList"
      :class="{ entry: true, selected: e.index === selectedIndex }"
      @click="selectEntry(e.index)"
      :key='e.index'
    >
      <div class="entry-title">{{ e.tit }}</div>
      <div class="entry-description">{{ e.des }}</div>
    </div>
    <div class="list-bottom">到底了～</div>
  </div>
</template>

<script>
export default {
  props: {
    entryList: Array,
    selectedIndex: Number,
    disabled: Boolean,
  },
  emits: ["select"],
  data() {
    return {
      needle: "",
    };
  },
  computed: {
    filteredEntryList() {
      let ret = [];

      // newly added entry appears first
      if (this.selectedIndex === this.entryList.length) {
        ret.push({
          index: this.selectedIndex,
          tit: "新建条目标题",
          des: "新建条目详情",
        });
      }

      // newest first
      for (let i = this.entryList.length - 1; i >= 0; --i) {
        let e = this.entryList[i];
        if (
          this.contains(e.tit, this.needle) ||
          this.contains(e.des, this.needle)
        ) {
          ret.push({
            index: i,
            tit: e.tit,
            des: e.des,
          });
        }
      }
      return ret;
    },
  },
  methods: {
    selectEntry(i) {
      this.$emit("select", i);
    },
    addEntry() {
      this.$emit("select", this.entryList.length);
    },
    contains(str, needle) {
      return str.toLowerCase().indexOf(needle.toLowerCase()) !== -1;
    },
  },
};
</script>

<style>
#left-panel-header {
    display: flex;
    padding: 5px;
    position: sticky;
    top: 0;
    border-bottom: 1px solid lightgray;
    background-color: #f7f7f7;
    align-items: center;
}
#left-panel-header .textfield {
    flex: 1;
    margin-right: 5px;
}
.entry {
    padding: 15px;
    border-bottom: 1px solid lightgray;
}
.entry:hover {
    background-color: #f7f7f7;
}
.entry.selected {
    box-shadow: 4px 0 0 0 red inset;
    background-color: #f7f7f7;
}
.entry-description {
    font-size: smaller;
    color: gray;
}
.list-bottom {
    text-align: center;
    color: gray;
    font-size: smaller;
    padding: 5px 0;
}
</style>