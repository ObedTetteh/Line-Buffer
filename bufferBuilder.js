'use strict';
/**
 * This module is used for the construction of the line buffer based on the given distance parameter
 * Input Paramters: 1. Line(Array of coordinate pairs) or Lines as a JSON array. 
 *                  Example. 	geom = [ [[9.084317, 48.78684], [823819.4561862915, 620474.4429363784 ]], [line], [line] ]; 
 *                  i.e.      JSON array = [ [line made up of [Easting, Northing] pairs], [another line]];
 *                  2. Buffer distance in meters. e.g. const d = 5;
 * Output Paramters: ... 
 */

var BD = 50;                /** buffer distance in meters */
const  DEG2RAD = 0.01745329;
const  RAD2DEG = 57.29577951; 

 /** Top and bottom lines as arrays to which other transformed points will be added  */
//var topLineGeom = [];       
//var bottomLineGeom = [];        

function run(geom){
  console.log("---- Line buffer construction started ----");
  //console.log(geom);
  geom = filterNextNode(geom);
  console.log(geom);
  BD = 50;
  filterNextNode(geom).forEach(line => {
    /** Top and bottom lines as arrays to which other transformed points will be added  */
    var topLineGeom = [];       
    var bottomLineGeom = [];  

    for (var i = 0; i < line.length-1; i++) {
      let node1 = line[i], 
          node2 = line[i + 1];
      let currentlineSegment = [node1, node2];
      let previousLineSegment;
      if (i > 0) {
        previousLineSegment = [ line[i -1], line[i] ];
      }
/*       if (line[i][0] < line[i+1][0]){  // node with X value closer to zero if left node
        leftNode = line[i];
        rightNode = line[i + 1];
      } else if(line[i][0] > line[i+1][0]){
        leftNode = line[i + 1];
        rightNode = line[i];
      } */

      let HVstatus = isVertOrHorz(node1, node2);
      /* Process each line */
      switch (HVstatus) {
        case 0: 
          /* let BGBLines = getBGB(leftNode, rightNode);
          topLineGeom = appendLine(topLineGeom, BGBLines[0]);
          bottomLineGeom = appendLine(bottomLineGeom, BGBLines[1]); */

          let BGBLines = getBGBPerpendicular(node1, node2);
          //getAngleBetweenLines([leftNode]);
          //console.log("P: " + BGBLines[0]);
          //console.log("--------------");
          //topLineGeom = appendLine(topLineGeom, BGBLines[0]);
          
          if (i > 0) {
            let angle = getAngleBetweenlines(previousLineSegment, currentlineSegment);
            appendLine(topLineGeom, BGBLines[0], angle);
          }
          
          //console.log("B: " + topLineGeom);
          //console.log("------------------");
          //bottomLineGeom = appendLine(bottomLineGeom, BGBLines[1]);
          break;
        case 1:
          //getHorizontalBGB(leftNode, rightNode);
          break;
        case 2:
          //getverticalBGB(leftNode, rightNode);
          break;
        default:
          break;
      }
    }
    console.log("=========================================================================================");
    //console.log(topLineGeom);
    //console.log("=========================================================================================");
    //console.log(bottomLineGeom);

    //After top and bottom lines are completely constructed, Create the arcs(semi-circles) for the ends 
    //Draw Semi-circles based on the original line, using the buffer distance as the radius by creating 
    //vertices from top line to bottom(counterclockwise on the left end) and bottom to top (counterclockwise)
    //on the right side at every "a" (angle) degree interval. The larger the buffer distance the smaller the "m".
    let rightSemicircle = getSemiCircleVertices(line[line.length-1], BD, "r");
    let leftSemicircle = getSemiCircleVertices(line[0], BD, "l");
    
    topLineGeom.push(rightSemicircle);
    bottomLineGeom = bottomLineGeom.reverse();
    topLineGeom.push(bottomLineGeom);
    leftSemicircle = leftSemicircle.reverse();
    topLineGeom.push(leftSemicircle);
    topLineGeom.push(topLineGeom[0]);
    ///////check and arrange buffer polygon content and "[[]]"s
    console.log("Buffer polygon");
    //console.log(topLineGeom);

  });

}



