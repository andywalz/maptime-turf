/**
 * Turf.js in Node.js demo: Locate Libraries with Nice Ride Bike Stations (and those without)
 *
 * @author Andy Walz <andy.walz@luminfire.com>
 */

console.log("Hello MaptimeMSP");

// Instantiate packages
const GeoJSON = require('geojson');   // https://www.npmjs.com/package/geojson
const getJSON = require('get-json');  // https://www.npmjs.com/package/get-json
const fs = require('fs');
const open = require('open');
const turf = require('@turf/turf');

// Fetch Nice Ride MN Station Locations as GBFS
getJSON('https://api-core.niceridemn.org/gbfs/en/station_information.json', function(error, response){

    // Convert GBFS to GeoJSON
    var stations = GeoJSON.parse(response.data.stations, {Point: ['lat', 'lon'],include: ['name']});

    // Map stations in geojson.io
    //mapit ( stations );

    // read in geojson
    const libraries = JSON.parse(fs.readFileSync('./data/mn_libraries.geojson')); // feature collection of points
    const aoi = JSON.parse(fs.readFileSync('./data/hennepin.geojson')); // Area of Interest: Hennepin Co

    var mplsStations = turf.within(stations, aoi); // Return only libraries within Hennepin co

    //mapit ( mplsStations );

    // Write output to .geojson file, open in QGIS
    // (NOTE: must set QGIS as default program for all .geojson files)
    fs.writeFile('./data/mplsStations.geojson',JSON.stringify(mplsStations),function(err){
      open('./data/mplsStations.geojson');
    });

    // Buffer bike stations by ~2 blocks
    var polygons = turf.buffer(mplsStations,0.2,'kilometers');

    fs.writeFile('./data/buffered_stations.geojson',JSON.stringify(polygons),function(err){
      open('./data/buffered_stations.geojson');
    });

    // Get libraries that fall within buffered Nice Ride stations
    var librariesWithNice = turf.within(libraries, polygons);

    fs.writeFile('./data/librariesWithNice.geojson',JSON.stringify(librariesWithNice),function(err){
      open('./data/librariesWithNice.geojson');
    });

    fs.writeFile('./data/allLibraries.geojson',JSON.stringify(libraries),function(err){
      open('./data/allLibraries.geojson');
    });

});


function mapit(geojson) {
    // open package allows open a file or url in the user's preferred application
    const open = require('open');
    // pass data to geojson.io via url segment
    var geojsonUrl = 'http://geojson.io/#data=data:application/json,' + encodeURIComponent(JSON.stringify(geojson))    // open map in default web browser
    open(geojsonUrl);
}


