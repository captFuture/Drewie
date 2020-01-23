<template>
  <div id="app">
    <header><Logo text="Drewie" icon="logo" /></header>
    
    <nav v-if="$route !== 'message'">
      <Button
        type="file"
        accept="image/svg+xml"
        @file="fileSelected"
        icon="folder"
      />
      <LinkButton to="/control" icon="cursor-move" />
      <LinkButton to="/watch" icon="note" />
      <LinkButton to="/setup" icon="speedometer" />
      <LinkButton to="/cancel" icon="ban" />
    </nav>
    <keep-alive>
      <router-view />
    </keep-alive>
  </div>
</template>

<script>
import { mapActions } from "vuex";
import Button from "@/components/Button.vue";
import Logo from "@/components/Logo.vue";
import LinkButton from "@/components/LinkButton.vue";

export default {
  name: "app",
  components: { Button, LinkButton, Logo },
  sockets: {
    resumeSession() {
      // TODO
    }
  },
  methods: {
    ...mapActions(["readFile"]),
    fileSelected(file) {
      this.readFile(file);
      if (this.$router.currentRoute.name !== "watch")
        this.$router.push({ name: "watch" });
    }
  }
};
</script>

<style>
:root {
  --screen-width: 100vw;
  --screen-height: calc(100vw / 4 * 3);
  --screen-height: 100vh;
  --title-height: calc(var(--screen-height) * 0.1);
  --button-size: calc(var(--screen-height) * 0.15);
  --margin: calc(var(--screen-height) * 0.0125);
  --primary: #00629f;
}

body {
  margin: 0;
}

#app {
  font: normal 1em / 1 "Avenir", Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #222;
  color: #fff;
  width: var(--screen-width);
  height: var(--screen-height);
  display: grid;
  grid-template: var(--title-height) 1fr / min-content 1fr;
  grid-template-areas: "header header" "nav view";
}

header {
  grid-area: header;
  background: var(--primary);
  line-height: var(--title-height);
  font-size: calc(var(--title-height) * 0.55);
  text-align: center;
}


nav {
  background-color: rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
}
nav {
  grid-area: nav;
}
nav :last-child {
  margin-top: auto;
}
nav button {
  background: transparent;
  opacity: 0.4;
}
.view {
  display: grid;
  grid-template: 1fr / 1fr min-content;
  grid-template-areas: "main aside";
}
.mt {
  margin-top: calc(var(--margin) * 2);
}
main {
  grid-area: main;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: var(--margin);
}
aside {
  grid-area: aside;
  display: flex;
  flex-direction: column;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.1);
  padding: var(--margin);
}
</style>
