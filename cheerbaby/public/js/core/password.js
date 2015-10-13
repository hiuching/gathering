/*********************************************
 * Password module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

;define([
  "marionette",
  "text!tpl/password.html"
],

function (Marionette, templateString) {


/*********************************************
 * Templates
 *********************************************/

    var tplPasswordEditView = $('#PasswordEditView', '<div>' + templateString + '</div>').html();


/*********************************************
 * Configurations
 *********************************************/
    var module = "password";
    var configs = {};

    var cachedCollection;

		/* RegExp */
		var ecase = new RegExp("[a-z]+", "i");	// check Upper or Lower case
		var ucase = new RegExp("[A-Z]+");		// check Upper case
		var lcase = new RegExp("[a-z]+");		// check Lower case
		var num = new RegExp("[0-9]+");		// check number

/*********************************************
 * Main function (export)
 *********************************************/

    var Password = function () {
      var self = this;
      configs[module] = {
        dataType: module,
        minPasswordLength: 8,
        minPasswordUpperOrLowercaseLength: 1,
        minPasswordUppercaseLength: 1,
        minPasswordLowercaseLength: 1,
        minPasswordNumberLength: 1,
        region: 'contentRegion'
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());
      //console.log('new Password');


      /*********************************************
       * Listening events
       *********************************************/


      /* common events */

      QuestCMS.vent.on(module + ":change", function (options) {
        changePassword(options);
      });

      /* events trigger by other modules */


      /* events trigger by this modules*/



    };




/*********************************************
 * Backbone Model
 *********************************************/
    var ModuleItem = Backbone.Model.extend({
      initialize: function () { this.options = configs; },
    });


/*********************************************
 * Backbone Collection
 *********************************************/
    var ModuleCollection = Backbone.Collection.extend({
      initialize: function () { this.options = configs; },
      model: ModuleItem
    });



/*********************************************
 * Backbone Marionette ItemView
 *********************************************/

    /* Change Password Page */
    var ModulePasswordEditView = Backbone.Marionette.ItemView.extend({
      initialize: function () {
				Backbone.history.navigate('password/change');
        this.cancelCallBack = this.options.conditions.cancelCallBack;  //  from manager users: showUsers
        this.currentPassword = this.options.conditions.password;  // get from manager users
      },
      template: _.template(tplPasswordEditView),
      onShow: function () {
				this.prepareHints();
			  if (this.currentPassword) {
          $('.currentPassword', this.el).text(this.currentPassword);
        } else {
				  $('#currentPassword', this.el).hide();
				}
				QuestCMS.Utils.setSiteTitle(QuestCMS.l("Change Password"));
        $(document).scrollTop(0);
				$('form input:eq(0)').focus();
      },
      events: {
        'click .user-cancel'    : 'cancel',
        'click .user-submit'    : 'saveUser',
				'keyup input:password'	: 'showHints'
      },
      cancel: function (e) {
        if(this.cancelCallBack) {
				  e.preventDefault();
          this.cancelCallBack();
        } else {
          QuestCMS.layout[configs[module]['region']].close();
        }
      },
			clearInput: function () {
			  $('#password', this.el).val('');
				$('#password_retype', this.el).val('');
				showHints(this.getPassword());
			},
			getPassword: function () {
				return {
				  newPassword: $('#password', this.el).val().trim(),
					retypePassword: $('#password_retype', this.el).val().trim()
				};
			},
			prepareHints: function () {
			  $('.password-min-length', this.el).html(configs[module]['minPasswordLength']);
			  $('.password-upperOrLowercase-length', this.el).html(configs[module]['minPasswordUpperOrLowercaseLength']);
			  $('.password-uppercase-length', this.el).html(configs[module]['minPasswordUppercaseLength']);
			  $('.password-Lowercase-length', this.el).html(configs[module]['minPasswordLowercaseLength']);
			  $('.password-number-length', this.el).html(configs[module]['minPasswordNumberLength']);
			},
			showHints: function () {
				showHints(this.getPassword());
			},
      saveUser: function (e) {
        e.preventDefault();
				var self = this;
				validatePassword(self.getPassword(), function (err, newPassword) {
					if (err) {
            QuestCMS.Utils.showAlert('Error', err);
						self.clearInput();
					} else {
						self.model.setPassword(newPassword);
						if (self.model.isSameUser(QuestCMS.user)) {
							self.model.activateAccount();
						}
						self.model.save({}, {
							success: function (model) {
								QuestCMS.Utils.showAlert('Success', 'Password is updated.');
								if (self.model.isSameUser(QuestCMS.user)) { // user change his own password
									QuestCMS.vent.trigger('user:edit', {model: self.model});
								} else { // admin user change other password
									QuestCMS.vent.trigger('user:showUsers');
								}
							},
							error: function () {
								QuestCMS.Utils.showAlert('Error', 'Error in updating password');
							}
						});
					}
				});
      }
    });


