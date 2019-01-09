/**
*   Author: Obed A. Tetteh
*   Name: compute UTM Zone
*   Language: Javascript/ Node.js
*   Version: 1.0.0
*   Objective: compute the Tranverse Mercator (not UTM) X and Y values
*
*/

var util = require('./UTMUtils');

const a = 6378206.4 ;  //equatorial Radius of the ellipsoid in meters
const b = 6356583.8;   //semi minor exes of the reference ellipsoid
//const e = Math.E;     //eccentricity of the ellipsoid


var lon = -122.42434915523498;
var lat = 37.81044466028829 ; 
var lonRad = util.degToRad(lon);
var latRad = util.degToRad(lat);
var coordArr = [ -122.42434915523498, 37.81044466028829 ];
var latRad;

//e squared
function e_sq(){
  var a2 = Math.pow(a, 2);
  var b2 = Math.pow(b, 2);
  var result = (a2 - b2) / a2;
  return result;
}

var e2 = e_sq();
var e4 = Math.pow(e2, 2);
var e6 = Math.pow(Math.sqrt(e2), 6);
var e8 = Math.pow(e2, 3);


/**
 * Stands for 
 * Difference between the reference longitude and the central meridian in rad 
 */
function A_(){
	var zone = util.getZone(coordArr);
	var centMer = util.getZoneCentralMeridian(zone);
	var lonr = util.degToRad(lon);
	var a = lonr - centMer;
	//console.log("zone: " + zone + " Central mer: " + centMer + " lonrad: " + lonr);
	return a;
}

function cosLat(){
	return Math.cos(latRad);
}

function tanLat(){
	return Math.tan(latRad);
}

function sinLat(){
	return Math.sin(latRad);
}
/**
 * N is radius  of curvature of the reference ellipsoid in the prime vertical plane
 *
 * @param lat: latitude in degrees
 * @return N 
 */
/*function N(){
  var lr = util.degToRad(lat);
  var sin2 = Math.pow(sinLat(), 2);
  var e2 = e_sq();
  var denom = Math.sqrt(1 - e2 * sin2);
  var n = a / denom;
  console.log( "*** N: " + n);
  return n;
} 
*/

function ebar2(){
	var e2 = e_sq();
	var e_2 = e2 / (1 - e2);
	return e_2;
}

function G(){
	var ebar = Math.sqrt(ebar2());
	var g = ebar * cosLat();
	return g;
}

//ElliRadius function stands for "N" in the equation
function N_(){
	  var sin2 = Math.pow(sinLat(), 2);
	  var e2 = e_sq();
	  var denom = Math.sqrt(1 - e2 * sin2);
	  var n = a / denom;
	  //console.log( "*** N: " + n);
	  return n;
}

function xSegment1(){
	var N = N_();
	var A = A_();
	var cl = cosLat();
	var s1 = N * A * cl;
	//console.log("Segmnt 1 : " + s1);
	return s1;
}


function xSegment2(){
	var N = N_();
	var Apow3 = Math.pow(A_(), 3);
	var cl3 = Math.pow(cosLat(), 3);
	var g2 = Math.pow(G(), 2);
	var t2 = Math.pow(tanLat(), 2);
	var s2 = ((N * Apow3 * cl3 ) / 6 ) + (1 - t2 + g2);
	//console.log("Segment 2: " + s2);
	return s2;
}

function xSegment3(){
	var N = N_();
	var Apow5 = Math.pow(A_(), 5);
	var cl5 = Math.pow(cosLat(), 5);
	var part1 = (N * Apow5 * cl5) / 120;
	var t2 = Math.pow(tanLat(), 2);
	var t4 = Math.pow(tanLat(), 4);
	var g2 = Math.pow(G(), 2);
	var part2 = (5 - 18*t2 + t4 + 14*g2 - 58*t2*g2);
	var s3 = part1 * part2;
	//console.log("Segment 3: " + s3);
	return s3;
}


