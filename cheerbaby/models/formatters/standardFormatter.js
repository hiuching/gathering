/*********************************************
 * The StandardFormatter handler
 *
 * author: Hillary Wong
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

/*********************************************
 * Include modules
 *********************************************/
 var Formatter = require('./formatter');


/*********************************************
 * CONSTANT declaration
 *********************************************/

 
/*********************************************
* Class declaration
*********************************************/
var StandardFormatter =  function(options) {
    this.base = Formatter;
	this.base(options);
	this.commonFormatter = options.commonFormatter;
};

StandardFormatter.prototype =  new Formatter;
 
/*********************************************
 * Custom instance Method
 *********************************************/

StandardFormatter.prototype.handleRequest = function (request, callback) {
	var FormattedRequest = this.commonFormatter(request);
	
	this.next(FormattedRequest, callback);	
	
};




/*********************************************
 * Helper functions
 *********************************************/



/*********************************************
 * Export as a module
 *********************************************/
module.exports = StandardFormatter;