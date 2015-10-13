/*********************************************
 * The Map Reduce Chain model
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

/*********************************************
 * Include modules
 *********************************************/
var objectHelper = require('../../lib/objectHelper');
var MapReduce = require('./mapReduce');
var AppointmentMapReduce = require('./appointmentMapReduce');
var InventoryMapReduce = require('./inventoryMapReduce');

/*********************************************
 * Main Schema
 * 
 * e.g. 
    {

    }
 *********************************************/

var MapReduceChain = function (options) {
	options = options || {};
	this.filterField = options.filterField || [];
	this.query = options.query || {};
	this.conditioner = options.conditioner;
	// constructor
};
   
/*********************************************
 * CONSTANT declaration
 *********************************************/

/*********************************************
 * Custom Class Method (Static method)
 *********************************************/
MapReduceChain.prototype.byAllConditions = function (callback){
	//console.log(FILTERFIELD[this.filterField[0]]);

	var mapReduce = new MapReduce();
  mapReduce.clear();
  mapReduce.appendToChain( new AppointmentMapReduce({query: this.query, conditioner: this.conditioner}) );

	mapReduce.handleRequest(this, function(err, duplicateResults){
		if (err) {
			callback(err);
		} else {
			// console.log("duplicateResults", duplicateResults);
			callback(null, duplicateResults);
		}
	});
};


MapReduceChain.prototype.mapReduceInventorybyItemId = function (callback){
	//console.log(FILTERFIELD[this.filterField[0]]);

	var mapReduce = new MapReduce();
  mapReduce.clear();
  mapReduce.appendToChain( new InventoryMapReduce({query: this.query, conditioner: this.conditioner}) );

	mapReduce.handleRequest(this, function(err, duplicateResults){
		if (err) {
			callback(err);
		} else {
			// console.log("duplicateResults", duplicateResults);
			callback(null, duplicateResults);
		}
	});
};
 
 


/*********************************************
 * Custom instance Method
 *********************************************/




/*********************************************
 * Private method
 *********************************************/





/*********************************************
 * Export as a module
 *********************************************/
module.exports = MapReduceChain;