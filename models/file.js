var fs = require("fs");
var File = function (){
};

File.create = function (options, callback) {
	options = options || {};
	var base64Data = options.base64encoded.replace(/^data:image\/(jpeg|png);base64,/, "");
	fs.writeFile(options.path + '/' + options.name, base64Data, 'base64', function(err) {
	  callback(err);
	});
};

module.exports =  File;