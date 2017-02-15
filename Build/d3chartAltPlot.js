/*global d3, sharedObject, toGeoJSON */

"use strict";

// Various accessors that specify the four dimensions of data to visualize.
//    function x(d) { return distance[d]; }
//    function y(d) { return altitude[d]; }

// Chart dimensions.
var divWidth = document.getElementById("chart").offsetWidth;
var divHeight = document.getElementById("chart").offsetHeight;
//console.log(divWidth);
//console.log(divHeight);
var graphWidth = divWidth - 0.05 * divWidth;
//    graphWidth = d3.select("body").node().getBoundingClientRect().width - margin.right;
//    graphHeight = d3.select("body").node().getBoundingClientRect().height - margin.top - margin.bottom;
var graphHeight = divHeight - 0.05 * divHeight;

// Importing example flight data from a previous flight
var jsonData;
//$.ajax({
//    url: '../SampleData/SPIDER_subsampled_trajectory.kml',
////        url: '../SampleData/MASER13-trajectory.kml',
//    async: false
//}).done(function (xml) {
//    jsonData = toGeoJSON.kml(xml);
//});



// Adding the data into new arrays, since the converted ones are quite messy
var graphAltitude = [];
var graphCoords = [];
var graphTime = [];
var allTextLines;
var distance = [];
var dataSet = [];
//for (var i = 0; i < jsonData.features[0].geometry.coordinates.length; i++) {
//    altitude[i] = jsonData.features[0].geometry.coordinates[i][2];
//    distance[i] = jsonData.features[0].geometry.coordinates[i][1];
//}

//$.ajax({
//    type: "GET",
//    url: '../back_log.csv',
//    dataType: "text",
////        url: '../SampleData/MASER13-trajectory.kml',
//    async: false
//}).done(function (csv) {
//    allTextLines = csv.split(/\r\n|\n/);
//
//    for (var i = 0; i < allTextLines.length; i++) {
//        graphAltitude[i] = parseFloat(allTextLines[i]);
//    }
//    ;
//});



// Various scales.
var xScale = d3.scaleLinear().range([0.019 * graphWidth, graphWidth]),
        yScale = d3.scaleLinear().range([graphHeight * 0.95, 0]);

xScale.domain([0, 0]);
yScale.domain([0, 0]);

// The x & y axes.
var xAxis = d3.axisBottom(xScale);
var yAxis = d3.axisLeft(yScale);



// Create the SVG container and set the origin.
var svg = d3.select("#chart").append("svg")
        .attr("width", graphWidth + 0.05 * graphWidth)
        .attr("height", graphHeight + 0.05 * graphHeight)
        .append("g")
        .attr("transform", "translate(" + 0.025 * graphHeight + "," + 0.025 * graphHeight + ")");

// Add the x-axis.
var xAxisElement = svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(" + 0.02 * graphWidth + "," + 0.95 * graphHeight + ")")
        .call(xAxis);


// Add the y-axis.
var yAxisElement = svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(" + 0.039 * graphWidth + "," + 0 + ")")
        .call(yAxis);

// Add an x-axis label.
var xAxisLabel = svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", graphWidth)
        .attr("y", 0.94 * graphHeight)
        .text("Time");

// Add a y-axis label.
var yAxisLabel = svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 0.115 * graphHeight)
        .attr("x", 0)
        .attr("transform", "rotate(-90)")// translate(0," + 0.04*graphWidth + ")")
        .text("Altitude");

// Add the altitude label; the value is set on transition.
var altitudeLabel = svg.append("text")
        .attr("class", "altitude label")
        .attr("text-anchor", "start")
        .attr("y", 0.05 * graphHeight)
        .attr("x", 0.08 * graphWidth)
//        .attr("transform", "translate(20," + 0 + ")")
        .text('Altitude:');

var altitudeValueLabel = svg.append("text")
        .attr("class", "altitudeValue label")
        .attr("text-anchor", "start")
        .attr("y", 0.05 * graphHeight)
        .attr("x", 0.23 * graphWidth)
//        .attr("transform", "translate(170," + 0 + ")")
        .text('0m');

// Add the apogege label
var graphApogee = 0;

var apogeeLabel = svg.append("text")
        .attr("class", "apogee label")
        .attr("text-anchor", "end")
        .attr("x", 0.75 * graphWidth)
        .attr("y", 0.05 * graphHeight)
        .text("Apogee:");

