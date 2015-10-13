/*********************************************
 * The IsAdminPermission handler
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
var IsAdminPermission = function (options) {
	this.base = Permission;
	this.base(options);
};

IsAdminPermission.prototype = new Permission;
 
/*********************************************
 * Custom instance Method
 *********************************************/

IsAdminPermission.prototype.handleRequest = function (obj, callback) {
	var self = this;
	try {
		var adminRoles = obj.user.adminRoles || [];
		if (adminRoles.indexOf("admin") > -1) {
			self.handlerResult().setAllow();
			self.handlerResult().clearDisallowedFields();
		}
	} catch (err) {
		console.log("IsAdminPermission err", err);
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
module.exports = IsAdminPermission;