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
 var User = require('../models/user');
 var mongoose = require('mongoose'), Schema = mongoose.Schema;
 var baseUserSchema = require('../models/schemas/baseUserSchema');
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
describe('user-models', function(){

beforeEach(function (done) {
	this.newUser = new User({});
	done();
});

afterEach(function (done) {
done();
});
	this.timeout(10000);
	
	describe('generateVerificationCode', function(){
		var user = new User({
		"verificationCode" : {
        "code" : "ijUsU8Kmi2t6bQ54w1zjAvxeNcNgWd53",
        "expiryDate" : ("2014-11-18T10:18:01.427Z")
		}});	
		
		it('should be success', function(done){
			var OldverificationCode = user.verificationCode.code;
			user.renewVerificationCode(function (err, user) { //generate is better
				should.not.exist(err);
				console.log(OldverificationCode ,user.verificationCode.code);
				user.verificationCode.code.should.not.eql(OldverificationCode.code);
				done();
			});
		});
		
	});//generateVerificationCode
	

/*********************************************
 * related to DB
 *********************************************/
 	// describe('create user account by providing email', function(){
		
		// it("should be fail", function(done){
			// var options = {};
			// User.createNewUser(options, function(err, user){
				// should.exist(err);
				// done();
			// });
		// });	
		
		// it("should be successfully created", function(done){
			// var options = {};
			// options.emails = [{"label": "primary", "email":"questwork123@gmail.com"}];
			// User.createNewUser(options, function(err, user, numberAffected){
				// should.not.exist(err);
				// user.should.be.an.Object;
				// user.isActivated.should.be.false;
				// numberAffected.should.be.greaterThan(0);
				// done();
			// });
		// });

		// it("the user already exist", function(done){
			// var options = {};
			// options.emails = [{"label": "primary", "email":"eric.sin@questwork.com"}];
			// User.createNewUser(options, function(err){
				// should.exist(err);
				// done();
			// });
		// });
		
		// it("the user already exist and activated", function(done){
			// var options = {};
			// options.emails = [{"label": "primary", "email":"tony.lo@keenaction.com"}];
			// User.createNewUser(options, function(err){
				// err.should.be.a.String;
				// done();
			// });
		// });
		
	// });	//create user account by providing email
 
 	// describe('checkIfUserAlreadyExistsByEmail', function(){

		// it("AlreadyExists should be true", function(done){
			// var email = "eric.sin@questwork.com";
			// User.checkIfUserAlreadyExistsByEmail(email, function(err, alreadyExists, existingUser){
				// should.not.exist(err);
				// alreadyExists.should.be.true;
				// done();
			// });
		// });
		
		// it("AlreadyExists should be false", function(done){
			// var options = {};
			// var email = "wong@questwork.com";
			// User.checkIfUserAlreadyExistsByEmail(email, function(err, alreadyExists, existingUser){
				// should.not.exist(err);
				// alreadyExists.should.be.false;
				// done();
			// });
		// });
		
		// it("AlreadyExists should be false because empty email", function(done){
			// var options = {};
			// var email = "";
			// User.checkIfUserAlreadyExistsByEmail(email, function(err, alreadyExists, existingUser){
				// should.not.exist(err);
				// console.log(existingUser);
				// alreadyExists.should.be.false;
				// done();
			// });
		// });
	
	// });	//check If User Already Exists By Email
 
 	describe('findBy', function(){
	
		it("findAllActive", function(done){
			var options = {};
			User.findAllActiveUsers(options, function(err, user){
				user.should.be.an.Array;
				user[0].isActive.should.be.true;
				done();
			});
		});
		
		it("findAllActiveUsersByConditions", function(done){
			var options = {};
			User.findAllActiveUsersByConditions(options, function(err, user){
				user.should.be.an.Array;
				user[0].isActive.should.be.true;
				done();
			});
		});

		it("findAllInActiveUsers", function(done){
			var options = {};
			User.findAllInActiveUsers(options, function(err, user){
				user.should.be.an.Array;
				done();
			});
		});
		
		it("findByEmail with existed email", function(done){
			var options = {};
			options.email = "eric.sin@keenaction.com";
			User.findByEmail(options, function(err, user){
				user.should.be.an.Array;
				//user.length.should.be.eql(1);
			done();
			});
		});
		
		it("findByEmail with not existed email", function(done){
			var options = {};
			options.email = "eric@keenaction.com";
			User.findByEmail(options, function(err, user){
				user.should.be.an.Array;
				//user.length.should.be.eql(0);
			done();
			});
		});
		
		it("findByEmail with empty email", function(done){
			var options = {};
			options.email = "";
			User.findByEmail(options, function(err, users){
				users.should.be.an.Array;
				console.log('users.length',users.length);
			done();
			});
		});
		
		it("findByEmailAndPassword with existed email and pw", function(done){
			var options = {};
			options.email = "eric.sin@keenaction.com";
			options.password = "ab1234cd";
			User.findByEmailAndPassword(options, function(err, user){
					user.should.be.an.Array;
					//user.length.should.be.gtn(1);
					done();
			});
		});
		
		
		it("findByUsername with existed username", function(done){
			var options = {};
			options.username = "eric.sin@keenaction.com";
			User.findByUsername(options, function(err, user){
				user.should.be.an.Array;
				//user.length.should.be.eql(2);
			done();
			});
		});
		
		it("findByUsername with not existed username", function(done){
			var options = {};
			options.username = "";
			User.findByUsername(options, function(err, user){
				user.should.be.an.Array;			
			done();
			});
		});
		
/**********
		it("findByVerificationCode", function(done){
			var options = {};
			options.code = "ijUsU8Kmi2t6bQ54w1zjAvxeNcNgWd53";
			User.findByVerificationCode(options, function(err, user){
				user.should.be.Array;
			done();
			});
		});
		
		it("findByVerificationCode with is null VerificationCode", function(done){
			var options = {};
			options.code = "";
			User.findByVerificationCode(options, function(err, user){
			user.should.be.an.Array;
			user.length.should.be.eql(0);
			done();
			});
		});
		
		it("findByVerificationCode with expired VerificationCode", function(done){
			var options = {};
			options.code = "548a73707c88137c1025ed7d";
			User.findByVerificationCode(options, function(err, user){
			user.should.be.an.Array;
			user.length.should.be.eql(0);
			done();
			});
		});
		
**********************		
	VerificationCode
**********************/	
	}); //findBy
 
 	describe('updateNewVerificationCode', function(){

		it('updateNewVerificationCode with existed username', function(done){
		var options = {};
		options.username = "eric.sin@keenaction.com";
			User.findByUsername(options, function(err, user){
				var OldverificationCode = user[0].verificationCode.code;
				user[0].updateNewVerificationCode(function (err, verificationCode) {
					should.not.exist(err);
					console.log(OldverificationCode ,verificationCode.code);
				verificationCode.code.should.not.eql(OldverificationCode);
				done();
				});
			});
		});
		
		it('updateNewVerificationCode will null username', function(done){
		var options = {};
		options.username = "";
			User.findByUsername(options, function(err, user){
				var OldverificationCode = user[0].verificationCode.code;
				user[0].updateNewVerificationCode(function (err, verificationCode) {
					should.not.exist(err);
				verificationCode.code.should.not.eql(OldverificationCode);
				done();
				});
			});
		});
	});//updateNewVerificationCode	
	
	describe('update user account', function(){
		
		it('updateByEmail should be fail with null email', function(done){
			var options = {email : ''};
			var update = {"firstName":"hi"};
			User.updateByEmail(options, update, function (err, number){
				//number.should.be.eql(0);
			done();
			});
		});
	
		it('updateByEmail should be success with existed email', function(done){
			var options = {};
			options.email = "eric.sin@keenaction.com";
			var update = {"firstName": "sin"};
				User.updateByEmail(options, update, function (err, number){
					//number.should.be.eql(1);
					done();
				});
			
		});
	});//update user account
	


	describe('Group', function(){
		
		it('createGroupByGroupNameAndUserId', function(done){
			var self = this;
			var options = {"groupName" : "dummy group",
							"userId": "54a24f0ea61c38880f240f5d"};//questwork123@gmail.com create a group
			User.createGroupByGroupNameAndUserId(options, function(err, admin){
			//console.log('admin', admin);
				// console.log('admin.groups', admin.groups);
				// console.log('err', err);
				//admin.groups.should.be.an.Array;
				admin.checkIfGroupAdminByGroupName('dummy group', function(err, isAdmin){
				isAdmin.should.be.true;
				done();				
				});
			})
		});

		it('joinGroupByGroupNameAndUserId', function(done){
			var self = this;
			var options = {"groupName" : "dummy group",
							"userId": "54a211a71d3ba918090001f9"};   //hillary.wong@questwork.com join the group
			User.joinGroupByGroupNameAndUserId(options, function(err, member){
				member.groups.should.be.an.Array;
				member.checkIfGroupAdminByGroupName('dummy group', function(err, isAdmin){
				isAdmin.should.be.false;
				console.log('err', err);
				done();				
				});
			})
		});
		
		it('leaveGroupByGroupNameAndUserId', function(done){
			var self = this;
			var options = {"groupName" : "dummy group",
							"userId": "54a211a71d3ba918090001f9"};  //hillary.wong@questwork.com leave the group
			User.leaveGroupByGroupNameAndUserId(options, function(err, member){
				member.groups.length.should.eql(1);//only "All Users" group
				done();
			})
		});		
		
		it('joinGroupByGroupNameAndUserId for leave', function(done){  
			var self = this;
			var options = {"groupName" : "dummy group",
							"userId": "54a211a71d3ba918090001f9"};  //hillary.wong@questwork.com join the group again for further test
			User.joinGroupByGroupNameAndUserId(options, function(err, member){
				member.groups.length.should.eql(2);
				done();
			})
		});
		
		it('authorizeGroupAdmin', function(done){
			var self = this;
			var options = {"adminId": "54a24f0ea61c38880f240f5d",
							"target": {
								"userId": "54a211a71d3ba918090001f9",
								"groupName": "dummy group"
								}
						  };
			User.authorizeGroupAdmin(options, function(err, newAdmin){  //questwork123@gmail.com authorize hillary.wong@questwork.com to be admin
				console.log('err', err);
				newAdmin.groups.should.be.an.Array;
				newAdmin.checkIfGroupAdminByGroupName('dummy group', function(err, isAdmin){
				isAdmin.should.be.true;
				done();				
				});
			})
		});	
				
		it('removeGroupMemeber', function(done){  //hillary.wong@questwork.com remove questwork123@gmail.com from Group
			var self = this;
			var options = { "adminId": "54a211a71d3ba918090001f9",
							"target": {
								"userId": "54a24f0ea61c38880f240f5d",
								"groupName": "dummy group"
								}
						  };
			User.removeGroupMemeber(options, function(err, member){
				console.log('err', err);
				console.log('member', member);
				member.groups.length.should.eql(1);
				done();
			})
		});	
		
		// it('ALLleaveGroup', function(done){
			// var self = this;
			// var options = {"groupName" : "dummy group",
							// "userId": "54a211a71d3ba918090001f9"};  //hillary.wong@questwork.com leave the group
			// User.leaveGroupByGroupNameAndUserId(options, function(err, member){
				// done();
			// })
		// });
				
	});//Group
	
});

 
 

/*********************************************
 * End
 *********************************************/