/**
 * Returns a  Basic Buffer Geometry (BGB) (neither vertical nor horizontal) in a form of a slanted rectangle.
 * The BGB is a made up of two lines (one on either side) of the input line.
 * Note: node with X value closer to origin is considered left node during computation
 * @param LNode (array [Number, Number]): Left node of line (node closer to origin on the X axis)
 * @param RNode (array [Number, Number]: Right node of line (node farther from origin on the X axis)
 * @returns Array: An array of two lines in the following form;[[line1], [line2]]
 *                 Each line consists of only 2 points:[line] = [ [start node Easting, start node Northing], 
 *                                                                [start node Easting, start node Northing] ]
 */
function getBGBPerpendicular(LNode, RNode) {
  let LX = LNode[0];            //LX is for easting value or x value of the left node
  let LY= LNode[1];             //LY us for northing value or y value of the left node
  let RX = RNode[0];            //RX is for easting value or x value of the right node
  let RY = RNode[1];            //RN us for northing value or y value of the right node
  let angle = getRotationAngle(LX, LY, RX, RY);
  //console.log("O: " + LNode + " | " + RNode + " | " +  angle);

  let dx = RX - LX;
  let dy = RY - LY;
  let S = Math.sqrt((dx * dx) + (dy * dy));       //length of the line
  let odx = dx / S;
  let ady = dy / S;
  
  let LtopX, LtopY, LbottomX, LbottomY;
  let RtopX, RtopY, RbottomX, RbottomY;
  let topLine = [], bottomLine = [];

  if (angle < 0) {
    LtopX = LX - ady * BD;
    LtopY = LY + odx * BD;
    LbottomX = LX + ady * BD;
    LbottomY = LY - odx * BD;

    RtopX = RX - ady * BD;
    RtopY = RY + odx * BD;
    RbottomX = RX + ady * BD;
    RbottomY = RY - odx * BD;
    topLine = [[LtopX, LtopY],  [RtopX, RtopY]]; 
    bottomLine = [[LbottomX, LbottomY], [RbottomX, RbottomY]];
    //console.log("*: " + topLine);
  } else {
    LtopX = LX + ady * BD;
    LtopY = LY + odx * BD;
    LbottomX = LX - ady * BD;
    LbottomY = LY - odx * BD;

    RtopX = RX + ady * BD;
    RtopY = RY + odx * BD;
    RbottomX = RX - ady * BD;
    RbottomY = RY - odx * BD;
    topLine = [[LtopX, LtopY],  [RtopX, RtopY]]; 
    bottomLine = [[LbottomX, LbottomY], [RbottomX, RbottomY]];;
    //console.log("*: " + topLine);
    //console.log("-----------------------------------");
  }
  //console.log("Topline: " + topLine);
  //console.log("Bottomline: " + bottomLine);
  return [topLine, bottomLine];
}




/**
 * Append lineSegment the end of mainLine. LineSegment could be a straight line or an arc.
 * @param {[Number Array]} mainLine: A Line array made up of arrays of coordinates pairs[X,Y]
 *  For example MainLine = [[ 823819.4561862915, 620424.4429363784 ], [ 824226.9451537293, 621308.3183418909] ]
 * @param {[Number Array]} lineSegment: A line or arc array made up of coordinate pairs in this format
 *            [[X,Y], [X,Y]]
 */
