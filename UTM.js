'use strict';
/**
 * Compute Cartesian Coordinates from Geodetic (Lat/Long) coordinates and vice versa
 * using UTM projections.
 * It's constructor to accepts either a JSON array of Geodetic coordinates pairs 
 * and returns an array of Cartesian coordinates
 */

var util = require('./UTMUtils');



/** Holds the array of coordinate pairs e.g. [ [lon, lat], [lon, lat], ... ] */
var coordinateArray;

const a = 6378206.4;    /** Equatorial radius of the ellipsoid in meters */
const b = 6356583.8;     /** Semi minor axes of the reference ellipsoid */
const π = Math.PI;	
var e_sq = 0.006768657997291184;   /** Square of eccentricity */
var ko = 0.9996;
var f = 1 / 298.2572236;
const  DEG2RAD = 0.01745329;
const  RAD2DEG = 57.29577951;

var lon;            /** Holds the current longitude being processed in degree */
var lat;						/** Holds the current latitude being processed in degree */
var zone;						/** Holds the zone of the coordinate being processed */
var λo;             /** Holds zone central meridian in radians */
var λ;              /** Holds the current longitude being processed in radian */
var Φ;              /** Holds current latitide in radians */
var UTMEasting;
var UTMNorthing;

//trignometric variables
var cosΦ;
var sinΦ;
var t;
var t_sq;
var t_pow4;

//derived variables
var e_pow4, e_pow6, e_pow8, eprime_sq;
var η, η_sq, η_pow4;
var Λ;
var SΦ;
var N, T, C, M;

/** Starts the coordinate conversion process by looping through docs, 
 * Each document is an array of line e.g. document = [[line], [line], [line], ...].
 * Each line is an array of coordinate pairs, e.g. line = [[coordinate pair], [coordinate pair], ...]
 * Each coordinate pair is an array in this sequence [longitude, latitude]
 * */
function run(geom){
  geom.forEach(line => {
    console.log(" -------- inside run geometry ----------");
    for (var i = 0; i < line.length; i++) {
			var coordPair = line[i];			
			setVariables(coordPair);
			UTMEasting = getUTMEasting();
			UTMNorthing = getUTMNorthing();
			line[i][0] = UTMEasting;
			line[i][1] = UTMNorthing; 
			//console.log("UTM N: " + UTMNorthing + " | UTM E: " + UTMEasting + " | Zone: " + zone);
			getLonLat();
			//console.log("LINE: " + line[i][0] + " | " + line[i][1]);
		}
	});
	return geom;
	
}


function setVariables(coordPair){
	lon = coordPair[0];        //longitude in degree
	//Make sure the longitude is between -180.00 .. 179.9
	lon = (lon+180)- Math.floor((lon+180)/360)*360-180; // -180.00 .. 179.9; //longitude in degree
	lat = coordPair[1];		     //latitude in degree

	λ = lon * DEG2RAD;           //longitude in radians
	Φ = lat * DEG2RAD;           //latitude in radians
	zone = computeZone(coordPair);					
	λo = computeCentralMeridian(zone);                       

	//trignometric variables
	cosΦ = Math.cos(Φ);
	sinΦ = Math.sin(Φ);
	t = Math.tan(Φ);
	t_sq = Math.pow(t, 2);
	t_pow4 = Math.pow(t, 4);

	//derived variables
	e_pow4 = Math.pow(e_sq, 2);
	e_pow6 = Math.pow(Math.sqrt(e_sq), 6);
	e_pow8 = Math.pow(e_sq, 3);

	eprime_sq = e_sq / (1 - e_sq);
	η = Math.sqrt(eprime_sq) * cosΦ ;
	η_sq = Math.pow(η, 2);
	η_pow4 = Math.pow(η, 4);

	N = a / Math.sqrt(1 - e_sq  * Math.sin(Φ) * Math.sin(Φ));
	T = Math.tan(Φ) * Math.tan(Φ);
	C = eprime_sq * Math.cos(Φ) * Math.cos(Φ);
	//SΦ = SΦ();
	Λ = Math.cos(Φ) * (λ - λo);
	M = (1 - (e_sq / 4) - 3 * e_sq * e_sq / 64 - 5 * e_sq * e_sq * e_sq / 256) * Φ;
    M -= (3 * e_sq / 8 + 3 * e_sq * e_sq / 32 + 45 * e_sq * e_sq * e_sq / 1024) * Math.sin(2 * Φ);
    M += (15 * e_sq * e_sq / 256 + 45 * e_sq * e_sq * e_sq / 1024) * Math.sin(4 * Φ);
    M -= (35 * e_sq * e_sq * e_sq / 3072) * Math.sin(6 * Φ);
    M *= a;
}

/** 
 * Step 1: Compute the UTM zone of the geodetic coordinates 
 * ---------------------------------------------------------
*/
function computeZone(coordPair){
	zone = util.getZone(coordPair);
	return zone;
}

