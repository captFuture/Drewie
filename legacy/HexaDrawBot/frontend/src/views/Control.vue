<template>
  <div class="view">
    <main>
      <div class="grid">
        <Button @click="move({ y: -1 })" icon="arrow-up" />
        <Button @click="move({ x: -1 })" icon="arrow-left" />
        <Button @click="move({})" icon="size-actual" />
        <Button @click="move({ x: 1 })" icon="arrow-right" />
        <Button @click="move({ y: 1 })" icon="arrow-down" />
      </div>
    </main>
    <aside>
      <Button state-key="controlSteps" :value="1" />
      <Button state-key="controlSteps" :value="10" />
      <Button state-key="controlSteps" :value="100" />

      <Button value="PEN" class="mt" :active="!penUp" @click="togglePen()" />
    </aside>
  </div>
</template>

<script>
import { mapState } from "vuex";
import Button from "@/components/Button.vue";

export default {
  name: "Control",
  components: { Button },
  data: () => ({
    distance: 10
  }),
  computed: {
    ...mapState(["penUp", "controlSteps"])
  },
  methods: {
    move({ x = 0, y = 0 }) {
      if (x === 0 && y === 0) {
        this.$socket.client.emit("home");
      } else {
        this.$socket.client.emit("moveBy", {
          x: x * this.controlSteps,
          y: y * this.controlSteps
        });
      }
    },
    togglePen() {
      this.$socket.client.emit("togglePen");
    }
  }
};
</script>

<style scoped>
.grid {
  display: grid;
  grid-template: repeat(3, min-content) / repeat(3, min-content);
}
.grid button:nth-child(1) {
  grid-column: 2;
}
.grid button:nth-child(2),
.grid button:nth-child(3),
.grid button:nth-child(4) {
  grid-row: 2;
}
.grid button:nth-child(5) {
  grid-row: 3;
  grid-column: 2;
}
</style>
