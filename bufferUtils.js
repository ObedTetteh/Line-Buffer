var math = require('mathjs');
const  DEG2RAD = 0.01745329;
const  RAD2DEG = 57.29577951; 
var direction = 0;

/** 
 * Check if the two lines intersect
 * @param line1 {[Number, Number], [Number, Number]}: Left Node [Easting, Northing] coordinates 
 * @param line2 {[Number, Number], [Number, Number]}: Right Node [Easting, Northing] coordinates 
 * @returns {Boolean, [X, Y]}: True and the intersection point if the lines intersect, 
 *  else return false and undefined.
 */

exports.linesIntersect = function linesIntersect(prev, curr){
  console.log(">>> Intersection...");
  console.log("prev: ", prev);
  console.log("curr: ", curr);
  let status = false;
  let intersection  = null;
  let x1 = curr[0][0], y1 = curr[0][1], x2 = curr[1][0], y2 = curr[1][1];
  let x3 = prev[0][0], y3 = prev[0][1], x4 = prev[1][0], y4 = prev[1][1];

  //let intersection  = math.intersect([x1, y1], [x2, y2], [x3, y3], [x4, y4]);
  
  //console.log("intersection", intersection);
  //console.log([x1, y1], [x2, y2], [x3, y3], [x4, y4]);
  let t = ( (x1-x3)*(y3-y4) - (y1-y3)*(x3-x4) ) /
          ( (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4) ) ;
  if (t >= 0.0 && t <= 1.0) {
    status = true;
    intersection = math.intersect([x1, y1], [x2, y2], [x3, y3], [x4, y4]);
    console.log("t: " + t);
  }
  console.log(" status: " + status);

  return intersection;
}


/**
 * Builds a semicircle using the point of origin and the radius value for the side(Left or Right) of the line provided
 * @param {[Number Array]} originPoint: [X, Y] coordinate representing the origin or point about which to rotate 
 * @param {Number} radius : radius in meters
 * @param {String} side: "l" or "l", where "L" means Left side and "R" means right side of the line
 * @returns {[Number Array]}: An arc of [X,Y] coordinate pairs 
 */
exports.getSemiCircleVertices = function getSemiCircleVertices(originPoint, rotationPoint) {
  let arc = [];
  //always rotate anticlockwise.
  //Right node: Rotate from bottom to top
  //left side: Rotate from top to bottom
  rotationPointX = rotationPoint[0];
  rotationPointY = rotationPoint[1];

  for (let angle = 10; angle < 179; angle += 10) {   //Rotate at every 10 degrees counterclockwise
    arc.push(rotateRNodeAroundLNode( originPoint, rotationPoint, (angle * DEG2RAD)) );
  } 

  return arc;
}

/**
 * Rotate the Right node about the left node either clockwise or counter clockwise based on the given angle to form a horizontal line. 
 * Line must have exactly two points.
 * @param LNode (array [Number, Number]): Left node of line (node closer to origin on the X axis)
 * @param RNode (array [Number, Number]: Right node of line (node farther from origin on the X axis)
 * @param angle {NUmber}: Angle of rotation in radians
 * @returns {Number Array}: the coordinate [X, Y] of the right node after it has been rotated.
 */
function rotateRNodeAroundLNode(LNode, RNode, angle){
  let LX = LNode[0];            //LX is for easting value or x value of the left node
  let LY= LNode[1];             //LY us for northing value or y value of the left node
  let RX = RNode[0];            //RX is for easting value or x value of the right node
  let RY = RNode[1];            //RN us for northing value or y value of the right node
  let cosa = Math.cos(angle);
  let sina = Math.sin(angle);
  let rx = RX - LX;
  let ry = RY - LY;
  let RX_Rotated = (rx * cosa - ry * sina) + LX;
  let RY_rotated = (ry * cosa + rx * sina) + LY;

  return [RX_Rotated, RY_rotated];
}


/** 
 * Get angle for which line should be rotated in order to form a purely horizontal line
 * Note: node with X value closer to origin is considered left node during computation
 * @param LX, LY (Number, Number): Left node X and Y values
 * @param RX, RY (Number, Number): Right node X and Y values
 * @returns {Number}: -/+ Angle in radians; positive angle for counterclockwise and negative angle for 
 *              clockwise rotation of the right node about the left node.
 */
exports.getRotationAngle = function getRotationAngle(LX, LY, RX, RY){
  let angle = 0;
  //angle = Math.atan( Math.abs((LY - RY) / (LX - RX) ));
  angle = Math.atan( (LY - RY) / (LX - RX) ) * RAD2DEG;
  if (LY < RY) {  
    angle *= -1; 
  }  
  return angle;
}

exports.getAngleFromHorizontalAxis = function getAngleFromHorizontalAxis(LX, LY, RX, RY){
  let dx = RX - LX;
  let dy = RY - LY;
  let angle = Math.atan2(dy, dx) * RAD2DEG;
  return angle;
}


exports.swapNodes = function swapNodes(node1, node2){
  if (node2[0] < node1[0]) {   
    return [node2, node1];
  } else {
    return [node1, node2];
  }

}

/* 
*   function: extract the geomtry object coordinates as a json object
*   input: document(s) extracted from mongodb
*   output: returns a geom(set of coordinatwes) object
*/
exports.getGeomFromDoc =  function getGeomFromDoc(documents){
  let linesArray;
  let stringified = JSON.stringify(documents);
  stringified = stringified.slice(1, -1);
  let jsoned = JSON.parse(stringified);
  let type = jsoned.geometry.type;

  if (type === "MultiLine"  || type === "Line" || type === "MultiLineString") {
    linesArray = jsoned.geometry.coordinates;
  } else{
    linesArray = false;
  }
  return linesArray;
}

/* 
*   function: extract the geomtry object coordinates as a json object
*   input: document(s) extracted from mongodb
*   output: returns a geom(set of coordinatwes) object
*/
exports.getGeom =  function getGeom(documents){
  let linesArray;
  let stringified = JSON.stringify(documents);
  //stringified = stringified.slice(1, -1);
  let jsoned = JSON.parse(stringified);


  return jsoned.geometry.coordinates;
}

