const mongoose = require('mongoose');
// require('mongoose-currency').loadType(mongoose);
const Schema = mongoose.Schema;

var FavoriteSchema = new Schema({
	dish: [{
		type: mongoose.Schema.Types.ObjectId,
		ref: 'Dish'
	}],
	author: {
		type: mongoose.Schema.Types.ObjectId,
		ref: 'User'
	}
}, {
	timestamps: true
});

var Favorites = mongoose.model('Favorite', FavoriteSchema);

module.exports = Favorites;