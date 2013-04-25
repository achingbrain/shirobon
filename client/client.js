Players = new Meteor.Collection("players");
Bombs = new Meteor.Collection("bombs");

Meteor.subscribe("players");
Meteor.subscribe("bombs");

shirobon = {};

window.requestAnimationFrame = window.requestAnimationFrame || window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || window.msRequestAnimationFrame;

if(!window.requestAnimationFrame) {
	alert("Please upgrade your browser!");
}

var player;
var canvas;

var resize = function() {
	var stage = document.querySelector("#cr-stage");

	if(!stage) {
		return;
	}

	var canvas = document.querySelector("#cr-stage canvas");

	if(!canvas) {
		return;
	}

	var dim = window.innerHeight;

	if(window.innerWidth < window.innerHeight) {
		dim = window.innerWidth;
	}

	canvas.style.width = dim + "px";
	canvas.style.height = dim + "px";

	stage.style.width = canvas.style.width;
	stage.style.height = canvas.style.height;

	canvas.style.margin = "auto";
	canvas.style.position = "static";

	stage.style.position = "absolute";
	stage.style.left = "50%";
	stage.style.marginLeft = "-" + parseInt(dim/2, 10) + "px";
}
window.onresize = resize;

var tintLogoInterval;
var ready = false;

var init = function() {
	var form = document.querySelector("form#join");
	var connecting = document.querySelector("p");
	connecting.style.display = "block";
	form.style.display = "none";

	if(!Meteor.status().connected) {
		setTimeout(init, 100);

		return;
	}

	clearInterval(tintLogoInterval);
	tintLogoInterval = null;

	var welcome = document.querySelector("div");
	welcome.parentNode.removeChild(welcome);

	Session.set("name", window.localStorage.playerName);
	form.parentNode.removeChild(form);
	shirobon.Game.start();
	setTimeout(resize, 500);

	paintGameBackground();

	document.querySelector("form#back").style.display = "block";
	document.querySelector("form#back").onsubmit = function(event) {
			var player = Players.findOne({name: Session.get("name")});
			Players.remove(player._id);

			delete window.localStorage.playerName;
		};

	ready = true;
}

Meteor.startup(function() {
	var welcome = document.querySelector("div");
	var form = document.querySelector("form#join");
	var connecting = document.querySelector("p");
	connecting.style.display = "none";

	document.querySelector("form#back").style.display = "none";

	var imageObj = new Image();
	imageObj.onload = function() {
		rgbks = shirobon.Colour.generateRGBKs(imageObj);
		tintLogoInterval = setInterval(tintLogo, 200);
		paintIntroBackground();
	};
	imageObj.src = "/assets/logo.png";

	var canvas = document.getElementById("title");

	var tintLogo = function() {
		var tinted = shirobon.Colour.generateTintImage(imageObj, rgbks, parseInt(Math.random() * 255, 10), parseInt(Math.random() * 255, 10), parseInt(Math.random() * 255, 10));

		var context = canvas.getContext("2d");
		context.webkitImageSmoothingEnabled = false;
		context.mozImageSmoothingEnabled = false;

		context.save();
		context.scale(2, 2);
		context.drawImage(tinted, 0, 0);
		context.restore();
	};
	
	if(!window.localStorage.playerName) {
		form.onsubmit = function(event) {
			event.preventDefault();

			window.localStorage.playerName = shirobon.crypto.MD5.hash(form.elements["name"].value.toLowerCase());

			init();

			return false;
		};
	} else {
		init();
	}
});

