/*********************************************
 * The Item Controller
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

var Item = require('../models/item');


 /*********************************************
 * Class Constructor
 * 
 * @param {Object} app_config     application config object
 * @param {Object} [options]        optional config object
 *
 * @return {Object} itemController     Class instance
 *********************************************/
var ItemController = function (app_config, options) {
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

	//modelHelper.loadSampleData( Item, { folder: 'user', keys: ['username'] } );
	
  /* end of your test here */


};




/*********************************************
 * route functions
 *********************************************/

/*
 * find all items
 *
 * find item based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, items) items will be null if no item is found, otherwise a array of item object
 */
ItemController.prototype.findAllCallback = function (options, callback) {
  var self = this;
  var req = options.req;
  var query = req.query;
  var headers = req.headers;
  //query.user = req.session.user;
	query.user = req.user;
	
	Item.findAll(query, callback);
};

ItemController.prototype.findAll = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  
  this.findAllCallback(options, function(err, data) {
		networkHelper.response(err, {data: data, res: res});
  });
};


/*
 * find a item by unique Id
 *
 * find item based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, item) item will be null if no item is found, otherwise a single item object
 */
ItemController.prototype.findByIndexCallback = function (options, callback) {
  var req = options.req;
  var id = req.params.id;
  var self = this;
  //options.user = req.session.user;
	options.user = req.user;
  
  this.auth.loginCallback(options, function (err, item) {
    if (err) {
      console.log(err);
      callback(401, err);
    }
    if (item) {
      if (! self.useFileSystem) {
        Item.findById(item, id, callback);
      } else {
        fs.readFile(path.join(self.folder, id + ".json"), function (err, data) {
          if (err) {
            console.log(err);
            callback(404, err);
          } else {
            var json = JSON.parse(data);
            callback(null, json);
          }
        }); //  fs.readFile
      
      }
    } //if (item)
  }); //auth.loginCallback
};


/*
 * find all items
 *
 * find item based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, items) items will be null if no item is found, otherwise a array of item object
 */
ItemController.prototype.findByIndex = function (req, res, options) {
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
 * find item based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, items) items will be null if no item is found, otherwise a array of item object
 */
ItemController.prototype.updateByIdCallback = function (options, callback) {
  var self = this;
  var req = options.req;
  var id = req.params.id;

  //this.auth.loginCallback(options, function (err, item) {
  //  if (err) {
  //    console.log(err);
  //    callback(401, err);
  //  }
  //  if (item) {

		if (typeof req.body !== 'undefined') {
      
			var update = req.body;
			//console.log("update", update);

			delete update._id;
			
			Item.updateById({conditions: {id: id}, update: update, user: req.user}, callback);
          
		} else { //if (typeof req.body !== 'undefined') {
			callback(500);
		} //if (strData !== '')

 //   } //if (item)
 // }); //auth.loginCallback
};

ItemController.prototype.updateById = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.updateByIdCallback(options, function(err, data) {
		networkHelper.response(err, {data: data, res: res});
  });
};

ItemController.prototype.addCallback = function (options, callback) {
  var self = this;
  var req = options.req;

	if (typeof req.body !== 'undefined') {
			var update = req.body;
			update.user = req.user;
			Item.create(update, callback);
			
	} else { //if (typeof req.body !== 'undefined') {
		callback(500);
	} // if (typeof req.body !== 'undefined') {
};

ItemController.prototype.add = function (req, res, options) {
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
 
/*********************************************
 * Export as a module
 *********************************************/
module.exports = ItemController;

