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
(function (Client) {
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

    var onerror = function (err) {
        console.error(err.toString());
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
                "Content-Type": "application/json",
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
                    groups: groups.osjs
                },
                userSettings: settings
            }, callback);
        });
    };

    APIUser.prototype.onLogout = function (server, callback) {

        var token = server.request.headers.authorization;

        var args = {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + token
            }
        };

        this.setUserData(server, null, function () {

            rest.get(auth_server + "protocol/openid-connect/logout", args, function (data, response) {
                callback(false, true);
            });

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
                onerror(response.statusMessage);
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

        logout: function (server, args, callback) {
            server.handler.onLogout(server, callback);
        },

        settings: function (server, args, callback) {
            APIUser.updateSettings(server, args.settings, callback);
        }
    };

    /////////////////////////////////////////////////////////////////////////////
    // VFS
    /////////////////////////////////////////////////////////////////////////////

    var VFS = {};

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

        /**
         * By default OS.js will check src/conf for group permissions.
         * This overrides and leaves no checks (full access)
         */
        KeycloaklHandler.prototype.checkAPIPrivilege = function (server, privilege, callback) {
            this._checkHasSession(server, callback);
        };

        /**
         * By default OS.js will check src/conf for group permissions.
         * This overrides and leaves no checks (full access)
         */
        KeycloaklHandler.prototype.checkVFSPrivilege = function (server, method, args, callback) {
            this._checkHasSession(server, callback);
        };

        /**
         * By default OS.js will check src/conf for group permissions.
         * This overrides and leaves no checks (full access)
         */
        KeycloaklHandler.prototype.checkPackagePrivilege = function (server, packageName, callback) {
            this._checkHasSession(server, callback);
        };

        return new KeycloaklHandler();
    };

})(require('node-rest-client').Client);