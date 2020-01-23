<template>
  <button :class="{ active: isActive }" :style="style" @click="click">
    <icon :name="icon" v-if="icon" />
    <span v-if="value" :style="{ fontSize }">{{ value }}</span>
  </button>
</template>

<script>
import Icon from "@/components/Icon.vue";

export default {
  name: "Button",
  components: { Icon },
  props: {
    icon: String,
    value: { type: [String, Number], default: "" },
    active: Boolean,
    size: Number,
    stateKey: String,

    type: String,
    accept: String
  },
  computed: {
    style() {
      return Object.assign(
        {},
        this.value.length > 3 ? { width: "auto" } : {},
        this.size ? { fontSize: `calc(var(--button-size) * ${this.size}` } : {}
      );
    },
    fontSize() {
      return this.value.length === 3 ? "0.5em" : null;
    },
    isActive() {
      return (
        this.active ||
        (this.stateKey && this.$store.state[this.stateKey] === this.value)
      );
    }
  },
  methods: {
    click() {
      if (this.type === "file") {
        Object.assign(document.createElement("input"), {
          type: "file",
          accept: this.accept,
          onchange: e => this.$emit("file", e.target.files[0])
        }).click();
      } else if (this.stateKey) {
        this.$store.commit("UPDATE_KEY", {
          key: this.stateKey,
          value: this.value
        });
      } else {
        this.$emit("click", this.$event);
      }
    }
  }
};
</script>

<style>
button {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 1em;
  height: 1em;
  box-sizing: border-box;
  padding: 0.2em;
  font-size: var(--button-size);
  margin: var(--margin);
  border-radius: 0.05em;
  border: none;
  color: inherit;
  user-select: none;
  -webkit-appearance: none;
  outline: none;
  opacity: 0.7;
  background: rgba(255, 255, 255, 0.2);
}
button:hover,
button.active {
  opacity: 1;
}
button span {
  display: flex;
  line-height: 1;
  font-size: 0.6em;
}
button svg {
  display: block;
  margin: 0;
  padding: 0;
  width: 1em;
  height: 1em;
}
</style>
