var path = require('path');
var fs = require('fs');
var amazonHelper = require('./amazonHelper');

/*
 * author: Don Lee
 * date: 2013-09-12T13:11:00Z
 *
 * Class: fileHelper
 */
var fileHelper =  {
};


fileHelper.addRecord = function (idAttribute, filepath, update, callback) {
  var self = this;
  fs.readdir(filepath, function (err, files) {
    if (err) {
      fs.mkdir(filepath, function (err) {
        update[idAttribute] = 1;
        self.writeRecord(idAttribute, filepath, update, callback);
      });
    } else if(idAttribute){
	self.writeRecord(idAttribute, filepath, update, callback);

	} else {
      // set id = max. of existing files
      self.getMaxFilename(files, function (err, id) {
        update[idAttribute] = id;
        self.writeRecord(idAttribute, filepath, update, callback);
      });
    }
  });
};



fileHelper.filterMap = function (array, options, filter, callback) {
    options = options || {};
    var counter = array.length;

    if (counter > 0) {
      var new_array = [];
      array.forEach(function (item, index) {

          filter(item, function (err, content) {
            if (err) { callback(err); return; }
            if ((item.indexOf('.') != 0) && (item.indexOf('.template') == -1)) {
              var doc = JSON.parse(content);
              // newly added to emulate couchdb data structure
              if ((options.view == 'rawdata') || (options.view == 'plainObject') || (options.view == 'json')){
                  //new_array[index] = doc;
                  new_array.push(doc);
              } else if (options.view == 'dataonly') {
                var data = doc.data;

                for (var i in data) {
                  //console.log(data[i]);
                    var result = data[i];
                    // get the last data array item
                    //for (var prop in data[i]) {
                    //  result[prop] = data[i][prop];
                    //}
                    new_array.push(result);
                }
              } else {
                var data = doc.data; // array
                for (var i in data) {
                  // only get the latest isPublish = 1 and isActive = 1 data
                  if ((data[i].isPublish && data[i].isPublish == true) && (data[i].isActive && data[i].isActive == true)) {
                    var result = data[i];
                    result._id = doc._id;
                    //for (var prop in data[i]) {
                    //  result[prop] = data[i][prop];
                    //}
                    new_array.push(result);
                  }
                }
              }
            }


            //console.log(new_array);
            counter--;
            if (counter === 0) {
              //new_array.length = array.length;
              callback(null, new_array.filter(function (item) {
                return typeof item !== 'undefined';
              }));
            }
          });


      });
    } else {
      callback(null, []);
    }

};



fileHelper.getMaxFilename = function (filenames, callback) {
    var max = 1;
    var ii = 1;
    var len = filenames.length;
    if (len > 0) {
      filenames.forEach(function (filename) {
        if ((filename.indexOf('.') != 0) && (filename.indexOf('.template') == -1)) {
          max = Math.max(max, parseInt(filename, 10));
          if (len == ii) {
            callback(null, max+1);
          }
        }
        ii++;
      });
    } else {
      callback(null, 1);
    }
};

fileHelper.getMaxId  = function(options, callback){
	self = this;
  options = options || {};

  if (options.folder) {
    fs.readdir(options.folder, function (err, files) {
      self.getMaxFilename(files, callback);
    });
  } else {
    callback('no folder');
  }
};



fileHelper.loadDir = function (folder, options, callback) {
    var self = this;

    fs.readdir(folder, function (err, filenames) {
      if (err) { callback(err); return; }
      self.filterMap(filenames, options, function (filename, done) {
        fs.stat(path.join(folder, filename), function (err, stat) {
          if (err) { done(err); return; }
          if (stat.isFile()) {
            fs.readFile(path.join(folder, filename), done);
            return;
          }
          done();
        });
      }, callback); // filterMap

    });
};




fileHelper.removeDir = function (targetPath, callback) {
  var self = this;
  fs.readdir(targetPath, function (err, files) {
		console.log(err, files);
    if (err) {
      callback(err);
    } else {
      if (files.length === 0) {
        callback(null);
      } else {
        var counter = files.length;
        files.forEach(function (file, index) {
          var filePath = path.join(targetPath, file);
          fs.stat(filePath, function (err, stats) {
            if (err) {
              callback(err);
            } else {
              if (stats.isFile()) {
                fs.unlink(filePath, function (err) {
                  if (err) {
                    callback(err);
                  }
                });
              }
              if (stats.isDirectory()) {
                self.removeDir(filePath, callback);
              }
            }
          });

          counter--;
          if (counter === 0) {
            callback(null);
          }
        });
      }
    }
  });
};

