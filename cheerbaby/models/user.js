/*********************************************
 * The User model
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

 /*********************************************
 * Include Helpers
 *********************************************/

var arrayHelper = require('../lib/arrayHelper');
var childProcessHelper = require('../lib/childProcessHelper');
var encryption = require('../lib/encryption');
var objectHelper = require('../lib/objectHelper');
var fs = require('fs');
var iconv = require('iconv-lite');
var moment = require('moment');
var async = require('async');


var Config = require("../config/config");
var CONFIG = Config.getInstance();


/*********************************************
 * Include Class
 *********************************************/

var ArrayFilter = require('./arrayFilters/arrayFilter');
var StandardArrayFilter = require('./arrayFilters/standardArrayFilter');
var PermissionManager = require('./permissions/permissionManager');
var permissionManager = new PermissionManager();

//var AccessToken = require('./accessToken');
var MapReduceChain = require('./mapReduces/mapReduceChain');

/*********************************************
 * Include Repository
 *********************************************/
var userRepositoryPath = './models/repositories/userRepository';
var UserRepository = require('./repositories/userRepository');
var Appointment = require('./appointment');
//var UserRepository = require('./repositories/userRepositoryTest');


/*********************************************
 * CONSTANT declaration
 *********************************************/

const DEBUG = false;
// const USE_CHILD_PROCESS = true;
const USE_CHILD_PROCESS = false;

const PASSWORD_LENGTH = 8;
const VERIFICATION_CODE_LENGTH = 32;
const VERIFICATION_CODE_EXPIRY_IN_DAY = 7;
const VERIFICATION_CODE_TTL = 3600 * 168;
const CLIENT_SECRET_LENGTH = 24;
const ACCESS_TOKEN_LENGTH = 32;
const TIME_TO_LIVE = 3600*24*7;
const HOST = CONFIG.getMemberHost();


/*********************************************
 * Class Declaration
 *********************************************/

function User(options) {
	options = options || {};

	this._id = options._id || null;
	this._type = options._type || 'User';
	this.address = options.address || {};
	this.adminRoles = options.adminRoles || [];
	this.active = objectHelper.setDefaultToTrue(options.active);
	this.activated = options.activated || false;
  this.agreePolicy = options.agreePolicy;
	this.baby = options.baby || {};
	this.noOfBabies = options.noOfBabies || [];
	this.code = options.code || '';
	this.DOB = options.DOB || '';
	this.educationLevel = options.educationLevel || '',
	this.email = options.email || '';
	this.files = options.files || [];
	this.firstName = options.firstName || '';
	this.HKID = options.HKID || '';
	this.hash_password = options.hash_password || null;
	this.interestedTypes = options.interestedTypes || [];
	this.interestedOther = options.interestedOther || '';
	this.lastLogin = null;
	this.lastName = options.lastName || '';
	this.occupation = options.occupation || '';
	this.password = options.password || null;
	this.phone = options.phone || '';
	this.roles = options.roles || [];
	this.totalFamilyIncome = options.totalFamilyIncome || '';
	this.username = options.username || ''; // unique
	this.vendors = options.vendors || [];
	this.verified = options.verified || false;
	this.verificationCode = options.verificationCode || getNewVerificationCode();
}



/*********************************************
 * Custom Class Method (Static method)
 *********************************************/
/* interface for user authentication instead of findUserByEmailAndPassword */
User.authenticate = function (options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }
	
  options = options || {};
	var self = this;
	if (options.email && options.password) {
		options.active = true;

		checkConditions(options, function (err, conditions) {
			if (err) {
				callback(err);
			} else {
				findUsers(conditions, function (err, users) {
					if (err) {
						callback(err);
					} else {
						if (users.length == 1) {
							var user = users[0];
							if (user.activated) {
								callback(null, user);
							} else {
								callback({code : 404, message : 'Not Activated, Please Check Email'});
							}
						} else {
							callback({code : 404, message : 'User Not Found'});
						}
					}
				});
			}
		});
	} else {
		callback({code : 404, message : 'Please Provide Email and Password'});
	}
};

/*
 * create static methods
 */
User.create = function (options, callback) {
	var self = this;

	validateUserOptions(options, function (err, options) {
		if (err) {
			callback(err);
		} else {
			self.findUsersByPhoneOrEmail({email : options.email, phone: options.phone}, function (err, foundUsers) {
				if (err) {
					callback(err);
				} else {
					if (foundUsers.length == 0) {
						var user = new User(options);
						user.saveUser(function (err, savedUser) {
							if (err) {
								callback(err);
							} else {
								savedUser.isNew = true;
								callback(null, savedUser);
							}
						});
					} else {
						if (foundUsers.length == 1) {
							var user = new self(foundUsers[0]);
							if (!user.activated) {
								user.updateVerificationCode(function (err, savedUser) {
									if (err) {
										callback(err);
									} else {
										savedUser.isNew = false;
										callback(null, savedUser);
									}
								});
							} else {
								callback({code :403, message : "This account has already been activated"});
							}
						} else {
							callback({code :403, message : "user exist"});
						}
					}
				}
			});
		}
	});
};



