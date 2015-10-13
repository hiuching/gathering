/*********************************************
 * The PhoneFormatter handler
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
// e.g. "primary:852--23456789,office:304-45-5823759,whatsapp:852--94838658"
var IMPORT_PHONE_FORMAT = /([A-Z0-9]+)\:([0-9]*)\-([0-9]*)\-([0-9]+)/gi;

/*********************************************
*Class declaration
*********************************************/
var PhoneFormatter =  function(options) {
  this.base = Formatter;
	this.base(options);
};

PhoneFormatter.prototype =  new Formatter;

/*********************************************
 * Custom instance Method
 *********************************************/
PhoneFormatter.prototype.handleRequest = function (request, callback) {
	var importPhones = [];
	if (request.phones && request.phones!="") {
		request.phones = request.phones.toString();
		var phones = request.phones.split(",");
		
		for (var i=0; i<phones.length; i++) {
			var matchedPhone = phones[i].match(IMPORT_PHONE_FORMAT);
			var importOptions = {};
			if (matchedPhone) {
				importOptions = {
					label: phones[i].split(":")[0],
					cCode: phones[i].split(":")[1].split("-")[0],
					aCode: phones[i].split(":")[1].split("-")[1],
					number: phones[i].split(":")[1].split("-")[2]
				};
			} else {
				importOptions = {
					label: i === 0 ? "primary" : "other",
					number: phones[i]
				};
			}
			importPhones.push(importOptions);
		}
		
	} else {
	
		if ( request.tel && request.tel!="" ) {
			importPhones.push({
				label: "personal",
				number: request.tel
			});
			delete request.tel;
		}
		if (request.mobile && request.mobile!="") {
			importPhones.push({
				label: "mobile",
				number: request.mobile
			});
			delete request.mobile;
		}
		
	}
	request.phones = importPhones;
	
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
module.exports = PhoneFormatter;