/*********************************************
 * The Mail controller
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
 
 
/*********************************************
 * Include modules
 *********************************************/

var arrayHelper = require('../lib/arrayHelper');
var networkHelper = require('../lib/networkHelper');

/*********************************************
 * Include models
 *********************************************/
var Mail = require('../models/mail');


/*********************************************
 * Class Constructor
 * 
 * @param {Object} app_config     application config object
 * @param {Object} [options]        optional config object
 *
 * @return {Object} studentAnswerController     Class instance
 *********************************************/
var MailController = function (app_config, options) {
  this.config = app_config;
  this.auth = options.auth;

};


/*********************************************
 * route functions
 *********************************************/
 

 
 
/*
 * allCallback
 *
 * send an email based on the request.body in options object and then a callback is called
 * 
 * @param {Object} options       options include request body which will be passed to the nodemailer.transport
 * @param {Function} callback    Callback(err, response) only callback the response.message
 */
MailController.prototype.addCallback = function (options, callback) {
  if (typeof options == 'function') {
    callback = options;
    options = {};
  }
  options = options || {};
  var self = this;
  var req = options.req;
  
  // this.auth.loginCallback(options, function (err, user) {
    // if (err) {
      // console.log(err);
      // callback(401);
    // }
    // if (user) {
      var strData = '';
      if (typeof req.body !== 'undefined') {

        // send mail with defined request.body
        var mailOptions = req.body;

        if (! mailOptions.massmail) {
          mailOptions.to = "info@questwork.com";
          Mail.send({}, mailOptions, callback);
        } else {
          delete mailOptions.massmail;
          mailOptions.from = 'Questwork Consulting <noreply@questwork.com>';
          var addresses = [
            'don.lee@questwork.com'
          ];

          var filter = function (address, done) {
            mailOptions.to = address;
            Mail.send({}, mailOptions, done);
          };

          arrayHelper.walkArray(addresses, {}, filter, callback);
        }

    
      } else {
        callback(500);
      }
    // } //if (user)
  // }); //auth.loginCallback
};

MailController.prototype.add = function (req, res, options) {
  options = options || {};
  
  options.req = req;
  this.addCallback(options, function(err, data) {
		networkHelper.response(err, {data: data, res: res});
  });
};


/*********************************************
 * functions
 *********************************************/
 
 
 
 

/*********************************************
 * Export as a module
 *********************************************/
module.exports = MailController;
