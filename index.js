
var app = require('./src/app.js');

if (module.hot) {
  module.hot.accept('./src/app.js', () => {
    var app = require('./src/app.js');

  });
}
