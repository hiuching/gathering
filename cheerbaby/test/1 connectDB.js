var CONFIG = require('../config/config');
var mongoDBConnector = require('../lib/mongoDBConnector');

var should = require("should");

describe("connect to DB", function () {
	it("should success", function (done) {
		mongoDBConnector.init(CONFIG.mongoDB);
		mongoDBConnector.connect();
		done();
	});
});