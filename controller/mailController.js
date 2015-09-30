var Mail = require('../models/mail');

var MailController = function (){
};

MailController.prototype.findAll = function (req, res) {
	res.status(405).send('method not allowed');
};

MailController.prototype.add = function (req, res) {
	var options = req.body;
	console.log('MailController');
	Mail.send(options, function(err, data){
		if(err){
			res.status(500).send(err);   
		} else {
			res.status(200).send(data);   
		}
	});
};

MailController.prototype.updateById = function (req, res) {
res.status(405).send('method not allowed');
};

MailController.prototype.removeById = function (req, res) {
res.status(405).send('method not allowed');
};

module.exports = MailController;