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
   * Default login method
   *
   * @param   String    username      Login username
   * @param   String    password      Login password
   * @param   Function  callback      Callback function => fn(err)
   *
   * @return  void
   *
   * @method  _Handler::login()
   */
  KeycloakHandler.prototype.login = function (callback) {
    console.info('Handler::login()');

    var opts = {userdata: keycloak.idTokenParsed};
    this.callAPI('login', opts, function (response) {
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
  KeycloakHandler.prototype.onLogin = function (callback) {
    callback = callback || function () {
      };

    localStorage.setItem('token', keycloak.token);
    localStorage.setItem('id_token', keycloak.idToken);
    localStorage.setItem('user_id', keycloak.subject);
    localStorage.setItem('user_data', keycloak.idTokenParsed);

    this.userData = {
      id: keycloak.subject,
      username: keycloak.idTokenParsed.preferred_username,
      name: keycloak.idTokenParsed.given_name,
      groups: keycloak.resourceAccess.osjs.roles
    };

    /*
     * Request USER SETTINGS AND LOCALE (to my api)
     */
    var userSettings = null;
    if (!userSettings || userSettings instanceof Array) {
      userSettings = {};
    }

    document.getElementById('LoadingScreen').style.display = 'block';

    API.setLocale("fr_FR");

    OSjs.Core.getSettingsManager().init(userSettings);

    // if (data.blacklistedPackages) {
    //   OSjs.Core.getPackageManager().setBlacklist(data.blacklistedPackages);
    // }

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

      container.parentNode.removeChild(container);

      self.login(function () {
        self.onLogin(function () {
          callback();
        });
      });


    }).error(function (error) {
      alert(error);
    });

    container.style.display = 'block';

  };


  /////////////////////////////////////////////////////////////////////////////
  // EXPORTS
  /////////////////////////////////////////////////////////////////////////////

  OSjs.Core.Handler = KeycloakHandler;

})(OSjs.API, OSjs.Utils, OSjs.VFS);
