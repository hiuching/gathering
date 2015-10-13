/*********************************************
 * The Vendor Repository model
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
			"vendorname": "09001@stpaul.edu.hk",
			"password": "1234",
			"picture": "",
			"isActive": 1,
			"created": "2013-08-28T00:00:00Z",
			"modified": "2013-08-28T00:00:00Z"
     }
 *********************************************/

var schemaOptions = {autoIndex: false, collection: "vendors", discriminatorKey : '_type'};
var vendorRepositorySchema = new Schema({
	active: {type: Boolean, required: true, default: true},
	businessRegistrationNumber: String,
	categoryId: {type: mongoose.Schema.Types.ObjectId, ref: 'VendorCategory'},
	contactList: [{
		label: String,
		address: String,
		dataTransfer: [String],
		department: String,
		email: String,
		fax: String,
		mobile: String,
		name: String,
		phone: String,
		position: String,
		dataTransferOthers: String
	}],
	contract: {
		cooperationPeriod: String,
		service: String,
		fee: String,
		paymentMethod: String,
		deposit: String,
		startDate: Date,
		endDate: Date
	},
	code: String,
	chiBrandName: String,
	chiClubName: String,
	chiCompanyName: String,
	chiDisplayName: String,
	engBrandName: String,
	engClubName: String,
	engCompanyName: String,
	engDisplayName: String,
	files: [{
		_type: {type: String},
		filename: {type: String},
		fullFilepath: {type: String}
	}],
	information: {
		chiAddressLine1: String,
		chiAddressLine2: String,
		engAddressLine1: String,
		engAddressLine2: String,
		country: String,
		district: String,
		region: String,
		websiteURL: String,
		tel: String,
		fax: String
	},
	shortName: String,
	vendorCode: String,
	categoryCode: String,
	remarks: [String],
	publish: {type: Boolean, required: true, default: true},
	_type : {type: String, default: "Vendor"}
}, schemaOptions);




/*********************************************
* Using mongoose plugins here
 *********************************************/
var createdModifiedPlugin = require('../plugins/createdModifiedPlugin');
vendorRepositorySchema.plugin(createdModifiedPlugin, { index: false });


/*********************************************
 * Custom Class Method (Static method)
 *********************************************/

/* 
 * Input: vendors - An array of vendors object to be saved
 */
vendorRepositorySchema.statics.batchImport = function (options, callback) {
	var self = this;
	var noOfSuccessfulImport = 0;
	var noOfCreatedVendor = 0;
	var noOfUpdatedVendor = 0;
	var vendors = options.vendors;
	var skipCheckExist = options.skipCheckExist || false;
	var filterVendor;
	if (skipCheckExist) {
		filterVendor = function (vendor, done) {
			if (vendor) {
				self.saveVendor(vendor, function (err, importedVendor) {
					if (err) {
						done(err);
					} else {
						noOfCreatedVendor++;
						noOfSuccessfulImport++;
						done(null, importedVendor);
					}
				});
			} else {
				done("Invalid import vendor object");
			}
		};
	} else {
		filterVendor = function (vendor, done) {
			if (vendor) {
				self.findByConditions({vendorname: vendor.vendorname}, function (err, vendors) {
					if (err) {
						done(err);
					} else {
						if (vendors.length > 1) {
							done("More than one vendors");
						} else {
							if (vendors.length == 1) {
								noOfUpdatedVendor++;
								vendor._id = vendors[0]._id; // for query in saveVendor method to update the existing document
								objectHelper.deleteProperties(vendor, [
									"password",
									"isActivated",
									"verificationCode",
									"groups",
									"code"
								]); // prevent from being updated with default values when new Vendor()
							} else {
								noOfCreatedVendor++;
							}
							self.saveVendor(vendor, function (err, importedVendor) {
								if (err) {
									callback(err);
								} else {
									noOfSuccessfulImport++;
									done(null, importedVendor);
								}
							});
						}
					}
				});
			} else {
				done("Invalid import vendor object");
			}
		};
	}
	
	// "vendors" contains JS objects(child process) or Vendor objects
	arrayHelper.walkArray(vendors, {}, filterVendor, function (err, importedVendors) {
		if (err) {
			callback(err);
		} else {
			var importResult = {
				noOfSuccessfulImport: noOfSuccessfulImport,
				noOfCreatedVendor: noOfCreatedVendor,
				noOfUpdatedVendor: noOfUpdatedVendor
			};
			callback(null, importResult);
		}
	});
};

