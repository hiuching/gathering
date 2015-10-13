/*********************************************
 * The Mail model
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

 
/*********************************************
 * Include modules
 *********************************************/
var nodemailer = require('nodemailer');
var Config = require('../config/config');
var CONFIG = Config.getInstance();




/*********************************************
 * Mail Class
 *********************************************/
var Mail = {
  smtpTransport: nodemailer.createTransport("SMTP", CONFIG.nodemailer)
};

/*********************************************
 * Custom Class Method (Static method)
 *********************************************/
/*
 * public function being called
 */
Mail.sendMessage = function (from, to, replyTo, subject, message, callback) {
  if (from && to && message) {
    var mailOptions = {
      "from": from,
      "to": to,
      "replyTo": replyTo,
      "subject": subject,
      "html": message
    };
    this.send(mailOptions, callback);
  } else {
    callback({code : 404, message : "non-valid email"});
  }
};


/*
 *
 * options is the nodemailer mailOptions
 * e.g. 
{
  "from": "SPCSELMO <report@keenaction.com>",
  "to": [
    "Don <don.lee@questwork.com>",
    "2008 P <don.lee@ijc.hk>"
  ],
  "replyTo": "don.lee@keenaction.com",
  "subject": "test email for 2",
  "html" : "<b>Good to test</b><img src='http://wiki.questwork.com/dokuwiki/lib/tpl/dokuwiki/images/logo.png' />"
}
 */
Mail.send = function (options, callback) {
	var self = this;
	options = options || {};
	options.from = "No-reply <questwork123@gmail.com>";
	if (options.to) {
		self.smtpTransport.sendMail(options, function (err, response) {
			if (err) {
				console.log('smtp err', err);
				callback(err);
			} else {
				callback(null, {
					message : response.message
				});
			}
		});
	} else {
		callback({code : 404, message : 'no recipient'});
	}
};



/*********************************************
 * Export as a module
 *********************************************/
module.exports = Mail;
