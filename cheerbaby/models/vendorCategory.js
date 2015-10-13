/*********************************************
 * The VendorCategory model
 *
 * author: kit Lee
 * created: 2015-01-09T15:16:00Z
 * modified: 2015-01-09T15:16:00Z
 *
 *********************************************/

 /*********************************************
 * Include Helpers
 *********************************************/
var arrayHelper = require('../lib/arrayHelper');
var mongoose = require('mongoose');
var objectHelper = require('../lib/objectHelper');

/*********************************************
 * Include Class
 *********************************************/
var ArrayFilter = require('./arrayFilters/arrayFilter');
var StandardArrayFilter = require('./arrayFilters/standardArrayFilter');

/*********************************************
 * Include Repository
 *********************************************/
var vendorCategoryRepositoryPath = './models/repositories/vendorCategoryRepository';
var VendorCategoryRepository = require('./repositories/vendorCategoryRepository');

/*********************************************
 * CONSTANT declaration
 *********************************************/
const DEBUG = false;
// const USE_CHILD_PROCESS = true;
const USE_CHILD_PROCESS = false;

/*********************************************
 * Class definition
 *********************************************/
function VendorCategory(options){
	options = options || {};
	
	this._id = options._id || null;
	this.name = options.name || '';
	this.code = options.code || '';
	this.active = options.active;
}

/*********************************************
 * Class methods
 *********************************************/
VendorCategory.initFromArray = function (arr, callback) {
	if (arr instanceof Array) {
	  callback(null, arr.map(init));
	} else {
	  callback({code : 403, message : "no array"});
	}
};

/*
 * create static methods 
 */ 
VendorCategory.create = function (options, callback) {
	var self = this;
	
	validateVendorCategoryOptions(options, function (err, options) {
		if (err) {
			callback(err);
		} else {
			self.findVendorCategoriesByName({name : options.name}, function (err, foundVendorCategories) {
				if (err) {
					callback(err);
				} else {
					if (foundVendorCategories.length == 0) {
						var vendorCategory = new self(options);
						vendorCategory.saveVendorCategory(callback);
					} else {
						callback({code : 403, message : "vendorCategory exist"});
					}
				}
			});
		}
	})
};

VendorCategory.updateById = function (options, callback) {
	options = options || {};
	var conditions = options.conditions;
	var update = options.update;
	
	this.findVendorCategoryById(conditions, function (err, vendorCategory) {
		if (err) {
			callback(err);
		} else {
			vendorCategory.updateVendorCategory(update, callback);
		}
	});
};

/*
 * find static methods 
 */
VendorCategory.findAll = function (options, callback) {
	
	if (options && options.action == 'findAllActiveCategories') {
	
		console.log('findAllActiveCategories');
		return this.findAllActiveCategories(options, callback);
			
	} else {
	
		console.log('findAllCategories');
		return this.findAllCategories(options, callback);
    
	}
}; 


/*
 * Called By
 * Frontend: null
 * Backend: VendorCategory.updateById
 */
VendorCategory.findVendorCategoryById = function (options, callback) {
	options = options || {};
	if (options.id) {
		var conditions = {
			id : options.id
		};
		checkConditions(conditions, function (err, conditions) {
			if (err) {
				callback(err);
			} else {
				findVendorCategories(conditions, function (err, vendorCategories) {
					if (err) {
						callback(err);
					} else {
						if (vendorCategories.length == 1) {
							callback(null, vendorCategories[0]);
						} else if (vendorCategories.length == 0) {
							callback({code : 403, message : "no record"});
						} else {
							callback({code : 403, message : "category more than one"});
						}
					}
				});
			}
		});
	} else {
		callback({code : 400, message : "Please enter vendorCategory Id"});
	}
};

/*
 * Called By
 * Frontend: null
 * Backend: VendorCategory.create
 */
