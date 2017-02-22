/*global d3, sharedObject, toGeoJSON */

"use strict";

var gForceMeterWidth;
var gForceMeterHeight;

var gForceAxisLength; // Length of the axis in one direction
var gUp;
var gEast;
var gWest;

var maxGForce;

var pathMaximumX;
var pathMinimumX;

var pathStartPositiveX; //Start x-position if G>0
var pathStartNegativeX; //Start x-position if G<0
var pathYEast;
var pathYNorth;
var pathYUp;

var pathEndPositiveX;

var gForceEastPath;
var gForceNorthPath;
var gForceUpPath;

var pathWidth;

//
//
// Create the SVG container and set the origin.
var gForceSvgBase;

var gForceSvg;

var positiveEastScale,
        negativeEastScale;

// The x & y axes.
var positiveEastAxis;
var negativeEastAxis;

var positiveEastAxisElement;


var negativeEastAxisElement;

var gForcePathEast;

var gForcePathNorth;

var gForcePathUp;


$(document).ready(function () {
    gForceMeterWidth = document.getElementById("gForceMeter").offsetWidth;
    gForceMeterHeight = document.getElementById("gForceMeter").offsetHeight;

    gForceAxisLength = gForceMeterWidth * 0.35; // Length of the axis in one direction
    gUp = 4;
    gEast = 0;
    gWest = 0;

    maxGForce = 10;
    pathMaximumX = 0.95 * gForceMeterWidth;
    pathMinimumX = 0.05 * gForceMeterWidth;

    pathStartPositiveX = (0.5 + 0.25 * 0.9 / 2) * gForceMeterWidth; //Start x-position if G>0
    pathStartNegativeX = (0.5 - 0.25 * 0.9 / 2) * gForceMeterWidth; //Start x-position if G<0
    pathYEast = (0.4 - 0.05) * gForceMeterHeight;
    pathYNorth = (0.65 - 0.05) * gForceMeterHeight;
    pathYUp = (0.9 - 0.05) * gForceMeterHeight;

    pathEndPositiveX = pathStartPositiveX + (gUp / maxGForce) * (pathMaximumX - pathStartPositiveX);
    gForceEastPath = "M" + pathStartPositiveX + "," + pathYEast + "L" + pathEndPositiveX + "," + pathYEast;
    gForceNorthPath;
    gForceUpPath;

    pathWidth = 0.1 * gForceMeterHeight;

//
//
// Create the SVG container and set the origin.
    gForceSvgBase = d3.select("#gForceMeter").append("svg")
            .attr("width", gForceMeterWidth)
            .attr("height", gForceMeterHeight);

    gForceSvg = gForceSvgBase.append("g")
            .attr("transform", "translate(" + 0 + "," + 0 + ")");

    positiveEastScale = d3.scaleLog().range([pathStartPositiveX, pathMaximumX]);
    negativeEastScale = d3.scaleLog().range([pathMinimumX, pathStartNegativeX]);

    positiveEastScale.domain([0.0001, 100]);
    negativeEastScale.domain([-100, -0.0001]);

// The x & y axes.
    positiveEastAxis = d3.axisBottom(positiveEastScale).ticks(4);
    negativeEastAxis = d3.axisBottom(negativeEastScale).ticks(4);

    positiveEastAxisElement = gForceSvg.append("g")
            .attr("class", "gForcePositiveAxis")
            .attr("transform", "translate(" + 0 + "," + gForceMeterHeight * 0.90 + ")")
            .call(positiveEastAxis);


    negativeEastAxisElement = gForceSvg.append("g")
            .attr("class", "gForceNegativeAxis")
            .attr("transform", "translate(" + 0 + "," + gForceMeterHeight * 0.90 + ")")
            .call(negativeEastAxis);

    gForcePathEast = gForceSvg.append("path")
            .attr("stroke-width", pathWidth)
//        .attr("stroke-linecap","round")
            .attr("stroke", "rgba(150, 0, 0, 0.8)");

    gForcePathNorth = gForceSvg.append("path")
            .attr("stroke-width", pathWidth)
//        .attr("stroke-linecap","round")
            .attr("stroke", "rgba(150, 0, 0, 0.8)");

    gForcePathUp = gForceSvg.append("path")
            .attr("stroke-width", pathWidth)
//        .attr("stroke-linecap","round")
            .attr("stroke", "rgba(150, 0, 0, 0.8)");

});

