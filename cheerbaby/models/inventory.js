/*********************************************
 * The Inventory model
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
var MapReduceChain = require('./mapReduces/mapReduceChain');
var childProcessHelper = require('../lib/childProcessHelper');

/*********************************************
 * Include Repository
 *********************************************/
var inventoryRepositoryPath = './models/repositories/inventoryRepository';
var InventoryRepository = require('./repositories/inventoryRepository');
var PermissionManager = require('./permissions/permissionManager');
var permissionManager = new PermissionManager();


/*********************************************
 * CONSTANT declaration
 *********************************************/
const DEBUG = false;
// const USE_CHILD_PROCESS = true;
const USE_CHILD_PROCESS = false;
const MAX_APPOINTMENTS_IN_SAME_TIME = 4;

/*********************************************
 * Class definition
 *********************************************/
function Inventory(options){
	options = options || {};

	this._id = options._id || null;
	this.code = options.code || '';
	this.creator = options.creator || null;
	this.date = options.date || new Date();
	this.effectiveDate = options.effectiveDate || new Date();
	this.itemId = options.itemId || '';
	this.quantity = options.quantity || 0;
	this.remarks = options.remarks || [];
	this.reasons = options.reasons || '';
	this.transferReasonsText = options.transferReasonsText || '';
	this.otherReasonsText = options.otherReasonsText || '';
	this.receiptNo = options.receiptNo || '';
	this.responsibleFor = options.responsibleFor || '';
	this.branch = options.branch || '';
}

/*********************************************
 * Class methods
 *********************************************/
/*
 * create static methods
 */
Inventory.create = function (options, callback) {
	var self = this;
	var user = options.user;

	var permission = permissionManager.createChain();
	permission.inventory.handleRequest({user : user}, function (err, allow) {
		if (err) {
			callback(err);
		} else {
			if (allow) {
				validateInventoryOptions(options, function (err, options) {
					if (err) {
						callback(err);
					} else {
						var inventory = new self(options);
						inventory.saveInventory(callback);
					}
				})
			} else {
				callback({code: 401, message : 'unauthorized user'})
			}
		}
	});
};

/*
 * find static methods
 */
Inventory.findAll = function (options, callback) {
	var self = this;
	var user = options.user;
	var permission = permissionManager.createChain();

	if (options && options.action == 'findQuantityByConditions') {
		permission.inventory.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findQuantityByConditions');
					return self.findQuantityByConditions(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	} else {

		permission.inventory.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findAllInventorys');
					return self.findAllInventorys(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	}
};


/*
 * Called By
 * Frontend: Inventory find default
 * Backend: null
 */
Inventory.findAllInventorys = function (options, callback) {
	var conditions = options || {};

	checkConditions(handlePopulate(conditions), function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findInventorys(conditions, function (err, inventories) {
				if (err) {
					callback(err);
				} else {
					callback(null, inventories.filter(function (inventory) {
						return (inventory.userId);
					}));
				}
			});
		}
	});
};


/*
 * Called By
 * Frontend: null
 * Backend: Inventory.findQuantityByConditions, Inventory.findTodayStockOutQuantityByItemId
 */
Inventory.checkQuantityInBranch = function (options, callback) {
	options = options || {};

	checkConditions(options, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findInventorys(conditions, function (err, inventories){
				if (err) {
					callback(err);
				} else {
					calculateQuantity(inventories, callback);
				}
			});
		}
	});
};

/*
 * Called By
 * Frontend: Inventory
 * Backend: Item
 */
Inventory.findQuantityByConditions = function (options, callback) {
	var self = this;
	options = options || {};

	checkConditions(options, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			self.checkQuantityInBranch(conditions, function (err, quantity) {
				if (err) {
					callback(err);
				} else {
					callback(null, {quantity: quantity});
				}
			});
		}
	});
};

/*
 * Called By
 * Frontend: null
 * Backend: Inventory.updateById
 */
Inventory.findInventoryById = function (options, callback) {
	options = options || {};
	var conditions = {
		id: options.id
	};

	checkConditions(conditions, function (err, checkedConditions) {
		if (err) {
			callback(err);
		} else {
			findInventorys(checkedConditions, function (err, inventories) {
				if (err) {
					callback(err);
				} else {
					if (inventories.length == 1) {
						callback(null, inventories[0]);
					} else if (inventories.length == 0) {
						callback({code : 404, message : "no record"});
					} else {
						callback({code : 403, message : "user more than one"});
					}
				}
			});
		}
	});
};

