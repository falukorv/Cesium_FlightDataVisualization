// Bing maps key
Cesium.BingMapsApi.defaultKey = 'AHktyWLXKe49Xq430Pnj~WpOSHCXoZA8C1sTcoYYfdA~AnGtg5pHMlY-dPZ7oCLACK3lDCAxuNDdWr69TuOLy2Ila2BNsKfWBAdixg12lWwR';

// Do not show overlay as default
$('#gLoadMeterOverlay').css('display', 'none');
$('#aRateMeterOverlay').css('display', 'none');

var eventTable = $('#eventTable')[0];

// Initialize the ground track viewer
var viewerGroundTrack = new Cesium.Viewer('cesiumContainerGroundTrack', {
    timeline: false,
    animation: false,
    selectionIndicator: false,
    infoBox: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    geocoder: false,
    navigationInstructionsInitiallyVisible: false,
    baseLayerPicker: false,
    sceneMode: Cesium.SceneMode.SCENE2D,
    imageryProvider: new Cesium.createOpenStreetMapImageryProvider({
        url: 'https://a.tile.openstreetmap.org'
    })
});

// Initialize the attitude viewer
var viewerAttitude = new Cesium.Viewer('cesiumContainerAttitude', {
    timeline: false,
    animation: false,
    selectionIndicator: false,
    infoBox: false,
    homeButton: false,
    sceneModePicker: false,
    navigationHelpButton: false,
    geocoder: false,
    navigationInstructionsInitiallyVisible: false,
    baseLayerPicker: false
});

// INitialize the main viewer
var viewer = new Cesium.Viewer('cesiumContainer', {
    timeline: false,
    animation: false,
    selectionIndicator: false,
    infoBox: false,
    homeButton: false,
    sceneModePicker: false,
    automaticallyTrackDataSourceClocks: false,
    navigationHelpButton: false,
    geocoder: false,
    navigationInstructionsInitiallyVisible: false,
    baseLayerPicker: false
});

var scene = viewer.scene;
var canvas = viewer.canvas;
var ellipsoid = scene.globe.ellipsoid;
var camera = viewer.camera;
var groundTrackCamera = viewerGroundTrack.camera;
var groundTrackScene = viewerGroundTrack.scene;

// New user inputs, for smoother movement.
var cameraXVelocity = 0;
var cameraYVelocity = 0;
var zoomedDistance = 0;

// Keyboard controls, not yet implemented
function getFlagForKeyCode(keyCode) {
    switch (keyCode) {
        case 'W'.charCodeAt(0):
            return 'moveForward';
        case 'S'.charCodeAt(0):
            return 'moveBackward';
        case 'A'.charCodeAt(0):
            return 'moveLeft';
        case 'D'.charCodeAt(0):
            return 'moveRight';
        case 'Q'.charCodeAt(0):
            return 'zoomIn';
        case 'E'.charCodeAt(0):
            return 'zoomOut';
        default:
            return undefined;
    }
}

