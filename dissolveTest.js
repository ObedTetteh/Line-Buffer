var dissolve = require("geojson-dissolve");
var turf = require('turf');

var polygon1 = {
  "type": 'Polygon',
  geom: [
    [
    [0.8, 3],
    [1.2, 4],
    [3.7, 5],
    [5, 4.3],
    [4.8, 2.9],
    [1.9, 2.1],
    [0.8, 3]
    ]
  ]
}

var p3 = {
  "type": "Feature",
  "properties": {
    "name": "Bermuda Triangle",
    "area": 1150180
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [0.8, 3],
        [1.2, 4],
        [3.7, 5],
        [5, 4.3],
        [4.8, 2.9],
        [1.9, 2.1],
        [0.8, 3]
      ]
    ]
  }
}

var polygon2 = {
  type: 'Polygon',
  geom: [
    [
    [4.0, 3.8],
    [6.5, 2.8],
    [5.7, 1.7],
    [2.8, 1.6],
    [4.0, 3.8]
    ]
  ]
}
var p4 = {
  "type": "Feature",
  "properties": {
    "name": "Flemish Diamond",
    "area": 2947
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [4.0, 3.8],
        [6.5, 2.8],
        [5.7, 1.7],
        [2.8, 1.6],
        [4.0, 3.8]
      ]
    ]
  }
}
//----------------------------------------------------
var p1 = {
  "type": "Feature",
  "properties": {
    "name": "Bermuda Triangle",
    "area": 1150180
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [-64.73, 32.31],
        [-80.19, 25.76],
        [-66.09, 18.43],
        [-64.73, 32.31]
      ]
    ]
  }
}


var p2 = {
  "type": "Feature",
  "properties": {
    "name": "Flemish Diamond",
    "area": 2947
  },
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [3.55, 51.08],
        [4.36, 50.73],
        [4.84, 50.85],
        [4.45, 51.30],
        [3.55, 51.08]
      ]
    ]
  }
}
console.log("test");

//let dis = dissolve([polygon1, polygon2])
//let dis = dissolve([p1, p2]);
let dis = dissolve([p3, p4]);
//console.log(dis);

console.log(turf.union(p3, p4));