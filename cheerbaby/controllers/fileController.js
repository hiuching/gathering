/*********************************************
 * The File controller
 *
 * author: Eric Sin
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/


/*********************************************
 * Include modules
 *********************************************/
var arrayHelper = require('../lib/arrayHelper');
var fileHelper = require('../lib/fileHelper');
var amazonHelper = require('../lib/amazonHelper');
var fs = require('fs');
var modelHelper = require('../lib/modelHelper');
var networkHelper = require('../lib/networkHelper');
var path = require('path');

/*********************************************
 * Include models
 *********************************************/
var File = require('../models/file');



/*********************************************
 * Class Constructor
 *
 * @param {Object} app_config     application config object
 * @param {Object} [options]        optional config object
 *
 * @return {Object} excelController     Class instance
 *********************************************/
var FileController = function (app_config, options) {
  options = options || {};
  this.config = app_config;
  this.datapath = app_config.datapath;
  this.folder = options.folder ? path.join(this.datapath, options.folder) : this.datapath;
  this.idAttribute =  options.idAttribute  ? options.idAttribute : "_id";
  this.auth = options.auth;
  this.useFileSystem = false;
	this.saveToAmazon = true;
	this.deleteFromAmazon = true;



	/* begin of your test here */

	//modelHelper.loadSampleData( File, { folder: 'File', keys: ['name', 'content'] } );

  /* end of your test here */

};



/*********************************************
 * route functions
 *********************************************/


/*
 * find File based on the criteria in options object and then a callback is called
 *
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, excels) excels will be null if no File is found, otherwise a array of File object
 */
FileController.prototype.findAllCallback = function (options, callback) {
	var self = this;
	var query = options.query;
	// options.user = options.req.session.user;
	options.user = options.req.user;

	File.findFiles(options, callback);
};


FileController.prototype.findAll = function (req, res, options) {
	options = options || {};
	this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
	options.query = req.query;
	options.req = req;

	this.findAllCallback(options, function (err, file) {
		if (err) {
			networkHelper.response(err, {
				data : file,
				res : res
			});
		} else {
			if (file.contentType) {
				res.setHeader('Content-type', file.contentType);
				res.setHeader("Content-Disposition", file.displayType + "; filename=" + file.filename);
				res.status(200).send(file.data);
			} else {
				networkHelper.response(err, {
					data : file,
					res : res
				});
			}
		}
	});
};


/*
 * find a File by unique Id and then a callback is called
 *
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, File) File will be null if no File is found, otherwise a single File object
 */
FileController.prototype.findByIndexCallback = function (options, callback) {
  var req = options.req;
  var id = req.params.id;
  var self = this;
  //options.user = req.session.user;
	options.user = req.user;

  this.auth.loginCallback(options, function (err, user) {
    if (err) {
      console.log(err);
      callback(401);
    }
    if (user) {
        /* mongo */
        File.findByIndex(user, id, callback);

    } //if (user)
  }); //auth.loginCallback
};


/*
 * find all excels
 *
 * find File based on the criteria in options object and then a callback is called
 *
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, excels) excels will be null if no File is found, otherwise a array of File object
 */
FileController.prototype.findByIndex = function (req, res, options) {
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
 * find File based on the criteria in options object and then a callback is called
 *
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, excels) excels will be null if no File is found, otherwise a array of File object
 */
FileController.prototype.updateByIdCallback = function (options, callback) {
  var self = this;
  var req = options.req;
  var id = req.params.id;
	options.user = options.req.user;

	if (typeof req.body !== 'undefined') {
		var update = req.body;

		update.fullFilename = update.name;
		var uploadFiles = [update];
		fileHelper.saveBase64File(self.folder, uploadFiles, {}, callback);
	} else {
		callback(500);
	}
};


FileController.prototype.updateById = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.updateByIdCallback(options, function(err, data) {
		networkHelper.response(err, {data: data, res: res});
  });
};


FileController.prototype.addCallback = function (options, callback) {
  var self = this;
  var req = options.req;
	options.user = options.req.user;

	if (typeof req.body !== 'undefined') {
		var update = req.body;

		update.fullFilename = update.name;
		var uploadFiles = [update];
		fileHelper.saveBase64File(self.folder, uploadFiles, {saveToAmazon: this.saveToAmazon}, callback);
	} else {
		callback(500);
	}
};


FileController.prototype.add = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.addCallback(options, function(err, data) {
		networkHelper.response(err, {data: data, res: res});
  });
};


FileController.prototype.deleteCallback = function (options, callback) {
  var self = this;
  var req = options.req;
	options.user = options.req.user;
	var model = req.body;

	if (typeof req.body !== 'undefined') {
		model.deleteFromAmazon = this.deleteFromAmazon;
    File.removeFile(model, callback);

	} else {
		callback(500);
	}
};


FileController.prototype.remove = function (req, res, options) {
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
 * File as a module
 *********************************************/
module.exports = FileController;
