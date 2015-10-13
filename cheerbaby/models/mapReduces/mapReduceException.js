/*********************************************
 * The MapReduceException Class
 *
 * author: Hillary Wong
 * created: 2014-12-17T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/


var MapReduceException = (function () {

  // Instance stores a reference to the Singleton
  var instance;

	function init() {

	// Singleton

		// Private methods and variables
		//var invalid = false;
		var exception = {};
		var error = false;

		return {

			// Public methods and variables
			clear: function() {
				this.clearException().unsetError();
			},
			clearException: function() {
				exception = {};
        return this;
			},
			getException: function () {
				return exception;
			},
			addException: function (key, obj) {
				//duplicateRecord = duplicateRecord.concat(obj);
				exception[key] = obj;
				return this;
			},
      isError: function () {
        return error;
      },
      setError: function () {
        error = true;
        return this;
      },
      unsetError: function () {
        error = false;
        return this;
      }
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
module.exports = MapReduceException;