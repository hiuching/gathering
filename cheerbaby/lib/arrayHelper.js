var objectHelper = require("./objectHelper");

/*
 * author: Don Lee
 * date: 2013-09-12T13:11:00Z
 *
 * Class: arrayHelper
 */
var arrayHelper =  {
};

/*
 * author: Don Lee
 * date: 2013-09-12T13:11:00Z
 *
 * function: filterArray
 * args: 
 *   resultArray: 
 *   options: (most difficult criteria place first)
 * return:
 *   returnArray: 
 */
arrayHelper.filterArray = function (array, options, length) {
  return this.iterateArrayCallback(array, options, length, function (item, options, returnArray) {
	  var match = true;
		for (var prop in options) {
			if ((typeof item[prop] === 'undefined') || (options[prop] != item[prop])) {
			  match = false;
			  break;
			}
		}
		if (match) {
		  returnArray.push(item);
		}
	});
};

arrayHelper.isArray = function (array) {
	if (Object.prototype.toString.call( array ) === '[object Array]') {
		return true;
	} else {
		return false;
	}
};

arrayHelper.sameArray = function (arr1, arr2) {
	if (!arr1 || !arr2) return false;

	var array1 = arr1.slice(0);
	var array2 = arr2.slice(0);

	if (array1.length != array2.length) return false;
	
	array1.sort();
	array2.sort();

	for (var i=0; i<array1.length; i++) {
		// Check if we have nested arrays
		if (array1[i] instanceof Array && array2[i] instanceof Array) {
			// recurse into the nested arrays
			return arrayHelper.sameArray(array1[i], array2[i]);
		}else if (array1[i] != array2[i]) {
			// Warning - two different object instances will never be equal: {x:20} != {x:20}
			return false;
		}
	}
	return true;
}

/*
 * author: Don Lee
 * date: 2013-09-12T13:11:00Z
 *
 * function: iterateArrayCallback
 * args: 
 *   resultArray: 
 *   options: (most difficult criteria place first)
 * return:
 *   returnArray: 
 */
arrayHelper.iterateArrayCallback = function (array, options, length, callback) {
  var returnArray = [];
  if (array && (array.length > 0)) {
    array.forEach(function (item, index) {
		if (!length || (returnArray.length < length)) {
			callback(item, options, returnArray);
		}
    });
  }
  
  return returnArray;
};

/*
 * author: Don Lee
 * date: 2013-09-12T13:11:00Z
 *
 * function: removeObjectProperty
 * args: 
 *   array: array of object to be removed some property
 *   options: list of property to be removed from object e.g. {"isPublish": true, "isActive": false};
 * return:
 *   returnArray: array of object after removal of property in options
 */
arrayHelper.removeObjectProperty = function (array, options, length) {
  return this.iterateArrayCallback(array, options, length, function (item, options, returnArray) {
		for (var prop in options) {
			if (options[prop]) {
				delete item[prop];
			}
		}
		returnArray.push(item);
	});
};


