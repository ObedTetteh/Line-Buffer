/*
*   Author:
*   Name: Line Buffer tool (MongoDB)
*   Language: Javascript/ Node.js
*   Version: 1.0.0
*   Objective: Create a line buffer tool for line geometries for GeoJSON data in MongoDB
*   Sequencing logic: Asynchronous Serial using array queue
*
*/

const mongoClient = require('mongodb').MongoClient;
const assert = require('assert');
//var LineBuffer = require('./BufferClass');
var dbManager = require('./dbManager');
//var UTMUtils = require('./UTMUtils');



/*  Entry or start point of the application */
function main(){
  //console.log("Enter Server IP, port number and database and collection name: ");
  
  const ip = '127.0.0.1';
  const portNum = 27017;
  //const dbName = 'policedb5';
  const dbName = 'roadDB';
  const url = 'mongodb://' + ip + ':' + portNum;
  var conn;
/*  const tasks = [
    (function(){
      conn = new dbManager(url, dbName);
    })(),
    (function(){
      console.log("*** conn.documents: " + conn.documents);
    })()
    
  ];*/
  var conn = new dbManager(url, dbName);
  var documents = conn.executeQuery();
  console.log("##### " + documents);

  console.log("*** conn.documents: " + conn.documents);
  
  // tasks to be done next
  //next(connection);
}

// array queue for serial flow control
var tasks = [
  main,
];

// this function called 'next' executes the each task
function next (result) {
  // VVVIP: the list of tasks or functions actually start their execution from here , i.e. from the array
  var currentTask = tasks.shift(); /* next task comes from array of tasks. shift does FIFO */
  if (currentTask) {
    currentTask(result);
  }
}

function errorReporter(err){
  console.log('!!!!!!! error ');
  throw err;
}

next();