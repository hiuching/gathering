var mongoose = require('mongoose'), Schema = mongoose.Schema;
var extend = require('mongoose-schema-extend');
var Mail = require('./mail');
/***************
schema
****************/
var userSchema = new Schema({
	email:  {type: String},
	password: {type: String, select: false},
	displayName:  {type: String},
	noShowCount: {type: Number},
	profilePic: {type: String},
	friendList: {type: Array}
}, {collection: 'user'});

/***************
Public method
****************/
userSchema.statics.create = function (options, callback) {
	var self = this;
	options = options || {};
	options.password = resetPassword();
	Mail.send(options, function(err, res){
		if (err){
			callback(err);
		} else {
			self.findUserByEmail(options, function(err, user){
				if (err){
					callback(err);
				} else {
					if (user){
						user.password = options.password;
					} else {
						var user = new self (options);
					}
					user.save(callback);  
				}
			});
		}
	});
};
userSchema.statics.findAll = function (options, callback) {
	if(options.action == "findUserByEmailAndPassword"){
		return this.findUserByEmailAndPassword(options, callback);
	} else  if (options.action == "findUserByEmail"){
		return this.findUserByEmail(options, callback);
	} else  if (options.action == "findUserByEmailWithPassword"){
		return this.findUserByEmailWithPassword(options, callback);
	} else  if (options.action == "findUsersByDisplayName"){
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
	if (conditions.select != null && conditions.select != '') {
		q.select(conditions.select);
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
				callback(null, user[0]);
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
    this.findByConditions(conditions, function(err, users){
		if(users.length == 1){
			callback(null, users[0]);
		} else if (users.length == 0){
			callback(null);
		} else {
			callback({code:403, message: 'more than one recode'});
		}
	});     
};

userSchema.statics.findUserByEmailWithPassword = function (options, callback) {
	options = options || {};
	var conditions = {};
	conditions.email = options.email;
	conditions.select = '+password';
    this.findByConditions(conditions, function(err, users){
		if(users.length == 1){
			callback(null, users[0]);
		} else if (users.length == 0){
			callback(null);
		} else {
			callback({code:403, message: 'more than one recode'});
		}
	});     
};

userSchema.statics.findUsersByDisplayName = function (options, callback) {
	options = options || {};
	var conditions = {};
	conditions.displayName = options.displayName;
	
	this.findByConditions(conditions, callback);
};

userSchema.statics.updateById = function (id, update, callback) {
    this.update({ _id: id }, update,  callback);
};

/***************
Private method
****************/
var resetPassword =  function(){
    var password = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    for ( var i=0; i < 8; i++ ) {
        password += possible.charAt(Math.floor(Math.random() * possible.length));
	}
    return password;
};

module.exports = mongoose.model('User', userSchema);