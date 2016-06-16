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

//
// See doc/handler-mysql.txt
//

(function (API, Utils, VFS) {
    'use strict';

    window.OSjs = window.OSjs || {};
    OSjs.Core = OSjs.Core || {};

    var keycloak = null;

    /////////////////////////////////////////////////////////////////////////////
    // HANDLER
    /////////////////////////////////////////////////////////////////////////////

    /**
     * @extends OSjs.Core._Handler
     * @class
     */
    function KeycloakHandler() {
        OSjs.Core._Handler.apply(this, arguments);
    }

    KeycloakHandler.prototype = Object.create(OSjs.Core._Handler.prototype);
    KeycloakHandler.constructor = OSjs.Core._Handler;

    OSjs.Core._Handler.use.defaults(KeycloakHandler);

    /**
     * Calls Normal "Backend"
     *
     * @see _Handler::_callAPI()
     * @see _Handler::_callVFS()
     * @method  _Handler::__callXHR()
     */
    KeycloakHandler.prototype.__callXHR = function (url, args, options, cbSuccess, cbError) {
        var self = this;

        cbError = cbError || function () {
                console.warn('Handler::__callXHR()', 'error', arguments);
            };

        var bearer = {
            'Authorization': localStorage.getItem('token')
        };

        var data = {
            url: url,
            requestHeaders: bearer,
            method: 'POST',
            json: true,
            body: args,
            onsuccess: function (/*response, request, url*/) {
                cbSuccess.apply(self, arguments);
            },
            onerror: function (/*error, response, request, url*/) {
                cbError.apply(self, arguments);
            }
        };

        if (options) {
            Object.keys(options).forEach(function (key) {
                data[key] = options[key];
            });
        }

        Utils.ajax(data);

        return true;
    };


    /**
     * Default login method
     *
     * @param   Function  callback      Callback function => fn(err)
     *
     * @return  void
     *
     * @method  _Handler::login()
     */
    KeycloakHandler.prototype.login = function (callback) {
        console.info('Handler::login()');
        this.callAPI('login', {}, function (response) {
            if (response.result) { // This contains an object with user data
                callback(false, response.result);
            } else {
                var error = response.error || API._('ERR_LOGIN_INVALID');
                callback(API._('ERR_LOGIN_FMT', error), false);
            }
        }, function (error) {
            callback(API._('ERR_LOGIN_FMT', error), false);
        });
    };


    /**
     * Called when login() is finished
     *
     * @param   Object    data          JSON Data from login action (userData, userSettings, etc)
     * @param   Function  callback      Callback function
     *
     * @return  void
     *
     * @method  _Handler::onLogin()
     */
    KeycloakHandler.prototype.onLogin = function (data, callback) {
        callback = callback || function () {
            };

        var userSettings = data.userSettings;
        if (!userSettings || userSettings instanceof Array) {
            userSettings = {};
        }

        this.userData = data.userData;

        // Ensure we get the user-selected locale configured from WM
        function getUserLocale() {
            var curLocale = Utils.getUserLocale() || API.getConfig('Locale');
            var result = OSjs.Core.getSettingsManager().get('CoreWM');
            if (!result) {
                try {
                    result = userSettings.CoreWM;
                } catch (e) {
                }
            }
            return result ? (result.language || curLocale) : curLocale;
        }

        document.getElementById('LoadingScreen').style.display = 'block';

        API.setLocale(getUserLocale());
        OSjs.Core.getSettingsManager().init(userSettings);

        if (data.blacklistedPackages) {
            OSjs.Core.getPackageManager().setBlacklist(data.blacklistedPackages);
        }

        callback();
    };

    /**
     * Initializes login screen
     *
     * @method  _Handler::initLoginScreen()
     */
    KeycloakHandler.prototype.initLoginScreen = function (callback) {
        var self = this;

        keycloak = Keycloak('/keycloak.json');

        var container = document.getElementById('Login');

        if (!container) {
            throw new Error('Could not find Login Form Container');
        }

        keycloak.init({onLoad: 'login-required', flow: 'implicit'}).success(function () {
            console.debug('Handlers::init()', 'login response');

            console.debug('Handlers::init()', 'store token');
            localStorage.setItem('token', keycloak.token);

            container.parentNode.removeChild(container);

            self.login(function (error, result) {
                self.onLogin(result, function () {
                    callback();
                });
            });

        }).error(function (error) {
            alert(error);
        });

        container.style.display = 'block';

    };

    OSjs.API.addHook('onShutdown', function () {
        var config = API.getConfig();

        localStorage.clear();

        window.location = config.auth_server + "protocol/openid-connect/logout?redirect_uri=" + encodeURIComponent(config.osjs_server);
    });


    /////////////////////////////////////////////////////////////////////////////
    // EXPORTS
    /////////////////////////////////////////////////////////////////////////////

    OSjs.Core.Handler = KeycloakHandler;

})(OSjs.API, OSjs.Utils, OSjs.VFS);
