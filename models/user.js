var mongoose = require('mongoose'), Schema = mongoose.Schema;
var extend = require('mongoose-schema-extend');

var userSchema = new Schema({
	email:  {type: String},
	password: {type: Number},
	displayName:  {type: String},
	noShowCount: {type: Number},
	profilePic: {type: String},
	friendList: {type: Array}
}, {collection: 'user'});

userSchema.statics.findAll = function (options, callback) {
	if(options.action == "findUserByEmailAndPassword"){
		return this.findUserByEmailAndPassword(options, callback);
	} else  if (options.action == "findUserByEmail"){
		return this.findUserByEmail(options, callback);
	}else  if (options.action == "findUserByDisplayName"){
		return this.findUserByDisplayName(options, callback);
	} else {
		return this.findByConditions(options, callback);
	}
};


userSchema.statics.findByConditions = function (options, callback) {
	var conditions = options || {};
	var q = this.find();
	if (conditions.email != null && conditions.email != '') {
		q.where("email").equals(conditions.email);
	}	
	if (conditions.password != null && conditions.password != '') {
		q.where("password").equals(conditions.password);
	}
	if (conditions.displayName != null && conditions.displayName != '') {
		q.where("displayName").equals(conditions.displayName);
	}
	q.exec(callback);
}; 

userSchema.statics.findUserByEmailAndPassword = function (options, callback) {
	options = options || {};
	var conditions = {};
	conditions.email = options.email;
	conditions.password = options.password;
	
	this.findByConditions(conditions, function(err, users){
		if(err){
			callback(err);
		} else {
			if(users.length == 1){
				callback(null, users[0]);
			} else {
				callback({code:404, message: 'uncorrert email or password'});
			}
		}
	});    
};

userSchema.statics.findUserByEmail = function (options, callback) {
	options = options || {};
	var conditions = {};
	conditions.email = options.email;
    this.findByConditions(conditions, callback);     
};

userSchema.statics.findUserByDisplayName = function (options, callback) {
	options = options || {};
	var conditions = {};
	conditions.displayName = options.displayName;
	
	this.findByConditions(conditions, callback);
};

userSchema.statics.create = function (options, callback) {
	console.log('options', options)
	var user = options || {};
	var User = new this(user);
	User.save(callback);       
};


userSchema.statics.updateById = function (id, update, callback) {
    this.update({ _id: id }, update,  callback);
};
module.exports = mongoose.model('User', userSchema);