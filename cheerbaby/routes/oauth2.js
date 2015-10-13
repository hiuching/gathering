/*********************************************
 * OAuth2 Route
 *
 * author: Don Lee
 * created: 2015-08-23T15:36:00Z
 * created: 2015-08-23T15:36:00Z
 *
 *********************************************/

 
/*********************************************
 * APP Configurations
 *********************************************/
var Config = require('../config/config');
var CONFIG = Config.getInstance();

var oAuth2PathName = 'apao';

/*********************************************
 * required Express 4.x
 *********************************************/
var express = require('express');


/*********************************************
 * required modules
 *********************************************/
var passport = require('passport');
var OAuth2Strategy = require('passport-oauth2');

passport.serializeUser(function(user, done){
	done(null, user);
});

passport.deserializeUser(function(user, done){
	done(null, user);
});

passport.use(oAuth2PathName, new OAuth2Strategy(CONFIG.oAuth2.settings, function(req, accessToken, refreshToken, profile, done){
	req.session.accessToken = accessToken;
	done(null, profile);
}));


/*********************************************
 * router main
 *********************************************/
var router = express.Router();


/*********************************************
 * middleware specific to this router
 * all routes will pass throught this first
 *********************************************/
//router.use(handleBasicAuth);
router.all('/*', timeLog);


var moduleName = "";

/*********************************************
 * routes
 *********************************************/
 
router.get(['/' + oAuth2PathName, '/'+oAuth2PathName+'/invitation/:invitationCode'], function (req, res, next) {
	var invitationCode = req.params.invitationCode;
	passport.authenticate(oAuth2PathName, {
		state : invitationCode
	})(req, res, next);
});

router.get('/callback', function (req, res, next) {
	var invitationCode = req.query.state || '';
	passport.authenticate(oAuth2PathName, {
		successRedirect : "/#user/login/" + invitationCode,
		failureRedirect : "/"
	})(req, res, next);
});



/*********************************************
 * Private functions
 *********************************************/


var isAuthenticated = function (req, res, next) {
	if (req.isAuthenticated()) {
		// req.session.user = req.user._json;
		// console.log("req.session.user", req.session.user);
		next();
	} else {
		res.redirect('/oauth2/'+oAuth2PathName);
	}
};

function timeLog(req, res, next) {
  console.log('oauth2 Time: ', Date.now());
  next();
}



/*********************************************
 * Export as a module
 *********************************************/

module.exports = router;