/*global d3, sharedObject, toGeoJSON */

"use strict";

// Chart dimensions.
var graphWidth = document.getElementById("chart").offsetWidth;
var graphHeight = document.getElementById("chart").offsetHeight;





// Adding the data into new arrays, since the converted ones are quite messy
var graphAltitude = [];
var graphCoords = [];
var graphTime = [];
var allTextLines;
var distance = [];
var dataSet = [];


// Various scales.
var xScale = d3.scaleLinear().range([0.1 * graphWidth, 0.95*graphWidth]),
         yScale = d3.scaleLinear().range([graphHeight * 0.90, 0.05*graphHeight]);

xScale.domain([0, 0]);
yScale.domain([0, 0]);

// The x & y axes.
var xAxis = d3.axisBottom(xScale);
var yAxis = d3.axisLeft(yScale);



// Create the SVG container and set the origin.
var svgBase = d3.select("#chart").append("svg")
        .attr("width", graphWidth)
        .attr("height", graphHeight);

var svg = svgBase
        .append("g")
        .attr("transform", "translate("+ 0 +"," + 0 + ")");

// Add the x-axis.
var xAxisElement = svg.append("g")
        .attr("class", "xaxis")
        .attr("transform", "translate(" + 0 * graphWidth + "," + 0.90 * graphHeight + ")")
        .call(xAxis);


// Add the y-axis.
var yAxisElement = svg.append("g")
        .attr("class", "yaxis")
        .attr("transform", "translate(" + 0.1 * graphWidth + "," + 0 + ")")
        .call(yAxis);

// Add an x-axis label.
var xAxisLabel = svg.append("text")
        .attr("class", "label")
        .attr("text-anchor", "end")
        .attr("x", 0.94 * graphWidth)
        .attr("font-size", "2vh")
        .attr("y", 0.88*graphHeight)
        .text("Time");

// Add a y-axis label.
var yAxisLabel = svg.append("text")
        .attr("class", "label")
        .attr("y", -0.11 * graphWidth)
        .attr("font-size", "1.4vw")
        .attr("x", 0.05 * graphHeight)
        .attr("transform", "rotate(90)")// translate(0," + 0.04*graphWidth + ")")
        .text("Altitude");

// Add the altitude label; the value is set on transition.
var altitudeLabel = svg.append("text")
        .attr("class", "altitude label")
        .attr("text-anchor", "start")
        .attr("y", 0.07 * graphHeight)
        .attr("x", 0.15 * graphWidth)
        .text('Altitude:');

var altitudeValueLabel = svg.append("text")
        .attr("class", "altitudeValue label")
        .attr("text-anchor", "start")
        .attr("y", 0.07 * graphHeight)
        .attr("x", 0.38 * graphWidth)
        .text('0m');

// Add the apogege label
var graphApogee = 0;

var apogeeLabel = svg.append("text")
        .attr("class", "apogee label")
        .attr("text-anchor", "end")
        .attr("x", 0.75 * graphWidth)
        .attr("y", 0.07 * graphHeight)
        .text("Apogee:");

var apogeeValueLabel = svg.append("text")
        .attr("class", "apogeeValue label")
        .attr("text-anchor", "start")
        .attr("x", 0.77 * graphWidth)
        .attr("y", 0.07 * graphHeight)
        .text(0 + "m");

var line = d3.line()
        .x(function (d) {
            return xScale(d.time);
        })
        .y(function (d) {
            return yScale(d.altitude);
        });

var area = d3.area()
        .x(function (d) {
            return xScale(d.time);
        })
        .y0(0.90 * graphHeight)
        .y1(function (d) {
            return yScale(d.altitude);
        });

var path = svg.append("path")
        .attr("d", line(dataSet))
        .attr("stroke", "#fff")
        .attr("stroke-width", "2px")
        .attr("fill", "none");

var appendArea = svg.append("path")
        .attr("d", area(dataSet))
        .attr("class", "area");

function updateGraph() {
    // Chart dimensions.

//        d3.csv('https://flight-data-visualization.herokuapp.com/back_log.csv', function (error, data) {
    d3.csv('../backlog.csv', function (error, data) {
        dataSet = data;
        dataSet.forEach(function (d) {
            d.altitude = parseFloat(d.altitude);
            d.time = parseFloat(d.time);
        });
//        console.log(dataSet)
        
        var maxTime = d3.max(dataSet, function (d) {
            return d.time;
        });
        var maxAltitude = d3.max(dataSet, function (d) {
            return d.altitude;
        });

        if (maxAltitude > graphApogee) {
            graphApogee = maxAltitude;
            document.getElementsByClassName("apogeeValue")[0].innerHTML = Math.round(graphApogee) + "m";
        }

        xScale.domain([0, maxTime + 0.1 * maxTime]);
        
        yScale.domain([0, maxAltitude + 0.1 * maxAltitude]);


        // The x & y axes.
        xAxis = d3.axisBottom(xScale);
        yAxis = d3.axisLeft(yScale);
        xAxisElement
                .transition()
                .call(xAxis);
        // Add the y-axis.
        yAxisElement
                .transition()
                .call(yAxis);
        
        path.attr("d", line(dataSet));
        appendArea.attr("d", area(dataSet));
    });

}

new ResizeSensor(document.getElementById("chart"), function () {

    graphWidth = document.getElementById("chart").offsetWidth;
    graphHeight = document.getElementById("chart").offsetHeight;

    svgBase
        .attr("width", graphWidth)
        .attr("height", graphHeight)


    // Various scales.
    xScale = d3.scaleLinear().range([0.1 * graphWidth, 0.95 * graphWidth]);
    yScale = d3.scaleLinear().range([graphHeight * 0.90, 0.05 * graphHeight]);

    // The x & y axes.
    xAxis = d3.axisBottom(xScale);
    yAxis = d3.axisLeft(yScale);

    // Add the x-axis.
    xAxisElement
            .attr("transform", "translate(" + 0 * graphWidth + "," + 0.90 * graphHeight + ")")
            .call(xAxis);


    // Add the y-axis.
    yAxisElement
            .attr("transform", "translate(" + 0.1 * graphWidth + "," + 0 + ")")
            .call(yAxis);

    // Add an x-axis label.
    xAxisLabel
            .attr("x", 0.94 * graphWidth)
            .attr("y", 0.88 * graphHeight);

    // Add a y-axis label.
    yAxisLabel
            .attr("y", -0.11 * graphWidth)
            .attr("x", 0.05 * graphHeight);

    // Add the altitude label; the value is set on transition.
    altitudeLabel
            .attr("y", 0.07 * graphHeight)
            .attr("x", 0.15 * graphWidth)
            .text('Altitude:');

    altitudeValueLabel
            .attr("y", 0.07 * graphHeight)
            .attr("x", 0.38 * graphWidth)

    apogeeLabel.attr("x", 0.75 * graphWidth)
            .attr("y", 0.07 * graphHeight);

    apogeeValueLabel
            .attr("x", 0.77 * graphWidth)
            .attr("y", 0.07 * graphHeight);

    path.attr("d", line(dataSet));
    area.y0(0.90 * graphHeight);
    appendArea.attr("d", area(dataSet));
})