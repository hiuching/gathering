;define([
  "marionette",
  "text!tpl/basket.html"
],

function (Marionette, templateString) {
  
    var tplCompositeView = $('#ListView', '<div>' + templateString + '</div>').html();
    var tplItemView = $('#ItemView', '<div>' + templateString + '</div>').html();
    var tplEditView = $('#ItemEdit', '<div>' + templateString + '</div>').html();

    var module = "basket";
    var configs = {};
   
    var collection;
    
    var Basket = function (options) {
      var self = this;
      configs[module] = {};
      $.extend(true, configs, QuestCMS.Config.toJSON());
      options = options || {};
      if (typeof options.region != 'undefined') {
        configs[module]['region'] = options.region;
      }
      //console.log('new ' + module);
      reset();
     
      // listening events
      QuestCMS.vent.on("pubsub:started", function () {
        // uncomment the following line to include in search result
        // QuestCMS.Pubsub.subscribe("search:start", module, search);
        // QuestCMS.Pubsub.subscribe("admin:list:start", module, listall);
        QuestCMS.Pubsub.subscribe("module:reset", module, reset);
      });
      
      QuestCMS.vent.on("layout:rendered", function () {
      });
      
      QuestCMS.vent.on(module + ":resolve", function (alias) {
        resolve(alias);
      });
      
      QuestCMS.vent.on(module + ":display", function () {
        QuestCMS.Cookie.save({module: module});
        var alias = QuestCMS.Cookie.get("alias");
        Backbone.history.navigate(alias);
        display({alias: alias});
      });
      
      QuestCMS.vent.on(module + ":edit", function (options) {
        edit(options);
      });
      
      QuestCMS.vent.on(module + ":add", function (options) {
        add(options);
      });
      
      QuestCMS.vent.on(module + ":remove", function (options) {
        remove(options);
      });
      
      QuestCMS.vent.on(module + ":list", function (options) {
        list(options);
      });
      
      QuestCMS.vent.on(module + ":action", function (options) {
        action(options);
      });
      
      QuestCMS.vent.on(module + ":empty", function (options) {
        empty(options);
      });
      
      QuestCMS.vent.on(module + ":reset", function (options) {
        reset(options);
      });
      
      QuestCMS.vent.on(module + ":numOfItem", function (options) {
        return numOfItem(options);
      });
    };

    var ModuleItem = Backbone.Model.extend({
    });

    var ModuleCollection = Backbone.Collection.extend({
      model: ModuleItem,
      filterItem: function (options) {
        var value = new RegExp(options.value, "i");
        return new ModuleCollection(this.filter(function (data) {
            return (
              data.get(options.target).match(value) 
            );
        }));
      },
      removeItem: function (options) {
        var value = new RegExp(options.value, "i");
        return new ModuleCollection(this.filter(function (data) {
            return (
              !data.get(options.target).match(value) 
            );
        }));
      }
    });
    
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
    
    var ModuleCompositeView = Backbone.Marionette.CompositeView.extend({
      itemView: ModuleItemView,
      template: _.template(tplCompositeView),
      appendHtml: function (collectionView, itemView, index) {
        collectionView.$(".questcms-settings").append(itemView.el);
      },
      onRender: function() {
        QuestCMS.Utils.setSiteTitle(QuestCMS.l(module));
      }
    });

    var display = function (options) {
        // comment the following if using custom display function
        QuestCMS.vent.trigger("questcms:display", {module: module, alias: options.alias, collection: ModuleCollection, view: ModuleCompositeView, region: configs[module]['region']});
        // your display function code here
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
    
    var add = function (options) {
      var model = new ModuleItem(options);
      collection.add(model);
      if (typeof options.trigger != 'undefined') {
        QuestCMS.vent.trigger(options.module + ":" + options.trigger, collection);
      }
      //console.log(collection.toJSON());
    };
    
    var remove = function (options) {
      collection.remove({
        id: options.id
      });
      if (typeof options.trigger != 'undefined') {
        QuestCMS.vent.trigger(options.module + ":" + options.trigger, collection);
      }
      //console.log(collection.toJSON());
    };
    
    var list = function (options) {
      var filteredCollection = collection.filterItem(options);
      //console.log(filteredCollection.toJSON());
    };
    
    var action = function (options) {
      // add any third-party tools to handle the basket here, e.g. checkout
      // convert collection to json object
      QuestCMS.vent.trigger("takekare:" + options.action.alias, collection, options, function (collection) {
        //console.log(collection);
        QuestCMS.vent.trigger("patient:filter", {});
      });
    };
    
    var numOfItem = function (options) {
      var len = 0
      if (typeof options.filter != 'undefined') {
        var filteredCollection = collection.filter(options.filter);
        len = filteredCollection.toJSON().length;
      } else {
        len = collection.toJSON().length;
      }
      return len;
    };
    
    var search = function (topic, publisher, term) {
        // uncomment the following line to use the default search function
        var query = {term: term};
        QuestCMS.vent.trigger("search:search", {module: module, query: query, collection: ModuleCollection});
        
        // uncomment the following line to define your own search function
        // your search function code here
        //QuestCMS.Pubsub.publish("search:finished", module, new ModuleCollection());
    };

    var empty = function (options) {
      var temp = collection.removeItem(options);
      collection = temp;
    };

    var reset = function (topic, caller, options) {
      collection = new ModuleCollection();
    };

    var resolve = function (alias) {
      var page = 1;
      QuestCMS.Cookie.save({alias: alias, page: page});
      display({alias: alias, page: page});
    };
    

    return Basket;
    
});