VendorCategory.findVendorCategoriesByName = function (options, callback) {
	options = options || {};
	if (options.name) {
		checkConditions({name : options.name}, function (err, conditions) {
			if (err) {
				callback(err);
			} else {
				findVendorCategories(conditions, callback);
			}
		});
	} else {
		callback({code : 400, message : "Please enter vendorCategory name"});
	}
};

/*
 * Called By
 * Frontend: VendorCategory find default
 * Backend: VendorCategory.findAllActiveCategories
 */
VendorCategory.findAllCategories = function (options, callback) {
	var conditions = options || {};
	
	checkConditions(conditions, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findVendorCategories(conditions, callback);
		}
	});
};

/*
 * Called By
 * Frontend: User, Vendor
 * Backend: null
 */
VendorCategory.findAllActiveCategories = function (options, callback) {
	var conditions = options || {};
	conditions.active = true;
	
	this.findAllCategories(conditions, callback);
};

/*********************************************
 * Instance methods
 *********************************************/
VendorCategory.prototype.saveVendorCategory = function (callback) {
	var self = this;

	saveToRepository(this, callback);
};

VendorCategory.prototype.updateVendorCategory = function (update, callback) {
	for (var key in update) {
		// console.log(key, update[key]);
		this[key] = update[key];
	}
	this.saveVendorCategory(callback);
};
/*********************************************
 * Helper functions
 *********************************************/
var checkConditions = function (options, callback) {
	options = options || {};
	var conditions = {};

	if (options.id) {
		conditions._id = options.id;
	}

	if (typeof options.active != 'undefined') {
		conditions.active = options.active;
	}
	
	if (typeof options.publish != 'undefined') {
		conditions.publish = options.publish;
	}

	if (options.name) {
		conditions.name = options.name;
	}

	if (options.page) {
		conditions.page = options.page;
	}

	if (options.univeralSearch) {
		conditions.univeralSearch = options.univeralSearch;
	}

	if (options.sort) {
		conditions.sort = options.sort;
	}
	// console.log("conditions", conditions);
	callback(null, conditions);
};

var findVendorCategories = function (options, callback) {
	findVendorCategoriesFromRepository(options, function (err, users, total) {
		if (DEBUG) {
			console.log(err, users);
		}
		callback(err, users, total);
	});
};

var findVendorCategoriesFromRepository = function (conditions, callback) {
	var _callback = function (err, vendorCategoryArray, total) {
		if (err) {
			callback(err);
		} else {
			var vendorCategories = initFromArray(vendorCategoryArray);
			callback(null, vendorCategories, total);
		}
	};
	
	if (USE_CHILD_PROCESS) {
		findVendorCategoriesFromRepositoryWitChildProcess(conditions, callback);
	} else {
		VendorCategoryRepository.findByConditions(conditions, _callback);
	}
};

function init (value) {
	return new VendorCategory(value);
};

var initFromArray = function (arr) {
	return arr.map(function (vendorCategoryObject) {
		return init(vendorCategoryObject);
	});
};

/* 
 * vendorCategory: VendorCategory instance
 * callback: VendorCategory instance
 */
var saveToRepository = function (vendorCategory, callback) {
	/* add and update */
	if (USE_CHILD_PROCESS) {
		saveToRepositoryWithChildProcess(vendorCategory, callback);
	} else {
		VendorCategoryRepository.saveVendorCategory(vendorCategory, function (err, vendorCategoryObject) {
			callback(err, init(vendorCategoryObject));
		});
	}
};

var updateVendorCategory = function (options, callback) {
	updateRepositories(options, callback);
};

var updateRepositories = function (options, callback) {
	/* add and update */
	if (USE_CHILD_PROCESS) {
		updateRepositoriesWithChildProcess(options, callback);
	} else {
		VendorCategoryRepository.updateVendorCategories(options, callback);
	}
};

var validateVendorCategoryOptions = function (options, callback) {
	if (options.name) {
		options.name = options.name;
		options.active = options.active;
		callback(null, options);
	} else {
		callback({code : 400, message : "No VendorCategory Name is provided"});
	}
};


/*********************************************
 * Export as a module
 *********************************************/
module.exports = VendorCategory;