User.createAndSendVerificationLink = function (options, callback) {
	var self = this;

	self.create(options, function (err, savedUser) {
		if (err) {
			callback(err);
		} else {
			sendVerificationLink({user: savedUser}, callback);
		}
	});
};


/*
 * Called By
 * Frontend: User
 * Backend: null
 */
User.changedEmail = function (options, callback) {
	options = options || {};
	var self = this;
	var user = options.user;

	var permission = permissionManager.createChain();
	permission.changeEmail.handleRequest({user: user, currentUserId: options.update._id}, function (err, allow) {
		if (err) {
			callback(err);
		} else {
			if (allow) {
				if (options.update) {
					options.update.password = getRandomString(PASSWORD_LENGTH);
					options.update.username = options.update.email;
					options.update.verificationCode = getNewVerificationCode();
					options.activated = false;

					self.updateById(options, function (err, updatedUser) {
						if (err) {
							callback(err);
						} else {
							var user = new self(updatedUser);
							sendVerificationLink({user: user}, callback);
						}
					});
				} else {
					callback({code :500, message : "There is no user"});
				}
			} else {
				callback({code: 401, message : 'unauthorized user'})
			}
		}
	});


};


/*
 * Called By
 * Frontend: null
 * Backend: null (temporary)
 */
User.sendAnnouncementEmailAfterChangedBooking = function (options, callback) {
	options = options || {};
	var self = this;

	self.findUserById({id: options.appointment.userId}, function (err, user){
		if (err) {
			callback(err);
		} else {
			var mailOptions = {
				"subject" : "Cheer Baby - Changed Appointment",
				"html" : "Greetings,<br>\
				You have changed an appointment from " + options.origAppointment.date + " at " + options.origAppointment.time + " to " + options.appointment.date + " at " + options.appointment.time + ".<br>"
			};
			setEmailContentAndSend({user: user, appointment: options.appointment, mailOptions: mailOptions}, callback);
		}
	});
};

/*
 * Called By
 * Frontend: null
 * Backend: Appointment.confirmAppointment
 */
User.sendConfirmationEmailAfterConfirmedAppointment = function (options, callback) {
	options = options || {};
	var self = this,
			dir = 'data/emailTemplate/';

	self.findUserById({id: options.appointment.userId}, function (err, user){
		if (err) {
			callback(err);
		} else {
			fs.readFile(dir + '/confirmAppointmentEmail.html', {encoding: 'utf8'}, function(err, template) {
				if (err) {
					callback(err, template);
				} else {
					template = template.replace(/{{date}}/g, options.appointment.date );
					template = template.replace(/{{time}}/g, options.appointment.time );
					var mailOptions = {
						"subject" : "Cheer Baby - Confirm Appointment",
						"html" : template
					};
					setEmailContentAndSend({user: user, appointment: options.appointment, mailOptions: mailOptions}, callback);
				}
			});
		}
	});
};

/*
 * Called By
 * Frontend: null
 * Backend: Appointment.cancelAppointment
 */
User.sendAnnouncementEmailAfterCancellededAppointment = function (options, callback) {
	options = options || {};
	var self = this,
			dir = 'data/emailTemplate/';

	self.findUserById({id: options.appointment.userId}, function (err, user){
		if (err) {
			callback(err);
		} else {
			fs.readFile(dir + '/cancelledAppointmentEmail.html', {encoding: 'utf8'}, function(err, template) {
				if (err) {
					callback(err, template);
				} else {
					template = template.replace(/{{date}}/g, options.appointment.date );
					template = template.replace(/{{time}}/g, options.appointment.time );
					var mailOptions = {
						"subject" : "Cheer Baby - Cancelled Appointment",
						"html" : template
					};
					setEmailContentAndSend({user: user, appointment: options.appointment, mailOptions: mailOptions}, callback);
				}
			});
		}
	});
};

User.deleteUsers = function (conditions, callback) {
	var user = conditions.user;

	var permission = permissionManager.createChain();
	permission.userDelete.handleRequest({user : user}, function (err, allow) {
		if (err) {
			callback(err);
		} else {
			if (allow) {
				deleteUsersFromRepository(conditions, callback);
			} else {
				callback({code: 401, message : 'unauthorized user'})
			}
		}
	});
};

/*
 * Called By
 * Frontend: null
 * Backend: resetController
 */
User.sendResetPasswordVerificationLinkByEmail = function (email, callback) {
	var self = this;

	self.findUsersByEmail({email : email}, function (err, users) {
		if (err) {
			// console.log("err", err);
			callback(err);
		} else {
			// console.log("users", users);
			if (users.length == 1) {
				var user = users[0];
				user.sendResetPasswordVerificationLink(callback);
			} else {
				if (users.length > 1) {
					callback({code :403, message : "More than one users were found"});
				} else {
					callback({code :404, message : "User not found"});
				}
			}
		}
	});
};



/*
 * update static methods
 */
User.updateById = function (options, callback) {
	options = options || {};
	var self = this;
	var conditions = options.conditions;
	var update = options.update;
	var user = options.user;

	self.findUserById(conditions, function (err, user) {
		if (err) {
			callback(err);
		} else {
			user.updateUser(update, callback);
		}
	});
};

