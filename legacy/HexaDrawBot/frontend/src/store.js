import Vue from "vue";
import Vuex from "vuex";

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    penUp: true,
    controlSteps: 10,
    latestInput: null,
    svg: null
  },
  mutations: {
    CONTROL_STEPS(state, steps) {
      state.controlSteps = steps;
    },
    UPDATE_KEY(state, { key, value }) {
      state[key] = value;
    },
    SOCKET_PENUP(state, isUp) {
      console.log({ isUp });
      state.penUp = isUp;
    },
    LATEST_INPUT(state, input) {
      state.latestInput = input;
    },
    SVG(state, svg) {
      state.svg = svg;
    }
  },
  actions: {
    readFile({ commit }, file) {
      const reader = new FileReader();
      reader.onload = ({ target: { result } }) => {
        commit("SVG", result);

        const svgPath = [
          ...new DOMParser()
            .parseFromString(result, "image/svg+xml")
            .querySelectorAll("path")
        ]
          .map(path => path.getAttribute("d").replace(/\s+/g, " "))
          .join(" ")
          .trim();
        this._vm.$socket.client.emit("drawSvg", result, svgPath);
      };
      reader.readAsText(file);
    }
  }
});
