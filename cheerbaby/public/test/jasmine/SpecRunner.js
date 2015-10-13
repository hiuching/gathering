require.config({
  baseUrl: "../../js/",
  //urlArgs: 'cb=' + Math.random(),
  paths: {
  
    // jasmine test specific
    "jasmine"     : "../test/jasmine/spec/lib/jasmine-1.2.0/jasmine",
    "jasmine-html": "../test/jasmine/spec/lib/jasmine-1.2.0/jasmine-html",
    "spec"        : '../test/jasmine/spec/',  
  
    "libs"        : "../libs",
    "tools"       : "tools",
    "userfile"    : "../userfile",
    "tpl"         : "../userfile/tpl",
    "i18n"        : "../userfile/i18n",   
    
    // libraries
    
    "jquery"      : "../libs/jquery/jquery-1.8.2",
    "json2"       : "../libs/json2/json2",
    "jquery.cookie"      : "../libs/jquery.cookie/jquery.cookie",
    "underscore"  : "../libs/underscore/underscore",
    "backbone"    : "../libs/backbone/backbone",
    "marionette"  : "../libs/backbone.marionette/backbone.marionette",
    "bootstrap"   : "../libs/bootstrap/js/bootstrap",
    "hmac-sha1"   : "../libs/crypto-js/hmac-sha1",
    "enc-base64"  : "../libs/crypto-js/enc-base64-min",
    
    // plugins
    "text"        : "../libs/requirejs/text",
    "jquery.equalheights"  : "../libs/jquery.equalheights/jquery.equalheights",
    "ckeditor"  : "../libs/ckeditor/ckeditor",
    
    // tools
    "encryption"  : "tools/encryption",
    "date"        : "tools/date",
    "utils"       : "tools/utils"
    

  },
  shim: {
    "jasmine": {
      exports: "jasmine"
    },
    "jasmine-html": {
      deps: ["jasmine"],
      exports: "jasmine"
    },
    "underscore" : {
      exports: "_"
    },
    "backbone" : {
      deps: ["jquery", "underscore"],
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
    "jquery.equalheights" : {
      deps: ["jquery"]
    },
    "hmac-sha1" : {
      exports: "CryptoJS"
    },
    "enc-base64" : {
      deps: ["hmac-sha1"]
    },
    "ckeditor" : {
      exports: "CKEDITOR"
    }
  }
});



require([
  'underscore',
  'jquery',
  'jasmine-html'
],

function(_, $, jasmine){

  var jasmineEnv = jasmine.getEnv();
  jasmineEnv.updateInterval = 1000;

  var htmlReporter = new jasmine.HtmlReporter();

  jasmineEnv.addReporter(htmlReporter);

  jasmineEnv.specFilter = function(spec) {
    return htmlReporter.specFilter(spec);
  };

  var specs = [];
  
  specs.push('spec/configSpec');
  specs.push('spec/questcmsSpec');
  specs.push('spec/footerSpec');




  $(function(){
    require(specs, function(){
      jasmineEnv.execute();
    });
  });

});
