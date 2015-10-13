/*********************************************
 * The Sample model
 *
 * author: Hillary Wong
 * created: 2014-10-21T10:35:00Z
 * modified: 2014-10-21T10:35:00Z
 *
 *********************************************/

var should = require('should');

/*********************************************
 * Test Configurations
 *********************************************/
var CONFIG = require('../config/config');

/*********************************************
 * DB connection
 *********************************************/
var mongoDBConnector = require('../lib/mongoDBConnector');
mongoDBConnector.init(CONFIG.mongoDB);
mongoDBConnector.connect();

/*********************************************
 * Require Models
 *********************************************/
//var User = require('../models/user');

/*********************************************
 * Tests
 *********************************************/


/*********************************************
 * End
 *********************************************/