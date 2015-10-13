/*********************************************
 * The User Controller
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/


/*********************************************
 * Include modules
 *********************************************/
var arrayHelper = require('../lib/arrayHelper');
var encryption = require('../lib/encryption');
var fileHelper = require('../lib/fileHelper');
var fs = require('fs');
var modelHelper = require('../lib/modelHelper');
var networkHelper = require('../lib/networkHelper');
var objectHelper = require('../lib/objectHelper');
var path = require('path');


/*********************************************
 * Include models
 *********************************************/


var User = require('../models/user');

 /*********************************************
 * Class Constructor
 *
 * @param {Object} app_config     application config object
 * @param {Object} [options]        optional config object
 *
 * @return {Object} userController     Class instance
 *********************************************/
var UserController = function (app_config, options) {
  options = options || {};
  this.config = app_config;
  this.datapath = app_config.datapath;
  this.folder = options.folder ? path.join(this.datapath, options.folder) : this.datapath;
  this.idAttribute = options.idAttribute ? options.idAttribute : "_id";

  this.authenticationEngine = app_config.authenticationEngine;
  this.apiKey = app_config.apiKey;
  this.apiSecret = app_config.apiSecret;
  this.skipAuthentication = app_config.skipAuthentication; // if true, always authenticate
  this.view = options.view || '';
  this.authenticationTimeout = app_config.authenticationTimeout || 10000;

  this.auth = options.auth;
  this.userFolder = options.folder ? path.join(this.datapath, options.folder) : this.datapath;

  /* change authenticationEngine in stpaul.js */
  if (this.authenticationEngine == 'folder') {
    this.useFileSystem = true;
  } else {
    this.useFileSystem = false;
  }

	/* begin of your test here */

	//modelHelper.loadSampleData( User, { folder: 'user', keys: ['username'] } );

  /* end of your test here */


};




/*********************************************
 * route functions
 *********************************************/

/*
 * find all users
 *
 * find user based on the criteria in options object and then a callback is called
 *
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, users) users will be null if no user is found, otherwise a array of user object
 */
UserController.prototype.findAllCallback = function (options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  var self = this;
  var req = options.req;
  var query = req.query;
  var headers = req.headers;
  //query.user = req.session.user;
	query.user = req.user;

  /* query = {arg1: "value1", arg2: "value2"} */

  User.findAll(query, callback);
};

UserController.prototype.findAll = function (req, res, options) {
  options = options || {};
	this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
	options.req = req;

	this.findAllCallback(options, function (err, data) {
		networkHelper.response(err, {
			data : data,
			res : res
		});
	});
};


/*
 * find a user by unique Id
 *
 * find user based on the criteria in options object and then a callback is called
 *
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, user) user will be null if no user is found, otherwise a single user object
 */
UserController.prototype.findByIndexCallback = function (options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  var req = options.req;
  var id = req.params.id;
  var self = this;
  //var user = req.session.user;
	var user = req.user;

  User.findUserById({id: id, user: user}, callback);
};


/*
 * find all users
 *
 * find user based on the criteria in options object and then a callback is called
 *
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, users) users will be null if no user is found, otherwise a array of user object
 */
UserController.prototype.findByIndex = function (req, res, options) {
  options = options || {};
	this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
	options.req = req;
	this.findByIndex(options, function (err, data) {
  	networkHelper.response(err, {data: data, res: res});
	});
};


/*
 * updateByIdCallback
 *
 * find user based on the criteria in options object and then a callback is called
 *
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, users) users will be null if no user is found, otherwise a array of user object
 */
UserController.prototype.updateByIdCallback = function (options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
	var self = this;
	var req = options.req;
	var id = req.params.id;

	if (typeof req.body !== 'undefined') {

		var update = req.body;

		if (req.body.action == 'changedEmail') {
			var opt = {
				conditions : {
					id : id
				},
				update : update,
				user: req.user
			};

			User.changedEmail(opt, callback);

		} else if (update.action == 'sendActivationLink') {

			User.sendActivationLink({update: update, user: req.user}, callback);

		} else if (update.action == 'printLabel') {

			User.printLabel({update: update, user: req.user}, callback);

		} else {

			if (update.password && (update.password == '')) {
				delete update.password;
			}

			var opt = {
				conditions : {
					id : id
				},
				update : update,
				user: req.user
			};

			User.updateById(opt, function (err, updatedUser) {
				if (err) {
					callback(err);
				} else {
					callback(null, updatedUser);
				}
			});
		}

	} else { //if (typeof req.body !== 'undefined') {
		callback(500);
	} //if (strData !== '')

};

UserController.prototype.updateById = function (req, res, options) {
  options = options || {};
	this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
	options.req = req;
	this.updateByIdCallback(options, function (err, data) {
		// console.log(err, data);
  	networkHelper.response(err, {data: data, res: res});
	});
};

UserController.prototype.addCallback = function (options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
	var self = this;
	var req = options.req;

	if (typeof req.body !== 'undefined') {
		var update = req.body;

		if (typeof update.action !== "undefined") {

			if (update.action == "importFiles") {

				update.fullFilename = update.name;
				var uploadFiles = [update];
				fileHelper.saveBase64File(self.folder, uploadFiles, {}, callback);

			} else {

				callback(401, "Not support this action");
			}

		} else {
			User.createAndSendVerificationLink(update, callback);

		}

	} else { //if (typeof req.body !== 'undefined') {
		callback(500);
	} // if (typeof req.body !== 'undefined') {
};

UserController.prototype.add = function (req, res, options) {
  options = options || {};
	this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.addCallback(options, function(err, data) {
  	networkHelper.response(err, {data: data, res: res});
  });
};


UserController.prototype.authenticate2 = function (req, res) {
  var options = {
		email: req.query.email,
		password: req.query.password
  };
  User.authenticate(options, function (err, user) {
    if (err) {
      res.status(err).send(user);
    } else {
			req.session.user = user;
      res.status(200).send(user);
    }
  });
};


/*
 * authenticate by request. If found, return user
 *
 * @param {Object} req        user auth params, e.g. apiToken, username, timestamp, nounce, token, userid
 * @param {Function} callback     return callback with 2 arguments (err, user)
 */
UserController.prototype.authenticate = function (req, callback) {
	if (req.user) {
		callback(null, req.user);
	} else {
		callback(401, null);
	}
};


/*
 * login wrapper for web call, simply pass to authenticate method
 * this method should not call by others
 */
UserController.prototype.login = function (req, res) {
	if (! this.skipAuthentication) {
		this.authenticate(req, function (err, user) {
		  controllerResponse(err, {data: user, res: res});
		});
	} else {
	  var user = User.getDummy();
		controllerResponse(null, {data: user, res: res});
	}
};

/*********************************************
 * functions
 *********************************************/

var controllerResponse = function (err, options) {
	options = options || {};
	var res = options.res;

	if (err) {
		console.log(err, options.data);
		res.status(err).send({error: options.data});
	} else {
		var status = options.status || 200;
		res.status(status).send(options.data);
	}
};


/*********************************************
 * Export as a module
 *********************************************/
module.exports = UserController;
