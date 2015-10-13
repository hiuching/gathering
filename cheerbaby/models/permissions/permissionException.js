/*********************************************
 * The PermissionException Class
 *
 * author: Hillary Wong
 * created: 2014-12-17T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/


var PermissionException = (function () {
  // Instance stores a reference to the Singleton
  var instance;

	function init() {
	// Singleton

		// Private methods and variables
		var invalid = false;
		var invalidRecord = {};

		return {
			// Public methods and variables
			clear: function() {
				return this.clearInvalidRecord().unsetInvalid();
			},
			clearInvalidRecord: function () {
				invalidRecord = {};
				return this;
			},
			isInvalid: function () {
				return invalid;
			},
			getInvalidRecord: function () {
				return invalidRecord;
			},
			setInvalid: function () {
				invalid = true;
				return this;
			},
			addInvalidRecord: function (key, obj) {
				invalidRecord[key] = obj;
				this.setInvalid();
				return this;
			},
			unsetInvalid: function () {
				invalid = false;
				return this;
			},
		};
	};

  
	return {
    // Get the Singleton instance if one exists
    // or create one if it doesn't
    getInstance: function () {
      if ( !instance ) {
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
module.exports = PermissionException;