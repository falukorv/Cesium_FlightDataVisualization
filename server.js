(function() {
    'use strict';
    /*jshint node:true*/

    var express = require('express');
    var http = require('http');
    var compression = require('compression');
    var url = require('url');
    var request = require('request');
    var Chance = require('chance');
    var fs = require("fs");

    var yargs = require('yargs').options({
        'port' : {
            'default' : 8080,
            'description' : 'Port to listen on.'
        },
        'public' : {
            'type' : 'boolean',
            'description' : 'Run a public server that listens on all interfaces.'
        },
        'upstream-proxy' : {
            'description' : 'A standard proxy server that will be used to retrieve data.  Specify a URL including port, e.g. "http://proxy:8000".'
        },
        'bypass-upstream-proxy-hosts' : {
            'description' : 'A comma separated list of hosts that will bypass the specified upstream_proxy, e.g. "lanhost1,lanhost2"'
        },
        'help' : {
            'alias' : 'h',
            'type' : 'boolean',
            'description' : 'Show this help.'
        }
    });
    
    var argv = yargs.argv;

    if (argv.help) {
        return yargs.showHelp();
    }
    
    // argv.public = true;

    // eventually this mime type configuration will need to change
    // https://github.com/visionmedia/send/commit/d2cb54658ce65948b0ed6e5fb5de69d022bef941
    // *NOTE* Any changes you make here must be mirrored in web.config.
    var mime = express.static.mime;
    mime.define({
        'application/json' : ['czml', 'json', 'geojson', 'topojson'],
        'model/vnd.gltf+json' : ['gltf'],
        'model/vnd.gltf.binary' : ['bgltf', 'glb'],
        'text/plain' : ['glsl']
    });
    
    var app = express();
    app.use(function(req, resp, next) {
        resp.header("Access-Control-Allow-Origin", "*");
        resp.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
//    app.use(compression()); [FOR SOME REASON, THIS OPTION BREAKS THE STREAMING]
    app.use(express.static(__dirname));
    
    //TEST --------------------------------------
    
//    var openConnections = [];
    var chance = new Chance();
    
    var testdata = 'Hi, I am data!';
    
    app.get('/czml', function(req, resp) {
        req.socket.setTimeout(2 * 60 * 1000);
        
    // send headers for event-stream connection
    // see spec for more information
        resp.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
        });
        resp.write('\n');
        
        // push this res object to our global variable
//        openConnections.push(resp);
        
        // send document packet
        var d = new Date();
        resp.write('id: ' + 1 + '\n');
        resp.write('data:' + JSON.stringify({ "id":"document", "version":"1.0" })+   '\n\n'); // Note the extra newline

        // When the request is closed, e.g. the browser window
        // is closed. We search through the open connections
        // array and remove this connection.
        
//        req.on("close", function() {
//            var toRemove;
//            for (var j =0 ; j < openConnections.length ; j++) {
//                if (openConnections[j] == resp) {
//                    toRemove =j;
//                    break;
//                }
//            }
//            openConnections.splice(j,1);
//        });

        setInterval(function() {
        // we walk through each connection
        
//            openConnections.forEach(function(resp) {
            
            
                // send doc
                var d = new Date();
                resp.write('id: ' + 50 + '\n');
                resp.write('data:' + createMsg() +   '\n\n'); // Note the extra newline
//        });

    }, 200);
    });

    function createMsg() {
        var d = new Date();
        var entity = {
            "id": 60,
            "polyline": {
                "positions": {
                    "cartographicDegrees": [
                      chance.latitude(), chance.longitude(), 0
                      ,chance.latitude(), chance.longitude(), 0
                  ]
            },
            "width": 2,
            "material":
                { "solidColor":
                    { "color" :
                        {"rgba": [0,0,255,255]}
                    }
                }
            }
        };
        return JSON.stringify(entity);; 
    }

//--------------------------------------

    function getRemoteUrlFromParam(req) {
        var remoteUrl = req.params[0];
        if (remoteUrl) {
            // add http:// to the URL if no protocol is present
            if (!/^https?:\/\//.test(remoteUrl)) {
                remoteUrl = 'http://' + remoteUrl;
            }
            remoteUrl = url.parse(remoteUrl);
            // copy query string
            remoteUrl.search = url.parse(req.url).search;
        }
        return remoteUrl;
    }

    var dontProxyHeaderRegex = /^(?:Host|Proxy-Connection|Connection|Keep-Alive|Transfer-Encoding|TE|Trailer|Proxy-Authorization|Proxy-Authenticate|Upgrade)$/i;

    function filterHeaders(req, headers) {
        var result = {};
        // filter out headers that are listed in the regex above
        Object.keys(headers).forEach(function(name) {
            if (!dontProxyHeaderRegex.test(name)) {
                result[name] = headers[name];
            }
        });
        return result;
    }

    var upstreamProxy = argv['upstream-proxy'];
    var bypassUpstreamProxyHosts = {};
    if (argv['bypass-upstream-proxy-hosts']) {
        argv['bypass-upstream-proxy-hosts'].split(',').forEach(function(host) {
            bypassUpstreamProxyHosts[host.toLowerCase()] = true;
        });
    }

    app.get('/proxy/*', function(req, res, next) {
        // look for request like http://localhost:8080/proxy/http://example.com/file?query=1
        var remoteUrl = getRemoteUrlFromParam(req);
        if (!remoteUrl) {
            // look for request like http://localhost:8080/proxy/?http%3A%2F%2Fexample.com%2Ffile%3Fquery%3D1
            remoteUrl = Object.keys(req.query)[0];
            if (remoteUrl) {
                remoteUrl = url.parse(remoteUrl);
            }
        }

        if (!remoteUrl) {
            return res.status(400).send('No url specified.');
        }

        if (!remoteUrl.protocol) {
            remoteUrl.protocol = 'http:';
        }

        var proxy;
        if (upstreamProxy && !(remoteUrl.host in bypassUpstreamProxyHosts)) {
            proxy = upstreamProxy;
        }

        // encoding : null means "body" passed to the callback will be raw bytes

        request.get({
            url : url.format(remoteUrl),
            headers : filterHeaders(req, req.headers),
            encoding : null,
            proxy : proxy
        }, function(error, response, body) {
            var code = 500;

            if (response) {
                code = response.statusCode;
                res.header(filterHeaders(req, response.headers));
            }

            res.status(code).send(body);
        });
    });

    var server = app.listen(argv.port, argv.public ? undefined : 'localhost', function() {
        if (argv.public) {
            console.log('Cesium development server running publicly.  Connect to http://localhost:%d/', server.address().port);
        } else {
            console.log('Cesium development server running locally.  Connect to http://localhost:%d/', server.address().port);
        }
    });

    server.on('error', function (e) {
        if (e.code === 'EADDRINUSE') {
            console.log('Error: Port %d is already in use, select a different port.', argv.port);
            console.log('Example: node server.js --port %d', argv.port + 1);
        } else if (e.code === 'EACCES') {
            console.log('Error: This process does not have permission to listen on port %d.', argv.port);
            if (argv.port < 1024) {
                console.log('Try a port number higher than 1024.');
            }
        }
        console.log(e);
        process.exit(1);
    });

    server.on('close', function() {
        console.log('Cesium development server stopped.');
    });

    var isFirstSig = true;
    process.on('SIGINT', function() {
        if (isFirstSig) {
            console.log('Cesium development server shutting down.');
            server.close(function() {
              process.exit(0);
            });
            isFirstSig = false;
        } else {
            console.log('Cesium development server force kill.');
            process.exit(1);
        }
    });

})();
