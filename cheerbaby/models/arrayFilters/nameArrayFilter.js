/*********************************************
 * The NameArrayFilter handler
 *
 * author: Hillary Wong
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

/*********************************************
 * Include modules
 *********************************************/
var ArrayFilter = require('./arrayFilter');


/*********************************************
 * CONSTANT declaration
 *********************************************/

 
/*********************************************
* Class declaration
*********************************************/
var NameArrayFilter =  function(options) {
  this.base = ArrayFilter;
	this.name = options.name || false;
	this.base(options);
};

NameArrayFilter.prototype =  new ArrayFilter;
 
/*********************************************
 * Custom instance Method
 *********************************************/

NameArrayFilter.prototype.handleRequest = function (array, callback) {
  var filtered = array;
  if (this.name) {
	  filtered = array.filter(filterByName, this.name);
  }
	
	this.next(filtered, callback);
};


/*********************************************
 * Helper functions
 *********************************************/

function filterByName (obj) {
  return obj.name == this;
}


/*********************************************
 * Export as a module
 *********************************************/
module.exports = NameArrayFilter;