// Nicer user controls
function  changeUserControls() {
    canvas.setAttribute('tabindex', '0'); // Put focus on the canvas
    canvas.onclick = function () {
        canvas.focus();
    }
    var currentFrameTime = new Date().getTime(); // Used to keep track on the time between frames, in order to integrate the camera acceleration.

    // Disable default event handlers
    scene.screenSpaceCameraController.enableRotate = false;
    scene.screenSpaceCameraController.enableTranslate = false;
    scene.screenSpaceCameraController.enableZoom = false;
    scene.screenSpaceCameraController.enableTilt = false;
    scene.screenSpaceCameraController.enableLook = false;

    var startMousePosition;
    var mousePosition;
    var startZoomPosition;

    var flags = {
        looking: false,
        zooming: false,
        zoomIn: false,
        zoomOut: false,
        moveUp: false,
        moveDown: false,
        moveLeft: false,
        moveRight: false
    };

    var handler = new Cesium.ScreenSpaceEventHandler(canvas);

    // When pressing left mouse button
    handler.setInputAction(function (movement) {
        flags.looking = true;
        mousePosition = startMousePosition = Cesium.Cartesian3.clone(movement.position);
    }, Cesium.ScreenSpaceEventType.LEFT_DOWN);

    // When pressing right mouse button
    handler.setInputAction(function (movement) {
        flags.zooming = true;
        mousePosition = startZoomPosition = Cesium.Cartesian3.clone(movement.position);
    }, Cesium.ScreenSpaceEventType.RIGHT_DOWN);

    // When not pressing left mouse button
    handler.setInputAction(function (movement) {
        flags.looking = false;
    }, Cesium.ScreenSpaceEventType.LEFT_UP);

    // When not pressing right mouse button
    handler.setInputAction(function (movement) {
        flags.zooming = false;
    }, Cesium.ScreenSpaceEventType.RIGHT_UP);

    // When moving the mouse
    handler.setInputAction(function (movement) {
        mousePosition = movement.endPosition;
    }, Cesium.ScreenSpaceEventType.MOUSE_MOVE);

    // When scrolling
    handler.setInputAction(function (delta) {
        var zoomAmount;
        var scaleFactor = 0.1
        if (delta < 0) {
            zoomAmount = (1 + zoomedDistance) * scaleFactor;
        } else {
            zoomAmount = -(1 + zoomedDistance) * scaleFactor;
        }
        camera.moveBackward(zoomAmount);

        // Keep track of the zoom amount, want to zoom more on greater distances
        zoomedDistance += zoomAmount;
    }, Cesium.ScreenSpaceEventType.WHEEL);

    // For key press
    document.addEventListener('keydown', function (e) {
        var flagName = getFlagForKeyCode(e.keyCode);
        if (typeof flagName !== 'undefined') {
            flags[flagName] = true;
        }
    }, false);

    document.addEventListener('keyup', function (e) {
        var flagName = getFlagForKeyCode(e.keyCode);
        if (typeof flagName !== 'undefined') {
            flags[flagName] = false;
        }
    }, false);

    // Listener for user events
    viewer.clock.onTick.addEventListener(function (clock) {
        var nextFrameTime = new Date().getTime();
        var frameTime = nextFrameTime - currentFrameTime;

        if (flags.looking) {
            var clientWidth = canvas.clientWidth;
            var clientHeight = canvas.clientHeight;

            // Set rotation velocity of camera
            var scaleFactor = 0.01;
            var cameraTargetXVelocity = -(mousePosition.x - startMousePosition.x) * scaleFactor / clientWidth;
            var cameraTargetYVelocity = (mousePosition.y - startMousePosition.y) * scaleFactor / clientHeight;

            // Accelerate the camera movement to the target velocity
            var generalAccFactor = 0.000001;
            if (Math.abs(cameraXVelocity) < Math.abs(cameraTargetXVelocity)) {
                cameraXVelocity += (cameraTargetXVelocity / Math.abs(cameraTargetXVelocity)) * generalAccFactor * frameTime;
            }
            else {
                cameraXVelocity = cameraTargetXVelocity;
            }
            if (Math.abs(cameraYVelocity) < Math.abs(cameraTargetYVelocity)) {
                cameraYVelocity += (cameraTargetYVelocity / Math.abs(cameraTargetYVelocity)) * generalAccFactor * frameTime;
            } else {
                cameraYVelocity = cameraTargetYVelocity;
            }

            // Update camera position
            camera.rotateRight(cameraXVelocity * frameTime);
            camera.rotateDown(cameraYVelocity * frameTime);
        }
        else {

            // Break the camera movement
            var breakFactor = 0.0001;
            if (Math.abs(cameraXVelocity) > 0) {
                cameraXVelocity += -(cameraXVelocity / Math.abs(cameraXVelocity)) * breakFactor
                if (Math.abs(cameraXVelocity) < 0.0001) {
                    cameraXVelocity = 0;
                }
            }
            if (Math.abs(cameraYVelocity) > 0) {
                cameraYVelocity += -(cameraYVelocity / Math.abs(cameraYVelocity)) * breakFactor
                if (Math.abs(cameraYVelocity) < 0.0001) {
                    cameraYVelocity = 0;
                }
            }

            // Update camera position
            camera.rotateDown(cameraYVelocity * frameTime);
            camera.rotateRight(cameraXVelocity * frameTime);
        }

        if (flags.zooming) {
            var clientWidth = canvas.clientWidth;
            var clientHeight = canvas.clientHeight;

            var scaleFactor = (1 + zoomedDistance * 0.05) * 0.1;

            // Zooming speed
            var cameraYZoomFactor = (mousePosition.y - startZoomPosition.y) * scaleFactor / clientHeight;

            var zoomAmount = cameraYZoomFactor * frameTime;

            // Update camera position
            camera.moveBackward(cameraYZoomFactor * frameTime);

            zoomedDistance += zoomAmount;
        }

        //To zoom with the keys
        if (flags.zoomOut) {
            var zoomFactor = 1 + zoomedDistance * 0.05;
            console.log('zoom')
            camera.moveBackward(zoomFactor);
            zoomedDistance += zoomFactor;
        }

        if (flags.zoomIn) {
            var zoomFactor = 1 + zoomedDistance * 0.05;
            console.log('zoom')
            camera.moveForward(zoomFactor);
            zoomedDistance -= zoomFactor;
        }

        // Keep track of time between frames in order to accurately integrate the camera speed
        currentFrameTime = nextFrameTime;
    })

}

