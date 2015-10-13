/*********************************************
 * Search Box module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
 
;define([
  "marionette",
  "text!tpl/profileheader.html"
],

function (Marionette, templateString) {

/*********************************************
 * Templates
 *********************************************/
 
    var tplListView = $('#ListView', '<div>' + templateString + '</div>').html();

/*********************************************
 * Configurations
 *********************************************/
    var module = "profileheader";
    var configs = {};
    
    
    
/*********************************************
 * Main function (export)
 *********************************************/
    var ProfileHeader = function () {
      var self = this;
      configs[module] = {
        region: 'profileRegion'
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());
      //console.log('new ' + module);
      
      /*********************************************
       * Listening events
       *********************************************/
       
      /* common events */
      QuestCMS.vent.on("layout:rendered", function () {
        display();
      });

      QuestCMS.vent.on("languagemenu:switch", function (lang) {
        display();
      });
			
    };

    
    
    
/*********************************************
 * Backbone Model
 *********************************************/
 
 
/*********************************************
 * Backbone Collection
 *********************************************/
 
 
    
    
    
/*********************************************
 * Backbone Marionette ItemView
 *********************************************/
    var ListView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplListView),
			onShow: function(){
				if(this.model){
					$('.dropdown-toggle').html(this.model.attributes.username + ' ' + QuestCMS.l(QuestCMS.Cookie.get('branch')) + '<b class="caret"></b>').css('color', 'white');
				}
			},
      events: {
        'click .logout'							: 'logout',
        'click .profile'						: 'profile',
        'click .changePassword'			: 'changePassword'
      },
      logout: function (e) {
				e.preventDefault();
        // QuestCMS.vent.trigger("user:logout");
        QuestCMS.Utils.setUrlPath({pathname: '#user/logout'});
      },
      profile: function (e) {
				e.preventDefault();
        QuestCMS.Utils.setUrlPath({pathname: '#user/edit'});
      },
      changePassword: function (e) {
				e.preventDefault();
        QuestCMS.Utils.setUrlPath({pathname: '#user/changePassword'});
        // QuestCMS.vent.trigger("user:displayChangePasswordForm");
      }
    });


/*********************************************
 * Backbone Marionette CompositeView
 *********************************************/

 
/*********************************************
 * functions
 *********************************************/
 
    var display = function () {
        var view = new ListView({model: QuestCMS.user});
        QuestCMS.layout[configs[module]['region']].show(view); 
    };
    
/*********************************************
 * Return
 *********************************************/
    return ProfileHeader;

});
