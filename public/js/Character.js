
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
var characterScale = 0.6; // scale down the character size

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

function showCharacter(ctx, Cx, Cy, isZombie, name){

	// Shadow (scaled)
	drawEllipse(ctx, Cx + 40*characterScale, Cy + 29*characterScale, (160 - breathAmt)*characterScale, 6*characterScale);

	// Helper to draw scaled image at offset
	function drawScaled(name, ox, oy){
		var img = images[name];
		if (!img || !img.width) return; // image not loaded yet
		var w = img.width * characterScale;
		var h = img.height * characterScale;
		ctx.drawImage(img, Cx + ox*characterScale, Cy + oy*characterScale, w, h);
	}

	if(!isZombie){
		drawScaled("leftArm", 40, -42 - breathAmt);
		drawScaled("legs", 0, 0);
		drawScaled("torso", 0, -50);
		drawScaled("head", -10, -125 - breathAmt);
		drawScaled("hair", -37, -138 - breathAmt);
		drawScaled("rightArm", -15, -42 - breathAmt);
	} else {
		drawScaled("zombie-leftArm", 40, -42 - breathAmt);
		drawScaled("zombie-legs", 0, 0);
		drawScaled("zombie-torso", 0, -50);
		drawScaled("zombie-head", -10, -125 - breathAmt);
		drawScaled("zombie-hair", -37, -138 - breathAmt);
		drawScaled("zombie-rightArm", -15, -42 - breathAmt);
	}
	// Name (scaled)
	ctx.font = Math.round(20*characterScale) + "px Comic Sans MS";
	ctx.fillStyle = "red";
	ctx.fillText(name, Cx + 10*characterScale, Cy + (50 - breathAmt)*characterScale);

	// Eyes (scaled)
	drawEllipse(ctx, Cx + 47*characterScale, Cy - (68 + breathAmt)*characterScale, 8*characterScale, curEyeHeight*characterScale);
	drawEllipse(ctx, Cx + 58*characterScale, Cy - (68 + breathAmt)*characterScale, 8*characterScale, curEyeHeight*characterScale);

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