//Determines if popups to be shown or counter enabled
var mode = 'noToolEnabled';
/**
 * Closes all open tools to prevent conflicts before another tool is opened
 * @param {!string} tool Receives string of tool being called by
 */
function selectTool (tool) {
    function resetTravelTimes() {
        //Resets all travelTimes and isochrone interval input to '1'
        //Do this when renderIsochrone launches and closes to prevent any chance of 'no-reset'
        //Don't do travelTimes = [1,1,1]. This immutable method bugs Targomo!
        travelTimes[0] = 1;
        travelTimes[1] = 1;
        travelTimes[2] = 1;

        document.getElementById("travelTime1").value = 1;
        document.getElementById("travelTime2").value = 1;
        document.getElementById("travelTime3").value = 1;
    }
    
    //Opens tool on button click if noToolEnabled
    if (tool === 'countFeatures' && mode === 'noToolEnabled') { 
        mode = 'countFeatures';
        countFeatures();
    } else if (tool === 'renderIsochrone' && mode === 'noToolEnabled') { 
        mode = 'renderIsochrone'
        document.getElementById('isochroneControlBox').style.display = 'block';
        resetTravelTimes();
        
    //Closes tool when button for that tool clicled
    } else if(tool === 'countFeatures' && mode === 'countFeatures'){
        //Removes counting box overlay on 2nd click of 'Count features' button
        areaSelect.remove();
        mode = 'noToolEnabled';
    } else if (tool === 'renderIsochrone' && mode === 'renderIsochrone'){
        map.spin(true);
        isochroneLayerGroup.clearLayers();
        resetTravelTimes();

        document.getElementById('isochroneControlBox').style.display = 'none';
        map.spin(false);
    
        mode = 'noToolEnabled'
    
    //Closes open tool when another tool selected
    } else if(tool === 'countFeatures' && mode === 'renderIsochrone'){
        map.spin(true);
        isochroneLayerGroup.clearLayers();
        resetTravelTimes();

        document.getElementById('isochroneControlBox').style.display = 'none';
        map.spin(false);
   
        mode = 'countFeatures'
        countFeatures();
    } else if (tool === 'renderIsochrone' && mode === 'countFeatures'){
        //Removes counting box overlay on 2nd click of 'Count features' button
        areaSelect.remove();
        mode = 'renderIsochrone';
        document.getElementById('isochroneControlBox').style.display = 'block';
    }  
}
//Determines which feature counter should count
var spaceIDSelected = [];
// Popups. closeButton controlled by the little 'x' in the popup.
var popup = L.popup({closeButton: false});
//counts number of features in bounding box
function countFeatures() {
    areaSelect = L.areaSelect({width:200, height:200}); // Need to make a new one each time for some reason
    areaSelect.addTo(map);

    async function calcArea(bounds) {  
        if(mode === 'countFeatures'){ //Conditional required, otherwise thsi function will keep running!
            map.spin(true);
            var totalFeatures = 0;
            var spaceID = spaceIDSelected; //Obtains count of coordinates in this data set within counting box!
            var accessToken = 'ANOkxlf9QMWB72jUxUuT7AA';

            for(let i=0; i<spaceID.length; i++){
                var url = 'https://xyz.api.here.com/hub/spaces/' + spaceID[i] + '/bbox?access_token=' + accessToken + '&west=' + bounds.getWest() + '&south=' + bounds.getSouth() + '&east=' + bounds.getEast() + '&north=' + bounds.getNorth();
            
                /*If not for async-await, the popup will appear with totalFeatures=0 before all fetch 
                requests are completed!!*/
                await fetch(url).then((response) => response.json()).then(function(data) {
                    var len = data.features.length;
                    totalFeatures = totalFeatures + parseFloat(len);
                });
            }
            
            map.spin(false); //Turns off the 'spinner' gif that pops up when the counter is counting
            //Original code to add popup: L.popup().setLatLng(map.getCenter()).setContent(formatNumber(totalFeatures) + ' features found').openOn(map)
            await L.popup().setLatLng(map.getCenter()).setContent(formatNumber(totalFeatures) + ' features found').openOn(map)
        }   
    };
    //To call on one of the properties of L.class in leaflet-areaselect.js, follow this syntax:
    //L.areaSelect({width: x, height: x}).propertyToCall()
    calcArea(areaSelect.getBounds()); // Run it once at load time
    areaSelect.on("change", function() {
        calcArea(this.getBounds());  // Then run it again anytime the box changes
    });
}

