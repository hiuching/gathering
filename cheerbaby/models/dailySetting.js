/*********************************************
 * The DailySetting model
 *
 * author: Hillary Wong
 * created: 2015-01-09T15:16:00Z
 * modified: 2015-01-09T15:16:00Z
 *
 *********************************************/

 /*********************************************
 * Include Helpers
 *********************************************/
var arrayHelper = require('../lib/arrayHelper');
var moment = require('moment');
var mongoose = require('mongoose');
var async = require('async');
var objectHelper = require('../lib/objectHelper');


/*********************************************
 * Include Class
 *********************************************/
var ArrayFilter = require('./arrayFilters/arrayFilter');
var StandardArrayFilter = require('./arrayFilters/standardArrayFilter');

/*********************************************
 * Include Repository
 *********************************************/
var DailySettingRepositoryPath = './models/repositories/dailySettingRepository';
var DailySettingRepository = require('./repositories/dailySettingRepository');
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
function DailySetting(options){
	options = options || {};

	this._id = options._id || null;
	this.branch = options.branch || null;
	this.closingTime = options.closingTime || null;
	this.creator = options.creator || null;
	this.date = options.date || null;
	this.numOfBookedAppointments = options.numOfBookedAppointments || 0;
	this.numOfAppointment = options.numOfAppointment || null;
	this.openingTime = options.openingTime || null;

}

/*********************************************
 * Class methods (Called By Controller)
 *********************************************/
DailySetting.initFromArray = function (arr, callback) {
	if (arr instanceof Array) {
	  callback(null, arr.map(init));
	} else {
	  callback('no array');
	}
};

/*
 * create static methods
 */
