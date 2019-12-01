const fs = require('fs');
const turf = require('@turf/turf');

//File has geometry.type = Polygon
//const POLYGON_FILE = './clean_Malaysia_AllStateBorders.json';
const POLYGON_FILE = './clean_Malaysia_AllDistrictBorders.json';

//File has geometry.type = Point
const POINT_FILE = './populationByDistrictNationwide_Malaysia.geojson';
const OUT_FILE = './heatmap_districtPopulation.json';

var polygons = JSON.parse(fs.readFileSync(POLYGON_FILE, {encoding: 'utf8'}));
var pointsLocations = JSON.parse(fs.readFileSync(POINT_FILE, {encoding: 'utf8'}));

polygons.features.forEach(function(feature) {
  // get list of coordinate points that fall within 'polygons'
  var points = turf.pointsWithinPolygon(pointsLocations, feature)

  // add total number of coordinate points under features.properties of base polygon
  feature.properties.count = points.features.length;

  // add a quantifiable property generated under features.properties of base polygon. 
  // For example, power output per solar cell in that polygon to the base polygon
  // This later determines the intensity of the polygon's colour in the heatmap
  //NAME_OF_QUANTIFIED_PROPERTY must match that of source JSON's features.properties 
  feature.properties.population = 0;
  points.features.forEach(function(point) {
      feature.properties.population += +point.properties.population;
  });
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