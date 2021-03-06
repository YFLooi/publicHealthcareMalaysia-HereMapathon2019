//Generates map on page load. Runs automatically.
var map = L.map('map', {boxZoom: false});
L.control.scale().addTo(map); //Adds scale bar to map
//Creates Tangram as a Leaflet layer
var tangramLayer = Tangram.leafletLayer({
    scene: 'scene.yaml',
    attribution: '<a href="https://mapzen.com/tangram" target="_blank">Tangram</a> | &copy; OSM contributors | <a href="https://mapzen.com/" target="_blank">Mapzen</a>',
    events: {
        //Adds listener to Tangram layer. On trigger, it runs function showPopup()
        //2 possibilities: 'click' and 'hover'. Only one popup displays at a time
        hover: onMapHover,
        click: onMapClick
    }
});
tangramLayer.addTo(map);
/** 
 * Coordinates in [] are center point. 
 * Number after ',' sets zoom level. Bigger number = Zoom in more
 * Original in tut: [52.332548, 4.893920], 12
 * For Malaysia: [4.354682, 109.308983], 6
 */
map.setView([4.354682, 109.308983], setZoom());
//Tooltips display info where a click is made. 
//While a popup looks like a bubble with a tail, a tooltip is square with a short tail
var tooltip = L.tooltip();
tangramLayer.bindTooltip(tooltip);
map.on('zoom', function(){ tangramLayer.closeTooltip() }); // close tooltip when zooming

function setZoom(){
    const screenWidth = window.innerWidth;

    if (screenWidth > 1000){
        return 6;
    } else if (screenWidth < 1000 && screenWidth > 400) {
        return 5;
    } else if (screenWidth < 400) {
        return 4;
    }
}
/**
 * Adds a comma for every 3 numbers in a number string
 * Output returned as a string
 * @param x {!integer} input number
*/
function formatNumber(x) {
    //regular expression used to format solar power output 
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
function onMapHover (selection) {
    //selection = what's underneath the cursor. 'feature' refers to roads, markers, landmarks
    var feature = selection.feature;
    //This determines what happens onHover
    if (feature && mode === 'noToolEnabled') {
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
        tangramLayer.openTooltip(selection.leaflet_event.latlng);
    }
    else { //This closes the tooltip offHover
        tangramLayer.closeTooltip();
    }
}
function onMapClick(selection) {
    if (mode === 'noToolEnabled') {
        // '.feature' refers to an area under mouse, 'selection' refers to the hovered/clicked 
        //Only 1 popup can appear at a given time. Other open popups close when another popup-enabled
        //area is clicked/hovered over
        var feature = selection.feature;
        if (feature) {
            var info = getFeaturePropsHTML(feature);
            tooltip.setContent(info);
            tangramLayer.openTooltip(selection.leaflet_event.latlng);
            
        } else {
            //Does what it says: If a click is made outside of the heatmap area, 
            //the tooltip is closed
            tangramLayer.closeTooltip();
        }
    } else if (mode === 'renderIsochrone') {
        renderIsochrone(selection.leaflet_event.latlng);
    }
}
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
 * @param {string} layerName Matches name set in scene.yaml 
 */
function toggle(layerName) {
    map.spin(true); //opens 'loading' gif as isochrone loads
    tangramLayer.scene.config.layers["_" + layerName].enabled = !tangramLayer.scene.config.layers["_" + layerName].enabled;
    //document.getElementById(layerName).status = layer.scene.config.layers["_" + layerName].enabled ? "on" : "off";
    
    //Code below used for feature counter
    //Obtains spaceId associated with layerName
    let asscSpaceId = '';
    if(layerName === 'publicClinicLocations'){
        asscSpaceId = 'CnsQWqCa'
    } else if(layerName === 'nonSpecialistPublicHospitalLocations'){
        asscSpaceId = 'kWD0C5yR'
    } else if(layerName === 'specialistPublicHospitalLocations'){
        asscSpaceId = 'fFv6HXwU'
    }


    //Prevents the same spaceId from appearing twice in var spaceIdSelected
    const duplicateIndexCheck = spaceIDSelected.findIndex(element => element === asscSpaceId);
    //Timeout needed for code above to run, otherwise features will be counted when they should not
    //Cannot make timeout too long, otherwise counter will count based on last-known spaceIDSelected
   
    //To work with feature counter later
    if(layerName === 'publicClinicLocations' && duplicateIndexCheck === -1){
        spaceIDSelected.push('CnsQWqCa');
    } else if(layerName === 'nonSpecialistPublicHospitalLocations' && duplicateIndexCheck === -1){
        spaceIDSelected.push('kWD0C5yR');
    } else if(layerName === 'specialistPublicHospitalLocations' && duplicateIndexCheck === -1){
        spaceIDSelected.push('fFv6HXwU');
    } else if(duplicateIndexCheck !== -1){
        spaceIDSelected.splice(duplicateIndexCheck,1);
    }

    tangramLayer.scene.updateConfig();
    map.spin(false); 
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
function toggleLayerControlBox (command) {
    if (command === 'showControlBox'){
        document.getElementById('layerControlBox').style.display='block';
        document.getElementById('hideControlBoxButton').style.display='block';
        document.getElementById('showControlBoxButton').style.display='none';
    } else if (command === 'hideControlBox'){
        document.getElementById('layerControlBox').style.display='none';
        document.getElementById('hideControlBoxButton').style.display='none';
        document.getElementById('showControlBoxButton').style.display='block';
    }
}