DailySetting.create = function (options, callback) {
	var self = this;
	var user = options.user;

	var permission = permissionManager.createChain();
	permission.dailySetting.handleRequest({user : user}, function (err, allow) {
		if (err) {
			callback(err);
		} else {
			if (allow) {
				validateDailySettingOptions(options, function (err, options) {
					if (err) {
						callback(err);
					} else {
						self.findDailySettingsByDate({date : options.date}, function (err, foundDailySettings) {
							if (err) {
								callback(err);
							} else {
								checkIsExistOverlapDailySetting({update: options}, function (isExist) {
									if (!isExist) {
										var dailySetting = new self(options);
										dailySetting.saveDailySetting(callback);
									} else {
										callback({code: 400, message : 'This time range has already set. + ' + options.date});
									}
								});
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
 * Called By
 * Frontend: null
 * Backend: DailySetting Controller
 */
DailySetting.saveSettingsForPeriod = function (options, callback) {
	var self = this;
	var user = options.user;

	var permission = permissionManager.createChain();
	permission.dailySetting.handleRequest({user : user}, function (err, allow) {
		if (err) {
			callback(err);
		} else {
			if (allow) {
				self.findDailySettingsByDate({date : options.date}, function (err, foundDailySettings) {
					if (err) {
						callback(err);
					} else {
						if (foundDailySettings.length == 0) {
							var dailySetting = new self(options);
							dailySetting.saveDailySetting(callback);
						} else {
							var foundDailySetting = foundDailySettings[0];
							for (var prop in options) {
								if (prop !== "code") {
									foundDailySetting[prop] = options[prop];
								}
							}
							foundDailySetting.saveDailySetting(callback);
						}
					}
				});
			} else {
				callback({code: 401, message : 'unauthorized user'})
			}
		}
	});
};


/*
 * delete static methods
 */
DailySetting.deleteDailySetting = function (options, callback) {
	options = options || {};
	var id = options.id;
	var user = options.user;
	var self = this;

	var permission = permissionManager.createChain();
	permission.dailySetting.handleRequest({user : user}, function (err, allow) {
		if (err) {
			callback(err);
		} else {
			if (allow) {
				deleteFromRepository({_id: id}, callback);
			} else {
				callback({code: 400, message : 'unauthorized user'})
			}
		}
	});
};



/*
 * update static methods
 */
DailySetting.updateById = function (options, callback) {
	options = options || {};
	var conditions = options.conditions;
	var update = options.update;
	var user = options.user;
	var self = this;

	var permission = permissionManager.createChain();
	permission.dailySetting.handleRequest({user : user}, function (err, allow) {
		if (err) {
			callback(err);
		} else {
			if (allow) {
				self.findDailySettingById(conditions, function (err, dailySetting) {
					if (err) {
						callback(err);
					} else {
						self.findDailySettingsByDate({date : update.date}, function (err, foundDailySettings) {
							if (err) {
								callback(err);
							} else {
								checkIsExistOverlapDailySetting({id: dailySetting._id, update: update}, function (isExist) {
									if (!isExist) {
										dailySetting.updateDailySetting(update, callback);
									} else {
										callback({code: 400, message : 'This time range has already set. + ' + options.date});
									}
								});
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
 * find static methods
 */
DailySetting.findAll = function (options, callback) {
	var self = this;
	var user = options.user;
	var permission = permissionManager.createChain();

	if (objectHelper.isEmptyObject(options) || (options.action == 'findAllDailySettings')) {

		permission.dailySetting.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findAllDailySettings');
					return self.findAllDailySettings(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'});
				}
			}
		});

	} else if (options.action == 'findDailySettingsByDate') {

		console.log('findDailySettingsByDate');
		return this.findDailySettingsByDate(options, callback);

	} else if (options.action == 'findDailySettingsByDateRange') {

		console.log('findDailySettingsByDateRange');
		return this.findDailySettingsByDateRange(options, callback);

	} else if (options.action == 'findVaildBookingDates') {

		console.log('findVaildBookingDates');
		return this.findVaildBookingDates(options, callback);

	} else if (options.action == 'findDailySettingById') {

		var permission = permissionManager.createChain();
		permission.dailySetting.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findDailySettingById');
					return self.findDailySettingById(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'});
				}
			}
		});

	} else {
		callback({code :400, message : "invalid action"})
	}
};


/*
 * Called By
 * Frontend: DailySetting find default
 * Backend: null
 */
DailySetting.findAllDailySettings = function (options, callback) {
	options = options || {};

	findDailySettings(options, callback);
};


/*
 * Called By
 * Frontend: DailySetting(findDailySettingsByDateRange)
 * Backend: null
 */
DailySetting.findDailySettingsByDateRange = function (options, callback) {
	options = options || {};

	var conditions = {
		dateFrom : options.dateFrom,
		dateTo: options.dateTo
	};
	checkConditions(conditions, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findDailySettings(conditions, callback);
		}
	});
};

/*
 * Called By
 * Frontend: DailySetting, Appointment
 * Backend: DailySetting.create, DailySetting.saveSettingsForPeriod, DailySetting.updateById, DailySetting.updateNumOfBookedAppointments
 */
DailySetting.findDailySettingsByDate = function (options, callback) {
	options = options || {};

	if (options.date) {
		var conditions = {
			date: options.date,
			sort: {openingTime: 1}
		};
		checkConditions(conditions, function (err, conditions) {
			if (err) {
				callback(err);
			} else {
				findDailySettings(conditions, callback);
			}
		});
	} else {
		callback({code :400, message : "Please enter dailySetting date"});
	}
};


/*
 * Called By
 * Frontend: null
 * Backend: appointment.create, dailySetting.updateNumOfBookedAppointments
 */
DailySetting.findDailySettingsByDateAndTime = function (options, callback) {
	options = options || {};

	this.findDailySettingsByDate(options, function (err, dailySettings) {
		if (err) {
			callback(err);
		} else {
			if (dailySettings.length > 0) {
				findDailySettingByTime({dailySettings: dailySettings, time: options.time}, callback);
			} else {
				callback({code: 404, message: "Admin havn't free this date"});
			}
		}
	});
};



/*
 * Called By
 * Frontend: Appointment
 * Backend: null
 */
DailySetting.findVaildBookingDates = function (options, callback) {
	options = options || {};

	var conditions = {
		oneDayAfter : true
	};
	checkConditions(conditions, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findDailySettings(conditions, function (err, dailySettings) {
				if (err) {
					callback(err);
				} else {
					var validBookingDates = [];
					dailySettings.forEach(function (dailySetting) {
						if (dailySetting.numOfAppointment > dailySetting.numOfBookedAppointments) {
							validBookingDates.push(new Date(dailySetting.date).toDateFormat('yyyy-MM-dd'));
						}
					});
					callback(null, validBookingDates);
				}
			});
		}
	});
};

/*
 * Called By
 * Frontend: DailySetting
 * Backend: DailySetting.updateById
 */
DailySetting.findDailySettingById = function (options, callback) {
	options = options || {};

	var conditions = {
		id: options.id
	};

	checkConditions(conditions, function (err, checkedConditions) {
		if (err) {
			callback(err);
		} else {
			findDailySettings(checkedConditions, function (err, dailySettings) {
				if (err) {
					callback(err);
				} else {
					if (dailySettings.length == 1) {
						callback(null, dailySettings[0]);
					} else if (dailySettings.length == 0) {
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
 * Frontend: null
 * Backend: Appointment
 */
DailySetting.updateNumOfBookedAppointments = function (options, callback) {
	options = options || {};

	this.findDailySettingsByDateAndTime(options, function(err, dailySetting) {
		if (err) {
			console.log("Havn't update this time - " + options);
			callback(err);
		} else {
			var numOfBookedAppointments = dailySetting.numOfBookedAppointments;
			numOfBookedAppointments = numOfBookedAppointments + parseInt(options.quantity);
			dailySetting.updateDailySetting({numOfBookedAppointments: numOfBookedAppointments}, callback);
		}
	});
};

/*********************************************
 * Instance methods
 *********************************************/
DailySetting.prototype.saveDailySetting = function (callback) {
	var self = this;

	saveToRepository(this, callback);
};

DailySetting.prototype.updateDailySetting = function (update, callback) {
	for (var key in update) {
		// console.log(key, update[key]);
		this[key] = update[key];
	}
	this.saveDailySetting(callback);
};

/*********************************************
 * Helper functions
 *********************************************/

var alwaysTrue = function () {
  return true;
};



var checkConditions = function (options, callback) {
	options = options || {};
	var conditions = {};

	if (options.id) {
		conditions._id = options.id;
	}

	if (typeof options.afterToday !== 'undefined') {
		conditions.afterToday = options.afterToday;
	}

	if (typeof options.oneDayAfter !== 'undefined') {
		conditions.oneDayAfter = options.oneDayAfter;
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

	if (options.openingTime) {
		conditions.openingTime = options.openingTime;
	}

	if (options.closingTime) {
		conditions.closingTime = options.closingTime;
	}

	if (options.code) {
		conditions.code = options.code;
	}

	if (options.creator) {
		conditions.creator = options.creator;
	}

	if (options.numOfBookedAppointments) {
		conditions.numOfBookedAppointments = options.numOfBookedAppointments;
	}

	if (options.populate) {
		conditions.populate = options.populate;
	}

	if (options.sort) {
		conditions.sort = options.sort;
	}
	callback(null, conditions);
};

var checkIsExistOverlapDailySetting = function (options, callback) {
	var update = options.update;

	DailySetting.findDailySettingsByDate({date : update.date}, function (err, foundDailySettings) {
		if (err) {
			callback(err);
		} else {
			var existedRecord = false;

			var checkTime = function (foundDailySetting, done) {
				if (options.id && (options.id.toString() == foundDailySetting._id.toString())) {
					done(null);
				} else {
					var openingTime = moment(foundDailySetting.openingTime, 'HH:mm');
					var closingTime = moment(foundDailySetting.closingTime, 'HH:mm');
					var newOpeningTime = moment(update.openingTime, 'HH:mm');
					var newClosingTime = moment(update.closingTime, 'HH:mm');

					if ( (newOpeningTime.unix() >= openingTime.unix() && newOpeningTime.unix() < closingTime.unix()) || ( newClosingTime.unix() >= openingTime.unix() && newClosingTime.unix() < closingTime.unix() )){
						existedRecord = true;
						done(null);
					} else {
						done(null);
					}
				}
			};

			arrayHelper.walkArray(foundDailySettings, {}, checkTime, function () {
				callback(existedRecord);
			});
		}
	});
};

var findDailySettingByTime = function (options, callback) {
	async.each(
		options.dailySettings,
		function (dailySetting, callback) {
			// check each dailySetting opening and closing time
			var openingTime = moment(dailySetting.openingTime, 'HH:mm');
			var closingTime = moment(dailySetting.closingTime, 'HH:mm');
			var bookingTime = moment(options.time, 'HH:mm a');

			if (bookingTime.isBetween(openingTime, closingTime) || bookingTime.isSame(openingTime) || bookingTime.isSame(closingTime)) {
				callback(dailySetting);
			} else {
				callback();
			}
		},
		function (dailySetting) {
			if (dailySetting) {
				callback(null, dailySetting);
			} else {
				callback({code: 404, message: "Haven't exist this booking date or time"});
			}
		}
	);
};

var findDailySettings = function (options, callback) {
	findDailySettingsFromRepository(options, function (err, dailySetting) {
		if (DEBUG) {
			console.log(err, dailySetting);
		}
		callback(err, dailySetting);
	});
};

var findDailySettingsFromRepository = function (conditions, callback) {
	var _callback = function (err, dailySettingArray) {
		if (err) {
			callback(err);
		} else {
			var dailySettings = initFromArray(dailySettingArray);
			callback(null, dailySettings);
		}
	};
	if (USE_CHILD_PROCESS) {
		findDailySettingsFromRepositoryWitChildProcess(conditions, callback);
	} else {
		DailySettingRepository.findByConditions(conditions, _callback);
	}
};


var init = function (userObject) {
	var dailySettingRepository = new DailySettingRepository(userObject);
	return initFromRepository(dailySettingRepository);
};

var initFromArray = function (arr) {
	return arr.map(function (dailySettingObject) {
		return init(dailySettingObject);
	});
};

var initFromRepository = function (dailySettingRepository) {
	return new DailySetting(dailySettingRepository);
};

/*
 * DailySetting: DailySetting instance
 * callback: DailySetting instance
 */
var saveToRepository = function (dailySetting, callback) {
	/* add and update */
	if (USE_CHILD_PROCESS) {
		saveToRepositoryWithChildProcess(dailySetting, callback);
	} else {
		DailySettingRepository.saveDailySetting(dailySetting, function (err, dailySettingObject) {

			callback(err, init(dailySettingObject));
		});
	}
};

var deleteFromRepository = function (conditions, callback) {
	DailySettingRepository.deleteDailySettings(conditions, callback);
};

var validateDailySettingOptions = function (options, callback) {
	if (options.date && options.creator) {
		options.date = options.date;
		options.openingTime = options.openingTime || '';
		options.closingTime = options.closingTime || '';
		options.numOfAppointment = options.numOfAppointment || '';
		options.numOfBookedAppointments = 0;
		options.creator = options.creator;
		callback(null, options);
	} else {
		callback({code :400, message : "No DailySetting date is provided"});
	}
};


/*********************************************
 * Export as a module
 *********************************************/
module.exports = DailySetting;
