const fs = require('fs');
const turf = require('@turf/turf');

const NEIGHBORHOODS_FILE = './GEBIED_BUURTCOMBINATIES_EXWATER.json';
const SOLAR_FILE = './ZONNEPANELEN2017.json';
const OUT_FILE = './heatmap.json';

var nhoods = JSON.parse(fs.readFileSync(NEIGHBORHOODS_FILE, {encoding: 'utf8'}));
var solar = JSON.parse(fs.readFileSync(SOLAR_FILE, {encoding: 'utf8'}));

nhoods.features.forEach(function(feature) {
  // get list of solar panels within neighborhood polygon
  var points = turf.pointsWithinPolygon(solar, feature)

  // add total number of panels as property to neighborhood
  feature.properties.count = points.features.length;

  // add total power generated as property to neighborhood
  feature.properties.totalPower = 0;
  points.features.forEach(function(point) {
      feature.properties.totalPower += +point.properties.Vermogen;
  });
});

fs.writeFileSync(OUT_FILE, JSON.stringify(nhoods), {encoding: 'utf8'})