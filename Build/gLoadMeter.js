/*global d3, sharedObject, toGeoJSON */

"use strict";

var gLoadMeterWidth;
var gLoadMeterHeight;

var gLoadAxisLength; // Length of the axis in one direction
var gGX;
var gGY;
var gWest;

var maxGLoad;

var pathMaximumX;
var pathMinimumX;

var pathStartPositiveX; //Start x-position if G>0
var pathStartNegativeX; //Start x-position if G<0
var pathYGY;
var pathYGZ;
var pathYGX;

var pathEndPositiveX;

var gLoadGYPath;
var gLoadGZPath;
var gLoadGXPath;

var pathWidth;

//
//
// Create the SVG container and set the origin.
var gLoadSvgBase;

var gLoadSvg;

var positiveGYScale,
        negativeGYScale;

// The x & y axes.
var positiveGaxis;
var negativeGaxis;

var positiveGaxisElement;


var negativeGaxisElement;

var gLoadPathGY;

var gLoadPathGZ;

var gLoadPathGX;


$(document).ready(function () {
    gLoadMeterWidth = document.getElementById("gLoadMeter").offsetWidth;
    gLoadMeterHeight = document.getElementById("gLoadMeter").offsetHeight;

    gLoadAxisLength = gLoadMeterWidth * 0.35; // Length of the axis in one direction
    gGX = 4;
    gGY = 0;
    gWest = 0;

    maxGLoad = 10;
    pathMaximumX = 0.95 * gLoadMeterWidth;
    pathMinimumX = 0.05 * gLoadMeterWidth;

    pathStartPositiveX = (0.5 + 0.25 * 0.9 / 2) * gLoadMeterWidth; //Start x-position if G>0
    pathStartNegativeX = (0.5 - 0.25 * 0.9 / 2) * gLoadMeterWidth; //Start x-position if G<0
    pathYGX = (0.35 - 0.05) * gLoadMeterHeight;
    pathYGY = (0.6 - 0.05) * gLoadMeterHeight;
    pathYGZ = (0.85 - 0.05) * gLoadMeterHeight;

    pathWidth = 0.1 * gLoadMeterHeight;

//
//
// Create the SVG container and set the origin.
    gLoadSvgBase = d3.select("#gLoadMeter").append("svg")
            .attr("width", gLoadMeterWidth)
            .attr("height", gLoadMeterHeight);

    gLoadSvg = gLoadSvgBase.append("g")
            .attr("transform", "translate(" + 0 + "," + 0 + ")");

    positiveGYScale = d3.scaleLog().range([pathStartPositiveX, pathMaximumX]);
    negativeGYScale = d3.scaleLog().range([pathMinimumX, pathStartNegativeX]);

    positiveGYScale.domain([0.0001, 100]);
    negativeGYScale.domain([-100, -0.0001]);

// The x & y axes.
    positiveGaxis = d3.axisBottom(positiveGYScale).ticks(4);
    negativeGaxis = d3.axisBottom(negativeGYScale).ticks(4);

    positiveGaxisElement = gLoadSvg.append("g")
            .attr("class", "positiveLogAxis")
            .attr("transform", "translate(" + 0 + "," + gLoadMeterHeight * 0.85 + ")")
            .call(positiveGaxis);


    negativeGaxisElement = gLoadSvg.append("g")
            .attr("class", "negativeLogAxis")
            .attr("transform", "translate(" + 0 + "," + gLoadMeterHeight * 0.85 + ")")
            .call(negativeGaxis);

    gLoadPathGY = gLoadSvg.append("path")
            .attr("stroke-width", pathWidth)
//        .attr("stroke-linecap","round")
            .attr("stroke", "rgba(255, 0, 0, 0.5)");

    gLoadPathGZ = gLoadSvg.append("path")
            .attr("stroke-width", pathWidth)
//        .attr("stroke-linecap","round")
            .attr("stroke", "rgba(255, 0, 0, 0.5)");

    gLoadPathGX = gLoadSvg.append("path")
            .attr("stroke-width", pathWidth)
//        .attr("stroke-linecap","round")
            .attr("stroke", "rgba(255, 0, 0, 0.5)");

});

