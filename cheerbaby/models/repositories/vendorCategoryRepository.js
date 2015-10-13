/*********************************************
 * The VendorCategory Repository model
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
var contactSchema = new Schema({
	name: String,
	phone: String
});

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
			"vendorCategoryname": "09001@stpaul.edu.hk",
			"password": "1234",
			"picture": "",
			"isActive": 1,
			"created": "2013-08-28T00:00:00Z",
			"modified": "2013-08-28T00:00:00Z"
     }
 *********************************************/

var schemaOptions = {autoIndex: false, collection: "vendorCategories", discriminatorKey : '_type'};
var vendorCategoryRepositorySchema = new Schema({
	name: String,
	active: {type: Boolean, default: true, required: true},
	code: String,
	_type : {type: String, default: "VendorCategory"}
}, schemaOptions);




/*********************************************
* Using mongoose plugins here
 *********************************************/
var createdModifiedPlugin = require('../plugins/createdModifiedPlugin');
vendorCategoryRepositorySchema.plugin(createdModifiedPlugin, { index: false });


/*********************************************
 * Custom Class Method (Static method)
 *********************************************/

/* 
 * Input: vendorCategories - An array of vendorCategories object to be saved
 */
vendorCategoryRepositorySchema.statics.batchImport = function (options, callback) {
	var self = this;
	var noOfSuccessfulImport = 0;
	var noOfCreatedVendorCategory = 0;
	var noOfUpdatedVendorCategory = 0;
	var vendorCategories = options.vendorCategories;
	var skipCheckExist = options.skipCheckExist || false;
	var filterVendorCategory;
	if (skipCheckExist) {
		filterVendorCategory = function (vendorCategory, done) {
			if (vendorCategory) {
				self.saveVendorCategory(vendorCategory, function (err, importedVendorCategory) {
					if (err) {
						done(err);
					} else {
						noOfCreatedVendorCategory++;
						noOfSuccessfulImport++;
						done(null, importedVendorCategory);
					}
				});
			} else {
				done("Invalid import vendorCategory object");
			}
		};
	} else {
		filterVendorCategory = function (vendorCategory, done) {
			if (vendorCategory) {
				self.findByConditions({vendorCategoryname: vendorCategory.vendorCategoryname}, function (err, vendorCategories) {
					if (err) {
						done(err);
					} else {
						if (vendorCategories.length > 1) {
							done("More than one vendorCategories");
						} else {
							if (vendorCategories.length == 1) {
								noOfUpdatedVendorCategory++;
								vendorCategory._id = vendorCategories[0]._id; // for query in saveVendorCategory method to update the existing document
								objectHelper.deleteProperties(vendorCategory, [
									"password",
									"isActivated",
									"verificationCode",
									"groups",
									"code"
								]); // prevent from being updated with default values when new VendorCategory()
							} else {
								noOfCreatedVendorCategory++;
							}
							self.saveVendorCategory(vendorCategory, function (err, importedVendorCategory) {
								if (err) {
									callback(err);
								} else {
									noOfSuccessfulImport++;
									done(null, importedVendorCategory);
								}
							});
						}
					}
				});
			} else {
				done("Invalid import vendorCategory object");
			}
		};
	}
	
	// "vendorCategories" contains JS objects(child process) or VendorCategory objects
	arrayHelper.walkArray(vendorCategories, {}, filterVendorCategory, function (err, importedVendorCategories) {
		if (err) {
			callback(err);
		} else {
			var importResult = {
				noOfSuccessfulImport: noOfSuccessfulImport,
				noOfCreatedVendorCategory: noOfCreatedVendorCategory,
				noOfUpdatedVendorCategory: noOfUpdatedVendorCategory
			};
			callback(null, importResult);
		}
	});
};

vendorCategoryRepositorySchema.statics.deleteVendorCategories = function (conditions, callback) {
	conditions = conditions || {};
	this.remove(conditions, callback);
};


/*
 * exact matching of searching criteria
 *
 * @param {Object} conditions     search criteria object, e.g. conditions = {subject: "english", classname: "2P"};
 * @param {Function} callback     return callback with 2 arguments (err, students)
 */
