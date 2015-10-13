/*********************************************
 * The Appointment Repository model
 *
 * author: Don Lee
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
			"appointmentname": "09001@stpaul.edu.hk",
			"password": "1234",
			"picture": "",
			"isActive": 1,
			"created": "2013-08-28T00:00:00Z",
			"modified": "2013-08-28T00:00:00Z"
     }
 *********************************************/

var schemaOptions = {autoIndex: false, collection: "appointments", discriminatorKey : '_type'};
var appointmentRepositorySchema = new Schema({
	arrived: {type: Boolean, required: true, default: false},
	branch: String,
	code: String,
	date: String,
	time: String,
	status: String,
	reviewing: {type: Boolean, required: true, default: false},
	userId: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	_type : {type: String, default: "Appointment"}
}, schemaOptions);




/*********************************************
* Using mongoose plugins here
 *********************************************/
var createdModifiedPlugin = require('../plugins/createdModifiedPlugin');
appointmentRepositorySchema.plugin(createdModifiedPlugin, { index: false });


/*********************************************
 * Custom Class Method (Static method)
 *********************************************/
appointmentRepositorySchema.statics.deleteAppointments = function (conditions, callback) {
	conditions = conditions || {};
	this.remove(conditions, callback);
};


/*
 * exact matching of searching criteria
 *
 * @param {Object} conditions     search criteria object, e.g. conditions = {subject: "english", classname: "2P"};
 * @param {Function} callback     return callback with 2 arguments (err, students)
 */
appointmentRepositorySchema.statics.findByConditions = function (options, callback) {

	// console.log("options", options);

	var conditions = options || {};

	var q = this.find();
	q.where('_type').equals('Appointment');

	if (conditions._id) {
		q.where("_id").equals(conditions._id);
	}

	if (conditions.exists) {
		q.where(conditions.exists).exists(true);
		q.where(conditions.exists).nin(["", null, [], {}]);
	}

	if (typeof conditions.arrived !== 'undefined') {
		q.where("arrived").equals(conditions.arrived);
	}

	if (conditions.branch) {
		q.where('branch').equals(conditions.branch);
	}

	if (conditions.status) {
		q.where('status').equals(conditions.status);
	}

	if (conditions.statusNotEqual) {
		q.where('status').ne(conditions.statusNotEqual);
	}

	// if (conditions.date) {
		// var date = new Date(conditions.date);
		// var endDate = new Date(date);
		// endDate.setDate(endDate.getDate() + 1);
		// console.log('date', date, endDate);
		// q.where('date').gte(date);
		// q.where('date').lt(endDate);
	// }

	if (conditions.date) {
		q.where('date').equals(conditions.date);
	}

	if (conditions.afterToday) {
		q.where('date').gte(new Date().toDateFormat('yyyy-MM-dd'));
	}

	if (conditions.dateFrom && conditions.dateTo) {
		q.where('date').gte(conditions.dateFrom);
		q.where('date').lte(conditions.dateTo);
	} else if (conditions.dateFrom || conditions.dateTo) {
		var date = conditions.dateFrom || conditions.dateTo;
		q.where('date').equals(date);
	}

	if (conditions.time) {
		q.where('time').equals(conditions.time);
	}

	if (conditions.startTime && conditions.endTime) {
		q.where('time').gte(conditions.startTime);
		q.where('time').lte(conditions.endTime);
	} else if (conditions.startTime || conditions.endTime) {
		var time = conditions.startTime || conditions.endTime;
		q.where('time').equals(time);
	}

	if (conditions.userId) {
		q.where('userId').equals(conditions.userId);
	}

	if (conditions.notExists) {
		q.where(conditions.notExists).exists(false);
	}

	if (conditions.populate) {
		q.populate(conditions.populate);
	}

	if (conditions.universalSearch) {
		var universalSearch = new RegExp(conditions.universalSearch, "i");
		var options = {};
		q.or([
			{firstName: universalSearch},
			{middleName: universalSearch},
			{lastName: universalSearch},
			{"address.country": universalSearch},
			{"institution.name": universalSearch},
			{emails:{ $elemMatch: {email: universalSearch}}},
			{phones:{ $elemMatch: {number: universalSearch}}},
			{subspecialties: {$in : [universalSearch]}}
		]);
	}

	if(conditions.sort) {
		q.sort(conditions.sort);
	}

	var page = options.page;
	if (typeof page != "undefined") {
		q.sort("_id");
		var paginateOptions = {
			perPage: 10,
			delta: 9,
			page: page
		};
		q.paginate(paginateOptions, function (err, res) {
			if (err) {
				callback(err);
			} else {
				callback(null, res.results, res.count);
			}
		});
	} else {
		q.exec(callback);
	}
};

