/*********************************************
 * The User Repository model
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
var stringHelper = require('../../lib/stringHelper');
var childProcessHelper = require('../../lib/childProcessHelper');
var encryption = require('../../lib/encryption');
var objectHelper = require('../../lib/objectHelper');
var IdCounter = require('../plugins/idCounterPlugin');

var baseUserSchema = require('../schemas/baseUserSchema');
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
			"username": "09001@stpaul.edu.hk",
			"password": "1234",
			"picture": "",
			"isActive": 1,
			"created": "2013-08-28T00:00:00Z",
			"modified": "2013-08-28T00:00:00Z"
     }
 *********************************************/



var userRepositorySchema = baseUserSchema.extend({
	uriPattern: {type: String, default: 'User'}
});




/*********************************************
* Using mongoose plugins here
 *********************************************/
//var createdModifiedPlugin = require('../plugins/createdModifiedPlugin');
//userRepositorySchema.plugin(createdModifiedPlugin, { index: false });


/*********************************************
 * Custom Class Method (Static method)
 *********************************************/

/*
 * Input: users - An array of users object to be saved
 */
userRepositorySchema.statics.batchImport = function (options, callback) {
	var self = this;
	var noOfSuccessfulImport = 0;
	var noOfCreatedUser = 0;
	var noOfUpdatedUser = 0;
	var users = options.users;
	var skipCheckExist = options.skipCheckExist || false;
	var filterUser;
	if (skipCheckExist) {
		filterUser = function (user, done) {
			if (user) {
				self.saveUser(user, function (err, importedUser) {
					if (err) {
						done(err);
					} else {
						noOfCreatedUser++;
						noOfSuccessfulImport++;
						done(null, importedUser);
					}
				});
			} else {
				done("Invalid import user object");
			}
		};
	} else {
		filterUser = function (user, done) {
			if (user) {
				self.findByConditions({username: user.username}, function (err, users) {
					if (err) {
						done(err);
					} else {
						if (users.length > 1) {
							done("More than one users");
						} else {
							if (users.length == 1) {
								noOfUpdatedUser++;
								user._id = users[0]._id; // for query in saveUser method to update the existing document
								objectHelper.deleteProperties(user, [
									"password",
									"isActivated",
									"verificationCode",
									"groups",
									"code"
								]); // prevent from being updated with default values when new User()
							} else {
								noOfCreatedUser++;
							}
							self.saveUser(user, function (err, importedUser) {
								if (err) {
									callback(err);
								} else {
									noOfSuccessfulImport++;
									done(null, importedUser);
								}
							});
						}
					}
				});
			} else {
				done("Invalid import user object");
			}
		};
	}

	// "users" contains JS objects(child process) or User objects
	arrayHelper.walkArray(users, {}, filterUser, function (err, importedUsers) {
		if (err) {
			callback(err);
		} else {
			var importResult = {
				noOfSuccessfulImport: noOfSuccessfulImport,
				noOfCreatedUser: noOfCreatedUser,
				noOfUpdatedUser: noOfUpdatedUser
			};
			callback(null, importResult);
		}
	});
};

userRepositorySchema.statics.deleteUsers = function (conditions, callback) {
	conditions = conditions || {};
	this.remove(conditions, callback);
};

userRepositorySchema.statics.findObjectByQuery = function (options, callback) {
  options = options || {};

  var q = this.find(options.firstQuery, options.secondQuery);
  q.where('_type').equals('User');
	q.exec(callback);
};

/*
 * exact matching of searching criteria
 *
 * @param {Object} conditions     search criteria object, e.g. conditions = {subject: "english", classname: "2P"};
 * @param {Function} callback     return callback with 2 arguments (err, students)
 */
