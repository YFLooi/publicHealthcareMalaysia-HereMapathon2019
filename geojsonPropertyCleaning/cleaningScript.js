const fs = require('fs');
const inputFile = './Malaysia_AllDistrictBorders.json';
const outputFile = './clean_Malaysia_AllDistrictBorders.json';

const parsedJson = JSON.parse(fs.readFileSync(inputFile, {encoding: 'utf8'}));
const propertiesToRemove = ["GID_0", "Country", "GID_1", "NL_State","GID_2", "VARNAME_2", "NL_NAME_2", "TYPE_2", "ENGTYPE_2", "CC_2", "HASC_2"]

//'features' refers to the features array in the GeoJson file
parsedJson.features.forEach(feature => {
    delete feature.properties[propertiesToRemove[0]];
    delete feature.properties[propertiesToRemove[1]];
    delete feature.properties[propertiesToRemove[2]];
    delete feature.properties[propertiesToRemove[3]];
    delete feature.properties[propertiesToRemove[4]];
    delete feature.properties[propertiesToRemove[5]];
    delete feature.properties[propertiesToRemove[6]];
    delete feature.properties[propertiesToRemove[7]];
    delete feature.properties[propertiesToRemove[8]];
    delete feature.properties[propertiesToRemove[9]];
    delete feature.properties[propertiesToRemove[10]];
})

fs.writeFileSync(outputFile, JSON.stringify(parsedJson), {encoding: 'utf8'})


