/*********************************************
 * The Appointment model
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
var moment = require('moment');
var async = require('async');
var objectHelper = require('../lib/objectHelper');
var childProcessHelper = require('../lib/childProcessHelper');

/*********************************************
 * Include Class
 *********************************************/
var ArrayFilter = require('./arrayFilters/arrayFilter');
var DailySetting = require('./dailySetting');
var StandardArrayFilter = require('./arrayFilters/standardArrayFilter');
var MapReduceChain = require('./mapReduces/mapReduceChain');

/*********************************************
 * Include Repository
 *********************************************/
var appointmentRepositoryPath = './models/repositories/appointmentRepository';
var AppointmentRepository = require('./repositories/appointmentRepository');

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
function Appointment(options){
	options = options || {};

	this._id = options._id || null;
	this.arrived = options.arrived || false;
	this.branch = options.branch || '';
	this.date = options.date || new Date();
	this.time = options.time || '';
	this.status = options.status || '';
	this.reviewing = options.reviewing || false;
	this.userId = options.userId || null;
}

/*********************************************
 * Class methods
 *********************************************/
Appointment.initFromArray = function (arr, callback) {
	if (arr instanceof Array) {
	  callback(null, arr.map(init));
	} else {
	  callback({code : 403, message : "no array"});
	}
};

/*
 * create static methods
 */
Appointment.create = function (options, callback) {
	var self = this;

	async.waterfall([
		function (callback) {
			validateAppointmentOptions(options, callback);
		},
		function (checkedConditions, callback) {
			async.parallel([
				function (callback) {
					validateUser(checkedConditions, callback);
				},
				function (callback) {
					checkUserCanBook({userId: checkedConditions.userId}, callback);
				},
				function (callback) {
					self.checkValidBookingDateAndTime({date : options.date, time: options.time}, callback);
				}
			], function (err) {
				callback(err, checkedConditions);
			});
		}
	], function (err, checkedConditions) {
		if (err) {
			callback(err);
		} else {
			var appointment = new self(checkedConditions);
			appointment.saveAppointment(function (err, appointment) {
				if (err) {
					callback(err);
				} else {
					DailySetting.updateNumOfBookedAppointments({date: appointment.date, time: options.time, quantity: 1}, function (err, dailySetting) {
						if (err) {
							callback(err);
						} else {
							callback(null, appointment);
						}
					});
				}
			});
		}
	});
};


/*
 * find static methods
 */
