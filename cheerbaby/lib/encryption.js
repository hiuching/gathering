/*********************************************
 * Encryption library
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/


/*********************************************
 * Include modules
 *********************************************/
var crypto = require('crypto') ;



/*********************************************
 * Functions
 *********************************************/


var hashPassword = function (value) {
  return crypto.createHash('sha1').update(value).digest('HEX');
};



/*********************************************
 * Main
 *********************************************/
var encryption =  {
};

encryption.getAESDecryption = function (encrypted, secret, callback){
      var decrypted = crypto.AES.decrypt(encrypted, secret);
	  callback(null, decrypted);

};

encryption.getRandomSalt = function (length) {
  var chars = 'abcdefghijklmnopqrstuvwxyz0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  var result = '';
  for (var i = length; i > 0; --i) {
    result += chars[Math.round(Math.random() * (chars.length - 1))];
  }
  return result;
};


encryption.getRandomString = function (length, chars) {
    var mask = '';
        if (chars.indexOf('a') > -1) mask += 'abcdefghijkmnpqrstuvwxyz';
        if (chars.indexOf('A') > -1) mask += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.round(Math.random() * (mask.length - 1))];
    return result;
};


encryption.getToken = function (key, secret, callback) {
  var token = crypto.createHmac('sha1', secret).update(key).digest('base64');
  //console.log(token);
  callback(null, token);
};


encryption.setHashPassword = function (value) {
	//var salt = this.getRandomSalt(16);
	// this.set({
		// 'salt': salt,
		// 'hash_password': hashPassword(value + salt)
	// });
	return value;
};



/*********************************************
 * Export as a module
 *********************************************/
module.exports = encryption;

