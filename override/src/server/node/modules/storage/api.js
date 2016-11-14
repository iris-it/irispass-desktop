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
/*eslint strict:["error", "global"]*/
'use strict';

var Client = require('node-rest-client').Client;
var rest = new Client();

var auth_server;
var api_server;
var osjs_server;

var getToken = function (http) {
    if (http.request.headers.authorization !== undefined) {
        http.session.set('token', http.request.headers.authorization);
    }

    if (http.session.get('token') !== undefined) {
        return http.session.get('token');
    }
};

module.exports.setSettings = function (http, username, data) {
    return new Promise(function (resolve, reject) {
        console.log('Storage::setSettings');

        var args = {
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + getToken(http)
            },
            data: {
                settings: JSON.stringify(data)
            }
        };

        rest.put(api_server + "settings", args, function (data, response) {
            if (response.statusCode !== 200) {
                reject(response.statusMessage);
            } else {
                resolve(true);
            }
        });
    });
};

module.exports.getSettings = function (http, username) {
    return new Promise(function (resolve, reject) {
        console.log('Storage::getSettings');
        if (http.session.get('settings')) {
            resolve(JSON.parse(http.session.get('settings')));
        } else {
            resolve({});
        }
    });
};

module.exports.getGroups = function (http, username) {
    return new Promise(function (resolve, reject) {
        console.log('Storage::getGroups');
        if (http.session.get('groups')) {
            resolve(JSON.parse(http.session.get('groups')).osjs.roles);
        } else {
            resolve({});
        }
    });
};

module.exports.getBlacklist = function (http, username) {
    return new Promise(function (resolve) {
        //console.log('Storage::getBlacklist');
        resolve([]);
    });
};

module.exports.setBlacklist = function (http, username, list) {
    return new Promise(function (resolve) {
        console.log('Storage::setBlacklist');
        resolve(true);
    });
};

module.exports.register = function (config) {
    console.log('Storage::register');
    auth_server = config.auth_server;
    api_server = config.api_server;
    osjs_server = config.osjs_server;
};

module.exports.destroy = function () {
    console.log('Storage::destroy');
    rest = null;
    auth_server = null;
    api_server = null;
    osjs_server = null;
};