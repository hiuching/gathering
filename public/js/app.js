;define([
  "jquery",
  "underscore",
  "backbone",
  "marionette",
  "bootstrap",
  "layout",

  "core/toilet"
], function($, _, Backbone, Marionette, Bootstrap, Layout,
Toilet
){    
        var module = "app";
        App = new Backbone.Marionette.Application();
       
       App.initializeLayout = function (layoutName) {
                //console.log('initializeLayout');
                App.layout = new Layout({tmplName: layoutName});             
                App.content.show(App.layout);
        };
/*********************************************
* Shortcut functions
*********************************************/
App.display = function (options) {
        options = options || {};
        this.fetch(options, function (err, collection) {
                var view = new options.view({ collection: collection });
                if (options.region) {
                        App.layout[options.region].show(view);
                }
        });
};
/*********************************************
* Listening events
*********************************************/      
        App.vent.on("routing:started", function () {
                if (!Backbone.History.started) {
                Backbone.history.start({ pushState: false });
                }
        });
        
        App.on(module + ":display", function (options) {
                App.display(options);
        }); 
        
        
         App.addInitializer(function(options) {
                initComponents();
        });
/*********************************************
 * init functions
 *********************************************/
function initComponents() {

        App.Toilet = new Toilet();
};   
 /*********************************************
 * Return
 *********************************************/
        return App;
});