userRepositorySchema.statics.findByConditions = function (options, callback) {

	// console.log("options", options);

	var conditions = options || {};

	var q = this.find();
	q.where('_type').equals('User');

	if (conditions._id) {
		q.where("_id").equals(conditions._id);
	}

	if (conditions.ids) {
		q.where("_id").in(conditions.ids);
	}

	if (conditions.email) {
		var emailLike = new RegExp(conditions.email, "i");
		q.where("email").equals(emailLike);
	}

	if (conditions.exists) {
		q.where(conditions.exists).exists(true);
		q.where(conditions.exists).nin(["", null, [], {}]);
	}

	if (typeof conditions.active !== 'undefined') {
		q.where("active").equals(conditions.active);
	}

	if (typeof conditions.activated !== 'undefined') {
		q.where("activated").equals(conditions.activated);
	}

	if (typeof conditions.verified !== 'undefined') {
		q.where("verified").equals(conditions.verified);
	}

	if (conditions.name) {
		var nameLike = new RegExp(conditions.name, "i");
		q.or([{firstName: nameLike}, {middleName: nameLike}, {lastName: nameLike}]);
	}

	if (conditions.notExists) {
		q.where(conditions.notExists).exists(false);
	}

	if (conditions.HKID) {
		var HKIDLike = new RegExp(stringHelper.escapeSpeacialCharacters(conditions.HKID), "i");
		q.where("HKID").equals(HKIDLike);
	}

	if (conditions.address) {
		q.where("address").equals(conditions.address);
	}

	if (conditions.adminRoles) {
		q.where("adminRoles").in(conditions.adminRoles);
	}

	if (conditions.noOfBabies) {
		q.where("noOfBabies").in(conditions.noOfBabies);
	}

	if (conditions.baby) {
		q.where("baby").equals(conditions.baby);
	}

	if (conditions.code) {
		q.where("code").equals(conditions.code);
	}

	if (conditions.DOB) {
		q.where("DOB").equals(conditions.DOB);
	}

	if (conditions.educationLevel) {
		q.where("educationLevel").equals(conditions.educationLevel);
	}

	if (conditions.files) {
		q.where("files").in(conditions.files);
	}

	if (conditions.firstName) {
		q.where("firstName").equals(conditions.firstName);
	}

	if (conditions.gender) {
		q.where("gender").equals(conditions.gender);
	}

	if (conditions.giftDateFrom && conditions.giftDateTo) {
		q.where("vendors.items").elemMatch({receivedDate: {$gte: new Date(conditions.giftDateFrom), $lte: new Date(conditions.giftDateTo)}});
	}

	if (conditions.interestedTypes) {
		q.where("interestedTypes").in(conditions.interestedTypes);
	}

	if (conditions.lastName) {
		q.where("lastName").equals(conditions.lastName);
	}

	if (conditions.occupation) {
		q.where("occupation").equals(conditions.occupation);
	}

	if (conditions.password) {
		q.where("password").equals(conditions.password);
	}

	if (conditions.totalFamilyIncome) {
		q.where("totalFamilyIncome").equals(conditions.totalFamilyIncome);
	}

	if (conditions.vendors) {
		q.where("vendors").in(conditions.vendors);
	}

	if (conditions.vendorId) {
		q.where("vendors").elemMatch({vendorId: conditions.vendorId});
	}

	if (conditions.itemReceivedDate) {
		q.where("vendors.Items").elemMatch({receivedDate: conditions.itemReceivedDate});
	}

	if (conditions.roles) {
		q.where("roles").in(conditions.roles);
	}

	if (conditions.phone) {
		var phoneLike = new RegExp(conditions.phone, "i");
		q.where("phone").equals(phoneLike);
	}

	if (conditions.universalSearch) {
		var universalSearch = new RegExp(conditions.universalSearch, "i");
		// var options = {};
		q.or([
			{firstName: universalSearch},
			{lastName: universalSearch},
			{phone: universalSearch},
			{HKID: universalSearch},
			{email: universalSearch},
			{username: universalSearch},
			{code: universalSearch},
		]);
	}

	if (conditions.username) {
		q.where("username").equals(conditions.username);
	}

	if (conditions.verificationCode) {
		q.where("verificationCode.code").equals(conditions.verificationCode);
	}

	if(conditions.or) {
		q.or(conditions.or);
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
	} else if (typeof options.offset != "undefined" && typeof options.limit != "undefined") {
		var sort = options.sort || '_id';
		var order = (options.order && options.order == 'desc') ? -1 : 1;
		var sortBy = {};
		sortBy[sort] = order;

		q.sort(sortBy).skip(options.offset).limit(options.limit);
		q.exec(function (err, users) {
			if (err) {
				callback(err);
			} else {
				q.count().exec(function (err, total) {
					if (err) {
						callback(err);
					} else {
						callback(null, users, total);
					}
				});
			}
		});
	} else {
		q.exec(callback);
	}
};

