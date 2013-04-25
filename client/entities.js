// The Grid component allows an element to be located
//  on a grid of tiles
Crafty.c("Grid", {
	init: function() {
		this.attr({
			w: shirobon.Game.map_grid.tile.width,
			h: shirobon.Game.map_grid.tile.height
		})
	},

	// Locate this entity at the given position on the grid
	at: function(x, y) {
		if (x === undefined && y === undefined) {
			return { x: this.x/shirobon.Game.map_grid.tile.width, y: this.y/shirobon.Game.map_grid.tile.height }
		}

		this.attr({ x: x * shirobon.Game.map_grid.tile.width, y: y * shirobon.Game.map_grid.tile.height });

		return this;
	}
});
 
// An "Actor" is an entity that is drawn in 2D on canvas
//  via our logical coordinate grid
Crafty.c("Actor", {
	init: function() {
		this.requires("2D, Canvas, Grid");
	},
});

// A conveyor belt will move the player and bombs in a certain direction
Crafty.c("ConveyorBelt_RightToLeft", {
	init: function() {
		this.requires("Actor, Sprite_BeltRightToLeft, SpriteAnimation")
			.animate("Moving", 0, 0, 8)
			.animate("Moving", 20, -1);
	},
});

Crafty.c("ConveyorBelt_LeftToRight", {
	init: function() {
		this.requires("Actor, Sprite_BeltLeftToRight, SpriteAnimation")
			.animate("Moving", 0, 0, 8)
			.animate("Moving", 20, -1);
	},
});

Crafty.c("ConveyorBelt_TopToBottom", {
	init: function() {
		this.requires("Actor, Sprite_BeltTopToBottom, SpriteAnimation")
			.animate("Moving", 0, 0, 8)
			.animate("Moving", 20, -1);;
	},
});

Crafty.c("ConveyorBelt_BottomToTop", {
	init: function() {
		this.requires("Actor, Sprite_BeltBottomToTop, SpriteAnimation")
			.animate("Moving", 0, 0, 8)
			.animate("Moving", 20, -1);;
	},
});

// A wall is an Actor the player can't pass through
Crafty.c("Wall", {
	init: function() {
		this.requires("Actor, Solid, Sprite_Wall");
	},
});

// A Rock is just an Actor with a certain sprite
Crafty.c("Floor", {
	init: function() {
		this.requires("Actor, Sprite_Floor");
	},
});

