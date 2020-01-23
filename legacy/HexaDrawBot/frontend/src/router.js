import Vue from "vue";
import Router from "vue-router";

import Control from "@/views/Control.vue";
import Watch from "@/views/Watch.vue";
import Setup from "@/views/Setup.vue";
import Cancel from "@/views/Cancel.vue";
import Message from "@/views/Message.vue";

Vue.use(Router);

export default new Router({
  linkActiveClass: "active",
  routes: [
    {
      path: "/",
      redirect: "/control"
    },
    {
      path: "/control",
      name: "control",
      component: Control
    },
    {
      path: "/watch",
      name: "watch",
      component: Watch
    },
    {
      path: "/setup",
      name: "setup",
      component: Setup
    },
    {
      path: "/cancel",
      name: "cancel",
      component: Cancel
    },
    {
      path: "/message",
      name: "message",
      component: Message
    }
  ]
});
