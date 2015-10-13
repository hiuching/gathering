/*********************************************
 * The DateArrayFilter handler
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
var DateArrayFilter =  function(options) {
  this.base = ArrayFilter;
	this.arrayFilter = options.arrayFilter;
	this.base(options);
};

DateArrayFilter.prototype =  new ArrayFilter;
 
/*********************************************
 * Custom instance Method
 *********************************************/

DateArrayFilter.prototype.handleRequest = function (array, callback) {
	  var filtered = array.filter(this.arrayFilter);
	
	this.next(filtered, callback);
};


/*********************************************
 * Helper functions
 *********************************************/



/*********************************************
 * Export as a module
 *********************************************/
module.exports = DateArrayFilter;