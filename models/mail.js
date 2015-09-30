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
var mailOptions = {
    from: "gathering <gathering7710@gmail.com>", // sender address
    to: options.email, // list of receivers
    subject: "testing", // Subject line
    html: "<b>gathering texting</b>" // html body
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

module.exports = Mail;