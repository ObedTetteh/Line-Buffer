'use strict';
/**
 * This module is used for the construction of the line buffer based on the given distance parameter
 * Input Paramters: 1. Line(Array of coordinate pairs) or Lines as a JSON array. 
 *                  Example. 	geom = [ [[9.084317, 48.78684], [823819.4561862915, 620474.4429363784 ]], [line], [line] ]; 
 *                  i.e.      JSON array = [ [line made up of [Easting, Northing] pairs], [another line]];
 *                  2. Buffer distance in meters. e.g. const d = 5;
 * Output Paramters: ... 
 */
var bufferUtils = require('./bufferUtils');
 var math = require('mathjs');
var BD = 50;                /** buffer distance in meters */
const  DEG2RAD = 0.01745329;
const  RAD2DEG = 57.29577951; 
var direction = 0;

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
    var leftLineGeom = [];       
    var rightLineGeom = [];  

    for (var i = 0; i < line.length-1; i++) {
      let node1 = line[i], 
          node2 = line[i + 1];
      let currentLineSegment = [node1, node2];
      let previousLineSegment;
      if (i > 0) {
        previousLineSegment = [ line[i - 1], line[i] ];
      }

      let orienationStatus = isVertOrHorz(node1, node2);
      /* Process each line */
      switch (orienationStatus) {
        case +0: 
          let bgb = getBGBPerp(node1, node2);
          
          if (i > 0) {
            let angle = getAngleBetweenlines(previousLineSegment, currentLineSegment);
            //appendLine(leftLineGeom, rightLineGeom,  BGBLines, angle);
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
    
    leftLineGeom.push(rightSemicircle); 
    rightLineGeom = rightLineGeom.reverse();
    leftLineGeom.push(rightLineGeom);
    leftSemicircle = leftSemicircle.reverse();
    leftLineGeom.push(leftSemicircle);
    leftLineGeom.push(leftLineGeom[0]);
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
 * @returns Array: An array of two lines in the following form;[ [line1], [line2] ]
 *                 Each line consists of only 2 points:[line] = [ [start node Easting, start node Northing], 
 *                                                                [start node Easting, start node Northing] ]
 */
function getBGBPerpendicular(node1, node2) {   //node1 then node2 in the direction of the growth of the line
  let x1 = node1[0];            //LX is for easting value or x value of the left node
  let y1= node1[1];             //LY us for northing value or y value of the left node
  let x2 = node2[0];            //RX is for easting value or x value of the right node
  let y2 = node2[1];            //RN us for northing value or y value of the right node
  let angle = getRotationAngle(x1, y1, x2, y2);
  //console.log("O: " + LNode + " | " + RNode + " | " +  angle);

  let dx = x2 - x1;
  let dy = y2 - y1;
  let S = Math.sqrt((dx * dx) + (dy * dy));       //length of the line
  let odx = dx / S;
  let ady = dy / S;
  
  let LtopX, LtopY, LbottomX, LbottomY;
  let RtopX, RtopY, RbottomX, RbottomY;
  let topLine = [], bottomLine = [];

  if (angle < 0) {
    LtopX = x1 - ady * BD;
    LtopY = y1 + odx * BD;
    LbottomX = x1 + ady * BD;
    LbottomY = y1 - odx * BD;

    RtopX = x2 - ady * BD;
    RtopY = y2 + odx * BD;
    RbottomX = x2 + ady * BD;
    RbottomY = y2 - odx * BD;
    topLine = [[LtopX, LtopY],  [RtopX, RtopY]]; 
    bottomLine = [[LbottomX, LbottomY], [RbottomX, RbottomY]];
    //console.log("*: " + topLine);
  } else {
    LtopX = x1 + ady * BD;
    LtopY = y1 + odx * BD;
    LbottomX = x2 - ady * BD;
    LbottomY = y2 - odx * BD;

    RtopX = x2 + ady * BD;
    RtopY = y2 + odx * BD;
    RbottomX = x2 - ady * BD;
    RbottomY = y2 - odx * BD;
    topLine = [[LtopX, LtopY],  [RtopX, RtopY]]; 
    bottomLine = [[LbottomX, LbottomY], [RbottomX, RbottomY]];;
    //console.log("*: " + topLine);
    //console.log("-----------------------------------");
  }
  //console.log("Topline: " + topLine);
  //console.log("Bottomline: " + bottomLine);
  return [topLine, bottomLine];
}


function getBGBPerp(startNode, endNode) {   //node1 then node2 in the direction of the growth of the line
  let startX = startNode[0];            //LX is for easting value or x value of the left node
  let startY = startNode[1];             //LY us for northing value or y value of the left node
  let endX = endNode[0];            //RX is for easting value or x value of the right node
  let endY = endNode[1];            //RN us for northing value or y value of the right node

  if (endX < startX) {    //if line direction or movement is toward origin on the x axis
    let tempEndX = endX, tempEndy = endY;
    endX = startX;
    endY = startY;
    startX = tempEndX;
    startY = tempEndy;
  }
  let angle = getRotationAngle(startX, startY, endX, endY);
  //console.log("O: " + LNode + " | " + RNode + " | " +  angle);

  let dx = endX - startX;
  let dy = endY - startY;
  let S = Math.sqrt((dx * dx) + (dy * dy));       //length of the line
  let odx = dx / S;
  let ady = dy / S;

  let leftLine, rightLine;

  let LtopX, LtopY, LbottomX, LbottomY;
  let RtopX, RtopY, RbottomX, RbottomY;
  let topLine = [], bottomLine = [];

  if (angle < 0) {
    LtopX = startX - ady * BD;
    LtopY = startY + odx * BD;
    LbottomX = startX + ady * BD;
    LbottomY = startY - odx * BD;

    RtopX = endX - ady * BD;
    RtopY = endY + odx * BD;
    RbottomX = endX + ady * BD;
    RbottomY = endY - odx * BD;
    topLine = [[LtopX, LtopY],  [RtopX, RtopY]]; 
    bottomLine = [[LbottomX, LbottomY], [RbottomX, RbottomY]];
    //console.log("*: " + topLine);
  } else {
    LtopX = startX + ady * BD;
    LtopY = startY + odx * BD;
    LbottomX = startX - ady * BD;
    LbottomY = startY - odx * BD;

    RtopX = endX + ady * BD;
    RtopY = endY + odx * BD;
    RbottomX = endX - ady * BD;
    RbottomY = endY - odx * BD;
    
    //console.log("*: " + topLine);
    //console.log("-----------------------------------");
  }
  topLine = [[LtopX, LtopY],  [RtopX, RtopY]]; 
  bottomLine = [[LbottomX, LbottomY], [RbottomX, RbottomY]];

  if (endX < startX) {
    leftLine = bottomLine;
    rightLine = topLine;
  } else {
    leftLine = topLine;
    rightLine = bottomLine;
  }

  let bgbMerged = getBGBMergedWithArcs(startNode, endNode, leftLine, rightLine);

  //console.log("Topline: " + topLine);
  //console.log("Bottomline: " + bottomLine);
  return bgbMerged;
}


function getBGBMergedWithArcs(mainLineNode1, mainLineNode2, leftBGBLine, rightBGBLine){
  let leftArc, rightArc;
  let leftOriginNode, rightOriginNode;
  let leftEndRotationPoint, rightEndRotationPoint;
  let mergedBGBarcsnLines;
  let leftBGBLeftNode, leftBGBRightNode;
  let rightBGBLeftNode, rightBGBRightNode;

  let drxn = "lr";
  if (mainLineNode1[0] < mainLineNode2[0]) {
    leftOriginNode = mainLineNode1;
    rightOriginNode = mainLineNode2;
    rightEndRotationPoint = rightBGBLine[1];
    leftEndRotationPoint = leftBGBLine[0];
  } else {
    leftOriginNode = mainLineNode2;
    rightOriginNode = mainLineNode1;
    rightEndRotationPoint = rightBGBLine[0];
    leftEndRotationPoint = leftBGBLine[1];
    drxn = "rl";
  }

  leftArc = bufferUtils.getSemiCircleVertices(leftOriginNode, leftEndRotationPoint);
  rightArc = bufferUtils.getSemiCircleVertices(rightOriginNode, rightEndRotationPoint);
  mergedBGBarcsnLines = combineArcsnBGB(leftArc, rightArc, leftBGBLine, rightBGBLine, drxn);

  return mergedBGBarcsnLines;


/*   let leftBGBLineNode1X = leftBGBLine[0][0];
  let leftBGBLineNode2X = leftBGBLine[1][0];

  let rightBGBLineNode1X = rightBGBLine[0][0];
  let rightBGBLineNode2X = rightBGBLine[1][0];

  if (leftBGBLineNode1X < leftBGBLineNode2X) {
    leftBGBLeftNode = leftBGBLineNode1X;
    leftBGBRightnode = leftBGBLineNode2X;
  } else {
    leftBGBLeftNode = leftBGBLineNode2X;
    leftBGBRightNode = leftBGBLineNode1X;
  }

  if (rightBGBLineNode1X < rightBGBLineNode2X ) {
    rightBGBLeftNode = rightBGBLineNode1X;
    rightBGBRightNode = rightBGBLineNode2X;
  } else {
    rightBGBLeftNode = rightBGBLineNode2X;
    rightBGBRightNode = rightBGBLineNode1X;
  } */

}

function combineArcsnBGB(leftArc, rightArc, leftBGBLine, rightBGBLine, drxn){
  let bgb = [];
  if (drxn === "lr") {

    bgb = insert(bgb, leftBGBLine);
    bgb = insert(bgb, rightArc);
    bgb = insert(bgb, rightBGBLine);
    bgb = insert(bgb, leftArc);
    bgb.push(leftBGBLine[0]);     //1st and last coordinate of a polygon must be same

    //bgb.push(leftBGBLine, rightArc, rightBGBLine, leftArc);
    console.log("Final bgb: ", bgb);
    console.log("------------------------------------");
  } else {
    bgb = insert(bgb, leftBGBLine);
    bgb = insert(bgb, leftArc);
    bgb = insert(bgb, rightBGBLine);
    bgb = insert(bgb, rightArc);
    bgb.push(leftBGBLine[0]);
  }
  return bgb;
}

/**
 * Insert array2 into array1
 * @param {*} array1 
 * @param {*} array2 
 */
function insert(array1, array2){
  
  //TODO: if array1 and array2 are not of the Array type, abort process and return null
  for (let i = 0; i < array2.length; i++) {    
    array1.push(array2[i]);
  }
  return array1;
}

/**
 * Append lineSegment to the end of mainLine. LineSegment could be a straight line or an arc.
 * @param {[Number Array]} mainLine: A Line array made up of arrays of coordinates pairs[X,Y]
 *  For example MainLine = [[ 823819.4561862915, 620424.4429363784 ], [ 824226.9451537293, 621308.3183418909] ]
 * @param {[Number Array]} lineSegment: A line or arc array made up of coordinate pairs in this format
 *            [[X,Y], [X,Y]]
 */
function appendLine(leftLineGeom, rightLineGeom, BGB, angle){
/*   console.log("A: " + lineSegment[0]);
  console.log("A: " + lineSegment[1]);
  console.log("A: " + lineSegment); */

  //console.log("App Main: " + mainLine);
  //let lastLineStored = [];
  let lastStoredLeftLineSegment = [];
  let lastStoredRightLineSegment = [];
  let leftBGBSegment = BGB[0];
  let rightBGBSegment = BGB[1];

  if (leftLineGeom.length === 0 || rightLineGeom.length === 0 ) {
    //console.log("leftline: " + leftLineGeom);
    //console.log("rightline: " + rightLineGeom);
    console.log("leftBGBSegment:" , leftBGBSegment );
    leftLineGeom.push(leftBGBSegment[0]); leftLineGeom.push(leftBGBSegment[1]); 
    rightLineGeom.push(rightBGBSegment[0]); rightLineGeom.push(rightBGBSegment[1]);
    console.log("1stL: ", leftLineGeom);
    console.log("1stR: ", rightLineGeom);
  } else if ( deepCompare(leftLineGeom[leftLineGeom.length - 1], leftBGBSegment[0]) ){   
    //if last node stored is same as the left node of current line
    //store only last point
    console.log("is same: insert only last node of new line, no removal");
    leftLineGeom.push(leftBGBSegment[0]); leftLineGeom.push(leftBGBSegment[1]); 
    rightLineGeom.push(rightBGBSegment[0]); rightLineGeom.push(rightBGBSegment[1]);
  } else{
      let tempData = leftLineGeom[leftLineGeom.length - 1];
      //let lastStoredLeftLineSegment = [tempData[0], tempData[1]];
      let lastStoredLeftLineSegment = [leftLineGeom[leftLineGeom.length - 2], leftLineGeom[leftLineGeom.length - 1]];
      console.log("lastStoredLeftLineSegment:", lastStoredLeftLineSegment);
      console.log("---");
      console.log("LEFT line: ", leftLineGeom);
      console.log("RIGHT line: ", rightLineGeom);
      console.log("---");
      
      if (angle !== 180.0) {
        /* ----------------- USE LEFT LINE AS PERSPECTIVE ---------------- */
        //if the parallel buffer lines of previous and current line intersect on the left side 
        //let intersection = linesIntersect(lastStoredLeftLineSegment, leftBGBSegment);
        let intersection = bufferUtils.linesIntersect(lastStoredLeftLineSegment, leftBGBSegment);
        if (intersection !== null) {   //intersection occured
          //LEFT LINE: remove last node stored and insert intersection point then insert last node of BGB segment
          console.log("Intersection occurred at: ", intersection);
          leftLineGeom.pop();
          leftLineGeom.push(intersection); 
          leftLineGeom.push(leftBGBSegment[1]); 

          //RIGHT LINE: Maintain last node stored and insert start then end nodes of the right BGB segment
          rightLineGeom.push(rightBGBSegment[0]);
          rightLineGeom.push(rightBGBSegment[1]);
        }
        if (intersection === null) {
          console.log("NO Intersection occurred");
        }
      }
    /*
    if (angle > 180) {
      console.log("Angle greater than 180 ..."); 
      // ----------------- LEFT LINE ---------------- 
      //1. Maintain last node stored
      //2. Add start and end nodes of the current line to the main buffer line  for now
      leftLineGeom.push(leftBGBSegment[0]);
      leftLineGeom.push(leftBGBSegment[1]);
      //3. Later::: Calculate the angle between last node stored and the first node of the current line, then construct an arc between them
      // ----------------- RIGHT LINE ---------------- 
      let intersection = linesIntersect(prevRightLine, rightBGBSegment);
      if ( intersection[0]) {  //if lines intersect
        console.log("line instersect: remove old point and insert only intersection point and right node");
        leftLineGeom.pop();
        leftLineGeom.push(intersection[1]);
        leftLineGeom.push(leftBGBSegment[1]);
      }
    }  else if (angle < 180) {
      console.log("Angle less 180");
      console.log("Last line stored: " + prevLeftLine);
      console.log("Curr line segmen: " + leftBGBSegment);
      //1. check if the previous line stored and the current line intersect.
      //if yes, they intersect, calculate the intersection point, remove last node stored and insert the intersection point and insert the last node
      // of the current line
      let intersection = linesIntersect(prevLeftLine, leftBGBSegment);
      if ( intersection[0]) {  //if lines intersect
        console.log("line instersect: remove old point and insert only intersection point and right node");
        leftLineGeom.pop();
        leftLineGeom.push(intersection[1]);
        leftLineGeom.push(leftBGBSegment[1]);
      } 

      //2. if they dont intersect, check if the length of the current line longer the previous line
      //if current is longer, check for the intersection of the line border line and the previous line stored
    }
    */
  }
/*   console.log("---");
  console.log("LEFT line: ", leftLineGeom);
  console.log("RIGHT line: ", rightLineGeom);
  console.log("---"); */
  console.log("---------------------------------------------------------------------------");
  return leftLineGeom;
}

function getAngleBetweenlines(prev, curr){
  //format of line [0:[x, y], 1:[x, y]]
  let prevDx = prev[0][0] - prev[1][0];
  let prevDy = prev[0][1] - prev[1][1];
  let currDx = curr[1][0] - curr[0][0];
  let currDy = curr[1][1] - curr[0][1];

  let anglePrev = Math.atan2(prevDy, prevDx);
  let angleCurr = Math.atan2(currDy, currDx);
  //console.log("Previous Line: " + line1);
  //console.log("Current Line : " + line2);
  //console.log("line1Dx: " + line1Dx + " | line1Dy: " + line1Dy + " | Angle1: " + (angle1 * RAD2DEG)) ;
  //console.log("line2Dx: " + line2Dx + " | line2Dy: " + line2Dy + " | ANgle2: " + (angle2 * RAD2DEG)) ;
  let angle = Math.abs(anglePrev - angleCurr) * RAD2DEG;
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
 * Rotate the Right node about the left node either clockwise or counter clockwise based on the given angle to form a horizontal line. 
 * Line must have exactly two points.
 * @param LNode (array [Number, Number]): Left node of line (node closer to origin on the X axis)
 * @param RNode (array [Number, Number]: Right node of line (node farther from origin on the X axis)
 * @param angle {NUmber}: Angle of rotation in radians
 * @returns {Number Array}: the coordinate [X, Y] of the right node after it has been rotated.
 */
function rotateRNodeAroundLNode(LNode, RNode, angle){
  let LX = LNode[0];            //LX is for easting value or x value of the left node
  let LY = LNode[1];             //LY us for northing value or y value of the left node
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
  }else if (startE === endE) {     /* if line is purely vertical */
    status = 2;
  } else {
    status = 0;
    direction = (endE > startE) ? 1 : -1 ;
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