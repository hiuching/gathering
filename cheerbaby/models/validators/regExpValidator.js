/*********************************************
 * The RegExpValidator handler
 *
 * author: Hillary Wong
 * created: 2014-12-17T15:16:00Z
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
*Class declaration
*********************************************/
var RegExpValidator =  function(options) {
	var options = options || {};
	this.base = Validator;
	this.base(options);
	this.regExp = options.regExp;
	this.key = options.key;
};

RegExpValidator.prototype =  new Validator;
/*********************************************
 * Custom instance Method
 *********************************************/
 
RegExpValidator.prototype.handleRequest = function (request, callback) {
var regExp = this.regExp;
var key = this.key;

	if (request[key]!=null && request[key]!="") {
		request[key] = request[key].toString();
		
		if (!request[key].match(regExp)) {
		  this.validatorException().addInvalidRecord(key, request[key]);
		}
	}
	
	this.next(request, callback);
};





/*********************************************
 * Helper functions
 *********************************************/

 
/*********************************************
 * Schema level indexes (compound index)
 * When creating an index, the number associated with a key specifies the direction of the index. The options are 1 (ascending) and -1 (descending)
 *********************************************/


/*********************************************
 * Virtual property getter (not persistent in DB)
 *********************************************/



/*********************************************
 * Virtual property setter
 *********************************************/

 



/*********************************************
 * Export as a module
 *********************************************/
module.exports = RegExpValidator;