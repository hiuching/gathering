/*********************************************
 * The EmailValidator handler
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
var VALID_EMAIL_FORMAT = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/gi;
// label:email
var IMPORT_EMAIL_FORMAT = /([A-Z]+)\:([A-Z0-9\s._@%+-]+)/gi;
// name:department-positionvar 

/*********************************************
*Class declaration
*********************************************/
var EmailValidator =  function(options) {
  this.base = Validator;
	this.base(options);
};

EmailValidator.prototype =  new Validator;
 
/*********************************************
 * Custom instance Method
 *********************************************/

EmailValidator.prototype.handleRequest = function (request, callback) {
	var invalidEmails = [];

	
	if ( request.emails && request.emails != '' && request.emails!=null ) {
		var emailString = request.emails.toString();
		var emails = emailString.split(",");
    
		for (var i=0; i < emails.length; i++) {
			var matchedEmails = emails[i].match(IMPORT_EMAIL_FORMAT);
			if (matchedEmails) {
				var email = matchedEmails[0].split(":")[1];
				if (!email.match(VALID_EMAIL_FORMAT)) {
					invalidEmails.push(email);
				}
			} else {
				if (!emails[i].match(VALID_EMAIL_FORMAT)) {
					invalidEmails.push(emails[i]);
				}
			}
		}
    
	} else {
		invalidEmails = ["No email"];
	}
  
  
		
	if (invalidEmails.length > 0) {
		this.validatorException().addInvalidRecord('emails', invalidEmails);
	}
	
	this.next(request, callback);
};




//EmailValidation.prototype.handleRequest = function (handler, obj, callback) {
//	var invalidEmails = [];
//// handler.invalid = true;
//
//
//  if (handler.invalid && handler.stopOnFirstHandlerException){
//		callback(handler.invalid, handler.invalidRecord);
//	} else {
//		if(this.successor != null){
//			this.successor.handleRequest(handler, obj, callback);
//		} else {
//			callback(handler.invalid, handler.invalidRecord);
//		}
//	}
//
//};




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
module.exports = EmailValidator;