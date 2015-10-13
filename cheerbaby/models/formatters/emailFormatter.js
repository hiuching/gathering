/*********************************************
 * The EmailFormatter handler
 *
 * author: Hillary Wong
 * created: 2014-12-17T15:16:00Z
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
var VALID_EMAIL_FORMAT = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}/gi;
// label:email
var IMPORT_EMAIL_FORMAT = /([A-Z]+)\:([A-Z0-9\s._@%+-]+)/gi;
// name:department-position

/*********************************************
*Class declaration
*********************************************/
var EmailFormatter =  function(options) {
  this.base = Formatter;
	this.base(options);
};

EmailFormatter.prototype =  new Formatter;

/*********************************************
 * Custom instance Method
 *********************************************/ 
 
EmailFormatter.prototype.handleRequest = function (request, callback) {
	var importEmails = [];
	if (request.emails && request.emails!='' && request.emails!=null) {
		request.emails = request.emails.toString();
		var emails = request.emails.split(",");
		for (var i=0; i<emails.length; i++) {
			var matchedEmails = emails[i].match(IMPORT_EMAIL_FORMAT);
			if (matchedEmails) {
				var email = matchedEmails[0].split(":")[1];
				if (email.match(VALID_EMAIL_FORMAT)) {
					importEmails.push({
					label: matchedEmails[0].split(":")[0],
					email: matchedEmails[0].split(":")[1]
					});
				}
			} else {
				if (emails[i].match(VALID_EMAIL_FORMAT)) {
					importEmails.push({
					label: i === 0 ? "primary" : "other",
					email: emails[i]
					});
				}
			}
		}
	}
	
	request.emails = importEmails;
	
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
module.exports = EmailFormatter;