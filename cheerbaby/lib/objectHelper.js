/*
 * author: Don Lee
 * date: 2013-09-12T13:11:00Z
 *
 * Class: objectHelper
 */
var objectHelper =  {
};



objectHelper.addLoginToQuery = function (req) {
	var opt = {
		query: req.query,
		login: req.user
	};
	return opt;
};



/*
 * author: Don Lee
 * date: 2013-09-12T13:11:00Z
 *
 * function: isEmpty
 * args: 
 *   resultArray: 
 *   options: (most difficult criteria place first)
 * return:
 *   returnArray: 
 */
objectHelper.deleteProperties = function (obj, props) {
	for (var i=0; i<props.length; i++) {
		delete obj[props[i]];
	}
	return obj;
};

objectHelper.isEmptyObject = function (obj) {
  for (var prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      return false;
    }
  }
  return true;
};

objectHelper.getValue = function (obj, path) {
	path = path.toString();
	path = path.replace(/\[(\w+)\]/g, '.$1'); // convert indexes to properties
	path = path.replace(/^\./, ''); // strip a leading dot
	var pathArr = path.split('.');
	while (pathArr.length) {
		var prop = pathArr.shift();
		if (prop in obj) {
			obj = obj[prop];
		} else {
			return;
		}
	}
	return obj;
};

objectHelper.mergeModels = function (obj1, obj2) {
  for (var prop in obj1.schema.paths) {
    if (prop != "_id" && prop != "__v" ) {
      obj1[prop] = obj2[prop];
    }
  }
  return obj1;
};

objectHelper.setDefaultToTrue = function (value) {
	if (typeof value !== 'undefined') {
		return value;
	} else {
		return true;
	}
}

objectHelper.stringToObject = function(str){
	var obj = eval("({" + str + "})");
	return obj;
};


/*********************************************
 * Export as a module
 *********************************************/
module.exports = objectHelper;


