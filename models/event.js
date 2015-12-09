var mongoose = require('mongoose'), Schema = mongoose.Schema;
var extend = require('mongoose-schema-extend');
var Mail = require('./mail');

/***************
sub-schema
****************/
var choiceSchema = new Schema({
	suggester: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}], //whom suggest this
	vote: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],  //whom vote for this
	choice: String,  //KFC, McDonald
	note: String
});

var periodSchema = new Schema({
	userId: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
	period: [{type:String}],   //the available times of user 
	note: String
});


/***************
schema
****************/
var eventSchema = new Schema({
	name: {type: String},
	types:  {type: String},
	location: {type: String},
	startDate: {type: String},
	endDate: {type: String},
	owner: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	accepted: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
	budget: {type: String},
	invited: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],
	description: {type: String},  //<100 char
	eventTime: {type: String},   //morning, night, noon
	period: [periodSchema],
	choice: [choiceSchema],
	active: {type: Boolean, default: true},
	result:{
		time: String,
		choice: String,
		attend: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
	}
}, {collection: 'event'});

var createdModifiedPlugin = require('./plugins/createdModifiedPlugin');
var deepPopulate = require('mongoose-deep-populate')(mongoose);
eventSchema.plugin(createdModifiedPlugin, { index: false });
eventSchema.plugin(deepPopulate);
/***************
Public method
****************/
eventSchema.statics.create = function (options, callback) {
	var self = this;
	options = options || {};
	var event = new self (options);
	event.save(callback);  
};

eventSchema.statics.findAll = function (options, callback) {
	options = options || {};
	if(options.action == "findEventByEmailAndPassword"){
		return this.findByConditions(options, callback);
	} else {
		return this.findByConditions(options, callback);
	}
};


eventSchema.statics.findByConditions = function (options, callback) {
	var conditions = options || {};
	var q = this.find();
	if (conditions._id != null && conditions._id != '') {
		q.where("_id").equals(conditions._id);
	}	
	q.deepPopulate("owner accepted invited period.userId choice.suggester choice.vote");
	q.exec(callback);
}; 

eventSchema.statics.findEventById = function (options, callback) {
	options = options || {};
	var conditions = {};
	conditions._id = options.id;
    this.findByConditions(conditions, function(err, events){
		if(events.length == 1){
			callback(null, events[0]);
		} else if (events.length == 0){
			callback({code: 404, message: 'recode not found'});
		} else {
			callback({code: 403, message: 'more than one recode'});
		}
	});     
};

eventSchema.statics.updateById = function (id, update, callback) {
	update = update || {};
	var self = this;
		this.update({ _id: id }, update,  function(err, noOfUpdate) {
			if (err) {
				callback(err);
			} else {
				callback(null, update);
			}
		});
};

/***************
Private method
****************/

module.exports = mongoose.model('Event', eventSchema);