function appendLine(mainLine, lineSegment, angle){
/*   console.log("A: " + lineSegment[0]);
  console.log("A: " + lineSegment[1]);
  console.log("A: " + lineSegment); */

  //console.log("App Main: " + mainLine);
  let lastLineStored = [];
  
  if (mainLine.length === 0) {
    console.log("Topline: " + mainLine);
    mainLine.push(lineSegment);
    //mainLine.push(lineSegment[1]);
    console.log("1: " + mainLine);
    
    //console.log("1st point found");
  } else if ( deepCompare(mainLine[mainLine.length - 1], lineSegment[0]) ){   //if last node stored is same as the left node of current line
    //store only last point
    console.log("is same: insert only last node of new line, no removal");
    mainLine.push(lineSegment[1]);
  } else{
    lastLineStored.push(mainLine[mainLine.length - 2]);
    lastLineStored.shift();
    lastLineStored.push(mainLine[mainLine.length - 1]);
    //lastIneStored =  [mainLine[mainLine.length - 2],mainLine[mainLine.length - 1]];
    console.log("@@ " + lastLineStored);
    //if angle between last line stored and current line is less than 180 deg, remove
    //1. test top
    if (angle > 180) {
      
      console.log("Angle greater than 180...");
      //1. Maintain last node stored
      //2. Add start and end nodes of the current line to the main buffer line  for now
      mainLine.push(lineSegment[0]);
      mainLine.push(lineSegment[1]);
      //3. Later::: Calculate the angle between last node stored and the first node of the current line, then construct an arc between them

    } else if (angle < 180) {
      console.log("Angle less 180");
      console.log("Last line stored: " + lastLineStored);
      console.log("Curr line segmen: " + lineSegment);
      //1. check if the previous line stored and the current line intersect.
      //if yes, they intersect, calculate the intersection point, remove last node stored and insert the intersection point and insert the last node
      // of the current line
      let intersection = linesIntersect(lastLineStored, lineSegment);
      if ( intersection[0]) {  //if lines intersect
        console.log("line instersect: remove old point and insert only intersection point and right node");
        mainLine.pop();
        mainLine.push(intersection[1]);
        mainLine.push(lineSegment[1]);
      }

      //2. if they dont intersect, check if the length of the current line longer the previous line
      //if current is longer, check for the intersection of the line border line and the previous line stored

    }
    /* lastLineStored = [mainLine[mainLine.length - 2], mainLine[mainLine.length - 1]];
    console.log("last Line stored: " + lastLineStored);
    let intersection = linesIntersect(lastLineStored, lineSegment);
    if ( intersection[0]) {  //if lines intersect
      console.log("line instersect: remove old point and insert only intersection point and right node");
      mainLine.pop();
      mainLine.push(intersection[1]);
      mainLine.push(lineSegment[1]);
    }else{
      console.log("do not intersect: insert both first and last node of new line. no remove")
      mainLine.push(lineSegment[0]);
      mainLine.push(lineSegment[1]);
    } */
  }
  console.log("Topline: " + mainLine);
  console.log("---");
  return mainLine;
}

function getAngleBetweenlines(line1, line2){
  //format of line [0:[x, y], 1:[x, y]]
  let line1Dx = line1[0][0] - line1[1][0];
  let line1Dy = line1[0][1] - line1[1][1];
  let line2Dx = line2[1][0] - line2[0][0];
  let line2Dy = line2[1][1] - line2[0][1];

  let angle1 = Math.atan2(line1Dy, line1Dx);
  let angle2 = Math.atan2(line2Dy, line2Dx);
  //console.log("Previous Line: " + line1);
  //console.log("Current Line : " + line2);
  //console.log("line1Dx: " + line1Dx + " | line1Dy: " + line1Dy + " | Angle1: " + (angle1 * RAD2DEG)) ;
  //console.log("line2Dx: " + line2Dx + " | line2Dy: " + line2Dy + " | ANgle2: " + (angle2 * RAD2DEG)) ;
  let angle = Math.abs(angle1 - angle2) * RAD2DEG;
  //console.log("Angle between lines: " + angle);
  return angle;
}

/**
 * Returns a  Basic Buffer Geometry (BGB) (neither vertical nor horizontal) in a form of a slanted rectangle.
 * The BGB is a made up of two lines (one on either side) of the input line.
 * Note: node with X value closer to origin is considered left node during computation
 * @param LNode (array [Number, Number]): Left node of line (node closer to origin on the X axis)
 * @param RNode (array [Number, Number]: Right node of line (node farther from origin on the X axis)
 * @returns Array: An array of two lines in the following form;[[line1], [line2]]
 *                 Each line consists of only 2 points:[line] = [ [start node Easting, start node Northing], 
 *                                                                [start node Easting, start node Northing] ]
 */
function getBGB(LNode, RNode){
  let LX = LNode[0];            //LX is for easting value or x value of the left node
  let LY= LNode[1];             //LY us for northing value or y value of the left node
  let RX = RNode[0];            //RX is for easting value or x value of the right node
  let RY = RNode[1];            //RN us for northing value or y value of the right node
  let angle = getRotationAngle(LX, LY, RX, RY);
  
  let RR = rotateRNodeAroundLNode(LNode, RNode, angle);          //RR: Rotated Right Node
  let RRX = RR[0];       //rotated point x coord
  let RRY = RR[1];       //rotated point x coord

  let horzBGB = getHorizontalBGB([LX, LY], [RRX, RRY]);
  let topLine = horzBGB[0];
  let bottomLine = horzBGB[1];

  //Reverse(negate angle) rotate each line's Right node around its left node by the previouse angle or rotation.
  let topLineRR = rotateRNodeAroundLNode(topLine[0], topLine[1], -angle);
  let bottomLineRR = rotateRNodeAroundLNode(bottomLine[0], bottomLine[1], -angle);
  topLine[1] = topLineRR;
  bottomLine[1] = bottomLineRR;

  return [topLine, bottomLine];
}

