import {makeDOMDriver} from '@cycle/dom';
import { run } from '@cycle/run';
import { withState } from '@cycle/state';

var app = require('./src/app.js');


if (module.hot) {
  module.hot.accept('./src/app.js', () => {
    var app = require('./src/app.js');

  });
}