// This is the player-controlled character
Crafty.c("PlayerCharacter", {
	init: function() {
		this.requires("Actor, Fourway, Collision, Sprite_Player, SpriteAnimation, Keyboard")
			.fourway(1)
			.stopOnSolids()
			.onHit("PlayerBomb", this.visitBomb)
			.onHit("EnemyBomb", this.visitBomb)

			// These next lines define our four animations
			//  each call to .animate specifies:
			//  - the name of the animation
			//  - the x and y coordinates within the sprite
			//     map at which the animation set begins
			//  - the number of animation frames *in addition to* the first one
			.animate("PlayerMovingUp", 0, 3, 2)
			.animate("PlayerMovingRight", 0, 2, 2)
			.animate("PlayerMovingDown",  0, 0, 2)
			.animate("PlayerMovingLeft",  0, 1, 2)

			.onHit("ConveyorBelt_RightToLeft", this.onRightToLeftConveyorBelt)
			.onHit("ConveyorBelt_LeftToRight", this.onLeftToRightConveyorBelt)
			.onHit("ConveyorBelt_TopToBottom", this.onTopToBottomConveyorBelt)
			.onHit("ConveyorBelt_BottomToTop", this.onBottomToTopConveyorBelt);

		this.name = Session.get("name");

		// Watch for a change of direction and switch animations accordingly
		var animation_speed = 30;
		this.bind("NewDirection", function(data) {
			if (data.x > 0) {
				this.animate("PlayerMovingRight", animation_speed, -1);
			} else if (data.x < 0) {
				this.animate("PlayerMovingLeft", animation_speed, -1);
			} else if (data.y > 0) {
				this.animate("PlayerMovingDown", animation_speed, -1);
			} else if (data.y < 0) {
				this.animate("PlayerMovingUp", animation_speed, -1);
			} else {
				this.stop();
			}
		});

		// drop a bomb when the space bar is pressed
		this.bind("KeyDown", function () {
			if(this.isDown("SPACE")) {
				var bomb = Crafty.e("PlayerBomb");
				bomb.owner = Session.get("name");
				bomb.x = this.x;
				bomb.y = this.y;

				var id = Bombs.insert({owner: bomb.owner, x: bomb._x, y: bomb._y});

				bomb.setData(Bombs.findOne({_id: id}));

				console.info("Placed bomb at " + bomb.x + ", " + bomb.y + " by " + bomb.owner);
				Crafty.audio.play("bomb_drop");
			}
		});

		var dim = (shirobon.Game.map_grid.width * shirobon.Game.map_grid.tile.width) - this._w;

		// don't go off the screen
		this.bind("EnterFrame", function () {
			if(this._x < 0) {
				this.x = 0;
			}

			if(this._y < 0) {
				this.y = 0;
			}

			if(this._x > dim) {
				this.x = dim;
			}

			if(this._y > dim) {
				this.y = dim;
			}

			if(this.data.x != this._x || this.data.y != this._y) {
				this.data.x = this._x;
				this.data.y = this._y;
				Players.update(this.data._id, {$set: {x: this.data.x, y: this.data.y, lastActivity: new Date()}});
			}
		});
	},
 
	// Registers a stop-movement function to be called when
	// this entity hits an entity with the "Solid" component
	stopOnSolids: function() {
		this.onHit("Solid", this.stopMovement);
 
		return this;
	},
 
	// Stops the movement
	stopMovement: function(hit) {
		var solid = hit[0].obj;

		// inside from the left
		if(
			this._x < solid._x
			&&
			(this._x + this._w) > solid._x
			) {
			console.info("hit from left");
			this.x = (solid._x - this._w);
		} else

		// inside from the right
		if(
			this._x > solid._x
			&& 
			(this._x + this._w) > (solid._x + solid._w)
			) {
			console.info("hit from right");
			this.x = (solid._x + solid._w);
		} else

		// inside from above
		if(
			this._y < solid._y
			&&
			(this._y + this._h) > solid._y
			) {
			console.info("hit from above");
			this.y = (solid._y - this._h);
		} else 

		// inside from below
		if(
			this._y > solid._y
			&& 
			(this._y + this._h) > (solid._y + solid._h)
			) {
			console.info("hit from below");
			this.y = (solid._y + solid._h);
		}

/*
		// inside from above
		if(
			(this._y + this._h) > solid._y 
			&& this._y < (solid._y + solid.h)
			) {
			this.y = (solid._y - this._h);
		}

		// inside from below
		if(
			this._y  < (solid._y + solid._h)
			&& (this._y + this._h) > solid._y
			) {
			this.y = (solid._y + solid._h);
		}*/

		/*this._speed = 0;

		if (this._movement) {
			this.x -= this._movement.x;
			this.y -= this._movement.y;
		}*/
	},
 
	// Respond to this player visiting a village
	visitBomb: function(data) {
		var bomb = data[0].obj;
		bomb.visit(this);
	},

	move: function(dir, by) {
		console.info(dir + " " + by);

		if(this.x <= 0) {
			this.x = 0;
		}

		if(this.y <= 0) {
			this.y = 0;
		}
	},

	increaseScore: function(amount) {

	},

	onRightToLeftConveyorBelt: function() {
		this.x -= 1;
	},

	onLeftToRightConveyorBelt: function() {
		this.x += 1;
	},

	onTopToBottomConveyorBelt: function() {
		this.y += 1;
	},

	onBottomToTopConveyorBelt: function() {
		this.y -= 1;
	},

	setData: function(data) {
		this.data = data;
	}
});

// A village is a tile on the grid that the PC must visit in order to win the game
Crafty.c("PlayerBomb", {
	init: function() {
		this.requires("Actor, Sprite_PlayerBomb, Collision, Delay, SpriteAnimation")

			// These next lines define our four animations
			//  each call to .animate specifies:
			//  - the name of the animation
			//  - the x and y coordinates within the sprite
			//     map at which the animation set begins
			//  - the number of animation frames *in addition to* the first one
			.animate("Fizz", 0, 0, 1)
			.animate("TurnRed", 0, 0, 3)
			.animate("Explode", 5, 0, 4)

			.onHit("ConveyorBelt_RightToLeft", this.onRightToLeftConveyorBelt)
			.onHit("ConveyorBelt_LeftToRight", this.onLeftToRightConveyorBelt)
			.onHit("ConveyorBelt_TopToBottom", this.onTopToBottomConveyorBelt)
			.onHit("ConveyorBelt_BottomToTop", this.onBottomToTopConveyorBelt);

		this.exploading = false;

		this.animate("Fizz", 10, -1);

		this.delay(function() {
			this.animate("TurnRed", 30, -1);
		}, 2000);

		this.delay(function() {
			this.animate("Explode", 30);
			Crafty.audio.play("bomb_explode");
			this.exploading = true;
		}, 3500);

		this.delay(function() {
			this.destroy();
			Bombs.remove(this.data._id);
		}, 4000);
	},

	// Process a visitation with this bomb
	visit: function(player) {
		if(this.exploading) {
			if(this.owner == player.name) {
				// killed themselves
				//this.owner.increaseScore(-100);
				Crafty.audio.play("player_suicide");

				Crafty.e("2D, DOM, Text")
					.text("SUICIDE IS NOT PAINLESS!")
					.attr({ x: 0, y: shirobon.Game.height()/2 - 24, w: shirobon.Game.width() })
					.css($text_css);
			} else {
				// killed someone else
				//this.owner.increaseScore(100);
				Crafty.audio.play("enemy_death");

				var text = Crafty.e("2D, DOM, Text")
					.text("WOOP!")
					.attr({ x: 0, y: shirobon.Game.height()/2 - 24, w: shirobon.Game.width() })
					.css($text_css);

				setTimeout(function() {
					text.destroy();
				}, 1000);
			}

			player.destroy();
		}
	},

	onRightToLeftConveyorBelt: function() {
		this.x -= 1;
	},

	onLeftToRightConveyorBelt: function() {
		this.x += 1;
	},

	onTopToBottomConveyorBelt: function() {
		this.y += 1;
	},

	onBottomToTopConveyorBelt: function() {
		this.y -= 1;
	},

	isExploding: function() {
		return this.exploading;
	},

	setData: function(data) {
		this.data = data;
	}
});

