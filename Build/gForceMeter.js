/*global d3, sharedObject, toGeoJSON */

"use strict";

var gForceMeterWidth;
var gForceMeterHeight;

var gForceAxisLength; // Length of the axis in one direction
var gGX;
var gGY;
var gWest;

var maxGForce;

var pathMaximumX;
var pathMinimumX;

var pathStartPositiveX; //Start x-position if G>0
var pathStartNegativeX; //Start x-position if G<0
var pathYGY;
var pathYGZ;
var pathYGX;

var pathEndPositiveX;

var gForceGYPath;
var gForceGZPath;
var gForceGXPath;

var pathWidth;

//
//
// Create the SVG container and set the origin.
var gForceSvgBase;

var gForceSvg;

var positiveGYScale,
        negativeGYScale;

// The x & y axes.
var positiveGaxis;
var negativeGaxis;

var positiveGaxisElement;


var negativeGaxisElement;

var gForcePathGY;

var gForcePathGZ;

var gForcePathGX;


$(document).ready(function () {
    gForceMeterWidth = document.getElementById("gForceMeter").offsetWidth;
    gForceMeterHeight = document.getElementById("gForceMeter").offsetHeight;

    gForceAxisLength = gForceMeterWidth * 0.35; // Length of the axis in one direction
    gGX = 4;
    gGY = 0;
    gWest = 0;

    maxGForce = 10;
    pathMaximumX = 0.95 * gForceMeterWidth;
    pathMinimumX = 0.05 * gForceMeterWidth;

    pathStartPositiveX = (0.5 + 0.25 * 0.9 / 2) * gForceMeterWidth; //Start x-position if G>0
    pathStartNegativeX = (0.5 - 0.25 * 0.9 / 2) * gForceMeterWidth; //Start x-position if G<0
    pathYGX = (0.35 - 0.05) * gForceMeterHeight;
    pathYGY = (0.6 - 0.05) * gForceMeterHeight;
    pathYGZ = (0.85 - 0.05) * gForceMeterHeight;

    pathWidth = 0.1 * gForceMeterHeight;

//
//
// Create the SVG container and set the origin.
    gForceSvgBase = d3.select("#gForceMeter").append("svg")
            .attr("width", gForceMeterWidth)
            .attr("height", gForceMeterHeight);

    gForceSvg = gForceSvgBase.append("g")
            .attr("transform", "translate(" + 0 + "," + 0 + ")");

    positiveGYScale = d3.scaleLog().range([pathStartPositiveX, pathMaximumX]);
    negativeGYScale = d3.scaleLog().range([pathMinimumX, pathStartNegativeX]);

    positiveGYScale.domain([0.0001, 100]);
    negativeGYScale.domain([-100, -0.0001]);

// The x & y axes.
    positiveGaxis = d3.axisBottom(positiveGYScale).ticks(4);
    negativeGaxis = d3.axisBottom(negativeGYScale).ticks(4);

    positiveGaxisElement = gForceSvg.append("g")
            .attr("class", "positiveLogAxis")
            .attr("transform", "translate(" + 0 + "," + gForceMeterHeight * 0.85 + ")")
            .call(positiveGaxis);


    negativeGaxisElement = gForceSvg.append("g")
            .attr("class", "negativeLogAxis")
            .attr("transform", "translate(" + 0 + "," + gForceMeterHeight * 0.85 + ")")
            .call(negativeGaxis);

    gForcePathGY = gForceSvg.append("path")
            .attr("stroke-width", pathWidth)
//        .attr("stroke-linecap","round")
            .attr("stroke", "rgba(255, 0, 0, 0.5)");

    gForcePathGZ = gForceSvg.append("path")
            .attr("stroke-width", pathWidth)
//        .attr("stroke-linecap","round")
            .attr("stroke", "rgba(255, 0, 0, 0.5)");

    gForcePathGX = gForceSvg.append("path")
            .attr("stroke-width", pathWidth)
//        .attr("stroke-linecap","round")
            .attr("stroke", "rgba(255, 0, 0, 0.5)");

});

