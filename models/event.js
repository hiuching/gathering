var mongoose = require('mongoose'), Schema = mongoose.Schema;
var extend = require('mongoose-schema-extend');
var Mail = require('./mail');

/***************
sub-schema
****************/
var pastEventSchema = new Schema({
	code: String,
	name: String,
	role: String,
	year: Date,
	isAttended: Boolean,
	accompanyPersons: [accompanyPersonSchema]
});
/***************
schema
****************/
var eventSchema = new Schema({
	email:  {type: String},
	password: {type: String, required: true},
	displayName:  {type: String},
	noShowCount: [pastEventSchema],
	profilePic: {type: String},
	friendList: [{type: mongoose.Schema.Types.ObjectId, ref: 'Event'}]
}, {collection: 'event'});


/***************
Public method
****************/
eventSchema.statics.create = function (options, callback) {
	var self = this;
	options = options || {};
	Mail.send(options, function(err, res){
		if (err){
			callback(err);
		} else {
			self.findEventByEmail(options, function(err, event){
				if (err){
					callback(err);
				} else {
					if (event){
						event.password = options.password;
					} else {
						var event = new self (options);
					}
					event.save(callback);  
				}
			});
		}
	});
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
	if (conditions.email != null && conditions.email != '') {
		q.where("email").equals(conditions.email);
	}	
	if (conditions.password != null && conditions.password != '') {
		q.where("password").equals(conditions.password);
	}
	if (conditions.displayName != null && conditions.displayName != '') {
		q.where("displayName").equals(conditions.displayName);
	}
	if (conditions.select != null && conditions.select != '') {
		q.select(conditions.select);
	} if (!conditions.populate){
		q.populate("friendList");
	}
	
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
				delete update.password;
				callback(null, update);
			}
		});
};

/***************
Private method
****************/
var resetPassword =  function(){
    var password = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for ( var i=0; i < 8; i++ ) {
        password += possible.charAt(Math.floor(Math.random() * possible.length));
	}
    return password;
};

module.exports = mongoose.model('Event', eventSchema);