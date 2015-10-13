/*********************************************
 * Form module
 *
 * author: Eric Sin
 * version: 2.1.0
 * created: 2015-07-15T15:16:00Z
 * modified: 2015-09-17T15:16:00Z
 *
 *********************************************/

;define([
  "jquery"
],

function ($) {

	var module = "form"; // lowercase only
	var configs = {};

/*********************************************
 * Main function (export)
 *********************************************/

  var itemList = [];

	var Form = function () {
		configs[module] = {
		};
		$.extend(true, configs, QuestCMS.Config.toJSON());
	};


	Form.prototype.getData = function (formID, withoutClasses) {
		var modelObj = scanForm(formID, withoutClasses, true);    // Creating an object by the html form
		var dataObj = scanForm(formID, withoutClasses, false);    // Getting the data from the html form

		var result = $.extend(true, modelObj, dataObj);
		return removeEmptyObjectFromArray(result);
	};


	Form.prototype.prepareLoadJSONData = function (obj) {
		return loopKey(obj);
	};



/*********************************************
 * Private Methods
 *********************************************/

	var cleanUpEmptyField = function (obj) {
		obj = obj || {};

		for (var prop in obj) {
			switch ($.type(obj[prop])) {
				case 'array' :
					if (obj[prop].length !== 0) {
						obj[prop].forEach(function (_obj) {
							cleanUpEmptyField(_obj);
						});
					} else {
						delete obj[prop];
					}
					break;
				case 'object' :
					if ($.isEmptyObject(obj[prop])) {
						delete obj[prop];
					} else {
						cleanUpEmptyField(obj[prop]);
					}
					break;
				default :
					if (!obj[prop] || obj[prop] == '' || prop == '') {
						delete obj[prop];
					}
					break;
			}
		}

		return obj;
	};

	var scanForm = function (formID, withoutClasses, isCreatingSchema) {
		/* preparing conditions */
    var target, targetInTR;

		if (isCreatingSchema) {			// if true, find all elements
			target = 'input:text, input:radio, input:checkbox, select, tbody tr:visible, textarea, input[type="date"]';
			targetInTR = 'input:text, input:radio, input:checkbox, select, textarea, input[type="date"]';
		} else {
			target = 'input:text, input:radio:checked, input:checkbox:checked, select, tbody tr:visible, textarea, input[type="date"]';
			targetInTR = 'input:text, input:radio:checked, input:checkbox:checked, select, textarea, input[type="date"]';
		}


		/* START scan the form */
		var data = temp = {};

		$(formID).find(target).each(function () {
			var $input = $(this);
			var name = $input.prop('name');
			var val = (isCreatingSchema) ? '' : $input.val();

			if (!$input.is(withoutClasses)) {			// skip some elements that user don't want to get
				if ($input.is('tr')) {			// check is tr, if true, means it should be an array object
					var array = [];
					var obj = _temp = {};
					var firstProp;

					$input.find(targetInTR).each(function () {
						var $input = $(this);
						var name = $input.prop('name');
						var val = (isCreatingSchema) ? '' : $input.val();

						if (name.indexOf('.') == -1) {			// check is exist dot. If exist, means is a object
							_temp[name] = handleString({input: $input, key: _temp[name], val: val, isCreatingSchema: isCreatingSchema});
						} else {
							var props = name.split('.');
							firstProp = props[0];
							if (!temp[firstProp]) {
								temp[firstProp] = [];
							}

							for (var ii = 1; ii < props.length - 1; ii++) {
								_temp = _temp[props[ii]] = _temp[props[ii]] || {};
							}
							_temp[props[ii]] = handleString({input: $input, key: _temp[props[ii]], val: val, isCreatingSchema: isCreatingSchema});
							_temp = obj;

						}
					});

					if (temp[firstProp]) {
						temp[firstProp].push(obj);
					}
				} else if (!$input.closest('tr').is('tr') && (name && name !== '')) {			// the element isn't in tr and the name is exist and should not be empty
					if (name.indexOf('.') == -1) {		//isn't object	// check is exist dot. If exist, means is a object
						data[name] = handleString({input: $input, key: data[name], val: val, isCreatingSchema: isCreatingSchema});
					} else {		// is Object
						var props = name.split('.');
						for (var ii = 0; ii < props.length - 1; ii++) {
							temp = temp[props[ii]] = temp[props[ii]] || {};
						}

						temp[props[ii]] = handleString({input: $input, key: temp[props[ii]], val: val, isCreatingSchema: isCreatingSchema});
						temp = data;
					}
				}
			}
		});

		return data;
	};

	var removeEmptyObjectFromArray = function (obj) {
		obj = obj || {};
		var cloneModel = $.extend(true, {}, obj);
		var indexs = [];

		cloneModel = cleanUpEmptyField(cloneModel);

		for (var prop in cloneModel) {
			if ($.type(cloneModel[prop]) == 'array') {
				cloneModel[prop].forEach(function (_obj, index) {
					var keys = Object.keys(_obj);
					var key = keys[0];

					if ($.isEmptyObject(_obj) || (keys.length == 1 && key == '_id')) {
						indexs.unshift(index);
					}
				});

				indexs.forEach(function (index) {
					obj[prop].splice(index, 1);
				});
			}
		}

		return obj;
	};


/*********************************************
 * Handler Function
 *********************************************/
	var handleString = function (options) {
		options = options || {};
		var $input = options.input;
		var key = options.key;
		var val = options.val;
		var isCreatingSchema = options.isCreatingSchema;

		if ($input.prop('type') == 'checkbox') {
			key = handleCheckbox({key: key, val: val, isCreatingSchema: isCreatingSchema});
		} else if ($input.prop('type') == 'textarea') {
			key = handleTextarea({val: val});
		} else {
			key = val;
		}

		return key;
	};

	var handleCheckbox = function (options) {
		options = options || {};
		var key = options.key;
		var val = options.val;
		var isCreatingSchema = options.isCreatingSchema;

		if (!$.isArray(key)) {
			key = [];
		}

		if (!isCreatingSchema) {
			key.push(val);
		}

		return key;
	};

	var handleTextarea = function (options) {
		options = options || {};
		var val = options.val;
		var array = val.split('\n');

		if (checkEmptyStringArray(array)) {
			array = [];
		}

		return array;
	};


/*********************************************
 * Helper Function
 *********************************************/

	var checkEmptyStringArray = function (array) {
		array = array || [];
		var result = true;

		array.forEach(function (data){
			if(data !== '') {
				result = false;
			}
		});
		return result;
	};


	var loopKey = function (obj) {
		obj = obj || {};
		var data = {};
		var finished = true;

		for (var prop in obj) {
			if ($.type(obj[prop]) == 'object') {
				for (var key in obj[prop]) {
					var name = prop + '.' + key;
          if (name.search(/([*+?=^!:${}()|[\]\/\\])/g) == -1) {
            data[name] = obj[prop][key];
  					if ($.type(data[name]) !== 'object') {
  						finished = false;
  					}
          }
				}
			} else if ($.type(obj[prop]) !== 'array') {
        if (prop.search(/([*+?=^!:${}()|[\]\/\\])/g) == -1) {
  				data[prop] = obj[prop];
        }
			}
		}

		if (finished) {
			return data;
		} else {
			return loopKey(data);
		}
	};
/*********************************************
 * Return
 *********************************************/

	return Form;

});