//solving for Ytm
//Solving for Slat or Sphi which is segment 1 of the Ytm coordinate
function S_phi(){
	var A0 = 1 - (1/4)*e2 - (3/64)*e4 - (5/256)*e6 - (175/16384)*e8;
	var A2 = (37/8) * (e2 + (1/4)*e4 + (15/128)*e6 -(455/4096)*e8 );
	var A4 = (15/256) * (e4 + (3/4)*e6 - (77/128)*e8 );
	var A6 = (35/3072) * (e6 - (41/32)*e8 );
	var A8 = -(315/131072) * e8;
	var sin2 = Math.pow(sinLat(), 2);
	var sin4 = Math.pow(sinLat(), 4);
	var sin6 = Math.pow(sinLat(), 6);
	var sin8 = Math.pow(sinLat(), 8);
	return (a * (A0*latRad - A2*sin2 + A4*sin4 - A6*sin6 + A8*sin8));
}

function ySegment2(){
	var N = N_();
	var A2 = Math.pow(A_(), 2);
	var sin = sinLat();
	var cos = cosLat();
	return (N * A2)/2 * sin * cos;
}

function ySegment3(){
	var N = N_();
	var A4 = Math.pow(A_(), 4);
	var sin = sinLat();
	var cos3 = Math.pow(cosLat(), 3);
	var t2 = Math.pow(tanLat(), 2);
	var g2 = Math.pow(G(), 2);
	var g4 = Math.pow(G(), 4);
	return (N * A4)/24 * sin * cos3 * (5 - t2 + 9*g2 + 4*g4);
}

function ySegment4(){
	var N = N_();
	var A6 = Math.pow(A_(), 6);
	var sin = sinLat();
	var cos5 = Math.pow(cosLat(), 5);
	var t2 = Math.pow(tanLat(), 2);
	var t4 = Math.pow(tanLat(), 4);
	var g2 = Math.pow(G(), 2);
	return (N * A6)/720 * sin * cos5 * (61 - 58*t2 + t4 + 270*g2 - 330*t2*g2);
}
//Y Transverse Mercator coordinate
function Ytm(){
	return S_phi() + ySegment2() + ySegment3() + ySegment4();
}
//Y Transverse Mercator coordinate
function Xtm(){
	return xSegment1() + xSegment2() + xSegment3();
}

//Y Transverse Mercator coordinate
function Yutm(){
	var y;
	if (lat < 0) {
		y = 0.9996 * Ytm() + 10000000;
	} else {
		y = 0.9996 * Ytm();
	}
	return y;
}

//Y Transverse Mercator coordinate
function Xutm(){
	return 0.9996 * Xtm() + 500000;
}

function getXTMFromUTM(utm){
	return (1 / 0.9996) * (utm - 50000);
}

function getYTMFromUTM(utm){
	var tm;
	if (lat < 0) {
		tm = (1 / 0.9996) * (utm - 10000000);
	} else {
		tm = (1 / 0.9996) * utm;
	}
	return tm;
}

function S_phi(phi){
	var A0 = 1 - (1/4)*e2 - (3/64)*e4 - (5/256)*e6 - (175/16384)*e8;
	var A2 = (37/8) * (e2 + (1/4)*e4 + (15/128)*e6 -(455/4096)*e8 );
	var A4 = (15/256) * (e4 + (3/4)*e6 - (77/128)*e8 );
	var A6 = (35/3072) * (e6 - (41/32)*e8 );
	var A8 = -(315/131072) * e8;
	var sin2 = Math.pow(sinLat(), 2);
	var sin4 = Math.pow(sinLat(), 4);
	var sin6 = Math.pow(sinLat(), 6);
	var sin8 = Math.pow(sinLat(), 8);
	return (a * (A0*latRad - A2*sin2 + A4*sin4 - A6*sin6 + A8*sin8));
} 

function footprintLatitude(ytm){
	var phi = 0;
	for (var i = 0; i < 3; i++) {
		if (phi == 0) {
			phi = tm / a;
		}
		//Sphi = 
	}
	
	var phi = ytm / a;
	var Sphi = S_phi();
	//var A0 = 
	//var SbarPhi = 
}

(function () {
	console.log("Started!!");
	console.log("Xtm: " + Xutm());
	console.log("Ytm: " + Yutm());
})();


  /**
  *   Compute X value for Transverse Mercator Projection.
  *   Formula is broken into five segments (seg1, seg2, ..., seg5), each computed separately
  *   @param: (number) 
  *   @returns: (number) 
  */
 exports.getX_TM = function getX_TM(){

}

exports.getY_TM = function getY_TM(degree){
  return rad;
}
