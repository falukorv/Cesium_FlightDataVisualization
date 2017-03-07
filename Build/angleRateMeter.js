/*global d3, sharedObject, toGeoJSON */

"use strict";

var aRateMeterWidth;
var aRateMeterHeight;

var aRateAxisLength; // Length of the axis in one direction
var gAX;
var gAY;
var gWest;

var maxGForce;

var pathMaximumX;
var pathMinimumX;

var pathStartPositiveX; //Start x-position if G>0
var pathStartNegativeX; //Start x-position if G<0
var pathYAY;
var pathYAZ;
var pathYAX;

var pathEndPositiveX;

var aRateAYPath;
var aRateAZPath;
var aRateAXPath;

var pathWidth;

//
//
// Create the SVG container and set the origin.
var aRateSvgBase;

var aRateSvg;

var positiveAScale,
        negativeAScale;

var positiveAAxis;
var negativeAAxis;

var positiveAaxisElement;


var negativeAaxisElement;

var aRatePathAY;

var aRatePathAZ;

var aRatePathAX;


$(document).ready(function () {
    aRateMeterWidth = document.getElementById("aRateValueContainer").offsetWidth;
    aRateMeterHeight = document.getElementById("aRateValueContainer").offsetHeight;

    aRateAxisLength = aRateMeterWidth * 0.35; // Length of the axis in one direction
    gAX = 4;
    gAY = 0;
    gWest = 0;

    maxGForce = 10;
    pathMaximumX = 0.95 * aRateMeterWidth;
    pathMinimumX = 0.05 * aRateMeterWidth;

    pathStartPositiveX = (0.5 + 0.25 * 0.9 / 2) * aRateMeterWidth; //Start x-position if G>0
    pathStartNegativeX = (0.5 - 0.25 * 0.9 / 2) * aRateMeterWidth; //Start x-position if G<0
    pathYAX = (0.35 - 0.05) * aRateMeterHeight;
    pathYAY = (0.6 - 0.05) * aRateMeterHeight;
    pathYAZ = (0.85 - 0.05) * aRateMeterHeight;

    pathWidth = 0.1 * aRateMeterHeight;

//
//
// Create the SVG container and set the origin.
    aRateSvgBase = d3.select("#aRateValueContainer").append("svg")
            .attr("width", aRateMeterWidth)
            .attr("height", aRateMeterHeight);

    aRateSvg = aRateSvgBase.append("g")
            .attr("transform", "translate(" + 0 + "," + 0 + ")");

    positiveAScale = d3.scaleLog().range([pathStartPositiveX, pathMaximumX]);
    negativeAScale = d3.scaleLog().range([pathMinimumX, pathStartNegativeX]);

    positiveAScale.domain([0.0001, 10000]);
    negativeAScale.domain([-10000, -0.0001]);

// The x & y axes.
    positiveAAxis = d3.axisBottom(positiveAScale).ticks(4);
    negativeAAxis = d3.axisBottom(negativeAScale).ticks(4);

    positiveAaxisElement = aRateSvg.append("g")
            .attr("class", "positiveLogAxis")
            .attr("transform", "translate(" + 0 + "," + aRateMeterHeight * 0.85 + ")")
            .call(positiveAAxis);


    negativeAaxisElement = aRateSvg.append("g")
            .attr("class", "negativeLogAxis")
            .attr("transform", "translate(" + 0 + "," + aRateMeterHeight * 0.85 + ")")
            .call(negativeAAxis);

    aRatePathAY = aRateSvg.append("path")
            .attr("stroke-width", pathWidth)
//        .attr("stroke-linecap","round")
            .attr("stroke", "rgba(150, 0, 0, 0.8)");

    aRatePathAZ = aRateSvg.append("path")
            .attr("stroke-width", pathWidth)
//        .attr("stroke-linecap","round")
            .attr("stroke", "rgba(150, 0, 0, 0.8)");

    aRatePathAX = aRateSvg.append("path")
            .attr("stroke-width", pathWidth)
//        .attr("stroke-linecap","round")
            .attr("stroke", "rgba(150, 0, 0, 0.8)");

});

