/*********************************************
 * The Public File controller
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
 
 
/*********************************************
 * Include modules
 *********************************************/
var path = require('path');
var networkHelper = require('../lib/networkHelper');


/*********************************************
 * Include models
 *********************************************/

var PublicFile = require('../models/publicFile');


/*********************************************
 * Class Constructor
 * 
 * @param {Object} app_config     application config object
 * @param {Object} [options]        optional config object
 *
 * @return {Object} FellowshipController     Class instance
 *********************************************/

var PublicFileController = function (app_config, options) {
  this.datapath = app_config.datapath;
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.datapath;
  this.idAttribute = (options && options.idAttribute) ? options.idAttribute : "_id";
  this.auth = (options && options.auth) ? options.auth : {};
};




/*********************************************
 * route functions
 *********************************************/
 
 
PublicFileController.prototype.findAllCallback = function (options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  var self = this;
  var req = options.req;
  var query = req.query;

	
	PublicFile.findAll({folder: self.folder, query: query}, callback);
};

PublicFileController.prototype.findAll = function (req, res, options) {
  options = options || {};
  this.folder = (options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.findAllCallback(options, function(err, data) {
		networkHelper.response(err, {data: data, res: res});
  });
};

PublicFileController.prototype.findByIndexCallback = function (options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  var req = options.req;
  var id = req.params.id;
  var self = this;
	
	PublicFile.findByIndex({folder: self.folder, id: id}, callback);
};

PublicFileController.prototype.findByIndex = function (req, res, options) {
  options = options || {};
  this.folder = (options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.findByIndexCallback(options, function(err, data) {
		networkHelper.response(err, {data: data, res: res});
  });
};

PublicFileController.prototype.updateByIdCallback = function (options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  var req = options.req;
  var id = req.params.id;
  var self = this;

  this.auth.loginCallback(options, function (err, user) {
		if (err) {
			console.log(err);
			callback(401, err);
		}
		if (user) {
		  PublicFile.updateById({folder: self.folder, id: id, update: req.body}, callback);
		} //if (login)
  }); //auth.loginCallback
};


PublicFileController.prototype.updateById = function (req, res, options) {
  options = options || {};
  this.folder = (options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.updateByIdCallback(options, function(err, data) {
		networkHelper.response(err, {data: data, res: res});
  });
};




PublicFileController.prototype.addCallback = function (options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  var self = this;
  var req = options.req;
  
  this.auth.loginCallback(options, function (err, user) {
    if (err) {
      console.log(err);
      callback(401, err);
    }
    if (user) {
		  PublicFile.add({folder: self.folder, update: req.body, idAttribute: self.idAttribute, datapath: self.datapath}, callback);
    } //if (login)
  }); //auth.loginCallback
};


PublicFileController.prototype.add = function (req, res, options) {
  options = options || {};
  this.folder = (options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.addCallback(options, function(err, data) {
		networkHelper.response(err, {data: data, res: res});
  });
};



/*********************************************
 * functions
 *********************************************/





/*********************************************
 * Export as a module
 *********************************************/

module.exports = PublicFileController;
