const { existsSync: exists, readFileSync: read, writeFileSync: write } = require('fs');

class JsonStore {
  constructor(path) {
    this._path = path;
    this._data = exists(path) ? JSON.parse(read(this._path)) : {};
  }
  get data() {
    return this._data;
  }
  set data(data) {
    this._data = data;
    write(this._path, JSON.stringify(this._data, null, 2));
  }
}

module.exports = path => new JsonStore(path);
