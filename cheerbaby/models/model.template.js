/*********************************************
 * The Simple model
 *
 * author: Eric Sin
 * created: 2015-06-04T15:16:00Z
 * modified: 2015-06-04T15:16:00Z
 *
 *********************************************/

 /*********************************************
 * Include Helpers
 *********************************************/
var arrayHelper = require('../lib/arrayHelper');
var objectHelper = require('../lib/objectHelper');

/*********************************************
 * Include Class
 *********************************************/
var ArrayFilter = require('./arrayFilters/arrayFilter');
var StandardArrayFilter = require('./arrayFilters/standardArrayFilter');

/*********************************************
 * Include Repository
 *********************************************/
var SimpleRepository = require('./repositories/simpleRepository');

/*********************************************
 * CONSTANT declaration
 *********************************************/
const DEBUG = false;
// const USE_CHILD_PROCESS = true;
const USE_CHILD_PROCESS = false;
/*********************************************
 * Class definition
 *********************************************/
function Simple(options){
	options = options || {};
	
	this._id = options._id || null;
	this.code = options.code || '';
}

/*********************************************
 * Class methods
 *********************************************/
Simple.authorizeAdmin = function (memberId, callback) {
/* pending */
};

Simple.removeUser = function (userId, callback) {
/* pending */
};


/*
 * create static methods 
 */ 
Simple.create = function (options, callback) {
	var self = this;
	
	validateSimpleOptions(options, function (err, options) {
		if (err) {
			callback(err);
		} else {
			var simple = new self(options);
			simple.saveSimple(callback);
		}
	})
};


/*
 * update static methods 
 */
Simple.updateById = function (options, callback) {
	options = options || {};
	var conditions = options.conditions;
  var update = options.update;

	this.findById(conditions, function (err, simple) {
		if (err) {
			callback(err);
		} else {
			simple.updateSimple(update, callback);
		}
	});
};

/*
 * find static methods 
 */
Simple.findAll = function (options, callback) {
	if (objectHelper.isEmptyObject(options)) {
  
		console.log('findAllSimples');
		return this.findAllSimples({}, callback);
	
	} else if (options.action == 'findById') {
	
		console.log('findById');
		return this.findById(options, callback);
	
	} else {
	
		console.log('findAllSimples');
		return this.findAllSimples(options, callback);
    
	}
}; 


Simple.findAllSimples = function (options, callback) {
	var conditions = options || {};
	
	checkConditions(conditions, function (err, conditions) {
		if (err) {
			callback(err);
		} else {
			findSimples(conditions, function (err, simples) {
				if (err) {
					callback(err);
				} else {
					callback(null, callback);
				}
			});
		}
	});
};

Simple.findById = function (options, callback) {
	options = options || {};
	var conditions = {
		id: options.id
	};
	
	checkConditions(conditions, function (err, checkedConditions) {
		if (err) {
			callback(err);
		} else {
			findSimples(checkedConditions, function (err, simples) {
				if (err) {
					callback(err);
				} else {
					if (simples.length == 1) {
						callback(null, simples[0]);
					} else if (simples.length == 0) {
						callback({code : 404, message : "no record"});
					} else {
						callback({code : 403, message : "Simple more than one"});
					}
				}
			});
		}
	});
};




/*********************************************
 * Instance methods
 *********************************************/
Simple.prototype.saveSimple = function (callback) {
	var self = this;

	saveToRepository(this, callback);
};

Simple.prototype.updateSimple = function (update, callback) {
	for (var key in update) {
		this[key] = update[key];
	}
	this.saveSimple(callback);
};

/*********************************************
 * Helper functions
 *********************************************/
var sendEmail = function (email, callback) {
/* pending */
	var recipients = email.recipients;
	if (!recipients instanceof Array) recipients = [recipients];
	var sender = email.sender;
	var mailOptions = email.mailOptions;
	var filterRecipient = function (recipient, done) {
		mailOptions.html = mailOptions.html.replace(/\%recipient\%/gi, recipient.getFullName());
		mailOptions.html = mailOptions.html.replace(/\%sender\%/gi, sender.getFullName());
		recipient.sendEmail(mailOptions, done);
	};
	arrayHelper.walkArray(recipients, {}, filterRecipient, function (err) {
		if (err) {
			callback(err);
		} else {
			callback(null, true);
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
	
	if (options.code) {
		conditions.code = options.code;
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

	if (options.univeralSearch) {
		conditions.univeralSearch = options.univeralSearch;
	}

	if (options.sort) {
		conditions.sort = options.sort;
	}
	
	callback(null, conditions);
};

var findSimples = function (options, callback) {
	findSimplesFromRepository(options, function (err, simples, total) {
		if (DEBUG) {
			console.log(err, simples);
		}
		callback(err, simples, total);
	});
};

var findSimplesFromRepository = function (conditions, callback) {
	var _callback = function (err, simpleArray, total) {
		if (err) {
			callback(err);
		} else {
			var simples = initFromArray(simpleArray);
			callback(null, simples, total);
		}
	};
	
	if (USE_CHILD_PROCESS) {
		findSimplesFromRepositoryWitChildProcess(conditions, callback);
	} else {
		SimpleRepository.findByConditions(conditions, _callback);
	}
};

function init (value) {
	return new Simple(value);
};

var initFromArray = function (arr) {
	return arr.map(function (simpleObject) {
		return init(simpleObject);
	});
};

/* 
 * simple: Simple instance
 * callback: Simple instance
 */
var saveToRepository = function (simple, callback) {
	/* add and update */
	if (USE_CHILD_PROCESS) {
		saveToRepositoryWithChildProcess(simple, callback);
	} else {
		SimpleRepository.saveSimple(simple, function (err, simpleObject) {
      //console.log(simpleObject);
      Simple.findById({id: simpleObject._id}, callback); // use this to return the same object as GET
			//callback(err, init(simpleObject));
		});
	}
};

var validateSimpleOptions = function (options, callback) {
	if (options.date) {
		options.date = options.date;
		callback(null, options);
	} else {
		callback({code : 400, message : "No Simple date and time is provided"});
	}
};


/*********************************************
 * Export as a module
 *********************************************/
module.exports = Simple;