// Draw impact zone 
var impactZoneColor = Cesium.Color.ORANGE;
var impactZoneOutlineColor = Cesium.Color.BLACK;
var impactZoneLineWidth = 2;

var mainZone = {
    name: 'MainZone',
    polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray([
            21.038845, 67.872331,
            21.027198, 67.899614,
            20.989309, 67.916980,
            20.066374, 68.322429,
            20.121491, 68.384787,
            20.070978, 68.427238,
            20.226522, 68.490848,
            20.025872, 68.530847,
            19.937453, 68.557972,
            20.052217, 68.591073,
            20.202836, 68.665927,
            20.335797, 68.802324,
            20.306572, 68.926159,
            20.653400, 68.929312,
            21.801814, 68.492774,
            21.868759, 68.413162,
            21.768979, 68.297819,
            21.162791, 67.886996,
            21.159137, 67.887818,
            21.159052, 67.882453,
            21.143173, 67.872297,
            21.038845, 67.872331
        ]),
        width: 3,
        material: new Cesium.PolylineOutlineMaterialProperty({
            color: impactZoneColor,
            outlineWidth: impactZoneLineWidth,
            outlineColor: impactZoneOutlineColor
        })
    }
};

viewer.entities.add(mainZone);
viewerGroundTrack.entities.add(mainZone);

var zoneA = {
    name: 'ZoneA',
    polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray([
            20.989352, 67.916960,
            20.990226, 67.975712,
            21.197833, 67.953046,
            21.196634, 67.910613
        ]),
        width: 3,
        material: new Cesium.PolylineOutlineMaterialProperty({
            color: impactZoneColor,
            outlineWidth: impactZoneLineWidth,
            outlineColor: impactZoneOutlineColor
        })
    }
};

viewer.entities.add(zoneA);
viewerGroundTrack.entities.add(zoneA);

var zoneB = {
    name: 'ZoneB',
    polyline: {
        positions: Cesium.Cartesian3.fromDegreesArray([
            20.121584, 68.384766,
            20.613829, 68.678881,
            20.900231, 68.722465,
            21.322100, 68.676831
        ]),
        width: 3,
        material: new Cesium.PolylineOutlineMaterialProperty({
            color: impactZoneColor,
            outlineWidth: impactZoneLineWidth,
            outlineColor: impactZoneOutlineColor
        })
    }
};

viewer.entities.add(zoneB);
viewerGroundTrack.entities.add(zoneB);


// Clean the attitude view up, remove unused entities.
var attitudeScene = viewerAttitude.scene;
attitudeScene.globe.show = false;
attitudeScene.skyBox = undefined;
attitudeScene.skyAtmosphere = undefined;
attitudeScene.sun = undefined;
attitudeScene.moon = undefined;

// Disabling the possibility to change the view of the attitude window
attitudeScene.screenSpaceCameraController.enableInputs = false;

// Remove credits from the viewers
document.getElementsByClassName("cesium-viewer")[1].removeChild(viewerGroundTrack.bottomContainer);
document.getElementsByClassName("cesium-viewer")[2].removeChild(viewerAttitude.bottomContainer);
document.getElementsByClassName("cesium-viewer")[0].removeChild(viewer.bottomContainer);

// Remove all fullscreen buttons except for the main windown
document.getElementsByClassName("cesium-viewer")[1].removeChild($('.cesium-viewer-fullscreenContainer')[1]);
document.getElementsByClassName("cesium-viewer")[2].removeChild($('.cesium-viewer-fullscreenContainer')[1]);

