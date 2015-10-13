/*********************************************
 * The Base User schema (parent class)
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/


/*********************************************
 * Include modules
 *********************************************/
var objectHelper = require('../../lib/objectHelper');
var arrayHelper = require('../../lib/arrayHelper');
var encryption = require('../../lib/encryption');
var mongoose = require('mongoose'), Schema = mongoose.Schema;


/*********************************************
 * CONSTANT declaration
 *********************************************/
var PASSWORD_LENGTH = 8;
var TIME_TO_LIVE = 3600; //seconds
var CODE_LENGTH = 32;

/*********************************************
 * Functions
 *********************************************/



/*********************************************
 * Sub-document Schema
 *********************************************/


/*********************************************
 * Main Schema
 *
 * e.g.
    {
      "username": "don.lee@questwork.com",
      "password": "1234",
      "hash_password": "asdfasdf",
      "lastName": "Lee",
      "firstName": "Don",
      "lastNameOther": "",
      "firstNameOther": "",
      "phones": [{"label":"work", "cCode":"852", "aCode":"", "number":"23977000"}],
      "addresses": [{"label":"work", "address":"12B, Shing Lee"}],
      "emails": [{"label":"work", "email":"don.lee@questwork.com"}],
      "roles": ["superadmin", "admin", "teacher"],
      "picture": {"src": "http://www.questwork.com/images/hj.png", "alt": ""},
      "preferences": {},
      "isActive": true,
      "isActivated": true,
      "lastLogin": "2013-08-28T00:00:00Z",
      "created": "2013-08-28T00:00:00Z",
      "modified": "2013-08-28T00:00:00Z"
    }
 *********************************************/
var schemaOptions = {autoIndex: false, collection: "users", discriminatorKey : '_type'};
var baseUserSchema = new Schema({
	address: {
		line1: String,
		line2: String,
		district: String,
		region: String,
		country: String
	},
	activated: {type: Boolean, required: true, default: false},
	active: {type: Boolean, required: true, default: true},
  agreePolicy: String,
	adminRoles: [String],
	baby: {
		EDD: String,
		bornType: String,
		hospital: String,
		hospitalType: String,
		attendingPhysician: String,
	},
	code: String,
	DOB: Date,
	educationLevel: String,
	email: String,
	files: [{
		amazonUrl: {type: String},
		amazonFilename: {type: String},
		_type: {type: String},
		filename: {type: String},
		fullFilepath: {type: String},
		timestamp: {type: Date}
	}],
	firstName: {type: String, trim: true},
	HKID: String,
	hash_password: {type: String},
	interestedTypes: [String],
	interestedOther: String,
	lastLogin: {type: Date},
	lastName: {type: String, trim: true, index: true}, // field level index
	noOfBabies: [{
		DOB: String,
		sex: String,
	}],
	occupation: String,
	password: {type: String, trim: true, /*required: true,*/ set: encryption.setHashPassword},
	phone: String,
	roles: [String],
	salt: {type: String},
	totalFamilyIncome: String,
	username: {type: String, trim: true, /*required: true,*/ index: true/* , unique: true */},
	vendors: [{
		vendorId: {type: mongoose.Schema.Types.ObjectId, ref: 'Vendor'},
		chiName: String,
		engName: String,
		vendorType: String,
		registrationDate: Date,
		items: [{
			itemId: {type: mongoose.Schema.Types.ObjectId, ref: 'Item'},
			itemCode: String,
			itemName: String,
			receivedDate: Date,
			branch: String,
			received: {type: Boolean, required: true, default: false}
		}]
	}],
	verified: {type: Boolean, required: true, default: false},
	verificationCode: {
		code: String,
		expiryDate: Date
	},
}, schemaOptions);

/*********************************************
* Using mongoose plugins here
 *********************************************/
var createdModifiedPlugin = require('../plugins/createdModifiedPlugin');
baseUserSchema.plugin(createdModifiedPlugin, { index: false });


var uniqueValidator = require('mongoose-unique-validator');
baseUserSchema.plugin(uniqueValidator, { mongoose: mongoose });



/*********************************************
 * Custom Class Method (Static method)
 *********************************************/

/*********************************************
 * Custom instance Method
 *********************************************/

/*********************************************
 * Virtual property getter (not persistent in DB)
 *********************************************/

/*********************************************
 * Virtual property setter
 *********************************************/

/*********************************************
 * Helper functions
 *********************************************/

/*********************************************
 * Export as a module
 *********************************************/
module.exports = baseUserSchema;