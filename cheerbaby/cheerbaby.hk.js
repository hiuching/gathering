/*********************************************
 * Main Node.js program
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

process.chdir(__dirname);


/*********************************************
 * APP Configurations
 *********************************************/
var Config = require('./config/config');
var CONFIG = Config.getInstance();
//console.log(CONFIG);


/*********************************************
 * APP required modules
 *********************************************/

/* basic required modules*/
var express = require('express');
var fs = require('fs');
var http = require('http');
var https = require('https');
var os = require('os');
var passport = require('passport');
var path = require('path');


/* connect related */
var bodyParser = require('body-parser');
var compression = require('compression');
var errorHandler = require('errorhandler');
var favicon = require('serve-favicon');
var methodOverride = require('method-override');
var morgan = require('morgan');
var session = require('express-session');



/* custom modules */
require('./lib/date.js');
var mongoDBConnector = require('./lib/mongoDBConnector');

/* connected to Mongo DB */
mongoDBConnector.init(CONFIG.mongoDB);
var mongooseConnection = mongoDBConnector.connect();


var app = express();


/*********************************************
 * EXPRESS SETUP
 *********************************************/


var allowCrossDomain = function (req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, questwork-userid, questwork-username');

	// intercept OPTIONS method
	if ('OPTIONS' == req.method) {
		res.sendStatus(200);
	} else {
		next();
	}
};

var oneYear = 31557600000;
var maxAge = 0;
var env = process.env.NODE_ENV || 'development';
var MongoStore = require('connect-mongo')(session);

app.set('port', process.env.PORT || CONFIG.listening_port);
app.set('title', CONFIG.app_title);
app.use(allowCrossDomain);
app.use(compression());
// app.use(favicon(__dirname + '/public/userfile/img/favicon.ico', {maxAge: maxAge}));
app.use(morgan('dev')); /* 'default', 'short', 'tiny', 'dev' */
app.use(bodyParser.json({limit: CONFIG.fileLimit}));
app.use(bodyParser.urlencoded({ extended: true, limit: CONFIG.fileLimit }));
app.use(express.static(path.join(__dirname, CONFIG.htmlPath), {maxAge: maxAge}));
app.use(methodOverride());


app.use(session({
	secret: 'Q0j7I3LzHDVo2ZPnJk1N',
	saveUninitialized: false,
	resave: true,
	cookie : {
		maxAge : 604800000 // 7 days in ms
	},
	store: new MongoStore({ mongooseConnection: mongooseConnection.connection })
}));


if (env == 'development') {
	app.use(errorHandler({ dumpExceptions: true, showStack: true }));
}
if (env == 'production') {
	app.use(errorHandler());
}

require('./models/vendor');
require('./models/appointment');
require('./models/export');
require('./models/user');
require('./models/vendorCategory');
require('./models/inventory');
require('./models/item');

/*********************************************
 * ROUTING
 *********************************************/
var questcms = require('./routes/questcms');
app.use('/questcms', questcms);
 
var open = require('./routes/open');
app.use('/open', open);
 

/*********************************************
 * OAUTH2 ROUTING
 *********************************************/
/* app.post(CONFIG.oAuth2.LOGIN, oAuth2Server.userAuthentication, function (req, res) {
	res.redirect(req.session.returnTo);
});

// Create endpoint handlers for oauth2 authorize
app.get(CONFIG.oAuth2.AUTHORIZE, oAuth2Server.authorization);
app.post(CONFIG.oAuth2.AUTHORIZE, oAuth2Server.decision);

// Create endpoint handlers for oauth2 token
app.post(CONFIG.oAuth2.TOKEN, oAuth2Server.clientAuthentication, oAuth2Server.token);

app.get(CONFIG.oAuth2.PROFILE, oAuth2Server.bearerAuthentication, function (req, res) {
	res.json(req.user);
});
 */
/* app.get(CONFIG.oAuth2.LOGOUT, function (req, res) {
	var referer = req.header("referer");
	req.logout();
	if (!referer) {
		res.status(200).send("Logout success");
	} else {
		res.redirect(referer);
	}
}); */

/*********************************************
 * App Server
 *********************************************/

function connectionHandler (CONFIG, address) {

  if (CONFIG.enable_ssl) {
    var https_options = {
      key: fs.readFileSync('./ssl/privatekey.pem'),
      cert: fs.readFileSync('./ssl/certificate.pem')
    };
    var server = https.createServer(https_options, app);
    var proto = 'https://';
  } else {
    var server = http.createServer(app);
    var proto = 'http://';
  }

	server.listen(app.get('port'), address, function () {
		console.log(app.get('title') + ' server listening at ' + proto + address + ':' + app.get('port'));
  });
};



function isEmptyObject (obj) {
  if (obj === null || obj === undefined) return true;
  // Assume if it has a length property with a non-zero value
  // that that property is correct.
  if (obj.length && obj.length > 0)    return false;
  if (obj.length === 0)  return true;

  for (var key in obj) {
      if (hasOwnProperty.call(obj, key))    return false;
  }
  return true;
}


var interfaces = os.networkInterfaces();
if (isEmptyObject(interfaces)) {
  connectionHandler(CONFIG, CONFIG.ip_addr);
} else {
  for(name in interfaces) {
    var interface = interfaces[name];
    interface.forEach(function(entry) {
      if (entry.family === "IPv4")   {
					//if (CONFIG.ip_addr == entry.address) {
						connectionHandler(CONFIG, entry.address);
					//}

        //connectionHandler(CONFIG, entry.address);
      }
    });
  }
}


/*
 * (secords minutes hours DayOfMonth Months DayOfWeek)
 * ((0-59) (0-59) (0-23) (1-31) (0-11) (0-6))
 * exactly time format: (00 28 21 * * *)
 * every 10 secords format: (*\/10 * * * * *)
 * every weekday (11:30:00) format: (00 30 23 * * 1-5)
 */
var CronJob = require('cron').CronJob;

// example 1:
// new CronJob('* * * * * *', function(){
//     console.log('You will see this message every second');
// }, null, true, "Asia/Chita");

// example 2:
// var job = new CronJob({
//   cronTime: '00 30 11 * * 1-5',
//   onTick: function() {
//     /*
//      * Runs every weekday (Monday through Friday)
//      * at 11:30:00 AM. It does not run on Saturday
//      * or Sunday.
//      */
//   },
//   start: false,
//   timeZone: 'America/Los_Angeles'
// });
// job.start();
