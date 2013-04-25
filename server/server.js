// Set up a collection to contain player information. On the server,
// it is backed by a MongoDB collection named "players".

Players = new Meteor.Collection("players");
Bombs = new Meteor.Collection("bombs");

Meteor.startup(function () {
	Meteor.publish("players", function () {
		return Players.find();
	});
	Meteor.publish("bombs", function () {
		return Bombs.find();
	});

	var playerCursor = Players.find({});

	// watch the cursor for changes
	playerCursor.observe({
		added: function (player) {
			
		},
		changed: function (player) {
			
		},
		removed: function (player) {
			
		}
	});

	// run every five minutes
	var reap = function() {
		var timeout = new Date((new Date).getTime() - 60000);

		playerCursor.forEach(function(player) {
			if(!player.lastActivity || player.lastActivity.getTime() < timeout) {
				Players.remove(player._id);
			}
		});

		Meteor.setTimeout(reap, 60000 * 5)
	};

	reap();
});
