/*********************************************
 * Search module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
 
;define([
  "marionette",
  "text!tpl/search.html"
],

function (Marionette, templateString) {

/*********************************************
 * Templates
 *********************************************/
 
    var tplItemView = $('#ItemView', '<div>' + templateString + '</div>').html();
    var tplCompositeView = $('#ListView', '<div>' + templateString + '</div>').html();
    var tplSpinnerView = $('#SpinnerView', '<div>' + templateString + '</div>').html();

    
/*********************************************
 * Configurations
 *********************************************/
    var module = "search";
    var configs = {};
    
    var searchTerm = "";
    var numberOfSubscribers = 0;
    
    var results;
    var limit, pageSize, pageCount, sectionStart = 1, sectionEnd = 1, lastPage;
    var nextkey = "", startkey = "";
    
    
/*********************************************
 * Main function (export)
 *********************************************/
    var Search = function () {
      var self = this;
      configs[module] = {
        itemPerRow: 1,
        numOfRow: 5,
        pagePerSection: 10,
        dataType: module
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());
      pageSize = configs[module]['itemPerRow'] * configs[module]['numOfRow'];
      limit = pageSize * configs[module]['pagePerSection'] + 1;
      //console.log('new ' + module);
      
      /*********************************************
       * Listening events
       *********************************************/
       
      /* common events */
      
      QuestCMS.vent.on(module + ":adminliststart", function (options) {
        results = new ModuleCollection();
        if (options.target == 'all') {
          numberOfSubscribers = QuestCMS.Pubsub.numberOfSubscribers("admin:list:start");
        } else {
          numberOfSubscribers = 1;
        }
        if (numberOfSubscribers > 0) {
          QuestCMS.Pubsub.publish("admin:list:start", module, options);
        }          
      });   
      
      QuestCMS.vent.on(module + ":resolve", function (alias) {
        resolve(alias);
      });   

      
      QuestCMS.vent.on("pubsub:started", function () {
        QuestCMS.Pubsub.subscribe("search:finished", module, collectResult);
      });

      
      /* events trigger by other modules */
      
      QuestCMS.vent.on("modal:cancelled", function(e) {
        //console.log(e);
        QuestCMS.vent.trigger(module + ":stop");        
      });
      
      
      /* events trigger by this modules*/
      
      QuestCMS.vent.on(module + ":display", function(options) {
        if (options) {
          var page = options.page || 1;
        } else {
          var page = 1;
        }
        QuestCMS.Cookie.set({module: module, page: page});
        showResult(page);
      });
      
      
      QuestCMS.vent.on(module + ":find", function(options) {
        find(options);
      });    
      
      
      QuestCMS.vent.on(module + ":search", function(options) {
        search(options);
      });      
      
      
      QuestCMS.vent.on(module + ":start", function (term) {
        searchStart(term);
      });

      
      QuestCMS.vent.on(module + ":stop", function(page) {
        QuestCMS.modal.close();
        QuestCMS.vent.trigger(module + ":display", page);
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
      model: ModuleItem
    });
     
     
/*********************************************
 * Backbone Marionette ItemView
 *********************************************/

    var ModuleItemView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplItemView),
      className: function() {
        return 'searchItem span' + Math.round(12/configs[module].itemPerRow);
      }
    });
    
    
    var SpinnerView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplSpinnerView),
      className: "spinner"
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
          collectionView.$(".questcms-searchresults").append(itemView.el);
        }
      },
      onRender: function() {
        if (configs[module]['showPaginator']) {
          this.showPaginator();
        }
        $('#search-term', this.el).html(searchTerm);
        QuestCMS.Utils.setSiteTitle(QuestCMS.l(module));
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
        //QuestCMS.Paginator.display(options);  
        QuestCMS.vent.trigger("paginator:display", options);        
      }
    });

    
    
/*********************************************
 * common functions
 *********************************************/
 
    /*
     * the Callback function subsribed to the topic "admin:list:start"
     * called by the publisher (mostly the admin module) to the topic "admin:list:start"
     *
     * @param {String} alias        search string
     */
    var resolve = function (alias) {
        searchStart(decodeURI(alias.substr(7)));
    };
    
/*********************************************
 * functions
 *********************************************/
    var collectResult = function (topic, subscriber, collection) {
      numberOfSubscribers--;
      if (typeof collection !== 'undefined') {
        results.add({subscriber: subscriber, collection: collection});
      }
      if (numberOfSubscribers <= 0) {
        if (topic == 'search:search') {
          QuestCMS.vent.trigger(module + ":stop");
        } else {
          QuestCMS.vent.trigger("admin:list:finished", {results: results, page: 1});
        }
      }
    };
      
    var find = function (options) {
      var searchCollection = new ModuleCollection();
      var conditions = {filter: 'search'};
      // auto gen conditions
      searchCollection.fetch({
        data: $.param({ filter: 'search', model: options.module, term: options.term}),
        success: function () {
          QuestCMS.vent.trigger(options.module + 'found', {collection: searchCollection});
          console.log('success');
        },
        error: function () {
          console.log('err');
        }
      });
    };
      
      
    var showResult = function (page) {
      numberOfSubscribers = 0;
      var collection = new ModuleCollection();
      if (!$.isEmptyObject(results)) {
        var r = results.toJSON();
        $.each(r, function (index, model) {
          collection.add(model.collection.toJSON());
        });
      }
      if (collection.toJSON().length == 0) {
        collection.add({content: QuestCMS.l("Not Found")});
      }
      var view = new ModuleCompositeView({collection: collection, page: page});
      QuestCMS.layout.contentRegion.show(view);
    };
         
    var search = function (options) {
      var self = this;
      var lang = QuestCMS.Cookie.get("lang");
      var deferred = $.Deferred();
      var collection = new options.collection();
      collection.on("reset", function (data) {
        deferred.resolve(data);
      });
      if (options.query.showall) {
        collection.fetch({data: $.param({ view: "rawdata"})});
      } else {
        collection.fetch({data: $.param({ view: "publish"})});
      }
      
      deferred.done(function () {
        
        if (!options.query.showall) {
          collection = collection.filterText(options.query.term).filterLanguage(lang);
          collectResult("search:search", options.module, collection);
        } else {
          var newCollection = new options.collection();
          var c = collection.toJSON();
          $.each(c, function (index, model) {
            var pos = model.data.length - 1;
            $.each(model.data, function (ii, item) {
              if (item.publish == 1) {
                pos = ii;
              }
            });
            if (model.data[pos].language == lang) {
              $.extend(model, {title: model.data[pos].title, content: model.data[pos].content});
              newCollection.add(model);
            }
          });
          newCollection = newCollection.filterText(options.query.term);
          collectResult("admin:list:start", options.module, newCollection);
        }
        
      });
    };
    
    var searchStart = function (term) {
      if (term != '') {
        results = new ModuleCollection();
        searchTerm = term;
        QuestCMS.Cookie.save({alias: "search/" + searchTerm});
        Backbone.history.navigate("search");
        numberOfSubscribers = QuestCMS.Pubsub.numberOfSubscribers("search:start");
        
        if (numberOfSubscribers > 0) {
          var view = new SpinnerView();
          QuestCMS.modal.show(view);           
          QuestCMS.Pubsub.publish("search:start", module, searchTerm);
          setTimeout(function() {
            if (numberOfSubscribers > 0) {
              QuestCMS.vent.trigger(module + ":stop");
            }
          }, 5000); // timeout after 5 seconds
        } else {
          QuestCMS.vent.trigger(module + ":stop");
        }
      }        
    };
    
    
    
    

/*********************************************
 * Return
 *********************************************/
    return Search;

});
