'use strict';

var test = require('prova'),
  concat = require('concat-stream'),
  path = require('path'),
  shallow = require('../../streams/input/shallow');

test('shallow deps', function (t) {
  shallow([path.resolve(path.join(__dirname, '../fixture/es6.input.js'))])
    .pipe(concat(function (deps) {
      t.equal(deps.length, 1);
      t.ok(deps[0].file, 'has file');
      t.end();
    }));
});

test('shallow deps multi', function (t) {
  shallow([
    path.resolve(path.join(__dirname, '../fixture/es6.input.js')),
    path.resolve(path.join(__dirname, '../fixture/es6.output.json'))
  ]).pipe(concat(function (deps) {
    t.equal(deps.length, 2);
    t.ok(deps[0].file, 'has file');
    t.end();
  }));
});
