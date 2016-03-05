var mongoose = require('mongoose'), Schema = mongoose.Schema;
var extend = require('mongoose-schema-extend');
var Mail = require('./mail');
/***************
schema
****************/
var userSchema = new Schema({
	email:  {type: String, lowercase: true, required: true},
	password: {type: String, select: false, required: true, trim: true},
	displayName:  {type: String},
	noShowCount: {type: Number, default: 0},
	profilePic: {type: String},
	friendList: [{type: mongoose.Schema.Types.ObjectId, ref: 'User'}]
}, {collection: 'user'});

/***************
Public method
****************/

userSchema.statics.addFriend = function (id, update, callback) {
	var self = this;
	this.findUserByIdWithoutPopulate({id: id}, function (err, user) {
		if (err) {
			callback(err);
		} else {
			if (user.friendList.indexOf(update.friend) == -1){
				user.friendList.push(update.friend);
				self.update({ _id: id }, user,  function(err, noOfUpdate) {
					if (err) {
						callback(err);
					} else {
						delete user.password;
						callback(null, user);
					}
				});
			} else {
				callback({code: 403, message: 'You have this friend already'});
			}
		}
	});
};

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
		return this.findUsersByDisplayName(options, callback);
	} else  if (options.action == "searchFriends"){
		return this.searchFriends(options, callback);
	} else {
		return this.findByConditions(options, callback);
	}
};


userSchema.statics.findByConditions = function (options, callback) {
	var conditions = options || {};
	var q = this.find();
	if (conditions._id != null && conditions._id != '') {
		q.where("_id").equals(conditions._id);
	}	
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
	} if (!conditions.populate){
		q.populate("friendList");
	}
	
	q.exec(callback);
}; 

userSchema.statics.findUsersByDisplayName = function (options, callback) {
	options = options || {};
	var conditions = {};
	conditions.displayName = new RegExp(options.displayName, 'i');
	
	this.findByConditions(conditions, callback);
};

userSchema.statics.findUserByEmail = function (options, callback) {
	options = options || {};
	var conditions = {};
	options.email = options.email || '';
	conditions.email = options.email.toLowerCase();
    this.findByConditions(conditions, function(err, users){
		if(users.length == 1){
			callback(null, users[0]);
		} else if (users.length == 0){
			callback(null);
		} else {
			callback({code: 403, message: 'more than one recode'});
		}
	});     
};

userSchema.statics.findUserByEmailAndPassword = function (options, callback) {
	options = options || {};
	var conditions = {};
	
	options.email = options.email || '';
	conditions.email = options.email.toLowerCase();
	conditions.password = options.password;
	
	this.findByConditions(conditions, function(err, users){
		if(err){
			callback(err);
		} else {
			if(users.length == 1){
				callback(null, users[0]);
			} else {
				callback({code: 404, message: 'incorrert email or password'});
			}
		}
	});    
};

userSchema.statics.findUserByEmailWithPassword = function (options, callback) {
	options = options || {};
	var conditions = {};
	options.email = options.email || '';
	conditions.email = options.email.toLowerCase();
	conditions.select = '+password';
    this.findByConditions(conditions, function(err, users){
		if(users.length == 1){
			callback(null, users[0]);
		} else if (users.length == 0){
			callback(null);
		} else {
			callback({code: 403, message: 'more than one recode'});
		}
	});     
};

userSchema.statics.findUserById = function (options, callback) {
	options = options || {};
	var conditions = {};
	conditions._id = options.id;
	conditions.select = '+password';
    this.findByConditions(conditions, function(err, users){
		if(users.length == 1){
			callback(null, users[0]);
		} else if (users.length == 0){
			callback({code: 404, message: 'recode not found'});
		} else {
			callback({code: 403, message: 'more than one recode'});
		}
	});     
};

userSchema.statics.findUserByIdWithoutPopulate = function (options, callback) {
	options = options || {};
	var conditions = {};
	conditions._id = options.id;
	conditions.populate = true;
    this.findByConditions(conditions, function(err, users){
		if(users.length == 1){
			callback(null, users[0]);
		} else if (users.length == 0){
			callback({code: 404, message: 'recode not found'});
		} else {
			callback({code: 403, message: 'more than one recode'});
		}
	});     
};

userSchema.statics.removeFriend = function (id, update, callback) {
	var self = this;
	this.findUserByIdWithoutPopulate({id: id}, function (err, user) {
		if (err) {
			callback(err);
		} else {
			for (var i=0; i<user.friendList.length; i++){
				if (update.friend == user.friendList[i]){
					user.friendList.splice(i, 1);
				}
			};
			self.update({ _id: id }, user,  function(err, noOfUpdate) {
				if (err) {
					callback(err);
				} else {
					delete user.password;
					callback(null, user);
				}
			});
		}
	});
};

userSchema.statics.searchFriends = function (options, callback) {
	options = options || {};
	var conditions = {};
	options.email = options.email || '';
	conditions.displayName = new RegExp(options.displayName, 'i');
	conditions.email = options.email.toLowerCase();
	
	this.findByConditions(conditions, callback);
};

userSchema.statics.setPassword = function (id, update, callback) {
	var self = this;
	this.findUserById({id: id}, function (err, user) {
		if (err) {
			callback(err);
		} else {
			if (user.password == update.currentPassword) {
				user.password = update.newPassword;
				self.update({ _id: id }, user,  function(err, noOfUpdate) {
					if (err) {
						callback(err);
					} else {
						user.password = undefined;
						callback(null, user);
					}
				});
			} else {
				callback({code: 401, message: 'incorrect password'});
			}
		}
	});
};

userSchema.statics.updateById = function (id, update, callback) {
	update = update || {};
	var self = this;
	if (update.action == 'setPassword') {
		return this.setPassword(id, update, callback);
	} else if (update.action == 'addFriend') {
		return this.addFriend(id, update, callback);	
	} else if (update.action == 'removeFriend') {
		return this.removeFriend(id, update, callback);	
	}	else {
		return this.updateUser(id, update, callback);	
	}
};

userSchema.statics.updateUser = function (id, update, callback) {
	var self = this;
	this.update({ _id: id }, update,  function(err, noOfUpdate) {
		if (err) {
			callback(err);
		} else {
			delete update.password;
			callback(null, update);
		}
	});
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