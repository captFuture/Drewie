const path = require("path");

module.exports = {
  outputDir: "frontend/dist",
  pages: {
    index: {
      entry: "frontend/src/main.js",
      template: "frontend/public/index.html"
    }
  },
  productionSourceMap: false,
  configureWebpack: {
    resolve: {
      alias: {
        "@": path.join(__dirname, "frontend/src/")
      }
    }
  }
};