vendorRepositorySchema.statics.deleteVendors = function (conditions, callback) {
	conditions = conditions || {};
	this.remove(conditions, callback);
};


/*
 * exact matching of searching criteria
 *
 * @param {Object} conditions     search criteria object, e.g. conditions = {subject: "english", classname: "2P"};
 * @param {Function} callback     return callback with 2 arguments (err, students)
 */
vendorRepositorySchema.statics.findByConditions = function (options, callback) {

	console.log("options", options);
	
	var conditions = options || {};
	
	var q = this.find();
	q.where('_type').equals('Vendor');
  
	if (conditions._id) {
		q.where("_id").equals(conditions._id);
	}
	
	if (conditions.exists) {
		q.where(conditions.exists).exists(true);
		q.where(conditions.exists).nin(["", null, [], {}]);
	}
	
	if (typeof conditions.active !== 'undefined') {
		q.where("active").equals(conditions.active);
	}
	
	if (typeof conditions.publish !== 'undefined') {
		q.where("publish").equals(conditions.publish);
	}
	
	if (conditions.contactList) {
		q.where('contactList').in(conditions.contactList);
	}
	
	if (conditions.categoryId) {
		q.where('categoryId').equals(conditions.categoryId);
	}
	
	if (conditions.contract) {
		q.where('contract').equals(conditions.contract);
	}
	
	if (conditions.code) {
		q.where('code').equals(conditions.code);
	}
	
	if (conditions.vendorCode) {
		var vendorCodeSearch = new RegExp(conditions.vendorCode, "i");
		q.where('vendorCode').equals(vendorCodeSearch);
	}
	
	if (conditions.vendorService) {
		q.where('contract.service').equals(conditions.vendorService);
	}
	
	if (conditions.chiBrandName) {
		q.where('chiBrandName').equals(conditions.chiBrandName);
	}
	
	if (conditions.chiClubName) {
		q.where('chiClubName').equals(conditions.chiClubName);
	}
	
	if (conditions.chiCompanyName) {
		q.where('chiCompanyName').equals(conditions.chiCompanyName);
	}
	
	if (conditions.chiDisplayName) {
		q.where('chiDisplayName').equals(conditions.chiDisplayName);
	}
	
	if (conditions.engBrandName) {
		q.where('engBrandName').equals(conditions.engBrandName);
	}
	
	if (conditions.engClubName) {
		q.where('engClubName').equals(conditions.engClubName);
	}
	
	if (conditions.engCompanyName) {
		q.where('engCompanyName').equals(conditions.engCompanyName);
	}
	
	if (conditions.engDisplayName) {
		q.where('engDisplayName').equals(conditions.engDisplayName);
	}
	
	if (conditions.files) {
		q.where('files').in(conditions.files);
	}
	
	if (conditions.information) {
		q.where('information').in(conditions.information);
	}
	
	if (conditions.remarks) {
		q.where('remarks').in(conditions.remarks);
	}
	
	if (conditions.notExists) {
		q.where(conditions.notExists).exists(false);
	}
	
	if (conditions.populate) {
		q.populate(conditions.populate);
	}
	
	if (conditions.name) { 
		var nameSearch = new RegExp(conditions.name, "i");
		q.or([
			{chiBrandName: nameSearch},
			{chiClubName: nameSearch},
			{chiCompanyName: nameSearch},
			{chiDisplayName: nameSearch},
			{engBrandName: nameSearch},
			{engClubName: nameSearch},
			{engCompanyName: nameSearch},
			{engDisplayName: nameSearch}
			// {contact:{ $elemMatch: {name: universalSearch}}}   //example
		]);
	}
	
	if (conditions.universalSearch) { 
		var universalSearch = new RegExp(conditions.universalSearch, "i");
		q.or([
			{chiBrandName: universalSearch},
			{chiClubName: universalSearch},
			{chiCompanyName: universalSearch},
			{chiDisplayName: universalSearch},
			{engBrandName: universalSearch},
			{engClubName: universalSearch},
			{engCompanyName: universalSearch},
			{engDisplayName: universalSearch},
			{vendorCode: universalSearch}
			// {contact:{ $elemMatch: {name: universalSearch}}}   //example
		]);
	}
  
	if (conditions.vendorIds) {
		q.where("_id").in(conditions.vendorIds);
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

/* vendorRepositorySchema.statics.findByIndex = function (options, callback) {
  options = options || {};
  options.id = options._id || '';
  options.fields = options.fields || '';
  
  this.findById(options.id, options.fields, callback);
};
 */
vendorRepositorySchema.statics.mapReduceVendors = function (conditions, callback) {
	// console.log("conditions", conditions);
	this.mapReduce(conditions, callback);
};

// vendorRepositorySchema.statics.saveVendor = function (vendor, callback) {
	// var id = vendor._id || new mongoose.Types.ObjectId();
	// delete vendor._id;

	// this.findByIdAndUpdate(id, vendor, {upsert : true}, function (err, savedVendor) {
		// callback(err, savedVendor);
	// });
// };

vendorRepositorySchema.statics.saveVendor = function (vendor, callback) {
	var self = this;
	var id = vendor._id || new mongoose.Types.ObjectId();
	delete vendor._id;

	this.findById(id, function (err, vendorRepository) {
		if (err) {
			callback(err);
		} else {
			if (vendorRepository) {
				for (prop in vendor) {
					if (prop !== "code") {
						vendorRepository[prop] = vendor[prop];
					}
				}
				vendorRepository.vendorCode = vendor.categoryCode + '-' + vendor.code;
				
				console.log(vendor.code);
				console.log(vendor.vendorCode);
				vendorRepository.save(callback);
			} else {
				IdCounter.getNextSequenceValue({model:'Vendor', field: 'code'}, function(err, NextSequenceValue){

					var newVendor = new self(vendor);
					newVendor.code = NextSequenceValue;
					newVendor.vendorCode = vendor.categoryCode + '-' + NextSequenceValue;
					console.log(newVendor);
					newVendor.save(callback);
						
				});
			}
		}
	});
};


/* single update */
vendorRepositorySchema.statics.updateVendor = function (options, callback) {
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
						callback(403, "Failed to update vendor");
					}
				}
			});
		}
	});
};

