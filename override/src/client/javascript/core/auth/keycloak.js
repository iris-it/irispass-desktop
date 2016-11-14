/*!
 * OS.js - JavaScript Cloud/Web Desktop Platform
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
(function (API, Utils, Authenticator) {
    'use strict';

    var keycloak = null;

    function KeycloakAuthenticator() {
        Authenticator.apply(this, arguments);
    }

    KeycloakAuthenticator.prototype = Object.create(Authenticator.prototype);
    KeycloakAuthenticator.constructor = Authenticator;

    KeycloakAuthenticator.prototype.onCreateUI = function (callback) {
        var self = this;

        keycloak = Keycloak('/keycloak.json');

        document.getElementById('LoadingScreen').style.display = 'block';

        keycloak.init({onLoad: 'login-required', flow: 'implicit'}).success(function () {
            console.debug('KeycloakAuthenticator::init()', 'login response');

            if (keycloak.resourceAccess.osjs === undefined) {
                callback('Accès non autorisé - Permission manquante', false);
            }

            console.debug('KeycloakAuthenticator::init()', 'store token');
            localStorage.setItem('token', keycloak.token);

            self.login({}, function (error, result) {
                self.onLogin(result, function () {
                    callback();
                });
            });

        }).error(function (error) {
            alert(error);
        });
    };

    KeycloakAuthenticator.prototype.logout = function (callback) {

    };

    /////////////////////////////////////////////////////////////////////////////
    // EXPORTS
    /////////////////////////////////////////////////////////////////////////////

    OSjs.Auth = OSjs.Auth || {};
    OSjs.Auth.keycloak = KeycloakAuthenticator;

})(OSjs.API, OSjs.Utils, OSjs.Core.Authenticator);