new ResizeSensor(document.getElementById("gLoadMeter"), function () {
    $(document).ready(function () {
    gLoadMeterWidth = document.getElementById("gLoadMeter").offsetWidth;
    gLoadMeterHeight = document.getElementById("gLoadMeter").offsetHeight;
    
    gLoadSvgBase.attr("width", gLoadMeterWidth)
            .attr("height", gLoadMeterHeight);
    
    pathYGX = (0.35 - 0.05) * gLoadMeterHeight;
    pathYGY = (0.6 - 0.05) * gLoadMeterHeight;
    pathYGZ = (0.85 - 0.05) * gLoadMeterHeight;
    
    pathMaximumX = 0.95 * gLoadMeterWidth;
    pathMinimumX = 0.05 * gLoadMeterWidth;
    
    pathWidth = 0.1 * gLoadMeterHeight;
    
    gLoadPathGY.attr("stroke-width", pathWidth);

    gLoadPathGZ.attr("stroke-width", pathWidth);

    gLoadPathGX.attr("stroke-width", pathWidth);

    
    pathStartPositiveX = (0.5 + 0.25 * 0.9 / 2) * gLoadMeterWidth; //Start x-position if G>0
    pathStartNegativeX = (0.5 - 0.25 * 0.9 / 2) * gLoadMeterWidth; //Start x-position if G<0
    
    pathMaximumX = 0.95 * gLoadMeterWidth;
    pathMinimumX = 0.05 * gLoadMeterWidth;
    
    positiveGYScale.range([pathStartPositiveX, pathMaximumX]);
    negativeGYScale.range([pathMinimumX, pathStartNegativeX]);

    positiveGaxis = d3.axisBottom(positiveGYScale).ticks(4);
    negativeGaxis = d3.axisBottom(negativeGYScale).ticks(4);

    positiveGaxisElement.attr("transform", "translate(" + 0 + "," + gLoadMeterHeight * 0.85 + ")").call(positiveGaxis);
    negativeGaxisElement.attr("transform", "translate(" + 0 + "," + gLoadMeterHeight * 0.85 + ")").call(negativeGaxis);
    
    gLoadPathGY.attr("d", gLoadGYPath);
    gLoadPathGZ.attr("d", gLoadGZPath);
    gLoadPathGX.attr("d", gLoadGXPath);
    
    });
});

function setgLoadIndicatorLength(Gx, Gy, Gz) {

    if (Gy > 0) {
        var pathEndPositiveX = pathStartPositiveX + (Gy / maxGLoad) * (pathMaximumX - pathStartPositiveX);
        gLoadGYPath = "M" + pathStartPositiveX + "," + pathYGY + "L" + positiveGYScale(Gy) + "," + pathYGY;
    } else if (Gy < 0) {
        var pathEndNegativeX = pathStartNegativeX - (Gy / maxGLoad) * (-pathMaximumX + pathStartNegativeX);
        gLoadGYPath = "M" + pathStartNegativeX + "," + pathYGY + "L" + negativeGYScale(Gy) + "," + pathYGY;
    } else {
        gLoadGYPath = "M" + pathStartNegativeX + "," + pathYGY + "L" + pathStartNegativeX + "," + pathYGY;
    }


    if (Gz > 0) {
        var pathEndPositiveX = pathStartPositiveX + (Gz / maxGLoad) * (pathMaximumX - pathStartPositiveX);
        gLoadGZPath = "M" + pathStartPositiveX + "," + pathYGZ + "L" + positiveGYScale(Gz) + "," + pathYGZ;
    } else if (Gz < 0) {
        var pathEndNegativeX = pathStartNegativeX - (Gz / maxGLoad) * (-pathMaximumX + pathStartNegativeX);
        gLoadGZPath = "M" + pathStartNegativeX + "," + pathYGZ + "L" + negativeGYScale(Gz) + "," + pathYGZ;
    } else {
        gLoadGZPath = "M" + pathStartNegativeX + "," + pathYGZ + "L" + pathStartNegativeX + "," + pathYGZ;
    }

    if (Gx > 0) {
        var pathEndPositiveX = pathStartPositiveX + (Gx / maxGLoad) * (pathMaximumX - pathStartPositiveX);
        gLoadGXPath = "M" + pathStartPositiveX + "," + pathYGX + "L" + positiveGYScale(Gx) + "," + pathYGX;
    } else if (Gx < 0) {
        var pathEndNegativeX = pathStartNegativeX - (Gx / maxGLoad) * (-pathMaximumX + pathStartNegativeX);
        gLoadGXPath = "M" + pathStartNegativeX + "," + pathYGX + "L" + negativeGYScale(Gx) + "," + pathYGX;
    } else {
        gLoadGXPath = "M" + pathStartNegativeX + "," + pathYGX + "L" + pathStartNegativeX + "," + pathYGX;
    }

    gLoadPathGY.transition().attr("d", gLoadGYPath).duration(500);
    gLoadPathGZ.transition().attr("d", gLoadGZPath).duration(500);
    gLoadPathGX.transition().attr("d", gLoadGXPath).duration(500);
}