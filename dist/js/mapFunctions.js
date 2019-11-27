//Determines if popup shown or trees counted
var mode = 'notFeatureCount';
var spaceIDSelected = 'CnsQWqCa'

//counts number of trees in bounding box
function countTrees() {
    //Removes counting box overlay on 2nd click of 'Count Trees' button
    if (mode === 'featureCount') {
        areaSelect.remove(); 
        mode = 'notFeatureCount';
    } else { //Applies counting box overlay if mode !== trees
        mode = 'featureCount';
        areaSelect = L.areaSelect({width:200, height:200}); // Need to make a new one each time for some reason
        areaSelect.addTo(map);

        function calcArea(bounds) {
            if (mode == 'featureCount') { // Prevent this from accidentally running in the other mode
                map.spin(true);
                var spaceID = spaceIDSelected; //Obtains count of coordinates in this data set within counting box!
                var accessToken = 'ANOkxlf9QMWB72jUxUuT7AA';
                var url = 'https://xyz.api.here.com/hub/spaces/' + spaceID + '/bbox?access_token=' + accessToken + '&west=' + bounds.getWest() + '&south=' + bounds.getSouth() + '&east=' + bounds.getEast() + '&north=' + bounds.getNorth();
                
                fetch(url).then((response) => response.json()).then(function(data) {
                    var len = data.features.length;
                    map.spin(false);
                    L.popup().setLatLng(map.getCenter()).setContent(formatNumber(len) + ' features found').openOn(map);
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
L.control.scale().addTo(map); //Adds scale bar to map
//Creates Tangram as a Leaflet layer
var layer = Tangram.leafletLayer({
    scene: 'scene.yaml',
    attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>',
    events: {
        //Adds listener to Tangram layer. On trigger, it runs function showPopup()
        //2 possibilities: 'click' and 'hover'. Only one popup displays at a time
        click: onClick
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

// Feature selection
var tooltip = L.tooltip();
 layer.bindTooltip(tooltip);
 map.on('zoom', function(){ layer.closeTooltip() }); // close tooltip when zooming
/**
 * Adds a comma for every 3 numbers in a number string
 * Output returned as a string
 * @param x {!integer} input number
*/
function formatNumber(x) {
    //regular expression used to format solar power output 
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function onClick(selection) {
    if (mode === 'notFeatureCount') {
        // '.feature' refers to an area under mouse, 'selection' refers to the hovered/clicked 
        //Only 1 popup can appear at a given time. Other open popups close when another popup-enabled
        //area is clicked/hovered over
        var feature = selection.feature;
        if (feature) {
            var info = getFeaturePropsHTML(feature);
            tooltip.setContent(info);
            layer.openTooltip(selection.leaflet_event.latlng);
        
            /** 
            //formatNumber(power)
            popup
                .setLatLng(latlng)
                .setContent('<p><strong>Name:</strong> ' + name + '</p><p>Location: ' + location + ' kW</p>')
                .openOn(map);
            */
        
        } else {
            //Does what it says: If a click is made outside of the heatmap area, 
            //the popup is closed
            //map.closePopup();
            layer.closeTooltip();
        }
    }
}
// Popups. closeButton controlled by the little 'x' in the popup.
var popup = L.popup({closeButton: false});
// Get an HTML fragment with feature properties
// Determines what pops up after clicking a feature
function getFeaturePropsHTML (feature) {
    var props = ['name', 'location', 'tel']; // show these properties first if available
    Object.keys(feature.properties) // show rest of proeprties alphabetized
        .sort()
        .forEach(function(p) {
            if (props.indexOf(p) === -1) {
                props.push(p);
            }
        });

    var info = '<div class="featureTable">';
    props.forEach(function(p) {
        if (feature.properties[p]) {
            info += '<div class="featureRow"><div class="featureCell"><b>' + p + '</b></div>' +
                '<div class="featureCell">' + feature.properties[p] + '</div></div>';
        }
    });

    /** 
    // data source and tile info
    info += '<div class="featureRow"><div class="featureCell"><b>tile</b></div>' +
        '<div class="featureCell">' + feature.tile.coords.key + '</div></div>';
    info += '<div class="featureRow"><div class="featureCell"><b>source name</b></div>' +
        '<div class="featureCell">' + feature.source_name + '</div></div>';
    info += '<div class="featureRow"><div class="featureCell"><b>source layer</b></div>' +
        '<div class="featureCell">' + feature.source_layer + '</div></div>';
    

    // scene layers
    info += '<div class="featureRow"><div class="featureCell"><b>scene layers</b></div>' +
            '<div class="featureCell">' + feature.layers.join('<br>') + '</div></div>';
    
    info += '</div>';
    */
    return info;
}

/**
 * Show/hide layers by setting the _layer.enabled value to true/false respectively
 * @param {!string} layerName Matches name set in scene.yaml 
 */
function toggle(layerName) {
    layer.scene.config.layers["_" + layerName].enabled = !layer.scene.config.layers["_" + layerName].enabled;
    //document.getElementById(layerName).className = layer.scene.config.layers["_" + layerName].enabled ? "on" : "off";
    layer.scene.updateConfig();
}
function onlyOneHeatmap(checkbox) {
    var checkboxes = document.getElementsByName('checkHeatmap')
    checkboxes.forEach((item) => {
        if (item !== checkbox) item.checked = false
    })
}