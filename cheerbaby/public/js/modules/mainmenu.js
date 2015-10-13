/*********************************************
 * Main Menu module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
 
;define([
  "marionette",
  "text!tpl/mainmenu.html"
], 

function (Marionette, templateString) {


/*********************************************
 * Templates
 *********************************************/
    var tplCompositeView = $('#ListView', '<div>' + templateString + '</div>').html();
    var tplItemView = $('#ItemView', '<div>' + templateString + '</div>').html();
    var tplEditView = $('#ItemEdit', '<div>' + templateString + '</div>').html();
    
    
    
/*********************************************
 * Configurations
 *********************************************/
    var module = "mainmenu";
    var configs = {};
    
    var cachedCollection;
    
    
    
/*********************************************
 * Main function (export)
 *********************************************/
      var MainMenu = function () {
      var self = this;
      configs[module] = {
        isCachedCollection: true,
        isOnAdminList: true,
        dataType: module,
        region: 'mainMenuRegion'
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());
      //console.log('new MainMenu');
      
      
      
      /*********************************************
       * Listening events
       *********************************************/
       
      /* common events */
      
      QuestCMS.vent.on("languagemenu:switch", function (lang) {
        display();
      });    

      
      QuestCMS.vent.on("layout:rendered", function () {
        display();
      });      
      
      
      QuestCMS.vent.on("pubsub:started", function () {
        if (configs[module]['isOnAdminList']) {
          QuestCMS.Pubsub.subscribe("admin:list:start", module, adminliststart);
        }
        if (configs[module]['isSearchable']) {
          QuestCMS.Pubsub.subscribe("search:start", module, search);
        }
      });


      /* events trigger by other modules */
      
      
      /* events trigger by this modules*/
      
      QuestCMS.vent.on(module + ":edit", function (options) {
        edit(options);
      });

    };

    
    
/*********************************************
 * Backbone Model
 *********************************************/
    var ModuleItem = Backbone.Model.extend({
      initialize: function () { this.options = configs; }, 
      urlRoot: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType']; },
      idAttribute: '_id'
    });
      
      
      
/*********************************************
 * Backbone Collection
 *********************************************/
    var ModuleCollection = Backbone.Collection.extend({
      initialize: function () { this.options = configs; },  
      url: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType']; },
      model: ModuleItem,
      
      comparator: function (data) {
        return data.get("order");
      },
      
      filterText: function (text) {
        var regexp = new RegExp(text, "i");
        return new ModuleCollection(this.filter(function (data) {
          return (data.get("title").match(regexp));
        }));
      },
      filterLanguage: function (language) {
        return new ModuleCollection(this.filter(function (data) {
          return data.get("language") == language;
        }));
      },
      filterPermission: function (user) {
        return new ModuleCollection(this.filter(function (data) {
          var isAllow = false;
          var permission = data.get('permission');
          if (!permission || permission == '') {
            isAllow = true;
					} else if (permission == 'admin') {
            if (user) {
							var adminRoles = user.getAdminRoles();
              if (adminRoles.length > 0) {
                // for (ii = 0; ii < adminRoles.length; ii++) {
                  // if (permission.indexOf(adminRoles[ii]) != -1) {
                    // isAllow = true;
                    // break;
                  // }
                // }
								isAllow = true;
              } else {
                isAllow = false;
              }
            } else {
              isAllow = false;
            }
          } else {
            isAllow = false;         
          }
          return isAllow;
        }));
      }
    });

    
    
/*********************************************
 * Backbone Marionette ItemView
 *********************************************/
    var ModuleItemView = Backbone.Marionette.ItemView.extend({
      tagName: 'li',
      template: _.template(tplItemView),
      events: {
        'dblclick'    : 'edit'
      },
      edit: function (e) {
        e.preventDefault();
        if (QuestCMS.user && QuestCMS.user.isEditor()) {
          Backbone.history.navigate('qadmin/' + module);
          var _id = this.model.get("_id");
          QuestCMS.vent.trigger(module + ':edit', {_id: _id});
        }
      }
    });
      
      
      
/*********************************************
 * Backbone Marionette CompositeView
 *********************************************/
    var ModuleCompositeView = Backbone.Marionette.CompositeView.extend({
      itemView: ModuleItemView,
      template: _.template(tplCompositeView),
      appendHtml: function (collectionView, itemView, index) {
        collectionView.$(".questcms-mainmenus").append(itemView.el);
      },
      onShow: function() {
        QuestCMS.vent.trigger("content:rendered", module);
      }
    });
      
      
      
/*********************************************
 * common functions
 *********************************************/
 
    var adminliststart = function (topic, publisher, options) {
      if ((options.target == 'all') || (options.target == module)) {
        var query = {term: options.term, showall: options.showall};
        QuestCMS.vent.trigger("search:search", {module: module, query: query, collection: ModuleCollection});
      }
    };
    
    
    
/*********************************************
 * functions
 *********************************************/ 
    var display = function () {
      var self = this;
      var lang = QuestCMS.Cookie.get("lang");
      fetch({}, function (err, cachedCollection) {
        var collection = cachedCollection.filterLanguage(lang).filterPermission(QuestCMS.user);
        var view = new ModuleCompositeView({ collection: collection });
        QuestCMS.layout[configs[module]['region']].show(view); 
      });
    };

    
    var edit = function (options) {
      options = options || {};
        if (options._id) {
          if (QuestCMS.allow(module, 'edit', {})) {
            $.extend(true, options, {model: ModuleItem, module: module, templateStr: tplEditView});
            QuestCMS.vent.trigger("admin:edit", options);
          }
        } else { // new item
          $.extend(true, options, {model: ModuleItem, module: module, templateStr: tplEditView});
          QuestCMS.vent.trigger("admin:newdata", options);        
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
        cachedCollection.fetch();
        
        deferred.done(function () {
          callback(null, cachedCollection);
        });
      }
    };
 /*********************************************
 * facebook
 *********************************************/
      window.fbAsyncInit = function() {
        FB.init({
          appId      : '803946349625884',
          xfbml      : true,
          version    : 'v2.0'
        });
      };

	(function(d, s, id) {
		var js, fjs = d.getElementsByTagName(s)[0];
		if (d.getElementById(id)) return;
	js = d.createElement(s); js.id = id;
  js.src = "//connect.facebook.net/en_GB/sdk.js#xfbml=1&version=v2.0";
  fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));


/*********************************************
 * Return
 *********************************************/
    return MainMenu;

  
}); // define

