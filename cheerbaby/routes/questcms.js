/*********************************************
 * QuestCMS Route
 *
 * author: Don Lee
 * created: 2015-08-23T15:36:00Z
 * created: 2015-08-23T15:36:00Z
 *
 *********************************************/

/*********************************************
 * APP Configurations
 *********************************************/
var logHelper = require('../lib/logHelper');


/*********************************************
 * required Express 4.x
 *********************************************/
var express = require('express');


/*********************************************
 * required modules
 *********************************************/
var basicAuth = require('basic-auth-connect');
var URL = require('url');
var Controller = require('../controllers/controller');
var controller = new Controller();


/*********************************************
 * router main
 *********************************************/
var router = express.Router();
router.use(logHelper.connectLogger());


/*********************************************
 * middleware specific to this router
 * all routes will pass throught this first
 *********************************************/
//router.use(handleBasicAuth);
router.use([
    "/appointment",
    "/dailySetting",
    "/export",
    "/file",
    "/login",
    "/inventory",
    "/item",
    "/user",
    "/vendor"
  ], handleBasicAuth);


var moduleName = "";

/*********************************************
 * routes
 *********************************************/

router.get('/login', function (req, res) {
	if (req.user) {
		res.status(200).send(req.user);
	} else {
		res.status(401).send({error: null});
	}
});


router.post('/add', function (req, res) {
  if (typeof req.body !== 'undefined') {
    moduleName = req.body.dataType;
    publicFileController.add(req, res, {folder: moduleName});
  } else {
    res.send(204);
  }
});

router.delete('/:moduleName/:id', function (req, res) {
  controller.remove(req, res);
});


router.get('/:moduleName', function (req, res) {
  controller.findAll(req, res);
});


router.get('/:moduleName/:id', function (req, res) {
  controller.findByIndex(req, res);
});

router.put('/:moduleName', function (req, res) {
  controller.update(req, res);
});

router.put('/:moduleName/:id', function (req, res) {
  controller.updateById(req, res);
});


router.post('/:moduleName', function (req, res) {
  controller.add(req, res);
});


/*********************************************
 * Private functions
 *********************************************/

function handleBasicAuth (req, res, next) {
  var User = require('../models/user');
	var callingURL = URL.parse(req.originalUrl).pathname,
			callingMethodType = req.originalMethod,
			callingAction = req.query.action || req.body.action || '',
			skip = false,
			oAuthUser;

	if (callingMethodType == 'PUT') {
		callingURL = callingURL.replace(req.url, '');
	}

	var skipCalls = [
		{url: '/questcms/user', type: 'POST'},	//action: xxx
  	{url: '/questcms/file', type: 'POST'},	//action: xxx
		{url: '/questcms/user', type: 'PUT', action: 'resetPassword'},
		{url: '/questcms/user', type: 'PUT', action: 'activateAccount'},
		{url: '/questcms/file', type: 'GET', action: 'getFileByFullPath'},
		{url: '/questcms/user', type: 'GET', action: 'verificationCode'}
	];
	//console.log(callingURL, callingMethodType, callingAction);
	skipCalls.forEach(function (skipCall){
		if ((skipCall.url == callingURL && skipCall.type == callingMethodType)) {
			if (skipCall.action) {
				if (skipCall.action == callingAction) {
					skip = true;
				}
			} else {
				skip = true;
			}
		}
	});

	if (skip) {
		next();
	} else {
		basicAuth(function(user, pass, callback) {
			User.authenticate({email: user, password: pass}, callback);
		})(req, res, next);
	}
};


function timeLog(req, res, next) {
  console.log('QuestCMS Time: ', Date.now());
  next();
}



/*********************************************
 * Export as a module
 *********************************************/

module.exports = router;