/* multiple update */
vendorRepositorySchema.statics.updateVendors = function (options, callback) {
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
				self.updateVendor(options, callback);
			} else {
				callback(403, "No update conditions specified");
			}			
		}
	});
};

/* Housekeeping functions */
vendorRepositorySchema.statics.ensureJoinedTheGroup_AllVendors = function(options, callback){
	var self = this;
	var ownerId = mongoose.Types.ObjectId(options.ownerId);
	var queryOptions = {
		groups: {
			$not: {
				$elemMatch: {
					name: "All Vendors"
				}
			}
		}
	};
	var updateOptions = {
		$addToSet: {
			groups: {
				name: "All Vendors",
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
				self.update({_id: ownerId, groups: {$elemMatch: {name: "All Vendors"}}}, {$set: {"groups.$.isAdmin": true}}, callback);
			} else { 
				callback("ensureJoinedTheGroup_AllVendors FAILED")
			}
		}
	});
};

vendorRepositorySchema.statics.updateOwnerOfTheGroup_AllVendors = function(options, callback){
	var self = this;
	var ownerId = mongoose.Types.ObjectId(options.ownerId);
	var queryOptions = {
		groups: {
			$elemMatch: {
				name: "All Vendors"
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
			console.log("updateOwnerOfTheGroup_AllVendors numberAffected", numberAffected);
			if (numberAffected > 0) {
				queryOptions._id = ownerId;
				self.update(queryOptions, {$set: {"groups.$.isAdmin": true}}, callback);
			} else {
				callback("updateOwnerOfTheGroup_AllVendors FAILED");
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
//vendorRepositorySchema.index({ lastName: 1, firstName: 1}, {name: "fullNameIndex"}); // schema level


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
 
var VendorRepository = mongoose.model('Vendor', vendorRepositorySchema);
childProcessHelper.processListener(process, VendorRepository);
module.exports = VendorRepository;