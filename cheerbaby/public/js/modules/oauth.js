/*********************************************
 * OAuth module
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
  "text!tpl/oauth.html"
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
    var tplItemView = $('#ItemView', '<div>' + templateString + '</div>').html();
    var tplAuthorizeItemView = $('#AuthorizeItemView', '<div>' + templateString + '</div>').html();

    
/*********************************************
 * Module scope variables
 *********************************************/
 
/*
 * Define the module-wide variables here
 * at least 2 variables: module and configs.
 */
    var module = "oauth"; // lowercase only
    var configs = {};


    var currentPage;
    
/*********************************************
 * Main function (export)
 *********************************************/
 
/*
 * Main module funtion here
 * name is CamelCase
 */
    var OAuth = function () {
      var self = this;
      configs[module] = {             // module specified config options
        isCachedCollection: false,
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


      /*********************************************
       * Listening events
       *********************************************/
       

     
      QuestCMS.vent.on("layout:rendered", function () {
      });
      
      
      QuestCMS.vent.on(module + ":resolve", function (alias) {
        resolve(alias);
      });
      
      
      /* module specified events */
      QuestCMS.vent.on(module + ":display", function (options) {
        options = options || {};
        QuestCMS.Cookie.set({module: module});
        var alias = QuestCMS.Cookie.get("alias");
        Backbone.history.navigate(alias);
        display({alias: alias, page: options.page});
      });
			
      QuestCMS.vent.on(module + ":authorize", function (options) {
        options = options || {};
        QuestCMS.Cookie.set({module: module});
        var alias = QuestCMS.Cookie.get("alias");
        Backbone.history.navigate(alias);
				
				var url = options.split("&");
				var data = {
					transactionID: url[1],
					username: url[2],
					clientName: url[3],
					scope: url[4],
					oauth2Authorize: url[5]
				};
        authorize({alias: alias, page: options.page, data: data});
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
        'dblclick'    : 'edit',
		'mousedown .glyphicon-eye-open'   : 'toggleHidden',
		'mouseup .glyphicon-eye-open' 		 : 'toggleHidden'
      },
      edit: function (e) {
        e.preventDefault();
        if (QuestCMS.user && QuestCMS.user.isEditor()) {
          Backbone.history.navigate('qadmin/' + module);
          var _id = this.model.get("_id");
          QuestCMS.vent.trigger(module + ':edit', {_id: _id});
        }
      },
	  toggleHidden: function (e) {
		e.preventDefault();
		QuestCMS.Utils.toggleHidden('#password', e);
	  }
    });
		
    var ModuleAuthorizeItemView = Backbone.Marionette.ItemView.extend({
      initialize: function () {
				this.options = this.options.data;
        _.bindAll(this, 'className');
      },
			serializeData: function () {
				return {
					username: this.options.username,
					clientName: this.options.clientName,
					scope: this.options.scope,
					transactionID: this.options.transactionID,
					oauth2Authorize: this.options.oauth2Authorize
				}
			},
      template: _.template(tplAuthorizeItemView),
      className: function() {
        return 'col-md-' + Math.round(12/configs[module].itemPerRow);
      },
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
 


/*********************************************
 * common functions
 *********************************************/

    
    /*
     * the default function to run when user type in a URL to trigger this module
     *
     * @param {String} alias        the querystring after the # key in URL
     */
    var resolve = function (alias) {
      var page = 1;
      QuestCMS.Cookie.save({alias: alias, page: page});
      display({alias: alias, page: page});
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
      
      console.log('oauth');
      var view = new ModuleItemView();
      QuestCMS.layout[configs[module]['region']].show(view); 
    };


    var authorize = function (options) {
      options = options || {};  
      
      var view = new ModuleAuthorizeItemView({data: options.data});
      QuestCMS.layout[configs[module]['region']].show(view); 
    };



    
/*********************************************
 * Return
 *********************************************/
    return OAuth;
    
});