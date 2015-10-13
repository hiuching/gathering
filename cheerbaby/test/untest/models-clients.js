/*********************************************
 * The User model
 *
 * author: Eric Sin
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

var should = require('should');

/*********************************************
 * Test Configurations
 *********************************************/
var CONFIG = require('../config/config');

/*********************************************
 * Include modules
 *********************************************/
 var Client = require('../models/oauth/client');
 var mongoose = require('mongoose'), Schema = mongoose.Schema;
 var encryption = require('../lib/encryption');

/*********************************************
 * DB connection
 *********************************************/
var mongoDBConnector = require('../lib/mongoDBConnector');
mongoDBConnector.init(CONFIG.mongoDB);
mongoDBConnector.connect();


/*********************************************
 * Tests
 *********************************************/
describe('client-models', function(){

beforeEach(function (done) {
	done();
});

afterEach(function (done) {
done();
});
	this.timeout(10000);
	
	describe('create client account', function(){
		
		it("should be fail since require field is absent/empty", function(done){
			var options = {};
			Client.getNewSecret(options, function(err, NewSecret){
				NewSecret.should.be.a.String;
				done();
			});
		});	
		
	});	//create client account
	
});

/*********************************************
 * End
 *********************************************/