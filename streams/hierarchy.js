'use strict';

var through2 = require('through2');
var error = require('../lib/error');

/**
 * Infer a hierarchy of documentation from a stream of documentation
 * comments, emitting a single nested object.
 *
 * ```
 * Module
 *  Class
 *    Static methods
 *    Instance methods
 *    Events
 * ```
 *
 * @name hierarchy
 * @return {stream.Transform}
 */
module.exports = function () {
  var comments = [];
  return through2.obj(function (comment, enc, callback) {
    comments.push(comment);
    callback();
  }, function (callback) {
    this.push(inferHierarchy(comments));
    this.emit('end');
    callback();
  });
};

/**
 * @param {Array<Object>} comments an array of parsed comments
 * @returns {Array<Object>} nested comments, with only root comments
 * at the top level.
 */
function inferHierarchy(comments) {
  var nameIndex = {}, i;

  // We're going to iterate comments in reverse to generate the memberships so
  // to avoid reversing the sort order we reverse the array for the name index.
  comments.reverse();

  // First, create a fast lookup index of Namespace names
  // that might be used in memberof tags, and let all objects
  // have members
  for (i = 0; i < comments.length; i++) {
    nameIndex[comments[i].name] = comments[i];
    comments[i].members = { instance: [], static: [] };
    comments[i].events = [];
  }

  for (i = comments.length - 1; i >= 0; i--) {
    var comment = comments[i];

    if (!comment.memberof) {
      continue;
    }

    var parent = nameIndex[comment.memberof];

    if (!parent) {
      console.error(error(null, comment, 'memberof reference to %s not found', comment.memberof));
      continue;
    }

    switch (comment.kind) {
      case 'event':
        parent.events.push(comment);
        break;

      default:
        if (!comment.scope) {
          console.error(error(null, comment, 'found memberof but no @scope, @static, or @instance tag'));
          continue;
        }
        parent.members[comment.scope].push(comment);
        break;
    }

    // remove non-root nodes from the lowest level: these are reachable
    // as members of other docs.
    comments.splice(i, 1);
  }

  // Now the members are in the right order but the root comments are reversed
  // so we reverse once more.
  comments.reverse();

  /**
   * Add paths to each comment, making it possible to generate permalinks
   * that differentiate between instance functions with the same name but
   * different `@memberof` values.
   *
   * @param {Object} comment the jsdoc comment
   * @param {Array<String>} prefix an array of strings representing names
   * @returns {undefined} changes its input by reference.
   */
  function addPath(comment, prefix) {
    comment.path = prefix.concat([comment.name]);
    comment.members.instance.forEach(function (member) {
      addPath(member, comment.path);
    });
    comment.members.static.forEach(function (member) {
      addPath(member, comment.path);
    });
    comment.events.forEach(function (member) {
      addPath(member, comment.path);
    });
  }

  for (i = 0; i < comments.length; i++) {
    addPath(comments[i], []);
  }

  return comments;
}
