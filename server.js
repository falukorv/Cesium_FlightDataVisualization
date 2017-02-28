(function () {
    'use strict';
    /*jshint node:true*/

    var express = require('express');
    var url = require('url');
    var request = require('request');
    var fs = require("fs");
    var bodyParser = require("body-parser");


//    Variables in which to store imortant information:
    var streaming = true;
    var CZMLHeader; // This is the first packet in the CZML stream, which should be sent first in every GET-request
    var CZMLRocket; // The packet containing graphical information about the rocket
    var CZMLSpeed; // Packet containing information to be stated in text

    var yargs = require('yargs').options({
        'port': {
            'default': process.env.PORT || 8080,
            'description': 'Port to listen on.'
        },
        'public': {
            'type': 'boolean',
            'description': 'Run a public server that listens on all interfaces.'
        },
        'upstream-proxy': {
            'description': 'A standard proxy server that will be used to retrieve data.  Specify a URL including port, e.g. "http://proxy:8000".'
        },
        'bypass-upstream-proxy-hosts': {
            'description': 'A comma separated list of hosts that will bypass the specified upstream_proxy, e.g. "lanhost1,lanhost2"'
        },
        'help': {
            'alias': 'h',
            'type': 'boolean',
            'description': 'Show this help.'
        }
    });

    var argv = yargs.argv;

    if (argv.help) {
        return yargs.showHelp();
    }

    argv.public = true;

    // eventually this mime type configuration will need to change
    // https://github.com/visionmedia/send/commit/d2cb54658ce65948b0ed6e5fb5de69d022bef941
    // *NOTE* Any changes you make here must be mirrored in web.config.
    var mime = express.static.mime;
    mime.define({
        'application/json': ['czml', 'json', 'geojson', 'topojson'],
        'model/vnd.gltf+json': ['gltf'],
        'model/vnd.gltf.binary': ['bgltf', 'glb'],
        'text/plain': ['glsl']
    });

    var app = express();
    app.use(function (req, resp, next) {
        resp.header("Access-Control-Allow-Origin", "*");
        resp.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
        next();
    });
//    app.use(compression()); // [FOR SOME REASON, USING COMPRESSION BREAKS THE STREAMING]
    app.use(express.static(__dirname));

    app.use(bodyParser.urlencoded({extended: true}));
    app.use(bodyParser.json());

    var streamCSV; //Stream to the backlog.csv
    var streamCZML; //stream to the backlog.czml
    var positionsTempString = []; //String used to construct a newpositions array in order to minimize write sizes
    var positionsOnlyTempString = []; //same as positionsTempString, but excluding the timestamps
    var orientationsTempString = []; //String used to construct a new positions array in order to minimize write sizes
    var positionsTempString = []; //String used to construct a new orientations array in order to minimize write sizes
    var speedsTempString = []; //String used to construct a new speeds array in order to minimize write sizes
    var packetNumber = 0; //Keeping track of the packet number
    var startEpoch; //The epoch of the initial rocket packet
    var streaming = false;
    var date = new Date();

    var postInterval;
    var timeSinceLastPost;

    var openConnections = [];

    var postReq;
    var postResp;

    var czmlString = []; //Will store the czml backlog in this variable, and then write everything to the file for the client read.

    app.all("/czml", function (req, resp) {
        var getReq;
        var getResp;

        if (req.method === "POST") {
            timeSinceLastPost = new Date().getTime();
            postReq = req;
//            console.log(postReq.body);
            postResp = resp;
            czmlString = []; //Resetting the czmlString every call POST request, otherwise we get a memory leak due to the string just appending the same thing over and over.

            if (postReq.body[0].id === "document") {
                // This is the first packet arriving
                CZMLHeader = postReq.body;

                //creating streams in order to stor backlogs. These backlogs will then be loaded whenever a client connects mid-flight.
                streamCSV = fs.createWriteStream("backlog.csv");
                streamCZML = fs.createWriteStream("backlog.czml");

                // Noting that we are currently streaming
                streaming = true;
                console.log("Connection open, currently streaming");

                streamCSV.write('altitude,time' + '\n');

                openConnections.forEach(function (resp) {
                    resp.write('data:' + JSON.stringify(CZMLHeader) + '\n\n');
                });

//                if (!(getResp == null)) {
//                    console.log(getResp);
//                    getResp.write('data:' + JSON.stringify(CZMLHeader) + '\n\n');
//                }
//                console.log(postReq)
////              ------------------------------------------------------------------------------------------------------------------------
////              --------------This does not work on heroku, workaround using setIntervall instead. Uncomment this is fixed.-------------
//                // Attaching listener, on closed connection: set "streaming" to false and reset all variables associated with the stream
//                postResp.connection.addListener("close", function () {
//                    streamCSV.close();
//                    streamCZML.close();
//                    streaming = false;
//                    console.log("Connection closed, stream closed");
//                    CZMLHeader = undefined;
//                    CZMLRocket = undefined;
//                    postReq = undefined;
//                    postResp = undefined;
//                    czmlString = [];
//                    packetNumber = 0;
//                    positionsOnlyTempString = [];
//                });
////              ------------------------------------------------------------------------------------------------------------------------
            } else {
                CZMLRocket = postReq.body;

                //For the first incoming rocket packet:
                if (packetNumber === 0) {
//                    CZMLRocket[0].path.trailTime = 0;
//                    console.log(CZMLRocket[0])
//                    startEpoch = CZMLRocket[0].position.epoch;
                }
// BACKLOGGING
////                console.log(CZMLRocket[0].position.cartographicDegrees);
                var positions = CZMLRocket[0].position.cartographicDegrees;
                var orientations = CZMLRocket[0].orientation.unitQuaternion;
                var speeds = CZMLRocket[1].point.pixelSize.number;
                czmlString.push(CZMLHeader[0]);
//                czmlString.push(CZMLRocket[0]);
//                czmlString.push(CZMLRocket[2]);
////                czmlString.push(CZMLRocket[1]);

                var missionTimes = CZMLRocket[1].point.outlineWidth;
                // Might have some optimization to do here, do we really need to plot all samples?
                streamCSV.write(JSON.stringify(positions[3]) + ',' + JSON.stringify(missionTimes) + '\n');
//                for (var j=0; j<positions.length/4; j++){
//                    stream.write(JSON.stringify(positions[j*4+3]) + ',' + JSON.stringify(missionTimes[j*4+3]) + '\n');
//                }
//                console.log(CZMLRocket[0].position.cartographicDegrees);
//                stream.write(JSON.stringify(CZMLRocket[0].position) + ';' +  + '\n');



//                if (!(getResp == null)) {
//                    getResp.write('data:' + JSON.stringify(CZMLRocket) + '\n\n');
//                }

                positions.forEach(function (pos, index) {
                    if (index % 4 === 0) {
                        positionsTempString.push(pos + packetNumber * 0.5);// This is not a very flexible solution, but based on the fact that we know that the packets are sampled every 0.5s..
                    } else {
                        positionsTempString.push(pos);
                        positionsOnlyTempString.push(pos);
                    }
                });

                CZMLRocket[2].polyline.positions.cartographicDegrees = positionsOnlyTempString;

                openConnections.forEach(function (getResp) {
//                    console.log('Sending rocket data');
                    getResp.write('data:[' + JSON.stringify(CZMLRocket[0]) + ',' + JSON.stringify(CZMLRocket[1]) + ']' + '\n\n');
                });
//
//                orientations.forEach(function (pos, index) {
//                    if (index % 5 === 0) {
//                        orientationsTempString.push(pos + packetNumber * 0.5);// This is not a very flexible solution, but based on the fact that we know that the packets are sampled every 0.5s..
//                    } else {
//                        orientationsTempString.push(pos);
//                    }
//                });
//
//                speeds.forEach(function (pos, index) {
//                    if (index % 2 === 0) {
//                        speedsTempString.push(pos + packetNumber * 0.5);// This is not a very flexible solution, but based on the fact that we know that the packets are sampled every 0.5s..
//                    } else {
//                        speedsTempString.push(pos);
//                    }
//                });
//
////                console.log(czmlString[0][0])
////                czmlString = '[' + JSON.stringify(CZMLHeader[0]) + ',\n {"id":' + JSON.stringify(CZMLRocket[0].id) + ',\n "path":' + JSON.stringify(CZMLRocket[0].path) + ',\n "position":' + JSON.stringify(CZMLRocket[0].position)
//
//                czmlString[1].position.cartographicDegrees = positionsTempString;
//                czmlString[1].position.epoch = startEpoch;
//                czmlString[1].orientation.unitQuaternion = positionsTempString;
//                czmlString[1].orientation.epoch = startEpoch;
//                czmlString[2].polyline.positions.cartographicDegrees = positionsOnlyTempString;
//                czmlString[2].polyline.show = true;
////                czmlString[2].polyline.positions.epoch = startEpoch;
////                czmlString[2].point.pixelSize.number = speedsTempString;
////                czmlString[2].point.pixelSize.epoch = startEpoch;
////                console.log(czmlString);
//
                czmlString.push(CZMLRocket[2]);
//
//                
////                console.log(czmlString[2].polyline.positions.cartographicDegrees)

                packetNumber += 1;

            }
            fs.truncateSync("backlog.czml");
            fs.writeFileSync("backlog.czml", JSON.stringify(czmlString))
//            streamCZML.write(JSON.stringify(czmlString));

            if (postInterval === undefined) {
                postInterval = setInterval(function () {
                    if ((new Date().getTime() - timeSinceLastPost > 2500)) {
                        streamCSV.close();
                        streamCZML.close();
                        streaming = false;
                        console.log("Connection closed, stream closed");
                        CZMLHeader = undefined;
                        CZMLRocket = undefined;
                        postReq = undefined;
                        postResp = undefined;
                        czmlString = [];
                        packetNumber = 0;
                        positionsOnlyTempString = [];
                        clearInterval(postInterval);
                        postInterval = undefined;
                    }
                }, 5000);
            }

            postResp.send('POST request successful');

        } else if (req.method === "GET") {
            getReq = req;
            getResp = resp;

            openConnections.push(getResp);

            getResp.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            });

            if (!(postReq == null)) {
                getResp.write('data:' + JSON.stringify(CZMLHeader) + '\n\n');
            }

            req.connection.on("close", function () {
                var toRemove;
                for (var j = 0; j < openConnections.length; j++) {
                    if (openConnections[j] === resp) {
                        toRemove = j;
                        break;
                    }
                }
                openConnections.splice(j, 1);
                console.log(openConnections.length.toString());
            });

        }





    });

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
        Object.keys(headers).forEach(function (name) {
            if (!dontProxyHeaderRegex.test(name)) {
                result[name] = headers[name];
            }
        });
        return result;
    }

    var upstreamProxy = argv['upstream-proxy'];
    var bypassUpstreamProxyHosts = {};
    if (argv['bypass-upstream-proxy-hosts']) {
        argv['bypass-upstream-proxy-hosts'].split(',').forEach(function (host) {
            bypassUpstreamProxyHosts[host.toLowerCase()] = true;
        });
    }

    app.get('/proxy/*', function (req, res, next) {
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
            url: url.format(remoteUrl),
            headers: filterHeaders(req, req.headers),
            encoding: null,
            proxy: proxy
        }, function (error, response, body) {
            var code = 500;

            if (response) {
                code = response.statusCode;
                res.header(filterHeaders(req, response.headers));
            }

            res.status(code).send(body);
        });
    });

    var server = app.listen(argv.port, argv.public ? undefined : 'localhost', function () {
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

    server.on('close', function () {
        console.log('Cesium development server stopped.');
    });

    var isFirstSig = true;
    process.on('SIGINT', function () {
        if (isFirstSig) {
            console.log('Cesium development server shutting down.');
            server.close(function () {
                process.exit(0);
            });
            isFirstSig = false;
        } else {
            console.log('Cesium development server force kill.');
            process.exit(1);
        }
    });

})();