Inventory.updateById = function (options, callback) {
	options = options || {};
	var conditions = options.conditions;
	var update = options.update;
	var self = this;
	var user = options.user;

	var permission = permissionManager.createChain();
	permission.inventory.handleRequest({user : user}, function (err, allow) {
		if (err) {
			callback(err);
		} else {
			if (allow) {
				self.findInventoryById(conditions, function (err, inventory) {
					if (err) {
						callback(err);
					} else {
						inventory.updateInventory(update, callback);
					}
				});
			} else {
				callback({code: 401, message : 'unauthorized user'})
			}
		}
	});
};



/*********************************************
 * Export Function
 *********************************************/
Inventory.findQuantityByConditionsWithItemName = function (options, callback) {
	options = options || {};
	options.conditioner = this.mapReduceByConditions;
	options.vendorService = options.vendorService || 'Member Easy & Info Easy';
	var showAll = false;
	if (options.vendorService == 'Member Easy & Info Easy') {
		showAll = true;
	}

	if (options.dateFrom && options.dateTo) {
		var dateFrom = new Date(options.dateFrom);
		var dateTo = new Date(options.dateTo);
		var start = new Date(dateFrom.getFullYear(), dateFrom.getMonth(), dateFrom.getDate(), 0, 0, 0);
		var end = new Date(dateTo.getFullYear(), dateTo.getMonth(), dateTo.getDate(), 23, 59, 59);
	} else {
		var date = new Date(options.dateFrom);
		var start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
		var end = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);
	}

	options.query = {
		date: {$gte: start, $lte: end},
		reasons: 'consumption'
	};

	var mapReduceChain = new MapReduceChain(options);
	var excel = options.excel;

	/* Set Report Variable */
	var variable = {
		date: options.dateFrom + ((options.dateTo) ? ' - ' + options.dateTo : ''),
		printDate: new Date().toDateFormat('yyyy-MM-dd HH:mm:ss'),
		vendorService: options.vendorService
	};

	excel.loadDataToHeader(variable);
	/* END */

	mapReduceChain.mapReduceInventorybyItemId(function (err, results) {
		if (err) {
			callback(err);
		} else {
			var conditions = {
				array: results.inventory,
				query: {
					path: '_id',
					model: 'Item',
					select: 'code chiName engName itemCode vendorId'
				}
			};

			InventoryRepository.populate(conditions.array, conditions.query, function (err, populatedResult) {
				var VendorRepository = require('./repositories/vendorRepository');
				var query = {
					path: '_id.vendorId',
					model: 'Vendor',
					select: 'chiBrandName engBrandName vendorCode code contract'
				}
				VendorRepository.populate(populatedResult, query, function (err, populatedItems) {
					var rows = [];
					populatedItems.forEach(function (item) {
						if ((item._id && item._id.vendorId.contract.service == options.vendorService) || showAll) {
							var outputItem = {
								vendorName: item._id.vendorId.chiBrandName,
								vendorCode: item._id.vendorId.vendorCode,
								itemName: item._id.chiName,
								itemCode: item._id.itemCode,
								quantity: Math.abs(item.value)
							};
							rows.push(outputItem);
						}
					});
					excel.loadDataToRows({rows: rows});
					callback(null, excel.data);
				});
			});
		}
	});
};


Inventory.mapReduceByConditions = function (options, callback) {
	var duplicateResults = [];
	var uniqueIds = [];
	var conditions = options || {};
	var temp = {};

	mapReduceFromRepositoryWithChildProcess(conditions, function (err, results) {
		// console.log("results", results);
		if (err) {
			callback(err);
		} else {
			callback(null, results);
		}
	});
};

var mapReduceFromRepositoryWithChildProcess = function (conditions, callback) {
	childProcessHelper.addChild(inventoryRepositoryPath, "mapReduceInventories", conditions, callback);
};



