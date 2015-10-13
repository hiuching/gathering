/*********************************************
 * VerificationCode module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
 
;define([
  "marionette",
  "text!tpl/verificationcode.html"
],

function (Marionette, templateString) {


/*********************************************
 * Templates
 *********************************************/
    var tplListView = $('#ListView', '<div>' + templateString + '</div>').html();
    var tplItemView = $('#ItemView', '<div>' + templateString + '</div>').html();


/*********************************************
 * Configurations
 *********************************************/
    var module = "verificationCode";
    var configs = {};
    


/*********************************************
 * Main function (export)
 *********************************************/

    var VerificationCode = function () {
      var self = this;
      configs[module] = {
        dataType: module,
        region: 'contentRegion'
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());
      
      
      
      /*********************************************
       * Listening events
       *********************************************/
      
      
      /* common events */


      
      /* events trigger by other modules */

      QuestCMS.vent.on(module + ":authenticateVerificationCode", function (options) {
        authenticateVerificationCode(options);
      });
      
      
      /* events trigger by this modules*/

      QuestCMS.vent.on(module + ":activate", function () {
        activate();
      });

      
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
          userId: "",
					code: ""
        };
      }
    });


/*********************************************
 * Backbone Collection
 *********************************************/
    var ModuleCollection = Backbone.Collection.extend({
      initialize: function () { this.options = configs; },  
      url: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/' + module; },
      model: ModuleItem,
      
      filterText: function (text) {
        var regexp = new RegExp(text, "i");
        return new ModuleCollection(this.filter(function (data) {
          return (data.get("title").match(regexp));
        }));
      },
      filterId: function (id) {
        return new ModuleCollection(this.filter(function (data) {
          return data.get("id") == id;
        }));
      }
    });

    
    
/*********************************************
 * Backbone Marionette ItemView
 *********************************************/

    var ModuleItemView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplItemView),
      events: {
        'change'                : 'change',
        'click .user-logout'    : 'logout',
        'click .user-skip'      : 'showVerification',
        'click .user-submit'    : 'getVerificationToken',
        'submit'    : 'getVerificationToken'
      },
      change: function (e) {
        e.preventDefault();
        var input = {target: e.target};
        var change = QuestCMS.Utils.inputChange(input);
        this.model.set(change, {silent: true});
      },
      logout: function (e) {
        e.preventDefault();
        QuestCMS.vent.trigger('user:logout');
      },
      getVerificationToken: function (e) {
        e.preventDefault();
        getVerificationToken({model: this.model});
      },
      showVerification: function (e) {
        e.preventDefault();
        showVerification();
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
 
    var activate = function () {
      if (QuestCMS.user && !QuestCMS.user.get('isActivated')) {
        var email = QuestCMS.Utils.getUserPrimaryEmail(QuestCMS.user.get('emails'));
        var model = new ModuleItem({userId: QuestCMS.user.id, username: QuestCMS.user.get('username'), email: email});
        var view = new ModuleItemView({model: model});
        QuestCMS.layout[configs[module]['region']].show(view);
      } else {
        QuestCMS.vent.trigger('routing:resolve');
      }
    };

    var authenticateVerificationCode = function (options) {
      Backbone.history.navigate('/');
			options = options || {};
			var url = options.split("/");
			var data = {
				code: url[2],
				action: 'findByCode'
			};
			
			if (data.code) {
				fetch(data, function (err, collection) {
					if (err) {
						QuestCMS.Utils.showAlert('Error', 'VerificationCode Code Is Expired!');
					} else {
						var model = collection.at(0);
						var options = {};
						options.model = model;
						options.cannotSkip = true;
						QuestCMS.Utils.showAlert('Success', 'Register Successful');
						QuestCMS.vent.trigger('user:displayChangePasswordForm', options);
					}
				});
			}
		};
		
		
    var fetch = function (options, callback) {
      options = options || {};

      if (configs[module]['isCachedCollection'] && cachedCollection) {
        callback(null, cachedCollection);
      } else {
        var deferred = $.Deferred();
        cachedCollection = new ModuleCollection();
        cachedCollection.on("reset", function (data) {
          deferred.resolve(data);
        });
       
        cachedCollection.fetch({data: options});
        deferred.done(function () {
          callback(null, cachedCollection);
        });
      }
    };
    
		
    var getVerificationToken = function (options) {
      options = options || {};
      if (options.model && options.model.get('email')) {
        options.model.save({}, {
          success: function (model) {
            QuestCMS.Utils.showAlert('Success', 'An email has been sent');
            showVerification();
          },
          error: function () {
            QuestCMS.Utils.showAlert('Error', 'Error in activating user profile');
          }
        });
      }
    };
    
    
    var hide = function () {
      QuestCMS.layout[configs[module]['region']].close(); 
    };
    
    var verifyToken = function (options) {
      options = options || {};
      if (options.model && options.model.get('token')) {
        options.model.fetch({
          data: $.param({ token: options.model.get('token')}),
          success: function (model, response, options) {
            QuestCMS.user.set({isActivated: true}, {silent: true});
            QuestCMS.vent.trigger('routing:resolve');
          },
          error: function (model, response, options) {
            QuestCMS.Utils.showAlert('Error', 'Incorrect VerificationCode Token');
          }
        });
      }
    };

       

    

/*********************************************
 * Return
 *********************************************/
    return VerificationCode;

    
});