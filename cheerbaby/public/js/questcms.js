/*********************************************
 * QuestCMS Main Program
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

;define([
  "jquery",
  "underscore",
  "backbone",
  "marionette",
  "backbone.validation",
  "bootstrap",
  "date",
  "layout",
  "string",
  "array",
  "async",
  "tinymce",
  "ladda",
  "spin",

  "core/activity",
  "core/admin",
  "core/adminmenu",
  "core/basket",
  "core/configuration",
  "core/cookie",
  "core/export",
  "core/language",
  "core/languagemenu",
  "core/reset",
  "core/paginator",
  "core/password",
  "core/permission",
  "core/search",
  "core/user",
  "core/utils",
  "core/verificationcode",

  "modules/administration",
  "modules/appointment",
  "modules/dailySetting",
  "modules/vendor",
  "modules/file",
  "modules/footer",
  "modules/homepage",
  "modules/inventory",
  "modules/item",
  "modules/mainmenu",
	"modules/profileheader",
  "modules/searchbox",
  "modules/webpage",

  "jqueryui",
  "jquery.fileDownload",
  "jquery.loadJSON",
  "jquery.timepicker",
  "ladda.jquery",
	"blockUI",

  "pickadate",
  "pickatime",

/* Bootstrap-table plugin */
  "bootstrap-table",
  "bootstrap-table-export",
  "tableExport",
  "bootstrap-table-flat-json",
  "bootstrap-table-filter",
  "table-filter",
  "bs-table",
  "bootstrap-table-mobile",
  "bootstrap-table-editable",
  "bootstrap-editable",
	"bootstrap-table-zh-TW",
	"bootstrap-table-zh-CN",
	"bootstrap-table-multiple-sort",
	"bootstrap-table-cookie",
	// "bootstrap-table-resizable",
	// "colResizable"
],

