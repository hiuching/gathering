/*********************************************
 * The DailySetting Repository model
 *
 * author: Hillary Wong
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
 
 

 /*********************************************
 * Include Helpers
 *********************************************/
var arrayHelper = require('../../lib/arrayHelper');
var childProcessHelper = require('../../lib/childProcessHelper');
var encryption = require('../../lib/encryption');
var objectHelper = require('../../lib/objectHelper');
var IdCounter = require('../plugins/idCounterPlugin');

var extend = require('mongoose-schema-extend');
var mongoose = require('mongoose'), Schema = mongoose.Schema;
var moment = require('moment');
require("mongoose-query-paginate");

/*********************************************
 * Include Class
 *********************************************/

/*********************************************
 * CONSTANT declaration
 *********************************************/

/*********************************************
 * Sub-document Schema
 *********************************************/

/*********************************************
 * Main Schema
 * 
 * e.g. 
     {
			"lastName": "Chan",
			"firstName": "Ting",
			"className": "2C",
			"studentNum": "09001",
			"phones": [{"label": "home", "country":852,  "28880060"}, {"mobile":"98765432"}],
			"addresses": [],
			"emails": [],
			"subjects": ["English", "Mathematics"],
			"vendorname": "09001@stpaul.edu.hk",
			"password": "1234",
			"picture": "",
			"isActive": 1,
			"created": "2013-08-28T00:00:00Z",
			"modified": "2013-08-28T00:00:00Z"
     }
 *********************************************/

var schemaOptions = {autoIndex: false, collection: "dailySetting", discriminatorKey : '_type'};
var dailySettingRepositorySchema = new Schema({
	code: {type: Number},
	date: {type: Date},
	numOfAppointment: {type: Number},
	numOfBookedAppointments: {type: Number},
	openingTime:{type: String},
	closingTime:{type: String},
	branch:{type: String},
	creator: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	_type : {type: String, default: "dailySetting"}
}, schemaOptions);




/*********************************************
* Using mongoose plugins here
 *********************************************/
var createdModifiedPlugin = require('../plugins/createdModifiedPlugin');
dailySettingRepositorySchema.plugin(createdModifiedPlugin, { index: false });

/*********************************************
 * Custom Class Method (Static method)
 *********************************************/

dailySettingRepositorySchema.statics.deleteDailySettings = function (conditions, callback) {
	conditions = conditions || {};
	this.remove(conditions, callback);
};


/*
 * exact matching of searching criteria
 *
 * @param {Object} conditions     search criteria object, e.g. conditions = {subject: "english", classname: "2P"};
 * @param {Function} callback     return callback with 2 arguments (err, students)
 */
dailySettingRepositorySchema.statics.findByConditions = function (options, callback) {

	//console.log("options", options);
	var conditions = options || {};
	
	var q = this.find();
	q.where('_type').equals('dailySetting');
  
	if (conditions._id) {
		q.where("_id").equals(conditions._id);
	}
	
	if (conditions.date) {
		var date = new Date(conditions.date);
		var start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
		var end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
		
		q.where('date').gte(start);
		q.where('date').lte(end);
	}
	
	if (conditions.dateFrom && conditions.dateTo) {
		q.where('date').gte(conditions.dateFrom);
		q.where('date').lte(conditions.dateTo);
	}
	
	if (conditions.numOfApponintment) {
		q.where("numOfApponintment").equals(conditions.numOfApponintment);
	}
	
	if (conditions.openingTime) {
		q.where("openingTime").equals(conditions.openingTime);
	}
	
	if (conditions.closingTime) {
		q.where("closingTime").equals(conditions.closingTime);
	}
	
	if (typeof conditions.afterToday != 'undefined') {
		q.where('date').gt(new Date().toDateFormat('yyyy-MM-dd'));
	}
	
	if (typeof conditions.oneDayAfter != 'undefined') {
		q.where('date').gte(moment().add(1, 'day').format('YYYY-MM-DD'));
	}
	
	if (conditions.creator) {
		q.where("creator").equals(conditions.creator);
	}
	
	if (conditions.numOfBookedAppointments){
		q.where("numOfBookedAppointments").equals(conditions.numOfBookedAppointments);
	}
	
	if(conditions.sort) {
		q.sort(conditions.sort);
	}
	
	q.exec(callback);
};


