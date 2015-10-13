/*********************************************
 * Administration module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
 
/*
 * Require.js load AMD modules
 * each module should at least load marionette and one HTML template file
 */
;define([
  "marionette",    // path refer to js/main.js
  "text!tpl/administration.html"
],


/*
 * Objects to store the marionette and the HTML template file
 */
function (Marionette, templateString) {
  
  
/*********************************************
 * Templates
 *********************************************/
 
/*
 * Read the corresponding segment of HTML code into template variables
 */
    var tplCompositeView = $('#ListView', '<div>' + templateString + '</div>').html();
    var tplItemView = $('#ItemView', '<div>' + templateString + '</div>').html();
    var tplModalView = $('#ModalView', '<div>' + templateString + '</div>').html();
    var tplAdminUniveralSearchResultView = $('#AdminUniveralSearchResultView', '<div>' + templateString + '</div>').html();

    
/*********************************************
 * Module scope variables
 *********************************************/
 
/*
 * Define the module-wide variables here
 * at least 2 variables: module and configs.
 */
    var module = "administration"; // lowercase only
    var configs = {};

    var limit, pageSize, pageCount, sectionStart = 1, sectionEnd = 1, lastPage;
    var nextkey = "", startkey = "";
    var cachedCollection;
    var currentPage;
    
/*********************************************
 * Main function (export)
 *********************************************/
 
/*
 * Main module funtion here
 * name is CamelCase
 */
    var Administration = function () {
      var self = this;
      configs[module] = {             // module specified config options
        isCachedCollection: true,
        isOnAdminList: false,         // is shown on the admin menu list
        isSearchable: false,          // is this module data searchable
        itemPerRow: 1,
        numOfRow: 5,
        pagePerSection: 10,
        showPaginator: true,
        dataType: module,             // this module data source
        region: 'contentRegion'  // default display region 
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());  // merge with QuestCMS system config, refer to js/config/config.js
      pageSize = configs[module]['itemPerRow'] * configs[module]['numOfRow'];
      limit = pageSize * configs[module]['pagePerSection'] + 1;

      /*********************************************
       * Listening events
       *********************************************/
       
      /* common events */
      QuestCMS.vent.on("pubsub:started", function () {  // run the callback when the event "pubsub:started" is triggered
        if (configs[module]['isOnAdminList']) {
          QuestCMS.Pubsub.subscribe("admin:list:start", module, adminliststart);
        }
        if (configs[module]['isSearchable']) {
          QuestCMS.Pubsub.subscribe("search:start", module, search);
        }
      });
     
     
      QuestCMS.vent.on("layout:rendered", function () {
      });
      
      QuestCMS.vent.on(module + ":displayAdminUniversalSearchResultView", function (options) {
        options = options || {};
        
        displayAdminUniversalSearchResultView(options);
      });
      
      QuestCMS.vent.on(module + ":resolve", function (alias) {
        resolve(alias);
      });
      
      
      /* module specified events */
      QuestCMS.vent.on(module + ":display", function () {
        QuestCMS.Cookie.set({module: module});
        var alias = QuestCMS.Cookie.get("alias");
        Backbone.history.navigate(alias);
        display({alias: alias});
      });
      
      
      QuestCMS.vent.on(module + ":edit", function (options) {
        edit(options);
      });
      
    };
      
      
      
/*********************************************
 * Backbone Model
 *********************************************/
 
/*
 * Default Backbone Model
 * urlRoot: constructed by the configs
 */
    var ModuleItem = Backbone.Model.extend({
      initialize: function () { this.options = configs; }, 
      urlRoot: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType']; },
      idAttribute: '_id'
    });

    
    
/*********************************************
 * Backbone Collection
 *********************************************/
 
/*
 * Default Backbone Collection
 * url: constructed by the configs
 * comparator: sorting function 
 * filters: some filtering functions to reduce the collection
 */
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
 
/*
 * Default Backbone ItemView
 * template: underscore import the template
 * className: class name for the output html element, default: <div class="className"></div>
 * events: user defined events to trigger ItemView functions
 * functions: user defined fuctions
 */
    var ModuleItemView = Backbone.Marionette.ItemView.extend({
      initialize: function () {
        _.bindAll(this, 'className');
      },
      template: _.template(tplItemView),
      className: function() {
        return 'col-md-' + Math.round(12/configs[module].itemPerRow);
      },
      events: {
        //'dblclick'    : 'edit'
      },
      edit: function (e) {
        e.preventDefault();
        if (QuestCMS.user) {
          Backbone.history.navigate('qadmin/' + module);
          var _id = this.model.get("_id");
          QuestCMS.vent.trigger(module + ':edit', {_id: _id});
        }
      }
    });
    
    
    var ModuleAdminUniveralSearchResultView = Backbone.Marionette.ItemView.extend({
      initialize: function () {
        
      },
      template: _.template(tplAdminUniveralSearchResultView),
      onShow: function () {
        var options = {
          placeholder: '.displayResult',
          model: this.model
        };
				
				switch (this.options.targetPage) {
					case 'viewAppointment':
						QuestCMS.vent.trigger('appointment:displayViewMyAppointmentsForm', options);
						break;
					case 'viewUserProfile':
						QuestCMS.vent.trigger('user:edit', options);
						break;
					default:
						QuestCMS.vent.trigger('user:edit', options);
				}
      },
      events: {
        'click .viewUserProfile'    : 'viewUserProfile',
        'click .viewAppointment'    : 'viewAppointment'
      },
      viewUserProfile: function (e) {
        e.preventDefault();
        
        var options = {
          placeholder: '.displayResult',
          model: this.model
        };
        QuestCMS.vent.trigger('user:edit', options);
      },
      viewAppointment: function (e) {
        e.preventDefault();
        
        var options = {
          placeholder: '.displayResult',
          model: this.model
        };
        QuestCMS.vent.trigger('appointment:displayViewMyAppointmentsForm', options);
      }
    });
    
/*********************************************
 * Backbone Marionette CompositeView
 *********************************************/
 
/*
 * Default Backbone CompositeView
 * template: underscore import the template
 * appendHtml: default function to construct the composite view by adding up the item views
 * onRender: function will be executed after the view is rendered. Suitable to add some jQuery codes here to further modified the DOM
 */
    var ModuleCompositeView = Backbone.Marionette.CompositeView.extend({
      itemView: ModuleItemView,
      template: _.template(tplCompositeView),
      appendHtml: function (collectionView, itemView, index) {
        if ((this.start <= index) && (index < this.end)) {
          collectionView.$(".questcms-administrations").append(itemView.el);
        }
      },
			onRender: function () {
				$(document).scrollTop(0);
			}
    });

    
    

/*********************************************
 * common functions
 *********************************************/
 

 
    /*
     * the Callback function subsribed to the PubSub topic "admin:list:start"
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
    
    var isAuthorize = function (options) {
      return QuestCMS.user.isTeacher();  
    };
    
    
    /*
     * the default function to run when user type in a URL to trigger this module
     *
     * @param {String} alias        the querystring after the # key in URL
     */
    var resolve = function (alias) {
      var page = 1;
      QuestCMS.Cookie.save({alias: alias, page: page});
      QuestCMS.Utils.setSiteTitle(QuestCMS.l('Administration'));
      // if (isAuthorize()) {
        display({alias: alias, page: page});
      // }
    };
    
    
    /*
     * the Callback function subsribed to the PubSub topic "search:start"
     * called by the publisher (mostly the search module) to the topic "search:start"
     *
     * @param {String} topic        subscribed topic for the PubSub system
     * @param {String} publisher    name of the caller module
     * @param {Object} options      module (String) this module name
     *                              query (Object) the search term
     *                              collection (Backbone Collection) this module default Collection
     */
    var search = function (topic, publisher, term) {
        var query = {term: term};
        QuestCMS.vent.trigger("search:search", {module: module, query: query, collection: ModuleCollection});
    };
    
/*********************************************
 * functions
 *********************************************/
 
 
    /*
     * Default dipslay wrapper for this module
     * call Fetch to get the collection first
     * and then call another function to show the view
     *
     * @param {Object} options      alias (String) URL alias (after the # key)
     */
    var display = function (options) {
      options = options || {};
      options.page = options.page || 1;
      showView();
      
      //fetch(options, function (err, cachedCollection) {
      //  if (err) {
      //    QuestCMS.Utils.showAlert('Error', err);
      //  } else {
      //    showView(options);
      //    /* or trigger QuestCMS main application to show the view */
      //    /*
      //      QuestCMS.vent.trigger("questcms:display", {module: module, collection: ModuleCollection, view: ModuleCompositeView, region: configs[module]['region']});  
      //      */
      //  }
      //});
    };


		var displayAdminUniversalSearchResultView = function (options) {
			options = options || {};
			
			var view = new ModuleAdminUniveralSearchResultView({model: options.model, targetPage: options.targetPage});
			QuestCMS.layout[configs[module]['region']].show(view);
		}

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

    
    
    /*
     * Fetch and cache the data collection
     *
     * @param {Object} options      for backend filtering
     * @param {Callback} callback      callback accept 2 arguments (err, collection)
     */
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
        
        var data = $.extend({}, options, true);
        cachedCollection.fetch({data: data});

        deferred.done(function () {
          callback(null, cachedCollection);
        });
      }
    };
   
    var showPage = function (options) {
      options = options || {};
      currentPage = options.page || currentPage;

      var view = new ModuleItemView({  });
      QuestCMS.layout[configs[module]['region']].show(view); 
    };
   
    /*
     * Actual function to display the view
     * call Fetch to get the collection first
     * and then call another function to show the view
     *
     * @param {Object} options      alias (String) URL alias (after the # key)
     */
    var showView = function (options) {
      options = options || {};
      currentPage = options.page || currentPage;
      var collection = cachedCollection;
      var view = new ModuleCompositeView({ collection: collection, onCloseCallback: viewOnClose, page: currentPage });
      QuestCMS.layout[configs[module]['region']].show(view); 
    };
   
   
   
    /*
     * Function being trigger when the view is closed
     */
    var viewOnClose = function () {
      /* do something such as close the sidebar view */
      QuestCMS.layout.toolBoxRegion.close(); 
    };
    
/*********************************************
 * Return
 *********************************************/
    return Administration;
    
});