Inventory.exportStockRecord = function (options, callback) {
	var self = this;
	options = options || {};
	var excel = options.excel;

	var conditions = {
		dateFrom: options.dateFrom,
		dateTo: options.dateTo,
		itemId: options.itemId,
		populate: {
			path: 'itemId'
		}
	};

	if (options.stockType == 'Stock-In') {
		conditions.stockIn = true;
	} else if (options.stockType == 'Stock-Out') {
		conditions.stockOut = true;
	}

	findInventorys(conditions, function(err, inventories) {
		if (err) {
			callback(err);
		} else {
			InventoryRepository.populate(inventories, {path: 'itemId.vendorId', select: 'chiBrandName engBrandName', model: 'Vendor'}, function(err, inventories) {
				if (err) {
					callback(err);
				} else {
					var variable = {
						center: options.branch,
						date: options.dateFrom + ((options.dateTo) ? ' - ' + options.dateTo : ''),
						itemName: '',
						printDate: new Date().toDateFormat('yyyy-MM-dd HH:mm:ss'),
						stockType: options.stockType,
						totalQuantity: 0,
						vendorName: ''
					};

					var filter = function (inventory, done) {
						inventory.vendorCode = inventory.itemId.vendorCode;
						inventory.itemName = inventory.itemId.chiName;
						inventory.itemCode = inventory.itemId.itemCode;
						inventory.vendorName = inventory.itemId.vendorId.chiBrandName;

						if (inventory.itemId.description.length > 0) {
							var remarks = '';
							inventory.itemId.description.forEach(function (text) {
								remarks += text + '\n';
							})
							inventory.remarks = remarks;
						}

						inventory.quantity = Math.abs(inventory.quantity);

						variable.vendorCode = inventory.vendorCode;
						variable.vendorName = inventory.vendorName;
						variable.itemName = inventory.itemName;
						variable.totalQuantity += inventory.quantity;
						done(null, inventory);
					};

					arrayHelper.walkArray(inventories, {}, filter, function (err, inventories) {
						if (err) {
							callback(err);
						} else {
							excel.loadDataToHeader(variable);
							excel.loadDataToRows({rows: inventories});
							callback(null, excel.data);
						}
					});
				}
			})
		}
	});
};




var exportRow = function () {
  var rowIndex = 0;

  return function (inventory, header, callback) {
		if (header) {
			if (header.indexOf('+') != -1) {
				header = header.split('+');
			}

			if (header.indexOf('[') != -1 || header.indexOf(']') != -1){
				header = header.replace('[', '');
				header = header.replace(']', '');
			}

			if (Array.isArray(header)) {
				var self = exportRow();
				var result = '';

				header.forEach(function (prop) {
					if (prop.trim().length != 0) {
						self(inventory, prop.trim(), function (value){
							result += value;
						})
					} else {
						result += ' ';
					}
				});
				callback(result);
			} else if (header == 'index') {
				rowIndex++;
				callback(rowIndex);
			} else if (!/^[a-zA-Z]*$/g.test(header) && header.length == 1) {
				// only have one character and it is special character
				callback(header);
			} else if (header.indexOf('.') != -1) {
				var headers = header.split('.');
				var len = headers.length,
						i = 0;

				while (len != 0) {
					inventory = inventory[headers[i]]
					i++;
					len--;
				}
				callback(inventory);
			} else if (arrayHelper.isArray( inventory[header] )) {
				callback(inventory[header].join(','));
			} else if (typeof inventory[header] == 'string') {
				callback(inventory[header].toString());
			} else if (typeof inventory[header] == 'boolean') {
				callback(inventory[header]);
			} else if (typeof inventory[header] != 'undefined') {
				callback(inventory[header]);
			} else {
				callback('');
			}
		} else {
			callback('');
		}
	};
};
/*********************************************
 * Instance methods
 *********************************************/
Inventory.prototype.saveInventory = function (callback) {
	var self = this;

	saveToRepository(this, callback);
};

Inventory.prototype.updateInventory = function (update, callback) {
	for (var key in update) {
		// console.log(key, update[key]);
		this[key] = update[key];
	}
	this.saveInventory(callback);
};

/*********************************************
 * Helper functions
 *********************************************/
