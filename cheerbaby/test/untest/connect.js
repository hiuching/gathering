/*********************************************
 * The User model
 *
 * author: Eric Sin
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
var autoIncrement = require('mongoose-auto-increment');
var mongoose = require('mongoose');
// var test = require('unit.js');
var should = require('should');
// var must = test.must;
var extend = require('mongoose-schema-extend');
var baseUserSchema = require('../../models/schemas/baseUserSchema');

/*********************************************
 * Test Configurations
 *********************************************/
var CONFIG = require('../../config/config');



/*********************************************
 * DB connection
 *********************************************/


// var mongoDBConnector = require('../lib/mongoDBConnector');
// mongoDBConnector.init(CONFIG.mongoDB);
// connection = mongoDBConnector.connect();
// autoIncrement.initialize(connection);

var connection = mongoose.connect('localhost:27017/dev');
autoIncrement.initialize(connection);
/*********************************************
 * Main Schema
 * 
 * e.g. 
     {
		"code": "1234",
		"password": "09001",
		"emails": [{"label":"work", "email":"don.lee@questwork.com"}],
		"picture": "",
		"isActivitate": false,
		"created": "2013-08-28T00:00:00Z",
		"modified": "2013-08-28T00:00:00Z"
     
     }
 *********************************************/
 
/*********************************************
 * Tests
 *********************************************/
var connectSchema = baseUserSchema.extend({
code: {type: Number}
});




connectSchema.statics.createNew = function (callback) {
 var Connect = mongoose.model('User', connectSchema);
	var obj = new Connect({"lastName": "hi", "firstName": "hihi", "emails": [{"label": "primary", "email":"don@questwork.com"}]});
	console.log(obj);
	obj.save(function (err, user, numberAffected) {
		if (err) {
			callback(err);
		} else if (user) { 
				callback(err, user, numberAffected);
			} else {
				callback('failed to create record');
			}
	});
};
// connectSchema.statics.findByEmail = function (email, callback) {
	// var conditions = {
		// email: email
	// };
	// this.findByConditions(conditions, callback);
// };

// connectSchema.statics.findByConditions = function (options, callback) {
	// var conditions = options || {};

	// var q = this.find();
	
	// if(conditions.isActive != null){
		// q.where("isActive").equals(conditions.isActive);
	// }
	
	// if(conditions.username){
		// q.where("username").equals(conditions.username);
	// }
	
	// if(conditions.id){
		// q.where("_id").equals(conditions.id);
	// }
	
	// if(conditions.code){
		// q.where("code").equals(conditions.code);
	// }
	
	// if(conditions.email){
		// q.where("emails").elemMatch({email: conditions.email});
	// }
	
	// if(conditions.password){
		// q.where("password").equals(conditions.password);
	// }
	
	// if(conditions.exists){
		// q.where(conditions.exists).exists(true);
	// }
	
	// if(conditions.notExists){
		// q.where(conditions.notExists).exists(false);
	// }
	
	// q.exec(callback);
	
// };
connectSchema.plugin(autoIncrement.plugin,  {
    model: 'Connect',
    field: 'code',
    startAt: 1,
    incrementBy: 1
});
var Connect = mongoose.model('User', connectSchema);

Connect.createNew(function(err, user, numberAffected){
	console.log('createNew result', err,user, numberAffected);
	Connect.find({},{},{},function(err, data){
		console.log('data',data);
});
	return;
});
module.exports = mongoose.model('User', connectSchema);
/*********************************************
 * End
 *********************************************/