/*********************************************
 * Admin Menu module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
 
;define([
  "marionette",
  "text!tpl/adminmenu.html"
], 

function (Marionette, templateString) {


/*********************************************
 * Templates
 *********************************************/
    var tplItemView = $('#ItemView', '<div>' + templateString + '</div>').html();
    var tplCompositeView = $('#ListView', '<div>' + templateString + '</div>').html();

    
    
/*********************************************
 * Configurations
 *********************************************/
    var module = "adminmenu";
    var configs = {};
    
    var subscribers;
    
    
/*********************************************
 * Main function (export)
 *********************************************/
    var AdminMenu = function () {
      var self = this;
      $.extend(true, configs, QuestCMS.Config.toJSON());
      //console.log('new AdminMenu');
      
      /*********************************************
       * Listening events
       *********************************************/
       
      /* common events */
      QuestCMS.vent.on("layout:rendered", function () {
        display();
      });
      
      QuestCMS.vent.on("language:switch", function (lang) {
        display();
      });
      
      QuestCMS.vent.on(module + ":resolve", function (alias) {
        resolve(alias);
      });

    };


    
/*********************************************
 * Backbone Model
 *********************************************/
    var ModuleItem = Backbone.Model.extend({
      initialize: function () { this.options = configs; }, 
      urlRoot: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/' + module; },
      idAttribute: '_id'
    });
    
    
    
/*********************************************
 * Backbone Collection
 *********************************************/
    var ModuleCollection = Backbone.Collection.extend({
    });
      
      
/*********************************************
 * Backbone Marionette ItemView
 *********************************************/
    var ModuleItemView = Backbone.Marionette.ItemView.extend({
      tagName: 'li',
      className: 'adminMenuItem',
      template: _.template(tplItemView),
      events: {
        "click"       : "gotoURL"
      },
      gotoURL: function (e) {
        e.preventDefault();
        QuestCMS.layout.slideMenuIn();
        QuestCMS.vent.trigger(module + ":resolve", this.model.get('targetUrl'));
      }
    });
      
      
/*********************************************
 * Backbone Marionette CompositeView
 *********************************************/
    var ModuleCompositeView = Backbone.Marionette.CompositeView.extend({
      id: "adminMenuList",
      className: "adminMenuList",
      itemView: ModuleItemView,
      template: _.template(tplCompositeView),
      
      appendHtml: function (collectionView, itemView, index) {
        collectionView.$(".questcms-adminmenus").append(itemView.el);
      }
    });
    
    
    
    
/*********************************************
 * common functions
 *********************************************/

    var resolve = function (alias) {
        Backbone.history.navigate(alias);
        QuestCMS.Cookie.save({alias: alias});

        if (alias.indexOf("qadmin") === 0) {
          var action = alias.split('/');
          
          if ((action[1] == '') || (action[1] == 'login')) {
            //QuestCMS.vent.trigger("admin:resolve", alias);
            QuestCMS.vent.trigger("event:resolve");
          }
          if (action[1] == 'configuration') {
            QuestCMS.vent.trigger("configuration:resolve", {target: action[2], term: action[3]});
          }             
          
          if (QuestCMS.user) {
            if (action[1] == 'logout') {
              QuestCMS.vent.trigger("user:logout");
            }
            if ((action[1] == 'addnew') && (QuestCMS.allow('', 'add', {}))) {
              QuestCMS.vent.trigger("admin:add", {});
            }
            if (action[1] == 'list') {
              QuestCMS.vent.trigger("admin:list", {target: action[2], term: action[3]});
            }
          }
          
        } else {
          QuestCMS.vent.trigger("routing:resolve", alias);
					
					if (!QuestCMS.user.isValidAccount() && !QuestCMS.user.isAdmin()) {
						QuestCMS.Utils.showAlert('Warning', 'Please fill in the mandatory fields!');
						QuestCMS.Utils.setUrlPath({pathname: '#user/edit'});
					} else {
						QuestCMS.Utils.setUrlPath({pathname: '#administration'});
					}
        }
        display();

    };
      

/*********************************************
 * functions
 *********************************************/
    var display = function () {

      if ((QuestCMS.Config.get("adminMenu")).alwaysOn) {
        QuestCMS.layout.showSlideMenu();
      } else {
        // if (QuestCMS.user && QuestCMS.user.isEditor()) {
          // QuestCMS.layout.showSlideMenu();
        // } else {
          QuestCMS.layout.hideSlideMenu();
				// }
      }

      subscribers = QuestCMS.Pubsub.getSubscriberList("admin:list:start");
      var menu = new ModuleCollection();

      if (QuestCMS.user) {
        menu.add({title: QuestCMS.l("Logout"), targetUrl: "qadmin/logout"});
        menu.add({title: QuestCMS.l("Configuration"), targetUrl: "qadmin/configuration"});
        menu.add({title: QuestCMS.l("Enrollment"), targetUrl: "enrollment"});
        if (QuestCMS.allow(module, 'display', {})) {
          menu.add({title: QuestCMS.l("Add New Item"), targetUrl: "qadmin/addnew"});
          menu.add({title: QuestCMS.l("All Items List"), targetUrl: "qadmin/list/all"});
          $.each(subscribers, function (index, item) {
            var title = QuestCMS.l(QuestCMS.Utils.toTitleCase(item.subscriber)) + QuestCMS.l(" List");
            menu.add({title: title, targetUrl: "qadmin/list/" + item.subscriber});
          });
        }
      } else {
        menu.add({title: QuestCMS.l("Login"), targetUrl: "qadmin/login"});
        menu.add({title: QuestCMS.l("Configuration"), targetUrl: "qadmin/configuration"});
      }

      var view = new ModuleCompositeView({ collection: menu });
      QuestCMS.layout.adminRegion.show(view);
    };

    
/*********************************************
 * Return
 *********************************************/
    return AdminMenu;


});