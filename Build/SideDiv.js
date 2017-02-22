
(function () {

    "use strict";

// Chart dimensions.
    var sideDivWidth;
    var sideDivHeight;

    var groundTrack = $('#groundTrackDiv');
    var chart = $('#chart');
    var gauge = $('#gaugeBase');
    var gForce = $('#gForceMeter');

    // Weights that decides the space each div can hold. The sum of these weights should amount to, or at least be less than 1.
    var groundTrackFactor = 3 / 12;
    var chartFactor = 3 / 12;
    var gaugeFactor = 4 / 12;
    var gForceFactor = 2 / 12;

    // Distance to the top of the window for each div
    var chartTop;
    var gaugeTop;
    var gForceTop;
    
    var gaugeWidth;
    
    var verticalSpace;
    
    placeChildDivs();

    new ResizeSensor(document.getElementById("sideContainer"), function () {
        placeChildDivs();
    });

    function placeChildDivs() { 
        $(document).ready(function(){
        sideDivWidth = document.getElementById("sideContainer").offsetWidth;
        sideDivHeight = document.getElementById("sideContainer").offsetHeight;

        verticalSpace = 2 * 0.90 * sideDivHeight;
        
        groundTrack.height(groundTrackFactor * verticalSpace);
        chart.height(chartFactor * verticalSpace);
        gForce.height(gForceFactor * verticalSpace);  
        
        if (gaugeFactor * verticalSpace  > sideDivWidth*2) {
            gaugeWidth = sideDivWidth*2;
        } else {
            gaugeWidth = gaugeFactor * verticalSpace;
        }

        groundTrack.css({top: '5%'});

        chartTop = 0.05 * sideDivHeight + groundTrack.height()/2 + 0.005*sideDivHeight;
        chart.css({top: chartTop});
        
        gauge.width(gaugeWidth);
        gauge.height(gaugeWidth);
        gaugeTop = chartTop + groundTrack.height()/2 + chart.height() - gauge.height()/2 + 0.005*sideDivHeight;
        gauge.css({top: gaugeTop, left: sideDivWidth / 2 - gaugeWidth / 4});

        gForceTop = gaugeTop + 3*gaugeWidth / 4 - gForce.height() + 0.005 * sideDivHeight;
        gForce.css({top: gForceTop});
        });
    }

})();