var apogeeValueLabel = svg.append("text")
        .attr("class", "apogeeValue label")
        .attr("text-anchor", "start")
        .attr("x", 0.77 * graphWidth)
        .attr("y", 0.05 * graphHeight)
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
        .y0(0.95 * graphHeight)
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
    divWidth = document.getElementById("chart").offsetWidth;
    divHeight = document.getElementById("chart").offsetHeight;
    graphWidth = divWidth - 0.05 * divWidth;
//    graphWidth = d3.select("body").node().getBoundingClientRect().width - margin.right;
//    graphHeight = d3.select("body").node().getBoundingClientRect().height - margin.top - margin.bottom;
    graphHeight = divHeight - 0.05 * divHeight;
//    graphWidth = graphHeight * 2;

//        d3.csv('https://flight-data-visualization.herokuapp.com/back_log.csv', function (error, data) {
    d3.csv('../backlog.csv', function (error, data) {
        dataSet = data;
        dataSet.forEach(function (d) {
            d.altitude = parseFloat(d.altitude);
            d.time = parseFloat(d.time);
        });
//        console.log(dataSet)
        svg.attr("width", graphWidth + 0.05 * graphWidth)
                .attr("height", graphHeight + 0.05 * graphHeight);
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

        xScale.range([0.019 * graphWidth, graphWidth]);
        xScale.domain([0, maxTime + 0.1 * maxTime]);
        yScale.range([graphHeight * 0.95, 0]);
        yScale.domain([0, maxAltitude + 0.1 * maxAltitude]);
        xAxisLabel.attr("x", graphWidth)
                .attr("y", 0.94 * graphHeight);
// Add a y-axis label.
        yAxisLabel.attr("y", 0.115 * graphHeight)
                .attr("x", 0);
// Add the altitude label; the value is set on transition.
        altitudeLabel.attr("y", 0.05 * graphHeight)
                .attr("x", 0.08 * graphWidth);
        altitudeValueLabel.attr("y", 0.05 * graphHeight)
                .attr("x", 0.23 * graphWidth);
        apogeeLabel.attr("x", 0.75 * graphWidth)
                .attr("y", 0.05 * graphHeight);
        apogeeValueLabel.attr("x", 0.77 * graphWidth)
                .attr("y", 0.05 * graphHeight);
// The x & y axes.
        xAxis = d3.axisBottom(xScale);
        yAxis = d3.axisLeft(yScale);
        xAxisElement.attr("transform", "translate(" + 0.02 * graphWidth + "," + 0.95 * graphHeight + ")")
                .transition()
                .call(xAxis);
// Add the y-axis.
        yAxisElement.attr("transform", "translate(" + 0.039 * graphWidth + "," + 0 + ")")
                .transition()
                .call(yAxis);
        path.attr("d", line(dataSet));
        area.y0(0.95 * graphHeight);
        appendArea.attr("d", area(dataSet));
    });
//    $.ajax({
//        type: "GET",
//        url: '../back_log.csv',
//        dataType: "text",
////        url: '../SampleData/MASER13-trajectory.kml',
//        async: false
//    }).done(function (csv) {
//        allTextLines = csv.split(/\r\n|\n/);
////        var dataSet = $.csv.toObjects(csv);
////        console.log(dataSet)
//
//        for (var i = 1; i < allTextLines.length - 1; i++) {
//            var data = allTextLines[i].split(',');
//            console.log(data)
//            graphCoords[i] = data;
////            graphTime[i] = parseFloat(data[1]);
//        }
//    });



//    svg.attr("width", graphWidth + margin.left + margin.right)
//            .attr("height", graphHeight + margin.top + margin.bottom);
//
//    var maxTime = d3.max(dataSet, function (d) {
//        return d.time;
//    });
//    var maxAltitude = d3.max(dataSet, function (d) {
//        return d.altitude;
//    });
//    console.log(maxAltitude);
//    xScale.domain([0, d3.max(dataSet, function (d) {
//            return d.time;
//        })]);
//    yScale.domain([0, d3.max(dataSet, function (d) {
//            return d.altitude;
//        })]);
//
//// The x & y axes.
//    xAxis = d3.axisBottom(xScale);
//    yAxis = d3.axisLeft(yScale);
//
//    xAxisElement.attr("transform", "translate(0," + graphHeight + ")")
//            .call(xAxis);
//
//
//// Add the y-axis.
//    yAxisElement.attr("transform", "translate(20," + 0 + ")")
//            .call(yAxis);
//
//    path.attr("d", line(dataSet))
//            .attr("stroke", "#fff")
//            .attr("stroke-width", "2px");
//
////    appendArea.attr("d", area(dataSet))
////        .attr("class", "area");

}