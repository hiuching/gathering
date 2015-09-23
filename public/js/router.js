define([
  "marionette",
  "controller"
],

function (Marionette, controller) {
        //console.log('enter router ');
        
    var Router = Backbone.Marionette.AppRouter.extend({
      controller: controller,
      routes : {
        '*alias': 'resolve'
      },
      resolve: function (alias){
        //console.log('enter router resolve ');
        return this.controller.resolve(alias);
      }
    });
    return Router;
});