/*********************************************
 * Log module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/


;define([
  "questcms"
],

function (QuestCMS) {


    QuestCMS.Log = function () {
      var Log = {}, options = {}, logItem = {};

      var LogItem = Backbone.Model.extend({
        idAttribute: '_id',
        initialize: function () {
          this.options = $.extend(true, {}, QuestCMS.getConfigs(), options);
        },  
        url: function () {
          return QuestCMS.Utils.setAPIUrl(this.options) + '/logs';
        }
      });
      
      var LogCollection = Backbone.Collection.extend({
        initialize: function () {
          this.options = $.extend(true, {}, QuestCMS.getConfigs(), options);
        },  
        model: LogItem,
        url: function () {
          return QuestCMS.Utils.setAPIUrl(this.options) + '/logs';
        },
        
        comparator: function (data) {
          return -data.get("id");
        }
      });
      
      Log.init = function (log) {
          logItem = new LogItem({
            logTitle: log.title,
            logContent: log.content,
            logDate: new Date(),
            userId: log.user.id,
            userDisplayName: log.user.displayName
          });
      };
      
      Log.update = function (content) {
          logItem.set(content);
      };

      Log.save = function () {
          logItem.save(null, {
            success: function (log) {
              console.log(log);
            }
          });
      };
      
      QuestCMS.vent.on("log:start", function (log) {
        Log.init(log);
      });
      
      QuestCMS.vent.on("log:update", function (content) {
        Log.update(content);
      });
      
      QuestCMS.vent.on("log:save", function () {
        Log.save();
      });
      
      return Log;
    }();

});