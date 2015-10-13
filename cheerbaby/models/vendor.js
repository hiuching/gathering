/*********************************************
 * The Vendor model
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
var fs = require('fs');

/*********************************************
 * Include Class
 *********************************************/
var ArrayFilter = require('./arrayFilters/arrayFilter');
var StandardArrayFilter = require('./arrayFilters/standardArrayFilter');

/*********************************************
 * Include Repository
 *********************************************/
var vendorRepositoryPath = './models/repositories/vendorRepository';
var VendorRepository = require('./repositories/vendorRepository');
var User = require('./user');
var PermissionManager = require('./permissions/permissionManager');
var permissionManager = new PermissionManager();


/*********************************************
 * CONSTANT declaration
 *********************************************/
const DEBUG = false;
// const USE_CHILD_PROCESS = true;
const USE_CHILD_PROCESS = false;

/*********************************************
 * Class definition
 *********************************************/
function Vendor(options){
	options = options || {};

	this._id = options._id || null;
	this.active = options.active;
	this.businessRegistrationNumber = options.businessRegistrationNumber || '';
	this.categoryId = options.categoryId || null;
	this.contactList = options.contactList || [];
	this.contract = options.contract || {};
	this.code = options.code || '';
	this.chiBrandName = options.chiBrandName || '';
	this.chiClubName = options.chiClubName || '';
	this.chiCompanyName = options.chiCompanyName || '';
	this.chiDisplayName = options.chiDisplayName || '';
	this.engBrandName = options.engBrandName || '';
	this.engClubName = options.engClubName || '';
	this.engCompanyName = options.engCompanyName || '';
	this.engDisplayName = options.engDisplayName || '';
	this.vendorCode = options.vendorCode || '';
	this.categoryCode = options.categoryCode || '';
	this.files = options.files || [];
	this.information = options.information || {};
	this.remarks = options.remarks || '';
	this.publish = options.publish;
}

/*********************************************
 * Class methods
 *********************************************/
Vendor.initFromArray = function (arr, callback) {
	if (arr instanceof Array) {
	  callback(null, arr.map(init));
	} else {
	  callback('no array');
	}
};

/*
 * create static methods
 * check exist:
 * same engCompanyName and chiCompanyName
 */
Vendor.create = function (options, callback) {
	var self = this;
	var user = options.user;

	var permission = permissionManager.createChain();
	permission.vendor.handleRequest({user : user}, function (err, allow) {
		if (err) {
			callback(err);
		} else {
			if (allow) {
				validateVendorOptions(options, function (err, options) {
					if (err) {
						callback(err);
					} else {
						self.findVendorsByName({chiCompanyName : options.chiCompanyName, engCompanyName: options.engCompanyName}, function (err, foundVendors) {
							if (err) {
								callback(err);
							} else {
								if (foundVendors.length == 0) {
									var vendor = new self(options);
									vendor.saveVendor(callback);
								} else {
									callback({code :403, message : "vendor exist"});
								}
							}
						});
					}
				});
			} else {
				callback({code: 401, message : 'unauthorized user'})
			}
		}
	});
};

/*
 * update static methods
 */
Vendor.updateById = function (options, callback) {
	options = options || {};
	var self = this;
	var conditions = options.conditions;
	var update = options.update;
	var user = options.user;

	var permission = permissionManager.createChain();
	permission.vendor.handleRequest({user : user}, function (err, allow) {
		if (err) {
			callback(err);
		} else {
			if (allow) {
				self.findVendorById(conditions, function (err, vendor) {
					if (err) {
						callback(err);
					} else {
						vendor.updateVendor(update, callback);
					}
				});
			} else {
				callback({code: 401, message : 'unauthorized user'})
			}
		}
	});
};

/*
 * find static methods
 */