User.sendActivationLink = function (options, callback) {
	var self = this;
	options = options || {};

	self.findUserById({id: options.update._id}, function (err, foundUser) {
		if (err) {
			callback(err);
		} else {
			sendVerificationLink({user: foundUser}, callback);
		}
	});
};

User.findUsersAndSendVerificationLink = function (options, callback) {
	var self = this;
	var failedId = [];
	options = options || {};

	findUsers({ids: options.userIds}, function (err, foundUsers) {
		if (err) {
			callback(err);
		} else {
			async.each(
				foundUsers,
				function (foundUser, callback) {
					sendVerificationLink({user: foundUser}, function (err, data) {
						if (err) {
							failedId.push(foundUser._id);
						}
						callback(null, data);
					});
				},
				function (err) {
					if (failedId.length > 0) {
						callback(failedId);
					} else {
						callback(null, foundUsers);
					}
				}
			);
		}
	});
};



/*
 * print label methods
 */

User.printLabel = function (options, callback) {
	options = options || {};
	var user = options.user;

	var permission = permissionManager.createChain();
	permission.printLabel.handleRequest({user : user}, function (err, allow) {
		if (err) {
			callback(err);
		} else {
			if (allow) {
        var conditions = {
          noOfLabel: options.update.noOfLabel
        };

				var user = new User(options.update);
				user.printLabel(conditions, callback);
			} else {
				callback({code: 401, message : 'unauthorized user'})
			}
		}
	});
};


/*
 * export report
 */
User.prepareDataForReport = function (options, callback) {
	var self = this;
	options = options || {};

	self.findAllUsersByConditions(options, function (err, users) {
		if (err) {
			callback(err);
		} else {
			var perpareData = function (user, done) {
				user.HKID = user.formatedHKID();
				user.formattedAddress = user.formatAddress();
				user.noOfBabies = user.noOfBabies.length;
				user.firstChild = (user.noOfBabies[0]) ? user.noOfBabies[0].DOB : '';
				user.secondChild = (user.noOfBabies[1]) ? user.noOfBabies[1].DOB : '';
				user.EDD = user.baby.EDD;
				user.region = user.address.region || '';
				user.hospital = user.baby.hospitalType || '';

				var receivedDates = [];
				user.vendors.forEach(function (vendor) {
					if (vendor.vendorId == options.vendorId) {
						receivedDates.push(moment(vendor.registrationDate).format('YYYY-MM-DD'));
					}
				});

				user.receivedDate = receivedDates.join(', ');
				done(null, user);
			};

			arrayHelper.walkArray(users, {}, perpareData, callback);
		}
	});
};



/*
 * find static methods
 */
User.findAll = function (options, callback) {
	var self = this;
	var user = options.user;
	var permission = permissionManager.createChain();

	if (objectHelper.isEmptyObject(options)) {

		permission.userFind.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findUsers');
					return findUsers({}, callback);

				} else {
					callback({code: 401, message : 'unauthorized user'});
				}
			}
		});

	} else if (options.action == 'findByEmail') {

		permission.userFind.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findByEmail');
					return self.findUsersByEmail(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'});
				}
			}
		});

	} else if (options.action == 'sendActivationLink') {

		permission.sendActivationLink.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('sendActivationLink');
					return self.sendActivationLink(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'});
				}
			}
		});

	} else if (options.action == 'findUsersAndSendVerificationLink') {

		permission.sendActivationLink.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findUsersAndSendVerificationLink');
					return self.findUsersAndSendVerificationLink(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'});
				}
			}
		});

	} else if (options.action == 'getVerificationLink') {

		console.log('getVerificationLink');
		return self.getVerificationLink(options, callback);

	} else if (options.action == 'findUsersAndGetVerificationLink') {

		console.log('findUsersAndGetVerificationLink');
		return self.findUsersAndGetVerificationLink(options, callback);

	} else if (options.action == 'findByUniversalSearch') {

		// permission.userFind.handleRequest({user : user}, function (err, allow) {
			// if (err) {
				// callback(err);
			// } else {
				// if (allow) {
					console.log('findUsersByUniversalSearch');
					return self.findUsersByUniversalSearch(options, callback);
				// } else {
					// callback({code: 401, message : 'unauthorized user'})
				// }
			// }
		// });

	} else if (options.action == 'id') {

		permission.userFind.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findUserById');
					return self.findUserById(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'});
				}
			}
		});

	} else if (options.action == 'search') {

		permission.userFind.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findAllUsersByConditions');
					return self.findAllUsersByConditions(options, callback);

				} else {
					callback({code: 401, message : 'unauthorized user'});
				}
			}
		});

	} else if (options.action == 'verificationCode') {

		console.log('findUserByVerificationCode');
		return self.findUserByVerificationCode(options, callback);

	} else if (options.action == 'findByCode') {

		permission.userFind.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findByCode');
					return self.findByCode(options, callback);

				} else {
					callback({code: 401, message : 'unauthorized user'});
				}
			}
		});

	} else if (options.action == 'findUserByHKID') {

		permission.userSelfCheck.handleRequest({user : user, currentUserId: options.userId}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findUserByHKID');
					return self.findUserByHKID(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'});
				}
			}
		});

	} else if (options.action == 'findUserSuchAsPagination') {

		permission.userFind.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findUserSuchAsPagination');
					return findUsers(options, function (err, users, total) {
						console.log(users.length, total);
						callback(err, {total: total, rows: users});
					});
				} else {
					callback({code: 401, message : 'unauthorized user'});
				}
			}
		});

	} else {

		permission.userFind.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('findUsers');
					return findUsers(options, callback);
				} else {
					callback({code: 401, message : 'unauthorized user'});
				}
			}
		});

	}
};


