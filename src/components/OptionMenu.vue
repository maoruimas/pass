<template>
  <div id='option-menu'>
    <div @click="$emit('option', 'import')">
      <i class="icon-download"></i>
      <span> 导入</span>
    </div>
    <div @click="$emit('option', 'export')">
      <i class="icon-upload"></i>
      <span> 导出</span>
    </div>
    <div @click="$emit('option', 'changeUsername')">
      <i class="icon-user"></i>
      <span> 修改用户名</span>
    </div>
    <div @click="$emit('option', 'changePassword')">
      <i class="icon-key"></i>
      <span> 修改密码</span>
    </div>
    <div @click="$emit('option', 'deleteAccount')">
      <i class="icon-user-times"></i>
      <span> 注销账户</span>
    </div>
  </div>
</template>

<script>
export default {
  emits: ['option']
}
</script>

<style>
#option-menu {
    padding: 5px 0;
    word-break: keep-all;
    min-width: 150px;
}
#option-menu > div {
    padding: 5px 10px;
    cursor: pointer;
}
#option-menu > div:hover {
    background-color: #f7f7f7;
}
</style>