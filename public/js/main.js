require.config({
        baseUrl: "./js",
        paths: {
            // libraries
        "libs"        : "../libs",
        "backbone"    : "../libs/backbone/backbone-min",
        "bootstrap"   : "../libs/bootstrap/js/bootstrap",
        "bootstrap-select"   : "../libs/bootstrap-select",
        "jquery"      : "../libs/jquery/jquery-1.11.2.min",
        "json2"       : "../libs/json2/json2",
        "jstarbox"       : "../libs/starbox",
        "marionette"  : "../libs/backbone.marionette/backbone.marionette.min",
        'async': '../libs/async',
        "text"        : "../libs/requirejs/text",
        "underscore"  : "../libs/underscore/underscore-1.4.4.min",
        
        "tpl"         : "../tpl"
        },
  shim: {
    "underscore" : {
      exports: "_"
    },
    "backbone" : {
      deps: ["jquery", "underscore", "json2"],
      exports: "Backbone"
    },
    "marionette" : {
      deps: ["backbone"],
      exports: "Backbone.Marionette"
    },
    "bootstrap" : {
      deps: ["jquery"],
      exports: "Bootstrap"
    },
    "bootstrap-select" : {
      deps: ["jquery"],
      exports: "bootstrap-select"
    },
    "jstarbox" : {
      deps: ["jquery"],
      exports: "jstarbox"
    },
}
});

require(['jquery', 'backbone','marionette',
'app',
'config',
'router'
], function ($,Backbone,Marionette,
App,
Config,
Router
){
        //App.Config = new Config();
        App.addInitializer(function () {
                App.Router = new Router();
                App.vent.trigger("routing:started");
                //console.log('enter addinitializer');
        });
        App.addRegions({
                content: "#mainContent"
        });
        return   App.start();   
});