Vendor.findAll = function (options, callback) {
	var self = this;
	var user = options.user;
	var permission = permissionManager.createChain();

	if (objectHelper.isEmptyObject(options)) {

		permission.vendor.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findAllVendors');
					return self.findAllVendors({}, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	} else if (options.action == 'findAllActiveAndPublishVendors') {

		permission.vendor.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findAllActiveAndPublishVendors');
					return self.findAllActiveAndPublishVendors(options, callback);

				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	} else if (options.action == 'findVendorAndItemByVendorService') {

		permission.vendor.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findVendorAndItemByVendorService');
					return self.findVendorAndItemByVendorService(options, callback);
				} else {
				callback({code: 401, message : 'unauthorized user'})
			}
			}
		});

	} else if (options.action == 'findAllActiveAndPublishVendorsWithInventory') {

		permission.vendor.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findAllActiveAndPublishVendorsWithInventory');
					return self.findAllActiveAndPublishVendorsWithInventory(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

		} else if (options.action == 'findAllVendorsWithInventory') {

			permission.vendor.handleRequest({user : user}, function (err, allow) {
				if (err) {
					callback(err);
				} else {
					if (allow) {
						console.log('findAllVendorsWithInventory');
						return self.findAllVendorsWithInventory(options, callback);
					} else {
						callback({code: 401, message : 'unauthorized user'})
					}
				}
			});

	} else if (options.action == 'findVendorAndItemByCode') {

		permission.vendor.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findVendorAndItemByCode');
					return self.findVendorAndItemByCode(options, callback);
				} else {
				callback({code: 401, message : 'unauthorized user'})
			}
			}
		});

	} else if (options.action == 'findVendorById') {

		permission.vendor.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findVendorById');
					return self.findVendorById(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	} else if (options.action == 'findByUniveralSearch') {

		console.log('findByUniveralSearch');
		return self.findVendorsByUniveralSearch(options, callback);

	} else {

		permission.vendor.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findAllActiveAndPublishVendors');
					return self.findAllActiveAndPublishVendors(options, callback);

				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	}
};

/*
 * Called By
 * Frontend: Vendor
 * Backend: null
 */
Vendor.findVendorsByUniveralSearch = function (options, callback) {
	options = options || {};
	var self = this;

	checkConditions(options, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findVendors(conditions, callback);
		}
	});
};

/*
 * Called By
 * Frontend: Vendor
 * Backend: null
 */
Vendor.findVendorAndItemByCode = function (options, callback) {
	options = options || {};

	if (options.code) {
		var conditions = {
			code : options.code
		};
		checkConditions(conditions, function (err, conditions) {
			if (err) {
				callback(err);
			} else {
				// console.log("conditions", conditions);
				findVendors(conditions, function (err, vendors) {
					if (err) {
						callback(err);
					} else {
						if (vendors.length > 0) {
							var vendor = vendors[0];

							var Item = require('./item');
							Item.findActiveItemByVendorIdWithInventory({vendorId: vendor._id}, function (err, item) {
								if (err) {
									callback(err);
								} else {
									vendor.item = item;
									callback(null, vendor);
								}
							});
						} else {
							callback({code :400, message : "No this vendor"});
						}
					}
				});
			}
		});
	} else {
		callback({code :400, message : "Please enter vendor code"});
	}
};

/*
 * Called By
 * Frontend: null
 * Backend: Vendor.create
 */
Vendor.findVendorsByName = function (options, callback) {
	options = options || {};

	if (options.chiCompanyName && options.engCompanyName) {
		var conditions = {
			chiCompanyName : options.chiCompanyName,
			engCompanyName : options.engCompanyName
		};
		checkConditions(conditions, function (err, conditions) {
			if (err) {
				callback(err);
			} else {
				// console.log("conditions", conditions);
				findVendors(conditions, callback);
			}
		});
	} else {
		callback({code :400, message : "Please enter vendor name"});
	}
};

/*
 * Called By
 * Frontend: null
 * Backend: Vendor.updateById
 */
Vendor.findVendorById = function (options, callback) {
	options = options || {};
	var conditions = {
		id: options.id
	};

	checkConditions(conditions, function (err, checkedConditions) {
		if (err) {
			callback(err);
		} else {
			findVendors(checkedConditions, function (err, vendors) {
				if (err) {
					callback(err);
				} else {
					if (vendors.length == 1) {
						callback(null, vendors[0]);
					} else if (vendors.length == 0) {
						callback({code :404, message : "no record"});
					} else {
						callback({code :403, message : "user more than one"});
					}
				}
			});
		}
	});
};

/*
 * Called By
 * Frontend: Vendor
 * Backend: null
 */
