<template>
  <div :id="icon"><icon  :name="icon" v-if="icon" /></div>
</template>

<script>
import Icon from "@/components/Icon.vue";

export default {
  name: "Logo",
  components: { Icon },
  props: {
    icon: String,
    text: String
  }
};
</script>

<style>
#logo {
    margin: 5px auto 5px auto;
    width: 2em;
}

#logo svg {
  display: block;
  margin: 0;
  padding: 0;
  width: 2em;
  height: 2em;
}
</style>