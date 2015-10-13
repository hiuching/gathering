/*********************************************
 * The Export controller
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
var fs = require('fs');
var modelHelper = require('../lib/modelHelper');
var networkHelper = require('../lib/networkHelper');
var path = require('path');
var nodeXlsx = require('node-xlsx');

/*********************************************
 * Include models
 *********************************************/
var Export = require('../models/export');



/*********************************************
 * Class Constructor
 * 
 * @param {Object} app_config     application config object
 * @param {Object} [options]        optional config object
 *
 * @return {Object} excelController     Class instance
 *********************************************/
var ExportController = function (app_config, options) {
  options = options || {};
  this.config = app_config;
  this.datapath = app_config.datapath;
  this.folder = options.folder ? path.join(this.datapath, options.folder) : this.datapath;
  this.idAttribute =  options.idAttribute  ? options.idAttribute : "_id";
  this.auth = options.auth;
  this.useFileSystem = false;

  
  
	/* begin of your test here */

	//modelHelper.loadSampleData( Export, { folder: 'Export', keys: ['name', 'content'] } );
	
  /* end of your test here */

};



/*********************************************
 * route functions
 *********************************************/
 
 
/*
 * find Export based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, excels) excels will be null if no Export is found, otherwise a array of Export object
 */
ExportController.prototype.findAllCallback = function (options, callback) {
	var self = this;
	var query = options.query;
	// options.user = options.req.session.user;
	options.user = options.req.user;
	
	Export.exportReport(options, callback);

};


ExportController.prototype.findAll = function (req, res, options) {
	options = options || {};
	this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
	options.query = req.query;
	options.req = req;
	
	this.findAllCallback(options, function (err, report) {
		if (err) {
			res.status(500).send(err);
		} else {
			res.setHeader('Content-type', report.contentType);
			res.setHeader("Content-Disposition", report.displayType + "; filename=" + report.filename);
			res.status(200).send(report.data);
		}
	});
};


/*
 * find a Export by unique Id and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, Export) Export will be null if no Export is found, otherwise a single Export object
 */
ExportController.prototype.findByIndexCallback = function (options, callback) {
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
        Export.findByIndex(user, id, callback);

    } //if (user)
  }); //auth.loginCallback
};


/*
 * find all excels
 *
 * find Export based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, excels) excels will be null if no Export is found, otherwise a array of Export object
 */
ExportController.prototype.findByIndex = function (req, res, options) {
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
 * find Export based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, excels) excels will be null if no Export is found, otherwise a array of Export object
 */
ExportController.prototype.updateByIdCallback = function (options, callback) {
  var self = this;
  var req = options.req;
  var id = req.params.id;
	options.user = options.req.user;

  this.auth.loginCallback(options, function (err, user) {
    if (err) {
      console.log(err);
      callback(401);
    }
    if (user) {

      var strData = '';
      if (typeof req.body !== 'undefined') {
        strData = JSON.stringify(req.body);
      }
      if (strData !== '') {

          /* mongo */
          var update = {};
          /* insert your update criteria with reference to strData */
          Export.updateById(user, id, update, callback);


      } else { //if (strData !== '')
        callback(500);
      } //if (strData !== '')

    } //if (user)
  }); //auth.loginCallback
};


ExportController.prototype.updateById = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.updateByIdCallback(options, function(err, data) {
		networkHelper.response(err, {data: data, res: res});
  });
};


ExportController.prototype.addCallback = function (options, callback) {
  var self = this;
  var req = options.req;
	options.user = options.req.user;
  
	if (typeof req.body !== 'undefined') {
		if (req.body.action && req.body.action == 'generatePDF') {
			Export.exportConfirmationList(req.body, callback)
		} else {
			Export.createRecord({}, req.body, callback);	
		}
	} else {
		callback(500);
	}
};


ExportController.prototype.add = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.addCallback(options, function(err, data) {
    if (err) {
      console.log(err);
	  res.status(500).send(err);
    } else {
      //res.send(200, data);
      var filename = req.query.filename || 'Report';
			res.setHeader('Content-Type', 'application/vnd.openxmlformats');
			res.setHeader("Content-Disposition", "attachment; filename=" + filename + ".xlsx");
			
			// for node.js node-xlsx plugin
			res.status(200).send(data);
    }
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
module.exports = ExportController;
