<!-- inspirated by https://github.com/nkoik/vue-simple-line-icons -->
<template>
  <span class="icon">
    <svg
      xmlns="http://www.w3.org/2000/svg"
      xmlns:xlink="http://www.w3.org/1999/xlink"
      viewBox="0 0 32 32"
    >
      <path :d="path" />
    </svg>
  </span>
</template>

<script>
import icons from "@/data/icons.json";

export default {
  name: "icon",
  props: {
    name: {
      type: String,
      required: true
    }
  },
  computed: {
    path() {
      return icons[this.name];
    }
  }
};
</script>

<style>
.icon {
  object-fit: contain;
}
.icon svg {
  width: 100%;
  transform: rotate(0deg);
  fill: currentColor;
}
</style>
