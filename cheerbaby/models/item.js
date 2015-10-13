/*********************************************
 * The Item model
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
var itemRepositoryPath = './models/repositories/itemRepository';
var ItemRepository = require('./repositories/itemRepository');
var PermissionManager = require('./permissions/permissionManager');
var permissionManager = new PermissionManager();


var Inventory = require('./inventory');

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
function Item(options){
	options = options || {};

	this._id = options._id || null;
	this.active = options.active;
	this.code = options.code || '';
	this.creator = options.creator || null;
	this.chiName = options.chiName || '';
	this.description = options.description || [];
	this.engName = options.engName || '';
	this.itemCode = options.itemCode || '';
	this.replenishmentLevel = options.replenishmentLevel || 0;
	this.supplyPeriod = options.supplyPeriod || '';
	this.vendorId = options.vendorId || null;
	this.vendorCode = options.vendorCode || '';
	this.unit = options.unit || '';
}

/*********************************************
 * Class methods
 *********************************************/
Item.initFromArray = function (arr, callback) {
	if (arr instanceof Array) {
	  callback(null, arr.map(init));
	} else {
	  callback({code : 404, message : "no array"});
	}
};

/*
 * create static methods
 */
Item.create = function (options, callback) {
	var self = this;
	var user = options.user;

	var permission = permissionManager.createChain();
	permission.item.handleRequest({user : user}, function (err, allow) {
		if (err) {
			callback(err);
		} else {
			if (allow) {
				validateItemOptions(options, function (err, options) {
					if (err) {
						callback(err);
					} else {
						self.findActiveItemsByVendorId({vendorId : options.vendorId}, function (err, foundItems) {
							if (err) {
								callback(err);
							} else {
								if (foundItems.length == 0) {
									var item = new self(options);
									item.saveItem(callback);
								} else {
									callback({code : 403, message : "This vendor exists active item"});
								}
							}
						});
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
Item.findAll = function (options, callback) {
	var self = this;
	var user = options.user;
	var permission = permissionManager.createChain();

	if (objectHelper.isEmptyObject(options)) {

		permission.item.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findAllItems');
					return self.findAllItems({}, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	} else if (options.action == 'findItemByName') {

		permission.item.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findItemByName');
					return self.findItemByName(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	} else if (options.action == 'findActiveItemByVendorIdWithInventory') {

		permission.item.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findActiveItemByVendorIdWithInventory');
					return self.findActiveItemByVendorIdWithInventory(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

		} else if (options.action == 'findItemsByVendorIdWithInventory') {

		permission.item.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findItemsByVendorIdWithInventory');
					return self.findItemsByVendorIdWithInventory(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	} else if (options.action == 'findActiveItemByVendorIdWithDetailsInventory') {

		permission.item.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findActiveItemByVendorIdWithDetailsInventory');
					return self.findActiveItemByVendorIdWithDetailsInventory(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	} else if (options.action == 'findByUniversalSearch') {

		console.log('findByUniversalSearch');
		return self.findByUniversalSearch(options, callback);

	} else {

		permission.item.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findAllItems');
					return self.findAllItems(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	}
};

/*
 * Called By
 * Frontend: Item
 * Backend: null
 */
Item.findByUniversalSearch = function (options, callback) {
	var self = this;
	options = options || {};

	options.populate = {
		path: 'vendorId',
	}
	checkConditions(options, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findItems(conditions, callback);
		}
	});
};


/*
 * Called By
 * Frontend: Item find default
 * Backend: null
 */
Item.findAllItems = function (options, callback) {
	var conditions = options || {};

	checkConditions(handlePopulate(conditions), function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findItems(conditions, function (err, items) {
				if (err) {
					callback(err);
				} else {
					callback(null, items.filter(function (item) {
						return (item.creator);
					}));
				}
			});
		}
	});
};

/*
 * Called By
 * Frontend: null
 * Backend: Item.findItemsByVendorIdWithInventory
 */
Item.findItemsByVendorId = function (options, callback) {
	options = options || {};

	var conditions = {
		vendorId: options.vendorId
	};

	checkConditions(conditions, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findItems(conditions, function (err, items) {
				if (err) {
					callback(err);
				} else {
					callback(null, items);
				}
			});
		}
	});
};


/*
 * Called By
 * Frontend: null
 * Backend: Item.create
 */
Item.findActiveItemsByVendorId = function (options, callback) {
	options = options || {};
	var conditions = {
		vendorId: options.vendorId,
		active: true
	};

	checkConditions(conditions, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findItems(conditions, function (err, items) {
				if (err) {
					callback(err);
				} else {
					callback(null, items);
				}
			});
		}
	});
};

/*
 * Called By
 * Frontend: Inventory
 * Backend: null
 */
Item.findItemByName = function (options, callback) {
	options = options || {};
	var conditions = {
		name: options.name
	};

	checkConditions(conditions, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findItems(conditions, function (err, items) {
				if (err) {
					callback(err);
				} else {
					callback(null, items);
				}
			});
		}
	});
};

/*
 * Called By
 * Frontend: null
 * Backend: Item.updateById
 */
Item.findItemById = function (options, callback) {
	options = options || {};
	var conditions = {
		id: options.id
	};

	checkConditions(conditions, function (err, checkedConditions) {
		if (err) {
			callback(err);
		} else {
			findItems(checkedConditions, function (err, items) {
				if (err) {
					callback(err);
				} else {
					if (items.length == 1) {
						callback(null, items[0]);
					} else if (items.length == 0) {
						callback({code : 404, message : "no record"});
					} else {
						callback({code : 403, message : "item more than one"});
					}
				}
			});
		}
	});
};


/*
 * Called By
 * Frontend: null
 * Backend: Item.findActiveItemByVendorIdWithInventory, Item.findActiveItemByVendorIdWithStat
 */
Item.findActiveItemByVendorId = function (options, callback) {
	options = options || {};

	var conditions = {
		vendorId: options.vendorId,
		active: true
	};

	checkConditions(conditions, function (err, checkedConditions) {
		if (err) {
			callback(err);
		} else {
			findItems(checkedConditions, function (err, items) {
				if (err) {
					callback(err);
				} else {
					if (items.length == 1) {
						callback(null, items[0]);
					} else if (items.length == 0) {
						callback(null, null);
					} else {
						callback({code : 403, message : "item more than one"});
					}
				}
			});
		}
	});
};


/*
 * Called By
 * Frontend: Item
 * Backend: null
 */
Item.findItemsByVendorIdWithInventory = function (options, callback) {
	var self = this;
	options = options || {};

	self.findItemsByVendorId(options, function (err, items) {
		if (err) {
			callback(err);
		} else if (items) {

			var findQuantity = function (item, done) {
				Inventory.findQuantityByConditions({itemId: item._id}, function (err, current) {
					if (err) {
						done(err);
					} else {
						item.quantity = current.quantity;
						done(null, item);
					}
				});
			}

			arrayHelper.walkArray(items, {}, findQuantity, function (err, items) {
				if (err) {
					callback(err);
				} else {
					callback(null, items);
				}
			});
		} else {
			callback(null, item);
		}
	});
};


/*
 * Called By
 * Frontend: Vendor
 * Backend: null
 *
 * find today stock out quantity, month stock out quantity and existing quantity
 */
Item.findActiveItemByVendorIdWithDetailsInventory = function (options, callback) {
	var self = this;
	options = options || {};

	self.findActiveItemByVendorIdWithInventory(options, function (err, item) {
		if (err) {
			callback(err);
		} else if (item) {
			Inventory.findQuantityByConditions({itemId: item._id, reasons: "consumption", date: new Date().toDateFormat('yyyyMMdd')}, function (err, todaySold) {
				if (err) {
					callback(err);
				} else {
					item.todaySoldQuantity = todaySold.quantity;
					Inventory.findQuantityByConditions({itemId: item._id, reasons: "consumption", month: new Date().toDateFormat('yyyyMMdd')}, function (err, monthSold) {
						if (err) {
							callback(err);
						} else {
							item.monthSoldQuantity = monthSold.quantity;
							callback(null, item);
						}
					});
				}
			});
		} else {
			callback(null, item);
		}
	});
};


/*
 * Called By
 * Frontend: Item, Vendor
 * Backend: Item.findActiveItemByVendorIdWithDetailsInventory
 */
Item.findActiveItemByVendorIdWithInventory = function (options, callback) {
	var self = this;
	options = options || {};

	self.findActiveItemByVendorId(options, function (err, item) {
		if (err) {
			callback(err);
		} else if (item) {
			Inventory.findQuantityByConditions({itemId: item._id}, function (err, current) {
				if (err) {
					callback(err);
				} else {
					item.quantity = current.quantity;
					callback(null, item);
				}
			});
		} else {
			callback(null, item);
		}
	});
};

/*
 * Called By
 * Frontend: null
 * Backend: Vendor.findVendorByConditionsWithStat
 */
Item.findActiveItemByVendorIdWithStat = function (options, callback) {
	var self = this;
	options = options || {};

	self.findActiveItemByVendorId(options, function (err, item) {
		if (err) {
			callback(err);
		} else if (item) {
			Inventory.findQuantityByConditions({itemId: item._id, reasons: "consumption"}, function (err, totalSold) {
				if (err) {
					callback(err);
				} else {
					item.totalSoldQuantity = totalSold.quantity;
					Inventory.findQuantityByConditions({itemId: item._id, reasons: ["return", "damaged"]}, function (err, damagedOrReturn) {
						if (err) {
							callback(err);
						} else {
							item.damagedOrReturnQuantity = damagedOrReturn.quantity;
							callback(null, item);
						}
					});
				}
			});
		} else {
			callback(null, item);
		}
	});
};

Item.updateById = function (options, callback) {
	options = options || {};
	var conditions = options.conditions;
	var update = options.update;
	var self = this;
	var user = options.user;

	var permission = permissionManager.createChain();
	permission.item.handleRequest({user : user}, function (err, allow) {
		if (err) {
			callback(err);
		} else {
			if (allow) {
				self.findItemById(conditions, function (err, item) {
					if (err) {
						callback(err);
					} else {
						item.updateItem(update, callback);
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
Item.exportAllActiveItemsQuantity = function (options, callback) {
	var self = this;
	options = options || {};
	var excel = options.excel;

	var conditions = {
		populate: {
			path: 'vendorId',
			select: 'chiBrandName engBrandName vendorCode'
		}
	};

	findItems(conditions, function (err, items) {
		if (err) {
			callback(err);
		} else {
			var findQuantity = function (item, done) {
				Inventory.findQuantityByConditions({itemId: item._id}, function (err, current) {
					if (err) {
						done(err);
					} else {
						item.vendorName = item.vendorId.chiBrandName;
						item.vendorCode = item.vendorId.vendorCode;
						item.quantity = current.quantity;
						done(null, item);
					}
				});
			}

			arrayHelper.walkArray(items, {}, findQuantity, function (err, items) {
				if (err) {
					callback(err);
				} else {
					var variable = {
						center: options.branch,
						printDate: new Date().toDateFormat('yyyy-MM-dd HH:mm:ss')
					};

					excel.loadDataToHeader(variable);
					excel.loadDataToRows({rows: items});
					callback(null, excel.data);
				}
			});
		}
	});
};



var exportRow = function () {
  var rowIndex = 0;

  return function (item, header, callback) {
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
						self(item, prop.trim(), function (value){
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
					item = item[headers[i]]
					i++;
					len--;
				}
				callback(item);
			} else if (arrayHelper.isArray( item[header] )) {
				callback(item[header].join(','));
			} else if (typeof item[header] == 'string') {
				callback(item[header].toString());
			} else if (typeof item[header] == 'boolean') {
				callback(item[header]);
			} else if (typeof item[header] != 'undefined') {
				callback(item[header]);
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
Item.prototype.saveItem = function (callback) {
	var self = this;

	saveToRepository(this, callback);
};

Item.prototype.updateItem = function (update, callback) {
	for (var key in update) {
		// console.log(key, update[key]);
		this[key] = update[key];
	}
	this.saveItem(callback);
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

	if (options.code) {
		conditions.code = options.code;
	}

	if (options.vendorId) {
		conditions.vendorId = options.vendorId;
	}

	if (options.vendorIds) {
		conditions.vendorIds = options.vendorIds;
	}

	if (options.creator) {
		conditions.creator = options.creator;
	}

	if (options.name) {
		conditions.name = options.name;
	}

	if (options.chiName) {
		conditions.chiName = options.chiName;
	}

	if (options.description) {
		conditions.description = options.description;
	}

	if (options.engName) {
		conditions.engName = options.engName;
	}

	if (options.itemCode) {
		conditions.itemCode = options.itemCode;
	}

	if (options.replenishmentLevel) {
		conditions.replenishmentLevel = options.replenishmentLevel;
	}

	if (options.supplyPeriod) {
		conditions.supplyPeriod = options.supplyPeriod;
	}

	if (options.unit) {
		conditions.unit = options.unit;
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

var findItems = function (options, callback) {
	findItemsFromRepository(options, function (err, items, total) {
		if (DEBUG) {
			console.log(err, items);
		}
		callback(err, items, total);
	});
};

var findItemsFromRepository = function (conditions, callback) {
	var _callback = function (err, itemArray, total) {
		if (err) {
			callback(err);
		} else {
			var items = initFromArray(itemArray);
			callback(null, items, total);
		}
	};

	if (USE_CHILD_PROCESS) {
		findItemsFromRepositoryWitChildProcess(conditions, callback);
	} else {
		ItemRepository.findByConditions(conditions, _callback);
	}
};

function init (value) {
	return new Item(value);
};

var initFromArray = function (arr) {
	return arr.map(function (itemObject) {
		return init(itemObject);
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
			path: 'creator',
			match: match
		}
	} else {
		conditions.populate = {
			path: 'creator'
		}
	}

	return conditions;
};

/*
 * item: Item instance
 * callback: Item instance
 */
var saveToRepository = function (item, callback) {
	/* add and update */
	if (USE_CHILD_PROCESS) {
		saveToRepositoryWithChildProcess(item, callback);
	} else {
		ItemRepository.saveItem(item, function (err, itemObject) {
			callback(err, init(itemObject));
		});
	}
};

var validateItemOptions = function (options, callback) {
	if (options.chiName && options.engName && options.vendorId && options.creator) {
		options.chiName = options.chiName;
		options.engName = options.engName;
		options.vendorId = options.vendorId;
		options.description = options.description || '';
		options.creator = options.creator;
		callback(null, options);
	} else {
		callback({code : 400, message : "No Item name and vendorId is provided"});
	}
};
/*********************************************
 * Export as a module
 *********************************************/
module.exports = Item;