// Move the remaining fullscreen button
$('.cesium-viewer-fullscreenContainer')[0].style.zIndex = 999;
$('.cesium-viewer-fullscreenContainer')[0].style.top = "1.25%";
$('.cesium-viewer-fullscreenContainer')[0].style.right = "20.2%";

// Add custom credit div
var creditDiv = $('#creditDiv')[0];
scene.frameState.creditDisplay = new Cesium.CreditDisplay(creditDiv);
viewer.scene.frameState.creditDisplay.addDefaultCredit(new Cesium.Credit('Cesium', 'Documentation/images/cesium_logo.png', 'http://cesiumjs.org/'));

// Set inital views
var viewRectangle = new Cesium.Rectangle.fromDegrees(19.7, 67.8, 22, 69);
camera.flyTo({
    destination: viewRectangle
});

groundTrackCamera.zoomIn();
groundTrackCamera.flyTo({
    destination: new Cesium.Cartesian3(2294925.383103221, 873305.9902726595, 6166275.118281682)
});

// The position of Esrange, which will be the initial position of the rocket.
esrangeLong = 21.1068944441480;
esrangeLat = 67.8932469830635;

// Define a ground track marker
var groundTrackMarker = viewerGroundTrack.entities.add({
    "name": 'marker',
    "position": Cesium.Cartesian3.fromDegrees(esrangeLong, esrangeLat, 0),
    "show": false,
    "point": {
        "pixelSize": 10,
        "color": Cesium.Color.BLUE,
        "outlineColor": Cesium.Color.BLUE
    }
});

// Define properties for the groundtrack line
groundTrackLine = viewerGroundTrack.entities.add({
    id: '2D-line',
    polyline: {
        width: 4,
        material: new Cesium.PolylineOutlineMaterialProperty({
            color: Cesium.Color.RED,
            outlineWidth: 1,
            outlineColor: Cesium.Color.BLACK
        })
    }
});

// Define properties for the IIP marker
var IIPMarker = viewerGroundTrack.entities.add({
    "name": 'IIPmarker',
    "position": Cesium.Cartesian3.fromDegrees(0, 0, 0),
    "show": false,
    "billboard": {
        "image": '../Source/Assets/Textures/crosshair3.png',
        "scale": 0.025
    }
});

// Create a billbord that will serve as background if it is desirable to only view the attitude
bbBackgroundPos = new Cesium.Cartesian3.fromDegrees(esrangeLong, esrangeLat, 1000);
var bbBackground = viewerAttitude.entities.add({
    name: 'Billboard',
    position: bbBackgroundPos,
    billboard: {
        image: '../Source/Assets/Textures/bb-background.png',
        scale: 2
    }
});

// Variable for the attitude visualization
attitudeCZML = [
    {
        "id": "document",
        "name": "CZML Path",
        "version": "1.0"
    }, {
        "id": "attitudeRocket",
        "position": {
            "cartographicDegrees": [esrangeLong - 0.001, esrangeLat, 1000]
        },
        "model": {
            //                        "show": false,
            "gltf": "3Dmodels/maxus_mockup.glb",
            "minimumPixelSize": 128,
            "scale": 0.001
        }
    }
];

// Accessing the status diodes, used in order to change them.
var syncDiode = $('#syncDiode');
var syncStatus = false;
var tmDiode = $('#tmDiode');
var tmStatus = false;
var gpsDiode = $('#gpsDiode');
var gpsStatus = false;

// Check when the messages are recieved
var timeOfLastMessage = new Date().getTime();
var timeOfLastGPSMessage = new Date().getTime();
var timeOfLastAttitudeMessage = new Date().getTime();
var timeOfLastGLoadMessage = new Date().getTime();
var timeOfLastARateMessage = new Date().getTime();
var timeOfLastIIPMessage = new Date().getTime();

// Arrays to store the five latest values, used in order to minimize the delay between displayed time and simulated time
var delayedPosition = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
var delayedTime = [" ", " ", " ", " ", " "];
var delayedEvent = [" ", " ", " ", " ", " "];
var delayedSpeed = [0, 0, 0, 0, 0];
var delayedGLoads = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];
var delayedARates = [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]];

// Bool that will be true when the backlogs are loaded
var backlogLoaded = false;

