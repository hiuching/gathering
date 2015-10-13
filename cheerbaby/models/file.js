/*********************************************
 * The File model
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/


/*********************************************
 * Include modules
 *********************************************/
var fileHelper = require('../lib/fileHelper');
var amazonHelper = require('../lib/amazonHelper');
var objectHelper = require('../lib/objectHelper');
var arrayHelper = require('../lib/arrayHelper');
var fs = require('fs');
var mime = require('mime');
/*********************************************
 * Mail Class
 *********************************************/
var File = {};


/*********************************************
 * CONSTANT declaration
 *********************************************/



/*********************************************
 * Include models
 *********************************************/
var PermissionManager = require('./permissions/permissionManager');
var permissionManager = new PermissionManager();


/*********************************************
 * Custom Class Method (Static method)
 *********************************************/
File.removeFile = function (options, callback) {
	var file = options.file;
	
	fs.exists(file.fullFilepath, function (exists) {
		if (exists) {
			fs.unlink(file.fullFilepath, function (err) {
				if (err) {
					callback(err);
				} else if (options.deleteFromAmazon) {
					amazonHelper.removeFileFromAmazonS3(file, function (err, data) {
						callback(null, {});
					});
				} else {
					callback(null, {});
				}
			});
		} else {
			callback({code: 404, message: 'File not found'})
		}
	});
};


File.findFiles = function (options, callback) {
	var query = options.query;
	var user = options.user;
	var permission = permissionManager.createChain();

	if (query.action == "getFileByFullPath") {

		console.log('Getting file...');
		File.getFileByFullPath(options, callback);

	} else if (query.action == "findFilesByFolder") {

    permission.fileAdminGet.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
      		console.log('Finding files in folder...');
      		File.findFilesByFolder(options, callback);

				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	} else if (query.action == "findAdminFilesByFolder") {

    permission.fileAdminGet.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
      		console.log('Finding admin files in folder...');
      		File.findAdminFilesByFolder(options, callback);

				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	} else if (query.action == "findAllFoldersAndUploadToAmazon") {

    permission.uploadFileToAmazon.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('Finding all files and uploading to amazon ...');
					File.findAllFoldersAndUploadToAmazon(options, callback);

				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});

	} else if (query.action == "findFolderAndUploadToAmazon") {

    permission.uploadFileToAmazon.handleRequest({user : user}, function (err, allow) {
			if (err) {
				callback(err);
			} else {
				if (allow) {
					console.log('Finding file and uploading to amazon ...');
					File.findFolderAndUploadToAmazon(options, callback);

				} else {
					callback({code: 401, message : 'unauthorized user'})
				}
			}
		});


	} else {
		callback(null, 'Wrong report type input');
	}
};


File.getFileByFullPath = function (options, callback) {
  options = options.query || {};

  fs.exists(options.fullFilepath, function (exists) {
    if (exists) {
      fs.readFile(options.fullFilepath, function (err, file) {
        if (err) {
          callback(err);
        } else {
          outputReport(options, file, callback);
        }
      });
    } else {
      callback(null, 'No this folder or file');
    }
  });
};

File.findFilesByFolder = function (options, callback) {
  options = options.query || {};
	options.isAdmin = false;
	
	findFiles(options, callback);
};

File.findAdminFilesByFolder = function (options, callback) {
  options = options.query || {};
	options.isAdmin = true;
	
	findFiles(options, callback);
};


File.findAllFoldersAndUploadToAmazon = function (options, callback) {
  options = options.query || {};
  var path = './data/memberFiles/';
  var self = this;

  findAllFilesExceptHiddenFilesInFolder({path: path}, function (err, folderNames) {
    if (err) {
      callback(err);
    } else {
      if (folderNames.length > 0) {
        var loopFolderNames = function (folderName, done) {
          findAllFilesInFolderAndUploadToAmazon({path: path + folderName, userId: folderName}, done);
        };

        arrayHelper.walkArray(folderNames, {}, loopFolderNames, callback);
      } else {
        callback(null, 'No Files in memberFiles');
      }
    }
  });
};

File.findFolderAndUploadToAmazon = function (options, callback) {
  options = options.query || {};

  fs.exists(options.path, function (exists) {
    if (exists) {
      findAllFilesInFolderAndUploadToAmazon({path: options.path, userId: options.userId}, callback);
    } else {
      callback(null, 'No This Folder');
    }
  });
};

/*********************************************
 * Helper functions
 *********************************************/
