/*********************************************
 * The Item Repository model
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
			"itemname": "09001@stpaul.edu.hk",
			"password": "1234",
			"picture": "",
			"isActive": 1,
			"created": "2013-08-28T00:00:00Z",
			"modified": "2013-08-28T00:00:00Z"
     }
 *********************************************/

var schemaOptions = {autoIndex: false, collection: "items", discriminatorKey : '_type'};
var itemRepositorySchema = new Schema({
	active: {type: Boolean, default: false, required: true},
	code: String,
	vendorId: {type: mongoose.Schema.Types.ObjectId, ref: 'Vendor'},
	creator: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	chiName: String,
	description: [String],
	engName: String,
	itemCode: String,
	replenishmentLevel: Number,
	supplyPeriod: String,
	unit: String,
	vendorCode: String,
	_type : {type: String, default: "Item"}
}, schemaOptions);




/*********************************************
* Using mongoose plugins here
 *********************************************/
var createdModifiedPlugin = require('../plugins/createdModifiedPlugin');
itemRepositorySchema.plugin(createdModifiedPlugin, { index: false });


/*********************************************
 * Custom Class Method (Static method)
 *********************************************/
itemRepositorySchema.statics.deleteItems = function (conditions, callback) {
	conditions = conditions || {};
	this.remove(conditions, callback);
};


/*
 * exact matching of searching criteria
 *
 * @param {Object} conditions     search criteria object, e.g. conditions = {subject: "english", classname: "2P"};
 * @param {Function} callback     return callback with 2 arguments (err, students)
 */
itemRepositorySchema.statics.findByConditions = function (options, callback) {

	// console.log("options", options);
	
	var conditions = options || {};
	
	var q = this.find();
	q.where('_type').equals('Item');
  
	if (conditions._id) {
		q.where("_id").equals(conditions._id);
	}
	
	if (typeof conditions.active != 'undefined') {
		q.where("active").equals(conditions.active);
	}
	
	if (conditions.vendorId) {
		q.where('vendorId').equals(conditions.vendorId);
	}
	
	if (conditions.vendorIds) {
		q.where('vendorId').in(conditions.vendorIds);
	}
	
	if (conditions.creator) {
		q.where('creator').equals(conditions.creator);
	}
	
	if (conditions.name) {
		var regName = new RegExp(conditions.name, "i");
		q.or([
			{chiName: regName},
			{engName: regName}
		]);
	}
	
	if (conditions.chiName) {
		q.where('chiName').equals(conditions.chiName);
	}
	
	if (conditions.description) {
		var regDescription = new RegExp(conditions.description, "i");
		q.where('description').equals(conditions.regDescription);
	}
	
	if (conditions.engName) {
		q.where('engName').equals(conditions.engName);
	}
	
	if (conditions.itemCode) {
		q.where('itemCode').equals(conditions.itemCode);
	}
	
	if (conditions.replenishmentLevel) {
		q.where('replenishmentLevel').equals(conditions.replenishmentLevel);
	}
	
	if (conditions.supplyPeriod) {
		q.where('supplyPeriod').equals(conditions.supplyPeriod);
	}
	
	if (conditions.unit) {
		q.where('unit').equals(conditions.unit);
	}
	
	if (conditions.exists) {
		q.where(conditions.exists).exists(true);
		q.where(conditions.exists).nin(["", null, [], {}]);
	}
  
	if (conditions.notExists) {
		q.where(conditions.notExists).exists(false);
	}
	
	if (conditions.populate) {
		q.populate(conditions.populate);
	}
	
	if (conditions.univeralSearch) { 
		var univeralSearch = new RegExp(conditions.univeralSearch, "i");
		var options = {};
		q.or([
			{chiName: univeralSearch},
			{engName: univeralSearch},
			{code: univeralSearch},
			{itemCode: univeralSearch}
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

/* itemRepositorySchema.statics.findByIndex = function (options, callback) {
  options = options || {};
  options.id = options._id || '';
  options.fields = options.fields || '';
  
  this.findById(options.id, options.fields, callback);
};
 */
itemRepositorySchema.statics.mapReduceItems = function (conditions, callback) {
	// console.log("conditions", conditions);
	this.mapReduce(conditions, callback);
};

// itemRepositorySchema.statics.saveItem = function (item, callback) {
	// var id = item._id || new mongoose.Types.ObjectId();
	// delete item._id;

	// this.findByIdAndUpdate(id, item, {upsert : true}, function (err, savedItem) {
		// callback(err, savedItem);
	// });
// };

itemRepositorySchema.statics.saveItem = function (item, callback) {
	var self = this;
	var id = item._id || new mongoose.Types.ObjectId();
	delete item._id;

	this.findById(id, function (err, itemRepository) {
		if (err) {
			callback(err);
		} else {
			if (itemRepository) {
				for (prop in item) {
					if (prop !== "code") {
						itemRepository[prop] = item[prop];
					}
				}
				itemRepository.itemCode = item.vendorCode + '-' + item.code;
				itemRepository.save(callback);
			} else {

				IdCounter.getNextSequenceValue({model:'Item', field: 'code'}, function(err, NextSequenceValue){
					var newItem = new self(item);
					newItem.code = NextSequenceValue;
					newItem.itemCode = item.vendorCode + '-' + NextSequenceValue;
					newItem.save(callback);
				});
			}
		}
	});
};


/* single update */
itemRepositorySchema.statics.updateItem = function (options, callback) {
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
						callback(403, "Failed to update item");
					}
				}
			});
		}
	});
};

/* multiple update */
itemRepositorySchema.statics.updateItems = function (options, callback) {
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
				self.updateItem(options, callback);
			} else {
				callback(403, "No update conditions specified");
			}			
		}
	});
};

/* Housekeeping functions */
itemRepositorySchema.statics.ensureJoinedTheGroup_AllItems = function(options, callback){
	var self = this;
	var ownerId = mongoose.Types.ObjectId(options.ownerId);
	var queryOptions = {
		groups: {
			$not: {
				$elemMatch: {
					name: "All Items"
				}
			}
		}
	};
	var updateOptions = {
		$addToSet: {
			groups: {
				name: "All Items",
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
				self.update({_id: ownerId, groups: {$elemMatch: {name: "All Items"}}}, {$set: {"groups.$.isAdmin": true}}, callback);
			} else { 
				callback("ensureJoinedTheGroup_AllItems FAILED")
			}
		}
	});
};

itemRepositorySchema.statics.updateOwnerOfTheGroup_AllItems = function(options, callback){
	var self = this;
	var ownerId = mongoose.Types.ObjectId(options.ownerId);
	var queryOptions = {
		groups: {
			$elemMatch: {
				name: "All Items"
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
			console.log("updateOwnerOfTheGroup_AllItems numberAffected", numberAffected);
			if (numberAffected > 0) {
				queryOptions._id = ownerId;
				self.update(queryOptions, {$set: {"groups.$.isAdmin": true}}, callback);
			} else {
				callback("updateOwnerOfTheGroup_AllItems FAILED");
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
//itemRepositorySchema.index({ lastName: 1, firstName: 1}, {name: "fullNameIndex"}); // schema level


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
 
var ItemRepository = mongoose.model('Item', itemRepositorySchema);
childProcessHelper.processListener(process, ItemRepository);
module.exports = ItemRepository;