vendorCategoryRepositorySchema.statics.findByConditions = function (options, callback) {

	// console.log("options", options);
	
	var conditions = options || {};
	
	var q = this.find();
	q.where('_type').equals('VendorCategory');
  
	if (conditions._id) {
		q.where("_id").equals(conditions._id);
	}
	
	if (conditions.exists) {
		q.where(conditions.exists).exists(true);
		q.where(conditions.exists).nin(["", null, [], {}]);
	}
	
	if (typeof conditions.publish !== 'undefined') {
		q.where("publish").equals(conditions.publish);
	}
	
	if (typeof conditions.active !== 'undefined') {
		q.where("active").equals(conditions.active);
	}
	
	if (conditions.name) {
		var nameLike = new RegExp(conditions.name, "i");
		q.where('name').equals(nameLike);
	}
	
	if (conditions.notExists) {
		q.where(conditions.notExists).exists(false);
	}
	
	
	if (conditions.univeralSearch) { 
		var univeralSearch = new RegExp(conditions.univeralSearch, "i");
		var options = {};
		q.or([
			{name: univeralSearch},
			{shortName: univeralSearch},
			{"contact.phone": univeralSearch},
			{"contact.name": univeralSearch}
			// {contact:{ $elemMatch: {name: univeralSearch}}}   //example
		]);
	}
  
	if (conditions.vendorCategoryIds) {
		q.where("_id").in(conditions.vendorCategoryIds);
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

/* vendorCategoryRepositorySchema.statics.findByIndex = function (options, callback) {
  options = options || {};
  options.id = options._id || '';
  options.fields = options.fields || '';
  
  this.findById(options.id, options.fields, callback);
};
 */
vendorCategoryRepositorySchema.statics.mapReduceVendorCategories = function (conditions, callback) {
	// console.log("conditions", conditions);
	this.mapReduce(conditions, callback);
};

// vendorCategoryRepositorySchema.statics.saveVendorCategory = function (vendorCategory, callback) {
	// var id = vendorCategory._id || new mongoose.Types.ObjectId();
	// delete vendorCategory._id;

	// this.findByIdAndUpdate(id, vendorCategory, {upsert : true}, function (err, savedVendorCategory) {
		// callback(err, savedVendorCategory);
	// });
// };

vendorCategoryRepositorySchema.statics.saveVendorCategory = function (vendorCategory, callback) {
	var self = this;
	var id = vendorCategory._id || new mongoose.Types.ObjectId();
	delete vendorCategory._id;

	this.findById(id, function (err, vendorCategoryRepository) {
		if (err) {
			callback(err);
		} else {
			if (vendorCategoryRepository) {
				for (prop in vendorCategory) {
					if (prop !== "code") {
						vendorCategoryRepository[prop] = vendorCategory[prop];
					}
				}
				vendorCategoryRepository.save(callback);
			} else {

				IdCounter.getNextSequenceValue({model:'VendorCategory', field: 'code'}, function(err, NextSequenceValue){

					var newVendorCategory = new self(vendorCategory);
					newVendorCategory.code = NextSequenceValue;
					newVendorCategory.save(callback);
						
				});
			}
		}
	});
};


/* single update */
vendorCategoryRepositorySchema.statics.updateVendorCategory = function (options, callback) {
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
						callback(403, "Failed to update vendorCategory");
					}
				}
			});
		}
	});
};

/* multiple update */
vendorCategoryRepositorySchema.statics.updateVendorCategories = function (options, callback) {
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
				self.updateVendorCategory(options, callback);
			} else {
				callback(403, "No update conditions specified");
			}			
		}
	});
};

/* Housekeeping functions */
vendorCategoryRepositorySchema.statics.ensureJoinedTheGroup_AllVendorCategories = function(options, callback){
	var self = this;
	var ownerId = mongoose.Types.ObjectId(options.ownerId);
	var queryOptions = {
		groups: {
			$not: {
				$elemMatch: {
					name: "All VendorCategories"
				}
			}
		}
	};
	var updateOptions = {
		$addToSet: {
			groups: {
				name: "All VendorCategories",
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
				self.update({_id: ownerId, groups: {$elemMatch: {name: "All VendorCategories"}}}, {$set: {"groups.$.isAdmin": true}}, callback);
			} else { 
				callback("ensureJoinedTheGroup_AllVendorCategories FAILED")
			}
		}
	});
};

vendorCategoryRepositorySchema.statics.updateOwnerOfTheGroup_AllVendorCategories = function(options, callback){
	var self = this;
	var ownerId = mongoose.Types.ObjectId(options.ownerId);
	var queryOptions = {
		groups: {
			$elemMatch: {
				name: "All VendorCategories"
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
			console.log("updateOwnerOfTheGroup_AllVendorCategories numberAffected", numberAffected);
			if (numberAffected > 0) {
				queryOptions._id = ownerId;
				self.update(queryOptions, {$set: {"groups.$.isAdmin": true}}, callback);
			} else {
				callback("updateOwnerOfTheGroup_AllVendorCategories FAILED");
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
//vendorCategoryRepositorySchema.index({ lastName: 1, firstName: 1}, {name: "fullNameIndex"}); // schema level


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
 
var VendorCategoryRepository = mongoose.model('VendorCategory', vendorCategoryRepositorySchema);
childProcessHelper.processListener(process, VendorCategoryRepository);
module.exports = VendorCategoryRepository;