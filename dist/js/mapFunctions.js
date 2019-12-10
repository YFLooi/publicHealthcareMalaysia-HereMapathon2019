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
map.setView([4.354682, 109.308983], 6);
//Tooltips display info where a click is made. 
//While a popup looks like a bubble with a tail, a tooltip is square with a short tail
var tooltip = L.tooltip();
tangramLayer.bindTooltip(tooltip);
map.on('zoom', function(){ tangramLayer.closeTooltip() }); // close tooltip when zooming


//Determines if popups to be shown or counter enabled
var mode = 'noToolEnabled';
//Determines which feature counter should count
var spaceIDSelected = [];
// Popups. closeButton controlled by the little 'x' in the popup.
var popup = L.popup({closeButton: false});
//var featurecountLayerGroup = new L.LayerGroup();
//counts number of features in bounding box
function countFeatures() {
    //Removes counting box overlay on 2nd click of 'Count features' button
    if (mode === 'featureCount') {
        featurecountLayerGroup.isOpen(); //Clears popups on featureCount close
        areaSelect.remove(); 
        mode = 'noToolEnabled';
    } else if (mode === 'noToolEnabled') { //Applies counting box overlay if mode !== featureCount
        mode = 'featureCount';
        areaSelect = L.areaSelect({width:200, height:200}); // Need to make a new one each time for some reason
        areaSelect.addTo(map);

        function calcArea(bounds) {
            if (mode == 'featureCount') { // Prevent this from accidentally running in the other mode
                map.spin(true);
                var totalFeatures = 0;
                var spaceID = spaceIDSelected; //Obtains count of coordinates in this data set within counting box!
                var accessToken = 'ANOkxlf9QMWB72jUxUuT7AA';

                for(let i=0; i<spaceID.length; i++){
                    var url = 'https://xyz.api.here.com/hub/spaces/' + spaceID[i] + '/bbox?access_token=' + accessToken + '&west=' + bounds.getWest() + '&south=' + bounds.getSouth() + '&east=' + bounds.getEast() + '&north=' + bounds.getNorth();
                
                    fetch(url).then((response) => response.json()).then(function(data) {
                        var len = data.features.length;
                        totalFeatures = totalFeatures + parseFloat(len);
                    });
                }
                
                setTimeout(function(){
                    map.spin(false); //Turns off the 'spinner' gif that pops up when the counter is counting

                    //Original code to add popup: L.popup().setLatLng(map.getCenter()).setContent(formatNumber(totalFeatures) + ' features found').openOn(map)
                    /** 
                    let popupLayer = L.popup().setLatLng(map.getCenter()).setContent(formatNumber(totalFeatures) + ' features found');
                    featurecountLayerGroup.addLayer(popupLayer);
                    featurecountLayerGroup.addTo(map);
                    Issue with adding separate layer is that the popup will not close on click
                    */
                    L.popup().setLatLng(map.getCenter()).setContent(formatNumber(totalFeatures) + ' features found').openOn(map)
                },1000);
            }
        };
        //To call on one of the properties of L.class in leaflet-areaselect.js, follow this syntax:
        //L.areaSelect({width: x, height: x}).propertyToCall()
        calcArea(areaSelect.getBounds()); // Run it once at load time
        areaSelect.on("change", function() {
            //featurecountLayerGroup.clearLayers(); //Removes popup when areaSelect changes
            calcArea(this.getBounds());  // Then run it again anytime the box changes
        });
    }
}

/**Use LayerGroup instead of map.removeLayer(layerName) to remove all markers and 
 * isochrone layers added by renderIsochrone in one fell swoop!
*/
var isochroneLayerGroup = new L.LayerGroup();
function toggleIsochrone() {
    if (mode === 'isochrone'){
        mode = 'noToolEnabled';
        renderIsochrone();
    } else if (mode === 'noToolEnabled') {
        mode = 'isochrone';
    }
}
async function renderIsochrone (latlngObj){
    if (mode === 'noToolEnabled'){
        map.spin(true);
        isochroneLayerGroup.clearLayers();
        map.spin(false);
    } else {
        map.spin(true); //opens 'loading' gif as isochrone loads
        document.getElementById('mapContainer').style.backgroundColor = '#494d4d8C';

        // create targomo client
        const client = new tgm.TargomoClient('asia', 'RRSOIF28MZJD7PAD2F58207565238');

        // polygons time rings. Time in seconds
        //5 min: 300, 15 min: 900, 30min: 1800, 1hr: 3600
        //My free tier limit: 0-1800 seconds, 3 travel times max
        const travelTimes = [300, 900, 1800];

        // you need to define some options for the polygon service
        // travelType options: 'walk', 'bike', 'car' or 'transit'
        const options = {
            travelType: 'car',
            travelEdgeWeights: travelTimes,
            maxEdgeWeight: 1800,
            edgeWeight: 'time',
            serializer: 'json'
        };

        // define the starting point
        const sources = [{ id: 0, lat: latlngObj.lat, lng: latlngObj.lng }];
        //Can obtain on click, should pass to this function as a property.
        //console.log(selection.leaflet_event.latlng);
        //selection.leaflet_event.latlng returns an object: {lat: xxx, lng: xxx}

        // Add markers for the sources on the map.
        sources.forEach(source => {
            let originMarker = L.marker([source.lat, source.lng])
            isochroneLayerGroup.addLayer(originMarker)
        });

        // define the polygon overlay
        const polygonOverlayLayer = new tgm.leaflet.TgmLeafletPolygonOverlay({ strokeWidth: 20 });
        isochroneLayerGroup.addLayer(polygonOverlayLayer)
        //polygonOverlayLayer.addTo(map);

        // get the polygons
        const polygons = await client.polygons.fetch(sources, options);
        // calculate bounding box for polygons
        const bounds = polygons.getMaxBounds();
        // add polygons to overlay
        polygonOverlayLayer.setData(polygons);
        // zoom to the polygon bounds
        //Seems buggy: Clicked location marker shifts when fitBounds is applied onClick
        //map.fitBounds(new L.latLngBounds(bounds.northEast, bounds.southWest));

        isochroneLayerGroup.addTo(map)
        map.spin(false); //Closes 'loading' gif once isochrone is rendered
        //document.getElementById('mapContainer').style.backgroundColor = 'rgba(0,0,0,0)';
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
    } else if (mode === 'isochrone') {
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
 * @param {!string} layerName Matches name set in scene.yaml 
 */
function toggle(layerName) {
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