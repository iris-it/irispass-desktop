/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
 *
 * Example Handler: Login screen and session/settings handling via database
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
(function (Client, _path) {
    'use strict';

    var rest = new Client();

    var auth_server;
    var api_server;
    var osjs_server;

    /////////////////////////////////////////////////////////////////////////////
    // COMMON FUNCTIONS
    /////////////////////////////////////////////////////////////////////////////

    var invalidRequest = function (response) {
        return response.statusCode != 200;
    };

    var onerror = function (err, callback) {
        console.error(err.toString());
        callback(err.toString());
    };

    /////////////////////////////////////////////////////////////////////////////
    // USER SESSION ABSTRACTION
    /////////////////////////////////////////////////////////////////////////////

    var APIUser = function () {
        
    };

    APIUser.login = function (server, login, callback) {

        console.log('APIUser::login()');

        var token = server.request.headers.authorization;

        var args = {
            headers: {
                "Authorization": "Bearer " + token
            }
        };

        rest.get(api_server + "me", args, function (data, response) {

            if (invalidRequest(response)) {
                onerror(response.statusMessage, callback);
                return;
            }

            var groups = JSON.parse(data.resource_access);

            var settings = JSON.parse(data.settings);

            server.handler.onLogin(server, {
                userData: {
                    id: data.sub,
                    username: data.preferred_username,
                    name: data.given_name,
                    groups: groups.osjs.roles
                },
                userSettings: settings
            }, callback);
        });
    };

    APIUser.updateSettings = function (server, settings, callback) {

        console.log('APIUser::updateSettings()');

        var token = server.request.headers.authorization;

        var args = {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            },
            data: {
                settings: JSON.stringify(settings)
            }
        };

        rest.put(api_server + "settings", args, function (data, response) {

            if (invalidRequest(response)) {
                onerror(response.statusMessage, callback);
                return;
            }

            callback(false, true);
        });

    };

    /////////////////////////////////////////////////////////////////////////////
    // API
    /////////////////////////////////////////////////////////////////////////////

    var API = {
        login: function (server, args, callback) {
            APIUser.login(server, args, function (error, result) {
                if (error) {
                    callback(error);
                    return;
                }

                server.handler.onLogin(server, result, function () {
                    callback(false, result);
                });
            });
        },

        settings: function (server, args, callback) {
            APIUser.updateSettings(server, args.settings, callback);
        }
    };

    /////////////////////////////////////////////////////////////////////////////
    // VFS Methods (override)
    /////////////////////////////////////////////////////////////////////////////


    /////////////////////////////////////////////////////////////////////////////
    // VFS
    /////////////////////////////////////////////////////////////////////////////

    var VFS = {
        // getRealPath: function (server, path) {
        //     server.handler.instance._vfs.getRealPath = getRealPathCustom;
        // },

        scandir: function (server, args, callback) {
            server.handler.instance._vfs.scandir(server, args, function (err, result) {

                AUTHORIZATION.getGroupsFromUser(server, function (err, groups) {

                    AUTHORIZATION.filterListOfFiles(result, groups, function (err, files) {
                        if (err) {
                            callback(err);
                            return;
                        }
                        callback(err, files);
                    });

                });

            });
        }
    };

    /////////////////////////////////////////////////////////////////////////////
    // USER AUTHORIZATION
    /////////////////////////////////////////////////////////////////////////////

    var AUTHORIZATION = {

        getGroupsFromUser: function (server, cb) {

            var token = server.request.headers.authorization;

            var args = {
                headers: {
                    "Authorization": "Bearer " + token
                }
            };
            rest.get(api_server + "me/groups", args, function (data, response) {

                if (invalidRequest(response)) {
                    onerror(response.statusMessage, cb);
                    return;
                }

                var groups = [''];

                if (data[0]) {
                    data.forEach(function (group) {
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
                    file.filename = file.filename.replace(/^(.*)\#(.*)/g, '$2');
                }
            });

            cb(false, results);
        }

    };

    /////////////////////////////////////////////////////////////////////////////
    // EXPORTS
    /////////////////////////////////////////////////////////////////////////////

    /**
     * @api handler.KeycloaklHandler
     * @see handler.Handler
     * @class
     */
    exports.register = function (instance, DefaultHandler) {

        function KeycloaklHandler() {
            DefaultHandler.call(this, instance, API, VFS);
        }

        KeycloaklHandler.prototype = Object.create(DefaultHandler.prototype);

        KeycloaklHandler.constructor = DefaultHandler;

        KeycloaklHandler.prototype.onServerStart = function (cb) {
            var cfg = instance.config.handlers.keycloak;
            auth_server = cfg.auth_server;
            api_server = cfg.api_server;
            osjs_server = cfg.osjs_server;
            cb();
        };


        KeycloaklHandler.prototype._checkHasVFSPrivilege = function (server, method, args, callback) {
            var self = this;

            DefaultHandler.prototype._checkHasVFSPrivilege.call(this, server, method, args, function (err) {
                if (err) {
                    callback(err);
                    return;
                }

                //definitions of many variables ( you don't say .. )
                var mount = self.instance.vfs.getRealPath(server, args.path || args.src);
                var path = mount.path;
                var protocol = mount.protocol.replace(/\:\/\/$/, ''); // ex: "home" if path was home:///something/or/other
                var path_base = _path.normalize(mount.path).replace(/\\/g, '/').split("/")[1];

                //check for actions in the root of the mountpoint
                AUTHORIZATION.checkAgainstProtocolGroups(protocol, path, method, function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }

                    //check if user has access to a server group
                    AUTHORIZATION.getGroupsFromUser(server, function (err, groups) {
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

        KeycloaklHandler.prototype.setUserData = function (server, data, callback) {
            if (data === null) {
                server.request.session.set('id', null);
                server.request.session.set('username', null);
                server.request.session.set('groups', null);
            } else {
                server.request.session.set('id', data.id);
                server.request.session.set('username', data.username);
                server.request.session.set('groups', JSON.stringify(data.groups));
            }

            callback(false, true);
        };

        KeycloaklHandler.prototype.getHomePath = function (server) {
            var userdir = server.request.session.get('id');
            if (!userdir) {
                throw 'No user session was found';
            }
            return _path.join(server.config.vfs.homes, userdir);
        };

        return new KeycloaklHandler();
    };

})(require('node-rest-client').Client, require('path'));
