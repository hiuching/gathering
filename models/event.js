var mongoose = require('mongoose'), Schema = mongoose.Schema;
var extend = require('mongoose-schema-extend');
var Mail = require('./mail');
var User = require('./user');
var moment = require('moment');
var arrayHelper = require('../lib/arrayHelper');
/***************
sub-schema
****************/
var choiceSchema = new Schema({
	userId: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}],  //whom vote for this
	suggestion: String  //KFC, McDonald
});

var periodSchema = new Schema({
	userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	period: [{type:String}]   //the available times of user, e.g.['15/03/2016', '16/03/2016']
});


/***************
schema
****************/
var eventSchema = new Schema({
	name: {type: String, required: true, trim: true},
	types:  {type: String, required: true},
	location: {type: String, required: true},
	startDate: {type: String, trim: true},
	endDate: {type: String, trim: true},
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
		date: String,
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
eventSchema.statics.chooseSuggestion = function (id, update, callback) {
	var self = this;
	update.choice =  update.choice || {};
	this.findEventByIdWithoutPopulate({id: id}, function(err, event){
		if(err){
			callback(err);
		} else {
			event = new self(event);
			var choiceExist = false;
			event.choice.forEach(function(choice, index){
				if(choice.userId.indexOf(update.userId)!=-1){
					choiceExist = true;
				}
			});
			if (!choiceExist){
				event.choice.forEach(function(choice, index){
					if(choice.suggestion == update.suggestion){
						choice.userId.push(update.userId);
					}
				});
				self.update({ _id: id }, event,  function(err, noOfUpdate) {
					if (err) {
						callback(err);
					} else {
						callback(null, update);
					}
				});
			} else {
				callback({code: 403, message: 'user already vote'});
			}
		}
	});    
};

eventSchema.statics.create = function (options, callback) {
	var self = this;
	options = options || {};
	validateEvent(options, function(err, data){
		if(err){
			callback(err);
		} else {
			var event = new self (data);
			event.accepted = event.invited;
			event.save(function(err, savedEvent){
				if(err){
					callback(err);
				} else {
					self.findEventById({id: savedEvent._id}, function(err, foundEvent){
						if(err){
							callback(err);
						} else {
							var emails = [];
							foundEvent.invited.forEach(function(user){
								emails.push(user.email);
							})
							var mailOption = {
								email: emails,
								subject: foundEvent.owner.displayName + " invite you to attend " + event.name,
								html: "<div>You have a new invitation. Event details: </div><div>name: " + event.name + "</div><div>location: " + event.location + "</div><div>types: " + event.types + "</div><div>Date: " + event.startDate + " - " +  event.endDate + "</div><div>Please reply your available date within 2 days.",
							}
							Mail.send(mailOption, function(err){
								if(err){
									callback(err);
								} else {
									callback(null, event);		
								}
							});
						}
					});
				}
			});  
		}
	});
};

eventSchema.statics.findAll = function (options, callback) {
	options = options || {};
	if(options.action == "findEventByInvolvedUser"){
		return this.findEventByInvolvedUser(options, callback);
	} else if(options.action == "findEventById"){
		return this.findEventById(options, callback);
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
	if(conditions.expire != null){
		var expire = conditions.expire;
		q.where("created").equals(conditions.expire);
	}
	if (conditions.user!= null && conditions.user != ''){
		q.or([
			// {"invited": {$in: [conditions.user]}},
			{"accepted": {$in: [conditions.user]}},
			{"owner": conditions.user}
		]);
	}
	if (!conditions.populate){
		q.deepPopulate("owner accepted invited result.attend period.userId choice.userId");
	}
	q.sort({"created": -1})
	q.exec(callback);
}; 

eventSchema.statics.findEventById = function (options, callback) {
	options = options || {};
	var conditions = {};
	conditions._id = options.id;
    this.findByConditions(conditions, function(err, events){
		if (err){
			callback(err);
		} else if(events.length == 1){
			callback(null, events[0]);
		} else if (events.length == 0){
			callback({code: 404, message: 'recode not found'});
		} else {
			callback({code: 403, message: 'more than one recode'});
		}
	});     
};

eventSchema.statics.findEventByIdWithoutPopulate = function (options, callback) {
	options = options || {};
	var conditions = {};
	conditions._id = options.id;
	conditions.populate = true;
    this.findByConditions(conditions, function(err, events){
		if (err){
			callback(err);
		} else if(events.length == 1){
			callback(null, events[0]);
		} else if (events.length == 0){
			callback({code: 404, message: 'recode not found'});
		} else {
			callback({code: 403, message: 'more than one recode'});
		}
	});     
};

eventSchema.statics.findEventByInvolvedUser = function (options, callback) {
	options = options || {};
	var conditions = {};
	conditions.user = options.user;
    this.findByConditions(conditions, function(err, events){
		if (err){
			callback(err);
		} else {
			callback(null, events);
		}
	});     
};

eventSchema.statics.getResult = function () {
	var self = this;
	var conditions = {};
	var expire = new Date();
	expire = expire.setDate(expire.getDate() - 2);
	conditions.expire = {$lt: expire};
	conditions.active = true;
	// var conditions = {
		// _id: id
	// }
	this.findByConditions(conditions, function(err, array){
	
		var update = function(item, done){
			var Item = new self(item);
			var result = item.result || {};
			var obj = {};
			var votedPeople = [];
			var startDate = moment(item.startDate);
			var endDate = moment(item.endDate).add(1, 'day');
			var dateStr = '';
			if(! (result.date && result.date == '')){
				/*prepare obj*/
				for(var i = startDate; startDate.isBefore(endDate, 'day'); startDate.add(1, 'day')){ //compare in day
					
					dateStr = startDate.format('YYYY-MM-DD');
					obj[dateStr] = [];
				}
				/*prepare period result*/
				item.period.forEach(function(period, index){
					period.period.forEach(function(date){
						obj[date].push(period.userId);
						votedPeople.push(period.userId);
					});
				});
				
				var max = 0;
				for (var prop in obj) {
					if(obj[prop].length > max){
						max = obj[prop].length;
						result.date = prop;
						result.attend = obj[prop];
					}
				}
				item.accepted.forEach(function(user){
					if(votedPeople.indexOf(user) == -1){
						User.incrementNoShowCount(user);
					}
				});
				
				/*confirm choice result if only one suggest*/
				if (item.choice.length == 1){
					result.choice = item.choice[0].suggestion;
					Item.active = false;
				}
			}
			var voteExpire = new Date();
			voteExpire.setDate(voteExpire.getDate() - 4);
			
			/*confirm choice result after 4 day*/
			if (item.created.getTime() < voteExpire.getTime()){
				if(!(item.result.choice && item.result.choice != '')){
					var maxVote = 0;
					item.choice.forEach(function(choice){
				
						if(choice.userId.length >= maxVote){
							maxVote = choice.userId.length;
							result.choice = choice.suggestion;
							Item.active = false;
						}
					});
				}
			}
			
			Item.result = result;
			self.update({ _id: Item._id}, Item,  function(err, noOfUpdate) {
				if (err) {
					done(err);
				} else {
					done(null, result);
				}
			});
		};
		arrayHelper.walkArray(array, {}, update, function(err, records){
			return;
		});
	});        
};

eventSchema.statics.reject = function (id, update, callback) {
	var self = this;
	this.findEventByIdWithoutPopulate({id: id}, function(err, event){
		if(err){
			callback(err);
		} else {
			event = new self(event);
			event.accepted.forEach( function(user, index){
				if (update.reject == user){
					event.accepted.splice(index, 1);
				}
			});
			self.update({ _id: id }, event,  function(err, noOfUpdate) {
				if (err) {
					callback(err);
				} else {
					callback(null, update);
				}
			});
		}
	});     
};

eventSchema.statics.votePeriod = function (id, update, callback) {
	var self = this;
	update.period =  update.period || {};
	update.choice =  update.choice || {};
	this.findEventByIdWithoutPopulate({id: id}, function(err, event){
		if(err){
			callback(err);
		} else {
			event = new self(event);
			var periodExist = false;
			event.period.forEach(function(period, index){
				if(period.userId == update.period.userId){
					periodExist = true;
				}
			});
			if (!periodExist){
				event.period.push(update.period);

				var choiceExist = false;
				update.choice.suggestion = update.choice.suggestion.trim();
				event.choice.forEach(function(choice, index){
					if(choice.suggestion.toLowerCase() == update.choice.suggestion.toLowerCase()){
						choiceExist = true;
					}
				});
				if (!choiceExist){
					event.choice.push(update.choice);
				}
				self.update({ _id: id }, event,  function(err, noOfUpdate) {
					if (err) {
						callback(err);
					} else {
						callback(null, update);
					}
				});
			} else {
				callback({code: 403, message: 'user already vote'});
			}
		}
	});    
};

eventSchema.statics.updateById = function (id, update, callback) {
	update = update || {};
	var self = this;
	if (update.action == 'reject'){
		return	this.reject(id, update, callback);
	}	else if (update.action == 'getResult'){
		return	this.getResult(id, update, callback);
	}	else if (update.action == 'choice'){
		return	this.chooseSuggestion(id, update, callback);
	} else if (update.action == 'period'){
		return	this.votePeriod(id, update, callback);
	} else {
		return	this.updateEvent(id, update, callback);
	}
};

eventSchema.statics.updateEvent = function (id, update, callback) {
	var self = this;
	this.update({ _id: id}, update,  function(err, noOfUpdate) {
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
var validateEvent = function(options, callback){
	options = options || {};
	if (options.name && options.name != ''){
		if (options.location && options.location != '' ){
			if(options.invited && options.invited.length > 0 ){
				if(options.startDate && options.startDate != '' && options.endDate && options.endDate != '' && (options.startDate <= options.endDate) ){
					if(options.choice && options.choice.length > 0 && options.choice[0].suggestion != ''){
						callback(null, options);
					} else {
						callback({code: 403, message: 'invaild choice'});
					}
				} else {
					callback({code: 403, message: 'invaild startDate/endDate'});
				}
			} else {
				callback({code: 403, message: 'no invited person'});
			}
		} else {
				callback({code: 403, message: 'invaild location'});
		}
	} else {
				callback({code: 403, message: 'no invited name'});
	}
};

module.exports = mongoose.model('Event', eventSchema);