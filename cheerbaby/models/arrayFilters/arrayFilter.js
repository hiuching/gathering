/*********************************************
 * The ArrayFilter Class
 *
 * author: Hillary Wong
 * created: 2014-12-17T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
var ArrayFilterException = require('./arrayFilterException');


/*********************************************
* Class declaration
*********************************************/

var ArrayFilter =  function (options) {
	options = options || {};
	this.lists = [];
}; 
 

/*********************************************
 * Custom Class Method (Static method)
 *********************************************/



/*********************************************
 * Custom instance Method
 *********************************************/

ArrayFilter.prototype.appendToChain = function(successor) {

	var len = this.lists.length;
	if (len > 0 ) {
		this.lists[len-1].setSuccessor(successor);
	}
	this.lists.push(successor);
};

ArrayFilter.prototype.handlerException = function() {
	return ArrayFilterException.getInstance(); // Singleton
};

ArrayFilter.prototype.handleRequest = function(array, callback) {
	if (this.lists.length > 0) {
		this.lists[0].handleRequest(array, callback);
	} else {
		callback('no handler', array);
	}
};

ArrayFilter.prototype.next = function(array, callback) {
	if (this.successor != null) {
		this.successor.handleRequest(array, callback);
	} else {
	  if (this.handlerException().isInvalid()) {
			callback(this.handlerException().getInvalidRecord(), array );
		} else {
		  callback(null, array );
		}
	}
};

ArrayFilter.prototype.setSuccessor = function(successor) { 
	this.successor = successor;
};




/*********************************************
 * Helper functions
 *********************************************/




/*********************************************
 * Export as a module
 *********************************************/
module.exports = ArrayFilter;