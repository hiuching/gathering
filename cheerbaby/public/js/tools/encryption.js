define([
  "aes",
  "hmac-sha1",
  "enc-base64"
], 


function (CryptoJS) {

    var Encryption = {};
    
    Encryption.getToken = function (key, secret, callback) {
      var token = CryptoJS.HmacSHA1(key,secret).toString(CryptoJS.enc.Base64);
      callback(null, token);
    };
    
     Encryption.getAESEncryption = function (msg, key, callback){
      var encrypted = CryptoJS.AES.encrypt(msg, key);
      callback(null, encrypted);
    };
   
    return Encryption;
});