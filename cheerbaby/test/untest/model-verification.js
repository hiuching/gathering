/*********************************************
 * The User model
 *
 * author: Eric Sin
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

var test = require('unit.js');
var should = test.js;
var must = test.must;
var mongoose = require('mongoose'), Schema = mongoose.Schema;
var encryption = require('../lib/encryption');
var VerificationCodeTest = require('../models/VerificationCode');
/*********************************************
 * Test Configurations
 *********************************************/
var CONFIG = require('../config/config');

/*********************************************
 * model configuration
 *********************************************/
var isDebug = false;

/*********************************************
 * DB connection
 *********************************************/
var mongoDBConnector = require('../lib/mongoDBConnector');
mongoDBConnector.init(CONFIG.mongoDB);
mongoDBConnector.connect();

/*********************************************
 * Main Schema
 * 
 * e.g. 
    {

    }
 *********************************************/
 
/*********************************************
 * Tests
 *********************************************/
var options = {};
VerificationCode = mongoose.model('VerificationCode');

describe('VerificationCode-models', function(){

	describe('VerificationCode-checkExpiryDateByCode', function(){
	
		
		it("new VerificationCode", function(done){
			var verificationCode = new VerificationCode({});
			verificationCode.should.be.Object;
			console.log(verificationCode);
			done();
		});

		it("should be err when findByCode is failed", function(done){
			var code = '';
			VerificationCode.checkExpiryDateByCode(code, function(err, verificationCode, isExpired){
				should.exist(err);
				done();
			});
		});
		
		it("isExpired should be false", function(done){
			var verificationCode = new VerificationCode({});
			verificationCode.expiryDate =  new Date() + 60;
			var code = verificationCode.code;
			VerificationCodeTest.checkExpiryDateByCode(code, function(err, verificationCode, isExpired){
				should.not.exist(err);
				verificationCode.should.be.exist;
				verificationCode.should.be.an.Object;
				isExpired.should.be.false;
				done();
			});
		});
		
		it("isExpired should be true", function(done){
			var verificationCode = new VerificationCode({});
			verificationCode.expiryDate =  new Date() - 60;
			console.log(verificationCode.expiryDate);
			var code = verificationCode.code;
			VerificationCode.checkExpiryDateByCode(code, function(err, verificationCode, isExpired){
				should.not.exist(err);
				verificationCode.should.be.exist;
				verificationCode.should.be.an.Object;
				isExpired.should.be.true;
				done();
			});
		});
	

	});


});

/*********************************************
 * End
 *********************************************/