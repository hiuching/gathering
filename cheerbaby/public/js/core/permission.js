define([
],

function () {

    var Permission = function () {
      //console.log('new perm');
    };

    Permission.prototype.allow = function (module, action, model) {
        if (QuestCMS.user) {
          if (module == 'question') {
            if (QuestCMS.user.get('_type') == 'Teacher') {
              return true;
            } else {
              return false;
            }
          } else {
            return true;
          }
        } else {
          return false;
        }
    };
      
    return Permission;
   
});
