/*********************************************
 * Cookie module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

;define([
  "jquery",
  "underscore",
  "backbone",
  "jquery.cookie"
],
function($, _, Backbone, cookie){

/*********************************************
 * Configurations
 *********************************************/
  var module = "cookie";
  var configs = {};
    
    
/*********************************************
 * Main function (export)
 *********************************************/
  var Cookie = Backbone.Model.extend({
    defaults: {
      "alias": "",
      "lang": "",
      "module": "",
      "page": 1,
			"district" : "",
			"region" : "",
      "prev1": null
    },
   
    initialize: function(){
      configs[module] = {
        name: 'QuestCMS'
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());
      //console.log(configs[module]['name']);
      this.load();
    },
     
    save: function(options){
      var prev1 = this.toJSON();
      delete prev1.prev1;
      this.set({prev1: prev1});
      this.set(options);
      $.cookie(configs[module]['name'], JSON.stringify(this.toJSON()), {expires:7, path: "/"});  
    },
    
    load: function(){
      var token;
      if (typeof $.cookie(configs[module]['name']) !== 'undefined') {
        token = JSON.parse($.cookie(configs[module]['name']));
        this.set(token);
      }
    },
		
		isEng: function () {
			return (this.get('alias') == 'en-us');
		},
		
		isChi: function () {
			return (this.get('lang') == 'zh-hant');
		},
		
		isChangedLang: function () {
			return (this.get('lang') != this.get('prev1').lang);
		}
  })
    

/*********************************************
 * Return
 *********************************************/
  return Cookie;
 
});