new ResizeSensor(document.getElementById("aRateValueContainer"), function () {
    $(document).ready(function () {
    aRateMeterWidth = document.getElementById("aRateValueContainer").offsetWidth;
    aRateMeterHeight = document.getElementById("aRateValueContainer").offsetHeight;
    
    aRateSvgBase.attr("width", aRateMeterWidth)
            .attr("height", aRateMeterHeight);
    
    pathYAX = (0.35 - 0.05) * aRateMeterHeight;
    pathYAY = (0.6 - 0.05) * aRateMeterHeight;
    pathYAZ = (0.85 - 0.05) * aRateMeterHeight;
    
    pathMaximumX = 0.95 * aRateMeterWidth;
    pathMinimumX = 0.05 * aRateMeterWidth;
    
    pathWidth = 0.1 * aRateMeterHeight;
    
    aRatePathAY.attr("stroke-width", pathWidth);

    aRatePathAZ.attr("stroke-width", pathWidth);

    aRatePathAX.attr("stroke-width", pathWidth);

    
    pathStartPositiveX = (0.5 + 0.25 * 0.9 / 2) * aRateMeterWidth; //Start x-position if G>0
    pathStartNegativeX = (0.5 - 0.25 * 0.9 / 2) * aRateMeterWidth; //Start x-position if G<0
    
    pathMaximumX = 0.95 * aRateMeterWidth;
    pathMinimumX = 0.05 * aRateMeterWidth;
    
    positiveAScale.range([pathStartPositiveX, pathMaximumX]);
    negativeAScale.range([pathMinimumX, pathStartNegativeX]);

    positiveAAxis = d3.axisBottom(positiveAScale).ticks(4);
    negativeAAxis = d3.axisBottom(negativeAScale).ticks(4);

    positiveAaxisElement.attr("transform", "translate(" + 0 + "," + aRateMeterHeight * 0.85 + ")").call(positiveAAxis);
    negativeAaxisElement.attr("transform", "translate(" + 0 + "," + aRateMeterHeight * 0.85 + ")").call(negativeAAxis);
    
    aRatePathAY.attr("d", aRateAYPath);
    aRatePathAZ.attr("d", aRateAZPath);
    aRatePathAX.attr("d", aRateAXPath);
    
    });
});

function setangleRateIndicatorLength(aRateX, aRateY, aRateZ) {
    
    if (aRateX > 0) {
        var pathEndPositiveX = pathStartPositiveX + (aRateX / maxGForce) * (pathMaximumX - pathStartPositiveX);
        aRateAXPath = "M" + pathStartPositiveX + "," + pathYAX + "L" + positiveAYScale(aRateX) + "," + pathYAX;
    } else if (aRateX < 0) {
        var pathEndNegativeX = pathStartNegativeX - (aRateX / maxGForce) * (-pathMaximumX + pathStartNegativeX);
        aRateAXPath = "M" + pathStartNegativeX + "," + pathYAX + "L" + negativeAYScale(aRateX) + "," + pathYAX;
    } else {
        aRateAXPath = "M" + pathStartNegativeX + "," + pathYAX + "L" + pathStartNegativeX + "," + pathYAX;
    }

    if (aRateY > 0) {
        var pathEndPositiveX = pathStartPositiveX + (aRateY / maxGForce) * (pathMaximumX - pathStartPositiveX);
        aRateAYPath = "M" + pathStartPositiveX + "," + pathYAY + "L" + positiveAYScale(aRateY) + "," + pathYAY;
    } else if (aRateY < 0) {
        var pathEndNegativeX = pathStartNegativeX - (aRateY / maxGForce) * (-pathMaximumX + pathStartNegativeX);
        aRateAYPath = "M" + pathStartNegativeX + "," + pathYAY + "L" + negativeAYScale(aRateY) + "," + pathYAY;
    } else {
        aRateAYPath = "M" + pathStartNegativeX + "," + pathYAY + "L" + pathStartNegativeX + "," + pathYAY;
    }


    if (aRateZ > 0) {
        var pathEndPositiveX = pathStartPositiveX + (aRateZ / maxGForce) * (pathMaximumX - pathStartPositiveX);
        aRateAZPath = "M" + pathStartPositiveX + "," + pathYAZ + "L" + positiveAYScale(aRateZ) + "," + pathYAZ;
    } else if (aRateZ < 0) {
        var pathEndNegativeX = pathStartNegativeX - (aRateZ / maxGForce) * (-pathMaximumX + pathStartNegativeX);
        aRateAZPath = "M" + pathStartNegativeX + "," + pathYAZ + "L" + negativeAYScale(aRateZ) + "," + pathYAZ;
    } else {
        aRateAZPath = "M" + pathStartNegativeX + "," + pathYAZ + "L" + pathStartNegativeX + "," + pathYAZ;
    }

    aRatePathAY.transition().attr("d", aRateAYPath).duration(500);
    aRatePathAZ.transition().attr("d", aRateAZPath).duration(500);
    aRatePathAX.transition().attr("d", aRateAXPath).duration(500);
}