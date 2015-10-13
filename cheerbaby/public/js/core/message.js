/*********************************************
 * Message module
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
 * Configurations
 *********************************************/
 
    var module = "message";
    var configs = {};
    
    
/*********************************************
 * Main function (export)
 *********************************************/
 
    var Message = function (data) {
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
        senderId: QuestCMS.user.id,
        sender: QuestCMS.user,
        receiverId: null
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
    Message.prototype.save = function () {
        this.moduleItem.save(null, {
          success: function (model, response, options) {
          },
          error: function(model, xhr, options) {
            //QuestCMS.Utils.showAlert('Error', 'Message log failed');
          }
        });
    };
    
    Message.prototype.update = function (newContent) {
        var content = this.moduleItem.get('content');
        content.push(newContent);
        this.moduleItem.set({content: content});
    };

    
/*********************************************
 * Return
 *********************************************/
    return Message;
});