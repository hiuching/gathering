/*********************************************
 * Open Route
 *
 * author: Don Lee
 * created: 2015-08-23T15:36:00Z
 * created: 2015-08-23T15:36:00Z
 *
 *********************************************/

/*********************************************
 * APP Configurations
 *********************************************/
//var Config = require('../config/config');
//var CONFIG = Config.getInstance();


/*********************************************
 * required Express 4.x
 *********************************************/
var express = require('express');


/*********************************************
 * required modules
 *********************************************/
var Controller = require('../controllers/controller');
var controller = new Controller();


/*********************************************
 * router main
 *********************************************/
var router = express.Router();


/*********************************************
 * middleware specific to this router
 * all routes will pass throught this first
 *********************************************/
//router.all('/*', timeLog);


var moduleName = "";

/*********************************************
 * routes
 *********************************************/
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


//function timeLog(req, res, next) {
//  console.log('Open Time: ', Date.now());
//  next();
//}



/*********************************************
 * Export as a module
 *********************************************/

module.exports = router;