Vendor.findVendorAndItemByVendorService = function (options, callback) {
	options = options || {};
	options.active = true;
	options.publish = true;

	checkConditions(options, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findVendors(conditions, function (err, vendors) {
				if (err) {
					callback(err);
				} else {
					if (vendors.length > 0) {
						var findItems = function (vendor, done) {
							var Item = require('./item');
							Item.findActiveItemByVendorIdWithInventory({vendorId: vendor._id}, function (err, item) {
								if (err) {
									done(err);
								} else {
									vendor.item = item;
									done(null, vendor);
								}
							});
						}

						arrayHelper.walkArray(vendors, {}, findItems, callback);
					} else {
						callback({code :400, message : "No this vendor"});
					}
				}
			});
		}
	});
};

/*
 * Called By
 * Frontend: Vendor
 * Backend: Vendor.findAllActiveAndPublishVendorsWithInventory
 */
Vendor.findAllActiveAndPublishVendors = function (options, callback) {
	options = options || {};
	options.active = true;
	options.publish = true;

	checkConditions(options, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findVendors(conditions, callback);
		}
	});
};


/*
 * Called By
 * Frontend: null
 * Backend: Vendor
 */
Vendor.findAllVendors = function (options, callback) {
	options = options || {};
	var user = options.user;

	checkConditions(options, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findVendors(conditions, callback);
		}
	});
};



/*
 * Called By
 * Frontend: Vendor
 * Backend: null
 */
Vendor.findAllVendorsWithInventory = function (options, callback) {
	options = options || {};
	var self = this;

	self.findAllVendors(options, function (err, vendors) {
		if (err) {
			callback(err);
		} else {
			var Item = require('./item');

			var calucalteQuantity = function (vendor, done) {
				Item.findActiveItemByVendorIdWithDetailsInventory({vendorId: vendor._id}, function (err, item) {
					if (err) {
						done(err);
					} else {
						vendor.item = item; // use for defined whether the vendor is no item

						item = item || {};
						vendor.replenishmentLevel = item.replenishmentLevel || 0;
						vendor.quantity = item.quantity || 0;
						vendor.todaySoldQuantity = (item.todaySoldQuantity) ? item.todaySoldQuantity.toString().slice(1) : 0;
						vendor.monthSoldQuantity = (item.monthSoldQuantity) ? item.monthSoldQuantity.toString().slice(1) : 0;
						done(null, vendor);
					}
				});
			};

			arrayHelper.walkArray(vendors, {}, calucalteQuantity, function (err, vendors) {
				if (err) {
					callback(err);
				} else {
					if (options.replanishment == 'true') {
						callback(null, vendors.filter(function (vendor) {
							return (vendor.item && vendor.replenishmentLevel >= vendor.quantity);
						}));
					} else {
						callback(null, vendors);
					}
				}
			});
		}
	});
};


/*
 * Called By
 * Frontend: Vendor
 * Backend: null
 */
Vendor.findAllActiveAndPublishVendorsWithInventory = function (options, callback) {
	options = options || {};
	var self = this;

	self.findAllActiveAndPublishVendors(options, function (err, vendors) {
		if (err) {
			callback(err);
		} else {
			var Item = require('./item');

			var calucalteQuantity = function (vendor, done) {
				Item.findActiveItemByVendorIdWithDetailsInventory({vendorId: vendor._id}, function (err, item) {
					if (err) {
						done(err);
					} else {
						vendor.item = item; // use for defined whether the vendor is no item

						item = item || {};
						vendor.replenishmentLevel = item.replenishmentLevel || 0;
						vendor.quantity = item.quantity || 0;
						vendor.todaySoldQuantity = (item.todaySoldQuantity) ? item.todaySoldQuantity.toString().slice(1) : 0;
						vendor.monthSoldQuantity = (item.monthSoldQuantity) ? item.monthSoldQuantity.toString().slice(1) : 0;
						done(null, vendor);
					}
				});
			};

			arrayHelper.walkArray(vendors, {}, calucalteQuantity, function (err, vendors) {
				if (err) {
					callback(err);
				} else {
					if (options.replanishment == 'true') {
						callback(null, vendors.filter(function (vendor) {
							return (vendor.item && vendor.replenishmentLevel >= vendor.quantity);
						}));
					} else {
						callback(null, vendors);
					}
				}
			});
		}
	});
};

/*********************************************
 * Export Function
 *********************************************/
