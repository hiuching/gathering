/*********************************************
 * Controller module
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


/*********************************************
 * Main function (export)
 *********************************************/
    var Controller = {
      resolve: function (alias) {
        alias = alias || "";
        var self = this;

        var layoutName = "questcms-layout";

        if (! QuestCMS.user) {
          layoutName = 'questcms-layout-home';
        }

        QuestCMS.initializeLayout(layoutName);

				QuestCMS.Cookie.save({alias: alias});
        // console.log(alias, layoutName);

      /*********************************************
        * Routes
        *********************************************/
        if (alias == "qadmin/configuration") {
          this.configuration(alias);
        } else {

					if (!QuestCMS.user) {
						if (alias.indexOf("forgot") === 0) {
							this.forgot(alias);
						} else if (alias.indexOf('verification') !== -1) {
							self.verification(alias);
						} else if (alias.indexOf('resetPassword') !== -1) {
							self.resetPassword(alias);
						} else if (alias.indexOf("oauth2") === 0) {
							self.oauth(alias);
						} else if (alias.indexOf("authorize") === 0) {
							self.oauth2authorize(alias);
						} else if (alias.indexOf("signUp") !== -1) {
							self.user(alias);
						} else {
							this.qadmin(alias);
						}
					} else{
						if (alias.indexOf("qadmin") === 0) {
							self.qadmin(alias);
						} else if ((alias === "") || (alias == "homepage")) {
							self.homepage(alias);
						} else if (alias.indexOf("administration") !== -1) {
							self.administration(alias);
						} else if (alias.indexOf("appointment") !== -1) {
							self.appointment(alias);
						} else if (alias.indexOf("user") !== -1) {
							self.user(alias);
						} else if (alias.indexOf("vendor") !== -1) {
							self.vendor(alias);
						} else if (alias.indexOf("dailySetting") !== -1) {
							self.dailySetting(alias);
						}  else if (alias.indexOf("inventory") !== -1) {
							self.inventory(alias);
						} else if (alias.indexOf("export") !== -1) {
							self.exportReport(alias);
            } else if (alias.indexOf("file") !== -1) {
              self.file(alias);
						} else if (alias.indexOf("item") !== -1) {
							self.item(alias);
						} else {
							self.webpage(alias);
						}
					}
        }
      },


      /*********************************************
        * Functions
        *********************************************/
      qadmin: function (alias) {
        QuestCMS.vent.trigger("admin:resolve", alias);
      },

      verification: function (alias) {
        QuestCMS.vent.trigger("user:authenticateVerificationCode", alias);
      },

      resetPassword: function (alias) {
        QuestCMS.vent.trigger("user:resetPassword", alias);
      },

      configuration: function (alias) {
        QuestCMS.vent.trigger("configuration:resolve");
      },

      homepage: function (alias) {
        QuestCMS.vent.trigger("homepage:resolve", alias);
      },

      file: function (alias) {
        QuestCMS.vent.trigger("file:URLController", alias);
      },

      administration: function (alias) {
        QuestCMS.vent.trigger("administration:resolve", alias);
      },

      appointment: function (alias) {
        QuestCMS.vent.trigger("appointment:URLController", alias);
      },

			dailySetting: function (alias) {
        QuestCMS.vent.trigger("dailySetting:URLController", alias);
      },

			user: function (alias) {
				QuestCMS.vent.trigger('user:URLController', alias);
			},

			exportReport: function (alias) {
				QuestCMS.vent.trigger('export:URLController', alias);
			},

			item: function (alias) {
				QuestCMS.vent.trigger('item:URLController', alias);
			},

			inventory: function (alias) {
				QuestCMS.vent.trigger('inventory:URLController', alias);
			},

			vendor: function (alias) {
				QuestCMS.vent.trigger('vendor:URLController', alias);
			},

      search: function (alias) {
        QuestCMS.vent.trigger("search:resolve", alias);
      },

      webpage: function (alias) {
        QuestCMS.vent.trigger("webpage:resolve", alias);
      }

    };


/*********************************************
 * Return
 *********************************************/
    return Controller;

});