/**
 * Returns a horizontal Basic Buffer Geometry (BGB) in a form of a rectangle.
 * The BGB is a made up of two lines (one on the top and the other on the bottom) of the input line.
 * @param start (array [Number, Number]): Starting coordinate of line
 * @param end (array [Number, Number]: Ending coordinate of the point
 * @returns Array: An array of two lines in the following form;[[line1], [line2]]
 *                 Each line consists of only 2 points:[line] = [ [left X coordinate, left Ycoord], 
 *                                                                [right X coord, right Ycoord] ]
 */
function getHorizontalBGB(LNode, RNode){
  let LX = LNode[0];            //LX is for easting value or x value of the left node
  let LY= LNode[1];             //LY us for northing value or y value of the left node
  let RX = RNode[0];            //RX is for easting value or x value of the right node
  let RY = RNode[1];            //RN us for northing value or y value of the right node

  //console.log("lx: " + LX + " | rx: " + RX);
  let topLine = [ [LX, LY + BD], [ RX, RY + BD] ];
  let bottomLine = [ [LX, LY - BD], [ RX, RY - BD] ];

  return [topLine, bottomLine];
}

/**
 * Returns a vertical Basic Buffer Geometry (BGB) in a form of a rectangle.
 * The BGB is a made up of two lines (one on the left and the other on the right) of the input line.
 * @param start (array [Number, Number]): Starting coordinate of line
 * @param end (array [Number, Number]: Ending coordinate of the point
 * @returns Array: An array of two lines in the following form;[[line1], [line2]]
 *                 Each line consists of only 2 points:[line] = [ [start X coordinate, start Ycoord], 
 *                                                                [start X coord, start Ycoord] ]
 */
function getverticalBGB(startCoordinate, endCoordinate){
  let startE = start[0];
  let startN = start[1];
  let endE = end[0];
  let endN = end[1];

  let rightLine = [ [startE + BD, startN], [ endE + BD, endN] ];
  let leftLine = [ [startE - BD, startN], [ endE - BD, endN] ];

  return [topLine, bottomLine];
}

/**
 * Builds a semicircle using the point of origin and the radius value for the side(Left or Right) of the line provided
 * @param {[Number Array]} originPoint: [X, Y] coordinate representing the origin or point about which to rotate 
 * @param {Number} radius : radius in meters
 * @param {String} side: "l" or "l", where "L" means Left side and "R" means right side of the line
 * @returns {[Number Array]}: An arc of [X,Y] coordinate pairs 
 */
function getSemiCircleVertices(originPoint, radius, side) {
  let arc = [];

  if (side.length == 1 && (side.toLowerCase() == 'l' | side.toLowerCase() == 'r')) {
    let topPointX = originPoint[0];
    let topPointY = originPoint[1] + radius;

    if (side.toLowerCase() == 'r') { //clockwise rotation on the right from bottom to top
      for (let a = 10; a < 179; a += 10) {   //Rotate at every 10 degrees
        arc.push(rotateRNodeAroundLNode( originPoint, [topPointX, topPointY], (-a * DEG2RAD)) );
      }  
    /* console.log("Right arc ===========");  
      console.log(arc);  */
    }
    if (side.toLowerCase() == 'l') {//counter clockwise rotation
      for (let a = 10; a < 179; a += 10) {   //Rotate at every 10 degrees
        arc.push(rotateRNodeAroundLNode( originPoint, [topPointX, topPointY], (a * DEG2RAD)) );
      }  
    /* console.log("Left arc ===========");   
      console.log(arc);  */
    }
  } else {
    console.log("Invalid side input, side must be 'r' or 'l' ");
  }
  return arc;
}

