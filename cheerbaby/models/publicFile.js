/*********************************************
 * The PublicFile model
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

/*********************************************
 * Include modules
 *********************************************/
var arrayHelper = require('../lib/arrayHelper');
var path = require('path');
var fs = require('fs');
var fileHelper = require('../lib/fileHelper');



/*********************************************
 * Main Schema
 * 
 * e.g. 
    {

    }
 *********************************************/

var PublicFile = function (options) {
  options = options || {};
  
  var _id = options._id || null;
  var dataType = options.dataType || '';
  var data = options.data || [];
  
  this.getId = function () {
    return _id;
  };
};

    


/*********************************************
 * CONSTANT declaration
 *********************************************/


/*********************************************
 * Custom Class Method (Static method)
 *********************************************/

PublicFile.findAll = function (options, callback) {
  options = options || {};

  if (options.query) {
    var query = options.query;
    fileHelper.loadDir(options.folder, query, function (err, data) {
      if (err) {
        console.log(err);
        callback({code : 404, message : err});
      } else {
        if (query.view == 'rawdata') {
          callback(null, data);
        } else {
          callback(null, filterArray(data, {isPublish: true, isActive: true}));
          //callback(null, data);
        }
      }
    });
  } else {
    callback(null, []);
  }
};


PublicFile.findByConditions = function (options, callback) {
  options = options || {};

  if (options.folder) {
    fileHelper.loadDir(options.folder, {view: 'json'}, function (err, array) {
      if (err) {
        console.log(err);
		callback({code : 404, message : err});
      } else {
        callback(null, filterDocument(array, options.conditions));
      }
    });
  } else {
	callback({code : 404, message : []});
  }
};
  
  
PublicFile.findByIndex = function (options, callback) {
  options = options || {};
	
  if (options.id) {
    if (options.folder) {
      fs.readFile(path.join(options.folder, options.id + ".json"), function (err, data) {
	if (err) {
	  console.log(err);
	  callback(err);
	} else {
	  var json = JSON.parse(data);
	  callback(null, json);
	}
      }); //  fs.readFile
    } else {
		callback({code : 404, message : 'no folder'});
    }
  } else {
	callback({code : 404, message : 'no id'});
  }
};


PublicFile.getActiveItem = function (options, callback) {
  options = options || {};
  var array = options.row.data || [];
  var result = [];
  
  for (var ii = 0; ii < array.length; ii++ ){
     var row = array[ii];
    if (row.isActive == true && row.isPublish == true) {
		result.push(row);
    }
  } callback (null,result)
};


PublicFile.updateById = function (options, callback) {
  options = options || {};
	
  if (options.update) {
    fileHelper.updateFile(options.id, options.folder, options.update, callback);
  } else {
	callback({code : 500});
  }
};


PublicFile.add = function (options, callback) {
  var self = this;
  options = options || {};
  //console.log("options.idAttribute", options.idAttribute);
  if (options.update) { 
    var update = options.update;
    
    /* check if fileUploads */
    if (update.uploadFiles && update.uploadFiles.length > 0) {
      var uploadFiles = update.uploadFiles;
      delete update.uploadFiles;
    }
    self.findByIndex({id: options.update[options.idAttribute], folder: options.folder}, function (err, json) {
      if (err) {
        console.log(err);
        callback(err);
      } else {
        if (json) {
          // do nothing
		  callback({code : 404, message : 'duplicate'});
	  
	  
	  
	  
	  
	} else {
          var filepath = options.folder;
          fileHelper.addRecord(options.idAttribute, filepath, update, function (err, data) {
            if (err) {
              callback(err);
            } else {
              if (uploadFiles) {
                fileHelper.saveBase64File(options.datapath, uploadFiles, {path: data._id}, function (err, uploadedFiles) {
                if (err) {
                console.log(err);
                callback(err);
                }
                callback(err, data);
                });
              } else {
                callback(err, data);
              }
            }
          });
        }
      }
    });
  } else {

	callback({code : 500});
  }
};



/*********************************************
 * Custom instance Method
 *********************************************/




/*********************************************
 * Helper functions
 *********************************************/
 
var filterArray = function (data, options) {
  var returnArray = [];
  
  data.forEach(function (item, index) {
    var match = false;
    for (var prop in options) {
      if ((item[prop] ) && (item[prop] == options[prop])) {
        match = true;
        break;
      }
    }
    if (match) {
      returnArray.push(item);
    }
  });
  
  return returnArray;
};


var filterDocument = function (data, conditions) {
  var returnArray = [];
  data.forEach(function (doc, index) {
    var data = doc.data; // array

    for (var i in data) {
      // only get the latest isPublish = 1 and isActive = 1 data
      if ((data[i].isPublish && data[i].isPublish == true) && (data[i].isActive && data[i].isActive == true)) {
        var item = data[i];
	
	var match = 0;
	conditions.forEach(function (condition, index) {
	  for (var prop in condition) {
	    if ((item[prop] ) && (item[prop] == condition[prop])) {
	      match += 1;
		  break;
	    }
	  }
	  });
     }
	}
	
    if (match == conditions.length) {
      returnArray.push(doc);
    }
  });
  //console.log('returnArray',returnArray);
  return returnArray;
};

 
/*********************************************
 * Schema level indexes (compound index)
 * When creating an index, the number associated with a key specifies the direction of the index. The options are 1 (ascending) and -1 (descending)
 *********************************************/


/*********************************************
 * Virtual property getter (not persistent in DB)
 *********************************************/



/*********************************************
 * Virtual property setter
 *********************************************/

 



/*********************************************
 * Export as a module
 *********************************************/
module.exports = PublicFile;