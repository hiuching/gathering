/*********************************************
 * The Event model Test
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

var Event = require('../models/event');
var encryption = require('../lib/encryption');
var IdCounter = require('../models/plugins/idCounterPlugin');
var UserRepository = require('../models/repositories/userRepository');
/*********************************************
 * DB connection
 *********************************************/
// var mongoDBConnector = require('../lib/mongoDBConnector');
// mongoDBConnector.init(CONFIG.mongoDB);
// mongoDBConnector.connect();
// var connection = mongoose.connect('localhost:27017/dev');


/*********************************************
 * Tests
 *********************************************/
describe('event-models', function () {

	beforeEach(function (done) {
		done();
	});

	afterEach(function (done) {
		done();
	});
	this.timeout(10000);

	var dummyUserCodes = [];
	var dummyIdCounterIds = [];

	/*********************************************
	 * related to DB
	 *********************************************/
	describe('create a counter if model is not exist', function () {

		it("if model is not exist", function (done) {
			IdCounter.getNextSequenceValue({model:'shortCode'}, function(err, NextSequenceValue){
				NextSequenceValue.should.equal(1);
				IdCounter.find({}, function(err, data){
					data.length.should.eql(2);
					//console.log(data);
					done();
				});
			});
		});

		it("if field is not exist", function (done) {
			IdCounter.getNextSequenceValue({model:'shortCode', field: "code"}, function(err, NextSequenceValue){
				NextSequenceValue.should.equal(1);
				IdCounter.find({}, function(err, data){
					data.length.should.eql(3);
					//console.log(data);
					done();
				});
			});
		});
	});
	
	describe('save doc with increment code', function () {

		it("create users", function (done) {
			var RightCode = true;
			function test(i) {
				var user = new UserRepository();
				UserRepository.saveUser(user, function (err, user, numberAffected) {
					dummyUserCodes.push(user.code);
					UserRepository.find({code : user.code}, function (err, data) {
						console.log(data.length);
						if (data.length != 1) {
							RightCode = false;
						}
						if (i == 9) {
							console.log("RightCode", RightCode);
							RightCode.should.equal(true);
							done();
						}
					});
				});
			}
			for (var i = 0; i < 10; i++) {
				test(i);
			}
		});
	});
	
	describe('remove doc', function () {
		it("remove testing doc in counters", function (done) {
		    IdCounter.deleteCounter({model : "shortCode"}, done);
		});

		it("remove testing doc in users", function (done) {
		    UserRepository.deleteUsers({code : {$in : dummyUserCodes}}, done);
		});

	});	
});
/*********************************************
 * End
*********************************************/