var calculateQuantity = function (inventories, callback) {

	if (inventories.length > 0) {
		var quantity = 0;

		var calculate = function (inventory, done) {
			quantity += parseInt(inventory.quantity);
			done(null, inventory);
		};

		arrayHelper.walkArray(inventories, {}, calculate, function(err, data) {
			if (err) {
				callback(err);
			} else {
				callback(null, quantity);
			}
		});
	} else {
		callback(null, 0);
	}

};

var checkConditions = function (options, callback) {
	options = options || {};
	var conditions = {};

	if (options.id) {
		conditions._id = options.id;
	}

	if (options.branch) {
		conditions.branch = options.branch;
	}

	if (options.code) {
		conditions.code = options.code;
	}

	if (options.creator) {
		conditions.creator = options.creator;
	}

	if (options.date) {
		conditions.date = options.date;
	}

	if (options.dateFrom) {
		conditions.dateFrom = options.dateFrom;
	}

	if (options.dateTo) {
		conditions.dateTo = options.dateTo;
	}

	if (options.effectiveDate) {
		conditions.effectiveDate = options.effectiveDate;
	}

	if (options.itemId) {
		conditions.itemId = options.itemId;
	}

	if (options.month) {
		conditions.month = options.month;
	}

	if (options.quantity) {
		conditions.quantity = options.quantity;
	}

	if (options.reasons) {
		conditions.reasons = options.reasons;
	}

	if (options.reasonsText) {
		conditions.reasonsText = options.reasonsText;
	}

	if (options.remarks) {
		conditions.remarks = options.remarks;
	}

	if (options.remarksText) {
		conditions.remarksText = options.remarksText;
	}

	if (options.receiptNo) {
		conditions.receiptNo = options.receiptNo;
	}

	if (options.responsibleFor) {
		conditions.responsibleFor = options.responsibleFor;
	}

	if (options.page) {
		conditions.page = options.page;
	}

	if (options.populate) {
		conditions.populate = options.populate;
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

var findInventorys = function (options, callback) {
	findInventorysFromRepository(options, function (err, inventories, total) {
		if (DEBUG) {
			console.log(err, inventories);
		}
		callback(err, inventories, total);
	});
};

var findInventorysFromRepository = function (conditions, callback) {
	var _callback = function (err, inventoryArray, total) {
		if (err) {
			callback(err);
		} else {
			var inventories = initFromArray(inventoryArray);
			callback(null, inventories, total);
		}
	};

	if (USE_CHILD_PROCESS) {
		findInventorysFromRepositoryWitChildProcess(conditions, callback);
	} else {
		InventoryRepository.findByConditions(conditions, _callback);
	}
};

function init (value) {
	return new Inventory(value);
};

var initFromArray = function (arr) {
	return arr.map(function (inventoryObject) {
		return init(inventoryObject);
	});
};


var handlePopulate = function (conditions) {
	if (conditions.HKID || conditions.name) {
		var match = {};
		if (conditions.HKID) {
			match['HKID'] = new RegExp(conditions.HKID, "i");
		}
		if (conditions.name) {
			var nameLike = new RegExp(conditions.name, "i");
			match['$or'] = [{firstName: nameLike}, {middleName: nameLike}, {lastName: nameLike}];
		}
		conditions.populate = {
			path: 'userId',
			match: match
		}
	} else {
		conditions.populate = {
			path: 'userId'
		}
	}

	return conditions;
};

/*
 * inventory: Inventory instance
 * callback: Inventory instance
 */
var saveToRepository = function (inventory, callback) {
	/* add and update */
	if (USE_CHILD_PROCESS) {
		saveToRepositoryWithChildProcess(inventory, callback);
	} else {
		InventoryRepository.saveInventory(inventory, function (err, inventoryObject) {
			callback(err, init(inventoryObject));
		});
	}
};

var validateInventoryOptions = function (options, callback) {
	if (options.quantity && options.itemId && options.creator) {
		options.date = options.date;
		options.quantity = options.quantity;
		options.creator = options.creator;
		options.itemId = options.itemId;
		options.remarks = options.remarks || '';
		callback(null, options);
	} else {
		callback({code : 400, message : "No Inventory quantity and itemId is provided"});
	}
};


/*********************************************
 * Export as a module
 *********************************************/
module.exports = Inventory;
