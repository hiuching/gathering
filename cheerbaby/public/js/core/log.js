define([
  "marionette"
],

function (Marionette) {

    var module = "log";
    var configs = {};
    
    var Log = function (data) {
      $.extend(true, configs, QuestCMS.Config.toJSON());
    
      var content = [];
      if (data.content) {
        content.push(data.content);
      }
      this.moduleItem = new ModuleItem({
        dataType: module,
        module: data.module,
        title: data.title,
        content: content,
        timestamp: new Date(),
        userId: QuestCMS.user.id,
        user: QuestCMS.user
      });
    };

    var ModuleItem = Backbone.Model.extend({
      initialize: function () { this.options = configs; }, 
      urlRoot: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/questlog/' + module; },
      idAttribute: '_id'
    });
    
    var ModuleCollection = Backbone.Collection.extend({
      initialize: function () { this.options = configs; }, 
      url: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/questlog/' + module; },    
      model: ModuleItem,
      
      comparator: function (data) {
        return -data.get("_id");
      }
    });
    
    Log.prototype.save = function () {
        this.moduleItem.save(null, {
          success: function (model, response, options) {
          },
          error: function(model, xhr, options) {
            //QuestCMS.Utils.showAlert('Error', 'Activity log failed');
          }
        });
    };
    
    Log.prototype.update = function (newContent) {
        var content = this.moduleItem.get('content');
        content.push(newContent);
        this.moduleItem.set({content: content});
    };
          
      
    return Log;

});