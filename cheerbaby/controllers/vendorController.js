/*********************************************
 * The Vendor Controller
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

var Vendor = require('../models/vendor');


 /*********************************************
 * Class Constructor
 * 
 * @param {Object} app_config     application config object
 * @param {Object} [options]        optional config object
 *
 * @return {Object} vendorController     Class instance
 *********************************************/
var VendorController = function (app_config, options) {
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
  


};




/*********************************************
 * route functions
 *********************************************/

/*
 * find all vendors
 *
 * find vendor based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, vendors) vendors will be null if no vendor is found, otherwise a array of vendor object
 */
VendorController.prototype.findAllCallback = function (options, callback) {
  var self = this;
  var req = options.req;
  var query = req.query;
  var headers = req.headers;
	//query.user = req.session.user;
  query.user = req.user;
  
	Vendor.findAll(query, callback);
};

VendorController.prototype.findAll = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  
  this.findAllCallback(options, function(err, data) {
  	networkHelper.response(err, {data: data, res: res});
  });
};


/*
 * find a vendor by unique Id
 *
 * find vendor based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, vendor) vendor will be null if no vendor is found, otherwise a single vendor object
 */
VendorController.prototype.findByIndexCallback = function (options, callback) {
  var req = options.req;
  var id = req.params.id;
  var self = this;
  
  this.auth.loginCallback(options, function (err, vendor) {
    if (err) {
      console.log(err);
      callback(401, err);
    }
    if (vendor) {
        Vendor.findById(vendor, id, callback);
    } //if (vendor)
  }); //auth.loginCallback
};


/*
 * find all vendors
 *
 * find vendor based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, vendors) vendors will be null if no vendor is found, otherwise a array of vendor object
 */
VendorController.prototype.findByIndex = function (req, res, options) {
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
 * find vendor based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, vendors) vendors will be null if no vendor is found, otherwise a array of vendor object
 */
VendorController.prototype.updateByIdCallback = function (options, callback) {
  var self = this;
  var req = options.req;
  var id = req.params.id;
  //query.user = req.session.user;
	var user = req.user;
	
	if (typeof req.body !== 'undefined') {
		var update = req.body;
		// console.log("update", update);
		delete update._id; 

		if (update.action == 'printLabel') {
			Vendor.printLabel({update: update, user: user}, callback);
		} else {
			Vendor.updateById({conditions: {id: id}, update: update, user: user}, callback);
		}
		
	} else { //if (typeof req.body !== 'undefined') {
		callback({code :500, message : ""});
	} //if (strData !== '')

};

VendorController.prototype.updateById = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.updateByIdCallback(options, function(err, data) {
  	networkHelper.response(err, {data: data, res: res});
  });
};

VendorController.prototype.addCallback = function (options, callback) {
  var self = this;
  var req = options.req;

	if (typeof req.body !== 'undefined') {
			var update = req.body;
      //update.user = req.session.user;
      update.user = req.user;
			if (! self.useFileSystem) {
				/* mongo */
				if (typeof update.action !== "undefined") {
						
					if (update.action == "importFiles") {
						console.log('update.name',update.name);
						update.fullFilename = update.name;
						var uploadFiles = [update];
						fileHelper.saveBase64File(self.folder, uploadFiles, {}, callback);
						
					} else {
						callback({code :401, message : "Not support this action"});
					}
					
				} else {
					Vendor.create(update, callback);
					
				}
			} else {
				var filepath = self.folder; 
				fileHelper.addRecord(self.idAttribute, filepath, update, callback);        
	
			} //if (! self.useFileSystem)
			
	} else { //if (typeof req.body !== 'undefined') {
		callback({code :500, message : ""});
	} // if (typeof req.body !== 'undefined') {
};

VendorController.prototype.add = function (req, res, options) {
	options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.addCallback(options, function(err, data) {
    console.log('add callback');
  	networkHelper.response(err, {data: data, res: res});
  });
};



/*********************************************
 * functions
 *********************************************/
 
/*********************************************
 * Export as a module
 *********************************************/
module.exports = VendorController;

