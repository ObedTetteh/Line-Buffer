/**
*   Author: Obed A. Tetteh
*   Name: compute UTM Zone
*   Language: Javascript/ Node.js
*   Version: 1.0.0
*   Objective: provides methods for the processing of geodetic coordinates
*
*/

const  DEG2RAD = 0.01745329;
const  RAD2DEG = 57.29577951

  /**
  *   Converts degrees to radian
  *   @param: (number) value in degree
  *   @returns: (number) value in radians
  */
  exports.degToRad = function degToRad(degree){
    rad = (Math.PI * degree) / 180;
    return rad;
  }
  

  /**
  *   Get the UTM Zone from the longitude
  *   @param: (number Array) [longitude, latitude]
  *   @returns: (number) value in radians
  */

  exports.getZone = function getZone(coordArr) {
    var zone;
    var lon = coordArr[0];
    var lat = coordArr[1];
    
    zone = Math.floor((lon + 180)/6) + 1;
    if (lat >= 56.0 && lat < 64.0 && lon >= 3.0 && lon < 12.0) {
      zone = 32;
    }
    //special zones
    if (lat >= 72.0 && lat < 84.0) {
      if (lon >= 0.0 && lon < 9.0) {
        zone = 31;
      } else if (lon >= 9.0 && lon < 21.0) {
        zone = 33;
      } else if (lon >= 21.0 && lon < 33.0) {
        zone = 35;
      } else if (lon >= 33.0 && lon < 42.0) {
        zone = 37;
      }    
    }
    return zone;
  }
  

  /**
  *   Computes the central meridan of each zone. 
  *   if the longitude lies on the UTM zone boundary, then the user must choose the desired UTM zone
  *   @param: (number) UTM zone 
  *   @returns: (number) Central meridian(longitide) of the zone in radians
  */

 exports.getZoneCentralMeridian = function getZoneCentralMeridian(zone){
    var centMeridian;
    centMeridian = (zone - 1) * 6 - 180 + 3;
    return centMeridian * DEG2RAD;
  }

