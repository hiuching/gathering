/*********************************************
 * Config file
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
;define([
  "jquery",
  "underscore",
  "backbone"
],
function($, _, Backbone){
    
/*********************************************
 * Backbone Model
 *********************************************/
  var Config = Backbone.Model.extend({
    defaults: {
      "skipAuthentication": false,
      // "apiKey": "sdu93nln3uk0kas",
      // "apiSecret": "kumhsds0f93n489",
      "proto": "http://",
			"host": "127.0.0.1",
      "port": "8004",
    }
  });




/*********************************************
 * Return
 *********************************************/
  return Config;
 
});