new ResizeSensor(document.getElementById("gForceMeter"), function () {
    $(document).ready(function () {
    gForceMeterWidth = document.getElementById("gForceMeter").offsetWidth;
    gForceMeterHeight = document.getElementById("gForceMeter").offsetHeight;
    
    gForceSvgBase.attr("width", gForceMeterWidth)
            .attr("height", gForceMeterHeight);
    
    pathYGX = (0.35 - 0.05) * gForceMeterHeight;
    pathYGY = (0.6 - 0.05) * gForceMeterHeight;
    pathYGZ = (0.85 - 0.05) * gForceMeterHeight;
    
    pathMaximumX = 0.95 * gForceMeterWidth;
    pathMinimumX = 0.05 * gForceMeterWidth;
    
    pathWidth = 0.1 * gForceMeterHeight;
    
    gForcePathGY.attr("stroke-width", pathWidth);

    gForcePathGZ.attr("stroke-width", pathWidth);

    gForcePathGX.attr("stroke-width", pathWidth);

    
    pathStartPositiveX = (0.5 + 0.25 * 0.9 / 2) * gForceMeterWidth; //Start x-position if G>0
    pathStartNegativeX = (0.5 - 0.25 * 0.9 / 2) * gForceMeterWidth; //Start x-position if G<0
    
    pathMaximumX = 0.95 * gForceMeterWidth;
    pathMinimumX = 0.05 * gForceMeterWidth;
    
    positiveGYScale.range([pathStartPositiveX, pathMaximumX]);
    negativeGYScale.range([pathMinimumX, pathStartNegativeX]);

    positiveGaxis = d3.axisBottom(positiveGYScale).ticks(4);
    negativeGaxis = d3.axisBottom(negativeGYScale).ticks(4);

    positiveGaxisElement.attr("transform", "translate(" + 0 + "," + gForceMeterHeight * 0.85 + ")").call(positiveGaxis);
    negativeGaxisElement.attr("transform", "translate(" + 0 + "," + gForceMeterHeight * 0.85 + ")").call(negativeGaxis);
    
    gForcePathGY.attr("d", gForceGYPath);
    gForcePathGZ.attr("d", gForceGZPath);
    gForcePathGX.attr("d", gForceGXPath);
    
    });
});

function setgForceIndicatorLength(Gx, Gy, Gz) {

    if (Gy > 0) {
        var pathEndPositiveX = pathStartPositiveX + (Gy / maxGForce) * (pathMaximumX - pathStartPositiveX);
        gForceGYPath = "M" + pathStartPositiveX + "," + pathYGY + "L" + positiveGYScale(Gy) + "," + pathYGY;
    } else if (Gy < 0) {
        var pathEndNegativeX = pathStartNegativeX - (Gy / maxGForce) * (-pathMaximumX + pathStartNegativeX);
        gForceGYPath = "M" + pathStartNegativeX + "," + pathYGY + "L" + negativeGYScale(Gy) + "," + pathYGY;
    } else {
        gForceGYPath = "M" + pathStartNegativeX + "," + pathYGY + "L" + pathStartNegativeX + "," + pathYGY;
    }


    if (Gz > 0) {
        var pathEndPositiveX = pathStartPositiveX + (Gz / maxGForce) * (pathMaximumX - pathStartPositiveX);
        gForceGZPath = "M" + pathStartPositiveX + "," + pathYGZ + "L" + positiveGYScale(Gz) + "," + pathYGZ;
    } else if (Gz < 0) {
        var pathEndNegativeX = pathStartNegativeX - (Gz / maxGForce) * (-pathMaximumX + pathStartNegativeX);
        gForceGZPath = "M" + pathStartNegativeX + "," + pathYGZ + "L" + negativeGYScale(Gz) + "," + pathYGZ;
    } else {
        gForceGZPath = "M" + pathStartNegativeX + "," + pathYGZ + "L" + pathStartNegativeX + "," + pathYGZ;
    }

    if (Gx > 0) {
        var pathEndPositiveX = pathStartPositiveX + (Gx / maxGForce) * (pathMaximumX - pathStartPositiveX);
        gForceGXPath = "M" + pathStartPositiveX + "," + pathYGX + "L" + positiveGYScale(Gx) + "," + pathYGX;
    } else if (Gx < 0) {
        var pathEndNegativeX = pathStartNegativeX - (Gx / maxGForce) * (-pathMaximumX + pathStartNegativeX);
        gForceGXPath = "M" + pathStartNegativeX + "," + pathYGX + "L" + negativeGYScale(Gx) + "," + pathYGX;
    } else {
        gForceGXPath = "M" + pathStartNegativeX + "," + pathYGX + "L" + pathStartNegativeX + "," + pathYGX;
    }

    gForcePathGY.transition().attr("d", gForceGYPath).duration(500);
    gForcePathGZ.transition().attr("d", gForceGZPath).duration(500);
    gForcePathGX.transition().attr("d", gForceGXPath).duration(500);
}