/* userRepositorySchema.statics.findByIndex = function (options, callback) {
  options = options || {};
  options.id = options._id || '';
  options.fields = options.fields || '';

  this.findById(options.id, options.fields, callback);
};
 */
userRepositorySchema.statics.mapReduceUsers = function (conditions, callback) {
	// console.log("conditions", conditions);
	this.mapReduce(conditions, callback);
};

// userRepositorySchema.statics.saveUser = function (user, callback) {
	// var id = user._id || new mongoose.Types.ObjectId();
	// delete user._id;

	// this.findByIdAndUpdate(id, user, {upsert : true}, function (err, savedUser) {
		// callback(err, savedUser);
	// });
// };

userRepositorySchema.statics.saveUser = function (user, callback) {
	var self = this;
	var id = user._id || new mongoose.Types.ObjectId();
	delete user._id;

	this.findById(id, function (err, userRepository) {
		if (err) {
			callback(err);
		} else {
			if (userRepository) {
				for (prop in user) {
					if (prop !== "code") {
						userRepository[prop] = user[prop];
					}
				}
				userRepository.save(callback);
			} else {

				IdCounter.getNextSequenceValue({model:'User', field: 'code'}, function(err, NextSequenceValue){

					var newUser = new self(user);
					newUser.code = NextSequenceValue;
					newUser.save(callback);

				});
			}
		}
	});
};


/* single update */
userRepositorySchema.statics.updateUser = function (options, callback) {
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
						callback(403, "Failed to update user");
					}
				}
			});
		}
	});
};

/* multiple update */
userRepositorySchema.statics.updateUsers = function (options, callback) {
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
				self.updateUser(options, callback);
			} else {
				callback(403, "No update conditions specified");
			}
		}
	});
};

/* Housekeeping functions */
userRepositorySchema.statics.ensureJoinedTheGroup_AllUsers = function(options, callback){
	var self = this;
	var ownerId = mongoose.Types.ObjectId(options.ownerId);
	var queryOptions = {
		groups: {
			$not: {
				$elemMatch: {
					name: "All Users"
				}
			}
		}
	};
	var updateOptions = {
		$addToSet: {
			groups: {
				name: "All Users",
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
				self.update({_id: ownerId, groups: {$elemMatch: {name: "All Users"}}}, {$set: {"groups.$.isAdmin": true}}, callback);
			} else {
				callback("ensureJoinedTheGroup_AllUsers FAILED")
			}
		}
	});
};

userRepositorySchema.statics.updateOwnerOfTheGroup_AllUsers = function(options, callback){
	var self = this;
	var ownerId = mongoose.Types.ObjectId(options.ownerId);
	var queryOptions = {
		groups: {
			$elemMatch: {
				name: "All Users"
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
			console.log("updateOwnerOfTheGroup_AllUsers numberAffected", numberAffected);
			if (numberAffected > 0) {
				queryOptions._id = ownerId;
				self.update(queryOptions, {$set: {"groups.$.isAdmin": true}}, callback);
			} else {
				callback("updateOwnerOfTheGroup_AllUsers FAILED");
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
//userRepositorySchema.index({ lastName: 1, firstName: 1}, {name: "fullNameIndex"}); // schema level


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

var UserRepository = mongoose.model('User', userRepositorySchema);
childProcessHelper.processListener(process, UserRepository);
module.exports = UserRepository;