Vendor.exportToArray = function (options, callback) {
	var self = this;
	options = options || {};
	var excel = options.excel;

	self.findVendorByConditionsWithStat({id: options.id}, function (err, vendors) {
		if (err) {
			callback(err);
		} else {
			var vendor = vendors[0];
			var replaceData = {
				'vendorCode': vendor.vendorCode,
				'vendorName': vendor.chiBrandName + ', ' + vendor.engBrandName,
				'cooperationPeriod': (vendor.contract.cooperationPeriod) ? vendor.contract.cooperationPeriod : '',
				'soldQuantity': vendor.totalSoldQuantity,
				'unit': vendor.unit,
				'returnedQuantity': vendor.damagedOrReturnQuantity,
				'date': options.dateFrom + '-' + options.dateTo
			};

			User.prepareDataForReport({vendorId: options.id, active: true, giftDateFrom: options.dateFrom, giftDateTo: options.dateTo}, function(err, rows){
				replaceData.totalMemeber = rows.length;

				excel.loadDataToHeader(replaceData);
				excel.loadDataToRows({rows: rows});
				callback(null, excel.data);
			});
		}
	});
};


Vendor.findVendorByConditionsWithStat = function (options, callback) {
	var self = this;
	options = options || {};

	// will display error when vendors is zero if using findVendorById
	self.findAllVendors({id: options.id}, function(err, vendors) {
		if (err) {
			callback(err);
		} else {
			var Item = require('./item');
			var findEach = function (vendor, done) {
				Item.findActiveItemByVendorIdWithStat({vendorId: vendor._id}, function (err, item) {
					if (err) {
						done(err);
					} else {
						item = item || {};

						vendor.totalSoldQuantity = (item.totalSoldQuantity) ? item.totalSoldQuantity.toString().slice(1) : 0;
						vendor.damagedOrReturnQuantity = (item.damagedOrReturnQuantity) ? item.damagedOrReturnQuantity.toString().slice(1) : 0;
						vendor.unit = item.unit;

						done(null, vendor);
					}
				});
			};

			arrayHelper.walkArray(vendors, {}, findEach, callback);
		}
	});
}

Vendor.exportVendorsList = function (options, callback) {
	var self = this;
	options = options || {};
	var excel = options.excel;
	var conditions = {
		vendorService: options.vendorService
	};

	self.findAllVendors(conditions, function (err, vendors) {
		if (err) {
			callback(err);
		} else {
			vendors.forEach(function (vendor) {
				vendor.category = vendor.categoryId.name;
				vendor.service = vendor.contract.service;
				vendor.expDate = vendor.contract.endDate;
			});

			var variable = {
				printDate: new Date().toDateFormat('yyyy-MM-dd HH:mm:ss')
			};
			excel.loadDataToHeader(variable);
			excel.loadDataToRows({rows: vendors});
			callback(null, excel.data);
		}
	});
};

Vendor.exportVendorsApplication = function (options, callback) {
	options = options || {};
	var self = this;
	var excel = options.excel;
	var Appointment = require('../models/appointment');

	Appointment.countNumOfAppointmentsAndArrivalAppointments({dateFrom: options.dateFrom, dateTo: options.dateTo}, function (err, appointmentStat) {
		if (err) {
			callback(err);
		} else {
			self.findAllVendors({}, function (err, vendors) {
				if (err) {
					callback(err);
				} else {
					var findAppointments = function (vendor, done) {
						var conditions = {
							dateFrom: options.dateFrom,
							dateTo: options.dateTo,
							populate: {
								path: 'userId',
								match: {'vendors': {$elemMatch: {vendorId: vendor._id}}}
							}
						};
						Appointment.findAllAppointments(conditions, function (err, appointments) {
							if (err) {
								done(err);
							} else {
								vendor.noOfAppointment = appointmentStat.totalAppointments;
								vendor.attendance = appointmentStat.arrivalAppointments;
								vendor.noOfClubJoined = appointments.length;
								vendor.joinedPercentage = (vendor.noOfClubJoined/ vendor.attendance * 100) + '%';

								done(null, vendor);
							}
						});
					};

					arrayHelper.walkArray(vendors, {}, findAppointments, function (err, vendors) {
						if (err) {
							callback(err);
						} else {
							var variable = {
								printDate: new Date().toDateFormat('yyyy-MM-dd HH:mm:ss'),
								date: options.dateFrom + ((options.dateTo) ? ' - ' + options.dateTo : ''),
							};
							excel.loadDataToHeader(variable);
							excel.loadDataToRows({rows: vendors});
							callback(null, excel.data);
						}
					});
				}
			});
		}
	});
};