function paintIntroBackground() {
	var canvas = document.getElementById("background"),
	context = canvas.getContext("2d"),
	W = window.innerWidth,
	H = window.innerHeight,
	circles = [];

	canvas.width = W;
	canvas.height = H; 

	//Random Circles creator
	function create() {
		//Place the circles at the center
		this.x = W/2;
		this.y = H/2;
		
		//Random radius between 2 and 6
		this.radius = 2 + Math.random()*3; 
		
		//Random velocities
		this.vx = -5 + Math.random()*10;
		this.vy = -5 + Math.random()*10;
		
		//Random colors
		this.r = Math.round(Math.random())*255;
		this.g = Math.round(Math.random())*255;
		this.b = Math.round(Math.random())*255;
	}

	for (var i = 0; i < 500; i++) {
		circles.push(new create());
	}

	function draw() {
		
		//Fill canvas with black color
		context.globalCompositeOperation = "source-over";
		context.fillStyle = "rgba(0,0,0,0.15)";
		//context.fillRect(0, 0, W, H);
		context.webkitImageSmoothingEnabled = false;
		context.mozImageSmoothingEnabled = false;

		context.save();
		context.scale(2, 2);
		
		//Fill the canvas with circles
		for(var j = 0; j < circles.length; j++){
			var c = circles[j];
			
			//Create the circles
			context.beginPath();
			context.fillRect(c.x, c.y, 5, 5);
			context.fillStyle = "rgba("+c.r+", "+c.g+", "+c.b+", 0.5)";
			context.fill();
			
			c.x += c.vx;
			c.y += c.vy;
			c.radius -= .02;
			
			if(c.radius < 0) {
				circles[j] = new create();
			}
		}

		context.restore();
	}

	function animate() {
		if(ready) {
			return;
		}

		requestAnimationFrame(animate);
		draw();
	}

	animate();
}

function paintGameBackground() {
	var canvas = document.getElementById("background");
	var context = canvas.getContext("2d");
	var W = window.innerWidth;
	var H = window.innerHeight;
	var playerImages = {};

	canvas.width = W;
	canvas.height = H; 

	function draw() {
		//Fill canvas with black color
		context.globalCompositeOperation = "source-over";
		context.fillStyle = "rgba(0,0,0,0.15)";
		context.fillRect(0, 0, W, H);
		context.webkitImageSmoothingEnabled = false;
		context.mozImageSmoothingEnabled = false;

		context.save();

		_.each(Players.find({}).fetch(), function(player) {
			if(!player || !player.name) {
				return;
			}

			if(playerImages[player.name]) {
				return;
			}
			
			var imageObj = new Image();
			imageObj.onload = function() {
				playerImages[player.name] = {
					rgbks: shirobon.Colour.generateRGBKs(imageObj),
					img: imageObj
				};
			};
			imageObj.crossOrigin = "http://www.gravatar.com/crossdomain.xml";
			imageObj.src = "http://www.gravatar.com/avatar/" + player.name;
		});

		var images = [];

		for(var key in playerImages) {
			images.push(playerImages[key]);
		}

		var shuffle = function(array) {
			var output = [];

			for(var i = 0; i < array.length; i++) {
				output[i] = array[i];
			}

			for (var i = 0; i < output.length; i++) {
				var j = Math.floor(Math.random() * output.length);
				var tmp = output[i];
				output[i] = output[j];
				output[j] = tmp;
			}
			
			return output;
		};

		images = shuffle(images);

		var numImages = images.length;
		var numPerRow = parseInt(Math.sqrt(numImages), 10);
		var dim = parseInt(window.innerWidth/numPerRow, 10);
		var column = 0;
		var row = 0;
		var firstHalf = numPerRow/2;

		for(var i = 0; i < images.length; i++) {
			var tinted = shirobon.Colour.generateTintImage(images[i].img, images[i].rgbks, parseInt(Math.random() * 255, 10), parseInt(Math.random() * 255, 10), parseInt(Math.random() * 255, 10));
			var x = column * dim;

			if(column > firstHalf) {
				x = window.innerWidth - (column * dim);
			}

			context.drawImage(tinted, x, row * dim, dim, dim);

			column++;

			if(column == numPerRow) {
				column = 0;
				row++;
			}
		}

		context.restore();
	}

	function animate() {
		draw();

		// don't need requestAnimationFrame speed..
		setTimeout(animate, 1000);
	}

	animate();
}

