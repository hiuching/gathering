var Event  = require('../models/event');

var EventController = function (){
};

EventController.prototype.findAll = function (req, res) {
	var options = req.query; //?後面
	Event.findAll(options, function(err, data){
		if(err){
			res.status(500).send(err);
		} else {
			res.status(200).send(data); 
		}
	});
};

EventController.prototype.add = function (req, res) {
	var options = req.body;
	Event.create(options, function(err, data){
		if(err){
			res.status(500).send(err);   
		} else {
			res.status(200).send(data);   
		}
	});
};

EventController.prototype.updateById = function (req, res) {
  var self = this;
  var req = req;
  var id = req.params.id; //URL 個 id
  var update = req.body;
	Event.updateById(id, update, function(err, data){
		if(err){
			res.send(500, err);
		} else {
			res.status(200).send(data);                 
		}
	});
};

EventController.prototype.removeById = function (req, res) {
	res.status(405).send('method not allowed');
	/*   var self = this;
  var req = req;
  var id = req.params.id;
	Event.removeById(id, update, function(err, data){
		if(err){
			res.send(500, err);
		} else {
			res.status(200).send(data);                 
		}
	}); */
};

module.exports = EventController;