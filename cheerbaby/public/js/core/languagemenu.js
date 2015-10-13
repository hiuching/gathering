/*********************************************
 * Language Menu module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/


;define([
  "marionette",
  "text!tpl/languagemenu.html"
],

function (Marionette, templateString) {


/*********************************************
 * Templates
 *********************************************/
    var tplCompositeView = $('#ListView', '<div>' + templateString + '</div>').html();
    var tplItemViewTextOnly = $('#ItemView-TextOnly', '<div>' + templateString + '</div>').html();
    var tplItemViewImageOnly = $('#ItemView-ImageOnly', '<div>' + templateString + '</div>').html();
    var tplItemViewImageAndText = $('#ItemView-ImageAndText', '<div>' + templateString + '</div>').html();
    
    
/*********************************************
 * Configurations
 *********************************************/
    
    var module = "languagemenu";
    var configs = {};
    
    
/*********************************************
 * Main function (export)
 *********************************************/
    var LanguageMenu = function () {
      var self = this;
      /* imageonly, textonly */
      configs[module] = {
        display: 'imageonly', 
        languages: [
          { name: "en-us", label: "English", imgsrc: "userfile/img/language/en-us.png", order: 1, active: 1 },
          { name: "zh-hant", label: "繁體", imgsrc: "userfile/img/language/zh-hant.png", order: 2, active: 1 },
          { name: "zh-hans", label: "简体", imgsrc: "userfile/img/language/zh-hans.png", order: 3, active: 1 }  
        ],
        region: 'languageMenuRegion'
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());
      //console.log('new LanguageMenu');
      
      /*********************************************
       * Listening events
       *********************************************/

      /* common events */
      QuestCMS.vent.on("layout:rendered", function () {
        display();
      });
      
      QuestCMS.vent.on(module + ":show", function (options) {
        display(options);
      });
    };
    
    
/*********************************************
 * Backbone Model
 *********************************************/
    var ModuleItem = Backbone.Model.extend({
      idAttribute: '_id',
      getActive: function () {
        return this.get('active') || 0;
      },
      getName: function () {
        return this.get('name') || '';
      },
      getOrder: function () {
        return this.get('order') || 99;
      },
      isActive: function () {
        return (this.getActive() == 1);
      }
    });
    
    
/*********************************************
 * Backbone Collection
 *********************************************/
    var ModuleCollection = Backbone.Collection.extend({
      model: ModuleItem,
      comparator: function (data) {
        return data.getOrder();
      },
      activeOnly: function () {
        return new ModuleCollection(this.filter(function (data) {
          return data.isActive();
        }));
      }
    });

    
    
/*********************************************
 * Backbone Marionette ItemView
 *********************************************/
    var ModuleItemView = Backbone.Marionette.ItemView.extend({
      initialize: function () {
        if (configs[module]['display'] == 'textonly') {
          this.template = _.template(tplItemViewTextOnly);
        } else if (configs[module]['display'] == 'imageonly') {
          this.template = _.template(tplItemViewImageOnly);
        } else {
          this.template = _.template(tplItemViewImageAndText);
        }
      }, 
      tagName: 'li',
      events: {
        'click': 'switchLanguage'
      },
      switchLanguage: function (e) {
        e.preventDefault();
        var lang = this.model.getName();
        QuestCMS.Cookie.save({lang: lang});
				QuestCMS.Utils.setSiteTitle(QuestCMS.l('Home'));
        // QuestCMS.vent.trigger(module + ":switch", lang);
        QuestCMS.vent.trigger("routing:resolve", QuestCMS.Cookie.get("alias"));
      }
    });
    
    
/*********************************************
 * Backbone Marionette CompositeView
 *********************************************/
    var ModuleCompositeView = Backbone.Marionette.CompositeView.extend({
      itemView: ModuleItemView,
      template: _.template(tplCompositeView),
      
      appendHtml: function (collectionView, itemView, index) {
        collectionView.$(".questcms-languageMenus").append(itemView.el);
      }
    });
      
      
/*********************************************
 * functions
 *********************************************/
    var display = function (options) {
      options = options || {};
      
      
      if (!QuestCMS.languageMenuCollection) {
        QuestCMS.languageMenuCollection = new ModuleCollection(configs[module]['languages']);
      }
      collection = QuestCMS.languageMenuCollection.activeOnly();
      if (collection.length > 1) {
        var view = new ModuleCompositeView({ collection: collection });
        if (options.placeholder) {
          $(options.placeholder).html(view.render().el);
        } else {
          QuestCMS.layout[configs[module]['region']].show(view); 
        }
      }

    };


/*********************************************
 * Return
 *********************************************/
    return LanguageMenu;

});