/** 
 * Get angle for which line should be rotated in order to form a purely horizontal line
 * Note: node with X value closer to origin is considered left node during computation
 * @param LX, LY (Number, Number): Left node X and Y values
 * @param RX, RY (Number, Number): Right node X and Y values
 * @returns {Number}: -/+ Angle in radians; positive angle for counterclockwise and negative angle for 
 *              clockwise rotation of the right node about the left node.
 */
function getRotationAngle(LX, LY, RX, RY){
  let angle = 0;
  angle = Math.atan( Math.abs((LY - RY) / (LX - RX) ));
  if (LY < RY) {       //for clockwise rotation
    angle *= -1; 
  } 
  //console.log("Angle : " + angle * RAD2DEG);
  return angle;
}

/** 
 * Filter nodes or coordinates to ensure that each next point should be different from previous.
 * If preceding and subsequent points are the same, delete one of them from geom
 * @param {Number Array of Number Array}: An array that contains the geometry coordinates 
 *        as [[Easting, Northing],[Easting, Northing]]
 * @returns {NUmber Array}: An array of filtered geometries 
 */
function filterNextNode(geom){
  console.log(" -------- Filtering ----------");
  geom.forEach(line => {
    for (var i = 0; i < line.length-1; i++) {
			var startCoordinate = line[i];			
      var endCoordinate = line[i + 1];
      if (deepCompare(startCoordinate, endCoordinate)) {
        line.splice(i + 1, 1);
      }
    }
  });
  return geom;
}
 
/** 
 * Check if the two lines intersect
 * @param line1 {[Number, Number], [Number, Number]}: Left Node [Easting, Northing] coordinates 
 * @param line2 {[Number, Number], [Number, Number]}: Right Node [Easting, Northing] coordinates 
 * @returns {Boolean, [X, Y]}: True and the intersection point if the lines intersect, 
 *  else return false and undefined.
 */
function linesIntersect(prev, curr){
  console.log("prev: " + prev);
  let status = false;
  let x1 = curr[0][0], y1 = curr[0][1], x2 = curr[1][0], y2 = curr[1][1];
  //let x3 = prev[0][0], y3 = prev[0][1], x4 = prev[1][0], y4 = prev[1][1];
  let x3 = prev[0][0], y3 = prev[0][1], x4 = prev[0][2], y4 = prev[0][3];
  console.log("y4: " + y4);
  let t = ( (x1-x3)*(y3-y4) - (y1-y3)*(x3-x4) ) /
          ( (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4) ) ;
  console.log("t: " + t);
  if (t >= 0.0 && t <= 1.0) {
    status = true;
    console.log("t: " + t);
  }
  let X = 0.23333333333, Y = 0.2444444444;
  console.log(" status: " + status);
  return [status, [X,Y]];
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
 * Compare two arrays to check if they have the same content in the same order. 
 * @param {Number Array}: First Array as [Easting, Northing]
 * @param {Number Array}: Second Array as [Easting, Northing]
 * @returns {Boolean}: True if contents are same in same order
 */
function deepCompare(first, second){
  let status = true;
  if (first.length === second.length) {
    for (let i = 0; i < first.length; i++) {
      if (first[i] !== second[i]) {
        status = false;
        break;
      }
    }
  } 
  return status;
}

/** Step 1: Check if the line is purely horizontal or purely vertical
 * ------------------------------------------------------------------
 * @param start (array [Number, Number]): Starting coordinate of line
 * @param end (array [Number, Number]: Ending coordinate of the point
 * @returns number: 0(zero) - if line is neither vertical nor horizontal
                    1(one) - for purely horizontal 
                    2(two) - for purely vertical
 */
function isVertOrHorz(startCoordinate, endCoordinate){  
  let status;
  var startE = startCoordinate[0];
  var startN = startCoordinate[1];
  var endE = endCoordinate[0];
  var endN = endCoordinate[1];
  //console.log("startE: " + startE + " | endE: " + endE);
  //console.log("startN: " + startN + " | endN: " + endN);
  if (startN === endN) {     /* if line is purely horizontal */
    status = 1;
  }else  
  if (startE === endE) {     /* if line is purely vertical */
    status = 2;
  } else {
    status = 0;
  }
  return status;
}

 /**  Get line buffer
  *   The coordinates of the line must be in UTM coordinates or similar easting and noerthing values
  *   Easting and northing values must not have negatives
  */
exports.getLineBuffer = function getLineBuffer(geom){
	run(geom);
};