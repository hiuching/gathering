/*********************************************
 * Reset module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
 
;define([
  "marionette",
	"ladda",
  "encryption",
  "core/admin",
  "core/adminmenu",
  "text!tpl/reset.html"
],

function (Marionette, ladda, encryption, Admin, AdminMenu, templateString) {


/*********************************************
 * Templates
 *********************************************/

    var tplForgotView = $('#ForgotView', '<div>' + templateString + '</div>').html();

    
/*********************************************
 * Configurations
 *********************************************/
    var module = "reset";
    var configs = {};

    var cachedCollection;
    
/*********************************************
 * Main function (export)
 *********************************************/

    var Reset = function () {
      var self = this;
      configs[module] = {
        dataType: module,
        region: 'contentRegion'
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());
      pageSize = configs[module]['itemPerRow'] * configs[module]['numOfRow'];
      limit = pageSize * configs[module]['pagePerSection'] + 1;
      //console.log('new Reset');

      
      /*********************************************
       * Listening events
       *********************************************/
      
      
      /* common events */

      QuestCMS.vent.on(module + ":password", function (alias) {
        forgotPassword();
      });

      
      
      
      /* events trigger by other modules */
      
      
      /* events trigger by this modules*/


      
    };




/*********************************************
 * Backbone Model
 *********************************************/
    var ModuleItem = Backbone.Model.extend({
      initialize: function () { this.options = configs; }, 
      urlRoot: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/' + module; },
      idAttribute: '_id',
      defaults: function () {
        return {
          username: "",
          email: ""
        };
      },
      isValid: function () {
        return this.isValidEmail() && this.isValidUsername();
      },
      isValidEmail: function () {
        return this.get('email') && (this.get('email') != "");
      },
      isValidUsername: function () {
        return this.get('username') && (this.get('username') != "");
      }
    });


/*********************************************
 * Backbone Collection
 *********************************************/
    var ModuleCollection = Backbone.Collection.extend({
      initialize: function () { this.options = configs; },  
      url: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/' + module; },
      model: ModuleItem
    });

    
    
/*********************************************
 * Backbone Marionette ItemView
 *********************************************/

    var ModuleForgotView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplForgotView),
			onShow: function () {
				this.submitButton = ladda.create( document.querySelector('.reset-submit') );
			},
      events: {
        'change' : 'change',
        'click .reset-cancel'    : 'cancel',
        'click .reset-submit'    : 'submit',
        'submit'    : 'submit'
      },
      cancel: function (e) {
        e.preventDefault();
        QuestCMS.vent.trigger('routing:resolve', '');
      },
      change: function (e) {
        e.preventDefault();
        var input = {target: e.target};
        var change = QuestCMS.Utils.inputChange(input);
        this.model.set(change, {silent: true});
      },
      submit: function (e) {
        e.preventDefault();
				if (!this.submitButton.isLoading()) {
					this.submitButton.start();
					resetPassword({model: this.model, submitButton: this.submitButton});
				}
      }
    });

    
/*********************************************
 * Backbone Marionette CompositeView
 *********************************************/


/*********************************************
 * common functions
 *********************************************/
    
    

/*********************************************
 * functions
 *********************************************/

    var fetch = function (options, callback) {
      options = options || {};

      if (configs[module]['isCachedCollection'] && cachedCollection) {
        callback(null, cachedCollection);
      } else {
        var deferred = $.Deferred();
        cachedCollection = new ModuleCollection();
        cachedCollection.on("reset", function (data) {
          deferred.resolve(data);  // call deferred.done
        });
              
        cachedCollection.fetch({data: options,
					error: function (﻿collection, response) {
						if (response.statusText.toUpperCase() == 'ERROR') {
							response.status = 404;
						}
            callback(response.status, ﻿collection, response);
					}
				});
				
        deferred.done(function () {
          callback(null, cachedCollection);
        });
      }
    };
    
    
    var forgotPassword = function (alias) {
      var model = new ModuleItem();
      var view = new ModuleForgotView({model: model});
      QuestCMS.layout[configs[module]['region']].show(view);
    };

    

    
    var resetPassword = function (options) {
      options = options || {};
			
      if (options.model && options.model.isValidEmail()) {
        fetch(options.model.toJSON(), function (err, collection, response) {
          if (err) {
						var errMsg = "Haven't find this account";
						if (response.responseText != "" ) {
							errMsg = response.responseText;
						}
						QuestCMS.Utils.homepageAlert('Error', errMsg);
						options.submitButton.stop();
          } else {
						QuestCMS.Utils.homepageAlert('Error', 'Your password is reset. Please check email.');
						options.submitButton.stop();
            setTimeout(function () {
              QuestCMS.vent.trigger("routing:resolve", "");
            }, 5000);
          }
        });

      } else {
        QuestCMS.Utils.showAlert('Error', 'Please check your input');
      }
    };


	
	
/*********************************************
 * Return
 *********************************************/
    return Reset;

    
});