/*********************************************
 * Log Helper
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

/*
 * require manually add a folder "/public_html/logs" to store the access.log
 * /

/*********************************************
 * Include modules
 *********************************************/

var log4js = require('log4js');
var logger = log4js.getLogger();



/*********************************************
 * Main
 *********************************************/


var logHelper =  {
};


logHelper.configure = function (options) {
	var defaultOptions = {
		appenders: [
			{ type: 'console' },
			{
				type: 'file', 
				filename: 'logs/access.log', 
				maxLogSize: 81920,
				backups:4
			}
		],
		replaceConsole: true
	};
	options = options || defaultOptions;
	log4js.configure(options);
};

logHelper.connectLogger = function (configs, options) {
  this.configure(configs);
	options = options || {level: 'auto', format:':method :url :status'};
	return log4js.connectLogger(logger, options);
};

logHelper.getLogger = function () {
	return logger;
};





/*********************************************
 * Export as a module
 *********************************************/
module.exports = logHelper;


