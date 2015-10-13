/*********************************************
 * The Inventory Repository model
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
			"inventoryname": "09001@stpaul.edu.hk",
			"password": "1234",
			"picture": "",
			"isActive": 1,
			"created": "2013-08-28T00:00:00Z",
			"modified": "2013-08-28T00:00:00Z"
     }
 *********************************************/

var schemaOptions = {autoIndex: false, collection: "inventorys", discriminatorKey : '_type'};
var inventoryRepositorySchema = new Schema({
	code: String,
	creator: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
	date: Date,
	effectiveDate: Date,
	itemId: {type: mongoose.Schema.Types.ObjectId, ref: 'Item'},
	quantity: String,
	remarks: [String],
	reasons: String,
	transferReasonsText: String,
	otherReasonsText: String,
	receiptNo: String,
	responsibleFor: String,
	branch: String,
	_type : {type: String, default: "Inventory"}
}, schemaOptions);




/*********************************************
* Using mongoose plugins here
 *********************************************/
var createdModifiedPlugin = require('../plugins/createdModifiedPlugin');
inventoryRepositorySchema.plugin(createdModifiedPlugin, { index: false });


/*********************************************
 * Custom Class Method (Static method)
 *********************************************/
inventoryRepositorySchema.statics.deleteInventorys = function (conditions, callback) {
	conditions = conditions || {};
	this.remove(conditions, callback);
};


/*
 * exact matching of searching criteria
 *
 * @param {Object} conditions     search criteria object, e.g. conditions = {subject: "english", classname: "2P"};
 * @param {Function} callback     return callback with 2 arguments (err, students)
 */
inventoryRepositorySchema.statics.findByConditions = function (options, callback) {

	// console.log("options", options);

	var conditions = options || {};

	var q = this.find();
	q.where('_type').equals('Inventory');

	if (conditions._id) {
		q.where("_id").equals(conditions._id);
	}

	if (conditions.exists) {
		q.where(conditions.exists).exists(true);
		q.where(conditions.exists).nin(["", null, [], {}]);
	}

	if (conditions.code) {
		q.where('code').equals(conditions.code);
	}

	if (conditions.creator) {
		q.where('creator').equals(conditions.creator);
	}

	if (conditions.effectiveDate) {
		q.where('effectiveDate').equals(conditions.effectiveDate);
	}

	if (conditions.month) {
		var month = new Date(conditions.month).wholeMonth(conditions.month);

		q.where('date').gte(month.from);
		q.where('date').lte(month.to);
	}

	if (conditions.itemId) {
		q.where('itemId').equals(conditions.itemId);
	}

	if (conditions.quantity) {
		q.where('quantity').equals(conditions.quantity);
	}

	if (conditions.remarks) {
		var regRemarks = new RegExp(conditions.remarks, "i");
		q.where('remarks').equals(conditions.remarks);
	}

	if (conditions.reasons) {
		if (typeof conditions.reasons == 'string') {
			q.where('reasons').equals(conditions.reasons);
		} else {
			q.where('reasons').in(conditions.reasons);
		}
	}

	if (conditions.reasonsText) {
		var regReasonsText = new RegExp(conditions.reasonsText, "i");
		q.where('reasonsText').equals(conditions.regReasonsText);
	}

	if (conditions.receiptNo) {
		q.where('receiptNo').equals(conditions.receiptNo);
	}

	if (conditions.responsibleFor) {
		q.where('responsibleFor').equals(conditions.responsibleFor);
	}

	if (conditions.date) {
		var date = new Date(conditions.date);
		var start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
		var end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

		q.where('date').gte(start);
		q.where('date').lte(end);
	}

	if (conditions.dateFrom && conditions.dateTo) {
		var dateFrom = new Date(options.dateFrom);
		var dateTo = new Date(options.dateTo);
		var start = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate(), 0, 0, 0);
		var end = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59);

		q.where('date').gte(start);
		q.where('date').lte(end);
	} else if (conditions.dateFrom || conditions.dateTo) {
		var date = new Date(conditions.dateFrom) || new Date(conditions.dateTo);
		var start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
		var end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
		q.where('date').gte(start);
		q.where('date').lte(end);
	}

	if (conditions.branch) {
		q.where('branch').equals(conditions.branch);
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
			{firstName: univeralSearch},
			{middleName: univeralSearch},
			{lastName: univeralSearch},
			{"address.country": univeralSearch},
			{"institution.name": univeralSearch},
			{emails:{ $elemMatch: {email: univeralSearch}}},
			{phones:{ $elemMatch: {number: univeralSearch}}},
			{subspecialties: {$in : [univeralSearch]}}
		]);
	}

	if (typeof conditions.stockIn !== 'undefined') {
		q.where("reasons").equals('');
	}

	if (typeof conditions.stockOut !== 'undefined') {
		q.where("reasons").ne('');
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

/* inventoryRepositorySchema.statics.findByIndex = function (options, callback) {
  options = options || {};
  options.id = options._id || '';
  options.fields = options.fields || '';

  this.findById(options.id, options.fields, callback);
};
 */
inventoryRepositorySchema.statics.mapReduceInventories = function (conditions, callback) {
	// console.log("conditions", conditions);
	this.mapReduce(conditions, callback);
};

// inventoryRepositorySchema.statics.saveInventory = function (inventory, callback) {
	// var id = inventory._id || new mongoose.Types.ObjectId();
	// delete inventory._id;

	// this.findByIdAndUpdate(id, inventory, {upsert : true}, function (err, savedInventory) {
		// callback(err, savedInventory);
	// });
// };

inventoryRepositorySchema.statics.saveInventory = function (inventory, callback) {
	var self = this;
	var id = inventory._id || new mongoose.Types.ObjectId();
	delete inventory._id;

	this.findById(id, function (err, inventoryRepository) {
		if (err) {
			callback(err);
		} else {
			if (inventoryRepository) {
				for (prop in inventory) {
					if (prop !== "code") {
						inventoryRepository[prop] = inventory[prop];
					}
				}
				inventoryRepository.save(callback);
			} else {

				IdCounter.getNextSequenceValue({model:'Inventory', field: 'code'}, function(err, NextSequenceValue){

					var newInventory = new self(inventory);
					newInventory.code = NextSequenceValue;
					newInventory.save(callback);

				});
			}
		}
	});
};


/* single update */
inventoryRepositorySchema.statics.updateInventory = function (options, callback) {
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
						callback(403, "Failed to update inventory");
					}
				}
			});
		}
	});
};

