/*********************************************
 * The User Repository Test model
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
var baseUserSchema = require('../schemas/baseUserSchema');
var encryption = require('../../lib/encryption');
var extend = require('mongoose-schema-extend');
var mongoose = require('mongoose'), Schema = mongoose.Schema;
var objectHelper = require('../../lib/objectHelper');

/*********************************************
 * Include Class
 *********************************************/



/*********************************************
 * CONSTANT declaration
 *********************************************/
var PASSWORD_LENGTH = 8;
var CLIENT_SECRET_LENGTH = 24;
var ACCESS_TOKEN_LENGTH = 32;
var TIME_TO_LIVE = 3600*24*7;

var VALID_EMAIL_FORMAT = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/gi;
// label:email
var IMPORT_EMAIL_FORMAT = /([A-Z]+)\:([A-Z0-9\s._@%+-]+)/gi;
// name:department-position
var IMPORT_INSTITUTION_FORMAT = /([A-Z0-9\s]+)\:([A-Z0-9\s]*)\-([A-Z0-9\s]*)/gi;
// streetAddress-city-state-zip-country
var IMPORT_ADDRESS_FORMAT = /([A-Z0-9\s]+)\-([A-Z0-9\s]*)\-([A-Z0-9\s]*)\-([A-Z0-9\s]*)\-([A-Z0-9\s]*)/gi;
// label:cCode-aCode-number
// e.g. "primary:852--23456789,office:304-45-5823759,whatsapp:852--94838658"
var IMPORT_PHONE_FORMAT = /([A-Z0-9]+)\:([0-9]*)\-([0-9]*)\-([0-9]+)/gi;
// YYYY/MM/DD, delimiter: . , / -
// e.g. 1999/12/31
var IMPORT_DATE_FORMAT = /(19|20)[0-9]{2}[.,\/-](0?[1-9]|1[0-2])[.,\/-](0[1-9]|(1|2)[0-9]|3(0|1))/g;

var SCOPE = {
	abstracts : ["abstracts"],
	all : ["code", "username", "title", "lastName", "firstName", "middleName", "phones", "address", "emails", "gender", "DOB", "institution", "groups", "subspecialties", "abstracts"],
	contacts : ["phones", "emails"],
	events : ["pastEvents"],
	groups : ["groups"],
	profile : ["firstName", "middleName", "lastName", "gender", "institution", "subspecialties", "DOB"],
	__dev: ["accessTokens"]
};

/*********************************************
 * Sub-document Schema
 *********************************************/


// var accessTokenSchema = new Schema({
	// clientId: {type: Schema.Types.ObjectId, ref: 'Client'},
	// token: {type: String},
	// expiryDate: {type: Date},
	// scope: [{type: String}]
// });

// var clientSchema = new Schema ({
	// name: {type: String},
	// redirectUri: {type: String},
    // secret: {type: String}
// });

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
//var createdModifiedPlugin = require('./plugins/createdModifiedPlugin');
//userRepositorySchema.plugin(createdModifiedPlugin, { index: false });


/*********************************************
 * Custom Class Method (Static method)
 *********************************************/
 



/*
 * exact matching of searching criteria
 *
 * @param {Object} conditions     search criteria object, e.g. conditions = {subject: "english", classname: "2P"};
 * @param {Function} callback     return callback with 2 arguments (err, students)
 */
userRepositorySchema.statics.findByConditions = function (options, callback) {
	var conditions = options || {};

	callback(null, [1]);
};


/*********************************************
 * Custom instance Method
 *********************************************/

userRepositorySchema.methods.saveUser = function (callback) {
  callback(null, this, 1);
};

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
 
/*********************************************
 * Export as a module
 *********************************************/
module.exports = mongoose.model('User', userRepositorySchema);

