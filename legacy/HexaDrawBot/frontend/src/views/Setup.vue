<template>
  <div class="view">
    <main v-if="config">
      <NumberInput v-model.number="config.d" label="d" autofocus />
      <NumberInput v-model.number="config.home.x" label="x" />
      <NumberInput v-model.number="config.home.y" label="y" />
      <NumberInput v-model.number="config.limits.x" label="Lx" />
      <NumberInput v-model.number="config.limits.y" label="Ly" />
      <!-- Why are Lx and Ly not saved? //-->
    </main>
    <aside>
      <div class="grid">
        <Button
          @click="addNum(n)"
          :size="buttonSize"
          v-for="n in 9"
          :key="n"
          :value="n"
        />
        <Button @click="addNum(0)" :size="buttonSize" value="0" />
        <Button @click="bksp()" :size="buttonSize" icon="arrow-left-circle" />
        <Button @click="clear()" :size="buttonSize" icon="close" />
      </div>
    </aside>
  </div>
</template>

<script>
import { mapState } from "vuex";

import NumberInput from "@/components/NumberInput.vue";
import Button from "@/components/Button.vue";

export default {
  name: "Setup",
  components: { NumberInput, Button },
  data: () => ({
    buttonSize: 0.8,
    config: null
  }),
  sockets: {
    onConfig(config) {
      this.config = config;
    }
  },
  computed: {
    ...mapState(["latestInput"])
  },
  methods: {
    _changeInputValue(fn) {
      if (this.latestInput) {
        this.latestInput.value = fn(this.latestInput.value);
        this.latestInput.focus();
        this.latestInput.dispatchEvent(new Event("input", { bubbles: true }));

      }
    },
    addNum(n) {
      this._changeInputValue(value => Math.abs(+`${value}${n}`));
    },
    bksp() {
      this._changeInputValue(value => value.slice(0, -1));
    },
    clear() {
      this._changeInputValue(() => "");
    },
    test(e) {
      console.log("test", e);
    }
  },
  activated: function() {
    this.$socket.client.emit("getCanvasConfig");
  },
  deactivated: function() {
    this.$socket.client.emit("setCanvasConfig", this.config);
    this.config = null;
  }
};
</script>

<style scoped>
.grid {
  display: grid;
  grid-template: repeat(6, min-content) / repeat(2, min-content);
}
</style>
