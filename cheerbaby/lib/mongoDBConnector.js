var mongoose = require('mongoose');

/*
 * author: Don Lee
 * date: 2013-09-12T13:11:00Z
 *
 * Class: mongoDBConnector
 */
var mongoDBConnector =  {
};


mongoDBConnector.checkAndConnect = function (db) {
	if (mongoose.connection.readyState == 0) {
		/* connected to Mongo DB */
		this.init(db);
		this.connect();
	}
};

mongoDBConnector.connect = function () {
  var self = this;
  this.uri = 'mongodb://' + this.host + ':' + this.port + '/' + this.dbname;
  var options = {
    user: this.user,
    pass: this.password
  };
 
  // connect to mongodb
  //return mongoose.createConnection(this.uri, options);
  
  /* with authentication */
	if (!this.skipUserAuthentication) {
    this.url = 'mongodb://' + this.user + ':' + this.password + '@' + this.host + ':' + this.port + '/' + this.dbname;
	} else {
    this.url = 'mongodb://' + this.host + ':' + this.port + '/' + this.dbname;
	}
  
  //console.log(this.url);
  mongoose.set('debug', this.debug);
  return mongoose.connect(this.url, function (err, res) {
    if (err) {
      console.log('Error connecting to MongoDB: ' + err);
    } else {
      console.log('Connected to MongoDB at ' + self.host + ' ' + self.dbname);
    }
  });

};

mongoDBConnector.init = function (db) {
  this.host = db.host;
  this.port = db.port;
  this.user = db.user;
  this.password = db.password;
  this.dbname = db.dbname;
  this.debug = db.debug;
	this.skipUserAuthentication = db.skipUserAuthentication;
};

mongoDBConnector.setDBName = function (dbName) {
  this.dbname = dbName;
}

module.exports = mongoDBConnector;
