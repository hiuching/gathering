/*********************************************
 * The Email MapReduce
 *
 * author: Hillary Wong
 * created: 2014-12-17T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

/*********************************************
 * Include modules
 *********************************************/
var MapReduce = require('./mapReduce');

/*********************************************
 * CONSTANT declaration
 *********************************************/


/*********************************************
 * Class declaration
*********************************************/
var EmailMapReduce =  function(options) {
  options = options || {};
  this.base = MapReduce;
  this.base(options);
  this.query = options.query || {};
  this.conditioner = options.conditioner;
};

EmailMapReduce.prototype =  new MapReduce;

/*********************************************
 * Custom instance Method
 *********************************************/ 
 
EmailMapReduce.prototype.handleRequest = function (request, callback) {
	//console.log("query",this.query);
	var self = this;
	var conditions = {};
	conditions.map = function () {
		var self = this;
		this.emails.forEach(function (email) {
			var value = {
				label : 'email',
				count : 1,
				noOfMatch : 1,
				users : [self]
			};
			emit(email.email.toLowerCase(), value);
		});
	};
	conditions.reduce = function (key, values) {
		var reducedObject = {
			count : 0,
			noOfMatch : 0,
			users : []
		};
		values.forEach(function (value) {
			reducedObject.label = value.label;
			reducedObject.count += value.count;
			reducedObject.noOfMatch += value.noOfMatch;
			reducedObject.users = reducedObject.users.concat(value.users);
		});
		return reducedObject;
	};

		conditions.query = {
			'emails.email' : {
				$exists : true,
				$nin : ["", null]
			},
			'isActive' : true
		}; //eg{_type:Student}
	

	this.conditioner(conditions, function (err, duplicateEmailMapReduces) {
		if (err) {
			console.log("mapReduceEmailMapReduceErr", err);
			self.next(request, callback);
		} else {

			//console.log("duplicateEmailMapReduces",duplicateEmailMapReduces);
			self.mapReduceResult().addResult('email', duplicateEmailMapReduces);
			// self.mapReduceFilterException().pushUniqueId(duplicateEmailMapReduces);
			self.next(request, callback);
		}

	});

};
/*********************************************
 * Helper functions
 *********************************************/

 


/*********************************************
 * Export as a module
 *********************************************/
module.exports = EmailMapReduce;