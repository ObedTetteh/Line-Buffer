var bufferUtils = require('./bufferUtils');


exports.getBGBPerp = function getBGBPerp(startNode, endNode, bufferDistance) {   //node1 then node2 in the direction of the growth of the line
  let BD = bufferDistance;

  //console.log("original start end node  ", startNode, endNode);
  //swap node positions: start for end
  [startNode, endNode] = bufferUtils.swapNodes(startNode, endNode);
  //console.log("After swap start end node", startNode, endNode);
  let startX = startNode[0];            //LX is for easting value or x value of the left node
  let startY = startNode[1];             //LY us for northing value or y value of the left node
  let endX = endNode[0];            //RX is for easting value or x value of the right node
  let endY = endNode[1];            //RN us for northing value or y value of the right node
/* 
  if (endX < startX) {    //if line direction or movement is toward origin on the x axis
    let tempEndX = endX, tempEndy = endY;
    endX = startX;
    endY = startY;
    startX = tempEndX;
    startY = tempEndy;
    console.log("original start end node", startNode, endNode);
    console.log("New start and End", [startX, startY], [endX, endY]);
  } */
  let angle = bufferUtils.getRotationAngle(startX, startY, endX, endY);
  //console.log("Angle: " + angle);
  //console.log("Angle2: ", bufferUtils.getAngleFromHorizontalAxis(startX, startY, endX, endY));

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
    console.log("*angle < 0: -------------------- ");
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
    
  } else {
    console.log("*angle > 0: -------------------- ");
    LtopX = startX + ady * BD;
    LtopY = startY + odx * BD;
    LbottomX = startX - ady * BD;
    LbottomY = startY - odx * BD;

    RtopX = endX + ady * BD;
    RtopY = endY + odx * BD;
    RbottomX = endX - ady * BD;
    RbottomY = endY - odx * BD;
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
  return bgbMerged;
}


function getBGBMergedWithArcs(mainLineNode1, mainLineNode2, leftBGBLine, rightBGBLine){
  let leftArc, rightArc;
  let leftOriginNode, rightOriginNode;
  let leftEndRotationPoint, rightEndRotationPoint;
  let mergedBGBarcsnLines;

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

}

function combineArcsnBGB(leftArc, rightArc, leftBGBLine, rightBGBLine, drxn){
  let bgb = [];
  if (drxn === "lr") {
    bgb = insert(bgb, leftBGBLine);
    bgb = insert(bgb, rightArc.reverse());
    bgb = insert(bgb, rightBGBLine.reverse());
    bgb = insert(bgb, leftArc.reverse());
    bgb.push(leftBGBLine[0]);     //1st and last coordinate of a polygon must be same
  } else {
    bgb = insert(bgb, leftBGBLine);
    bgb = insert(bgb, leftArc);
    bgb = insert(bgb, rightBGBLine.reverse());
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