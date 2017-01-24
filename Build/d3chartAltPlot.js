/*global d3, sharedObject, toGeoJSON */
(function () {
    "use strict";

    // Various accessors that specify the four dimensions of data to visualize.
//    function x(d) { return distance[d]; }
//    function y(d) { return altitude[d]; }

    // Chart dimensions.
    var margin = {top: 19.5, right: 19.5, bottom: 19.5, left: 39.5},
        width = 960 - margin.right,
        height = 500 - margin.top - margin.bottom;
        
        
    // Importing example flight data from a previous flight
    var jsonData;
    $.ajax({
        url: '../SampleData/SPIDER_subsampled_trajectory.kml',
//        url: '../SampleData/MASER13-trajectory.kml',
        async: false
    }).done(function(xml) {
    jsonData = toGeoJSON.kml(xml);
    });
    
    // Adding the data into new arrays, since the converted ones are quite messy
    var altitude = [];
    var distance = [];
    for (var i = 0; i < jsonData.features[0].geometry.coordinates.length; i++) { 
        altitude[i] = jsonData.features[0].geometry.coordinates[i][2];
        distance[i] = jsonData.features[0].geometry.coordinates[i][1];
    }
        console.log(jsonData)
    // Various scales.
    var xScale = d3.scaleLinear().range([0,width]),
        yScale = d3.scaleLinear().range([height,0]);
        
    xScale.domain([0,altitude.length]);
    yScale.domain([0,d3.max(altitude)+d3.max(altitude)*0.1]);
   
    // The x & y axes.
    var xAxis = d3.axisBottom(xScale);
    var yAxis = d3.axisLeft(yScale);

    // Create the SVG container and set the origin.
    var svg = d3.select("#chart").append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Add the x-axis.
    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);


    // Add the y-axis.
    svg.append("g")
        .attr("class", "y axis")
        .attr("transform", "translate(20," + 0 + ")")
        .call(yAxis);

    // Add an x-axis label.
    svg.append("text")
        .attr("class", "x label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", height - 6)
        .text("Time");

    // Add a y-axis label.
    svg.append("text")
        .attr("class", "y label")
        .attr("text-anchor", "end")
        .attr("y", 6)
        .attr("dy", ".75em")
        .attr("transform", "rotate(-90) translate(0," + 20 + ")")
        .text("Altitude");

    // Add the altitude label; the value is set on transition.
    var label = svg.append("text")
        .attr("class", "altitude label")
        .attr("text-anchor", "start")
        .attr("y", 28)
        .attr("x", 30)
        .attr("transform", "translate(20," + 0 + ")")
        .text('Altitude: High as a kite');
    
    // Add the apogege label
    var apogee = Math.floor(d3.max(altitude));
    var apogee = svg.append("text")
        .attr("class", "apogee label")
        .attr("text-anchor", "end")
        .attr("x", width)
        .attr("y", 28)
        .text("Apogee: " + apogee + "m");
    
    var line = d3.line()
            .x(function(d,i){return xScale(i)})
            .y(function(d){return yScale(d)})
    
//    console.log(altitude)
    svg.append("path")
        .attr("d", line(altitude))
        .attr("stroke", "#fff")
        .attr("stroke-width", "2px")

}());