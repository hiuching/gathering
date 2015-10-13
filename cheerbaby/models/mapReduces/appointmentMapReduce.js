/*********************************************
 * The Appointment MapReduce
 *
 * author: Hillary Wong
 * created: 2014-12-17T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

/*********************************************
 * Include modules
 *********************************************/
var MapReduce = require('./mapReduce');

/*********************************************
 * CONSTANT declaration
 *********************************************/


/*********************************************
 * Class declaration
*********************************************/
var AppointmentMapReduce =  function(options) {
  options = options || {};
  this.base = MapReduce;
  this.base(options);
  this.query = options.query || {};
  this.conditioner = options.conditioner;
};

AppointmentMapReduce.prototype =  new MapReduce;

/*********************************************
 * Custom instance Method
 *********************************************/ 
 
AppointmentMapReduce.prototype.handleRequest = function (request, callback) {
	var self = this;
	var conditions = {};
	conditions.map = function () {
		var self = this;
		emit(this.time, 1);
	};
	conditions.reduce = function (key, values) {
		return Array.sum(values);
	};
	
	conditions.query = this.query || {};
	
	this.conditioner(conditions, function (err, duplicateAppointmentMapReduces) {
		if (err) {
			console.log("mapReduceAppointmentMapReduceErr", err);
			self.next(request, callback);
		} else {
			self.mapReduceResult().addResult('appointment', duplicateAppointmentMapReduces);
			self.next(request, callback);
		}

	});

};
/*********************************************
 * Helper functions
 *********************************************/

 


/*********************************************
 * Export as a module
 *********************************************/
module.exports = AppointmentMapReduce;