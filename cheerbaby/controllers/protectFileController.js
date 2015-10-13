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
var fs = require('fs');
var fileHelper = require('../lib/fileHelper');
var networkHelper = require('../lib/networkHelper');



/*********************************************
 * Include models
 *********************************************/



/*********************************************
 * Class Constructor
 * 
 * @param {Object} app_config     application config object
 * @param {Object} [options]        optional config object
 *
 * @return {Object} FellowshipController     Class instance
 *********************************************/

var ProtectFileController = function (app_config, options) {
  this.datapath = app_config.datapath;
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.datapath;
  this.idAttribute = (options && options.idAttribute) ? options.idAttribute : "_id";
  this.auth = (options && options.auth) ? options.auth : {};
};



/*********************************************
 * route functions
 *********************************************/

ProtectFileController.prototype.findAllCallback = function (options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  var self = this;
  var req = options.req;
  var query = req.query;
  
  this.auth.loginCallback(options, function (err, login) {
    if (err) {
      console.log(err);
      callback(401, err);
    }
    if (login) {
        fileHelper.loadDir(self.folder, query, function (err, result) {
          if (err) {
            console.log(err);
            callback(404, err);
          } else {
            callback(null, result);
          }
        });
        
    } //if (login)
  }); //auth.loginCallback
};

ProtectFileController.prototype.findAll = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.findAllCallback(options, function(err, data) {
		networkHelper.response(err, {data: data, res: res});
  });
};

ProtectFileController.prototype.findByIndexCallback = function (options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  var req = options.req;
  var id = req.params.id;
  var self = this;
  
  this.auth.loginCallback(options, function (err, login) {
    if (err) {
      console.log(err);
      callback(401, err);
    }
    if (login) {
      fs.readFile(path.join(self.folder, id + ".json"), function (err, data) {
        if (err) {
          console.log(err);
          callback(404, err);
        } else {
          var json = JSON.parse(data);
          callback(null, json);
        }
      }); //  fs.readFile
    } //if (login)
  }); //auth.loginCallback
};

ProtectFileController.prototype.findByIndex = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.findByIndexCallback(options, function(err, data) {
		networkHelper.response(err, {data: data, res: res});
  });
};

ProtectFileController.prototype.updateByIdCallback = function (options, callback) {
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
      if (typeof req.body !== 'undefined') {
        var update = req.body;
        var filepath = self.folder;
        fileHelper.updateFile(id, filepath, update, callback);
      } else {
        callback(500);
      }
    } //if (login)
  }); //auth.loginCallback
};


ProtectFileController.prototype.updateById = function (req, res, options) {
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.updateByIdCallback(req, res, options, function(err, data) {
		networkHelper.response(err, {data: data, res: res});
  });
};


ProtectFileController.prototype.addCallback = function (options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  var req = options.req;
  var self = this;
  
  this.auth.loginCallback(options, function (err, user) {
    if (err) {
      console.log(err);
      callback(401, err);
    }
    if (user) {
      var strData = '';
      if (typeof req.body !== 'undefined') {
        var update = req.body;    
        var filepath = self.folder;  
        fileHelper.addRecord(self.idAttribute, filepath, update, callback); 
      } else {
        callback(500);
      }
    } //if (login)
  }); //auth.loginCallback
};


ProtectFileController.prototype.add = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.addCallback(req, res, options, function(err, data) {
		networkHelper.response(err, {data: data, res: res});
  });
};



/*********************************************
 * functions
 *********************************************/



/*********************************************
 * Export as a module
 *********************************************/

module.exports = ProtectFileController;
