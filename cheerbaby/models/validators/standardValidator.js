/*********************************************
 * The StandardValidator handler
 *
 * author: Hillary Wong
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

/*********************************************
 * Include modules
 *********************************************/
 var Validator = require('./validator');


/*********************************************
 * CONSTANT declaration
 *********************************************/

 
/*********************************************
* Class declaration
*********************************************/
var StandardValidator =  function(options) {
    this.base = Validator;
	this.base(options);
	this.commonValidator = options.commonValidator;
	this.key = options.key;
};

StandardValidator.prototype =  new Validator;
 
/*********************************************
 * Custom instance Method
 *********************************************/

StandardValidator.prototype.handleRequest = function (request, callback) {
	var key = this.key;
	if (this.commonValidator(request) ){
		this.validatorException().addInvalidRecord(key, request[key]);
	} 
	this.next(request, callback);
};



/*********************************************
 * Helper functions
 *********************************************/



/*********************************************
 * Export as a module
 *********************************************/
module.exports = StandardValidator;