/*global d3, sharedObject, toGeoJSON */

"use strict";

//Setting the odometer options
//window.odometerOptions = {
//    //auto: false, // Don't automatically initialize everything with class 'odometer'
//    //selector: '.my-numbers', // Change the selector used to automatically find things to be animated
//    format: 'd', // Change how digit groups are formatted, and how many digits are shown after the decimal point
//    //duration: 3000, // Change how long the javascript expects the CSS animation to take
//    //theme: 'car', // Specify the theme (if you have more than one theme css file on the page)
//    animation: 'count' // Count is a simpler animation method which just increments the value,
//    // use it when you're looking for something more subtle.
//};

// Chart dimensions.

var windowWidth = document.getElementById("cesiumContainer").offsetWidth;
var windowHeight = document.getElementById("cesiumContainer").offsetHeight;

var gaugeWidth = document.getElementById("gaugeBase").offsetWidth;
var gaugeHeight = gaugeWidth;

var gaugeOdometer = $('.odometer');


// Adding the data into new arrays, since the converted ones are quite messy
var gaugeAltitude = [];
var gaugeCoords = [];

// Create the SVG container and set the origin.
var gaugeSvgBase = d3.select("#gaugeBase").append("svg")
        .attr("width", gaugeWidth)
        .attr("height", gaugeHeight);

var gaugeSvg = gaugeSvgBase.append("g")
        .attr("transform", "translate(" + gaugeWidth / 2 + "," + gaugeWidth / 2 + ")");
//        .attr("transform", "translate(" + 0.025 * graphHeight + "," + 0.025 * graphHeight + ")");

var gaugeRadius = gaugeWidth / 2;
var gaugeStartAngle = -4 * Math.PI / 5;
var gaugeEndAngle = 4 * Math.PI / 5;
var NoOfGaugeTicks = 13; // This decides how many equidistant ticks that will be drawn on the gauge arc
var tickLength = gaugeWidth * 0.03;
var arcRadius = gaugeRadius * 0.8;
var gaugeStartValue = 0;
var gaugeMaxValue = 12000;

// Arc function for the stationary arc
var arc = d3.arc()
        .innerRadius(arcRadius - 1)
        .outerRadius(arcRadius + 1)
        .startAngle(gaugeStartAngle)
        .endAngle(gaugeEndAngle);

// Arc function for the value indicator
var indicator = d3.arc()
        .innerRadius(arcRadius + 1)
        .outerRadius(arcRadius * 1.1)
        .startAngle(gaugeStartAngle)
        .endAngle(function (d) {
            return d;
        });


var gaugeArc = gaugeSvg.append("path")
        .attr("class", "arcStationary");

var gaugeTicksPath;     // The string containing the svg path to draw
var tickLabels;    // Variable to store tick labels in, in order to access them later

drawGaugeSvg();

// Drawing the ticks on the gauge arc, and adding the corresponding values
function drawGaugeSvg() {
    gaugeTicksPath = "";
    tickLabels = [];
    d3.selectAll(".tickValues").remove();
    for (var i = 0; i < NoOfGaugeTicks; i++) {

        gaugeArc.attr("d", arc);

        var theta;      //Angle of which to place the tick at
        var tickValue;  //Scale value of the position of the tick
        var tickValueX; //X-placement of the tickvalue
        var tickValueY; //Y-placement of the tickvalue
        if (i === 0) {
            theta = gaugeStartAngle;
            tickValue = gaugeStartValue;

            gaugeTicksPath = "M" + eval("Math.sin(theta)*(arcRadius-tickLength)") + "," + eval("-Math.cos(theta)*(arcRadius-tickLength)") + "L" + eval("Math.sin(theta)*(arcRadius)") + "," + eval("-Math.cos(theta)*(arcRadius)");
        } else if (i === NoOfGaugeTicks - 1) {
            gaugeTicksPath = gaugeTicksPath + "M" + eval("Math.sin(theta)*(arcRadius-tickLength)") + "," + eval("-Math.cos(theta)*(arcRadius-tickLength)") + "L" + eval("Math.sin(theta)*(arcRadius)") + "," + eval("-Math.cos(theta)*(arcRadius)");
        } else {
            gaugeTicksPath = gaugeTicksPath + "M" + eval("Math.sin(theta)*(arcRadius-tickLength/2)") + "," + eval("-Math.cos(theta)*(arcRadius-tickLength/2)") + "L" + eval("Math.sin(theta)*(arcRadius+tickLength/2)") + "," + eval("-Math.cos(theta)*(arcRadius+tickLength/2)");
        }
        tickValueX = Math.sin(theta) * (arcRadius - tickLength * 3);
        tickValueY = -Math.cos(theta) * (arcRadius - tickLength * 3);
        tickLabels[i] = gaugeSvg.append("text")
                .attr("class", "tickValues")
                .attr("text-anchor", "middle")
                .attr("x", tickValueX)
                .attr("y", tickValueY)
                .text(Math.floor(tickValue).toString());

        tickValue = tickValue + (gaugeMaxValue - gaugeStartValue) / (NoOfGaugeTicks - 1); // Calculate the next tickValue
        theta = theta + (gaugeEndAngle - gaugeStartAngle) / (NoOfGaugeTicks - 1); // Calculate the next angle
    }
}