fileHelper.saveBase64File = function (dataPath, uploadFiles, options, callback) {
  options = options || {};
  var self = this;

  var arrayHelper = require('../lib/arrayHelper');
  var filepath = path.join(dataPath, uploadFiles[0].path);
  if (options.path) {
    filepath = path.join(filepath, options.path);
  }
  fs.exists(filepath, function (exists) {
    if (exists) {
      arrayHelper.walkArray(uploadFiles, {}, function (uploadFile, done) {
        self.saveBase64FileToPath(filepath, uploadFile, options, done);
      }, callback); // filterMap
    } else {
			if (!fs.existsSync(path.dirname(filepath))) {
				fs.mkdirSync(path.dirname(filepath));
			}
      fs.mkdir(filepath, function (err) {
				if (err) {
					callback(err);
				} else {
					arrayHelper.walkArray(uploadFiles, {}, function (uploadFile, done) {
						self.saveBase64FileToPath(filepath, uploadFile, options, done);
					}, callback); // filterMap
				}
      });
    }
  });
};

fileHelper.saveBase64FileToPath = function (filepath, uploadFile, options, done) {
  options = options || {};
  var self = this;

  var fullFilename = path.join(filepath, uploadFile.name);
	fullFilename = fullFilename.replace(/[\\]/g, '/');
	if (uploadFile.base64encoded && uploadFile.base64encoded != '') {
		var fileBuffer = self.decodeBase64String(uploadFile.base64encoded);
		if (fileBuffer.data) {
			fs.writeFile(fullFilename, fileBuffer.data, function (err) {
				if (err) { done(err); return; }

        if (options.saveToAmazon) {       /* Start Upload to Amazon */
          amazonHelper.uploadFileToAmazonS3({fileBuffer: fileBuffer, uploadFile: uploadFile}, function (err, amazonFile) {
            if (err) {
              done(null, {path: uploadFile.path, name: uploadFile.name, fullFilename: fullFilename});
            } else {
              done(null, {path: uploadFile.path, name: uploadFile.name, fullFilename: fullFilename, amazonUrl: amazonFile.url, amazonFilename: amazonFile.name});
            }
          });
        } else {
		       done(null, {path: uploadFile.path, name: uploadFile.name, fullFilename: fullFilename});
        }
			});
		} else {
			done('Invalid input string');
		}
	} else {
		done(null, {path: uploadFile.path, name: uploadFile.name, fullFilename: fullFilename});
	}
};

fileHelper.decodeBase64String = function (dataString) {
  var matches = dataString.match(/^data:([A-Za-z-+\/.]+);base64,(.+)$/) || [];
  var buffer = {};

  if (matches.length !== 3) {
    return new Error('Invalid input string');
  }

  buffer.type = matches[1];
  buffer.data = new Buffer(matches[2], 'base64');

  return buffer;
}


fileHelper.saveFile = function (filepath, id, filedata, ext, callback) {
    fs.writeFile(filepath + "/" + id + "." + ext,  filedata, function (err) {
        if (err) {
          callback(err);
        } else {
          callback(null, filedata);
        }
    });
};



fileHelper.updateFile = function (id, filepath, update, callback) {
  var self = this;
  var strData = JSON.stringify(update);

  fs.exists(filepath, function (exists) {
    if (exists) {
      self.saveFile(filepath, id, strData, 'json', function (err, data) {
        if (err) {
          callback(500);
        } else {
          var json = JSON.parse(data);
          delete json.password;
          data = JSON.stringify(json);
          callback(null, data);
        }
      });
    } else {
      fs.mkdir(filepath, function (err) {
        self.saveFile(filepath, id, strData, 'json', function (err, data) {
          if (err) {
            callback(500);
          } else {
            var json = JSON.parse(data);
            delete json.password;
            data = JSON.stringify(json);
            callback(null, data);
          }
        });
      });
    }
  });

};



fileHelper.writeRecord = function (idAttribute, filepath, update, callback) {
  var self = this;
  var strData = JSON.stringify(update);
  self.saveFile(filepath, update[idAttribute], strData, 'json', function (err, data) {
    if (err) {
      callback(500);
    } else {
      callback(null, data);
    }
  });
};


module.exports = fileHelper;