/*
 * Called By
 * Frontend: null
 * Backend: User.prepareDataForReport
 */
User.findAllUsersByConditions = function (options, callback) {
	options = options || {};

	findUsers(options, callback);
};

/*
 * Called By
 * Frontend: null
 * Backend: appointment, user, userController
 */
User.findUserById = function (options, callback) {
	options = options || {};
	var self = this;
	var user = options.user;

	checkConditions(options, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findUsers(conditions, function (err, users) {
				// console.log('users', users);
				if (err) {
					callback(err);
				} else {
					if (users.length == 1) {
						callback(null, users[0]);
					} else if (users.length == 0) {
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
 * Backend: User.create
 */
User.findUsersByPhoneOrEmail = function (options, callback) {
	options = options || {};

	if (options.phone && options.email) {
		var conditions = {
			or: [
				{phone: options.phone},
				{email: options.email}
			]
		};
		checkConditions(conditions, function (err, conditions) {
			if (err) {
				callback(err);
			} else {
				findUsers(conditions, callback);
			}
		});
	} else {
		callback({code : 400, message : "Please enter phone and email"});
	}
};

/*
 * Called By
 * Frontend: user
 * Backend: User.sendResetPasswordVerificationLinkByEmail
 */
User.findUsersByEmail = function (options, callback) {
	options = options || {};

	if (options.email) {
		var conditions = {
			email : options.email
		};
		checkConditions(conditions, function (err, conditions) {
			if (err) {
				callback(err);
			} else {
				findUsers(conditions, callback);
			}
		});
	} else {
		callback({code : 400, message : "Please enter email"});
	}
};

/*
 * Called By
 * Frontend: user
 * Backend: null
 */
User.getVerificationLink = function (options, callback) {
  options = options || {};
	var self = this;
	var user = options.user;

	checkConditions(options, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			self.findUserById(conditions, function (err, foundUser) {
				if (err) {
					callback(err);
				} else {
					foundUser.updateVerificationCode(function (err, updatedUser) {
						if (err) {
							callback(err);
						} else {
							var link = HOST + "/#user/verification/" + updatedUser.verificationCode.code;
							updatedUser.verificationLink = link;
							console.log(updatedUser.verificationCode);
							callback(null, updatedUser);
						}
					});
				}
			});
		}
	});
};

User.findUsersAndGetVerificationLink = function (options, callback) {
	var self = this;
	var failedId = [];
	options = options || {};

	findUsers({ids: options.userIds}, function (err, foundUsers) {
		if (err) {
			callback(err);
		} else {
			async.map(
				foundUsers,
				function (foundUser, callback) {
					foundUser.updateVerificationCode(function (err, updatedUser) {
						if (err) {
							failedId.push(updatedUser._id);
						} else {
							var link = HOST + "/#user/verification/" + updatedUser.verificationCode.code;
							updatedUser.verificationLink = link;
							callback(null, updatedUser);
						}
					});
				},
				function (err, updatedUsers) {
					if (failedId.length > 0) {
						callback(failedId, updatedUsers);
					} else {
						callback(null, updatedUsers);
					}
				}
			);
		}
	});
};

User.findUsersByUniversalSearch = function (options, callback) {
	options = options || {};
	var self = this;

	checkConditions(options, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findUsers(conditions, callback);
		}
	});
};


/*
 * Called By
 * Frontend: user(profile form)
 * Backend: null
 */
User.findUserByHKID = function (options, callback) {
	options = options || {};

	checkConditions({HKID: options.HKID}, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findUsers(conditions, callback);
		}
	});
};

/*
 * Called By
 * Frontend: user, verificationCode
 * Backend: null
 */
User.findByCode = function (options, callback) {
	options = options || {};
	var self = this;

	var conditions = {
		code: options.code
	};

	checkConditions(conditions, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findUsers(conditions, callback);
		}
	});
};


User.findUserByVerificationCode = function (options, callback) {
	options = options || {};
	var self = this;

	checkConditions(options, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findUsers(conditions, function (err, users) {
				if (err) {
					callback(err);
				} else {
					if (users.length == 1) {
						var now = new Date();
						var expiryDate = new Date(users[0].verificationCode.expiryDate);
						if (expiryDate >= now) {
							callback(null, users[0]);
						} else {
							callback({code : 403, message : "The verification code is expired"});
						}
					} else {
						callback({code : 404, message : "User not found"});
					}
				}
			});
		}
	});
};


