/*********************************************
 * The Simple Controller
 *
 * author: Eric Sin
 * created: 2015-06-04T15:16:00Z
 * modified: 2015-06-04T15:16:00Z
 *
 *********************************************/
 
 
/*********************************************
 * Include modules
 *********************************************/
var arrayHelper = require('../lib/arrayHelper');
var encryption = require('../lib/encryption');
var fileHelper = require('../lib/fileHelper');
var modelHelper = require('../lib/modelHelper');
var networkHelper = require('../lib/networkHelper');
var objectHelper = require('../lib/objectHelper');
var path = require('path');


/*********************************************
 * Include models
 *********************************************/

var Simple = require('../models/simple');


 /*********************************************
 * Class Constructor
 * 
 * @param {Object} app_config     application config object
 * @param {Object} [options]        optional config object
 *
 * @return {Object} simpleController     Class instance
 *********************************************/
var SimpleController = function (app_config, options) {
  options = options || {};
  this.config = app_config;
  this.datapath = app_config.datapath;
  this.folder = options.folder ? path.join(this.datapath, options.folder) : this.datapath;

  this.authenticationEngine = app_config.authenticationEngine;
  this.apiKey = app_config.apiKey;
  this.apiSecret = app_config.apiSecret;

  this.auth = options.auth;
  this.userFolder = options.folder ? path.join(this.datapath, options.folder) : this.datapath;

	/* begin of your test here */

	//modelHelper.loadSampleData( Simple, { folder: 'user', keys: ['username'] } );
	
  /* end of your test here */
};




/*********************************************
 * route functions
 *********************************************/

/*
 * find all simples
 *
 * find simple based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, simples) simples will be null if no simple is found, otherwise a array of simple object
 */
SimpleController.prototype.findAllCallback = function (options, callback) {
  var self = this;
  var req = options.req;
  var query = req.query;
  var headers = req.headers;
	
	Simple.findAll(query, callback);
};

SimpleController.prototype.findAll = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  
  this.findAllCallback(options, function(err, data) {
		networkHelper.response(err, {
			data : data,
			res : res
		});
  });
};


/*
 * find a simple by unique Id
 *
 * find simple based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, simple) simple will be null if no simple is found, otherwise a single simple object
 */
SimpleController.prototype.findByIndexCallback = function (options, callback) {
  var req = options.req;
  var id = req.params.id;
  var self = this;
  
  Simple.findById({id: id}, callback);
};


/*
 * find all simples
 *
 * find simple based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, simples) simples will be null if no simple is found, otherwise a array of simple object
 */
SimpleController.prototype.findByIndex = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.findByIndexCallback(options, function(err, data) {
		networkHelper.response(err, {
			data : data,
			res : res
		});
  });
};


/*
 * updateByIdCallback
 *
 * find simple based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, simples) simples will be null if no simple is found, otherwise a array of simple object
 */
SimpleController.prototype.updateByIdCallback = function (options, callback) {
  var self = this;
  var req = options.req;
  var id = req.params.id;

		if (typeof req.body !== 'undefined') {
			var update = req.body;
			//console.log('update', update);

			delete update._id;
			var query = {
				conditions: {id: id},
				update: update
			};
			
			Simple.updateById(query, callback);

		} else { //if (typeof req.body !== 'undefined') {
			callback(500);
		} //if (strData !== '')


};

SimpleController.prototype.updateById = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.updateByIdCallback(options, function(err, data) {
		networkHelper.response(err, {
			data : data,
			res : res
		});
  });
};

SimpleController.prototype.addCallback = function (options, callback) {
  var self = this;
  var req = options.req;

	if (typeof req.body !== 'undefined') {
		
			var update = req.body;
			Simple.create(update, callback);
			
	} else { //if (typeof req.body !== 'undefined') {
		callback(500);
	} // if (typeof req.body !== 'undefined') {
};

SimpleController.prototype.add = function (req, res, options) {
	options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.addCallback(options, function(err, data) {
		networkHelper.response(err, {
			data : data,
			res : res
		});
  });
};



/*********************************************
 * functions
 *********************************************/
 
/*********************************************
 * Export as a module
 *********************************************/
module.exports = SimpleController;

