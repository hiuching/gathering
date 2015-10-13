;define([
  "marionette",
  "text!tpl/configuration.html"
], 

function (Marionette, templateString) {

    var tplItemView = $('#ItemView', '<div>' + templateString + '</div>').html();

    var module = "configuration";
    var configs = {};
    
    var Configuration = function (options) {
      var self = this;
      $.extend(true, configs, QuestCMS.Config.toJSON());
      options = options || {};
      if (typeof options.region != 'undefined') {
        configs[module]['region'] = options.region;
      }
      //console.log('new Configuration');
      
      // listening events
      QuestCMS.vent.on("pubsub:started", function () {
        // uncomment the following line to include in search result
      });
      
      QuestCMS.vent.on("layout:rendered", function () {
      });
      
            
      QuestCMS.vent.on(module + ":resolve", function (alias) {
        resolve(alias);
      });
      
      
      QuestCMS.vent.on(module + ":display", function () {
        QuestCMS.Cookie.save({module: module});
        var alias = QuestCMS.Cookie.get("alias");
        Backbone.history.navigate(alias);
        display();
      });
      
    };


      
    var ModuleItemView = Backbone.Marionette.ItemView.extend({
      initialize: function () {
        this.changes = {}; 
      }, 
      template: _.template(tplItemView),       
      events: {
        'change' : 'change',
        'click .save'    : 'save'
      },
      change: function(e) {
        var target = e.target;
        this.changes[target.name] = target.value;
      },
      save: function (e) {
        var self = this;
        e.preventDefault();
        this.model.set(self.changes, {silent:true});
        QuestCMS.vent.trigger("routing:resolve", QuestCMS.Cookie.get("alias"));
      },
      onRender: function() {
        QuestCMS.Utils.setSiteTitle(QuestCMS.l(module));
      }
    });
    

    var display = function () {
        // comment the following if using custom display function
        //QuestCMS.vent.trigger("questcms:display", {module: module, alias: options.alias, collection: ModuleCollection, view: ModuleCompositeView, region: configs[module]['region']});
        // your display function code here
        var view = new ModuleItemView({model: QuestCMS.Config});
        QuestCMS.layout.contentRegion.show(view);
    };

    var resolve = function (alias) {
      //QuestCMS.Cookie.save({alias: alias, module: module});
      display();
    };
    
  
    return Configuration;


});