/*********************************************
 * The Formatter Class
 *
 * author: Hillary Wong
 * created: 2014-12-17T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
var FormatterException = require('./formatterException');

var Formatter =  function (options) {
	options = options || {};
	this.lists = [];
}; 
 

/*********************************************
 * Custom Class Method (Static method)
 *********************************************/



/*********************************************
 * Custom instance Method
 *********************************************/

Formatter.prototype.appendToChain = function(successor) {

	var len = this.lists.length;
	if (len > 0 ) {
		this.lists[len-1].setSuccessor(successor);
	}
	this.lists.push(successor);
};

Formatter.prototype.formatterException = function() {
	return FormatterException.getInstance(); // Singleton
};

Formatter.prototype.handleRequest = function(request, callback) {
	if (this.lists.length > 0) {
		this.lists[0].handleRequest(request, callback);
	} else {
		callback('no handler', {});
	}
};

Formatter.prototype.next = function(request, callback) {
	if (this.successor != null) {
		this.successor.handleRequest(request, callback);
	} else {
	  callback(this.formatterException().isInvalid(), this.formatterException().getInvalidRecord() );
	}
};

Formatter.prototype.setSuccessor = function(successor) { 
	this.successor = successor;
};




/*********************************************
 * Helper functions
 *********************************************/




/*********************************************
 * Export as a module
 *********************************************/
module.exports = Formatter;