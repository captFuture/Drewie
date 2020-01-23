const Store = require("data-store");

const store = new Store(
  { path: "../.config.json" },
  require("../../config.template.json")
);

const config = () => {
  const update = updates => {
    Object.entries(updates).forEach(([key, value]) => {
      store.set(key, value);
    });
    return store.data;
  };

  return {
    update,
    get data() {
      return store.data;
    }
  };
};

module.exports = config();
