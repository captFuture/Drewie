<template>
  <div class="icons">
    <div class="icon-wrapper" v-for="name in iconNames" :key="name" @click="copyToClipboard(name)">
      <icon :name="name" />
      {{ name }}
    </div>
  </div>
</template>

<script>
import Icon from "../src/components/Icon.vue";
import ICONS from "../src/data/icons.json";

export default {
  name: "icon-list",
  components: { Icon },
  data: () => ({
    iconNames: Object.keys(ICONS)
  }),
  methods: {
    copyToClipboard(name) {
      navigator.clipboard.writeText(name);
    }
  }
};
</script>

<style scoped>
.icons {
  display: flex;
  flex-flow: row wrap;
}
.icon-wrapper {
  display: flex;
  align-items: center;
  cursor: pointer;
  margin: 0.5em;
}
.icon-wrapper .icon {
  width: 1.5em;
  margin: 0.5em;
}
.icon-wrapper:hover {
  background-color: rgba(0, 0, 0, 0.2);
}
</style>