function ($, _, Backbone, Marionette, Validation, Bootstrap, Date, Layout, String, Array, async, tinymce, ladda, Spinner,

  Activity,
  Admin,
  AdminMenu,
  Basket,
  Configuration,
  Cookie,
  Export,
  Language,
  LanguageMenu,
  Reset,
  Paginator,
  Password,
  Permission,
  Search,
  User,
  Utils,
  VerificationCode,

  Administration,
  Appointment,
  DailySetting,
	Vendor,
  File,
  Footer,
  HomePage,
  Inventory,
  Item,
  MainMenu,
	ProfileHeader,
  SearchBox,
  WebPage
) {


/*********************************************
 * Configurations
 *********************************************/
    var module = "questcms";


/*********************************************
 * Main Application logic
 *********************************************/
    QuestCMS = new Backbone.Marionette.Application();


    /*********************************************
     * Application initialization
     *********************************************/

    // Backbone.Marionette.Application initialization
    QuestCMS.on("initialize:before", function () {
        Backbone._nativeSync = Backbone.sync;
        Backbone.defaultSyncOptions = {};
        Backbone.sync = function (method, model, options) {
          Backbone._nativeSync(method, model, _.extend({}, Backbone.defaultSyncOptions, options));
        };
        //console.log("initialize:before");
    });

    QuestCMS.on("initialize:after", function () {
      //console.log("initialize:after");
    });

    QuestCMS.on("start", function () {
      //console.log("start");
    });



    /*********************************************
     * Layout
     *********************************************/
    QuestCMS.initializeLayout = function (layoutName) {
      if ((!QuestCMS.layout) || (QuestCMS.layout.options.tmplName != layoutName) || (QuestCMS.Cookie.isChangedLang())) {
        QuestCMS.layout = new Layout({tmplName:layoutName});
        QuestCMS.content.show(QuestCMS.layout);
      }
    };


    /*********************************************
     * Shortcut functions
     *********************************************/
    // language label
    QuestCMS.l = function (text, callback) {
      if (callback) {
        return QuestCMS.Language.l(callback(text));
      }
      return QuestCMS.Language.l(text);
    };

    // permission
    QuestCMS.allow = function (module, action, model) {
      return QuestCMS.Permission.allow(module, action, model);
    };



    QuestCMS.activity = function(data) {
      return new Activity(data);
    };


    QuestCMS.display = function (options) {
      options = options || {};
			if(QuestCMS.Cookie.get("lang") == ''){
				QuestCMS.Cookie.set({"lang": "zh-hant"});
			}
      var lang = QuestCMS.Cookie.get("lang");
			// console.log('lang', lang);
      this.fetch(options, function (err, collection) {
        if (typeof options.alias != 'undefined') {
          collection = collection.filterAlias(options.alias).filterLanguage(lang);
        } else {
          collection = collection.filterLanguage(lang);
        }
        if (collection.length > 0) {
          var view = new options.view({ collection: collection });
          if (options.region) {
            QuestCMS.layout[options.region].show(view);
          } else {
            QuestCMS.layout.contentRegion.show(view);
          }
        }
      });
    };

    QuestCMS.fetch = function (options, callback) {
      options = options || {};
      var deferred = $.Deferred();
      var collection = new options.collection();
      collection.on("reset", function (data) {
        deferred.resolve(data);
      });
      collection.fetch();

      deferred.done(function () {
        callback(null, collection);
      });
    };

    QuestCMS.validationCallback = function () {
      _.extend(Backbone.Validation.callbacks, {
          valid: function (view, attr, selector) {
              var $el = view.$('[name="' + attr + '"]');
              var $group = $el.closest('.form-group');

              $group.removeClass('has-error');
              $group.find('.help-block').html('').addClass('hidden');
          },
          invalid: function (view, attr, error, selector) {
              var $el = view.$('[name="' + attr + '"]');
              var $group = $el.closest('.form-group');

              $group.addClass('has-error');
              $group.find('.help-block').html(error).removeClass('hidden');
          }
      });
    };


   /*********************************************
     * Listening events
     *********************************************/
    QuestCMS.vent.on("routing:resolve", function (alias) {
      QuestCMS.Router.resolve(alias);
    });

    QuestCMS.vent.on("content:rendered", function (module) {
      //console.log('content:rendered ' + module);
    });

    QuestCMS.vent.on(module + ":display", function (options) {
      QuestCMS.display(options);
    });

    QuestCMS.vent.on("routing:started", function () {
      if (!Backbone.History.started) {
        Backbone.history.start({ pushState: false });
      }
    });

    QuestCMS.addInitializer(function () {
      QuestCMS.Cookie = new Cookie();
      if (QuestCMS.Cookie.get("lang") == "") {
        QuestCMS.Cookie.save({lang: QuestCMS.Config.get("language")});
      }

      // initialize core components
      initComponents();

      // then run the addInitializer in main.js
    });




/*********************************************
 * init functions
 *********************************************/
    function initComponents() {

      // core
      QuestCMS.Admin = new Admin();
      QuestCMS.AdminMenu = new AdminMenu();
      QuestCMS.Basket = new Basket();
      QuestCMS.Configuration = new Configuration();
      QuestCMS.Export = new Export();
      QuestCMS.Language = new Language();
      QuestCMS.LanguageMenu = new LanguageMenu();
      QuestCMS.Reset = new Reset();
      QuestCMS.Paginator = new Paginator();
      QuestCMS.Password = new Password();
      QuestCMS.Permission = new Permission();
      QuestCMS.Search = new Search();
      QuestCMS.User = new User();
      QuestCMS.Utils = new Utils();
      QuestCMS.VerificationCode = new VerificationCode();

      // modules
      QuestCMS.Administration = new Administration();
      QuestCMS.Appointment = new Appointment();
      QuestCMS.DailySetting = new DailySetting();
      QuestCMS.Vendor = new Vendor();
      QuestCMS.File = new File();
      QuestCMS.Footer = new Footer();
      QuestCMS.HomePage = new HomePage();
      QuestCMS.Inventory = new Inventory();
      QuestCMS.Item = new Item();
      QuestCMS.Mainmenu = new MainMenu();
      QuestCMS.ProfileHeader = new ProfileHeader();
      QuestCMS.SearchBox = new SearchBox();
      QuestCMS.WebPage = new WebPage();

      QuestCMS.headers = {};
      QuestCMS.validationCallback();
    }


/*********************************************
 * Return
 *********************************************/
    return QuestCMS;

}); // define
