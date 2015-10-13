/*********************************************
 * The Auth Code model Test
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
 
var AuthCode = require('../models/authCode');
var encryption = require('../lib/encryption');

/*********************************************
 * DB connection
 *********************************************/
var mongoDBConnector = require('../lib/mongoDBConnector');
mongoDBConnector.init(CONFIG.mongoDB);
mongoDBConnector.connect();
// var connection = mongoose.connect('localhost:27017/dev');





/*********************************************
 * Tests
 *********************************************/
describe('authCode-models', function(){

	beforeEach(function (done) {
		done();
	});
	
	afterEach(function (done) {
	  done();
	});
  //this.timeout(10000);

/*********************************************
 * related to DB
 *********************************************/
 
    var code = "";
 	 describe('create auth code', function(){
     
		 it("should success", function(done){
			 var options = {
            clientId: "n56ztGzWtLAEQs3DdfnvvhRU",
            userId: "54b6153bf58bf8341ffa9ef2",
            scopes: ["__dev"],
            redirectUri: "test"
        };
        AuthCode.create(options, function (err, authCode) {
          code = authCode.code;
          should.not.exist(err);
          authCode.should.be.an.Object;
          done();
        });
		 });     
     
   });
 
 	 describe('find auth code', function(){
   
		 it(" by code", function(done){
			 var options = {
            code: code
        };
        AuthCode.findAuthCodeByCode(options, function(err, authCode) {
          should.not.exist(err);
          authCode.should.be.an.Object;
          authCode.clientId.should.be.an.Object;
          authCode.code.should.equal(code);
          done();
        });
		 });
     
   });
 
});
/*********************************************
 * End
 *********************************************/