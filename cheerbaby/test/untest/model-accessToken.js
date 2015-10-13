/*********************************************
 * The User model
 *
 * author: Eric Sin
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

// var test = require('unit.js');
// var should = test.should;
var should = require("should");
// var must = test.must;

/*********************************************
 * Test Configurations
 *********************************************/
var CONFIG = require('../config/config');
/*********************************************
 * Include modules
 *********************************************/
 var AccessToken = require('../models/oauth/accessToken');
 var mongoose = require('mongoose'), Schema = mongoose.Schema;
 var encryption = require('../lib/encryption');

/*********************************************
 * DB connection
 *********************************************/
var mongoDBConnector = require('../lib/mongoDBConnector');
mongoDBConnector.init(CONFIG.mongoDB);
mongoDBConnector.connect();

// var connection = mongoose.connect('localhost:27017/dev');



/*********************************************
 * Sub-document Schema
 *********************************************/
/*********************************************
 * Main Schema
 * 
 * e.g. 
     {
		"code": "1234",
		"password": "09001",
		"emails": [{"label":"work", "email":"don.lee@questwork.com"}],
		"picture": "",
		"isActivitate": false,
		"created": "2013-08-28T00:00:00Z",
		"modified": "2013-08-28T00:00:00Z"
     
     }
 *********************************************/

/*********************************************
 * Tests
 *********************************************/
describe('accessToken-models', function(){

beforeEach(function (done) {
	done();
});

afterEach(function (done) {
done();
});
	this.timeout(10000);
	
	describe('createNewAccessToken', function(){
	
		it("create AccessToken should be success", function(done){
			var options = {};
			options.clientId = "54892ae39025197826258ed4";//keenaction
			options.scope = ["abstracts"];
			
			AccessToken.Model.createNewAccessToken(options, function(newAccessToken){
				//newAccessToken.should.be.an.Object;
				console.log(newAccessToken, 'newAccessToken');
				done();
			});
		});
	});	//createNewAccessToken
	
});
 
 

/*********************************************
 * End
 *********************************************/