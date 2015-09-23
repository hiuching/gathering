;define([
  "marionette",
  "text!tpl/layout.html"
],

function (Marionette, htmlLayout) {

/*********************************************
 * Main function (export)
 *********************************************/
 
    var tplLayout = [];
    tplLayout["toilet"] = $('#Layout', '<div>' + htmlLayout + '</div>').html();
    
/*********************************************
 * Backbone Layout
 *********************************************/
var Layout = Backbone.Marionette.Layout.extend({
        initialize: function(options){
                this.template = _.template(tplLayout[options.tmplName]);
        },
        regions: {
        menuRegion: "#menuRegion",
        contentRegion: "#contentRegion"
        }
});
    
/*********************************************
 * Return
 *********************************************/
    return Layout;
   
});