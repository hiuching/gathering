/*********************************************
 * The New User model Test
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
var User = require('../models/user');
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
describe('user-models', function () {

	beforeEach(function (done) {
		done();
	});

	afterEach(function (done) {
		done();
	});
	this.timeout(5000);
	
	var dummyUser1, dummyUser2;
	var UPDATED_VERIFICATION_CODE;
	var GENERATED_TOKEN;
	var CREATED_GROUP;
	
	var PASSWORD_TO_UPDATE = "ab1234cd";
	var FIRSTNAME_TO_UPDATE = "HELLO";
	var LASTNAME_TO_UPDATE = "WORLD";

	/*********************************************
	 * related to DB
	 *********************************************/
	describe('create user', function () {

		it("should be failed if no email", function (done) {
			var options = {};
			User.create(options, function (err, newUser) {
				should.exist(err);
				done();
			});
		});

		it("should successfully created a dummy user account", function (done) {
			var options = {};
			options.emails = [{
				"label" : "primary",
				"email" : "questwork123@gmail.com"
			}];
			// User.createAndSendVerificationLink(options, function (err, newUser) {
			User.create(options, function (err, newUser) {
				should.not.exist(err);
				newUser.should.be.an.Object;
				newUser.isActive.should.equal(true);
				newUser.isActivated.should.equal(false);
				newUser.groups.length.should.equal(1);
				newUser.groups[0].name.should.equal("All Users");
				newUser.username.should.equal(options.emails[0].email);
				newUser.password.should.be.OK;
				newUser.password.should.not.equal("");
				newUser.verificationCode.code.should.be.OK;
				newUser.verificationCode.code.should.not.equal("");
				newUser.verificationCode.expiryDate.should.greaterThan((new Date()));
				dummyUser1 = newUser;
				// console.log("dummyUser1", newUser);
				done();
			});
		});

		it("should created another user account for testing", function (done) {
			var options = {};
			options.emails = [{
				"label" : "primary",
				"email" : "questwork321@gmail.com"
			}];
			// User.createAndSendVerificationLink(options, function (err, newUser) {
			User.create(options, function (err, newUser) {
				should.not.exist(err);
				newUser.should.be.an.Object;
				newUser.isActive.should.equal(true);
				newUser.isActivated.should.equal(false);
				newUser.groups.length.should.equal(1);
				newUser.groups[0].name.should.equal("All Users");
				newUser.username.should.equal(options.emails[0].email);
				newUser.password.should.be.OK;
				newUser.password.should.not.equal("");
				newUser.verificationCode.code.should.be.OK;
				newUser.verificationCode.code.should.not.equal("");
				newUser.verificationCode.expiryDate.should.greaterThan((new Date()));
				dummyUser2 = newUser;
				// console.log("dummyUser2", newUser);
				done();
			});
		});

		it("should be failed to create duplicate user", function (done) {
			// console.log("dummyUser1", dummyUser1);
			var options = {};
			options.emails = [{
					"label" : "primary",
					"email" : dummyUser1.emails[0].email
				}
			];
			// User.createAndSendVerificationLink(options, function (err, newUser) {
			User.create(options, function (err, newUser) {
				should.exist(err);
				done();
			});
		});
	});

	describe('update user', function () {
		it("should update by id", function (done) {
			var options = {
				conditions: {id: dummyUser1._id},
				update: {
					firstName: FIRSTNAME_TO_UPDATE,
					importedOldProfile: {"Something": true},
					password: PASSWORD_TO_UPDATE
				}
			};
			User.updateById(options, function (err, updatedUser) {
				should.not.exist(err);
				updatedUser.firstName.should.equal(FIRSTNAME_TO_UPDATE);
				done();
			});
		});

		it("should update by email", function (done) {
			var options = {};
			options.email = dummyUser1.emails[0].email;
			User.findUsersByEmail(options, function (err, users) {
				users.should.be.an.Array;
				users.length.should.equal(1);
				var user = users[0];
				user.lastName = LASTNAME_TO_UPDATE;
				user.saveUser(function (err, updatedUser) {
					should.not.exist(err);
					updatedUser.firstName.should.equal(FIRSTNAME_TO_UPDATE);
					updatedUser.lastName.should.equal(LASTNAME_TO_UPDATE);
					done();
				});
			});
		});
		
		it("should update verification code", function (done) {
			User.findUserById({
				id : dummyUser1._id
			}, function (err, user) {
				user.updateVerificationCode(function (err, updatedUser) {
					should.not.exist(err);
					updatedUser.verificationCode.should.be.OK;
					updatedUser.verificationCode.code.should.be.a.String;
					updatedUser.verificationCode.expiryDate.should.be.a.Date;
					UPDATED_VERIFICATION_CODE = updatedUser.verificationCode;
					done();
				});
			});
		});
	});

	describe('find user', function () {
	
		it("should find the users by conditions", function (done) {
			var options = {};
			options.name = FIRSTNAME_TO_UPDATE;
			User.findAllUsersByConditions(options, function (err, users) {
				should.not.exist(err);
				users.should.be.an.Array;
				users.length.should.be.greaterThan(0);
				// console.log('findAllUsersByConditions', users.length);
				done();
			});
		});

		it("should find the user by username", function (done) {
			var options = {};
			options.username = dummyUser1.emails[0].email;
			User.findUserByUsername(options, function (err, user) {
				should.not.exist(err);
				user.should.be.an.Object;
				user.username.should.equal(options.username);
				// console.log('findByUsername', newUsers.length);
				done();
			});
		});

		it("should find the users by emails", function (done) {
			var options = {};
			var email = dummyUser1.emails[0].email;
			options.emails = [email];
			// options.emails = [{
					// "label" : "primary",
					// "email" : email
				// }
			// ];
			User.findUsersByEmail(options, function (err, users) {
				should.not.exist(err);
				users.should.be.an.Object;
				users.length.should.be.greaterThan(0);
				// console.log('findUsersByEmail - users.length', users.length);
				var user = users[0];
				user.username.should.equal(email);
				done();
			});
		});

		it("should find the users by email", function (done) {
			var options = {};
			var email = dummyUser1.emails[0].email;
			options.email = email;
			User.findUsersByEmail(options, function (err, users) {
				should.not.exist(err);
				users.should.be.an.Array;
				users.length.should.be.greaterThan(0);
				var user = users[0];
				user.username.should.equal(email);
				done();
			});
		});

		it("should find users by univeral search", function (done) {
			var options = {};
			options.univeralSearch = FIRSTNAME_TO_UPDATE;
			User.findUsersByUniveralSearch(options, function (err, users) {
				should.not.exist(err);
				users.should.be.an.Array;
				users.length.should.greaterThan(0);
				// console.log('findUsersByUniveralSearch - kit user found', newUsers.length);
				done();
			});
		});

		it("should find user by id", function (done) {
			var options = {};
			options.id = dummyUser1._id;
			User.findUserById(options, function (err, user) {
				should.not.exist(err);
				user.should.be.an.Object;
				//console.log('findUserById', user);
				user._id.equals(options.id).should.be.true;
				done();
			});
		});

		it("should find users by user ids (1 id in array)", function (done) {
			var options = {};
			options.userIds = [dummyUser1._id];
			User.findUsersByIds(options, function (err, users) {
				should.not.exist(err);
				users.should.be.an.Array;
				users.length.should.equal(1);
				// console.log('findUsersByIds - one userId', newUsers.length);
				done();
			});
		});

		it("should find users by user ids (2 ids in array)", function (done) {
			var options = {};
			options.userIds = [dummyUser1._id, dummyUser2._id];
			User.findUsersByIds(options, function (err, users) {
				should.not.exist(err);
				users.should.be.an.Array;
				users.length.should.equal(2);
				// console.log('findUsersByIds - two userIds', newUsers.length);
				done();
			});
		});

		it("should find user by VerificationCode", function (done) {
			var options = {};
			options.verificationCode = UPDATED_VERIFICATION_CODE.code;
			User.findUserByVerificationCode(options, function (err, user) {
				should.not.exist(err);
				user.should.be.an.Object;
				user.verificationCode.code.should.equal(UPDATED_VERIFICATION_CODE.code);
				done();
			});
		});

		it("should fail to find user by VerificationCode", function (done) {
			var options = {};
			options.verificationCode = "NOT EXISTS VERIFICATION CODE";
			User.findUserByVerificationCode(options, function (err, user) {
				should.exist(err);
				err.should.equal(401);
				done();
			});
		});

		it("should find all users", function (done) {
			var options = {};
			User.findAllUsers(options, function (err, users) {
				should.not.exist(err);
				users.should.be.an.Array;
				users.length.should.be.greaterThan(0);
				// console.log('findAllUsers', newUsers.length);
				done();
			});
		});

		it("should find all imported users", function (done) {
			var options = {};
			User.findImportedUsers(options, function (err, users) {
				should.not.exist(err);
				users.should.be.an.Array;
				users.length.should.be.greaterThan(0);
				// console.log('findImportedUsers', newUsers.length);
				done();
			});
		});

		/*
		 * Password
		 */

		it("should find users by email and password", function (done) {
			var options = {};
			options.email = dummyUser1.emails[0].email;
			options.password = PASSWORD_TO_UPDATE;
			User.findUserByEmailAndPassword(options, function (err, users) {
				should.not.exist(err);
				users.should.be.an.Array;
				users.length.should.greaterThan(0);
				// console.log('findUserByEmailAndPassword', newUsers.length);
				done();
			});
		});

		it("should fail to find users by email and password (empty password)", function (done) {
			var options = {};
			options.email = dummyUser1.emails[0].email;
			options.password = '';
			User.findUserByEmailAndPassword(options, function (err, users) {
				should.exist(err);
				// console.log('findUserByEmailAndPassword - error msg', user);
				done();
			});
		});

	}); //find user account

	describe('find duplicate users', function () {
		it("should find duplicate users", function (done) {
			var options = {
				filterField : [],
				query : {}
			};
			User.findDuplicateUsers(options, function (err, duplicatedUsers) {
				should.not.exist(err);
				duplicatedUsers.should.be.an.Array;
				// console.log('findDuplicateUsers - find all', duplicatedUsers);
				done();
			});
		});

		it("should find duplicate users (email)", function (done) {
			var options = {
				filterField : ['email'],
				// query : {
					// email : 'don.lee@questwork.com'
				// }
			};
			User.findDuplicateUsers(options, function (err, duplicatedUsers) {
				should.not.exist(err);
				duplicatedUsers.should.be.an.Array;
				// console.log('findDuplicateUsers - by email', duplicatedUsers);
				done();
			});
		});

		it("should find duplicate users (lastNameAndCountry)", function (done) {
			var options = {
				filterField : ['lastNameAndCountry'],
				// query : {
					// lastName : 'Lee',
					// country : 'HK'
				// }
			};
			User.findDuplicateUsers(options, function (err, duplicatedUsers) {
				should.not.exist(err);
				duplicatedUsers.should.be.an.Array;
				// console.log('findDuplicateUsers - by name', duplicatedUsers);
				done();
			});
		});

	});

	describe('export to array', function () {
		var options = {};
		it("should export user list", function (done) {
			User.exportToArray(options, function (err, users) {
				// console.log('user', user);
				should.not.exist(err);
				users.should.be.an.Array;
				users.length.should.be.greaterThan(0);
				done();
			});
		});
	});

	describe('oauth2', function () {
	
		it("should update clients", function (done) {
			var options = {};
			options.conditions = {
				id : dummyUser1._id
			};
			options.update = {
				clients : [{
						clientId : 'A client id',
						name : 'My first OAuth client',
						redirectUri : 'http://myApp.com/oauth2/callback',
						secret : 'A client secret'
					}, {
						clientId: 'Another client id',
						name : 'My second OAuth client',
						redirectUri : 'http://myApp2.com/oauth2/callback',
						secret : 'Another client secret'
					}
				]
			}
			User.updateClientByUserId(options, function (err, user) {
				should.not.exist(err);
				user.clients.length.should.equal(2);
				done();
			});
		});

		it("should find client by clientId", function (done) {
			var options = {};
			options.clientId = 'A client id';
			User.findClientByClientId(options, function (err, client) {
				should.not.exist(err);
				client.should.be.an.Object;
				client.clientId.toString().should.equal(options.clientId);
				done();
			});
		});

		it("should find users by clientId", function (done) {
			var options = {};
			options.clientId = 'Another client id';
			User.findUserByClientId(options, function (err, user) {
				should.not.exist(err);
				user.should.be.an.Object;
				// console.log('findUserByClientId', newUsers.length);
				done();
			});
		});

		it("should get token string by auth code", function (done) {
			var authCode = {
				"clientId" : 'A client id',
				"userId" : dummyUser2._id,
				"code" : "WHATEVER",
				"redirectUri" : "http://myApp.com/oauth2/callback",
				"scopes" : ["__dev"]
			};
			User.getAccessTokenByAuthCode({authCode : authCode}, function (err, token) {
				should.not.exist(err);
				token.should.be.a.String;
				GENERATED_TOKEN = token;
				// console.log("token", token);
				done();
			});
		});
				
		it("authenticate user by token string", function (done) {
			var token = GENERATED_TOKEN;
			User.authenticateByToken(token, function (err, user) {
				should.not.exist(err);
				user.should.be.an.Object;
				user.accessTokens.length.should.greaterThan(0);
				// user.length.should.be.greaterThan(0);
				done();
			});
		});

	});

	describe('group', function () {

		it("should create group", function (done) {
			var userId = dummyUser1._id;
			var options = {
				groupName : "My first group"
			};
			User.findUserById({id : userId}, function (err, user) {
				should.not.exist(err);
				user.should.be.an.Object;
				user.createGroup(options, function (err, updatedUser) {
					should.not.exist(err);
					updatedUser.groups.length.should.equal(2);
					// console.log("updatedUser", updatedUser);
					CREATED_GROUP = updatedUser.groups[1];
					updatedUser.groups[1].isAdmin.should.equal(true);
					updatedUser.groups[1].isMember.should.equal(true);
					// console.log("CREATED_GROUP", CREATED_GROUP);
					done();
				});
			});
		});
		
		it("should fail to create group (same group name)", function (done) {
			var userId = dummyUser1._id;
			var options = {
				groupName : CREATED_GROUP.name
			};
			User.findUserById({id : userId}, function (err, user) {
				user.createGroup(options, function (err, updatedUser) {
					should.exist(err);
					// console.log("create (same group name) err msg - ", err);
					done();
				});
			});
		});

		it("should invite user to join group", function (done) {
			var options = {
				inviteeId : dummyUser2._id,
				groupName : CREATED_GROUP.name,
				ownerId : CREATED_GROUP.owner,
				created : CREATED_GROUP.created
			};
			User.findUserById({id : CREATED_GROUP.owner}, function (err, user) {
				user.inviteUserToJoinGroup(options, function (err, group) {
					// console.log("group", group);
					should.not.exist(err);
					group.isPending.should.equal(true);
					group.isMember.should.equal(false);
					group.isAdmin.should.equal(false);
					done();
				});
			});
		});

		it("should fail to invite user to join (same group invitation)", function (done) {
			var options = {
				inviteeId : dummyUser2._id,
				groupName : CREATED_GROUP.name,
				ownerId : CREATED_GROUP.owner,
				created : CREATED_GROUP.created
			};
			User.findUserById({id : CREATED_GROUP.owner}, function (err, user) {
				user.inviteUserToJoinGroup(options, function (err, group) {
					should.exist(err);
					err.should.be.a.String;
					done();
				});
			});
		});

	});
	
	describe('delete dummy users', function () {
		it("should fail to invite user to join (same group invitation)", function (done) {
			User.deleteUser({_id: {$in: [dummyUser1._id, dummyUser2._id]}}, function(err){
				should.not.exist(err);
				done();
			});
		});
	});

});
/*********************************************
 * End
*********************************************/