<template>
  <div class="input">
    <label :for="id">{{ label }}</label>
    <input
      type="number"
      :id="id"
      ref="input"
      :value="value"
      @input="$emit('input', $event.target.value)"
      @focus="$store.commit('LATEST_INPUT', $refs.input)"
      v-bind="$attrs"
    />
  </div>
</template>

<script>
export default {
  name: "NumberInput",
  props: ["label", "value"],
  computed: {
    id() {
      return `input-${this.label}`;
    }
  }
};
</script>

<style>
.input {
  display: flex;
  height: var(--button-size);
  box-sizing: border-box;
  border-radius: 0.05em;
  border: 0.05em solid rgba(255, 255, 255, 0.2);
  user-select: none;
  margin: var(--margin);
  font-size: calc(var(--button-size) * 0.8);
}
.input label {
  display: flex;
  background: rgba(255, 255, 255, 0.2);
  padding-left: 0.25em;
  font-family: monospace;
}
.input label::after {
  content: "=";
  padding: 0 0.25em;
}
.input input {
  background: transparent;
  border: 0;
  display: flex;
  width: 100%;
  font: inherit;
  font-size: 0.7em;
  padding-left: 0.3em;
  color: inherit;
  -webkit-appearance: none;
  outline: none;
}
.input input:focus {
  background-color: rgba(255, 255, 255, 0.1);
}
</style>
