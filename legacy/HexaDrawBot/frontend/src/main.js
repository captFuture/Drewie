import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";

import VueSocketIOExt from "vue-socket.io-extended";
import io from "socket.io-client";

const socket = io(
  `http://${location.hostname}:${process.env.VUE_APP_SERVER_PORT}/`
);
Vue.use(VueSocketIOExt, socket, { store });

Vue.config.productionTip = false;

new Vue({
  router,
  store,
  render: function(h) {
    return h(App);
  }
}).$mount("#app");
