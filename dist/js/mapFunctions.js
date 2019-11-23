//Determines if popup shown or trees counted
var mode = 'solar';

//counts number of trees in bounding box
function countTrees() {
    if (mode === 'trees') {
        areaSelect.remove(); d
        mode = 'solar';
    } else {
        mode = 'trees';
        areaSelect = L.areaSelect({width:200, height:300}); // Need to make a new one each time for some reason
        areaSelect.addTo(map);

        function calcArea(bounds) {
            if (mode == 'trees') { // Prevent this from accidentally running in the other mode
                map.spin(true);
                var spaceID = 'PZC7gnLE';
                var accessToken = 'ANOkxlf9QMWB72jUxUuT7AA';
                var url = 'https://xyz.api.here.com/hub/spaces/' + spaceID + '/bbox?access_token=' + accessToken + '&west=' + bounds.getWest() + '&south=' + bounds.getSouth() + '&east=' + bounds.getEast() + '&north=' + bounds.getNorth();
                
                fetch(url).then((response) => response.json()).then(function(data) {
                    var len = data.features.length;
                    map.spin(false);
                    L.popup().setLatLng(map.getCenter()).setContent(formatNumber(len) + ' trees selected').openOn(map);
                });
            }
        };
        //To call on one of the properties of L.class in leaflet-areaselect.js, follow this syntax:
        //L.areaSelect({width: x, height: x}).propertyToCall()
        calcArea(areaSelect.getBounds()); // Run it once at load time
        areaSelect.on("change", function() {
            calcArea(this.getBounds());  // Then run it again anytime the box changes
        });
    }
}

var map = L.map('map', {boxZoom: false});
var layer = Tangram.leafletLayer({
    scene: 'scene.yaml',
    attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>',
    events: {
        //Adds listener to Tangram layer. On trigger, it runs function showPopup()
        //2 possibilities: 'click' and 'hover'. Only one popup displays at a time
        click: function(selection) {
            if (mode === 'solar') {
                if (selection.feature) {
                    showPopup(selection.leaflet_event.latlng, selection.feature.properties.Buurtcombinatie, selection.feature.properties.totalPower);
                } else {
                    map.closePopup();
                }
            }
        }
    }
});
layer.addTo(map);
/** 
 * Coordinates in [] are center point. 
 * Number after ',' sets zoom level. Bigger number = Zoom in more
 * Original in tut: [52.332548, 4.893920], 12
 * For Malaysia: [4.354682, 109.308983], 6
 */
map.setView([4.354682, 109.308983], 6);

/**
 * Adds a comma for every 3 numbers in a number string
 * Output returned as a string
 * @param x {!integer} input number
*/
function formatNumber(x) {
    //regular expression used to format solar power output 
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
// popups
var popup = L.popup({closeButton: false});
function showPopup(latlng, name, power) {
    popup
        .setLatLng(latlng)
        .setContent('<p><strong>Neighborhood:</strong> ' + name + '</p><p>Total Power: ' + formatNumber(power) + ' kW</p>')
        .openOn(map);
}

//turns layers on and off
function toggle(layerName) {
    layer.scene.config.layers["_" + layerName].enabled = !layer.scene.config.layers["_" + layerName].enabled;
    document.getElementById(layerName).className = layer.scene.config.layers["_" + layerName].enabled ? "on" : "off";
    layer.scene.updateConfig();
}