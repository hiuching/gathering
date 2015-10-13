/*********************************************
 * The Simple Repository model
 *
 * author: Eric Sin
 * created: 2015-06-04T15:16:00Z
 * modified: 2015-06-04T15:16:00Z
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

/*********************************************
 * Main Schema
 * 
 * e.g. 
     {
     
     }
 *********************************************/

var schemaOptions = {autoIndex: false, collection: "simples", discriminatorKey : '_type'};
var simpleRepositorySchema = new Schema({
	//arrived: {type: Boolean, required: true, default: false},
	code: String,
	_type : {type: String, default: "Simple"}
}, schemaOptions);




/*********************************************
* Using mongoose plugins here
 *********************************************/
var createdModifiedPlugin = require('./plugins/createdModifiedPlugin');
simpleRepositorySchema.plugin(createdModifiedPlugin, { index: false });


/*********************************************
 * Custom Class Method (Static method)
 *********************************************/
simpleRepositorySchema.statics.deleteSimples = function (conditions, callback) {
	conditions = conditions || {};
	this.remove(conditions, callback);
};


/*
 * exact matching of searching criteria
 *
 * @param {Object} conditions     search criteria object, e.g. conditions = {subject: "english", classname: "2P"};
 * @param {Function} callback     return callback with 2 arguments (err, students)
 */

/*
 * more queries
 * http://mongoosejs.com/docs/api.html#query-js
 */
simpleRepositorySchema.statics.findByConditions = function (options, callback) {

	// console.log("options", options);
	// q.where('xxx').in(conditions.xxx);
	// q.or({aaa: xxx}, {bbb: xxx})
	
	
	var conditions = options || {};
	
	var q = this.find();
	q.where('_type').equals('Simple');
  
	if (conditions._id) {
		q.where("_id").equals(conditions._id);
	}
	
	if (conditions.exists) {
		q.where(conditions.exists).exists(true);
		q.where(conditions.exists).nin(["", null, [], {}]);
	}
	
	if (typeof conditions.arrived !== 'undefined') {
		q.where("arrived").equals(conditions.arrived);
	}
	
	if (conditions.code) {
		q.where('code').equals(conditions.code);
	}
	
  
	if (conditions.notExists) {
		q.where(conditions.notExists).exists(false);
	}
	
	if (conditions.populate) {
		q.populate(conditions.populate);
	}
	
	if (conditions.univeralSearch) { 
		var univeralSearch = new RegExp(conditions.univeralSearch, "i");
		q.or([
			{code: univeralSearch},
			{"institution.name": univeralSearch},
			{phones:{ $elemMatch: {number: univeralSearch}}},
			{subspecialties: {$in : [univeralSearch]}}
		]);
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

/* simpleRepositorySchema.statics.findByIndex = function (options, callback) {
  options = options || {};
  options.id = options._id || '';
  options.fields = options.fields || '';
  
  this.findById(options.id, options.fields, callback);
};
 */
simpleRepositorySchema.statics.mapReduceSimples = function (conditions, callback) {
	// console.log("conditions", conditions);
	this.mapReduce(conditions, callback);
};

simpleRepositorySchema.statics.saveSimple = function (simple, callback) {
	var self = this;
	var id = simple._id || new mongoose.Types.ObjectId();
	delete simple._id;

	this.findById(id, function (err, simpleRepository) {
		if (err) {
			callback(err);
		} else {
			if (simpleRepository) {
				for (prop in simple) {
					if (prop !== "code") {
						simpleRepository[prop] = simple[prop];
					}
				}
				simpleRepository.save(callback);
			} else {

				IdCounter.getNextSequenceValue({model:'Simple', field: 'code'}, function(err, NextSequenceValue){

					var newSimple = new self(simple);
					newSimple.code = NextSequenceValue;
					newSimple.save(callback);
						
				});
			}
		}
	});
};


/* single update */
simpleRepositorySchema.statics.updateSimple = function (options, callback) {
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
						callback(403, "Failed to update simple");
					}
				}
			});
		}
	});
};

/* multiple update */
simpleRepositorySchema.statics.updateSimples = function (options, callback) {
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
				self.updateSimple(options, callback);
			} else {
				callback(403, "No update conditions specified");
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
//simpleRepositorySchema.index({ lastName: 1, firstName: 1}, {name: "fullNameIndex"}); // schema level


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
 
var SimpleRepository = mongoose.model('Simple', simpleRepositorySchema);
childProcessHelper.processListener(process, SimpleRepository);
module.exports = SimpleRepository;