Appointment.findAll = function (options, callback) {
	var self = this;
	var user = options.user;
	var permission = permissionManager.createChain();

	if (objectHelper.isEmptyObject(options)) {

		permission.allAppointmentReview.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findAllAppointments');
					return self.findAllAppointments({}, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	} else if (options.action == 'findAppointmentsByDate') {

		console.log('findAppointmentsByDate');
		return self.findAppointmentsByDate(options, callback);

	} else if (options.action == 'findAppointmentByUserIdAndDate') {

		permission.appointmentReview.handleRequest({user : user, currentUserId: options.userId}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findAppointmentByUserIdAndDate');
					return self.findAppointmentByUserIdAndDate(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	} else if (options.action == 'mapReduceAppointmentTimeByDate') {

		return self.mapReduceAppointmentTimeByDate(options, callback);

	} else if (options.action == 'findAppointmentsByUserId') {

		permission.appointmentReview.handleRequest({user : user, currentUserId: options.userId}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findAppointmentsByUserId');
					return self.findAppointmentsByUserId(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	} else if (options.action == 'findAppointmentById') {

		permission.appointmentFind.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findAppointmentById');
					return self.findAppointmentById(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	} else if (options.action == 'checkValidBookingDateAndTime') {

		console.log('checkValidBookingDateAndTime');
		return self.checkValidBookingDateAndTime(options, callback);

	} else {

		permission.allAppointmentReview.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findAllAppointments');
					return self.findAllAppointments(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	}
};

/*
 * Called By
 * Frontend: find default 
 * Backend: null
 */
Appointment.findAllAppointments = function (options, callback) {
	var conditions = options || {};
	var user = options.user;



	checkConditions(handlePopulate(conditions), function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findAppointments(conditions, function (err, appointments) {
				if (err) {
					callback(err);
				} else {
					callback(null, appointments.filter(function (appointment) {
						return (appointment.userId);
					}));
				}
			});
		}
	});
};


/*
 * Called By
 * Frontend: null
 * Backend: Vendor.exportVendorsApplication
 */
Appointment.countNumOfAppointmentsAndArrivalAppointments = function (options, callback) {
	options = options || {};
	var self = this;

	checkConditions(options, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findAppointments(options, function (err, allAppointments) {
				if (err) {
					callback(err);
				} else {
					conditions.arrived = true;
					findAppointments(conditions, function (err, arrivalAppointments) {
						if (err) {
							callback(err);
						} else {
							callback(null, {totalAppointments: allAppointments.length, arrivalAppointments: arrivalAppointments.length});
						}
					});
				}
			});
		}
	});
};


/*
 * Called By
 * Frontend: appointment(ModuleViewMyAppointmentsCompositeView)
 * Backend: null
 */
// for review no. of appointment on day
Appointment.mapReduceAppointmentTimeByDate = function (options, callback) {
	options = options || {};
	var self = this;

	options.conditioner = self.mapReduceByConditions;
	var mapReduceChain = new MapReduceChain(options);

	mapReduceChain.byAllConditions(function (err, results) {
		if (err) {
			callback(err);
		} else {
			callback(null, results.appointment);
		}
	});
};

/*
 * Called By
 * Frontend: null
 * Backend: Appointment.mapReduceAppointmentTimeByDate
 */
Appointment.mapReduceByConditions = function (options, callback) {
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

/*
 * Called By
 * Frontend: null
 * Backend: Appointment.changeAppointment, Appointment.create
 */
Appointment.checkValidBookingDateAndTime = function (options, callback) { // each date and time only can have one user
	options = options || {};

	if (options.date) {
		var conditions = {
			date : options.date,
			time: options.time,
			statusNotEqual: 'cancelled'
		};
		checkConditions(conditions, function (err, conditions) {
			if (err) {
				callback(err);
			} else {
				DailySetting.findDailySettingsByDate({date: options.date}, function(err, dailySettings){
					if(err){
						callback(err);
					} else {
						findAppointments(conditions, function (err, appointments){
							if (err) {
								callback(err);
							} else {
								if (dailySettings.length > 0) {
									var dailySetting = dailySettings[0];
									if (appointments.length < 2 && dailySetting.numOfBookedAppointments < dailySetting.numOfAppointment) {
										// callback(null, true);
										callback(null);
									} else {
										// callback(null, false);
										callback({code : 403, message : "Selected date and time are full appointments"});
									}
								} else {
									callback({code: 403, message: "You cannot book this date because admin haven't free this date to you."})
								}
							}
						});
					}
				});
			}
		});
	} else {
		callback({code : 400, message : "Please enter appointment name"});
	}
};

/*
 * Called By
 * Frontend: appointment(displayViewMyAppointmentsForm)
 * Backend: checkUserCanBook
 */
Appointment.findAppointmentsByUserId = function (options, callback) {
	options = options || {};

	var conditions = {
		userId: options.userId
	};

	checkConditions(conditions, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findAppointments(conditions, function (err, appointments) {
				if (err) {
					callback(err);
				} else {
					callback(null, appointments);
				}
			});
		}
	});
};

/*
 * Called By
 * Frontend: null
 * Backend: Appointment.exportTransactionRecord
 */
Appointment.findAppointmentsByDateRange = function (options, callback) {
	options = options || {};

	var conditions = {
		dateFrom: options.dateFrom,
		dateTo: options.dateTo,
		arrived: options.arrived,
		branch: options.branch,
		populate: {
			path: 'userId'
		}
	};

	checkConditions(conditions, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findAppointments(conditions, function (err, appointments) {
				if (err) {
					callback(err);
				} else {
					callback(null, appointments);
				}
			});
		}
	})
};

/*
 * Called By
 * Frontend: null
 * Backend: Appointment.exportTodayAppointments
 */
Appointment.findAppointmentsByDate = function (options, callback) {
	options = options || {};
	var conditions = {
		date: options.date,
		dateFrom: options.dateFrom,
		dateTo: options.dateTo
	};

	if (options.statusNotEqual) {
		conditions.statusNotEqual = options.statusNotEqual;
	}

	checkConditions(conditions, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findAppointments(conditions, function (err, appointments) {
				if (err) {
					callback(err);
				} else {
					callback(null, appointments);
				}
			});
		}
	});
};