arrayHelper.safeJoin = function (array, delimiter) {
  delimiter = delimiter || ',';
  var str = '';
  array.forEach(function (item, index) {
	  if ((typeof item == 'string') && (item.indexOf(',') != -1)) {
			str += delimiter + '"' + item.replace(/"/g, "'")  + '"' ;
		} else {
		  str += delimiter + item  ;
		}
	})
	return str.substr(delimiter.length);
};



/*
 * author: Don Lee
 * date: 2013-09-12T13:11:00Z
 *
 * function: walkArray
 * args: 
 *   array: array of object to be examined
 *   options: object e.g. {"isPublish": true, "isActive": false};
 *   filter: caller defined function to do on array
 *   callback: caller defined callback for return array
 */
arrayHelper.walkArray = function (array, options, filter, callback) {
	options = options || {};
	var counter = array.length;
	var new_array = [];
	if (array.length > 0) {
		array.forEach(function (item, index) {
			filter(item, function (err, data) {
				if (err) {
					console.log(err);
					// callback(err);
				}
				new_array[index] = data;

				counter--;
				if (counter === 0) {
					new_array.length = array.length;
					callback(null, new_array);
				}
			});
		});
	} else {
		callback(null, new_array);
	}
};


// arrayHelper.getIntersect = function (arr1, arr2, callback) {
    // var r = [], o = {}, l = arr2.length, i, v;
    // for (i = 0; i < l; i++) {
        // o[arr2[i]] = true;
    // }
    // l = arr1.length;
    // for (i = 0; i < l; i++) {
        // v = arr1[i];
        // if (v in o) {
            // r.push(v);
        // }
    // }
    // callback(r);
// };

arrayHelper.prepareArrayByForLoop = function (user, options, callback) {
	options = options || {};
	
	var self = this;
	var records = [];
	if (options.headers) {
		var headers = options.headers;
		var rows = options.rows;
		var len = rows.length;
		if (len > 0) {
			var row;
			for (var i = 0; i<len; i++){
				row = rows[i];
				var temp = [];
				headers.forEach(function (header, index) {
					if (row[header]) {
						if (self.isArray( row[header] )) {
							temp.push(row[header].join(','));
						} else {
							temp.push(row[header]);
						}
					} else {
						temp.push('');
					}
				});
				records.push(temp);
			}
		}
	}
	callback(null, records);
};


arrayHelper.prepareArray = function (user, options, callback) {
	options = options || {};
	
	var self = this;
	var headers = options.headers;
	var rows = options.rows;
	
	var records = [];
	var len = rows.length;
	if(len > 0){
		rows.forEach(function (row, index) {
			self.prepareArrayItem(row, headers, options, function (err, recordEntry) {
				records.push(recordEntry);
				
				len--;
				if (len ==0) {
					records.length = rows.length;
					callback(null, records);
				}
			});
		});
	}else{
		callback(null, records);
	}
};



arrayHelper.prepareArrayItem = function (row, headers, options, callback) {
  options = options || {};
	
	var self = this;
	var entry = [];
	var len = headers.length;
	
	if (options.callback) {
    for (var ii = 0; ii < headers.length; ii++) {
			options.callback(row, headers[ii], function (value) {
				entry.push(value);
				
				len--;
				if (len == 0) {
					callback(null, entry);
				}
			});
    };
	} else {
		for (var ii = 0; ii < headers.length; ii++) {
			var header = headers[ii];
			// 0 should also continue
			// if (row[header] || row[header] === 0) {
			if (row[header] != null && typeof row[header] !== "undefined") {
				if (self.isArray( row[header] )) {
					entry.push(row[header].join(','));
				} else {
					entry.push(row[header]);
				}
			} else {
				entry.push("");
			}
			
			len--;
			if (len == 0) {
				callback(null, entry);
			}
		};
	}
};

/**************************
 * sortArray - sort an array of objects/arrays by the paths/indexes
 * e.g. sortConditions = {
 *			email: 1
 *		};
 * sort by email in descending order
 *
 * e.g. sortConditions = {
 *			2: 1,
 *			1, 0	
 *		};
 * sort by third element in descending order, then second element in ascending order
 *************************/
arrayHelper.sortArray = function(array, sortConditions, callback){
	if (!objectHelper.isEmptyObject(sortConditions)) {
		var new_array = array.slice(0); //clone by value
		var sortKeys = Object.keys(sortConditions);
		new_array.sort(function(row1, row2){
			for(var i=0; i<sortKeys.length; i++){
			
				var sortKey = sortKeys[i];
				var order = sortConditions[sortKey]; // 1:descending, 0:ascending
				
				var value1 = objectHelper.getValue(row1, sortKey);
				var value2 = objectHelper.getValue(row2, sortKey);
				
				if (value1 && value2) {
					if ((isNaN(value1) || value1 instanceof Date) && (isNaN(value2) || value2 instanceof Date)) {
						if (value1 > value2) return order ? -1 : 1;
						if (value1 < value2) return order ? 1 : -1;
					} else {
						if ((value1 - value2) > 0) return order ? -1 : 1;
						if ((value1 - value2) < 0) return order ? 1 : -1;
					}
				} else {
					return order ? 1 : -1;
				}

			}
		});
		callback(null, new_array);
	} else {
		callback(400, "sortConditions must be an object");
	}
};

module.exports = arrayHelper;