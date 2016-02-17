/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Mysql Handler: Login screen and session/settings handling via database
 * PLEASE NOTE THAT THIS AN EXAMPLE ONLY, AND SHOUD BE MODIFIED BEFORE USAGE
 *
 * Copyright (c) 2011-2016, Anders Evenrud <andersevenrud@gmail.com>
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *
 * 1. Redistributions of source code must retain the above copyright notice, this
 *    list of conditions and the following disclaimer.
 * 2. Redistributions in binary form must reproduce the above copyright notice,
 *    this list of conditions and the following disclaimer in the documentation
 *    and/or other materials provided with the distribution.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT OWNER OR CONTRIBUTORS BE LIABLE FOR
 * ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 *
 * @author  Anders Evenrud <andersevenrud@gmail.com>
 * @licence Simplified BSD License
 */
(function (mysql, bcrypt, path_helper) {
  'use strict';
  var connection;

  /////////////////////////////////////////////////////////////////////////////
  // USER SESSION ABSTRACTION
  /////////////////////////////////////////////////////////////////////////////

  var APIUser = function () {
  };
  APIUser.login = function (login, request, response, callback, config, handler) {
    console.log('APIUser::login()');

    function complete(data) {
      handler.onLogin(request, response, {
        userData: {
          id: data.id,
          username: data.username,
          name: data.name,
          groups: data.groups
        },
        userSettings: data.settings
      }, callback);
    }

    function invalid() {
      callback('Invalid login credentials');
    }

    function onerror(err) {
      console.error(err.toString());
      callback(err.toString());
      return;
    }

    if (!login) {
      invalid();
      return;
    }

    function getUserInfo() {
      var q = 'SELECT `id`, `username`, `name`, `groups`, `settings` FROM `osjs_users` WHERE `username` = ? LIMIT 1;';
      var a = [login.username];

      connection.query(q, a, function (err, rows, fields) {
        if (err) {
          onerror(err);
          return;
        }

        if (rows[0]) {
          var row = rows[0];
          var settings = {};
          var groups = [];

          try {
            settings = JSON.parse(row.settings);
          } catch (e) {
            console.log('failed to parse settings', e);
          }

          try {
            groups = JSON.parse(row.groups);
          } catch (e) {
            console.log('failed to parse groups', e);
          }

          complete({
            id: parseInt(row.id, 10),
            username: row.username,
            name: row.name,
            groups: groups,
            settings: settings
          });
          return;
        }
        invalid();
      });
    }

    var q = 'SELECT `password` FROM `osjs_users` WHERE `username` = ? LIMIT 1;';
    var a = [login.username];

    connection.query(q, a, function (err, rows, fields) {
      if (err) {
        onerror(err);
        return;
      }

      if (rows[0]) {
        var row = rows[0];
        var hash = row.password.replace(/^\$2y(.+)$/i, '\$2a$1');
        bcrypt.compare(login.password, hash, function (err, res) {
          if (err) {
            onerror(err);
          } else {
            if (res === true) {
              getUserInfo();
            } else {
              invalid();
            }
          }
        });
        return;
      }

      invalid();
    });
  };

  APIUser.updateSettings = function (settings, request, response, callback) {
    var uname = request.cookies.get('username');

    var q = 'UPDATE `osjs_users` SET `settings` = ? WHERE `username` = ?;';
    var a = [JSON.stringify(settings), uname];

    connection.query(q, a, function (err, rows, fields) {
      if (err) {
        onerror(err);
        return;
      }

      callback(false, true);
    });
  };

  /////////////////////////////////////////////////////////////////////////////
  // API
  /////////////////////////////////////////////////////////////////////////////

  var API = {
    login: function (args, callback, request, response, config, handler) {
      APIUser.login(args, request, response, function (error, result) {
        if (error) {
          callback(error);
          return;
        }

        handler.onLogin(request, response, result, function () {
          callback(false, result);
        });
      }, config, handler);
    },

    logout: function (args, callback, request, response, config, handler) {
      handler.onLogout(request, response, callback);
    },

    settings: function (args, callback, request, response, config, handler) {
      APIUser.updateSettings(args.settings, request, response, callback);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // USER AUTHORIZATION
  /////////////////////////////////////////////////////////////////////////////

  var AUTHORIZATION = {

    getGroupsFromUser: function (username, cb) {
      //many to many query, to retrieve the list of authorized folders for an user
      var q = 'select `osjs_groups`.* from `osjs_groups` inner join `osjs_group_osjs_user` on `osjs_groups`.`id` = `osjs_group_osjs_user`.`osjs_group_id` where `osjs_group_osjs_user`.`osjs_user_id` = (select `osjs_users`.`id` from `osjs_users` where `osjs_users`.`username` = ?)';
      connection.query(q, [username], function (err, rows, fields) {
        if (err) {
          cb(err);
          return;
        }
        var groups = [''];

        if (rows[0]) {
          rows.forEach(function (group) {
            groups.push(group.realname);
          });
        }

        cb(false, groups);
      });
    },

    checkAgainstProtocolGroups: function (protocol, path, method, cb) {
      //here i check the fact that an user cant make some action in the base dir, the regex is ugly ( need to rewrite )
      if (protocol === 'groups' && path.match(/^[\\]?[\/]*[\w\s\u00C0-\u017F!@#\$%\^\&*\)\(+=._-]*$/g) !== null && ['delete', 'mkdir', 'move', 'write'].indexOf(method) !== -1) {
        //you can't delete, create or rename files here (trad)
        cb('Vous ne pouvez pas supprimer, créer ou renommer de fichiers ici.');
      } else {
        cb(false);
      }
    },

    filterListOfFiles: function (files, groups, cb) {
      // i filter a list of files against a array of authorized folders
      var results = files.filter(function (file) {

        console.log(file);

        if (file.path.replace(/^(.*)\:\/\/(.*)/, '$1') === "groups") {
          var forward = (file.path.replace(/^(.*)\:\/\/(.*)/, '$2').match(/\//g) || []).length;
          if (forward === 1) {
            return groups.indexOf(file.filename) !== -1 || file.type == "file"
          }
        }

        return true;
      });

      results.forEach(function (file) {
        if (file.path.replace(/^(.*)\:\/\/(.*)/, '$1') === "groups") {
          file.filename = file.filename.replace(/^[a-z0-9]+-{1}(.*)/g, '$1');
        }
      });

      cb(false, results);
    }

  };


  /////////////////////////////////////////////////////////////////////////////
  // VFS
  /////////////////////////////////////////////////////////////////////////////

  var VFS = {
    scandir: function (args, request, callback, config, handler) {
      handler.instance._vfs.scandir(args, request, function (err, result) {

        var username = handler.instance.handler.getUserName(request, null);

        AUTHORIZATION.getGroupsFromUser(username, function (err, groups) {

          AUTHORIZATION.filterListOfFiles(result, groups, function (err, files) {
            if (err) {
              callback(err);
              return;
            }
            callback(err, files);
          });

        });

      }, config, handler);
    }
  };

  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  /**
   * @api handler.MysqlHandler
   * @see handler.Handler
   * @class
   */
  exports.register = function (instance, DefaultHandler) {

    function MysqlHandler() {
      DefaultHandler.call(this, instance, API, VFS);
    }

    MysqlHandler.prototype = Object.create(DefaultHandler.prototype);
    MysqlHandler.constructor = DefaultHandler;

    MysqlHandler.prototype.onServerStart = function (cb) {
      var cfg = instance.config.handlers.mysql;

      if (!connection) {
        connection = mysql.createConnection(cfg);
        connection.connect(function () {
          cb();
        });
      } else {
        cb();
      }
    };

    MysqlHandler.prototype.onServerEnd = function (cb) {
      if (connection) {
        connection.end();
      }
      cb();
    };

    /*
     * Here i check the abilities of an user to access a group
     */
    MysqlHandler.prototype._checkHasVFSPrivilege = function (request, response, method, args, callback) {
      var self = this;

      DefaultHandler.prototype._checkHasVFSPrivilege.call(this, request, response, method, args, function (err) {
        if (err) {
          callback(err);
          return;
        }

        //definitions of many variables ( you don't say .. )
        var mount = self.instance.vfs.getRealPath(args.path || args.src, self.instance.config, request);
        var path = mount.path;
        var protocol = mount.protocol.replace(/\:\/\/$/, ''); // ex: "home" if path was home:///something/or/other
        var path_base = path_helper.normalize(mount.path).replace(/\\/g, '/').split("/")[1];
        var username = self.getUserName(request, response);

        //check for actions in the root of the mountpoint
        AUTHORIZATION.checkAgainstProtocolGroups(protocol, path, method, function (err) {
          if (err) {
            callback(err);
            return;
          }

          //check if user has access to a specified group
          AUTHORIZATION.getGroupsFromUser(username, function (err, groups) {
            if (err) {
              callback(err);
              return;
            }

            if (protocol === 'groups' && groups.indexOf(path_base) === -1) {
              // the folder ----- is private (trad)
              callback('Le dossier ' + path_base + ' est privé');
            } else {
              callback(false);
            }

          });
        });
      });
    };

    return new MysqlHandler();
  };

})(require('mysql'), require('bcryptjs'), require('path'));
