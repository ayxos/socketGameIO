
// Copyright 2011 William Malone (www.williammalone.com)
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

var canvas;
var images = {};
var totalResources = 6;
var numResourcesLoaded = 0;
var fps = 30;
var x = 40;
var y = 140;
var breathInc = 0.1;
var breathDir = 1;
var breathAmt = 0;
var breathMax = 2;
var breathInterval = setInterval(updateBreath, 1000 / fps);
var maxEyeHeight = 14;
var curEyeHeight = maxEyeHeight;
var eyeOpenTime = 0;
var timeBtwBlinks = 4000;
var blinkUpdateTime = 200;                    
var blinkTimer = setInterval(updateBlink, blinkUpdateTime);
var numFramesDrawn = 0;
var curFPS = 0;
var legsCounter = 0;

function preparePlayer(){
	
	// not zombie
	loadImage("leftArm");
	loadImage("legs");
	loadImage("legs-jump");
	loadImage("torso");
	loadImage("rightArm");
	loadImage("head");
	loadImage("hair");

	// zombie
	loadImage("zombie-leftArm");
	loadImage("zombie-legs");
	loadImage("zombie-torso");
	loadImage("zombie-rightArm");
	loadImage("zombie-head");
	loadImage("zombie-hair");
}

function loadImage(name) {
  images[name] = new Image();
  images[name].src = "images/" + name + ".png";
}

function showCharacter(ctx, Cx, Cy, isZombie){

	drawEllipse(ctx, Cx + 40, Cy + 29, 160 - breathAmt, 6); // Shadow

	if(!isZombie){
		ctx.drawImage(images["leftArm"], Cx + 40, Cy - 42 - breathAmt);
		// ctx.save();
		// ctx.rotate(0.5);
		// if(legsCounter%8 != 0){
			ctx.drawImage(images["legs"], Cx, Cy);
		// } else {
		// 	ctx.drawImage(images["legs-jump"], Cx, Cy);
		// }
		
		// ctx.restore();
		ctx.drawImage(images["torso"], Cx, Cy - 50);
		ctx.drawImage(images["head"], Cx - 10, Cy - 125 - breathAmt);
		ctx.drawImage(images["hair"], Cx - 37, Cy - 138 - breathAmt);
		ctx.drawImage(images["rightArm"], Cx - 15, Cy - 42 - breathAmt);
	} else {
		ctx.drawImage(images["zombie-leftArm"], Cx + 40, Cy - 42 - breathAmt);
		ctx.drawImage(images["zombie-legs"], Cx, Cy);
		ctx.drawImage(images["zombie-torso"], Cx, Cy - 50);
		ctx.drawImage(images["zombie-head"], Cx - 10, Cy - 125 - breathAmt);
		ctx.drawImage(images["zombie-hair"], Cx - 37, Cy - 138 - breathAmt);
		ctx.drawImage(images["zombie-rightArm"], Cx - 15, Cy - 42 - breathAmt);
	}

	drawEllipse(ctx, Cx + 47, Cy - 68 - breathAmt, 8, curEyeHeight); // Left Eye
	drawEllipse(ctx, Cx + 58, Cy - 68 - breathAmt, 8, curEyeHeight); // Right Eye

	// legsCounter++;
}

function drawEllipse(ctx, centerX, centerY, width, height) {

  ctx.beginPath();
  
  ctx.moveTo(centerX, centerY - height/2);
  
  ctx.bezierCurveTo(
	centerX + width/2, centerY - height/2,
	centerX + width/2, centerY + height/2,
	centerX, centerY + height/2);

  ctx.bezierCurveTo(
	centerX - width/2, centerY + height/2,
	centerX - width/2, centerY - height/2,
	centerX, centerY - height/2);
 
  ctx.fillStyle = "black";
  ctx.fill();
  ctx.closePath();	
}

function updateBreath() { 
				
  if (breathDir === 1) {  // breath in
	breathAmt -= breathInc;
	if (breathAmt < -breathMax) {
	  breathDir = -1;
	}
  } else {  // breath out
	breathAmt += breathInc;
	if(breathAmt > breathMax) {
	  breathDir = 1;
	}
  }
}

function updateBlink() { 
				
  eyeOpenTime += blinkUpdateTime;
	
  if(eyeOpenTime >= timeBtwBlinks){
	blink();
  }
}

function blink() {

  curEyeHeight -= 1;
  if (curEyeHeight <= 0) {
	eyeOpenTime = 0;
	curEyeHeight = maxEyeHeight;
  } else {
	setTimeout(blink, 10);
  }
}