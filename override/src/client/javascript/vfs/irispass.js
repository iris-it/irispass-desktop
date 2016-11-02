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
                console.log(error);
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
                    switch (options.type) {
                        case 'text':
                            VFS.Helpers.abToText(response, mime, function (error, text) {
                                callback(error, error ? null : text);
                            });
                            break;
                        case 'datasource':
                            VFS.Helpers.abToDataSource(response, item.mime, function (error, dataSource) {
                                callback(error, error ? null : dataSource);
                            });
                            break;
                        case 'blob':
                            VFS.Helpers.abToBlob(response, item.mime, function (error, blob) {
                                callback(error, error ? null : blob);
                            });
                            break;
                        case 'json':
                            VFS.Helpers.abToText(response, item.mime, function (error, text) {
                                var jsn;
                                if (typeof text === 'string') {
                                    try {
                                        jsn = JSON.parse(text);
                                    } catch (e) {
                                        console.warn('VFS::read()', 'readToJSON', e.stack, e);
                                    }
                                }
                                callback(error, error ? null : jsn);
                            });
                            break;
                        default:
                            return;
                            break;
                    }
                }
                callback(error, response);
            });
        },

        write: function (item, data, callback, options) {
            //httpCall('PUT', {path: item.path, mime: item.mime, data: data}, callback);
        },

        copy: function (src, dest, callback) {
            //httpCall('copy', {path: src.path, dest: dest.path}, callback);
        },

        move: function (src, dest, callback) {
            //httpCall('move', {path: src.path, dest: dest.path}, callback);
        },

        unlink: function (item, callback) {
            //httpCall('unlink', {path: item.path}, callback);
        },

        mkdir: function (item, callback) {
            //httpCall('mkdir', {path: item.path}, callback);
        },

        exists: function (item, callback) {
            //httpCall('exists', {path: item.path}, function (error, doc) {
            //    callback(false, !error);
            //});
        },

        url: function (item, callback, options) {
            //callback(false, OSjs.VFS.Transports.WebDAV.path(item));
        },

        freeSpace: function (root, callback) {
            //callback(false, -1);
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

        // http://api.server/filesystem/{moduleName}
        return base + '/' + moduleName;
    }

    function makeParameters(file) {
        var mm = OSjs.Core.getMountManager();
        var root = mm.getRootFromPath(file.path);
        var rel = file.path.replace(/^[A-z0-9\-_]+\:\/\/\/(.*)$/, '$1');
        var moduleName = mm.getModuleFromPath(file.path);

        return {
            root: root,              // home:// or groups://
            rel: rel,               // file.doc or dir/file.doc
            moduleName: moduleName // home, groups or shared
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