new ResizeSensor(document.getElementById("gForceMeter"), function () {
    $(document).ready(function () {
    gForceMeterWidth = document.getElementById("gForceMeter").offsetWidth;
    gForceMeterHeight = document.getElementById("gForceMeter").offsetHeight;
    
    pathStartPositiveX = (0.5 + 0.25 * 0.9 / 2) * gForceMeterWidth; //Start x-position if G>0
    pathStartNegativeX = (0.5 - 0.25 * 0.9 / 2) * gForceMeterWidth; //Start x-position if G<0
    
    pathMaximumX = 0.95 * gForceMeterWidth;
    pathMinimumX = 0.05 * gForceMeterWidth;
    
    positiveEastScale.range([pathStartPositiveX, pathMaximumX]);
    negativeEastScale.range([pathMinimumX, pathStartNegativeX]);
    console.log("resize")

    positiveEastAxis = d3.axisBottom(positiveEastScale).ticks(4);
    negativeEastAxis = d3.axisBottom(negativeEastScale).ticks(4);

    positiveEastAxisElement.attr("transform", "translate(" + 0 + "," + gForceMeterHeight * 0.90 + ")").call(positiveEastAxis);
    negativeEastAxisElement.attr("transform", "translate(" + 0 + "," + gForceMeterHeight * 0.90 + ")").call(negativeEastAxis);
    });
});

function setgForceIndicatorLength(Gx, Gy, Gz) {

    if (Gx > 0) {
        var pathEndPositiveX = pathStartPositiveX + (Gx / maxGForce) * (pathMaximumX - pathStartPositiveX);
        gForceEastPath = "M" + pathStartPositiveX + "," + pathYEast + "L" + positiveEastScale(Gx) + "," + pathYEast;
    } else if (Gx < 0) {
        var pathEndNegativeX = pathStartNegativeX - (Gx / maxGForce) * (-pathMaximumX + pathStartNegativeX);
        gForceEastPath = "M" + pathStartNegativeX + "," + pathYEast + "L" + negativeEastScale(Gx) + "," + pathYEast;
    } else {
        gForceEastPath = "M" + pathStartNegativeX + "," + pathYEast + "L" + pathStartNegativeX + "," + pathYEast;
    }


    if (Gy > 0) {
        var pathEndPositiveX = pathStartPositiveX + (Gx / maxGForce) * (pathMaximumX - pathStartPositiveX);
        gForceNorthPath = "M" + pathStartPositiveX + "," + pathYNorth + "L" + positiveEastScale(Gy) + "," + pathYNorth;
    } else if (Gy < 0) {
        var pathEndNegativeX = pathStartNegativeX - (Gx / maxGForce) * (-pathMaximumX + pathStartNegativeX);
        gForceNorthPath = "M" + pathStartNegativeX + "," + pathYNorth + "L" + negativeEastScale(Gy) + "," + pathYNorth;
    } else {
        gForceNorthPath = "M" + pathStartNegativeX + "," + pathYNorth + "L" + pathStartNegativeX + "," + pathYNorth;
    }

    if (Gz > 0) {
        var pathEndPositiveX = pathStartPositiveX + (Gx / maxGForce) * (pathMaximumX - pathStartPositiveX);
        gForceUpPath = "M" + pathStartPositiveX + "," + pathYUp + "L" + positiveEastScale(Gz) + "," + pathYUp;
    } else if (Gz < 0) {
        var pathEndNegativeX = pathStartNegativeX - (Gx / maxGForce) * (-pathMaximumX + pathStartNegativeX);
        gForceUpPath = "M" + pathStartNegativeX + "," + pathYUp + "L" + negativeEastScale(Gz) + "," + pathYUp;
    } else {
        gForceUpPath = "M" + pathStartNegativeX + "," + pathYUp + "L" + pathStartNegativeX + "," + pathYUp;
    }

    gForcePathEast.transition().attr("d", gForceEastPath).duration(500);
    gForcePathNorth.transition().attr("d", gForceNorthPath).duration(500);
    gForcePathUp.transition().attr("d", gForceUpPath).duration(500);
}