/*********************************************
 * Handle Amazon Methods
 *********************************************/

/*
 * Called By
 * Frontend: null
 * Backend: File
 */
User.updateAmazonFileURL = function (options, callback) {
	var self = this;
	options = options || {};

	self.findUserById({id: options.userId}, function (err, foundUser) {
		if (err) {
			callback('updateAmazonFileURL Error (' + err + ') - userId: ' + options.userId);
		} else {
			foundUser.updateFileUrl({fileDetails: options.fileDetails}, callback);
		}
	});
};

/*
 * Called By
 * Frontend: null
 * Backend: File
 */
User.checkFileWhetherUploadedToAmazon = function (options, callback) {
	var self = this;
	options = options || {};

	var query = {
		firstQuery: {'files.filename': options.filename, '_id': options.userId},
		secondQuery: {'_id': 0, 'files.$': 1}
	};
	UserRepository.findObjectByQuery(query, function (err, data) {
		if (err) {
			callback(false);
		} else {
			if (data.length > 0) {
				var file = data[0].files[0];
				callback((file.amazonUrl && file.amazonUrl != ''));
			} else {
				/* db havn't sava this file record, so it won't upload to amazon */
				callback(true);
			}
		}
	});
};

/*********************************************
 * Custom instance Method
 *********************************************/
User.prototype.formatAddress = function () {
	var addressObj = this.address || {};
	if (objectHelper.isEmptyObject(addressObj)){
		return "";
	} else {
		var formatedAddress = "";
		// streetAddress-city-state-zip-country
		var line1 = addressObj.line1 || "";
		var line2 = addressObj.line2 || "";
		var district = addressObj.district || "";
		var region = addressObj.region || "";
		var country = addressObj.country || "";
		if (line1!="" || line2!="" || district!="" || region!="" || country!=""){
			var addressDetails = [];
			addressDetails.push(line1, line2, district, region, country);
			for (var i=0; i<addressDetails.length; i++) {
				var value = addressDetails[i];
				formatedAddress += (i!=addressDetails.length-1) ? value + " " : value;
			}
		}
		return formatedAddress;
	}
};

User.prototype.formatEmails = function () {
    var emailObjs = this.emails;
    var emails = []; // label:email
    for (var i = 0; i<emailObjs.length; i++) {
		var label = emailObjs[i].label;
		var email = emailObjs[i].email;
		var email = label + ":" + email;
		emails.push(email);
    }
    return emails;
};

User.prototype.formatedHKID = function () {
	var HKID = this.HKID;
	var newHKID = HKID.slice(0, HKID.length - 6);
	newHKID = newHKID + 'XXX(X)';

	return newHKID;
};

User.prototype.getAddress = function (prop){
	return this.address[prop] || "";
};

User.prototype.getEmail = function () {
  var email = this.email || '';
  return email;
};

User.prototype.getFirstName = function () {
    var name = this.firstName || '';
    return name.trim();
};

User.prototype.getFullName = function () {
    var name = this.getFirstName() + ' ' + this.getLastName();
    return name.trim();
};

User.prototype.getLastName = function () {
    var name = this.lastName || '';
    return name.trim();
};

User.prototype.getPassword = function () {
    var password = this.password || '';
    return password.trim();
};

User.prototype.getUsername = function () {
    var username = this.username || '';
    return username.trim();
};

User.prototype.isValidPassword = function (callback) {
	if (this.password && this.password != "") {
		callback(null, this);
	} else {
		this.setRandomPassword(8, callback);
	}
};

User.prototype.isValidUser = function (callback) {
	var isValid = true;

	if (this.HKID == "" || !this.address || this.files.length == 0 || !this.baby.hospitalType || !this.baby.bornType || this.DOB == '') {
		isValid = false;
	}
	console.log('userId: ', this._id, ', isValid:', isValid);
	callback(isValid);
};

// masks = {password: true, hash_password: true, salt: true}
User.prototype.maskSensitiveData = function (masks) {
	for (var prop in masks) {
		if (masks[prop] && this[prop]) {
			this[prop] = null;
		}
	}
	return this;
};

User.prototype.calculateJoinedClubs = function (callback) {
	var result = {
		totalMemberEasy: 0,
		totalInfoEasy: 0
	};

	if (this.vendors.length > 0) {
		this.vendors.forEach(function (vendor) {
			if (vendor.vendorType == 'Member Easy') {
				result.totalMemberEasy = parseInt(result.totalMemberEasy) + 1;
			} else if (vendor.vendorType == 'Info Easy') {
				result.totalInfoEasy = parseInt(result.totalInfoEasy) + 1;
			}
		});
		callback(result);
	} else {
		callback(result);
	}
};

User.prototype.renewVerificationCode = function (callback) {
	var newVerificationCode = getNewVerificationCode();
	this.verificationCode = newVerificationCode;
	return this;
};

