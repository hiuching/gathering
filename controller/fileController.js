var File  = require('../models/file');
var fs = require('fs');
var FileController = function (){
};

FileController.prototype.findAll = function (req, res) {
	res.status(405).send('method not allowed');
};

FileController.prototype.add = function (req, res) {
	var options = req.body;
	console.log(options.path);
	File.create(options, function(err, data){
		if(err) {
			res.status(500).send(err);   
		} else {
			res.status(200).send(data);   
		}
	});
};

FileController.prototype.updateById = function (req, res) {
	res.status(405).send('method not allowed');
};

FileController.prototype.removeById = function (req, res) {
	res.status(405).send('method not allowed');
};

module.exports = FileController;