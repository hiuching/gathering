var mongoose = require('mongoose') ;Schema = mongoose.Schema;
var extend = require('mongoose-schema-extend');
/*********************************************
* Schema
 *********************************************/
var idCounterSchema = new Schema({
count: {type: Number},
model:  {type: String},
field: {type: String}
});
/*********************************************
* Class method
 *********************************************/

idCounterSchema.statics.getNextSequenceValue = function (options, callback) {
	var model = options.model ||'';
	var field = options.field || '_id';
	this.findOneAndUpdate(
		{ model: model, field: field},
		{ $inc: { count: 1 } },
		{ new: true , upsert: true},
	function (err, updatedIdentityCounter) {
		if (err) {console.log(err);
			callback(err);
		} else {
			callback(err, updatedIdentityCounter.count);
		}
	});
};

idCounterSchema.statics.resetCount = function (options, callback) {
	var model = options.model ||'';
	var field = options.field || "_id";
	this.findOneAndUpdate(
		{ model: model, field: field },
		{ count: 0 },
		{ new: true, upsert: true}, 
		function (err, updatedIdentityCounter) {
			if (err) return callback(err);
			callback(null, updatedIdentityCounter);
		}
	);
};

idCounterSchema.statics.deleteCounter = function (options, callback) {
	options = options || {};
	this.remove(options, callback);
};

// idCounterSchema.statics.createNew = function (callback) {
	// var obj = new this({code: 0,
			// sequence_value: 1,
			// collectionName: 'shortCode'});
	// obj.save( function (err, user, numberAffected) {
		// if (err) {
			// callback(err);
		// } else if (user) { 
				// callback(err, user, numberAffected);
			// } else {
				// callback('failed to create record');
			// }
	// });
// };


module.exports = mongoose.model('Counters', idCounterSchema);
