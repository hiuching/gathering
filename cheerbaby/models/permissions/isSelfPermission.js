/*********************************************
 * The IsSelfPermission handler
 *
 * author: Hillary Wong
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

/*********************************************
 * Include modules
 *********************************************/
var Permission = require('./permission');


/*********************************************
 * CONSTANT declaration
 *********************************************/

 
/*********************************************
* Class declaration
*********************************************/
var IsSelfPermission = function (options) {
	this.base = Permission;
	this.base(options);
};

IsSelfPermission.prototype = new Permission;
 
/*********************************************
 * Custom instance Method
 *********************************************/

IsSelfPermission.prototype.handleRequest = function (obj, callback) {
	var self = this;
	
	try {
		var loggedInUserId = obj.user._id;
		var currentUserId = obj.currentUserId;
		if (loggedInUserId.toString() == currentUserId.toString()) {
			self.handlerResult().setAllow();
		}
	} catch (err) {
		console.log("IsSelfPermission err", err);
	} finally {
		self.next(obj, callback);
	}
};


/*********************************************
 * Helper functions
 *********************************************/


/*********************************************
 * Export as a module
 *********************************************/
module.exports = IsSelfPermission;