Vendor.exportAllVendorRecord = function (options, callback) {
	options = options || {};
	var self = this;
	var excel = options.excel;
	var Appointment = require('../models/appointment');
	var emptyQuantityOrFreeVendors = [];

	var variable = {
		printDate: new Date().toDateFormat('yyyy-MM-dd HH:mm:ss'),
		date: options.dateFrom + ((options.dateTo) ? ' - ' + options.dateTo : ''),
		center: options.branch,
		totalQuantity: 0
	};

	self.findAllVendors({}, function (err, vendors) {
		if (err) {
			callback(err);
		} else {
			var findAppointments = function (vendor, done) {
				var conditions = {
					dateFrom: options.dateFrom,
					dateTo: options.dateTo,
					populate: {
						path: 'userId',
						match: {'vendors': {$elemMatch: {vendorId: vendor._id}}}
					}
				};
				Appointment.findAllAppointments(conditions, function (err, appointments) {
					if (err) {
						done(err);
					} else {
						vendor.consumption = appointments.length || 0;
						vendor.findingDate = options.dateFrom;

						if (vendor.consumption == 0 || vendor.contract.fee == 0 || vendor.contract.fee == '') {
							emptyQuantityOrFreeVendors.push(vendor._id);
						}

						done(null, vendor);
					}
				});
			};

			arrayHelper.walkArray(vendors, {}, findAppointments, function (err, vendors) {
				if (err) {
					callback(err);
				} else {
					var exportVendors = vendors.filter(function (vendor) {
						return (emptyQuantityOrFreeVendors.indexOf(vendor._id) == -1);
					});

					excel.loadDataToHeader(variable);
					excel.loadDataToRows({rows: exportVendors, exportRow: exportRow});
					callback(null, excel.data);
				}
			});
		}
	});
};

var addZero = function (str, max) {
	str = str.toString();
	return str.length < max ? addZero("0" + str, max) : str;
};