/**
 * Use LayerGroup instead of map.removeLayer(layerName) to remove all markers and 
 * isochrone layers added by renderIsochrone in one fell swoop!
*/
var isochroneLayerGroup = new L.LayerGroup();
function setTravelTimes (parameter, value) {
    //isNaN(value)===false if either a string or integer number is entered
    if (isNaN(value)===false && value >= 1 && value <= 30){
        travelTimes[parameter] = value*60;
    } else {
        alert("Invalid interval (1 to 30 minutes only)");
    }
}
function setTravelType (value) {
    isochroneOptions["travelType"] = value;
}
/**Restrict because impossible to layer more than 1 travel type
 * @param {!string} button Refers to the button clicked
 */
function onlyOneTravelType(button) {
    var buttons = document.getElementsByName('travelType')

    buttons.forEach((item) => {
        if (item === button) { //Acts when unclicked travelType is clicked for 1st time
            //Marks as 'clicked'
            item.style.backgroundColor = "green";
        } else if (item !== button) { //Clears any prior-selected travel types
            //Marks as 'not clicked'
            item.style.backgroundColor = "whitesmoke";
        } 
    })
}
 // polygons time rings. Time in seconds
//5 min: 300, 15 min: 900, 30min: 1800, 1hr: 3600
//My free tier limit: 0-1800 seconds, 3 travel times max
let travelTimes = [1, 1, 1];
// you need to define some options for the polygon service
// travelType options: 'walk', 'bike', 'car' or 'transit'
let isochroneOptions = {
    travelType: 'car',
    travelEdgeWeights: travelTimes,
    maxEdgeWeight: 1800,
    edgeWeight: 'time',
    serializer: 'json'
};
//Activated by clicking on map after 'renderIsochrones' is clicked
async function renderIsochrone (latlngObj){
    console.log(latlngObj);
    console.log(travelTimes);
    if (travelTimes[0] >=1 && travelTimes[1] >=1 && travelTimes[2] >=1
    && travelTimes[0] <=1800 && travelTimes[1] <=1800 && travelTimes[2] <=1800) {
        map.spin(true); //opens 'loading' gif as isochrone loads
        document.getElementById('loadingBackground').style.display = 'table-cell';

        // create targomo client
        const client = new tgm.TargomoClient('asia', 'RRSOIF28MZJD7PAD2F58207565238');

        // define the starting point
        //lat-lng obtained onClick @ map
        const sources = [{ id: 0, lat: latlngObj.lat, lng: latlngObj.lng }];

        // Add markers for the sources on the map.
        sources.forEach(source => {
            let originMarker = L.marker([source.lat, source.lng])
            isochroneLayerGroup.addLayer(originMarker)
        });

        // define the polygon overlay
        const polygonOverlayLayer = new tgm.leaflet.TgmLeafletPolygonOverlay({ strokeWidth: 20 });

        // get the polygons
        const polygons = await client.polygons.fetch(sources, isochroneOptions);
        // add polygons to overlay
        polygonOverlayLayer.setData(polygons);

        //Add overlayLayer to isochroneLayerGroup for addTo map. THis displays the isochrone
        isochroneLayerGroup.addLayer(polygonOverlayLayer)
        isochroneLayerGroup.addTo(map)

        // calculate bounding box for polygons
        //const bounds = polygons.getMaxBounds();
        // zoom to the polygon bounds
        //Seems buggy: Clicked location marker shifts when fitBounds is applied onClick
        //map.fitBounds(new L.latLngBounds(bounds.northEast, bounds.southWest));
        
        map.spin(false); //Closes 'loading' gif once isochrone is rendered
        document.getElementById('loadingBackground').style.display = 'none';
    } else{
        alert("Invalid interval (1 to 30 minutes only)");
    }
}
function resetIsochrone () {
    map.spin(true);
    isochroneLayerGroup.clearLayers();
    map.spin(false);
}


