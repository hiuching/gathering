/*********************************************
 * The importUser test model
 *
 * author: Hillary Wong
 * created: 2015-01-20T15:16:00Z
 * modified: 2015-01-20T15:16:00Z
 *
 *********************************************/

var should = require("should");

/*********************************************
 * Test Configurations
 *********************************************/
var CONFIG = require('../config/config');
/*********************************************
 * Include modules
 *********************************************/
 var ImportUser = require('../models/importUser');
 var mongoose = require('mongoose'), Schema = mongoose.Schema;

/*********************************************
 * DB connection
 *********************************************/


/*********************************************
 * Sub-document Schema
 *********************************************/
/*********************************************

 *********************************************/

/*********************************************
 * Tests
 *********************************************/
describe('importUser-models', function () {
	this.timeout(5000);
	var user = {
		username:'',
		email : ['primary:quest456@gmail.com'],
		gender : 'F',
		isActive : true,
		title : 'Mrs',
		zip : '852',
		phones : ['primary:852--23456789'],
		address : "HK-CN"
	};
	it("importUser", function (done) {
		var importUser = new ImportUser(user);
		importUser.readyUserForImport(function (err, invalidUser) {
			importUser.should.be.an.Object;
			importUser.emails[0].email.should.eql('quest456@gmail.com');
			importUser.username.should.eql('quest456@gmail.com');
			importUser.gender.should.eql('F');
			importUser.isActive.should.be.eql('true');
			importUser.phones[0].number.should.eql('23456789');
			importUser.title.should.eql('Mrs');
			console.log('importUser', importUser);
			done();
		});
	});

	it("invalid gender'male'", function (done) {
		user.gender = 'Male';
		var importUser = new ImportUser(user);
		importUser.readyUserForImport(function (err, invalidUser) {
			err.should.be.true;
			importUser.should.be.an.Object;
			invalidUser.gender.should.eql('Male');
			done();
		});
	});

	it("invalid gender 'f'", function (done) {
		user.gender = 'f';
		var importUser = new ImportUser(user);
		importUser.readyUserForImport(function (err, invalidUser) {
			err.should.be.true;
			importUser.should.be.an.Object;
			invalidUser.gender.should.eql('f');
			done();
		});
	});

	it("invalid isActive 't' ", function (done) {
		user.isActive = 't';
		var importUser = new ImportUser(user);
		importUser.readyUserForImport(function (err, invalidUser) {
			err.should.be.true;
			importUser.should.be.an.Object;
			invalidUser.isActive.should.eql('t');
			done();
		});
	});

	it("invalid title 'Miss'", function (done) {
		user.title = 'Miss';
		var importUser = new ImportUser(user);
		importUser.readyUserForImport(function (err, invalidUser) {
			err.should.be.true;
			importUser.should.be.an.Object;
			invalidUser.title.should.eql('Miss');
			done();
		});
	});

});
	
 
 

/*********************************************
 * End
 *********************************************/