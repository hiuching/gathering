/*********************************************
 * The MapReduceResult Class
 *
 * author: Hillary Wong
 * created: 2014-12-17T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/


var MapReduceResult = (function () {

  // Instance stores a reference to the Singleton
  var instance;

	function init() {

	// Singleton

		// Private methods and variables
		//var invalid = false;
		var result = {};
		var uniqueIds = [];

		return {

			// Public methods and variables
			clear: function() {
				this.clearResult().clearUniqueIds();
			},
			clearResult: function() {
				result = {};
        return this;
			},
			getResult: function () {
				return result;
			},
			addResult: function (key, obj) {
				result[key] = obj;
				return result;
			},
      clearUniqueIds: function () {
        uniqueIds = [];
        return this;
      },
			pushUniqueId: function(ids){
				for(var i=0; i<ids.length; i++){
					var userId = ids[i].toString();
					if(uniqueIds.indexOf(userId) < 0){
						uniqueIds.push(userId);
					}
				}
				return this;
			},
			getUniqueIds: function(){
				return uniqueIds;
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
module.exports = MapReduceResult;