/**
 * Turf.js in Node.js demo: Locate Libraries with Nice Ride Bike Stations (and those without)
 *
 * @author Andy Walz <andy.walz@luminfire.com>
 */

console.log("Hello MaptimeMSP");

// Instantiate packages
const request = require('request');   // https://www.npmjs.com/package/request
const GeoJSON = require('geojson');   // https://www.npmjs.com/package/geojson
const fs = require('fs');
const open = require('open');
const turf = require('@turf/turf');


// Configure the request for Nice Ride JSON feed.
// Note: I had to switch from get-json to request because the API started
// rejecting requests without user-agent header, which request supports
var options = {
    url: 'https://api-core.niceridemn.org/gbfs/en/station_information.json',
    method: 'GET',
    headers: {
        'User-Agent':       'Super Agent/0.0.1'
    }
}

// Execute request to NiceRide API
request(options, function (error, response, body){

    // You're now in the callback function which means data received or error occured

    if (!error && response.statusCode === 200) {

        // No errors, proceed by converting JSON text to JavaScript object
        const stationJson = JSON.parse(body);

        // Convert Bikeshare Format to GeoJSON (https://www.npmjs.com/package/geojson)
        var stations = GeoJSON.parse(stationJson.data.stations, {Point: ['lat', 'lon'],include: ['name']});

        // Map stations in geojson.io
        mapit ( stations );

        // Now let's read in geojson (feature collection of points) from a file
        const libraries = JSON.parse(fs.readFileSync('./data/mn_libraries.geojson'));

        // Let's not try to map libraries (this is what caused the bug during demo--the dataset is just too large to pass via url to geojson.io)
        // Actually you can try it now if you want because I added error handling to mapit() see below
        //mapit ( libraries );

        // Also read in area of interest: Hennepin Co
        const aoi = JSON.parse(fs.readFileSync('./data/hennepin.geojson'));

        // Finally some Turf.js - Return only libraries within Hennepin Co
        var mplsStations = turf.within(stations, aoi);

        // Write output to .geojson file, open in QGIS
        // (NOTE: must set QGIS as default program for all .geojson files)
        fs.writeFile('./data/mplsStations.geojson',JSON.stringify(mplsStations),function(err){
          open('./data/mplsStations.geojson');
        });

        // Buffer bike stations by ~2 blocks
        var polygons = turf.buffer(mplsStations,0.2,'kilometers');

        // Write buffered stations file, open in QGIS
        fs.writeFile('./data/buffered_stations.geojson',JSON.stringify(polygons),function(err){
          open('./data/buffered_stations.geojson');
        });

        // Get libraries that fall within buffered Nice Ride stations
        var librariesWithNice = turf.within(libraries, polygons);

        // Open all libaries and only libraries with Nice Ride stations in QGIS
        fs.writeFile('./data/librariesWithNice.geojson',JSON.stringify(librariesWithNice),function(err){
          open('./data/librariesWithNice.geojson');
        });
        fs.writeFile('./data/allLibraries.geojson',JSON.stringify(libraries),function(err){
          open('./data/allLibraries.geojson');
        });


    } else {
        console.log("Got an error: ", error, response, ", status code: ", response.statusCode)
    }
});


function mapit(geojson) {
    // open package allows open a file or url in the user's preferred application

    try {
    // pass data to geojson.io via url segment
        var geojsonUrl = 'http://geojson.io/#data=data:application/json,' + encodeURIComponent(JSON.stringify(geojson))    // open map in default web browser
        open(geojsonUrl);
    } catch(err) {
        console.log("ERROR: Dataset too large! Can't open via geojson.io url. Try using QGIS");
    }
}


