/*********************************************
 * The AddressFormatter handler
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
// streetAddress-city-state-zip-country
var IMPORT_ADDRESS_FORMAT = /^([A-Z0-9\s]*)\-([A-Z0-9\s]*)\-([A-Z0-9\s]*)\-([A-Z0-9\s]*)\-([A-Z0-9\s]*)$/i;

/*********************************************
*Class declaration
*********************************************/
var AddressFormatter = function (options) {
	this.base = Formatter;
	this.base(options);
};

AddressFormatter.prototype = new Formatter;

/*********************************************
 * Custom instance Method
 *********************************************/
AddressFormatter.prototype.handleRequest = function (request, callback) {

	var importAddress = {};
	if (request.address && request.address!="") {
		request.address = request.address.toString();
		// var matchedAddress = IMPORT_ADDRESS_FORMAT.test(request.address);
			importAddress = {
				streetAddress: request.address,
				city: request.city || "",
				state: request.state || "",
				country: request.country || "",
				zip: request.zip || ""
			};
			delete request.country;
			delete request.city;
			delete request.state;
			delete request.zip;
		
	
	request.address = importAddress;
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
module.exports = AddressFormatter;