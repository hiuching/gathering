
var arrayHelper =  {
};

arrayHelper.walkArray = function (array, options, filter, callback) {
	options = options || {};
	var counter = array.length;
	var new_array = [];
	if (array.length > 0) {
		array.forEach(function (item, index) {
			filter(item, function (err, data) {
				if (err) {
					console.log(err);
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

module.exports = arrayHelper;