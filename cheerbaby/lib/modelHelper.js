/*
 * author: Don Lee
 * date: 2013-09-12T13:11:00Z
 *
 * Class: modelHelper
 */

/*********************************************
 * Include modules
 *********************************************/
var fileHelper = require('../lib/fileHelper');
var objectHelper = require('../lib/objectHelper');
var path = require('path');


/*********************************************
 * Main
 *********************************************/
var modelHelper =  {
};





/*********************************************
 * load sample data functions
 *********************************************/

/*
 * get the sample data from specified folder
 * 
 * @param {Object} options       {folder: folder, view: 'dataonly'}
 * @param {Function} callback    Callback(err, dataArray) 
 */
modelHelper.getSampleDataCallback = function (options, callback) {
  var self = this;
	options = options || {};

	if (options.folder) {
    fileHelper.loadDir(path.join('data', options.folder), options, function (err, data) {
      if (err) {
        console.log(err);
        callback(404);
      } else {
        callback(null, data);
      }
    });
	}
};

 
/*
 * Callback function to read sample data from folder and then insert or update it to mongo db
 * 
 * @param {String} folder       load data from this folder
 * @param {Function} callback    Callback(err, numberAffected, raw) 
 */
modelHelper.loadSampleDataCallback = function (classModel, options, callback) {
	this.getSampleDataCallback(options, function (err, dataArray) {
		if (err) {
			console.log(err);
			callback(err);
		} else {
      //console.log('dataArray',dataArray);
			var count = dataArray.length;
      var keycount = options.keys.length;
      var query = {};
			for (var ii = 0; ii < count; ii++) {
				var data = dataArray[ii];
        for (var jj=0; jj < keycount; jj++) {
          query[options.keys[jj]] = data[options.keys[jj]];
        }
				classModel.update(query, data, { upsert: true }, callback);
			}
		}
	});
};


/*
 * read sample data from folder and then insert or update it to mongo db
 * 
 * @param {Object} options        folder (String) folder name
 *                                keys ([String]) field name of the model to be checked
 */
modelHelper.loadSampleData = function (classModel, options) {
  options = options || {};
  options.view = options.view || 'dataonly';
	this.loadSampleDataCallback(classModel, options, function (err, numberAffected, raw) {
    //console.log(err, numberAffected, raw);
		if (err) {
			console.log(err);
		} else {
			if (numberAffected) {
				console.log('saved', numberAffected);
			} else {
				console.log('nothing to save');
			}
		}
	});
};







/*
 * read sample data from folder and then insert or update it to mongo db
 * 
 * @param {String} folder       load data from this folder
 */
modelHelper.addOrUpdate = function (model, rtnModel) {

      if (! rtnModel) {
				console.log('not found');
        model.save( function (err, model, numberAffected) {
          if (err) {
            console.log(err);
          } else {
            console.log('added');
          }
        });
			} else {
        console.log('found');
        rtnModel = objectHelper.mergeModels(rtnModel, model);
        rtnModel.save(function (err, rtnModel, numberAffected) {
          if (err) {
            console.log(err);
          } else {
            console.log('updated');
          }
        });
			}

};



module.exports = modelHelper;


