/*********************************************
 * Layout module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
 
;define([
  "marionette",
  "text!tpl/layout.html",
  "text!tpl/layout-home.html",
  "text!tpl/layout-login.html"
],

function (Marionette, htmlLayout, htmlLayoutHome, htmlLayoutLogin) {

/*********************************************
 * Main function (export)
 *********************************************/
 
    var tplLayout = [];
    tplLayout["questcms-layout"] = $('#Layout', '<div>' + htmlLayout + '</div>').html();
    tplLayout["questcms-layout-home"] = $('#Layout', '<div>' + htmlLayoutHome + '</div>').html();
    tplLayout["questcms-layout-login"] = $('#Layout', '<div>' + htmlLayoutLogin + '</div>').html();
    
    
/*********************************************
 * Backbone Layout
 *********************************************/
    var Layout = Backbone.Marionette.Layout.extend({
      initialize: function(options){
        this.template = _.template(tplLayout[options.tmplName]);
      },
      regions: {
        adminRegion: "#adminRegion",
		    bannerRegion: "#bannerRegion",
        carouselRegion: "#carouselRegion",
        columnsRegion: "#columnsRegion",
        contentRegion: "#contentRegion",
        footerRegion: "#footerRegion",
        languageMenuRegion: "#languageMenuRegion",
        mainMenuRegion: "#mainMenuRegion",
        navigationMenuRegion: "#navigationMenuRegion",
        feedRegion: "#feedRegion",
        searchRegion: "#searchRegion",
        searchBoxRegion: "#searchBoxRegion",
        informationRegion: "#informationRegion",
        toolBoxRegion: "#toolBoxRegion",
        userCardRegion: "#userCardRegion",
				profileRegion: "#profileRegion"
      },
      events: {
        "click #slideMenu-trigger": "slide"
      },
      slide: function (e) {
        if ($('#slideMenu').hasClass('slidein')) {
            slideMenuOut();
        }
        else {
            slideMenuIn();
        }
      },
      hideSlideMenu: function () {
        hideSlideMenu();
      },
      showSlideMenu: function () {
        showSlideMenu();
      },
      slideMenuIn: function () {
        slideMenuIn();
      },
      slideMenuOut: function () {
        slideMenuOut();
      },
      onShow: function () {
			  QuestCMS.vent.trigger("layout:rendered");
      }
    }); 
    
    
    
    
/*********************************************
 * functions
 *********************************************/
    var showSlideMenu = function () {
      $('#slideMenu').show();
    };
    
    var hideSlideMenu = function () {
      $('#slideMenu').hide();
    };
    
    var slideMenuOut = function () {
      $('#slideMenu').removeClass('slidein');
      $('#slideMenu').animate({
          left: 0
      }, 'slow', function () {
          $('#slideMenu-trigger span').html(QuestCMS.l("Close"));  //change the trigger text at end of animation
      });
    };
    
    var slideMenuIn = function () {
      $('#slideMenu').addClass('slidein');
      $('#slideMenu').animate({
          left: -160
      }, 'slow', function () {
          $('#slideMenu-trigger span').html(QuestCMS.l("Show"));  //change the trigger text at end of animation
      });
    };

    
    
/*********************************************
 * Return
 *********************************************/
    return Layout;
   
});