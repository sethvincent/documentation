'use strict';

var filter = require('through2-filter');

/**
 * Exclude given access levels from the generated documentation: this allows
 * users to write documentation for non-public members by using the
 * `@private` tag.
 *
 * @name access
 * @public
 * @param {Array<String>} [levels=[private]] excluded access levels.
 * @return {stream.Transform}
 */
module.exports = function (levels) {
  levels = levels || ['private'];
  return filter.obj(function (comment) {
    return levels.indexOf(comment.access) === -1;
  });
};
