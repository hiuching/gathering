/*********************************************
 * The Controller
 *
 * author: Don Lee
 * created: 2015-08-23T15:36:00Z
 * created: 2015-08-23T15:36:00Z
 *
 *********************************************/
 
 
/*********************************************
 * Include modules
 *********************************************/

var fs = require('fs');
var path = require('path');


/*********************************************
 * Include models
 *********************************************/

var Config = require('../config/config');
var CONFIG = Config.getInstance();

/*********************************************
 * Class Constructor
 * 
 * @param {Object} app_config     application config object
 * @param {Object} [options]        optional config object
 *
 * @return {Object} FellowshipController     Class instance
 *********************************************/

var Controller = function (options) {
  this.options = options;
};

var PublicFileController = require('./publicFileController');



/*********************************************
 * route functions
 *********************************************/
 
Controller.prototype.add = function (req, res, options) {
  getControllerAdd(req, res, options);
};

Controller.prototype.findAll = function (req, res, options) {
	getControllerFindAll(req, res, options);
};

Controller.prototype.findByIndex = function (req, res, options) {
  getControllerFindByIndex(req, res, options);
};

Controller.prototype.update = function (req, res, options) {
  getControllerUpdate(req, res, options);
};

Controller.prototype.updateById = function (req, res, options) {
  getControllerUpdateById(req, res, options);
};

Controller.prototype.remove = function (req, res, options) {
  getControllerRemove(req, res, options);
};


/*********************************************
 * functions
 *********************************************/
 
function getControllerAdd(req, res, options) {
  getController(req, res, options, function (err, controller) {
	  if (err) {
			return405(res);
		} else {
		  controller.add(req, res, options);
		}
	});
};

function getControllerFindAll(req, res, options) {
  getController(req, res, options, function (err, controller) {
	  if (err) {
			return405(res);
		} else {
		  controller.findAll(req, res, options);
		}
	});
};

function getControllerFindByIndex(req, res, options) {
  getController(req, res, options, function (err, controller) {
	  if (err) {
			return405(res);
		} else {
		  controller.findByIndex(req, res, options);
		}
	});
};

function getControllerUpdate(req, res, options) {
  getController(req, res, options, function (err, controller) {
	  if (err) {
			return405(res);
		} else {
		  controller.update(req, res, options);
		}
	});
};

function getControllerUpdateById(req, res, options) {
  getController(req, res, options, function (err, controller) {
	  if (err) {
			return405(res);
		} else {
		  controller.updateById(req, res, options);
		}
	});
};

function getControllerRemove(req, res, options) {
  getController(req, res, options, function (err, controller) {
	  if (err) {
			return405(res);
		} else {
		  controller.remove(req, res, options);
		}
	});
};


function getController(req, res, options, callback) {
  var moduleName = req.params.moduleName;
	if (moduleName) {
		getControllerByModule(moduleName, callback);
	} else {
	  callback(405, 'method not allowed');
	}
};


function getControllerByModule (module, callback) {
	var filepath = path.join('controllers', module + 'Controller.js');
	fs.exists(filepath, function (exists) {
		if (exists) {
		  var controllerClass = require('./' + module + 'Controller');
			var controller = new controllerClass(CONFIG);
			callback(null, controller);
		} else {
		  var publicFileController = new PublicFileController(CONFIG, {folder: module});
			callback(null, publicFileController);
			//callback(405, 'method not allowed');
		}
	});
};

function return405 (res, data) {
  res.status(405).send('method not allowed');
}


/*********************************************
 * Export as a module
 *********************************************/

module.exports = Controller;
