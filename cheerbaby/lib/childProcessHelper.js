/*
 * author: Don Lee
 * date: 2013-09-12T13:11:00Z
 *
 * Class: childProcessHelper
 */
 
var childProcess = require('child_process');
var Config = require('../config/config');
var CONFIG = Config.getInstance();
var mongoDBConnector = require('./mongoDBConnector');

var childProcessHelper = {};

/*
 * function: addChild
 * args: 
 * callback:
 *   (err, result)
 */
childProcessHelper.addChild = function (repositoryPath, methodName, options, callback) {
	var data = makeup(methodName, options);

	var child = childProcess.fork(repositoryPath);
	child.send(data);

	child.on('message', function (data) {
		callback(data.err, data.result, data.total);
		child.kill();
	});
};

childProcessHelper.processListener = function (_process, repository) {
	var self = this;
	_process.on('message', function (data) {
		mongoDBConnector.checkAndConnect(CONFIG.mongoDB);
		validateDataAndRepository(data, repository, function (err, methodName, options) {
			if (err) {
				_process.send({
					err : err
				});
			} else {
				repository[methodName](options, function (err, result, total) {
					_process.send({
						err : err,
						result : result,
						total : total
					});
				});
			}
		});
	});

	_process.on('exit', function (exitCode) {
		console.log("Exit with code:", exitCode);
	});
};


var makeup = function (methodName, options) {
  options = options || {};
	options.map = options.map ? options.map.toString() : "";
	options.reduce = options.reduce ? options.reduce.toString() : "";
  
  var data = {
		methodName : methodName,
		options : options
	};
  
  return data;
};


var validateDataAndRepository = function (data, repository, callback) {
	data = data || {};
	var methodName = data.methodName;
	var options = data.options;
  
  options.map = new Function('return ' + options.map)();
  options.reduce = new Function('return ' + options.reduce)();
	// console.log("options", options);
	//console.log('validateDataAndRepository', repository[methodName]);
	if (repository[methodName] && (typeof repository[methodName] === 'function')) {
		callback(null, methodName, options);
	} else {
		callback('method not exist');
	}
};

module.exports = childProcessHelper;
