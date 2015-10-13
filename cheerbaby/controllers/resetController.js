/*********************************************
 * The Reset Controller
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
var ResetController = function (app_config, options) {
  options = options || {};
  this.config = app_config;
  this.datapath = app_config.datapath;
  this.folder = options.folder ? path.join(this.datapath, options.folder) : this.datapath;
  this.idAttribute = options.idAttribute ? options.idAttribute : "_id";
  this.auth = options.auth;
  this.useFileSystem = false;
  
	/* begin of your test here */

	//modelHelper.loadSampleData( Reset, { folder: 'user', keys: ['username'] } );
	
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
ResetController.prototype.findAllCallback = function (options, callback) {
	var self = this;
	var req = options.req;
	var query = req.query;
	var headers = req.headers;
	/* query = {arg1: "value1", arg2: "value2"} */
	if (!self.useFileSystem) {
		var email = query.email;
		User.sendResetPasswordVerificationLinkByEmail(email, callback);
	} else {
		fileHelper.loadDir(self.folder, query, function (err, data) {
			if (err) {
				console.log(err);
				callback(404);
			} else {
				callback(null, data);
			}
		});
	}

};

ResetController.prototype.findAll = function (req, res, options) {
	options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
	options.req = req;

	this.findAllCallback(options, function (err, data) {
		// console.log(arguments);
		networkHelper.response(err, {data: data, res: res});
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
ResetController.prototype.findByIndexCallback = function (options, callback) {
  var req = options.req;
  var id = req.params.id;
  var self = this;
  
  this.auth.loginCallback(options, function (err, user) {
    if (err) {
      console.log(err);
      callback(401);
    }
    if (user) {
      if (! self.useFileSystem) {
        User.findById(user, id, callback);
      } else {
        fs.readFile(path.join(self.folder, id + ".json"), function (err, data) {
          if (err) {
            console.log(err);
            callback(404);
          } else {
            var json = JSON.parse(data);
            callback(null, json);
          }
        }); //  fs.readFile
      
      }
    } //if (user)
  }); //auth.loginCallback
};


/*
 * find all users
 *
 * find user based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, users) users will be null if no user is found, otherwise a array of user object
 */
ResetController.prototype.findByIndex = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.findByIndexCallback(options, function(err, data) {
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
ResetController.prototype.updateByIdCallback = function (options, callback) {
  var self = this;
  var req = options.req;
  var id = req.params.id;

  this.auth.loginCallback(options, function (err, user) {
    if (err) {
      console.log(err);
      callback(401);
    }
    if (user) {

      if (typeof req.body !== 'undefined') {
      
          var update = req.body;

          if (! self.useFileSystem) {
            /* mongo */
            delete update._id; 
            if (update.password && (update.password == '')) {
              delete update.password;
            }
            User.updateById(user, id, update, callback);
            
          } else {

            self.findByIndexCallback(options, function (err, thisReset) {
              if (!(update.password && update.password != '')) {
                update.password = thisReset.password;
              }
              var filepath = self.folder;
              fileHelper.updateFile(id, filepath, update, callback);

            });
      
          } //if (! self.useFileSystem)
          
      } else { //if (typeof req.body !== 'undefined') {
        callback(500);
      } //if (strData !== '')

    } //if (user)
  }); //auth.loginCallback
};

ResetController.prototype.updateById = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.updateByIdCallback(options, function(err, data) {
		networkHelper.response(err, {data: data, res: res});
  });
};

ResetController.prototype.addCallback = function (options, callback) {
  var self = this;
  var req = options.req;
  
  this.auth.loginCallback(options, function (err, user) {
    if (err) {
      console.log(err);
      callback(401);
    }
    if (user) {
      if (typeof req.body !== 'undefined') {
          var update = req.body;

          if (! self.useFileSystem) {
            /* mongo */
            User.createRecord(user, update, callback);
            
          } else {

            var filepath = self.folder; 
            fileHelper.addRecord(self.idAttribute, filepath, update, callback);        
      
          } //if (! self.useFileSystem)
          
      } else { //if (typeof req.body !== 'undefined') {
        callback(500);
      } // if (typeof req.body !== 'undefined') {
    } //if (user)
  }); //auth.loginCallback
};

ResetController.prototype.add = function (req, res, options) {
	options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.addCallback(options, function(err, data) {
	networkHelper.response(err, {data: data, res: res});
  });
};



/*********************************************
 * functions
 *********************************************/
var controllerResponse = function (err, options) {
	options = options || {};
	var errCode = options.errCode || 500;
    if (err) {
      console.log(err);
      options.res.status(errCode).send(err);
    } else {
      options.res.status(200).send(options.data);
    }
};

/*********************************************
 * Export as a module
 *********************************************/
module.exports = ResetController;
