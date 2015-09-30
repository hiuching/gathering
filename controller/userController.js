var User  = require('../models/user');

var UserController = function (){
};

UserController.prototype.login = function (req, res) {
	var options = req.query;
	User.findUserByEmailAndPassword(options, function(err, data){
		if(err){
			res.status(500).send(err);
		} else {
			res.status(200).send(data); 
		}
	});
};

UserController.prototype.findAll = function (req, res) {
	var options = req.query;
	User.findAll(options, function(err, data){
		if(err){
			res.status(500).send(err);
		} else {
			res.status(200).send(data); 
		}
	});
};

UserController.prototype.add = function (req, res) {
	var options = req.body;
	console.log(options);
	User.create(options, function(err, data){
		if(err){
			res.status(500).send(err);   
		} else {
			res.status(200).send(data);   
		}
	});
};

UserController.prototype.updateById = function (req, res) {
res.status(405).send('method not allowed');
/*   var self = this;
  var req = req;
  var id = req.params.id;
  var update = req.body;
	User.updateById(id, update, function(err, data){
		if(err){
			res.send(500, err);
		} else {
			res.status(200).send(data);                 
		}
	}); */
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