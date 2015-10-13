/*********************************************
 * Dialog module
 *
 * author: Eric Sin
 * version: 1.0.5
 * created: 2015-07-15T15:16:00Z
 * modified: 2015-07-15T15:16:00Z
 *
 *********************************************/

;define([
  "jquery",
  "jquery.confirm",
],

function ($, confirm) {

	var module = "dialog"; // lowercase only
	var configs = {};

/*********************************************
 * Main function (export)
 *********************************************/

  var itemList = [];

	var Dialog = function () {
		configs[module] = {
		};
		$.extend(true, configs, QuestCMS.Config.toJSON());
	};


	Dialog.prototype.show = function (options) {
		options = options || {};
    if (options.placeholder && options.placeholder !== '') {
		  var $dialog = $(options.placeholder);
      $dialog.confirm(handleOptions(options));
    } else {
      $.confirm(handleOptions(options));
    }
	};

/*********************************************
 * Private Methods
 *********************************************/
var handleOptions = function (options) {
  options = options || {};

  var conditions = {
    text: options.text || QuestCMS.l('Dialog-Default-Message') + '?',
    title: options.title || QuestCMS.l('Dialog-Default-Title'),
    post: options.post || false,
    hideButtons: options.hideButtons || false,
    confirmButton: options.confirmButton || QuestCMS.l('Confirm'),
    cancelButton: options.cancelButton || QuestCMS.l('Cancel'),
    confirmButtonClass: options.confirmButtonClass || 'btn-danger',
    cancelButtonClass: options.cancelButtonClass || 'btn-default',
    dialogClass: options.dialogClass || 'modal-dialog modal-lg'
  };

  if (options.confirm) {
    conditions.confirm = options.confirm || function (button) {};
  }

  if (options.cancel) {
    conditions.cancel = options.cancel || function (button) {};
  }

  return conditions;
};

/*********************************************
 * Return
 *********************************************/

	return Dialog;
});
