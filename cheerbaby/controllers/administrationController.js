/*********************************************
 * The Administration controller
 *
 * author: Billy HO
 * date: 2013-09-23T11:30:00Z
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-11-28T19:16:00Z
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
var objectHelper = require('../lib/objectHelper');
var path = require('path');
var nodeXlsx = require('node-xlsx');

/*********************************************
 * Include models
 *********************************************/

var User = require('../models/user');

/*********************************************
 * Class Constructor
 * 
 * @param {Object} app_config            application config object
 * @param {Object} [options]             optional config object
 *
 * @return {Object} verificationController   Class instance
 
 *********************************************/
 
 
var AdministrationController = function (app_config, options) {
  this.config = app_config;
  this.datapath = app_config.datapath;
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.datapath;
  this.idAttribute = (options && options.idAttribute) ? options.idAttribute : "_id";
  this.auth = (options && options.auth) ? options.auth : {};
  this.useFileSystem = false;

  
	/* begin of your test here */

  //modelHelper.loadSampleData( Administration, { folder: 'verification', keys: ['content'] } );
  
  /* end of your test here */
  
};

/*********************************************
 * route functions
 *********************************************/

 
/*
 * find all verifications
 * 
 * find verification based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, verifications) verifications will be null if no student is found, otherwise a array of student object
 */
AdministrationController.prototype.findAllCallback = function (options, callback) {
  var self = this;
  var req = options.req;
  var query = req.query;
  var headers = req.headers;  
  /* query = {arg1: "value1", arg2: "value2"} */
  if (query.action =='resetPassword' && query.password =="ab1234cd" && query.username =="tony.lo@questwork.com" ) {
      Teacher.find({
      _type: 'Teacher',
      username: query.username,
      password: query.password
    }, function (err, teachers) {
      arrayHelper.walkArray(teachers, {}, resetPasswordByUsernameAndEmail, callback);
    });
	
  } else  {
    callback(404, 'no action');
  }

};


AdministrationController.prototype.findAll = function (req, res, options) {
	options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.findAllCallback(options, function(err, data) {
  	networkHelper.response(err, {data: data, res: res});
  });
};


/*
 * find verification based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, verification) verification will be null if no verification is found, otherwise a single verification object
 */
AdministrationController.prototype.findByIndexCallback = function (options, callback) {
  var req = options.req;
  var id = req.params.id;
  var self = this;
  
  this.auth.loginCallback(options, function (err, user) {
    if (err) {
      console.log(err);
      callback(401, err);
    }
    if (user) {
      Administration.findByIndex(user, query, callback);
    } //if (user)
  }); //auth.loginCallback

};


AdministrationController.prototype.findByIndex = function (req, res, options) {
	options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.findByIndexCallback(options, function(err, data) {
  	networkHelper.response(err, {data: data, res: res});
  });
};


/*
 * updateByIdCallBack
 * 
 * find verification based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, students) students will be null if no verification is found, otherwise a array of verification object
 */
AdministrationController.prototype.updateByIdCallback = function (options, callback) {
  var req = options.req;
  var id = req.params.id;
  var self = this;
  
  this.auth.loginCallback(options, function (err, user) {
    if (err) {
      console.log(err);
      callback(401, err);
    }
    if (user) {
      if (req.body) {
        var update = req.body;
        delete update._id;
        Administration.findByIdAndUpdate(id, update, callback);
      } else {
        callback(500);
      }
    } //if (user)
    
  }); /* auth.loginCallback */
};


AdministrationController.prototype.updateById = function (req, res, options) {
	options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.updateByIdCallback(options, function(err, data) {
  	networkHelper.response(err, {data: data, res: res});
  });
};

AdministrationController.prototype.addCallback = function (options, callback) {
  var self = this;
	var req = options.req;

      if (typeof req.body !== 'undefined') {
        var uploadFile = req.body;
        uploadFile.fullFilename = uploadFile.name;

        var uploadFiles = [uploadFile];
        fileHelper.saveBase64File(self.folder, uploadFiles, {}, function (err, data){
          if (err) {
            console.log(err);
            callback(500, err);
            
          } else {
            var opt = {
              filename: path.join('import', uploadFile.name)
            };
            self.readExcel(opt, function (err, array, totalNoOfRecords) {
              if (err) {
                console.log(err);
                callback(500, err);
                
              } else {
                if (array.length > 0) {
				  User.importFromArray(array, totalNoOfRecords, callback);
                } else {
                  callback(500, 'Empty Excel file');
                }
              }
            });
          }
				});        
      } else {
        callback(500, 'empty upload');
      }
};


AdministrationController.prototype.add = function (req, res, options) {
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
 
AdministrationController.prototype.readExcel = function (options, callback) {
	var self = this;
	var workbook = nodeXlsx.parse(path.join(this.folder, options.filename));
	var worksheet = workbook[0];
	var rows = worksheet.data;
	var headers = rows.shift();
	var totalNoOfRecords = 0;
	// console.log(headers);
  
	var new_array = [];
	var counter = rows.length;

	rows.forEach(function (row, rowIndex) {
		var data = {};
		// if (rowIndex < 3) {
			// console.log('rowIndex', rowIndex);
			// console.log('row', row);
		// }
		row.forEach(function (cell, cellIndex) {
			data[headers[cellIndex]] = cell;
			new_array[rowIndex] = data;
		});
		
		totalNoOfRecords++;
		
		counter--;
		if (counter === 0) {
			// console.log("new_array", new_array);
			callback(null, new_array, totalNoOfRecords);
		}
	});

};

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

module.exports = AdministrationController;