/*
 * Called By
 * Frontend: null
 * Backend: Appointment.exportMemberTransactionReport
 */
Appointment.findAppointmentByUserIdAndDate = function (options, callback) {
	options = options || {};
	var conditions = {
		date: options.date,
		// time: options.time,
		userId: options.userId
	};

	checkConditions(conditions, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findAppointments(conditions, function (err, appointments) {
				if (err) {
					callback(err);
				} else {
					if (appointments.length == 1) {
						callback(null, appointments[0]);
					} else if (appointments.length == 0) {
						callback(null, appointments);
					} else {
						callback({code : 400, message : "There are more than one appointments belong to same user"});
					}
				}
			});
		}
	});
};

/*
 * Called By
 * Frontend: null
 * Backend: Appointment.updateById, saveToRepository
 */
Appointment.findAppointmentById = function (options, callback) {
	options = options || {};
	var conditions = {
		id: options.id
	};
	
	checkConditions(conditions, function (err, checkedConditions) {
		if (err) {
			callback(err);
		} else {
			findAppointments(checkedConditions, function (err, appointments) {
				if (err) {
					callback(err);
				} else {
					if (appointments.length == 1) {
						callback(null, appointments[0]);
					} else if (appointments.length == 0) {
						callback({code : 404, message : "no record"});
					} else {
						callback({code : 403, message : "Appointment more than one"});
					}
				}
			});
		}
	});
};


/*
 * Called By
 * Frontend: null
 * Backend: Appointment Controller
 */
Appointment.updateAppointment = function (options, callback) {
	options = options || {};
	var update = options.update;
	delete update.action;
	var user = options.user;
	var self = this;

	var permission = permissionManager.createChain();
	permission.appointmentUpdate.handleRequest({user : user, currentUserId: update.userId._id}, function (err, allow) {
		if (err) {
			callback(err);
		} else {
			if (allow) {
				self.updateById(options, callback);
			} else {
				callback({code: 401, message : 'unauthorized user'})
			}
		}
	});
};

/*
 * Called By
 * Frontend: Appointment
 * Backend: Appointment Controller
 */
