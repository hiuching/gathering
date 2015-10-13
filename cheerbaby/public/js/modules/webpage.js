/*********************************************
 * Webpage module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

;define([
  "marionette",
  "text!tpl/webpage.html"
],

function (Marionette, templateString) {
    
    
/*********************************************
 * Templates
 *********************************************/
    var tplCompositeView = $('#ListView', '<div>' + templateString + '</div>').html();
    var tplItemView = $('#ItemView', '<div>' + templateString + '</div>').html();
    var tplEditView = $('#ItemEdit', '<div>' + templateString + '</div>').html();
    var tplModalView = $('#ModalView', '<div>' + templateString + '</div>').html();
    
    
/*********************************************
 * Configurations
 *********************************************/
    var module = "webpage";
    var configs = {};
    
    var cachedCollection;
    
/*********************************************
 * Main function (export)
 *********************************************/
    var WebPage = function () {
      var self = this;
      configs[module] = {
        isOnAdminList: true,
        isSearchable: true,
        itemPerRow: 3,
        numOfRow: 1,
        dataType: module,
        region: 'contentRegion'
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());

      //console.log('new WebPage');

      
      
      /*********************************************
       * Listening events
       *********************************************/
      
      /* common events */
      QuestCMS.vent.on("pubsub:started", function () {
        if (configs[module]['isOnAdminList']) {
          QuestCMS.Pubsub.subscribe("admin:list:start", module, adminliststart);
        }
        if (configs[module]['isSearchable']) {
          QuestCMS.Pubsub.subscribe("search:start", module, search);
        }
      });
      
      QuestCMS.vent.on("layout:rendered", function () {
      });
      
      QuestCMS.vent.on(module + ":resolve", function (alias) {
        resolve(alias);
      });
      
      QuestCMS.vent.on(module + ":display", function (options) {
        QuestCMS.Cookie.save({module: module});
        if (typeof options.alias === 'undefined') {
          options.alias = QuestCMS.Cookie.get("alias");
        }      
        Backbone.history.navigate(options.alias);
        display({alias: options.alias});
      });
      
      QuestCMS.vent.on(module + ":edit", function (options) {
        edit(options);
      });
      
     
      QuestCMS.vent.on(module + ":showModal", function (options) {
        showModal(options);
      });
    };

    
    
    
/*********************************************
 * Backbone Model
 *********************************************/
    var ModuleItem = Backbone.Model.extend({
      initialize: function () { this.options = configs; }, 
      urlRoot: function (opt) { return QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType']; },
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
      filterId: function (_id) {
        return new ModuleCollection(this.filter(function (data) {
          return data.get("_id") == _id;
        }));
      },
      filterAlias: function (alias) {
        var pos = alias.indexOf('?');
        alias = pos > 0 ? alias.substr(0,pos) : alias;
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
      onShow: function () {
        QuestCMS.Utils.setSiteTitle(this.model.toJSON().title);
        $(document).scrollTop(0);
      },
      events: {
        'dblclick'    : 'edit',
      },
      edit: function (e) {
        e.preventDefault();
        // if (QuestCMS.user && QuestCMS.user.isEditor()) {
          // Backbone.history.navigate('qadmin/' + module);
          // var _id = this.model.get("_id");
          // QuestCMS.vent.trigger(module + ':edit', {_id: _id});
        // }
      }
    });
    
    
    var ModuleModalView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplModalView),
	});
    
/*********************************************
 * Backbone Marionette CompositeView
 *********************************************/
    var ModuleCompositeView = Backbone.Marionette.CompositeView.extend({
      itemView: ModuleItemView,
      template: _.template(tplCompositeView),
      appendHtml: function (collectionView, itemView, index) {
        collectionView.$(".questcms-webpages").append(itemView.el);
      },
      onRender: function() {
        if ($(".questcms-webpages", this.el).html() === "") {
          $(".questcms-webpages", this.el).html(QuestCMS.l("404 Not Found"));
          QuestCMS.Utils.setSiteTitle(QuestCMS.l("404 Not Found"));
        }
      }
    });
    
    
    
/*********************************************
 * common functions
 *********************************************/

 
    /*
     * the Callback function subsribed to the topic "admin:list:start"
     * called by the publisher (mostly the admin module) to the topic "admin:list:start"
     *
     * @param {String} topic        subscribed topic for the PubSub system
     * @param {String} publisher    name of the caller module
     * @param {Object} options      target (String) search target (all or specified module name)
     *                              term (String) the search term
     *                              showall (Boolean) show all or not
     */
    var adminliststart = function (topic, publisher, options) {
      if ((options.target == 'all') || (options.target == module)) {
        var query = {term: options.term, showall: options.showall};
        QuestCMS.vent.trigger("search:search", {module: module, query: query, collection: ModuleCollection});
      }
    };
    
    var resolve = function (alias) {
      var page = 1;
      QuestCMS.Cookie.save({alias: alias, page: page});
      display({alias: alias, page: page});
    };

    
    var search = function (topic, publisher, term) {
        // uncomment the following line to use the default search function
        var query = {term: term};
        QuestCMS.vent.trigger("search:search", {module: module, query: query, collection: ModuleCollection});
        
        // uncomment the following line to define your own search function
        // your search function code here
        //QuestCMS.Pubsub.publish("search:finished", module, new ModuleCollection());
    };
 
/*********************************************
 * functions
 *********************************************/
 
    var display = function (options) {
				Backbone.history.navigate('/');
        // comment the following if using custom display function
        QuestCMS.vent.trigger("questcms:display", {module: module, alias: options.alias, collection: ModuleCollection, view: ModuleCompositeView, region: configs[module]['region']});
        $(document).scrollTop(0);
        // your display function code here
        // QuestCMS.layout.contentRegion.show(new ModuleCompositeView());
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
    
    
    var showModal = function (options) {
      options = options || {};
      var message = options.message || 'Error';
	  var status = options.status || 'Error';
      var model = new ModuleItem({message: message,status: status});
      var view = new ModuleModalView({model: model});
      QuestCMS.modal.show(view); 
    };
    
/*********************************************
 * Return
 *********************************************/
    return WebPage;
    
});