var gaugeTicks = gaugeSvg.append("path")
        .attr("class", "gaugeTicks")
        .attr("d", gaugeTicksPath);

var gaugeIndicatorArc = gaugeSvg.append("path")
        .datum(gaugeStartAngle)
        .attr("class", "arcDynamic")
        .attr("d", indicator);

var odometerWidth;

$(document).ready(function () {
    if (windowWidth < windowHeight) {
        $('.tickValues').css({'font-size': '2.2vw'});
        $('.gaugeSpeedLabel').css({'font-size': '4vw'});
        $('.odometer').css({'font-size': '3vw'});
        $('.gaugeUnitLabel').css({'font-size': '2vw'});
    } else {
        $('.tickValues').css({'font-size': '2.2vh'});
        $('.gaugeSpeedLabel').css({'font-size': '4vh'});
        $('.odometer').css({'font-size': '3vh'});
        $('.gaugeUnitLabel').css({'font-size': '3vh'});
    }

    odometerWidth = gaugeOdometer.outerWidth();
    gaugeOdometer.css({left: gaugeWidth / 2 - odometerWidth});
});


// Store the displayed angles in _current.
// Then, interpolate from _current to the new angles.
// During the transition, _current is updated in-place by d3.interpoladte.
function arcTween(d) {
    if (this._current === undefined) {
        this._current = gaugeStartAngle;
    }
    var i = d3.interpolateNumber(this._current, d);
    this._current = d;
    return function (t) {
        return indicator(i(t));
    };
}
;


function setGaugeIndicatorLength(speedValue) {
    speedValue = speedValue;
    var indicatorEndAngle = gaugeStartAngle + speedValue / gaugeMaxValue * (gaugeEndAngle - gaugeStartAngle);
    //indicator.endAngle(indicatorEndAngle);
    //console.log(indicator.toString())
    gaugeIndicatorArc.datum(indicatorEndAngle);
    gaugeIndicatorArc.transition().attrTween("d", arcTween).duration(500);
    //gaugeValueText.text(Math.round(10000 + speedValue));
}

new ResizeSensor(document.getElementById("gaugeBase"), function () {
    windowWidth = document.getElementById("cesiumContainer").offsetWidth;
    windowHeight = document.getElementById("cesiumContainer").offsetHeight;
    var gaugeWidth = document.getElementById("gaugeBase").offsetWidth;
    gaugeHeight = gaugeWidth;
    gaugeRadius = gaugeWidth / 2;
    tickLength = gaugeWidth * 0.03;
    arcRadius = gaugeRadius * 0.8;

    gaugeSvgBase.attr("width", gaugeWidth)
            .attr("height", gaugeHeight);

    gaugeSvg.attr("transform", "translate(" + gaugeWidth / 2 + "," + gaugeWidth / 2 + ")");

    arc.innerRadius(arcRadius - 1)
            .outerRadius(arcRadius + 1);

    indicator.innerRadius(arcRadius + 1)
            .outerRadius(arcRadius * 1.1);

    drawGaugeSvg();
    gaugeArc.attr("d", arc);
    gaugeTicks.attr("d", gaugeTicksPath);
    gaugeIndicatorArc.attr("d", indicator);

    if (windowWidth < windowHeight) {
        $('.tickValues').css({'font-size': '2.2vw'});
        $('.gaugeSpeedLabel').css({'font-size': '4vw'});
        $('.odometer').css({'font-size': '3vw'});
        $('.gaugeUnitLabel').css({'font-size': '2vw'});
    } else {
        $('.tickValues').css({'font-size': '2.2vh'});
        $('.gaugeSpeedLabel').css({'font-size': '4vh'});
        $('.odometer').css({'font-size': '3vh'});
        $('.gaugeUnitLabel').css({'font-size': '3vh'});
    }

    odometerWidth = gaugeOdometer.outerWidth();
    gaugeOdometer.css({left: gaugeWidth / 2 - odometerWidth});
});