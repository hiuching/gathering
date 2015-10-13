/*********************************************
 * Message module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

;define([
  "marionette",
  "text!tpl/message.html"
],

function (Marionette, templateString) {
    
    
/*********************************************
 * Templates
 *********************************************/
    var tplCompositeView = $('#ListView', '<div>' + templateString + '</div>').html();
    var tplItemView = $('#ItemView', '<div>' + templateString + '</div>').html();
    var tplEditView = $('#ItemEdit', '<div>' + templateString + '</div>').html();
    var tplDetailView = $('#DetailView', '<div>' + templateString + '</div>').html();
    
    
/*********************************************
 * Configurations
 *********************************************/
    var module = "message";
    var configs = {};
    
    var limit, pageSize, pageCount, sectionStart = 1, sectionEnd = 1, lastPage, currentPage;
    var nextkey = "", startkey = "";
    var results;  

    
/*********************************************
 * Main function (export)
 *********************************************/

    
    var Message = function () {
      var self = this;
      configs[module] = {
        itemPerRow: 1,
        numOfRow: 10,
        pagePerSection: 10,
        dataType: module,
        region: 'contentRegion'
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());
      pageSize = configs[module]['itemPerRow'] * configs[module]['numOfRow'];
      limit = pageSize * configs[module]['pagePerSection'] + 1;
      //console.log('new Message');
      
      
      
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
      
      QuestCMS.vent.on("languagemenu:switch", function () {
        results = new ModuleCollection();
      });
      
      QuestCMS.vent.on(module + ":display", function (options) {
        if (options) {
          var page = options.page || 1;
        } else {
          var page = 1;
        }
        QuestCMS.Cookie.set({module: module, page: page});
        var alias = QuestCMS.Cookie.get("alias");
        Backbone.history.navigate(alias);
        display({page: page});
      });
      
      QuestCMS.vent.on(module + ":edit", function (options) {
        edit(options);
      });
      
      
      QuestCMS.vent.on(module + ":hide", function () {
        hide();
      });
      
      
      

      QuestCMS.vent.on(module + ":receive:internal", function (options) {
        receiveInternal(options);
      });
      
      
      QuestCMS.vent.on(module + ":reset", function () {
        reset();
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
          return (data.get("title").match(regexp));
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
      initialize: function () {
        _.bindAll(this, 'className');
      },
      template: _.template(tplItemView),
      className: function() {
        return 'col-md-' + Math.round(12/configs[module].itemPerRow);
      },
      events: {
        'dblclick'    : 'edit',
		    'click .message-item'    : 'showDetail'
      },
      edit: function (e) {
        e.preventDefault();
        if (QuestCMS.user && QuestCMS.user.isEditor()) {
          Backbone.history.navigate('qadmin/' + module);
          var _id = this.model.get("_id");
          QuestCMS.vent.trigger(module + ':edit', {_id: _id});
        }
      },
      onRender: function() {
        if (QuestCMS.user) {
          QuestCMS.vent.trigger("admin:toolbar", this);
        }
      },
      showDetail: function(e) {
        showDetail(this.model);
      }
    });
      
      
    var ModuleDetailView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplDetailView),
      events: {
		    'click .message-done'    : 'done'
      },
      done: function () {
        console.log('done');
        display({page: currentPage});
      }
    });  
      
/*********************************************
 * Backbone Marionette CompositeView
 *********************************************/
    var ModuleCompositeView = Backbone.Marionette.CompositeView.extend({
      initialize: function () { 
        this.page = this.options.page;
        this.start = (this.page - 1) * pageSize ;
        this.end = this.page * pageSize;  
      },
      itemView: ModuleItemView,
      template: _.template(tplCompositeView),
      appendHtml: function (collectionView, itemView, index) {
        if ((this.start <= index) && (index < this.end)) {
          collectionView.$(".questcms-messages").append(itemView.el);
        }
      },
      onRender: function () {
        if (configs[module]['showPaginator']) {
          this.showPaginator();
        }
      },
      showPaginator: function () {
        pageCount = Math.ceil(this.collection.models.length / pageSize );
        var section = Math.ceil(this.page / configs[module]['pagePerSection']);
        sectionStart = (section - 1) * configs[module]['pagePerSection'] + 1;
        sectionEnd = section * configs[module]['pagePerSection'];

        var el = $('.questcms-paginator', this.el);
        var options = {
          el: el, 
          module: module, 
          page: this.page,
          sectionStart: sectionStart,
          sectionEnd: sectionEnd,
          pageCount: pageCount
        };
        QuestCMS.vent.trigger("paginator:display", options);    
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
    
    var reset = function (alias) {
      results = null;
    };
    
    var resolve = function (alias) {
      var page = 1;
      QuestCMS.Cookie.save({alias: alias, page: page});
      display({alias: alias, page: page});
    };
    
    var search = function (topic, publisher, term) {
        var query = {term: term};
        QuestCMS.vent.trigger("search:search", {module: module, query: query, collection: ModuleCollection});
    };
    
    
/*********************************************
 * functions
 *********************************************/
    var display = function (options) {  
      var self = this;
      var lang = QuestCMS.Cookie.get("lang");
      
      if (!results) {
        results = new ModuleCollection();
      }
      
      if ((results.toJSON().length > 0) && (options.page <= lastPage)) {
        currentPage = options.page;
        var view = new ModuleCompositeView({ collection: results, page: options.page });
        QuestCMS.layout[configs[module]['region']].show(view);
      } else {
        var deferred = $.Deferred();

        var collection = new ModuleCollection();
        collection.on("reset", function (data) {
          deferred.resolve(data);
        });

        startkey = nextkey;
        collection.fetch({data: $.param({ startkey: startkey, limit: limit})});

        deferred.done(function () {
          results.add(collection.toJSON());
          var len = results.toJSON().length;
          if (collection.toJSON().length == limit) {
            nextkey = collection.at(limit - 1).get("_id");
            len = len - 1;
          }
          lastPage = Math.ceil(len / pageSize);
          currentPage = options.page;
          var view = new ModuleCompositeView({ collection: results, page: options.page });
          QuestCMS.layout[configs[module]['region']].show(view);

        });
      }
    
       
    };
    
    
    var hide = function () {
          QuestCMS.layout.contentRegion.close(); 
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


      /*{message: message, timestamp: timestamp, question: this.question} */
    var receiveInternal = function (options) {
      var model = new ModuleItem(options);
      model.save({}, {
        success: function (model, response, options) {
          QuestCMS.Utils.showAlert('Success', 'Message sent successfully');   
        },
        error: function (model, xhr, options) {
          QuestCMS.Utils.showAlert('Error', 'Failed to send message.');
        }
      });
      
    };
    
    var showDetail = function (model) {
        var view = new ModuleDetailView({model: model});
        QuestCMS.layout[configs[module]['region']].show(view);        
    };

      
/*********************************************
 * Return
 *********************************************/
    return Message;

    
});