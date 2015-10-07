var nodemailer = require("nodemailer");
var Mail = function (){
};
// create reusable transport method (opens pool of SMTP connections)
var smtpTransport = nodemailer.createTransport("SMTP",{
    service: "Gmail",
    auth: {
        user: "gathering7710@gmail.com",
        pass: "7710gathering"
    }
});

Mail.send = function(options, callback){
	options = options || {};
	var mailOptions = {
		from: "gathering <gathering7710@gmail.com>", // sender address
		to: options.email, // list of receivers
		subject: "thank you for register gathering", // Subject line
		html: "<div>Welcome gathering!</div><div>Your new password is <b>" + options.password  + "</b>.</div><div>Please login to edit yoyr profile.</div>" // html body
	};

	smtpTransport.sendMail(mailOptions, function(err, res){
		if(err){
			console.log(err);
			callback(err);
		}else{
			console.log("Message sent: " + res.message);
			callback(null, res);
		}
	});	
}

