/*********************************************
 * The Permission Class
 *
 * author: Hillary Wong
 * created: 2014-12-17T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
var PermissionException = require('./permissionException');
var PermissionResult = require('./permissionResult');

var Config = require("../../config/config");
var CONFIG = Config.getInstance();
/*********************************************
* Class declaration
*********************************************/

var Permission = function (options) {
	options = options || {};
	this.lists = [];
	// this.or = options.or || false;
};


/*********************************************
 * Custom Class Method (Static method)
 *********************************************/



/*********************************************
 * Custom instance Method
 *********************************************/

Permission.prototype.appendToChain = function (successor) {
	var len = this.lists.length;
	if (len > 0) {
		this.lists[len - 1].setSuccessor(successor);
	}
	this.lists.push(successor);
};

Permission.prototype.clear = function () {
	this.clearException().clearResult();
};

Permission.prototype.clearException = function () {
	this.handlerException().clear();
	return this;
};

Permission.prototype.clearResult = function () {
	this.handlerResult().clear();
	return this;
};

Permission.prototype.exitChain = function (obj, callback) {
	var allow = this.handlerResult().isAllow();
	if (this.handlerException().isInvalid()) {
		// callback(this.handlerException().getInvalidRecord(), allow);
		callback(this.handlerException().getInvalidRecord(), false);
	} else {
		var additionalInfo = {
			disallowedFields : this.handlerResult().getDisallowedFields()
		};
		callback(null, allow, additionalInfo);
	}
};

Permission.prototype.handlerException = function () {
	return PermissionException.getInstance(); // Singleton
};

Permission.prototype.handlerResult = function () {
	return PermissionResult.getInstance(); // Singleton
};

Permission.prototype.handleRequest = function (obj, callback) {
	if (!CONFIG.skipCheckPermission) {
		if (this.lists.length > 0) {
			this.lists[0].handleRequest(obj, callback);
		} else {
			callback('no handler', obj);
		}
	} else {
		callback(null, true);
	}
};

Permission.prototype.next = function (obj, callback) {
	if (this.handlerResult().isAllow() || this.handlerException().isInvalid()) {
		this.exitChain(obj, callback);
	} else {
		if (this.successor) {
			this.successor.handleRequest(obj, callback);
		} else {
			this.exitChain(obj, callback);
		}
	}
};

Permission.prototype.setSuccessor = function (successor) {
	this.successor = successor;
};


/*********************************************
 * Helper functions
 *********************************************/




/*********************************************
 * Export as a module
 *********************************************/
module.exports = Permission;