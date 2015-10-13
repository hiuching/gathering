/*********************************************
 * The Inventory MapReduce
 *
 * author: Eric Sin
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
var quantity = 0;

/*********************************************
 * Class declaration
*********************************************/
var InventoryMapReduce =  function(options) {
  options = options || {};
  this.base = MapReduce;
  this.base(options);
  this.query = options.query || {};
  this.conditioner = options.conditioner;
};

InventoryMapReduce.prototype =  new MapReduce;

/*********************************************
 * Custom instance Method
 *********************************************/ 
 
InventoryMapReduce.prototype.handleRequest = function (request, callback) {
	var self = this;
	var conditions = {};
	conditions.map = function () {
		var self = this;
		emit(self.itemId, parseFloat(self.quantity));
	};
	conditions.reduce = function (key, values) {
		return Array.sum(values);
	};
	conditions.query = this.query;
	
	this.conditioner(conditions, function (err, duplicateInventoryMapReduces) {
		if (err) {
			console.log("mapReduceInventoryMapReduceErr", err);
			self.next(request, callback);
		} else {
			self.mapReduceResult().addResult('inventory', duplicateInventoryMapReduces);
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
module.exports = InventoryMapReduce;