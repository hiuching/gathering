/*********************************************
 * The Appointment Controller
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

var Appointment = require('../models/appointment');


 /*********************************************
 * Class Constructor
 * 
 * @param {Object} app_config     application config object
 * @param {Object} [options]        optional config object
 *
 * @return {Object} appointmentController     Class instance
 *********************************************/
var AppointmentController = function (app_config, options) {
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

	//modelHelper.loadSampleData( Appointment, { folder: 'user', keys: ['username'] } );
	
  /* end of your test here */


};




/*********************************************
 * route functions
 *********************************************/

/*
 * find all appointments
 *
 * find appointment based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, appointments) appointments will be null if no appointment is found, otherwise a array of appointment object
 */
AppointmentController.prototype.findAllCallback = function (options, callback) {
  var self = this;
  var req = options.req;
  var query = req.query;
  var headers = req.headers;
  //query.user = req.session.user;
	query.user = req.user;
	
	Appointment.findAll(query, callback);
};

AppointmentController.prototype.findAll = function (req, res, options) {
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
 * find a appointment by unique Id
 *
 * find appointment based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, appointment) appointment will be null if no appointment is found, otherwise a single appointment object
 */
AppointmentController.prototype.findByIndexCallback = function (options, callback) {
  var req = options.req;
  var id = req.params.id;
  var self = this;
  //query.user = req.session.user;
	query.user = req.user;
  
  this.auth.loginCallback(options, function (err, appointment) {
    if (err) {
      console.log(err);
      callback(401, err);
    }
    if (appointment) {
      if (! self.useFileSystem) {
        Appointment.findById(appointment, id, callback);
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
    } //if (appointment)
  }); //auth.loginCallback
};


/*
 * find all appointments
 *
 * find appointment based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, appointments) appointments will be null if no appointment is found, otherwise a array of appointment object
 */
AppointmentController.prototype.findByIndex = function (req, res, options) {
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
 * find appointment based on the criteria in options object and then a callback is called
 * 
 * @param {Object} options       options include search criteria
 * @param {Function} callback    Callback(err, appointments) appointments will be null if no appointment is found, otherwise a array of appointment object
 */
AppointmentController.prototype.updateByIdCallback = function (options, callback) {
  var self = this;
  var req = options.req;
  var id = req.params.id;
  //query.user = req.session.user;
	var user = req.user;

		if (typeof req.body !== 'undefined') {
      
			var update = req.body;
			// console.log("update", update);

			delete update._id;
      
			if (update.action == 'confirmAppointment') {
				Appointment.confirmAppointment({conditions: {id: id}, update: update, user: user}, callback);
			} else if (update.action == 'changeAppointment') {
				Appointment.changeAppointment({conditions: {id: id}, update: update, user: user}, callback);
			} else if (update.action == 'cancelAppointment') {
				Appointment.cancelAppointment({conditions: {id: id}, update: update, user: user}, callback);
			} else {
				Appointment.updateAppointment({conditions: {id: id}, update: update, user: user}, callback);
			}
          
		} else { //if (typeof req.body !== 'undefined') {
			callback(500);
		} //if (strData !== '')


};

AppointmentController.prototype.updateById = function (req, res, options) {
  options = options || {};
  this.folder = (options && options.folder) ? path.join(this.datapath, options.folder) : this.folder;
  options.req = req;
  this.updateByIdCallback(options, function(err, data) {
		networkHelper.response(err, {data: data, res: res});
  });
};

AppointmentController.prototype.addCallback = function (options, callback) {
  var self = this;
  var req = options.req;
  //query.user = req.session.user;
	// query.user = req.user;

	if (typeof req.body !== 'undefined') {
			var update = req.body;
			Appointment.create(update, callback);
	} else { //if (typeof req.body !== 'undefined') {
		callback(500);
	} // if (typeof req.body !== 'undefined') {
};

AppointmentController.prototype.add = function (req, res, options) {
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
module.exports = AppointmentController;