// STREAMING CODE-------------------

// Data sources
var czmlStream = new Cesium.CzmlDataSource();
var czmlAttitudeSource = new Cesium.CzmlDataSource();
var czmlBackTrack = new Cesium.CzmlDataSource();

// Add data sources to the correct viewers
viewer.dataSources.add(czmlStream);
viewerAttitude.dataSources.add(czmlAttitudeSource);

// Do an initial load on the attitude data
viewerAttitude.dataSources.get(0).load(attitudeCZML);

// Sett attitude view
var attitudeEntity = viewerAttitude.dataSources.get(0).entities.getById("attitudeRocket");
viewerAttitude.trackedEntity = attitudeEntity;
var attitudeCameraOffset = new Cesium.HeadingPitchRange(90, 0, 10);
var viewFrom = new Cesium.Cartesian3(-30, 0, 0);
cameraPos = new Cesium.Cartesian3.fromDegrees(esrangeLong - 0.0017, esrangeLat, 1000);
var counter = 0;
var attitudeDone = false;

// Attitude view can sometimes reset on start, so do it a few time to make sure it's correct
$(document).ready(function () {
    var startTrackingInterval = setInterval(function () {
        viewerAttitude.camera.setView({
            destination: cameraPos,
            orientation: {
                heading: Cesium.Math.toRadians(90.0), // east, default value is 0.0 (north)
                pitch: Cesium.Math.toRadians(0), // default value (looking down)
                roll: 0.0
            }
        });
        if (counter > 1 && Math.abs(viewerAttitude.camera.right.y) > 0.99) {
            //console.log("clearing");
            clearInterval(startTrackingInterval);
            attitudeDone = true;
        }
        counter++;
    }, 1000);
});

// stream url
var czmlStreamUrl = "/czml";

// Setup EventSource, used for the server sent events
var czmlEventSource = new EventSource(czmlStreamUrl);

// Put the datasources into Cesium

czmlEventSource.onopen = function () {
    console.log('Connection open');
};

czmlEventSource.onerror = function (event) {
    console.log(event.error);
};

var czmlData;


// lastPos used to keep track on last position in order to draw a polyline that corresponds to the groundtrack
var lastPos;
var firstDocumentDataReceived = false; // Set to true when first data is received
var firstRocketDataReceived = false; // Set to true when first data is received
var apogee = 0; // Keep track of the apogee
var tracked = false;
var messageCounter = 0;
var eventsLoaded = false;
var lastEvent;
var gpsNotUpdatedCounter = 0; // Counting how many packets since we last received gps data
var lastAttitude;
var counterTime = 0;