dailySettingRepositorySchema.statics.mapReduceDailySettings = function (conditions, callback) {
	this.mapReduce(conditions, callback);
};

dailySettingRepositorySchema.statics.saveDailySetting = function (dailySetting, callback) {
	var self = this;
	var id = dailySetting._id || new mongoose.Types.ObjectId();
	delete dailySetting._id;

	this.findById(id, function (err, dailySettingRepository) {
		if (err) {
			callback(err);
		} else {
			if (dailySettingRepository) {
				for (prop in dailySetting) {
					if (prop !== "code") {
						dailySettingRepository[prop] = dailySetting[prop];
					}
				}
				dailySettingRepository.save(callback);
			} else {
				IdCounter.getNextSequenceValue({model:'DailySetting', field: 'code'}, function(err, NextSequenceValue){

					var newDailySetting = new self(dailySetting);
					newDailySetting.code = NextSequenceValue;
					newDailySetting.save(callback);
						
				});
			}
		}
	});
};


/* single update */
dailySettingRepositorySchema.statics.updateDailySetting = function (options, callback) {
	var self = this;
	validateUpdateOptions(options, function (err, options) {
		if (err) {
			callback(err);
		} else {
			options.conditions = options.conditions || {};
			options.update = options.update || {};
			if(options.update.code){
				delete update.code;
			}
			options.options = options.options || {
				/* upsert : true */
			};
			self.update(options.conditions, options.update, options.options, function (err, numberAffected) {
				if (err) {
					callback(err);
				} else {
					if (numberAffected > 0) {
						callback(null, numberAffected);
					} else {
						callback(403, "Failed to update dailySetting");
					}
				}
			});
		}
	});
};

/* multiple update */
dailySettingRepositorySchema.statics.updateDailySettings = function (options, callback) {
	var self = this;
	validateUpdateOptions(options, function (err, options) {
		if (err) {
			callback(err);
		} else {
			options.options = options.options || {
				multi : true
			};
			
			var conditions = {};
			if (options.conditions.key == "_id") {
				conditions._id = {$in: options.conditions.value};
			}
			options.conditions = conditions;
			if(options.conditions.code){
				delete conditions.code;
			}
			if (!objectHelper.isEmptyObject(options.conditions)) {
				self.updateDailySetting(options, callback);
			} else {
				callback(403, "No update conditions specified");
			}			
		}
	});
};




/*********************************************
 * Custom instance Method
 *********************************************/



/*********************************************
 * Schema level indexes (compound index)
 * When creating an index, the number associated with a key specifies the direction of the index. The options are 1 (ascending) and -1 (descending)
 *********************************************/
//dailySettingRepositorySchema.index({ lastName: 1, firstName: 1}, {name: "fullNameIndex"}); // schema level


/*********************************************
 * Virtual property getter (not persistent in DB)
 *********************************************/




/*********************************************
 * Virtual property setter
 *********************************************/
 
/*********************************************
 * helper functions
 *********************************************/
var validateUpdateOptions = function (options, callback) {
	if (typeof options !== "object" || objectHelper.isEmptyObject(options)) {
		callback("options must be a valid object");
	} else {
		/* more logic to be implemented */
		callback(null, options);
	}
};

/*********************************************
 * Export as a module
 *********************************************/
 
var DailySettingRepository = mongoose.model('dailySetting', dailySettingRepositorySchema);
childProcessHelper.processListener(process, DailySettingRepository);
module.exports = DailySettingRepository;