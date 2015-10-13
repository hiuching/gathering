/*********************************************
 * The DailySetting Controller
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

var DailySetting = require('../models/dailySetting');


 /*********************************************
 * Class Constructor
 * 
 * @param {Object} app_config     application config object
 * @param {Object} [options]        optional config object
 *
 * @return {Object} DailySettingController     Class instance
 *********************************************/
var DailySettingController = function (app_config, options) {
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

	//modelHelper.loadSampleData( DailySetting, { folder: 'user', keys: ['username'] } );
	
  /* end of your test here */


};




/*********************************************
 * route functions
 *********************************************/

/*
 * find all DailySettings
 *
 * find DailySetting based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, DailySettings) DailySettings will be null if no DailySetting is found, otherwise a array of DailySetting object
 */
DailySettingController.prototype.findAllCallback = function (options, callback) {
  var self = this;
  var req = options.req;
  var query = req.query;
  var headers = req.headers;
  //query.user = req.session.user;
	query.user = req.user;
	
	DailySetting.findAll(query, callback);
};

DailySettingController.prototype.findAll = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  
  this.findAllCallback(options, function(err, data) {
  	networkHelper.response(err, {data: data, res: res});
  });
};


/*
 * find a DailySetting by unique Id
 *
 * find DailySetting based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, DailySetting) DailySetting will be null if no DailySetting is found, otherwise a single DailySetting object
 */
DailySettingController.prototype.findByIndexCallback = function (options, callback) {
  var req = options.req;
  var id = req.params.id;
  var self = this;
  //query.user = req.session.user;
	query.user = req.user;
  
  this.auth.loginCallback(options, function (err, dailySetting) {
    if (err) {
      console.log(err);
      callback(401, err);
    }
    if (dailySetting) {
      if (! self.useFileSystem) {
        DailySetting.findById(dailySetting, id, callback);
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
    } //if (dailySetting)
  }); //auth.loginCallback
};


/*
 * find all dendors
 *
 * find dendor based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, dendors) dailySettings will be null if no dailySetting is found, otherwise a array of dailySetting object
 */
DailySettingController.prototype.findByIndex = function (req, res, options) {
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
 * find dailySetting based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, dailySettings) dailySettings will be null if no dailySettings is found, otherwise a array of dailySettings object
 */
DailySettingController.prototype.updateByIdCallback = function (options, callback) {
  var self = this;
  var req = options.req;
  var id = req.params.id;
  //query.user = req.session.user;
	var user = req.user;

		if (typeof req.body !== 'undefined') {
      
			var update = req.body
				delete update._id; 
				
				DailySetting.updateById({conditions: {id: id}, update: update, user: user}, callback);
			
		} else { //if (typeof req.body !== 'undefined') {
			callback({code :500, message : ""});
		} //if (strData !== '')

 //   } //if (dailySetting)
 // }); //auth.loginCallback
};

DailySettingController.prototype.updateById = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.updateByIdCallback(options, function(err, data) {
  	networkHelper.response(err, {data: data, res: res});
  });
};

DailySettingController.prototype.addCallback = function (options, callback) {
  var self = this;
  var req = options.req;

	if (typeof req.body !== 'undefined') {
			var update = req.body;
      //udpate.user = req.session.user;
      update.user = req.user;
			if (typeof update.action !== "undefined") {
					
				if (update.action == "periodSettings") {
					DailySetting.saveSettingsForPeriod(update, callback);
				} else {
					callback({code :401, message : "Not support this action"});
				}
				
			} else {
				DailySetting.create(update, callback);
			}
		
	} else { //if (typeof req.body !== 'undefined') {
		callback({code :500, message : ""});
	} // if (typeof req.body !== 'undefined') {
};

DailySettingController.prototype.add = function (req, res, options) {
	options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.addCallback(options, function(err, data) {
  	networkHelper.response(err, {data: data, res: res});
  });
};


DailySettingController.prototype.deleteCallback = function (options, callback) {
  var self = this;
  var req = options.req;

	if (typeof req.body !== 'undefined') {
		
		DailySetting.deleteDailySetting({user: req.user, id: req.params.id}, callback);
		
	} else { //if (typeof req.body !== 'undefined') {
		callback({code :500, message : ""});
	} // if (typeof req.body !== 'undefined') {
};

DailySettingController.prototype.remove = function (req, res, options) {
	options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.deleteCallback(options, function(err, data) {
  	networkHelper.response(err, {data: data, res: res});
  });
};



/*********************************************
 * functions
 *********************************************/
 
/*********************************************
 * Export as a module
 *********************************************/
module.exports = DailySettingController;

