/*********************************************
 * Selection module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

;define([
  "jquery",
	"text!tpl/selection.html"
],

function ($, templateString) {
	
	var module = "selection"; // lowercase only
	var configs = {};
			
/*********************************************
 * Main function (export)
 *********************************************/
 
  var itemList = [];
	
	var Selection = function () {
		configs[module] = {
		};
		$.extend(true, configs, QuestCMS.Config.toJSON());
	};
	
	
	Selection.prototype.showSelection = function (id, callback) {
	  fetch(id, function (err, itemList) {
		  iterate(err, itemList, callback);
		});
	};
    
	var fetch = function (id, callback) {
	  // may modify to get data from server
		var template = $('#'+ id, '<div>' + templateString + '</div>').html();
		itemList = JSON.parse(template);
		callback(null, itemList);
	}
	
	var iterate = function (err, array, callback) {
		  if (err) {
			} else {
				array.forEach(function (item, index) {
					callback(item, index);
				});
			}
	};
	
/*********************************************
 * Return
 *********************************************/
	
	return Selection;
   
});
		