User.prototype.updateFileUrl = function (options, callback) {
	options = options || {};
	var self = this;
	var fileDetails = options.fileDetails;

	if (self.files.length) {
		var updateFileDetail = function (fileDetail, done) {
			var updated = false;
			self.files.forEach(function (file) {
				if (file.filename == fileDetail.filename) {
					updated = true;
					file.amazonUrl = fileDetail.amazonUrl;
					file.amazonFilename = fileDetail.amazonFilename;
					file.timestamp = fileDetail.timestamp;
				}
			});
			if (!updated) {
				self.files.push(fileDetail);
			}
			done(null, fileDetail);
		};

		arrayHelper.walkArray(fileDetails, {}, updateFileDetail, function (err, fileDetails) {
			if (err) {
				callback(err);
			} else {
				self.saveUser(function (err, user) {
					if (err) {
						callback(err, 'updateFileUrl Error userId: ' + user._id);
					} else {
						callback(null, 'Success');
					}
				});
			}
		});
	} else {
		var output = arrayUnique(self.files.concat(fileDetails));
		callback(null, output);
	}

};

User.prototype.saveUser = function (callback) {
	var self = this;

	this.validateUser(function (err, user) {
		saveToRepository(user, callback);
		// saveToRepository(user, function (err, userRepository) {
			// callback(err, initFromRepository(userRepository));
		// });
	});

};

User.prototype.sendEmail = function (mailOptions, callback) {
	var self = this;
	var email = {
		recipient : this,
		options : mailOptions
	};
	sendEmail(email, callback);
};

User.prototype.setRandomPassword = function (passwordLength, callback) {
	this.setRandomPasswordSync(passwordLength);
	callback(null, this);
};

User.prototype.setRandomPasswordSync = function (passwordLength) {
  this.password = encryption.getRandomString(passwordLength, 'aA#');
};

User.prototype.sendResetPasswordVerificationLink = function (callback) {
	this.updateVerificationCode(function (err, updatedUser) {
		if (err) {
			callback(err);
		} else {
			var link = HOST + "/#user/resetPassword/" + updatedUser.verificationCode.code;
			var mailOptions = {
				"subject" : "Cheerbaby - Reset Password",
				"html" : "Hello,<br><br />\
							You have requested to resest your password. Please <a href='" + link + "'>click here</a> to reset your password.<br>\
							If you have not made this request, please ignore this email.<br>\
							(The link will be expired in " +  VERIFICATION_CODE_EXPIRY_IN_DAY  + "  days.)<br><br>\
							Cheer Baby"
			};
			updatedUser.sendEmail(mailOptions, callback);
		}
	});
};

User.prototype.setUsername = function (callback) {
  var email = this.getEmail();
  if (email != '') {
	  this.username = email;
    callback(null, this);
  } else {
	callback({code : 400, message : "empty email"});
  }
};

User.prototype.updateUser = function (update, callback) {
	for (var key in update) {
		if (key == 'email') {
			this[key] = update[key].trim().toLowerCase();
		} else {
			this[key] = update[key];
		}
	}
	this.saveUser(callback);
};


User.prototype.updateVerificationCode = function (callback) {
	var self = this;
	this.renewVerificationCode().saveUser(function (err, savedUser) {
		if (err) {
			callback(err);
		} else {
			callback(null, savedUser);
		}
	});
};


User.prototype.validateUser = function (callback) {
  this.setUsername(callback);
};

User.prototype.verifyPassword = function (password, callback) {
	if (this.password == password) {
		callback(true);
	} else {
		callback(false);
	}
};

/*
 * label file must be in ANSI format
 */
User.prototype.printLabel = function (options, callback) {
	var self = this;
	var dir = 'data/labelTemplate';
	var encoding = 'utf8';

	fs.readFile(dir + '/label_content.template.txt', encoding, function (err, label_content) {
		if (err) {
			callback(err);
		} else {
			fs.readFile(dir + '/label_setting.template.txt', encoding, function (err, label_setting) {
				if (err) {
					callback(err);
				} else {
					var noOfLabel = (options.noOfLabel) ? 'P' + options.noOfLabel : 'P1';
					label_content = label_content.replace('P1', noOfLabel);

						var output = label_setting,
								mapObj = {
									member_name: 'Name: ' + self.getFullName(),
									member_mobile: 'Phone: ' + self.phone,
									member_address1: self.address.line1,
									member_address2: self.address.line2,
									member_address3: self.address.region + ' ' + self.address.district + ' ' + self.address.country,
									member_email: self.email,
									member_baby_EDC: 'EDD: ' + self.baby.EDD,
									member_baby_hospital: 'Hospital: ' + self.baby.hospitalType,
									barcode: self.code
								},
								keys = new RegExp(Object.keys(mapObj).join('|'), 'gi');

						var newLabelContent = label_content.replace(keys, function (matched) {
							return mapObj[matched] || '';
						});

						output += newLabelContent;

					createLabel({content: output}, function (err, options) {
						if (err) {
							callback(err);
						} else {
							var source = fs.createReadStream(options.dir + '/' + options.filename + '.txt', {encoding: encoding});
							var dest = fs.createWriteStream(options.printDir + '/' + options.filename + '.txt', {encoding: encoding});
							source.on('end', function () {
								fs.unlink(options.dir + '/' + options.filename + '.txt', function(){
									if(err) throw err;
									callback(null, self);
								});
							});
							source.on('error', function () {
								console.log("Moving file error - " + options.filename + '.txt');
							});

							source.pipe(iconv.decodeStream('UTF-8')).pipe(iconv.encodeStream('big5')).pipe(dest);
						}
					});
				}
			});
		}
	});
};


