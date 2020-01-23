<template>
  <router-link tag="button" :to="to" v-bind="$attrs">
    <icon :name="icon" v-if="icon" />
  </router-link>
</template>

<script>
import Icon from "@/components/Icon.vue";

export default {
  name: "LinkButton",
  components: { Icon },
  props: {
    icon: String,
    to: String
  }
};
</script>
