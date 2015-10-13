/*********************************************
 * The PermissionManager model
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

/*********************************************
 * Include modules
 *********************************************/
var Permission = require('./permission');
var IsAdminPermission = require('./isAdminPermission');
var IsSelfPermission = require('./isSelfPermission');


/*********************************************
 *********************************************/
var PermissionManager = function (options) {
	options = options || {};
};

/*********************************************
 * CONSTANT declaration
 *********************************************/

/*********************************************
 * Custom Class Method (Static method)
 *********************************************/
PermissionManager.prototype.createChain = function () {
	// OR, user/registration containing any one of the adminRoles can carry out the action
	return {
		// exportReport : this.pushChain(["admin"]),
		appointmentReview : this.pushChain(['self']),
		allAppointmentReview: this.pushChain(),
		appointmentFind : this.pushChain(),
		appointmentFindBookingTime : this.pushChain(['self']),
		appointmentUpdate: this.pushChain(['self']),
		appointmentCancel: this.pushChain(['self']),
		appointmentConfirm: this.pushChain(),
		changeEmail: this.pushChain(['self']),
		dailySetting: this.pushChain(),
		exportReport : this.pushChain(),
		fileReport : this.pushChain(),
		fileAdminGet : this.pushChain(),
		fileGet : this.pushChain(['self']),
		item: this.pushChain(),
		inventory: this.pushChain(),
		printLabel: this.pushChain(),
		userDelete: this.pushChain(),
		userUpdate: this.pushChain(['self']),
		userFind: this.pushChain(),
		userSelfCheck: this.pushChain(['self']),
		uploadFileToAmazon: this.pushChain(),
		sendActivationLink: this.pushChain(),
		vendor: this.pushChain(),

	};
};

PermissionManager.prototype.pushChain = function (roles) {
	var permission = new Permission();
	permission.clear();

	roles = roles || [];
	// unrestricted roles
	roles.unshift("admin");

	for (var i = 0; i < roles.length; i++) {
		switch (roles[i]) {
			case "admin" :
				permission.appendToChain(new IsAdminPermission());
				break;
			case "self" :
				permission.appendToChain(new IsSelfPermission());
				break;
			default :
				break;
		}
	}
	// console.log("roles", roles);
	return permission;
};

/*********************************************
 * Custom instance Method
 *********************************************/




/*********************************************
 * Private method
 *********************************************/

/*********************************************
 * Export as a module
 *********************************************/
module.exports = PermissionManager;