/*********************************************
 * Repository methods
 *********************************************/

var batchImportWithChildProcess = function (options, callback) {
	childProcessHelper.addChild(userRepositoryPath, "batchImport", options, callback);
};

var batchImport = function (options, callback) {
	UserRepository.batchImport(options, callback);
};

var deleteUsersFromRepository = function (conditions, callback) {
	if (USE_CHILD_PROCESS) {
		deleteUsersFromRepositoryWithChildProcess(conditions, callback);
	} else {
		UserRepository.deleteUsers(conditions, callback);
	}
};

var deleteUsersFromRepositoryWithChildProcess = function (conditions, callback) {
	childProcessHelper.addChild(userRepositoryPath, "deleteUsers", conditions, callback);
};


/*
 * conditions: various conditions
 * callback: Array of User instance
 */
var findUsersFromRepository = function (conditions, callback) {
	var _callback = function (err, userArray, total) {
		if (err) {
			callback(err);
		} else {
			var users = initFromArray(userArray);
			callback(null, users, total);
		}
	};

	if (USE_CHILD_PROCESS) {
		findUsersFromRepositoryWitChildProcess(conditions, callback);
	} else {
		UserRepository.findByConditions(conditions, _callback);
	}
};

var findUsersFromRepositoryWitChildProcess = function (conditions, callback) {
	childProcessHelper.addChild(userRepositoryPath, "findByConditions", conditions, function (err, userArray, total) {
		if (err) {
			callback(err);
		} else {
			var users = initFromArray(userArray);
			callback(null, users, total);
		}
	});
};


var mapReduceFromRepositoryWithChildProcess = function (conditions, callback) {
	childProcessHelper.addChild(userRepositoryPath, "mapReduceUsers", conditions, callback);
};

var mapReduceFromRepository = function (conditions, callback) {
	UserRepository.mapReduceUsers(conditions, callback);
};

/*
 * user: User instance
 * callback: User instance
 */
var saveToRepository = function (user, callback) {
	/* add and update */
	if (USE_CHILD_PROCESS) {
		saveToRepositoryWithChildProcess(user, callback);
	} else {
		UserRepository.saveUser(user, function (err, userObject) {
			callback(err, init(userObject));
		});
	}
};

var saveToRepositoryWithChildProcess = function (user, callback) {
	childProcessHelper.addChild(userRepositoryPath, "saveUser", user, function (err, userObject) {
		callback(err, init(userObject));
	});
};

var updateRepositories = function (options, callback) {
	/* add and update */
	if (USE_CHILD_PROCESS) {
		updateRepositoriesWithChildProcess(options, callback);
	} else {
		UserRepository.updateUsers(options, callback);
	}
};

var updateRepositoriesWithChildProcess = function (options, callback) {
	childProcessHelper.addChild(userRepositoryPath, "updateUsers", options, callback);
};

var init = function (userObject) {
	var userRepository = new UserRepository(userObject);
	return initFromRepository(userRepository);
};

var initFromArray = function (arr) {
	return arr.map(function (userObject) {
		return init(userObject);
	});
};

var initFromRepository = function (userRepository) {
	return new User(userRepository);
};

/*********************************************
 * Private methods
 *********************************************/
var checkConditions = function (options, callback) {
	options = options || {};
	var conditions = {};

	if (options.email) {
		conditions.email = options.email;
	}

	if (options._id) {
		conditions._id = options._id;
	}

	if (options.id) {
		conditions._id = options.id;
	}

	if (options.ids) {
		conditions.ids = options.ids;
	}

	if (typeof options.active != 'undefined') {
		conditions.active = options.active;
	}

	if (typeof options.activated != 'undefined') {
		conditions.activated = options.activated;
	}

	if (typeof options.verified != 'undefined') {
		conditions.verified = options.verified;
	}

	if (options.address) {
		conditions.address = options.address;
	}

	if (options.adminRoles) {
		conditions.adminRoles = options.adminRoles;
	}

	if (options.baby) {
		conditions.baby = options.baby;
	}

	if (options.noOfBabies) {
		conditions.noOfBabies = options.noOfBabies;
	}

	if (options.code) {
		conditions.code = options.code;
	}

	if (options.DOB) {
		conditions.DOB = options.DOB;
	}

	if (options.educationLevel) {
		conditions.educationLevel = options.educationLevel;
	}

	if (options.email) {
		conditions.email = options.email;
	}

	if (options.files) {
		conditions.files = options.files;
	}

	if (options.firstName) {
		conditions.firstName = options.firstName;
	}

	if (options.gender) {
		conditions.gender = options.gender;
	}

	if (options.HKID) {
		conditions.HKID = options.HKID;
	}

	if (options.interestedTypes) {
		conditions.interestedTypes = options.interestedTypes;
	}

	if (options.itemReceivedDate) {
		conditions.itemReceivedDate = options.itemReceivedDate;
	}

	if (options.lastName) {
		conditions.lastName = options.lastName;
	}

	if (options.occupation) {
		conditions.occupation = options.occupation;
	}

	if (options.password) {
		conditions.password = options.password;
	}

	if (options.phone) {
		conditions.phone = options.phone;
	}

	if (options.roles) {
		conditions.roles = options.roles;
	}

	if (options.totalFamilyIncome) {
		conditions.totalFamilyIncome = options.totalFamilyIncome;
	}

	if (options.username) {
		conditions.username = options.username;
	}

	if (options.vendors) {
		conditions.vendors = options.vendors;
	}

	if (options.vendorId) {
		conditions.vendorId = options.vendorId;
	}

	if (options.verificationCode) {
		conditions.verificationCode = options.verificationCode;
	}

	if (options.universalSearch) {
		conditions.universalSearch = options.universalSearch;
	}

	if (options.or) {
		conditions.or = options.or;
	}

	if (options.sort) {
		conditions.sort = options.sort;
	}
	// console.log("conditions", conditions);
	callback(null, conditions);
};

