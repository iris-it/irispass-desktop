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
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS 'AS IS' AND
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

var Client = require('node-rest-client').Client;
var rest = new Client();

var auth_server;
var api_server;
var osjs_server;

/////////////////////////////////////////////////////////////////////////////
// METHODS
/////////////////////////////////////////////////////////////////////////////

/**
 * Handles user login attempts
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {Object}           data          Request data
 */
module.exports.login = function (http, data) {

    var token = http.request.headers.authorization;

    var args = {
        headers: {
            "Authorization": "Bearer " + token
        }
    };

    return new Promise(function (resolve, reject) {
        console.log('Auth::login');
        rest.get(api_server + "me", args, function (data, response) {
            if (response.statusCode !== 200) {
                reject(response.statusMessage);
            } else {

                http.session.set('groups', data.resource_access);
                http.session.set('settings', data.settings);

                resolve({
                    id: data.sub,
                    username: data.preferred_username,
                    name: data.given_name
                });
            }
        });
    });
};

/**
 * Handles user logout attempts
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 */
module.exports.logout = function (http) {
    return new Promise(function (resolve) {
        resolve(true);
    });
};

/**
 * Handler user management
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {String}           command       Management command
 * @param   {Object}           args          Command arguments
 */
module.exports.manage = function (http, command, args) {
    return new Promise(function (resolve, reject) {
        reject('Not available');
    });
};

/**
 * Runs when a HTTP request is made
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 */
module.exports.initSession = function (http, resolve, reject) {
    return new Promise(function (resolve) {
        resolve(true);
    });
};

/**
 * Checks the given permission
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 * @param   {String}           type          Permission type (vfs, api, package)
 * @param   {Object}           options       Permission options/arguments
 */
module.exports.checkPermission = function (http, type, options) {
    return new Promise(function (resolve) {
        resolve(true); // Return false to ignore internal group checking
    });
};

/**
 * Checks if a session is available
 *
 * @param   {ServerRequest}    http          OS.js Server Request
 */
module.exports.checkSession = function (http) {
    return new Promise(function (resolve, reject) {
        if (http.session.get('username')) {
            resolve();
        } else {
            reject('You have no OS.js Session, please log in!');
        }
    });
};

/**
 * When module is registered upon initialization
 *
 * @param   {Object}           config        Configuration for given auth module
 */
module.exports.register = function (config) {
    auth_server = config.auth_server;
    api_server = config.api_server;
    osjs_server = config.osjs_server;
};

/**
 * When module is destroyed upon shutdown
 */
module.exports.destroy = function () {
    rest = null;
    auth_server = null;
    api_server = null;
    osjs_server = null;
};