/* appointmentRepositorySchema.statics.findByIndex = function (options, callback) {
  options = options || {};
  options.id = options._id || '';
  options.fields = options.fields || '';

  this.findById(options.id, options.fields, callback);
};
 */
appointmentRepositorySchema.statics.mapReduceAppointments = function (conditions, callback) {
	var self = this;
	
	this.find().count(function (err, counter) {
		if (err) {
			callback(err);
		} else {
			if (counter > 0) {
				self.mapReduce(conditions, callback);
			} else {
				callback(null, []);
			}
		}
	}) 
	
};

// appointmentRepositorySchema.statics.saveAppointment = function (appointment, callback) {
	// var id = appointment._id || new mongoose.Types.ObjectId();
	// delete appointment._id;

	// this.findByIdAndUpdate(id, appointment, {upsert : true}, function (err, savedAppointment) {
		// callback(err, savedAppointment);
	// });
// };

appointmentRepositorySchema.statics.saveAppointment = function (appointment, callback) {
	var self = this;
	var id = appointment._id || new mongoose.Types.ObjectId();
	delete appointment._id;

	this.findById(id, function (err, appointmentRepository) {
		if (err) {
			callback(err);
		} else {
			if (appointmentRepository) {
				for (prop in appointment) {
					if (prop !== "code") {
						appointmentRepository[prop] = appointment[prop];
					}
				}
				appointmentRepository.save(callback);
			} else {

				IdCounter.getNextSequenceValue({model:'Appointment', field: 'code'}, function(err, NextSequenceValue){

					var newAppointment = new self(appointment);
					newAppointment.code = NextSequenceValue;
					newAppointment.save(callback);

				});
			}
		}
	});
};


/* single update */
appointmentRepositorySchema.statics.updateAppointment = function (options, callback) {
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
						callback(403, "Failed to update appointment");
					}
				}
			});
		}
	});
};

/* multiple update */
appointmentRepositorySchema.statics.updateAppointments = function (options, callback) {
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
				self.updateAppointment(options, callback);
			} else {
				callback(403, "No update conditions specified");
			}
		}
	});
};

/* Housekeeping functions */
appointmentRepositorySchema.statics.ensureJoinedTheGroup_AllAppointments = function(options, callback){
	var self = this;
	var ownerId = mongoose.Types.ObjectId(options.ownerId);
	var queryOptions = {
		groups: {
			$not: {
				$elemMatch: {
					name: "All Appointments"
				}
			}
		}
	};
	var updateOptions = {
		$addToSet: {
			groups: {
				name: "All Appointments",
				owner: ownerId,
				isAdmin: false,
				isMember: true,
				dateOfJoined: new Date()
			}
		}
	};
	var extraOptions = {
		multi: true,
		// upsert: true
	};
	this.update(queryOptions, updateOptions, extraOptions, function (err, numberAffected) {
		if (err) {
			callback(err);
		} else {
			if (numberAffected > 0) {
				self.update({_id: ownerId, groups: {$elemMatch: {name: "All Appointments"}}}, {$set: {"groups.$.isAdmin": true}}, callback);
			} else {
				callback("ensureJoinedTheGroup_AllAppointments FAILED")
			}
		}
	});
};

appointmentRepositorySchema.statics.updateOwnerOfTheGroup_AllAppointments = function(options, callback){
	var self = this;
	var ownerId = mongoose.Types.ObjectId(options.ownerId);
	var queryOptions = {
		groups: {
			$elemMatch: {
				name: "All Appointments"
			}
		}
	};
	var updateOptions = {
		$set: {
			"groups.$.owner": ownerId
		}
	};
	this.update(queryOptions, updateOptions, {multi: true}, function (err, numberAffected) {
		if (err) {
			callback(err);
		} else {
			console.log("updateOwnerOfTheGroup_AllAppointments numberAffected", numberAffected);
			if (numberAffected > 0) {
				queryOptions._id = ownerId;
				self.update(queryOptions, {$set: {"groups.$.isAdmin": true}}, callback);
			} else {
				callback("updateOwnerOfTheGroup_AllAppointments FAILED");
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
//appointmentRepositorySchema.index({ lastName: 1, firstName: 1}, {name: "fullNameIndex"}); // schema level


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

var AppointmentRepository = mongoose.model('Appointment', appointmentRepositorySchema);
childProcessHelper.processListener(process, AppointmentRepository);
module.exports = AppointmentRepository;
