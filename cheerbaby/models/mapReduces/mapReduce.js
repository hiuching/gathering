/*********************************************
 * The MapReduce Class
 *
 * author: Hillary Wong
 * created: 2014-12-17T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

var MapReduceException = require('./mapReduceException');
var MapReduceResult = require('./mapReduceResult');

var MapReduce =  function (options) {
	options = options || {};
	this.lists = [];
  this.formatter = options.formatter;
}; 
 

/*********************************************
 * Custom Class Method (Static method)
 *********************************************/



/*********************************************
 * Custom instance Method
 *********************************************/

MapReduce.prototype.clear = function(){
	this.clearException();
  this.clearResult();
};
 
MapReduce.prototype.clearException = function(){
	this.mapReduceException().clear();
};

MapReduce.prototype.clearResult = function(){
	this.mapReduceResult().clear();
};



MapReduce.prototype.appendToChain = function(successor) {

	var len = this.lists.length;
	if (len > 0 ) {
		this.lists[len-1].setSuccessor(successor);
	}
	this.lists.push(successor);
};

MapReduce.prototype.mapReduceException = function() {
	return MapReduceException.getInstance(); // Singleton
};

MapReduce.prototype.mapReduceResult = function() {
	return MapReduceResult.getInstance(); // Singleton
};

MapReduce.prototype.handleRequest = function(request, callback) {
	if (this.lists.length > 0) {
		this.lists[0].handleRequest(request, callback);
	} else {
		callback('no MapReduce', {});
	}
};

MapReduce.prototype.next = function(request, callback) {
	if (this.successor != null) {
		this.successor.handleRequest(request, callback);
	} else {
    if (this.mapReduceException().isError()) {
      callback(this.mapReduceException().getException());
    } else {
    
      // var result = this.mapReduceResult().getResult();
      // this.formatter(result);
      callback(null, this.mapReduceResult().getResult());
    }
	}
};

MapReduce.prototype.setSuccessor = function(successor) { 
	this.successor = successor;
};




/*********************************************
 * Helper functions
 *********************************************/




/*********************************************
 * Export as a module
 *********************************************/
module.exports = MapReduce;