Appointment.confirmAppointment = function (options, callback) {
	options = options || {};
	var update = options.update;
	delete update.action;
	var user = options.user;
	var self = this;

	var permission = permissionManager.createChain();
	permission.appointmentConfirm.handleRequest({user : user}, function (err, allow) {
		if (err) {
			callback(err);
		} else {
			if (allow) {
				self.updateById(options, function (err, appointment) {
					if (err) {
						callback(err);
					} else {
						var User = require('./user');
						User.sendConfirmationEmailAfterConfirmedAppointment({appointment: appointment}, function (err, recipient) {
							callback(err, appointment);
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
 * Frontend: Appointment
 * Backend: Appointment Controller
 */
Appointment.cancelAppointment = function (options, callback) {
	options = options || {};
	var update = options.update;
	delete update.action;
	var user = options.user;
	var skipSendEmail = update.skipSendEmail || false;
	var self = this;

	var permission = permissionManager.createChain();
	permission.appointmentCancel.handleRequest({user : user, currentUserId: update.userId._id}, function (err, allow) {
		if (err) {
			callback(err);
		} else {
			if (allow) {
				self.updateById(options, function (err, appointment) {
					if (err) {
						callback(err);
					} else {
						DailySetting.updateNumOfBookedAppointments({date: appointment.date, time: appointment.time, quantity: '-1'}, function (err, dailySetting) {
							if (err) {
								callback(err);
							} else {
								if (skipSendEmail) {
									callback(null, appointment);
								} else {
									var User = require('./user');
									User.sendAnnouncementEmailAfterCancellededAppointment({appointment: appointment}, function (err, recipient) {
										callback(err, appointment);
									});
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
 * Called By
 * Frontend: Appointment
 * Backend: Appointment Controller
 */
Appointment.changeAppointment = function (options, callback) {
	options = options || {};
	var self = this;
	var update = options.update;
	var user = options.user;

	var permission = permissionManager.createChain();
	permission.appointmentUpdate.handleRequest({user : user, currentUserId: update.userId._id}, function (err, allow) {
		if (err) {
			callback(err);
		} else {
			if (allow) {				
				self.findAppointmentById(options.conditions, function (err, origAppointment) {
					if (err) {
						callback(err);
					} else {
						if (origAppointment.date == update.date && origAppointment.time == update.time) {
							callback(null, origAppointment);
						} else {
							self.checkValidBookingDateAndTime({date : update.date, time: update.time}, function (err) {
								if (err) {
									callback(err);
								} else {
									self.updateById(options, function (err, appointment) {
										if (err) {
											callback(err);
										} else {
											DailySetting.updateNumOfBookedAppointments({date: origAppointment.date, time: origAppointment.time, quantity: '-1'}, function (err, dailySetting) {
												if (err) {
													callback(err);
												} else {
													DailySetting.updateNumOfBookedAppointments({date: appointment.date, time: appointment.time, quantity: 1}, function (err, dailySetting) {
														if (err) {
															callback(err);
														} else {
															// var User = require('./user');
															// User.sendAnnouncementEmailAfterChangedBooking({appointment: appointment, origAppointment: origAppointment}, function (err, recipient) {
																callback(err, appointment);
															// });
														}
													});
												}
											});
										}
									});
								}
							});
						}
					}
				});
			} else {
				callback({code: 401, message : 'unauthorized user'})
			}
		}
	});
};


Appointment.updateById = function (options, callback) {
	options = options || {};
	var conditions = options.conditions;
	var update = options.update;
	delete update.action;
	var user = options.user;
	var self = this;

	self.findAppointmentById(conditions, function (err, appointment) {
		if (err) {
			callback(err);
		} else {
			appointment.updateAppointment(update, callback);
		}
	});
};

/*********************************************
 * Export Function
 *********************************************/
Appointment.exportTransactionRecord = function (options, callback) {
	var self = this;
	options = options || {};
	var excel = options.excel;
	options.arrived = true;

	/* Set Report Variable */
	var variable = {
		date: options.dateFrom + ((options.dateTo) ? ' - ' + options.dateTo : ''),
		printDate: new Date().toDateFormat('yyyy-MM-dd HH:mm:ss'),
		totalInfoEasy: 0,
		totalMemberEasy: 0,
		totalJoinedClubs: 0,
		center: options.branch
	};
	/* END */
	self.findAppointmentsByDateRange(options, function (err, appointments) {
		if (err) {
			callback(err);
		} else {
			appointments.forEach(function (appointment) {
				var data = {};
				var User = require('./user');
				var user = new User(appointment.userId);

				user.calculateJoinedClubs(function (clubs) {
					variable.totalInfoEasy += clubs.totalInfoEasy;
					variable.totalMemberEasy += clubs.totalMemberEasy;
					variable.totalJoinedClubs += user.vendors.length;

					appointment.timestamp = new Date(appointment.date + ' ' + appointment.time.substring(0, appointment.time.length - 2)).yyyymmddHHMM();
					appointment.noOfMemberEasy = clubs.totalMemberEasy;
					appointment.noOfInfoEasy = clubs.totalInfoEasy;
					appointment.noOfJoinedClubs = user.vendors.length;
				});
			});
			excel.loadDataToHeader(variable);
      excel.loadDataToRows({rows: appointments, exportRow: exportRow});
			callback(null, excel.data);
		}
	});
};



Appointment.exportMemberTransactionReport = function (options, callback) {
	var self = this;
	options = options || {};
	var excel = options.excel;
	var variable = {},
			rows = [];

	self.findAppointmentByUserIdAndDate(options, function (err, appointment) {
		if (err) {
			callback(err);
		} else {
			// appointment may a object or empty object
			if (appointment || appointment.length > 0) {
				var user = appointment.userId;

				variable.appointmentCode = appointment._id;
				variable.date = options.date;
				variable.printDate = new Date().toDateFormat('yyyy-MM-dd HH:mm:ss');
				variable.fullName = user.lastName + ' ' + user.firstName;
				variable.memberCode = user.code;

				excel.loadDataToHeader(variable);

				user.vendors.forEach(function (vendor) {
					vendor.items.forEach(function (item) {
						if (item.receivedDate.getTime() == new Date(options.date).getTime()) {
							var obj = {
								vendorName: vendor.chiName,
								vendorCode: vendor.vendorCode,
								itemName: item.itemName,
								itemCode: item.itemCode,
								quantity: 1
							}
							rows.push(obj);
						}
					});
				});
			}
			excel.loadDataToRows({rows: rows});
			callback(null, excel.data);
		}
	});
};




Appointment.exportTodayAppointments = function (options, callback) {
	var self = this;
	options = options || {};
	var excel = options.excel;
	self.findAppointmentsByDate(options, function (err, appointments) {
		if (err) {
			callback(err);
		} else {
			/* Set Report Variable */
			var variable = {
				date: options.dateFrom + ((options.dateTo) ? ' - ' + options.dateTo : ''),
				printDate: new Date().toDateFormat('yyyy-MM-dd HH:mm:ss'),
				numOfAppointment: appointments.length,
				center: options.branch
			};
			excel.loadDataToHeader(variable);
			/* END */
			excel.loadDataToRows({rows: appointments, exportRow: exportRow});
			callback(null, excel.data);
		}
	});
};




var exportRow = function () {
  var rowIndex = 0;

  return function (appointment, header, callback) {
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
						self(appointment, prop.trim(), function (value){
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
					appointment = appointment[headers[i]]
					i++;
					len--;
				}
				callback(appointment);
			} else if (header == 'memberName') {
				var User = require('./user');
				var user = new User(appointment.userId);

				callback(user.getFullName());
			} else if (header == 'isArrived') {
				var isArrived = (appointment.arrived) ? 'Arrived' : 'Not Arrived';
				callback(isArrived);
			} else if (header == 'isVerified') {
				var isVerified = (appointment.userId.verified) ? 'Verified' : 'Not Verified';
				callback(isVerified);
			} else if (header.indexOf('_') == 0) {
				callback(header.substr(1));
			} else if (arrayHelper.isArray( appointment[header] )) {
				callback(appointment[header].join(','));
			} else if (typeof appointment[header] == 'string') {
				callback(appointment[header].toString());
			} else if (typeof appointment[header] == 'boolean') {
				callback(appointment[header]);
			} else if (typeof appointment[header] != 'undefined') {
				callback(appointment[header]);
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
Appointment.prototype.saveAppointment = function (callback) {
	var self = this;

	saveToRepository(this, callback);
};

Appointment.prototype.updateAppointment = function (update, callback) {
	for (var key in update) {
		// console.log(key, update[key]);
		this[key] = update[key];
	}
	this.saveAppointment(callback);
};

/*********************************************
 * Helper functions
 *********************************************/
var checkUserCanBook = function (options, callback) {
	options = options || {};

	Appointment.findAppointmentsByUserId({userId: options.userId}, function(err, appointments) {
		if (err) {
			callback(err);
		} else {
			if (appointments.length > 0) {
				var canBook = true;

				var filter = function (appointment, done) {
					var today = moment();
					/*
					 * can't book conditions:
					 * 1. already have a booking (pending or confirmed) and not expired
					 * 2. finished a booking
 					 */
					if ((appointment.arrived && appointment.status == 'confirmed') || (appointment.status !== 'cancelled' && today.diff(appointment.date, 'days') <= 0)) {
						canBook = false;
					}
					done(null, appointment);
				};

				arrayHelper.walkArray(appointments, {}, filter, function (err, appointments) {
					console.log('userId', options.userId, 'canBook', canBook);
					if (err) {
						callback(err);
					} else if (!canBook) {
						callback({code : 400, message : "You have already booked a appointment"});
					} else {
						callback(null);
					}
				});
			} else {
				callback(null, true);
			}
		}
	});
};


var checkConditions = function (options, callback) {
	options = options || {};
	var conditions = {};

	if (options.id) {
		conditions._id = options.id;
	}

	if (typeof options.arrived != 'undefined') {
		conditions.arrived = options.arrived;
	}

	if (typeof options.afterToday != 'undefined') {
		conditions.afterToday = options.afterToday;
	}

	if (options.branch) {
		conditions.branch = options.branch;
	}

	if (options.status) {
		conditions.status = options.status;
	}

	if (options.statusNotEqual) {
		conditions.statusNotEqual = options.statusNotEqual;
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

	if (options.userId) {
		conditions.userId = options.userId;
	}

	if (options.time) {
		conditions.time = options.time;
	}

	if (options.startTime) {
		conditions.startTime = options.startTime;
	}

	if (options.endTime) {
		conditions.endTime = options.endTime;
	}

	if (options.page) {
		conditions.page = options.page;
	}

	if (options.populate) {
		conditions.populate = options.populate;
	} else {
		conditions.populate = {
			path: 'userId'
		}
	}

	if (options.universalSearch) {
		conditions.universalSearch = options.universalSearch;
	}

	if (options.sort) {
		conditions.sort = options.sort;
	}
	// console.log("conditions", conditions);
	callback(null, conditions);
};


var handlePopulate = function (conditions) {
	if (conditions.HKID || conditions.name || conditions.universalSearch) {
		var match = {};
		if (conditions.HKID) {
			match['HKID'] = new RegExp(conditions.HKID, "i");
		}
		if (conditions.name) {
			var nameLike = new RegExp(conditions.name, "i");
			match['$or'] = [{firstName: nameLike}, {middleName: nameLike}, {lastName: nameLike}];
		}
		if (conditions.universalSearch) {
			var universalSearchLike = new RegExp(conditions.universalSearch, "i");
			match['$or'] = [
				{code: universalSearchLike},
				{HKID: universalSearchLike},
				{email: universalSearchLike},
				{phone: universalSearchLike},
				{firstName: universalSearchLike},
				{middleName: universalSearchLike},
				{lastName: universalSearchLike}
			];
		}

		delete conditions.HKID;
		delete conditions.name;
		delete conditions.universalSearch;

		conditions.populate = {
			path: 'userId',
			match: match
		}
	} else {
		conditions.populate = conditions.populate || { path: 'userId' };
	}
	
	return conditions;
};


var findAppointments = function (options, callback) {
	findAppointmentsFromRepository(options, function (err, appointments, total) {
		if (DEBUG) {
			console.log(err, appointments);
		}
		callback(err, appointments, total);
	});
};

var findAppointmentsFromRepository = function (conditions, callback) {
	var _callback = function (err, appointmentArray, total) {
		if (err) {
			callback(err);
		} else {
			var appointments = initFromArray(appointmentArray);
			callback(null, appointments, total);
		}
	};

	if (USE_CHILD_PROCESS) {
		findAppointmentsFromRepositoryWitChildProcess(conditions, callback);
	} else {
		AppointmentRepository.findByConditions(conditions, _callback);
	}
};

function init (value) {
	return new Appointment(value);
};

var initFromArray = function (arr) {
	return arr.map(function (appointmentObject) {
		return init(appointmentObject);
	});
};

/*
 * appointment: Appointment instance
 * callback: Appointment instance
 */
var saveToRepository = function (appointment, callback) {
	/* add and update */
	if (USE_CHILD_PROCESS) {
		saveToRepositoryWithChildProcess(appointment, callback);
	} else {
		AppointmentRepository.saveAppointment(appointment, function (err, appointmentObject) {
      // console.log(appointmentObject);
      Appointment.findAppointmentById({id: appointmentObject._id}, callback); // use this to return the same object as GET
			//callback(err, init(appointmentObject));
		});
	}
};

var validateAppointmentOptions = function (options, callback) {
	if (options.date && options.time && options.userId) {
		options.date = options.date;
		options.time = options.time;
		options.userId = options.userId;
		options.arrived = options.arrived || false;
		options.reviewing = options.reviewing || false;
		options.status = options.status || 'pending';
		callback(null, options);
	} else {
		callback({code : 400, message : "No Appointment date and time is provided"});
	}
};

var validateUser = function (options, callback) {
	var User = require('./user');
	options = options || {};

	if (options.userId) {
		User.findUserById({id: options.userId}, function (err, user) {
			if (err) {
				callback(err);
			} else {
				user.isValidUser(function (isValid) {
					if (!isValid) {
						callback({code: 401, message: "Please fill in your profile"});
					} else {
						callback(null);
					}
				});
			}
		});
	} else {
		callback({code : 400, message : "Invalid User"});
	}
};


var mapReduceFromRepositoryWithChildProcess = function (conditions, callback) {
	childProcessHelper.addChild(appointmentRepositoryPath, "mapReduceAppointments", conditions, callback);
};

/*********************************************
 * Export as a module
 *********************************************/
module.exports = Appointment;
