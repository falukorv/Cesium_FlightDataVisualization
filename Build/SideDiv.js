
(function () {

    "use strict";

    // Div dimensions.
    var sideDivWidth;
    var sideDivHeight;

    // Elements in the div
    var groundTrack = $('#groundTrackDiv');
    var chart = $('#chart');
    var gauge = $('#gaugeBase');
    var gLoad = $('#gLoadMeter');

    // Weights that decides the space each div can hold. The sum of these weights should amount to, or at least be less than 1.
    var groundTrackFactor = 4 / 16;
    var chartFactor = 4 / 16;
    var gaugeFactor = 5 / 16;
    var gLoadFactor = 3 / 16;

    // Distance to the top of the window for each div
    var chartTop;
    var gaugeTop;
    var gLoadTop;

    // Gauge width
    var gaugeWidth;

    // The vertical space that is available for the divs to be placed in
    var verticalSpace;
    
    placeChildDivs();

    new ResizeSensor(document.getElementById("sideContainer"), function () {
        placeChildDivs();
    });

    function placeChildDivs() { 
        $(document).ready(function () {
            // Find side div dimensions
            sideDivWidth = document.getElementById("sideContainer").offsetWidth;
            sideDivHeight = document.getElementById("sideContainer").offsetHeight;

            // Vertical space is defined. The factor 2 is because each element is scaled down by a factor two, in orded to enlarge it without losing quality
            verticalSpace = 2 * 0.92 * sideDivHeight;

            // Set the height of each div
            groundTrack.height(groundTrackFactor * verticalSpace);
            chart.height(chartFactor * verticalSpace);
            gLoad.height(gLoadFactor * verticalSpace);

            // Since the gauge needs to maintain its circular shape, it needs some special treatment
            if (gaugeFactor * verticalSpace > sideDivWidth * 2) {
                gaugeWidth = sideDivWidth * 2;
            } else {
                gaugeWidth = gaugeFactor * verticalSpace;
            }

            // Set the positions with css, groundtrack will be 5% from the top
            groundTrack.css({ top: '5%' });

            // Calculate the next position, and add a small space between the divs
            chartTop = 0.05 * sideDivHeight + groundTrack.height() / 2 + 0.005 * sideDivHeight;
            chart.css({ top: chartTop });

            // Ensure that the gauge is circular, then calculate its position
            gauge.width(gaugeWidth);
            gauge.height(gaugeWidth);
            gaugeTop = chartTop + groundTrack.height() / 2 + chart.height() - gauge.height() / 2 + 0.005 * sideDivHeight;
            gauge.css({ top: gaugeTop, left: sideDivWidth / 2 - gaugeWidth / 4 });

            // Calculate G-Load meter position and set it
            gLoadTop = gaugeTop + 3 * gaugeWidth / 4 - gLoad.height() + 0.005 * sideDivHeight;
            gLoad.css({ top: gLoadTop });
        });
    }

})();