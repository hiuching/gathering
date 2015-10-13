/*********************************************
 * The VendorCategory Controller
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

var VendorCategory = require('../models/vendorCategory');


 /*********************************************
 * Class Constructor
 * 
 * @param {Object} app_config     application config object
 * @param {Object} [options]        optional config object
 *
 * @return {Object} vendorCategoryController     Class instance
 *********************************************/
var VendorCategoryController = function (app_config, options) {
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

	//modelHelper.loadSampleData( VendorCategory, { folder: 'user', keys: ['username'] } );
	
  /* end of your test here */


};




/*********************************************
 * route functions
 *********************************************/

/*
 * find all vendorCategorys
 *
 * find vendorCategory based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, vendorCategorys) vendorCategorys will be null if no vendorCategory is found, otherwise a array of vendorCategory object
 */
VendorCategoryController.prototype.findAllCallback = function (options, callback) {
  var self = this;
  var req = options.req;
  var query = req.query;
  var headers = req.headers;
	
	VendorCategory.findAll(query, callback);
};

VendorCategoryController.prototype.findAll = function (req, res, options) {
  options = options || {};
	this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  
  this.findAllCallback(options, function(err, data) {
  	networkHelper.response(err, {data: data, res: res});
  });
};


/*
 * find a vendorCategory by unique Id
 *
 * find vendorCategory based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, vendorCategory) vendorCategory will be null if no vendorCategory is found, otherwise a single vendorCategory object
 */
VendorCategoryController.prototype.findByIndexCallback = function (options, callback) {
  var req = options.req;
  var id = req.params.id;
  var self = this;
  
  this.auth.loginCallback(options, function (err, vendorCategory) {
    if (err) {
      console.log(err);
	  callback({code :401, message : "login fail"});
    }
    if (vendorCategory) {
      if (! self.useFileSystem) {
        VendorCategory.findById(vendorCategory, id, callback);
      } else {
        fs.readFile(path.join(self.folder, id + ".json"), function (err, data) {
          if (err) {
            console.log(err);
			callback({code :404, message : "read file fail"});
          } else {
            var json = JSON.parse(data);
            callback(null, json);
          }
        }); //  fs.readFile
      
      }
    } //if (vendorCategory)
  }); //auth.loginCallback
};


/*
 * find all vendorCategorys
 *
 * find vendorCategory based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, vendorCategorys) vendorCategorys will be null if no vendorCategory is found, otherwise a array of vendorCategory object
 */
VendorCategoryController.prototype.findByIndex = function (req, res, options) {
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
 * find vendorCategory based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, vendorCategorys) vendorCategorys will be null if no vendorCategory is found, otherwise a array of vendorCategory object
 */
VendorCategoryController.prototype.updateByIdCallback = function (options, callback) {
  var self = this;
  var req = options.req;
  var id = req.params.id;

  //this.auth.loginCallback(options, function (err, vendorCategory) {
  //  if (err) {
  //    console.log(err);
  //    callback(401, err);
  //  }
  //  if (vendorCategory) {

		if (typeof req.body !== 'undefined') {
      
			var update = req.body;
			console.log("update", update);
			/* mongo */
			console.log('id', id);
			delete update._id; 
			if (update.password && (update.password == '')) {
				delete update.password;
			}
			
			var data = {
				conditions: {id: id},
				update: update
			};
			
			VendorCategory.updateById(data, callback);
          
		} else { //if (typeof req.body !== 'undefined') {
		callback({code :500, message : "update fail"});
		} //if (strData !== '')

 //   } //if (vendorCategory)
 // }); //auth.loginCallback
};

VendorCategoryController.prototype.updateById = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.updateByIdCallback(options, function(err, data) {
  	networkHelper.response(err, {data: data, res: res});
  });
};

VendorCategoryController.prototype.addCallback = function (options, callback) {
  var self = this;
  var req = options.req;

	if (typeof req.body !== 'undefined') {
			var update = req.body;
			if (! self.useFileSystem) {
				/* mongo */
				VendorCategory.create(update, callback);
			} else {
				var filepath = self.folder; 
				fileHelper.addRecord(self.idAttribute, filepath, update, callback);        
	
			} //if (! self.useFileSystem)
			
	} else { //if (typeof req.body !== 'undefined') {
	callback({code :500, message : "upload fail"});
	} // if (typeof req.body !== 'undefined') {
};

VendorCategoryController.prototype.add = function (req, res, options) {
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
module.exports = VendorCategoryController;

