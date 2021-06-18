<template>
  <div class="menu-button">
    <div
      :class="{ button: true, disabled: disabled, checked: show }"
      @click="if (!disabled) $emit('update:show', !show);"
    >
      <slot />
    </div>
    <transition name="pop">
      <div class="button-menu" v-show="show">
        <slot name="menu" />
      </div>
    </transition>
  </div>
</template>

<script>
export default {
  props: {
    show: Boolean,
    disabled: Boolean
  },
  emits: ['update:show']
}
</script>

<style>
.menu-button {
    display: inline-flex;
    position: relative;
    height: 40px;
    align-items: center;
}
.button-menu {
    position: absolute;
    top: calc(100% + 5px);
    right: 0;
    border: 1px solid lightgray;
    background-color: white;
    border-radius: 3px;
}
.pop-enter-active, .pop-leave-active {
    transition: all .3s ease;
}
.pop-enter-from, .pop-leave-to {
    transform: scale(0.8);
    opacity: 0;
}
</style>