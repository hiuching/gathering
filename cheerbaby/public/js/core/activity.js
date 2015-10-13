/*********************************************
 * Activity module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
 
;define([
  "marionette"
], 

function (Marionette) {


/*********************************************
 * Templates
 *********************************************/
 
    
    
/*********************************************
 * Configurations
 *********************************************/
    var module = "activity";
    var configs = {};
    
    
    
/*********************************************
 * Main function (export)
 *********************************************/   
    var Activity = function (data) {
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

    
    
    
/*********************************************
 * Backbone Model
 *********************************************/
    var ModuleItem = Backbone.Model.extend({
      initialize: function () { this.options = configs; }, 
      urlRoot: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/questlog/' + module; },
      idAttribute: '_id'
    });
    
    
    
/*********************************************
 * Backbone Collection
 *********************************************/
    var ModuleCollection = Backbone.Collection.extend({
      initialize: function () { this.options = configs; },  
      url: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/questlog/' + module; },    
      model: ModuleItem,
      
      comparator: function (data) {
        return -data.get("_id");
      }
    });
    
 
 
/*********************************************
 * functions
 *********************************************/
    Activity.prototype.save = function () {
      if (configs[module]['enable']) {
        this.moduleItem.save(null, {
          success: function (model, response, options) {
          },
          error: function(model, xhr, options) {
            //QuestCMS.Utils.showAlert('Error', 'Activity log failed');
          }
        });
      }
    };
    
    
    
    Activity.prototype.update = function (newContent) {
      if (configs[module]['enable']) {
        var content = this.moduleItem.get('content');
        content.push(newContent);
        this.moduleItem.set({content: content});
      }
    };
    
    
/*********************************************
 * Return
 *********************************************/
    return Activity;
});