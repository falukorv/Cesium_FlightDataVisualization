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
    pathYUp = (0.35 - 0.05) * gForceMeterHeight;
    pathYEast = (0.6 - 0.05) * gForceMeterHeight;
    pathYNorth = (0.85 - 0.05) * gForceMeterHeight;

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
            .attr("transform", "translate(" + 0 + "," + gForceMeterHeight * 0.85 + ")")
            .call(positiveEastAxis);


    negativeEastAxisElement = gForceSvg.append("g")
            .attr("class", "gForceNegativeAxis")
            .attr("transform", "translate(" + 0 + "," + gForceMeterHeight * 0.85 + ")")
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
    
    gForceSvgBase.attr("width", gForceMeterWidth)
            .attr("height", gForceMeterHeight);
    
    pathYUp = (0.35 - 0.05) * gForceMeterHeight;
    pathYEast = (0.6 - 0.05) * gForceMeterHeight;
    pathYNorth = (0.85 - 0.05) * gForceMeterHeight;
    
    pathMaximumX = 0.95 * gForceMeterWidth;
    pathMinimumX = 0.05 * gForceMeterWidth;
    
    pathWidth = 0.1 * gForceMeterHeight;
    
    gForcePathEast.attr("stroke-width", pathWidth);

    gForcePathNorth.attr("stroke-width", pathWidth);

    gForcePathUp.attr("stroke-width", pathWidth);

    
    pathStartPositiveX = (0.5 + 0.25 * 0.9 / 2) * gForceMeterWidth; //Start x-position if G>0
    pathStartNegativeX = (0.5 - 0.25 * 0.9 / 2) * gForceMeterWidth; //Start x-position if G<0
    
    pathMaximumX = 0.95 * gForceMeterWidth;
    pathMinimumX = 0.05 * gForceMeterWidth;
    
    positiveEastScale.range([pathStartPositiveX, pathMaximumX]);
    negativeEastScale.range([pathMinimumX, pathStartNegativeX]);

    positiveEastAxis = d3.axisBottom(positiveEastScale).ticks(4);
    negativeEastAxis = d3.axisBottom(negativeEastScale).ticks(4);

    positiveEastAxisElement.attr("transform", "translate(" + 0 + "," + gForceMeterHeight * 0.85 + ")").call(positiveEastAxis);
    negativeEastAxisElement.attr("transform", "translate(" + 0 + "," + gForceMeterHeight * 0.85 + ")").call(negativeEastAxis);
    
    gForcePathEast.attr("d", gForceEastPath);
    gForcePathNorth.attr("d", gForceNorthPath);
    gForcePathUp.attr("d", gForceUpPath);
    
    });
});

function setgForceIndicatorLength(Gup, Geast, Gnorth) {

    if (Geast > 0) {
        var pathEndPositiveX = pathStartPositiveX + (Geast / maxGForce) * (pathMaximumX - pathStartPositiveX);
        gForceEastPath = "M" + pathStartPositiveX + "," + pathYEast + "L" + positiveEastScale(Geast) + "," + pathYEast;
    } else if (Geast < 0) {
        var pathEndNegativeX = pathStartNegativeX - (Geast / maxGForce) * (-pathMaximumX + pathStartNegativeX);
        gForceEastPath = "M" + pathStartNegativeX + "," + pathYEast + "L" + negativeEastScale(Geast) + "," + pathYEast;
    } else {
        gForceEastPath = "M" + pathStartNegativeX + "," + pathYEast + "L" + pathStartNegativeX + "," + pathYEast;
    }


    if (Gnorth > 0) {
        var pathEndPositiveX = pathStartPositiveX + (Gnorth / maxGForce) * (pathMaximumX - pathStartPositiveX);
        gForceNorthPath = "M" + pathStartPositiveX + "," + pathYNorth + "L" + positiveEastScale(Gnorth) + "," + pathYNorth;
    } else if (Gnorth < 0) {
        var pathEndNegativeX = pathStartNegativeX - (Gnorth / maxGForce) * (-pathMaximumX + pathStartNegativeX);
        gForceNorthPath = "M" + pathStartNegativeX + "," + pathYNorth + "L" + negativeEastScale(Gnorth) + "," + pathYNorth;
    } else {
        gForceNorthPath = "M" + pathStartNegativeX + "," + pathYNorth + "L" + pathStartNegativeX + "," + pathYNorth;
    }

    if (Gup > 0) {
        var pathEndPositiveX = pathStartPositiveX + (Gup / maxGForce) * (pathMaximumX - pathStartPositiveX);
        gForceUpPath = "M" + pathStartPositiveX + "," + pathYUp + "L" + positiveEastScale(Gup) + "," + pathYUp;
    } else if (Gup < 0) {
        var pathEndNegativeX = pathStartNegativeX - (Gup / maxGForce) * (-pathMaximumX + pathStartNegativeX);
        gForceUpPath = "M" + pathStartNegativeX + "," + pathYUp + "L" + negativeEastScale(Gup) + "," + pathYUp;
    } else {
        gForceUpPath = "M" + pathStartNegativeX + "," + pathYUp + "L" + pathStartNegativeX + "," + pathYUp;
    }

    gForcePathEast.transition().attr("d", gForceEastPath).duration(500);
    gForcePathNorth.transition().attr("d", gForceNorthPath).duration(500);
    gForcePathUp.transition().attr("d", gForceUpPath).duration(500);
}