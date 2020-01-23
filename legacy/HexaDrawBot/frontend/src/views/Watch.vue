<template>
  <div class="view">
    <main v-if="svg">
      <div id="preview">
        <img ref="image" :src="src" @load="startDraw" />
        <canvas ref="preview"></canvas>
        <canvas ref="crosshair"></canvas>
      </div>
    </main>
  </div>
</template>

<script>
import { mapState } from "vuex";

export default {
  name: "Watch",
  data: () => ({
    width: 0,
    height: 0
  }),
  computed: {
    ...mapState(["svg"]),
    src: function() {
      return URL.createObjectURL(
        new Blob([this.svg], { type: "image/svg+xml" })
      );
    },
    preview: function() {
      return this.$refs.preview.getContext("2d");
    },
    crosshair: function() {
      return this.$refs.crosshair.getContext("2d");
    }
  },
  sockets: {
    drawTo(x, y, justMove) {
      this.draw(x, y, justMove, true);
    },
    resumeSession({ drawings }) {
      drawings.forEach(drawing => this.draw(...drawing));
    }
  },
  methods: {
    draw(x, y, justMove, crosshair = false) {
      if (justMove) {
        this.preview.moveTo(x, y);
      } else {
        this.preview.lineTo(x, y);
        this.preview.stroke();
      }
      if (crosshair) {
        this.crosshair.clearRect(0, 0, this.width, this.height);
        this.crosshair.beginPath();
        this.crosshair.moveTo(x - 20, y);
        this.crosshair.lineTo(x + 20, y);
        this.crosshair.stroke();
        this.crosshair.beginPath();
        this.crosshair.moveTo(x, y - 20);
        this.crosshair.lineTo(x, y + 20);
        this.crosshair.stroke();
      }
    },
    startDraw() {
      this.width = this.$refs.preview.width = this.$refs.crosshair.width = this.$refs.image.naturalWidth;
      this.height = this.$refs.preview.height = this.$refs.crosshair.height = this.$refs.image.naturalHeight;

      this.preview.beginPath();
      this.preview.lineWidth = "3";
      this.preview.strokeStyle = "#FF0000";

      this.crosshair.strokeStyle = "#333";
      this.crosshair.lineWidth = "3";
    }
  }
};
</script>

<style>
#preview {
  position: relative;
  width: 100%;
  height: 100%;
  background: white;
}
#preview img,
#preview canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  max-height: 100%;
  object-fit: contain;
}
</style>