var updateUsers = function (options, callback) {
	updateRepositories(options, callback);
};

var findUsers = function (options, callback) {
	findUsersFromRepository(options, function (err, users, total) {
		if (DEBUG) {
			console.log(err, users);
		}
		callback(err, users, total);
	});
};

var findUsersWithChildProcess = function (options, callback) {
	findUsersFromRepositoryWitChildProcess(options, function (err, users, total) {
		if (DEBUG) {
			console.log(err, users);
		}
		callback(err, users, total);
	});
};

var getNewExpiryDate = function (ttl) {
	var expiryDate = new Date();
	expiryDate.setSeconds(expiryDate.getSeconds() + ttl);
	return expiryDate;
};

var getNewVerificationCode = function () {
	return {
		code : getRandomString(VERIFICATION_CODE_LENGTH),
		expiryDate : getNewExpiryDate(VERIFICATION_CODE_TTL)
	};
};

var getRandomString = function (len){
	var token = encryption.getRandomString(len, "aA#");
	return token;
};

var sendEmail = function (email, callback) {
	email = email || {};
	var recipient = email.recipient;
	var mailOptions = email.options;
	// mailOptions.from = "No-reply <questwork123@gmail.com>";
	mailOptions.to = recipient.getEmail();
	var Mail = require('./mail');
	Mail.send(mailOptions, function (err, response) {
		recipient.maskSensitiveData({
			password : true,
			hash_password : true,
			salt : true
		});
		console.log("Email is sent to %s", recipient.getEmail());
		callback(err, recipient);
	});
};

var sendVerificationLink = function (options, callback) {
	var user = options.user;
	// console.log("user", user);
	var link = HOST + "/#user/verification/" + user.verificationCode.code;
	dir = 'data/emailTemplate/';
	user.verificationLink = link;

	fs.readFile(dir + '/accountVerificationEmail.html', {encoding: 'utf8'}, function(err, template) {
		if (err) {
			callback(err, template);
		} else {
			template = template.replace(/{{link}}/g, link );
			var mailOptions = {
				"subject" : "Cheer Baby - Account Verification",
				"html" : template
			};
			user.sendEmail(mailOptions, callback);
		}
	});
};

var setEmailContentAndSend = function (options, callback) {
	var user = options.user;
	var appointment = options.appointment;

	var mailOptions = options.mailOptions || {
		"subject" : "Cheer Baby - Account Verification",
		"html" : "Greetings,<br>\
		You have booked an appointment on " + appointment.date + " at " + appointment.time + ".<br>"
	};
	user.sendEmail(mailOptions, callback);
};

var validateUserOptions = function (options, callback) {
	if (options.email && options.phone && options.firstName && options.lastName) {
		options.email = options.email.toLowerCase().trim();
		options.roles = (!options.roles || !arrayHelper.isArray(options.roles)) ? ['User'] : options.roles.push('User');
		options.phone = options.phone;
		options.lastName = options.lastName;
		options.firstName = options.firstName;
		options.password = (!options.password) ? getRandomString(PASSWORD_LENGTH) : options.password;
		callback(null, options);
	} else {
		callback({code : 400, message : "No email is provided"});
	}
};

var createLabel = function (options, callback) {
	var dir = 'data/buffer';
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir);
	}

	var content = options.content;
	var filename = 'label' + new Date().getTime();

	fs.writeFile(dir + '/' + filename + '.txt', content, function(err) {
		if(err) {
			callback(err);
		} else {
			console.log("The file was saved!");

			var printDir = 'data/print';
			if (!fs.existsSync(printDir)) {
				fs.mkdirSync(printDir);
			}
			callback(null, {dir: dir, filename: filename, printDir: printDir});
		}
	});
};

var arrayUnique = function (array) {
	var a = array.concat();
	for(var i=0; i<a.length; ++i) {
		for(var j=i+1; j<a.length; ++j) {
			if(a[i] === a[j]) {
				a.splice(j--, 1);
			}
		}
	}

	return a;
};
/*********************************************
 * Export as a module
 *********************************************/
module.exports = User;
