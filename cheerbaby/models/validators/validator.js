/*********************************************
 * The Validator Class
 *
 * author: Hillary Wong
 * created: 2014-12-17T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
var ValidatorException = require('./validatorException');

var Validator =  function (options) {
	options = options || {};
	this.lists = [];
}; 
 

/*********************************************
 * Custom Class Method (Static method)
 *********************************************/



/*********************************************
 * Custom instance Method
 *********************************************/

Validator.prototype.appendToChain = function(successor) {

	var len = this.lists.length;
	if (len > 0 ) {
		this.lists[len-1].setSuccessor(successor);
	}
	this.lists.push(successor);
};

Validator.prototype.validatorException = function() {
	return ValidatorException.getInstance(); // Singleton
};

Validator.prototype.handleRequest = function(request, callback) {
	if (this.lists.length > 0) {
		this.lists[0].handleRequest(request, callback);
	} else {
		callback('no handler', {});
	}
};

Validator.prototype.next = function(request, callback) {
	if (this.successor != null) {
		this.successor.handleRequest(request, callback);
	} else {
	  if (this.validatorException().isInvalid()) {
	    callback(this.validatorException().isInvalid(), this.validatorException().getInvalidRecord());
	  } else {
	    callback(null, this.validatorException().getInvalidRecord());
	  }
	}
};

Validator.prototype.setSuccessor = function(successor) { 
	this.successor = successor;
};




/*********************************************
 * Helper functions
 *********************************************/




/*********************************************
 * Export as a module
 *********************************************/
module.exports = Validator;