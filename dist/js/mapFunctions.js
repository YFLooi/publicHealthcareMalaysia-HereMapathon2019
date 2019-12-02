//Determines if popups to be shown or counter enabled
var mode = 'notFeatureCount';
//Determines which feature counter should count
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
        hover: onHover,
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

//Tooltips display info where a click is made. 
//While a popup looks like a bubble with a tail, a tooltip is square with a short tail
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
function onHover (selection) {
    //selection = what's underneath the cursor. 'feature' refers to roads, markers, landmarks
    var feature = selection.feature;
    //This determines what happens onHover
    if (feature) {
        if (selection.changed) {
            var info;
            
            //'Object.keys(feature.properties).length' must subtract 1. HERE spaces always adds
            //its own which we don't need. Yeesh!
            var name = feature.properties.name || feature.properties.kind ||
                ((Object.keys(feature.properties).length-1)+' available properties');
            name = '<b>'+name+'</b>';
            name += '<br>(click for details)';
            name = '<span class="labelInner">' + name + '</span>';
            info = name;

            if (info) {
                tooltip.setContent(info);
            }
        }
        layer.openTooltip(selection.leaflet_event.latlng);
    }
    else { //This closes the tooltip offHover
        layer.closeTooltip();
    }
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
        } else {
            //Does what it says: If a click is made outside of the heatmap area, 
            //the tooltip is closed
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
    Object.keys(feature.properties)
        .sort()  // Sorts arriving properties alphabetized
        //Only adds feature.properties that are not in props, to the end of props array
        //'@ns:com:here:xyz' is an annoying property that HERE xyz adds. Removed by the conditional added
        .forEach(function(p) { 
            if (props.indexOf(p) === -1 && p!== '@ns:com:here:xyz') {
                props.push(p);
            }
        });

    var info = '<div class="featureTable">';
    props.forEach(function(p) {
        //Exclusions '!==' in 1st if statement to allow custom mods
        if (feature.properties[p] && p!=='population' && p!=='Percent_Dengue_Mortality_Rate') {
            info += '<div class="featureRow"><div class="featureCell"><b>' + p + '</b></div>' +
                '<div class="featureCell">' + feature.properties[p] + '</div></div>';
        } else if (feature.properties[p] && p==='population') { //Ensures population number has a comma for every 3 numbers
            info += '<div class="featureRow"><div class="featureCell"><b>' + p + '</b></div>' +
                '<div class="featureCell">' + formatNumber(feature.properties[p]) + '</div></div>';
        } else if (feature.properties[p] && p=== 'Percent_Dengue_Mortality_Rate') { //Adds % symbol at end of mortality figure
            info += '<div class="featureRow"><div class="featureCell"><b>' + p + '</b></div>' +
                '<div class="featureCell">' + feature.properties[p] + '% </div></div>';
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
    //document.getElementById(layerName).status = layer.scene.config.layers["_" + layerName].enabled ? "on" : "off";
    
    layer.scene.updateConfig();
}
//Impossible to layer more than 1 heatmap at a time to make sense. Hence, restrict to only 1 at a time
function onlyOneHeatmap(checkbox) {
    var checkboxes = document.getElementsByName('checkHeatmap')
    checkboxes.forEach((item) => {
        if (item !== checkbox && item.checked === true) {
            //Removes check mark
            item.checked = false

            //Runs toggle() to set _layer.enabled to false
            //id of each checkbox matches its _layer name in scene.yaml
            let itemId = item.id
            toggle(itemId);
        }
    })
}