/*********************************************
 * Homepage module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/


;define([
  "marionette",
  "text!tpl/homepage.html"
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
    
    var module = "homepage";
    var configs = {};
    
    
    
/*********************************************
 * Main function (export)
 *********************************************/
    var HomePage = function () {
      var self = this;
      configs[module] = {
        region: 'contentRegion'
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());
      //console.log('new HomePage');

      
      /*********************************************
       * Listening events
       *********************************************/

      /* common events */


      QuestCMS.vent.on("layout:rendered", function () {
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
      
      
      QuestCMS.vent.on(module + ":display", function () {
        QuestCMS.Cookie.set({module: module});
        var alias = QuestCMS.Cookie.get("alias");
        Backbone.history.navigate(alias);
        display({alias: alias});
      });      
      
      
      QuestCMS.vent.on(module + ":edit", function (options) {
        edit(options);
      });
      
      
      QuestCMS.vent.on(module + ":resolve", function (alias) {
        resolve(alias);
      });      

      
      QuestCMS.vent.on(module + ":start", function () {
        start();
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

      filterText: function (text) {
        var regexp = new RegExp(text, "i");
        return new ModuleCollection(this.filter(function (data) {
          return (data.get("content").match(regexp) || data.get("title").match(regexp));
        }));
      },
      filterId: function (id) {
        return new ModuleCollection(this.filter(function (data) {
          return data.get("id") == id;
        }));
      },
      filterAlias: function (alias) {
        return new ModuleCollection(this.filter(function (data) {
          return data.get("alias") == alias;
        }));
      },
      filterLanguage: function (language) {
        return new ModuleCollection(this.filter(function (data) {
          return data.get("language") == language;
        }));
      }
    });

    
    
/*********************************************
 * Backbone Marionette ItemView
 *********************************************/
    var ModuleItemView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplItemView),   
      className: 'editable',        
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
        collectionView.$(".questcms-homepages").append(itemView.el);
      },
      onRender: function() {
        QuestCMS.Utils.setSiteTitle(QuestCMS.l(module));
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
 
 
    var resolve = function (alias) {
      var page = 1;
      QuestCMS.Cookie.save({alias: alias, page: page});
      QuestCMS.Utils.setSiteTitle(QuestCMS.l('Home'));
      start(alias);
    };
 

 
    var search = function (topic, publisher, term) {
        var query = {term: term};
        QuestCMS.vent.trigger("search:search", {module: module, query: query, collection: ModuleCollection});
    };
 
/*********************************************
 * functions
 *********************************************/

    var display = function (options) {
      Backbone.history.navigate('/');
      QuestCMS.vent.trigger("questcms:display", {module: module, alias: options.alias, collection: ModuleCollection, view: ModuleCompositeView, region: configs[module]['region']});
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


    var start = function (alias) {
      var homepage = configs.homepage;
      if (QuestCMS.user && QuestCMS.user.get('preferences')) {
        homepage = QuestCMS.user.get('preferences').homepage || homepage;
      }
      // console.log(homepage.module);
      QuestCMS.vent.trigger(homepage.module + ':resolve', alias);
      QuestCMS.vent.trigger("carousel:display");
      QuestCMS.vent.trigger("columns:display");
    };



/*********************************************
 * Return
 *********************************************/
    return HomePage;
    
});