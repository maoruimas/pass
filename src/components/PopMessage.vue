<template>
  <transition name="drop">
    <div class="message" v-show="show">
      <span :class="'message-' + status">
        <i :class="'icon-' + status"></i>
        {{ message }}
      </span>
    </div>
  </transition>
</template>

<script>
export default {
  props: {
    show: Boolean,
    message: String,
    status: String,
  },
};
</script>

<style>
.message {
  position: fixed;
  top: 20px;
  width: 100%;
  display: flex;
  justify-content: center;
  z-index: 1;
}
[class^="message-"] {
  border-radius: 3px;
  padding: 0 10px;
}
.message-good {
  border: 1px solid green;
  background-color: #ebf3d5;
  color: green;
}
.message-error {
  border: 1px solid red;
  background-color: #f8e2e2;
  color: red;
}
.message-pending {
  border: 1px solid gray;
  background-color: #f7f7f7;
  color: gray;
}
.drop-enter-active,
.drop-leave-active {
  transition: all 0.3s ease;
}
.drop-enter,
.drop-leave-to {
  top: 0;
  opacity: 0;
}
</style>