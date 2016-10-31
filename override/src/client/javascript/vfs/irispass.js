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
(function (Utils, API, VFS) {
    'use strict';

    /////////////////////////////////////////////////////////////////////////////
    // HELPERS
    /////////////////////////////////////////////////////////////////////////////

    function httpCall(func, item, callback) {

        var url = makeUrl(item) + '/' + func;

        var params = makeParameters(item);

        var bearer = {
            "Authorization": "Bearer " + localStorage.getItem('token')
        };

        var args = {
            requestHeaders: bearer,
            method: 'POST',
            body: params,
            json: true,
            url: url,
            onerror: function (error) {
                callback(error);
            },
            onsuccess: function (response) {
                callback(false, response);
            }
        };

        if (func === 'read') {
            args.responseType = 'arraybuffer';
        }

        Utils.ajax(args);
    }

    /////////////////////////////////////////////////////////////////////////////
    // API
    /////////////////////////////////////////////////////////////////////////////

    var Transport = {
        scandir: function (item, callback, options) {

            httpCall('scandir', item, function (error, response) {

                var list = [];

                if (!error) {
                    response.result.forEach(function (iter) {
                        list.push(new VFS.File(iter));
                    });
                }

                callback(error, list);
            });
        },

        read: function (item, callback, options) {
            options = options || {};

            var mime = item.mime || 'application/octet-stream';

            httpCall('read', item, function (error, response) {
                if (!error) {
                    if (options.type === 'text') {
                        OSjs.VFS.abToText(response, mime, function (error, text) {
                            callback(error, text);
                        });
                        return;
                    }
                }
                callback(error, response);
            });
        },

        exists: function (item, callback) {
            httpCall('exists', item, function (err) {
                callback(err, err ? false : true);
            });
        },

        url: function (item, callback, options) {
            callback(false, makePath(item));
        }
    };

    /////////////////////////////////////////////////////////////////////////////
    // WRAPPERS
    /////////////////////////////////////////////////////////////////////////////

    function makePath(file) {
        var mm = OSjs.Core.getMountManager();
        var rel = mm.getPathProtocol(file.path);
        var module = mm.getModuleFromPath(file.path, false, true);
        var base = (module.options || {}).url;
        return base + rel.replace(/^\/+/, '/');
    }

    function makeUrl(file) {
        var mm = OSjs.Core.getMountManager();
        var moduleName = mm.getModuleFromPath(file.path);
        var module = mm.getModuleFromPath(file.path, false, true);
        var base = (module.options || {}).url;

        return base + '/' + moduleName;
    }

    function makeParameters(file) {
        var mm = OSjs.Core.getMountManager();
        var root = mm.getRootFromPath(file.path);
        var rel = file.path.replace(/^[A-z0-9\-_]+\:\/\/\/(.*)$/, '$1');
        var moduleName = mm.getModuleFromPath(file.path);

        return {
            root: root,
            rel: rel,
            moduleName: moduleName
        };
    }

    /////////////////////////////////////////////////////////////////////////////
    // EXPORTS
    /////////////////////////////////////////////////////////////////////////////

    OSjs.VFS.Transports.Irispass = {
        module: Transport,
        path: makePath
    };

})(OSjs.Utils, OSjs.API, OSjs.VFS);