// Listen for EventSource data coming
czmlEventSource.onmessage = function (event) {
    counter++;
    var t0 = performance.now();

    // Parse the incoming data, and process it
    czmlData = JSON.parse(event.data);
    czmlStream.process(czmlData);

    // Document packet
    if (czmlData[0].id === "document") {

        // If camera is moving, cancel that
        camera.cancelFlight();

        timeOfLastMessage = new Date().getTime();

        // Set sync diode green
        if (!syncStatus) {
            syncDiode.toggleClass('led-red led-green');
            syncStatus = true;
        }

        // If this is the first packet received, load the backlogs
        if (!firstDocumentDataReceived) {
            // Adding the backlog data in the initialization of the stream. If the client connects in the middle of a stream, this should load data, otherwise an empty document.
            viewer.dataSources.add(Cesium.CzmlDataSource.load("/backlog.czml"));
            viewerGroundTrack.dataSources.add(Cesium.CzmlDataSource.load("/backlog.czml"));
            // Adding the events that has already occured;
            d3.csv('../events.csv', function (error, data) {
                var eventDataSet = data;
                eventDataSet.forEach(function (da) {
                    var tableRow = eventTable.insertRow(0);
                    var cell1 = tableRow.insertCell(0);
                    var cell2 = tableRow.insertCell(1);
                    var eventTimeTemp = da.time.toString();
                    var eventTime;
                    if (eventTimeTemp.slice(-1) === "C" || eventTimeTemp.slice(-1) === "H") {
                        eventTime = eventTimeTemp.slice(0, -1);
                    }
                    else {
                        eventTime = eventTimeTemp;
                    }
                    cell1.innerHTML = eventTime;
                    cell2.innerHTML = da.event;
                    cell2.style.color = 'Thistle';
                    lastEvent = da.event;
                });
                firstDocumentDataReceived = true;
            });
        }
    }


    if (czmlData[0].id === "rocket") {
        timeOfLastMessage = new Date().getTime();

        // If stream has been interupted, but is now resumed, set SYNC to green
        if (!syncStatus) {
            syncDiode.toggleClass('led-red led-green');
            syncStatus = true;
        }

        // If the incoming GPS data is old data
        if (czmlData[0].name === "!GPS_updated") {
            console.log("!GPS_updated")
            gpsNotUpdatedCounter++;
            // If GPS signal is considered lost, set GPS diode red
            if (gpsStatus && gpsNotUpdatedCounter > 4) {
                gpsDiode.toggleClass('led-red led-green');
                gpsStatus = false;
            }
        } else {
            gpsNotUpdatedCounter = 0;
            timeOfLastGPSMessage = new Date().getTime();
            if (!gpsStatus) {
                gpsDiode.toggleClass('led-green led-red');
                gpsStatus = true;
            }
            if (!tmStatus) {
                tmDiode.toggleClass('led-green led-red');
                tmStatus = true;
            }
        }

        // If position data is available
        if (typeof czmlData[0].position !== 'undefined') {
            var position = czmlData[0].position.cartographicDegrees;

            // Add to the delay-arrays for later use
            delayedPosition.splice(0, 1);
            delayedPosition[4] = [position[1], position[2], position[position.length - 1]];

            // Use the values that were added two samples ago
            var longitude = delayedPosition[2][0];
            var latitude = delayedPosition[2][1];
            var altitude = delayedPosition[2][2];

            // If this is the first rocket data
            if (!firstRocketDataReceived) {

                // Track the different entities
                viewer.trackedEntity = viewer.dataSources.get(0).entities.getById("rocket");
                lastPos = [delayedPosition[4][0], delayedPosition[4][1]];
                groundTrackMarker.show = true;
                groundTrackCamera.lookAt(new Cesium.Cartesian3.fromDegrees(longitude, latitude, 0), new Cesium.HeadingPitchRange(0, 0, 100000));
                firstRocketDataReceived = true;

                // Set the time corresponding to the data set
                var startTime = Cesium.JulianDate.fromIso8601(czmlData[0].position.epoch);
                Cesium.JulianDate.addSeconds(startTime, -1, startTime);
                viewer.clock.currentTime = startTime;
                viewerAttitude.clock.currentTime = startTime;

                // Change to the smoother user controls
                changeUserControls();
            }
            else {
                // Make sure that the time between the main and attitude viewer is synced
                var syncTime = viewer.clock.currentTime;
                viewerAttitude.clock.currentTime = syncTime;
            }

            // Print position values
            document.getElementsByClassName("longitudeValue")[0].innerHTML = parseFloat(longitude).toFixed(4);
            document.getElementsByClassName("latitudeValue")[0].innerHTML = parseFloat(latitude).toFixed(4);
            document.getElementsByClassName("altitudeValue")[0].innerHTML = parseFloat((altitude + 330) / 1000).toFixed(1) + "km";

            // Add an increment to the ground track
            if (longitude !== 0) {
                viewerGroundTrack.entities.add({
                    name: '2D-line',
                    polyline: {
                        positions: Cesium.Cartesian3.fromDegreesArray([longitude, latitude,
                            lastPos[0], lastPos[1]]),
                        width: 2,
                        material: new Cesium.PolylineOutlineMaterialProperty({
                            color: Cesium.Color.RED,
                            outlineWidth: 1,
                            outlineColor: Cesium.Color.RED
                        })
                    }
                });

                // Update ground track marker position
                groundTrackMarker.position = Cesium.Cartesian3.fromDegrees(longitude, latitude, 0);
                lastPos = [longitude, latitude];
            }

            // Manually track it with the camera
            groundTrackCamera.lookAt(new Cesium.Cartesian3.fromDegrees(longitude, latitude, 0), new Cesium.HeadingPitchRange(0, 0, groundTrackCamera.positionCartographic.height));

            // Update the height curve
            try {
                if (czmlData[2].point.pixelSize >= 0) {
                    updateGraph();
                }
            } catch (err) {
                console.log(err.message);
            }
        }

        // If attitude data is available
        if (typeof czmlData[0].orientation !== 'undefined') {
            var tempOrientation = czmlData[0].orientation.unitQuaternion;
            var tempQ0 = tempOrientation[1];

            // Can the attitude be considered updated?
            if (lastAttitude !== tempQ0) {
                timeOfLastAttitudeMessage = new Date().getTime();
                if (!tmStatus) {
                    tmDiode.toggleClass('led-green led-red');
                    tmStatus = true;
                }
            }
            lastAttitude = tempQ0;

            // Copy the attitude packet revceived to the attitudeCZML used in the attitudeViewer
            var orientation = czmlData[0].orientation;
            if (attitudeDone) {
                attitudeCZML[1].orientation = orientation;
            }

            // Process the new attitude data
            czmlAttitudeSource.process(attitudeCZML);
        }

        // G-Load data
        if (typeof czmlData[1].point.position !== 'undefined') {
            timeOfLastGLoadMessage = new Date().getTime();

            // TM-diode set to green
            if (!tmStatus) {
                tmDiode.toggleClass('led-green led-red');
                tmStatus = true;
            }

            // Add to the delay-array
            delayedGLoads.splice(0, 1);
            delayedGLoads[4] = [parseFloat(czmlData[1].point.position.cartesian[0]).toFixed(2), parseFloat(czmlData[1].point.position.cartesian[1]).toFixed(2), parseFloat(czmlData[1].point.position.cartesian[2]).toFixed(2)];

            // Choose the previous values from the delay-array
            var gLoadX = delayedGLoads[2][0];
            var gLoadY = delayedGLoads[2][1];
            var gLoadZ = delayedGLoads[2][2];

            // Update the G-Load indicator
            document.getElementsByClassName("someMeterXValueInner")[0].innerHTML = gLoadX;
            document.getElementsByClassName("someMeterYValueInner")[0].innerHTML = gLoadY;
            document.getElementsByClassName("someMeterZValueInner")[0].innerHTML = gLoadZ;
            setgLoadIndicatorLength(gLoadX, gLoadY, gLoadZ);
            $('#gLoadMeterOverlay').css('display', 'none');
        }

        // Speed data
        if (typeof czmlData[1].point.pixelSize !== 'undefined') {

            // Add to the delay-arrays
            delayedSpeed.splice(0, 1);
            delayedSpeed[4] = czmlData[1].point.pixelSize;

            // Choose the delayed value
            var speed = delayedSpeed[2];

            // Update speed gauge
            document.getElementsByClassName("odometer")[0].innerHTML = Math.round(100000 + speed * 3.6); // Note that the term "10000" is just used to make the odometer look good.
            setGaugeIndicatorLength(speed * 3.6);
        }

        // Time
        try {
            // Add to delay-array
            delayedTime.splice(0, 1);
            delayedTime[4] = czmlData[2].name;

            // Choose the delayed vaue
            var missionTime = delayedTime[2];
            var realMissionTime;

            // Update mission time
            document.getElementsByClassName("missionTimeValue")[0].innerHTML = "T " + missionTime;

            // Add event to a delay-array
            delayedEvent.splice(0, 1);
            delayedEvent[4] = czmlData[1].name

            // CHoose delayed event
            var eventName = delayedEvent[2]

            // If it is a new event, update the event table
            if (eventName !== lastEvent && firstDocumentDataReceived && eventName !== " ") {
                var tableRow = eventTable.insertRow(0);
                var cell1 = tableRow.insertCell(0);
                var cell2 = tableRow.insertCell(1);
                var eventTimeTemp = missionTime.toString();
                var eventTime;
                if (eventTimeTemp.slice(-1) === "C" || eventTimeTemp.slice(-1) === "H") {
                    eventTime = eventTimeTemp.slice(0, -1);
                }
                else {
                    eventTime = eventTimeTemp;
                }
                cell1.innerHTML = eventTime;
                cell2.innerHTML = eventName;
                cell2.style.color = 'Thistle';
                lastEvent = eventName;
            }
        } catch (err) {
            console.log(err.message);
        }

        // Angular rate data
        if (typeof czmlData[2].point.position !== 'undefined') {
            timeOfLastARateMessage = new Date().getTime();

            // Set TM to green
            if (!tmStatus) {
                tmDiode.toggleClass('led-green led-red');
                tmStatus = true;
            }

            // Add to delay-array
            delayedARates.splice(0, 1);
            delayedARates[4] = [parseFloat(czmlData[2].point.position.cartesian[0]).toFixed(2), parseFloat(czmlData[2].point.position.cartesian[1]).toFixed(2), parseFloat(czmlData[2].point.position.cartesian[2]).toFixed(2)];

            // Choose delayed values
            var aRateX = delayedARates[2][0];
            var aRateY = delayedARates[2][1];
            var aRateZ = delayedARates[2][2];

            // Update indicator for anguar rates
            document.getElementsByClassName("someMeterXValueInner")[1].innerHTML = aRateX;
            document.getElementsByClassName("someMeterYValueInner")[1].innerHTML = aRateY;
            document.getElementsByClassName("someMeterZValueInner")[1].innerHTML = aRateZ;
            setAngleRateIndicatorLength(aRateX, aRateY, aRateZ);
            $('#aRateMeterOverlay').css('display', 'none');
        }

        // Update IIP marker if available
        if (typeof czmlData[3].point.position !== 'undefined') {
            timeOfLastIIPMessage = new Date().getTime();
            IIPMarker.position = new Cesium.Cartesian3.fromDegrees(czmlData[3].point.position.cartographicDegrees[0], czmlData[3].point.position.cartographicDegrees[1], czmlData[3].point.position.cartographicDegrees[2]);
            IIPMarker.show = true;
        }
    }
    var t1 = performance.now();
    // console.log("Call to visualize data took " + (t1 - t0) + " milliseconds.")
};