var formatFile = function (files, options, callback) {
	options = options || {};
	files = files || [];
	var returnFiles = [];

	if (files.length > 0) {
		files.forEach(function (file) {
			fs.stat(options.path + '/' + file, function (err, stats) {
				if (err) {
					callback(err);
					return false;
				} else {
					var filenames = file.split('.');
					if (filenames.length > 2) {
						returnFiles.push({filename: file, memberId: filenames[0], vendorCode: filenames[1], timestamp: stats.mtime, fullFilepath: options.path + '/' + file});
					} else {
						returnFiles.push({filename: file, timestamp: stats.mtime, fullFilepath: options.path + '/' + file});
					}

					if (returnFiles.length == files.length) {
						callback(null, returnFiles);
					}
				}
			});
		});
	} else {
		callback(null, []);
	}
};


var findFiles = function (options, callback) {
	var filenames = options.filenames || [];
	
	fs.exists(options.path, function (exists) {
		if (exists) {
			findAllFilesExceptHiddenFilesInFolder({path: options.path}, function (err, _filenames) {
				if (err) {
					callback(err);
				} else {
					if (_filenames.length > 0) {
						var matchedFiles = _filenames.filter(function (_filename) {
							if (options.isAdmin) {
								return (filenames.indexOf(_filename) == -1);
							} else {
								return (filenames.indexOf(_filename) !== -1);
							}
						});

						formatFile(matchedFiles, options, callback);
					} else {
						callback(null, []);
					}
				}
			});
		} else {
			callback(null, []);
		}
	});
};

var outputReport = function (options, dataArray, callback) {
	options = options || {};
  var filename = options.filename || 'report';

	var report = {
		filename:  filename,
		data: dataArray,
	};

  report.contentType = mime.lookup(options.fullFilepath);
  if (report.contentType == 'application/pdf' || report.contentType.indexOf('image') !== -1) {
    report.displayType = 'inline';
  } else {
    report.displayType = 'attachment';
  }

	callback(null, report);
};



var findAllFilesExceptHiddenFilesInFolder = function (options, callback) {
  options = options || {};

  fs.exists(options.path, function (exists) {
    if (exists) {
      fs.readdir(options.path, function (err, files) {
    		if (err && err.code == 'ENOENT') { // File not exists
    			callback(null, []);
    		} else if (err) {
    			callback(err);
    		} else {
    			if (files.length > 0) {
    				var notHiddenFiles = files.filter(function (file) {
    						return (file.indexOf('.') !== 0);
    				});
            callback(null, notHiddenFiles);
    			} else {
    				callback(null, []);
    			}
    		}
    	});
    } else {
      callback(null, 'No This Folder');
    }
  });
};



var findAllFilesInFolderAndUploadToAmazon = function (options, callback) {
  var User = require('./user');
  options = options || {};

  findAllFilesExceptHiddenFilesInFolder({path: options.path}, function (err, filenames) {
    if (err) {
      callback(err);
    } else {
      if (filenames.length > 0) {
        var _fileDetails = [];

        var _uploadFileToAmazonS3 = function (filename, done) {
          var filepath = options.path + '/' + filename;
          /* check file whether uploaded to amazon, if yes -> skip, no -> upload */
          User.checkFileWhetherUploadedToAmazon({userId: options.userId, filename: filename}, function (uploaded) {
            if (uploaded) {
              done(null, filename);
            } else {
              /* get the file timestamp since there are no save timestamp at the beginning */
              fs.stat(filepath, function (err, stats) {
                if (err) {
                  done(err);
                } else {
                  /* get the file buffer */
                  fs.readFile(filepath, function (err, file) {
                    if (err) {
                      done(err);
                    } else {
                      var contentType = mime.lookup(filepath);
                      var data = {
                        fileBuffer: {
                          data: file
                        },
                        uploadFile: {
                          userId: options.userId,
                          contentType: contentType
                        }
                      };
                      amazonHelper.uploadFileToAmazonS3(data, function (err, amazonFile) {
                        if (err) {
                          done(err);
                        } else {
                          _fileDetails.push({filename: filename, amazonUrl: amazonFile.url, amazonFilename: amazonFile.name, timestamp: stats.mtime});
                          done(null, filename);
                        }
                      });
                    }
                  });
                }
              });
            }
          });
        };
        arrayHelper.walkArray(filenames, {}, _uploadFileToAmazonS3, function (err, amazonDetails) {
          if (err) {
            callback(err);
          } else {
            if (_fileDetails.length > 0) {
              User.updateAmazonFileURL({userId: options.userId, fileDetails: _fileDetails}, callback);
            } else {
							callback(null, options.userId + ' has no files');
            }
          }
        });
      } else {
        callback(null, 'No Files in memberFiles');
      }
    }
  });
};

/*********************************************
 * File as a module
 *********************************************/
module.exports = File;