/** 
 * Step 2: Compute the Central Meridian of the geodetic coordinates 
 * ----------------------------------------------------------------
*/
function computeCentralMeridian(zone){
	var centralMeridian = util.getZoneCentralMeridian(zone);
	return centralMeridian;
}

/** 
 * Step 3x: Compute Xutm from X tranverse Mercator  
 * -----------------------------------------------
 * @param Xtm(Number): X tranverse Mercator  
 * @returns Xutm(Number): X Universal tranverse Mercator value
*/
function getUTMEasting(){
	let UTMEasting = (ko * N * (Λ + (1 - T + C) * Λ * Λ * Λ / 6 + 
			(5 - 18 * T + T * T + 72 * C - 58 * eprime_sq) * Λ * Λ * Λ * Λ * Λ / 120) + 500000.0);
	//var xtm2 = 0.9996 * getXtm2() + 500000;
	//console.log("Xutm2: " + xtm2);
	return UTMEasting;
	
}

/** 
 * Step 3y: Compute Yutm from Y tranverse Mercator  
 * -----------------------------------------------  
 * @returns (Number): Y or Northing Universal Tranverse Mercator value
*/
function getUTMNorthing(){
	let UTMNorthing = (ko * (M + N * Math.tan(Φ) * (Λ * Λ / 2 + (5 - T + 9 * C + 4 * C * C) * Λ * Λ * Λ * Λ / 24 +
                   (61 - 58 * T + T * T + 600 * C - 330 * eprime_sq) * Λ * Λ * Λ * Λ * Λ * Λ / 720)));
  if (lat < 0){
    UTMNorthing += 10000000.0; //10000000 meter offset for southern hemisphere
	}
	return UTMNorthing;
}

/**
 * Compute the Latitude from UTM coordinate
 */
function getLonLat(){
	let k = 1;                   
	let b = a * (1-f);                      
	let e = Math.sqrt(1 - (b/a)*(b/a));     	
	let Φ = 0;                              

	/* if (x < 160000 || x > 840000){
		//throw error: latitdue out of range
	} 
	if (y<0){
		//thtow error: longitude must not be less than zeror on ont negative
	}
	if (y>10000000){
		//throw error: longitude out of range
	} */

	let λo = 3 + 6* (zone-1) - 180;
	let e1 = (1 - Math.sqrt(1 - e*e))/(1 + Math.sqrt(1 - e*e));
	let Mo = 0;  
  M = Mo + UTMNorthing/ko;//Arc length along standard meridian. 
	if (lat < 0.00 ){
    M = Mo + (UTMNorthing - 10000000) / k;
	}
	let μ = M / (a * (1 - e_sq / 4 - (3 * e_pow4) / 64 - (5 * e_pow6) / 256 ) );
	let Φ1 = μ + e1*(3/2 - 27*e1*e1/32)*Math.sin(2*μ) + e1*e1*(21/16 -55*e1*e1/32)*Math.sin(4*μ);//Footprint Latitude
	Φ1 = Φ1 + e1*e1*e1*(Math.sin(6*μ)*151/96 + e1*Math.sin(8*μ)*1097/512);

	let N1 = a / (Math.sqrt(1 - Math.pow( e * Math.sin(Φ1), 2) ));
	let R1 =  a * (1 - e_sq) / Math.pow((1 - e_sq * Math.sin(Φ1) * Math.sin(Φ1)), 1.5);
	let D = (UTMEasting - 500000) / (N1 * ko);
	let T1 = Math.pow(Math.tan(Φ1), 2);  
	let C1 = eprime_sq * Math.pow(Math.cos(Φ1), 2 ); 

	Φ = Φ1 - (N1 * Math.tan(Φ1 / R1)) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * eprime_sq) *
		Math.pow(D, 4) ) + (61 + 90 * T1 + 298 * C1 + 45 * T1 * T1 - 252 * eprime_sq - 3 * C1 * C1) *
		(Math.pow(D, 6) / 720); 
	Φ = Math.floor(1000000 * Φ * RAD2DEG) / 1000000;
		
	let λ = (D - (Math.pow(D, 3)/ 6) * (1 + 2 * T1 + C1) + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 
		8 * eprime_sq + 24 * T1 * T1) * (Math.pow(D, 5)/120) ) / Math.cos(Φ1); 
	λ = λo + λ * RAD2DEG;
	λ =  Math.floor(1000000* λ )/1000000;

  //console.log( "Computed Lat: " + Φ + " |Computed  Long: " + λ);
}


/**  Convert each coordinate pair in the coordinate array from geodetic to Cartesian coordinate */
exports.getCartesianFromGeodetic = function getCartesianFromGeodetic(geom){
	run(geom);
	//console.log("---------------------2nd-----------------------------");
	var g2 = [
						[ [9.084317, 48.78684], [0.000000, 48.150000], [78.000000, 48.150000], [-121.000000, 48.150000] ]
					];
	run(g2);
	return geom;
}


//module.exports = exports = UTM;