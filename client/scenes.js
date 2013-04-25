// Game scene
// -------------
// Runs the core gameplay loop
Crafty.scene("Game", function() {
	var level = [
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
		[0, 0, 0, 4, 0, 2, 2, 2, 2, 0, 0, 0], 
		[0, 5, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0], 
		[0, 5, 0, 4, 0, 0, 0, 3, 3, 0, 0, 0], 
		[0, 5, 0, 0, 0, 0, 0, 0, 3, 0, 0, 0], 
		[0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 0, 0], 
		[0, 0, 5, 0, 0, 3, 4, 5, 0, 0, 4, 0], 
		[0, 0, 5, 3, 3, 3, 3, 0, 0, 0, 4, 0], 
		[0, 0, 5, 0, 4, 0, 0, 5, 0, 4, 4, 0], 
		[0, 0, 0, 0, 4, 0, 0, 5, 0, 4, 0, 0], 
		[0, 0, 3, 3, 3, 3, 0, 5, 0, 4, 0, 0], 
		[0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
	];

	for (var x = 0; x < shirobon.Game.map_grid.width; x++) {
		for (var y = 0; y < shirobon.Game.map_grid.height; y++) {
			if(level[y][x] == 1) {
				Crafty.e("Wall").at(x, y);
			} else if(level[y][x] == 2) {
				Crafty.e("ConveyorBelt_RightToLeft").at(x, y);
			} else if(level[y][x] == 3) {
				Crafty.e("ConveyorBelt_LeftToRight").at(x, y);
			} else if(level[y][x] == 4) {
				Crafty.e("ConveyorBelt_TopToBottom").at(x, y);
			} else if(level[y][x] == 5) {
				Crafty.e("ConveyorBelt_BottomToTop").at(x, y);
			} else {
				Crafty.e("Floor").at(x, y);
			}
		}
	}

	var playerCursor = Players.find();
	var players = playerCursor.fetch();
	var reclaimedPlayer;

	var enemies = {};

	for(var i = 0; i < players.length; i++) {
		var player = players[i];

		if(player.name == Session.get("name")) {
			console.info(player.name + " = " + Session.get("name"));
			reclaimedPlayer = player;
		} else {
			var enemy = Crafty.e("Enemy").at(player.x, player.y);
			enemy.setData(player);

			enemies[player.name] = enemy;
		}
	}

	// find a suitable spot to add the player
	while(true) {
		var x = parseInt(Math.random() * shirobon.Game.map_grid.width, 10);
		var y = parseInt(Math.random() * shirobon.Game.map_grid.width, 10);

		if(level[y][x] != 0) {
			// only select floor to place players on...
			continue;
		}

		if(!Players.findOne({x: x, y: y})) {
			if(!reclaimedPlayer) {
				Players.insert({name: Session.get("name"), score: 0, x: x, y: y});
				reclaimedPlayer = Players.findOne({name: Session.get("name")});
			}

			// Player character
			this.player = Crafty.e("PlayerCharacter").at(x, y);
			this.player.setData(reclaimedPlayer);

			break;
		}
	}

	// watch the cursor for changes
	playerCursor.observe({
		added: function (player) {
			if(player.name == Session.get("name")) {
				return;
			}

			var enemy = Crafty.e("Enemy").at(player.x, player.y);
			enemy.setData(player);
			enemy.name = player.name;

			enemies[player.name] = enemy;

			Crafty.audio.play("hello");
		},
		changed: function (player) {
			if(player.name == Session.get("name")) {
				return;
			}

			enemies[player.name].x = player.x;
			enemies[player.name].y = player.y;
			enemies[player.name].setData(player);
		},
		removed: function (player) {
			if(player.name == Session.get("name")) {
				return;
			}

			enemies[player.name].destroy();
			delete enemies[player.name];
		}
	});

	var bombCursor = Bombs.find();
	bombCursor.observe({
		added: function (bombData) {
			if(bombData.owner == Session.get("name")) {
				return;
			}

			var bomb = Crafty.e("EnemyBomb").at(bombData.x, bombData.y);
			bomb.x = bombData.x
			bomb.y = bombData.y;
			bomb.owner = bombData.owner;
			bomb.setData(bombData);
			Crafty.audio.play("bomb_drop");
			console.info("Incoming bomb placed at " + bomb.x + ", " + bomb.y + " by " + bomb.owner);
		}
	});

	Crafty.audio.play("hello");

	/*setInterval(function() {
		this.player;

		Players.update(this.data._id, {$set: {x: this.data.x, y: this.data.y, lastActivity: new Date()}});
	}, 1000);*/

	var canvas = document.querySelector("#cr-stage canvas");
	var context = canvas.getContext("2d");
	context.webkitImageSmoothingEnabled = false;
	context.mozImageSmoothingEnabled = false;

	// Show the victory screen once all villages are visisted
	this.show_victory = this.bind("BombVisited", function() {
		if (!Crafty("Village").length) {
			Crafty.scene("Victory");
		}
	});
}, function() {
	// Remove our event binding from above so that we don"t
	//  end up having multiple redundant event watchers after
	//  multiple restarts of the game
	this.unbind("VillageVisited", this.show_victory);
});

// Victory scene
// -------------
// Tells the player when they"ve won and lets them start a new game
Crafty.scene("Victory", function() {
	// Display some text in celebration of the victory
	Crafty.e("2D, DOM, Text")
		.text("All villages visited!")
		.attr({ x: 0, y: shirobon.Game.height()/2 - 24, w: shirobon.Game.width() })
		.css($text_css);

	// Give"em a round of applause!
	Crafty.audio.play("applause");

	// After a short delay, watch for the player to press a key, then restart
	// the game when a key is pressed
	var delay = true;
	setTimeout(function() { delay = false; }, 5000);
	this.restart_game = Crafty.bind("KeyDown", function() {
		if (!delay) {
			Crafty.scene("Game");
		}
	});
}, function() {
	// Remove our event binding from above so that we don"t
	//  end up having multiple redundant event watchers after
	//  multiple restarts of the game
	this.unbind("KeyDown", this.restart_game);
});

// Loading scene
// -------------
// Handles the loading of binary assets such as images and audio files
Crafty.scene("Loading", function(){
	// Draw some text for the player to see in case the file
	//  takes a noticeable amount of time to load
	Crafty.e("2D, DOM, Text")
		.text("Loading; please wait...")
		.attr({ x: 0, y: shirobon.Game.height()/2 - 24, w: shirobon.Game.width() })
		.css($text_css);

	// Load our sprite map image
	Crafty.load([
			"assets/player.png",
			"assets/player-bomb.png",
			"assets/enemy.png",
			"assets/enemy-bomb.png",
			"assets/floor.png",
			"assets/wall.png",
			"assets/belt-right-to-left.png",
			"assets/belt-left-to-right.png",
			"assets/belt-top-to-bottom.png",
			"assets/belt-bottom-to-top.png",
			"assets/hello.mp3",
			"assets/hello.ogg",
			"assets/hello.wav",
			"assets/player_death.mp3",
			"assets/player_death.ogg",
			"assets/player_death.wav",
			"assets/player_suicide.mp3",
			"assets/player_suicide.ogg",
			"assets/player_suicide.wav",
			"assets/enemy_death.mp3",
			"assets/enemy_death.ogg",
			"assets/enemy_death.wav",
			"assets/bomb_explode.mp3",
			"assets/bomb_explode.ogg",
			"assets/bomb_explode.wav",
			"assets/bomb_drop.mp3",
			"assets/bomb_drop.ogg",
			"assets/bomb_drop.wav"
		], function() {
		
		Crafty.sprite(32, "assets/player.png", {
			Sprite_Player:  [0, 0]
		});

		Crafty.sprite(32, "assets/player-bomb.png", {
			Sprite_PlayerBomb:  [0, 0]
		});

		Crafty.sprite(32, "assets/enemy.png", {
			Sprite_Enemy:  [0, 0]
		});

		Crafty.sprite(32, "assets/enemy-bomb.png", {
			Sprite_EnemyBomb:  [0, 0]
		});

		Crafty.sprite(32, "assets/floor.png", {
			Sprite_Floor:  [0, 0]
		});

		Crafty.sprite(32, "assets/wall.png", {
			Sprite_Wall:  [0, 0]
		});

		Crafty.sprite(32, "assets/belt-right-to-left.png", {
			Sprite_BeltRightToLeft:  [0, 0]
		});

		Crafty.sprite(32, "assets/belt-left-to-right.png", {
			Sprite_BeltLeftToRight:  [0, 0]
		});

		Crafty.sprite(32, "assets/belt-top-to-bottom.png", {
			Sprite_BeltTopToBottom:  [0, 0]
		});

		Crafty.sprite(32, "assets/belt-bottom-to-top.png", {
			Sprite_BeltBottomToTop:  [0, 0]
		});

		Crafty.audio.add("hello", [
			"assets/hello.mp3",
			"assets/hello.ogg",
			"assets/hello.wav"
		]);

		Crafty.audio.add("bomb_explode", [
			"assets/bomb_explode.mp3",
			"assets/bomb_explode.ogg",
			"assets/bomb_explode.wav"
		]);

		Crafty.audio.add("bomb_drop", [
			"assets/bomb_drop.mp3",
			"assets/bomb_drop.ogg",
			"assets/bomb_drop.wav"
		]);

		Crafty.audio.add("player_death", [
			"assets/player_death.mp3",
			"assets/player_death.ogg",
			"assets/player_death.wav"
		]);

		Crafty.audio.add("player_suicide", [
			"assets/player_suicide.mp3",
			"assets/player_suicide.ogg",
			"assets/player_suicide.wav"
		]);

		Crafty.audio.add("enemy_death", [
			"assets/enemy_death.mp3",
			"assets/enemy_death.ogg",
			"assets/enemy_death.wav"
		]);

		// Now that our sprites are ready to draw, start the game
		Crafty.scene("Game");
	})
});