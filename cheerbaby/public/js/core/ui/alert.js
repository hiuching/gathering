/*********************************************
 * Alert module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

;define([
  "jquery",
	"marionette",
  "text!tpl/alert.html"
],

function ($, Marionette, templateString) {

	var tplModalView = $('#ModalView', '<div>' + templateString + '</div>').html();
	var tplSpinnerView = $('#SpinnerView', '<div>' + templateString + '</div>').html();

	var module = "alert"; // lowercase only
	var configs = {};
	configs[module] = {
		defaultPlaceholder: '.alert',
		duration: 3000,
		popup: false,
		showPopupByModalView: true
	};

/*********************************************
 * Main function (export)
 *********************************************/

	var Alert = (function () {

		/*********************************************
		 * Private methods and variables
		 *********************************************/

		// Instance stores a reference to the Singleton
		var instance;

		var id = 1;
		var duration = 3000;
		var klass = 'alert';
		var placeholder = '.alert';
		var type = 'Success';
		var text = '';
		var popup = false;
		var showPopupByModalView = true;



		var isError = function () {
			return type.toLowerCase() === 'error';
		};

		var isPopup = function () {
			return popup || false;
		};

		var show = function () {
			$(placeholder).removeClass().addClass(klass).addClass('alertId-' + id);
			$(placeholder).html('<span class="type">' + QuestCMS.l(type) + '!</span>&nbsp;<span class="text">' + QuestCMS.l(text) + '</span>');
			$(placeholder).show();
		};

		// Backbone
    var ModuleItem = Backbone.Model.extend({
      idAttribute: '_id',
      default: function () {
        return {
          _id: null,
          title: '',
          content: ''
        };
      }
    });

    var ModalView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplModalView)
    });


    var SpinnerView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplSpinnerView)
    });


		function init() {
		  // default behaviour
	    $.extend(true, configs, QuestCMS.Config.toJSON());
			var defaultPlaceholder = configs[module]['defaultPlaceholder'];
			duration = configs[module]['duration'];
			popup = configs[module]['popup'];
			showPopupByModalView = configs[module]['showPopupByModalView'];

		  // Singleton
			return {
			  // Public methods and variabless
		    hideAlert: function (id) {
				  $('.alertId-' + id).hide();
				},
				reset: function () {
				  type = 'success';
				  text = '';
					placeholder = defaultPlaceholder;
					popup = configs[module]['popup'];
					return this;
				},
				setDuration: function (value) {
				  duration = value;
					return this;
				},
				setPlaceholder: function (value) {
				  placeholder = value;
					return this;
				},
				setPopup: function () {
				  popup = true;
					return this;
				},
				setText: function (value) {
				  text = value;
					return this;
				},
				setType: function (value) {
				  type = value;
					klass = 'alert animated fadeInUp alert-' + type.toLowerCase();
					return this;
				},
				unsetPopup: function () {
				  popup = false;
					return this;
				},


				showAlert: function (type, text) {
				  var self = this;
					id = Math.floor(Math.random() * 10000000 + 1);
					if (type) { this.setType(type); }
					if (text) { this.setText(text); }
					var interval = isError() ? duration * 2 : duration;
					show();

					setTimeout(function(){
						self.hideAlert(id);
					}, interval);

					if (isPopup()) {
						if (configs[module]['showPopupByModalView']) {
              QuestCMS.Utils.showDialog({
                hideButtons: true,
                text: QuestCMS.l(text),
                title: QuestCMS.l(type)
              });
							// var model = new ModuleItem({title: QuestCMS.l(type), content: QuestCMS.l(text)});
							// var view = new ModalView({model: model});
							// QuestCMS.modal.show(view);
						} else {
							alert(QuestCMS.l(text));
						}
					}
					this.reset();
					return id;
				},
				showNoPopup: function (type, text) {
				  this.unsetPopup().showAlert(type, text);
				},
				showPopup: function (type, text) {
				  this.setPopup().showAlert(type, text);
				}
			};
		};


		return {
			getInstance: function () {
				if ( !instance ) {
					instance = init();
				}
				return instance;
			}
		};

	})(); // Alert


/*********************************************
 * Return
 *********************************************/

	return Alert;

});
