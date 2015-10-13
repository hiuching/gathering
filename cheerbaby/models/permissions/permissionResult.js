/*********************************************
 * The PermissionResult Class
 *
 * author: Hillary Wong
 * created: 2014-12-17T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

var PermissionResult = (function () {
	// Instance stores a reference to the Singleton
	var instance;

	function init() {
		// Singleton

		// Private methods and variables
		var allow = false;
		var disallowedFields = [];

		return {
			// Public methods and variables
			clear : function () {
				return this.unsetAllow();
			},
			isAllow : function () {
				return allow;
			},
			setAllow : function () {
				allow = true;
				return this;
			},
			unsetAllow : function () {
				allow = false;
				return this;
			},
			addDisallowedFields : function (fields) {
				if (typeof fields === "string") {
					if (disallowedFields.indexOf(fields) < 0) {
						disallowedFields.push(fields);
					}
				} else {
					for (var i = 0; i < fields.length; i++) {
						if (disallowedFields.indexOf(fields[i]) < 0) {
							disallowedFields.push(fields[i]);
						}
					}
				}
				return this;
			},
			clearDisallowedFields : function () {
				disallowedFields = [];
				return this;
			},
			getDisallowedFields : function () {
				return disallowedFields;
			}
		};
	};

	return {
		// Get the Singleton instance if one exists
		// or create one if it doesn't
		getInstance : function () {
			if (!instance) {
				instance = init();
			}
			return instance;
		}
	};

})();

/*********************************************
 * Custom Class Method (Static method)
 *********************************************/



/*********************************************
 * Custom instance Method
 *********************************************/




/*********************************************
 * Helper functions
 *********************************************/




/*********************************************
 * Export as a module
 *********************************************/
module.exports = PermissionResult;