var exportRow = function () {
  var rowIndex = 0;

  return function (vendor, header, callback) {
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
					if (prop.trim().length !== 0) {
						self(vendor, prop.trim(), function (value){
							result += value;
						});
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

				while (len !== 0) {
					vendor = vendor[headers[i]];
					i++;
					len--;
				}
				callback(vendor);
			} else if (header == 'invoiceNum') {
				var year = new Date(vendor.findingDate).getYear().toString().substr(-2);
				var month = new Date(vendor.findingDate).getMonth() + 1;
				month = month.toString();

				callback('CB' + year + addZero(month, 2) + addZero(rowIndex, 4));
			} else if (header == 'monthlyLastDate') {
				callback(new Date(vendor.findingDate).lastDate());
			} else if (header == 'dateDue') {
				var lastDate = new Date(vendor.findingDate).lastDate();
				var dueDate = new Date(lastDate);
				dueDate.setDate(lastDate.getDate() + 14);

				callback(dueDate);
			} else if (header == 'vendorName') {
				callback(vendor.chiBrandName);
			} else if (header == 'account_itemID') {
				var text = '';
				if (vendor.contract.service == 'Member Easy') {
					text = 'MEMBER_' + vendor.contract.fee;
				} else {
					text = 'INFO_' + vendor.contract.fee;
				}

				callback(text);
			} else if (header == 'vendorServiceDesciption') {
				var text = '';
				if (vendor.contract.service == 'Member Easy') {
					text = 'MEMBER_' + vendor.contract.fee;
				} else {
					text = 'INFO_' + vendor.contract.fee;
				}

				callback(text);
			} else if (header == 'account_description') {
				callback('Cheer Baby - Monthly fee of ' + vendor.contract.service + 'Service');
			} else if (header == 'amount') {
				callback(vendor.consumption * (vendor.contract.fee ? parseInt(vendor.contract.fee) : 0));
			} else if (header == 'cost') {
				callback((vendor.contract.fee ? parseInt(vendor.contract.fee) : 0));
			} else if (header == 'total')	{
				var fee = (vendor.contract.fee) ? parseInt(vendor.contract.fee) : 0;
				callback(vendor.quantity*fee);
			} else if (header.indexOf('_') == 0) {
				callback(header.substr(1));
			} else if (arrayHelper.isArray( vendor[header] )) {
				callback(vendor[header].join(','));
			} else if (typeof vendor[header] == 'string') {
				callback(vendor[header].toString());
			} else if (typeof vendor[header] == 'boolean') {
				callback(vendor[header]);
			} else if (typeof vendor[header] != 'undefined') {
				callback(vendor[header]);
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
Vendor.prototype.saveVendor = function (callback) {
	var self = this;

	saveToRepository(this, callback);
};

Vendor.prototype.updateVendor = function (update, callback) {
	for (var key in update) {
		// console.log(key, update[key]);
		this[key] = update[key];
	}
	this.saveVendor(callback);
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

	if (typeof options.businessRegistrationNumber != 'undefined') {
		conditions.businessRegistrationNumber = options.businessRegistrationNumber;
	}

	if (options.categoryId) {
		conditions.categoryId = options.categoryId;
	}

	if (options.contactList) {
		conditions.contactList = options.contactList;
	}

	if (options.contract) {
		conditions.contract = options.contract;
	}

	if (options.code) {
		conditions.code = options.code;
	}

	if (options.chiBrandName) {
		conditions.chiBrandName = options.chiBrandName;
	}

	if (options.chiClubName) {
		conditions.chiClubName = options.chiClubName;
	}

	if (options.chiCompanyName) {
		conditions.chiCompanyName = options.chiCompanyName;
	}

	if (options.chiDisplayName) {
		conditions.chiDisplayName = options.chiDisplayName;
	}

	if (options.engBrandName) {
		conditions.engBrandName = options.engBrandName;
	}

	if (options.engClubName) {
		conditions.engClubName = options.engClubName;
	}

	if (options.engCompanyName) {
		conditions.engCompanyName = options.engCompanyName;
	}

	if (options.engDisplayName) {
		conditions.engDisplayName = options.engDisplayName;
	}

	if (options.files) {
		conditions.files = options.files;
	}

	if (options.information) {
		conditions.information = options.information;
	}

	if (options.name) {
		conditions.name = options.name;
	}


	if (options.remarks) {
		conditions.remarks = options.remarks;
	}

	if (typeof options.publish != 'undefined') {
		conditions.publish = options.publish;
	}

	if (options.page) {
		conditions.page = options.page;
	}

	if (options.vendorCode) {
		conditions.vendorCode = options.vendorCode;
	}

	if (options.vendorService) {
		conditions.vendorService = options.vendorService;
	}

	if (options.universalSearch) {
		conditions.universalSearch = options.universalSearch;
	}

	if (options.populate) {
		conditions.populate = options.populate;
	} else {
		conditions.populate = {
			path: 'categoryId'
		}
	}

	if (options.sort) {
		conditions.sort = options.sort;
	}
	// console.log("conditions", conditions);
	callback(null, conditions);
};

var findVendors = function (options, callback) {
	findVendorsFromRepository(options, function (err, users, total) {
		if (DEBUG) {
			console.log(err, users);
		}
		callback(err, users, total);
	});
};

var findVendorsFromRepository = function (conditions, callback) {
	var _callback = function (err, vendorArray, total) {
		if (err) {
			callback(err);
		} else {
			var vendors = initFromArray(vendorArray);
			callback(null, vendors, total);
		}
	};

	if (USE_CHILD_PROCESS) {
		findVendorsFromRepositoryWitChildProcess(conditions, callback);
	} else {
		VendorRepository.findByConditions(conditions, _callback);
	}
};

function init (value) {
	return new Vendor(value);
};

var initFromArray = function (arr) {
	return arr.map(function (vendorObject) {
		return init(vendorObject);
	});
};

/*
 * vendor: Vendor instance
 * callback: Vendor instance
 */
var saveToRepository = function (vendor, callback) {
	/* add and update */
	if (USE_CHILD_PROCESS) {
		saveToRepositoryWithChildProcess(vendor, callback);
	} else {
		VendorRepository.saveVendor(vendor, function (err, vendorObject) {
			callback(err, init(vendorObject));
		});
	}
};

var validateVendorOptions = function (options, callback) {
	if (options.chiCompanyName && options.engCompanyName && options.categoryId) {
		options.chiCompanyName = options.chiCompanyName;
		options.engCompanyName = options.engCompanyName;
		options.vendorCode = options.vendorCode;
		options.publish = options.publish || true;
		options.active = options.active || true;
		callback(null, options);
	} else {
		callback({code :400, message : "No Vendor Name is provided"});
	}
};


/*********************************************
 * Export as a module
 *********************************************/
module.exports = Vendor;
