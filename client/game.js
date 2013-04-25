shirobon.Game = {
	// This defines our grid's size and the size of each of its tiles
	map_grid: {
		width:  12,
		height: 12,
		tile: {
			width:  32,
			height: 32
		}
	},
 
	// The total width of the game screen. Since our grid takes up the entire screen
	//  this is just the width of a tile times the width of the grid
	width: function() {
		return this.map_grid.width * this.map_grid.tile.width;
	},

	// The total height of the game screen. Since our grid takes up the entire screen
	//  this is just the height of a tile times the height of the grid
	height: function() {
		return this.map_grid.height * this.map_grid.tile.height;
	},

	// Initialize and start our game
	start: function() {
		Crafty.init(this.width(), this.height());
		Crafty.background("rgb(40, 40, 40)");

		// Simply start the "Loading" scene to get things going
		Crafty.scene("Loading");
	}
}

$text_css = {
	"font-size": "80px",
	//"font-family": "Arial",
	"color": "white",
	"text-align": "center"
}