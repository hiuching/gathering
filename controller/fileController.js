var File  = require('../models/file');
var fs = require('fs');
var networkHelper = require('../lib/networkHelper');

var FileController = function (){
};

FileController.prototype.findAll = function (req, res) {
	res.status(405).send('method not allowed');
};

FileController.prototype.add = function (req, res) {
	var options = req.body;
	File.create(options, function(err, data){
		networkHelper.response(err, {data: data, res: res});
	});
};

FileController.prototype.updateById = function (req, res) {
	res.status(405).send('method not allowed');
};

FileController.prototype.removeById = function (req, res) {
	res.status(405).send('method not allowed');
};

module.exports = FileController;