// A village is a tile on the grid that the PC must visit in order to win the game
Crafty.c("Enemy", {
	init: function() {
		this.requires("Actor, Collision, Sprite_Enemy, SpriteAnimation")
			.onHit("PlayerBomb", this.visitBomb)
			.onHit("EnemyBomb", this.visitBomb)

			.animate("PlayerMovingUp", 0, 3, 2)
			.animate("PlayerMovingRight", 0, 2, 2)
			.animate("PlayerMovingDown",  0, 0, 2)
			.animate("PlayerMovingLeft",  0, 1, 2);
	},

	// Respond to this player visiting a village
	visitBomb: function(data) {
		var bomb = data[0].obj;
		bomb.visit(this);
	},
 
	setData: function(data) {
		this.data = data;
	}
});

// A village is a tile on the grid that the PC must visit in order to win the game
Crafty.c("EnemyBomb", {
	init: function() {
		this.requires("Actor, Sprite_EnemyBomb, Collision, Delay, SpriteAnimation")

			// These next lines define our four animations
			//  each call to .animate specifies:
			//  - the name of the animation
			//  - the x and y coordinates within the sprite
			//     map at which the animation set begins
			//  - the number of animation frames *in addition to* the first one
			.animate("Fizz", 0, 0, 1)
			.animate("TurnRed", 0, 0, 3)
			.animate("Explode", 5, 0, 4)

			.onHit("ConveyorBelt_RightToLeft", this.onRightToLeftConveyorBelt)
			.onHit("ConveyorBelt_LeftToRight", this.onLeftToRightConveyorBelt)
			.onHit("ConveyorBelt_TopToBottom", this.onTopToBottomConveyorBelt)
			.onHit("ConveyorBelt_BottomToTop", this.onBottomToTopConveyorBelt);

		this.exploading = false;

		this.animate("Fizz", 10, -1);

		this.delay(function() {
			this.animate("TurnRed", 30, -1);
		}, 2000);

		this.delay(function() {
			this.animate("Explode", 30);
			this.exploading = true;
			Crafty.audio.play("bomb_explode");
		}, 3500);

		this.delay(function() {
			this.destroy();
			Bombs.remove(this.data._id);
		}, 4000);
	},

	// Process a visitation with this bomb
	visit: function(player) {
		if(this.exploading) {
			if(this.owner == player.name) {
				// killed themselves
				//this.owner.increaseScore(-100);
				Crafty.audio.play("player_suicide");

				var text = Crafty.e("2D, DOM, Text")
					.text("IT ALL GOT TOO MUCH!")
					.attr({ x: 0, y: shirobon.Game.height()/2 - 24, w: shirobon.Game.width() })
					.css($text_css);

				setTimeout(function() {
					text.destroy();
				}, 1000);
			} else {
				// killed someone else
				//this.owner.increaseScore(100);
				Crafty.audio.play("player_death");

				var text = Crafty.e("2D, DOM, Text")
					.text("TOO BAD!")
					.attr({ x: 0, y: shirobon.Game.height()/2 - 24, w: shirobon.Game.width() })
					.css($text_css);

				setTimeout(function() {
					text.destroy();
				}, 1000);
			}

			player.destroy();
		}
	},

	onRightToLeftConveyorBelt: function() {
		this.x -= 1;
	},

	onLeftToRightConveyorBelt: function() {
		this.x += 1;
	},

	onTopToBottomConveyorBelt: function() {
		this.y += 1;
	},

	onBottomToTopConveyorBelt: function() {
		this.y -= 1;
	},

	isExploding: function() {
		return this.exploading;
	},

	setData: function(data) {
		this.data = data;
	}
});
