const fs = require('fs');
const turf = require('@turf/turf');

//File has geometry.type = Polygon
const POLYGON_FILE = './clean_Malaysia_AllStateBorders.json';
//const POLYGON_FILE = './clean_Malaysia_AllDistrictBorders.json';

//File has geometry.type = Point
const POINT_FILE = './heatmapData_WHOIndices.geojson';
const OUT_FILE = './heatmaps/heatmap_WHOIndices.json';

var polygons = JSON.parse(fs.readFileSync(POLYGON_FILE, {encoding: 'utf8'}));
var pointsLocations = JSON.parse(fs.readFileSync(POINT_FILE, {encoding: 'utf8'}));

polygons.features.forEach(function(feature) {
  //Gets list of all coordinate points and their properties that fall within boundary of each polygon
  var points = turf.pointsWithinPolygon(pointsLocations, feature)
  //console.log(points.features[0].properties.state);

  //Set features on the polygon. 'name' of point.properties.name must match that in input json file
  points.features.forEach(function(point) {
    feature.properties.WHO_Index_Health_Level = points.features[0].properties.WHO_Index_Health_Level;  
    feature.properties.WHO_Index_Health_Distribution = points.features[0].properties.WHO_Index_Health_Distribution;  
    feature.properties.WHO_Overall_Health_Index = points.features[0].properties.WHO_Overall_Health_Index;  
  });

  /** Structure of features.properties
  [ 
    { 
      type: 'Feature',
      properties: { 
        Latitude: '1.948424',
        Longitude: '103.473396',
        state: 'Johor',
        Births_Per_10000_People: '142',
        population: '3756800' 
      },
      geometry: { 
        type: 'Point', 
        coordinates: [Array] 
      } 
    } 
  ]
  */

  /**
    Ex:
    //Gets list of all coordinate points and their properties that fall within boundary of each polygon
    var points = turf.pointsWithinPolygon(pointsLocations, feature)

    Then assigns the total number of points(point.feature.length) to a GeoJSON property
    called 'count'
    feature.properties.count = points.features.length;
   */
  /**The idea here is to add the solar power output at each data point in the feed data 
   * then put the total in feature.properties.totalPower
    feature.properties.totalPower = 0; //Init as zero
    points.features.forEach(function(point) {
      feature.properties.totalPower += +point.properties.powerOutput;
    });
  */
});

fs.writeFileSync(OUT_FILE, JSON.stringify(polygons), {encoding: 'utf8'})

/**
 * Output:
 * {"type":"FeatureCollection","features":[
 *  {
 *    "id":1,
 *    "type":"Feature",
 *    "geometry":{
 *      "type":"Polygon",
 *      "coordinates":[[
 *        [4.971847,52.284349],
 *        [4.971847,52.284349],
 *        ... (will be many!)
 *      ]]
 *    },"
 *    properties":{
 *      "Buurtcombinatie_code":"T92",
 *      "Buurtcombinatie":"Amstel III/Bullewijk",
 *      "count":10,
 *      "PROPERTY_NAME":1300000
 *    }
 *  },
 *  ...
 * ]}
 */