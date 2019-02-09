/**
 * Setup connection to database, run query, retrieve and return documents
 */
'use strict';

var mongoClient = require('mongodb').MongoClient;
var utm = require('./UTM');
var bufferBuilder = require('./bufferBuilder');

const ip = '127.0.0.1';
const portNum = 27017;
const dbName = 'roadDB';
const url = 'mongodb://localhost:27017';
var conn;
var documents;


/*  - 1. Connect to DB 
    - 2. Fetch line data from MongoDB
    - 3. Get the geometry(in WGS84 lat/long coordinates) object from the geojosn line or multiline
    - 4. Convert geom coordinates to lat/long to UTM coordinates
    - 5. Build buffer around the line
    */
mongoClient.connect(url)
  .then(
    // ---- STEP 1.
    conn => {

      // ---- STEP 2.
    return conn.db('roadDB').collection('road').find({
      "properties.Name": "Beach Road"
      }).toArray() 
    .then(docs => {

      //myLog(docs);
      var geom = getGeomFromDoc(docs);

      // ---- STEP 3.
      if (geom !== false) {
        //console.log("Mongdb GEOM in lat/long: ------- \n", geom);

        // ---- STEP 4.
        let geomUTM = utm.getCartesianFromGeodetic(geom);
        console.log("GEOM in UTM coordinates : ------- \n", geomUTM);
      }

      // ---- STEP 5.
      //bufferBuilder.getLineBuffer(geom);

    })
    .then(() => {

      conn.close();
    })
    .catch(err => {
      myLog(err.toString());
      console.error(err);
      
    })

  });



/* 
*   function:     checks if the geometry is of line or multiline type
*   input:        accepts a mongodb document(s)
*   input type:   json type object
*   output:       returns line multiline status of json object
*   output type:  boolean
 */
function isLineOrMultiLine(documents){
  //console.log("Inside isLineOrMultiLine");
  var stringified = JSON.stringify(documents);
  stringified = stringified.slice(1, -1);
  var jsoned = JSON.parse(stringified);
  var type = jsoned.geometry.type;
  var status = false;
  if (type === "MultiLine"  || type === "Line" || type === "MultiLineString") {
  	status = true;
  }
  return status;
}

/* 
*   function: extract the geomtry object coordinates as a json object
*   input: document(s) extracted from mongodb
*   output: returns a geom(set of coordinatwes) object
*/
function getGeomFromDoc(documents){
  var linesArray;
  var stringified = JSON.stringify(documents);
  stringified = stringified.slice(1, -1);
  var jsoned = JSON.parse(stringified);
  var type = jsoned.geometry.type;

  if (type === "MultiLine"  || type === "Line" || type === "MultiLineString") {
    linesArray = jsoned.geometry.coordinates;
  } else{
    linesArray = false;
  }
  return linesArray;
}


function executeQueryOnCollection(collection){
  console.log("inside 3");
  collection.find({
    "properties.Name": "Beach Road"
    }).toArray(function(err, docs) {
      var documents;
      if (err) {
        errorHandler(err)
      }
      console.log("Found the following records");  
      console.log(docs); 
      return docs;
  }); 
}

var errorHandler = function (err) {
  console.log(err);
  throw err;
}


  function myLog(msg){
    console.log(getTime() + " : " + msg);
  }
  
  function getTime(){
    var d = new Date();
    return d.toLocaleTimeString('en-GB') + "." + d.getMilliseconds();
  }
  