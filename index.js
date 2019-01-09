/**
 * Setup connection to database, run query, retrieve and return documents
 */
'use strict';

var mongoClient = require('mongodb').MongoClient;
var utm = require('./UTM');
var bufferBuilder = require('./bufferBuilder');

const ip = '127.0.0.1';
const portNum = 27017;
//const dbName = 'policedb5';
const dbName = 'roadDB';
const url = 'mongodb://localhost:27017';
var conn;
var documents;

mongoClient.connect(url)
  .then(conn => {
    console.log("inside 1");
    return conn.db('roadDB').collection('road').find({
      "properties.Name": "Beach Road"
      }).toArray() 
    .then(docs => {
      console.log("inside 2");
      myLog(docs);
      var geom = getGeomFromDoc(docs);
      if (geom !== false) {
        //console.log(geom);
        geom = utm.getCartesianFromGeodetic(geom);
      }

      bufferBuilder.getLineBuffer(geom);

    })
    .then(() => {
      console.log("inside 3");
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
  