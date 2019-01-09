
var mongoClient = require('mongodb').MongoClient;
//var LineBuffer = require('./BufferClass');
//var UTMUtils = require('./UTMUtils');


var dbManager = function(url, db){
	
	this.db = db;
	this.url = url;
	this.client;
	this.documents;
	this.geom;
	console.log(this.url);

	this.tasks = [
	  this.executeQuery,
	  this.geomFromDoc
	];
	
	//this.executeQuery(url, db);
	//this.next();
	
	//this.findDocuments();	
}



dbManager.prototype.showDBName = function(){
  console.log("DB name is: ", db);
}


dbManager.prototype.executeQuery = function(){
	var db = this.db;
	var url = this .url;
	var dbc;
	var documents;
	mongoClient.connect(this.url, function(err, dbClient){
		if (err) {
			this.errorReporter(err);
		}
		this.client = dbClient;
		console.log("Connected successfully to : " + url + db);
		dbc = dbClient.db(db);	
		var collection = dbc.collection('road');
		
		collection.find({
			"properties.Name": "Beach Road"
			//"properties.name": "CENTRAL"
			}).toArray(function(err, docs) {
	    	if (err) {
	    	  this.errorReporter(err);
	    	}
	    	console.log("Found the following records");
	    	
	    	this.documents = docs;
	    	var lineType = isLineOrMultiLine(docs);

	    	//console.log(this.documents);
	    	if (lineType) {
	    		var geom = geomFromDoc(docs);
	    		geodeticToCartesian(geom);
	    	}
	    	geodeticToCartesian(geom);
	    	
	    	return docs;
		});
		dbClient.close();
	});
}


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
  console.log("Post Status is: " + status);
  return status;
}

/* 
*   function: extract the geomtry object coordinates as a json object
*   input: document(s) extracted from mongodb
*   output: returns a geom(set of coordinatwes) object
*/
function geomFromDoc(documents){
    var stringified = JSON.stringify(documents);
    stringified = stringified.slice(1, -1);
    var jsoned = JSON.parse(stringified);
    
    var linesArray = jsoned.geometry.coordinates;
    //console.log(linesArray);

    return linesArray;
};


function geodeticToCartesian(docs){
	var lon, lat;
    for (var i = 0; i < docs.length; i++) {
    	var line = docs[i];
    	console.log(" -------- jsoned.geometry ----------");
    	for (var j = 0; j < line.length; j++) {
    		var coord = line[j];
    		lon = coord[0];
    		lat = coord[1];
    		console.log(lon + " " + lat);
    	}
    }
}

dbManager.prototype.errorReporter = function(err){
	console.log("!! Error found");
	throw err;
}

module.exports = exports = dbManager;


