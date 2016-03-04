var User  = require('../models/user');
var networkHelper = require('../lib/networkHelper');

var UserController = function (){
};

UserController.prototype.login = function (req, res) {
	var options = req.query;
	User.findUserByEmailAndPassword(options, function(err, data){
		networkHelper.response(err, {data: data, res: res});
	});
};

UserController.prototype.findAll = function (req, res) {
	var options = req.query; //?後面
	User.findAll(options, function(err, data){
		networkHelper.response(err, {data: data, res: res});
	});
};

UserController.prototype.add = function (req, res) {
	var options = req.body;
	User.create(options, function(err, data){
		networkHelper.response(err, {data: data, res: res});
	});
};

UserController.prototype.updateById = function (req, res) {
  var self = this;
  var req = req;
  var id = req.params.id; //URL 個 id
  var update = req.body;
	User.updateById(id, update, function(err, data){
		networkHelper.response(err, {data: data, res: res});
	});
};

UserController.prototype.removeById = function (req, res) {
res.status(405).send('method not allowed');
/*   var self = this;
  var req = req;
  var id = req.params.id;
	User.removeById(id, update, function(err, data){
		if(err){
			res.send(500, err);
		} else {
			res.status(200).send(data);                 
		}
	}); */
};

module.exports = UserController;