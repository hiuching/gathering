/*********************************************
 * Footer module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
 
;define([
  "marionette",
  "text!tpl/footer.html"
],

function (Marionette, templateString) {
  
  
/*********************************************
 * Templates
 *********************************************/
    var tplItemView = $('#ItemView', '<div>' + templateString + '</div>').html();
    
    
/*********************************************
 * Configurations
 *********************************************/
    var module = "footer";
    var configs = {};
    
    
    
/*********************************************
 * Main function (export)
 *********************************************/
    var Footer = function () {
      var self = this;
      configs[module] = {
        region: 'footerRegion'
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());
      //console.log('new Footer');
      
      
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
        display();
      });

      QuestCMS.vent.on("languagemenu:switch", function (lang) {
        display();
      });
      
      QuestCMS.vent.on(module + ":hide", function () {
        hide();
      });
      
    };
    
      
      
      
      
/*********************************************
 * Backbone Model
 *********************************************/
 
 
    
    
/*********************************************
 * Backbone Marionette ItemView
 *********************************************/
    var ModuleItemView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplItemView),
      onShow: function () {
        QuestCMS.vent.trigger('languagemenu:show', {placeholder: '#languageMenuRegion'});
        try{
            FB.XFBML.parse(); 
        }catch(ex){}
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
      display({alias: alias, page: page});
    };
    
    
    var search = function (topic, publisher, term) {
        var query = {term: term};
        QuestCMS.vent.trigger("search:search", {module: module, query: query, collection: ModuleCollection});
    };
    
 
/*********************************************
 * functions
 *********************************************/
    var display = function () {
      var view = new ModuleItemView();
      QuestCMS.layout[configs[module]['region']].show(view);
    };
    
    var hide = function () {
      QuestCMS.layout[configs[module]['region']].close(); 
    };

    
/*********************************************
 * Return
 *********************************************/
    return Footer;

});
