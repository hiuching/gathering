var AWS = require('aws-sdk');
var mime = require('mime');

var amazonHelper = {};

amazonHelper.uploadFileToAmazonS3 = function (options, callback) {
	var self = this;
  var s3 = new AWS.S3();
  var fileFormat = mime.extension(options.uploadFile.contentType);
  var timestamp = new Date().getTime().toString().split("").reverse().join("");
  var amazonFilename = timestamp + '.' + options.uploadFile.userId + '.' + fileFormat;
  var bucket = options.bucket || 'cheerbaby';
  /* ACL:'public-read'  <-- add this to putObject params can set this file to public (haven't test)  */

  var params = {Bucket: bucket, Key: amazonFilename, Body: options.fileBuffer.data, ContentType: options.uploadFile.contentType};

  s3.putObject(params, function(err, data) {
		if (err) {
			console.log('Uploading file to Amazon S3 Error: ', err);
			console.log('amazonFilename: ', amazonFilename);
			console.log('filename: ', options.uploadFile.name);
			callback(err);
		} else {
			var param = {Bucket: bucket, Key: amazonFilename, Expires: 315360000};	//Expires: 10 years
			self.getSignedUrl(param, function (err, fileDetail) {
				if (err) {
					console.log('Getting signed url error: ', err, ', Key: ', param.Key);
					callback(err);
				} else {
					callback(null, fileDetail);
				}
			});
		}
  });
};

amazonHelper.getSignedUrl = function (options, callback) {
	options = options || {};
  var s3 = new AWS.S3();
	
	s3.getSignedUrl('getObject', options, function (err, url) {
		if (err) {
			callback(err);
		} else {
			callback(null, {url: url, name: options.Key});
		}
	});
};


amazonHelper.removeFileFromAmazonS3 = function (options, callback) {
  var s3 = new AWS.S3();
  var bucket = options.bucket || 'cheerbaby';
  var params = {
		Bucket: bucket, 
		Key: options.amazonFilename
	};

  s3.deleteObject(params, function(err, data) {
		if (err) {
			console.log('removeFileFromAmazonS3 Error: ', err, ', filename: ', options.amazonFilename);
			callback(err);
		} else {
			callback(null, data);
		}
  });
};


module.exports = amazonHelper;