/*********************************************
 * Backbone Marionette CompositeView
 *********************************************/


/*********************************************
 * common functions
 *********************************************/



/*********************************************
 * functions
 *********************************************/


		/* model: user model */
		var changePassword = function (options) {
			options = options || {};

			var view = new ModulePasswordEditView(options);
			QuestCMS.layout[configs[module]['region']].show(view);
		};

		var showHints = function (options) {
			var password = options.newPassword;
			var retypePassword = options.retypePassword;

			monitLength(password);
			monitUpperOrLowerCase(password);
			monitUpperCase(password);
			monitLowerCase(password);
			monitNumber(password);
			monitPasswordAndRetypePassword(password, retypePassword);
		};

    var validatePassword = function (options, callback) {
		  options = options || {};
			var newPassword = options.newPassword;
			var retypePassword = options.retypePassword;

			if ((newPassword != '') && (retypePassword != '')) {
				if (isSamePassword(newPassword, retypePassword)) {
					if (matchConditions(newPassword)) {
						callback(null, newPassword);
					} else {
						callback('Password must be at least ' + configs[module]['minPasswordLength'] + ' characters');
					}
				} else {
					callback('Passwords do not match');
				}
			} else {
				callback('Password could not be empty');
			}
    };


/*********************************************
 * Check Password Method
 *********************************************/
	var matchConditions = function (newPassword) {
		return (
			checkLength(newPassword) &&
			isExistUpperOrLowerCase(newPassword) &&
			isExistNumber(newPassword)
		);
	};

	var checkLength = function (password) {
		return (password.length >= (configs[module]['minPasswordLength']));
	};

	var isExistUpperOrLowerCase = function (password) {
		return ecase.test(password);
	};

	var isExistUpperCase = function (password) {
		return ucase.test(password);
	};

	var isExistLowerCase = function (password) {
		return lcase.test(password);
	};

	var isExistNumber = function (password) {
		return num.test(password);
	};

	var isSamePassword = function (password, retypePassword) {
		return (password == retypePassword && password !== '' && retypePassword !== '');
	};

/*********************************************
 * Monitor Password Method
 *********************************************/

	var monitLength = function (password) {
		if (checkLength(password)) {
			$("#char").removeClass("glyphicon-remove");
			$("#char").addClass("glyphicon-ok");
			$("#char").css("color","#00A41E");
		} else {
			$("#char").removeClass("glyphicon-ok");
			$("#char").addClass("glyphicon-remove");
			$("#char").css("color","#FF0004");
		}
	};

	var monitLowerCase = function (password) {
		if (isExistLowerCase(password)) {
			$("#lcase").removeClass("glyphicon-remove");
			$("#lcase").addClass("glyphicon-ok");
			$("#lcase").css("color","#00A41E");
		} else {
			$("#lcase").removeClass("glyphicon-ok");
			$("#lcase").addClass("glyphicon-remove");
			$("#lcase").css("color","#FF0004");
		}
	};

	var monitNumber = function (password) {
		if (isExistNumber(password)) {
			$("#num").removeClass("glyphicon-remove");
			$("#num").addClass("glyphicon-ok");
			$("#num").css("color","#00A41E");
		} else {
			$("#num").removeClass("glyphicon-ok");
			$("#num").addClass("glyphicon-remove");
			$("#num").css("color","#FF0004");
		}
	};

	var monitPasswordAndRetypePassword = function (password, retypePassword) {
		if (isSamePassword(password, retypePassword)) {
			$("#passwordmatch").removeClass("glyphicon-remove");
			$("#passwordmatch").addClass("glyphicon-ok");
			$("#passwordmatch").css("color","#00A41E");
		} else {
			$("#passwordmatch").removeClass("glyphicon-ok");
			$("#passwordmatch").addClass("glyphicon-remove");
			$("#passwordmatch").css("color","#FF0004");
		}
	};

	var monitUpperOrLowerCase = function (password) {
		if (isExistUpperOrLowerCase(password)) {
			$("#ecase").removeClass("glyphicon-remove");
			$("#ecase").addClass("glyphicon-ok");
			$("#ecase").css("color","#00A41E");
		} else {
			$("#ecase").removeClass("glyphicon-ok");
			$("#ecase").addClass("glyphicon-remove");
			$("#ecase").css("color","#FF0004");
		}
	};

	var monitUpperCase = function (password) {
		if (isExistUpperCase(password)) {
			$("#ucase").removeClass("glyphicon-remove");
			$("#ucase").addClass("glyphicon-ok");
			$("#ucase").css("color","#00A41E");
		} else {
			$("#ucase").removeClass("glyphicon-ok");
			$("#ucase").addClass("glyphicon-remove");
			$("#ucase").css("color","#FF0004");
		}
	};


/*********************************************
 * Return
 *********************************************/
    return Password;


});
