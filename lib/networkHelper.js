/*
 * author: Don Lee
 * date: 2013-09-12T13:11:00Z
 *
 * Class: networkHelper
 */
var networkHelper =  {
};


networkHelper.response = function (err, options) {
	options = options || {};
	if (err) {
		var errCode = err.code || 500;
		options.res.status(errCode).send(err);
	} else {
		options.res.status(200).send(options.data);
	}
};

module.exports = networkHelper;