/* multiple update */
inventoryRepositorySchema.statics.updateInventorys = function (options, callback) {
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
				self.updateInventory(options, callback);
			} else {
				callback(403, "No update conditions specified");
			}
		}
	});
};

/* Housekeeping functions */
inventoryRepositorySchema.statics.ensureJoinedTheGroup_AllInventorys = function(options, callback){
	var self = this;
	var ownerId = mongoose.Types.ObjectId(options.ownerId);
	var queryOptions = {
		groups: {
			$not: {
				$elemMatch: {
					name: "All Inventorys"
				}
			}
		}
	};
	var updateOptions = {
		$addToSet: {
			groups: {
				name: "All Inventorys",
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
				self.update({_id: ownerId, groups: {$elemMatch: {name: "All Inventorys"}}}, {$set: {"groups.$.isAdmin": true}}, callback);
			} else {
				callback("ensureJoinedTheGroup_AllInventorys FAILED")
			}
		}
	});
};

inventoryRepositorySchema.statics.updateOwnerOfTheGroup_AllInventorys = function(options, callback){
	var self = this;
	var ownerId = mongoose.Types.ObjectId(options.ownerId);
	var queryOptions = {
		groups: {
			$elemMatch: {
				name: "All Inventorys"
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
			console.log("updateOwnerOfTheGroup_AllInventorys numberAffected", numberAffected);
			if (numberAffected > 0) {
				queryOptions._id = ownerId;
				self.update(queryOptions, {$set: {"groups.$.isAdmin": true}}, callback);
			} else {
				callback("updateOwnerOfTheGroup_AllInventorys FAILED");
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
//inventoryRepositorySchema.index({ lastName: 1, firstName: 1}, {name: "fullNameIndex"}); // schema level


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

var InventoryRepository = mongoose.model('Inventory', inventoryRepositorySchema);
childProcessHelper.processListener(process, InventoryRepository);
module.exports = InventoryRepository;