// Start the routine for checing the diode status
setInterval(
    function () {
        var threshold = 2500;

        var timeSinceLastMessage = new Date().getTime() - timeOfLastMessage;
        var timeSinceLastGPSMessage = new Date().getTime() - timeOfLastGPSMessage;
        var timeSinceLastAttitudeMessage = new Date().getTime() - timeOfLastAttitudeMessage;
        var timeSinceLastGLoadMessage = new Date().getTime() - timeOfLastGLoadMessage;
        var timeSinceLastARateMessage = new Date().getTime() - timeOfLastARateMessage;
        var timeSinceLastIIPMessage = new Date().getTime() - timeOfLastIIPMessage;

        // If the streaming is ongoing, but the time since last message
        // is above a certain threshold, assume that streaming is
        // interrupted and set SYNC to red.
        if (timeSinceLastMessage > threshold) {
            if (syncStatus) {
                syncDiode.toggleClass('led-green led-red');
                syncStatus = false;
            }
            if (gpsStatus) {
                gpsDiode.toggleClass('led-green led-red');
                gpsStatus = false;
            }
            if (tmStatus) {
                tmDiode.toggleClass('led-green led-red');
                tmStatus = false;
            }
        }

        if (timeSinceLastGPSMessage > threshold) {
            if (gpsStatus) {
                gpsDiode.toggleClass('led-green led-red');
                gpsStatus = false;
            }
        }

        // Show overlay if data not available
        if (timeSinceLastGLoadMessage > threshold) {
            $('#gLoadMeterOverlay').css('display', 'block');
        }

        // Show overlay if data not available
        if (timeSinceLastARateMessage > threshold) {
            $('#aRateMeterOverlay').css('display', 'block');
        }

        // Remove IIP marker if it is not available
        if (timeSinceLastIIPMessage > threshold) {
            IIPMarker.show = false;
        }

        if (timeSinceLastGLoadMessage < threshold || timeSinceLastARateMessage < threshold || timeSinceLastGPSMessage < threshold || timeSinceLastAttitudeMessage < threshold) {
            if (!tmStatus) {
                tmDiode.toggleClass('led-green led-red');
                tmStatus = true;
            }
        }
        else {
            if (tmStatus) {
                tmDiode.toggleClass('led-green led-red');
                tmStatus = false;
            }
        }
    }, 4871); // Uneven interval to avoid several routines coinciding, might do something for performance

// IE loading tiles extremely slowly, if IE detected, send warning
if (navigator.userAgent.indexOf('MSIE') !== -1 || navigator.appVersion.indexOf('Trident/') > 0) {
    alert("You are using Internet Explorer: 3D rendering will be very slow. Please use latest Version of Microsoft EDGE, Firefox or Chrome to experience maximum performance.");
}