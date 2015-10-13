define.amd.jQuery = true;

require.config({
  baseUrl: "./js/",
  waitSeconds: 200,
  paths: {

    // libraries
    "libs"        : "../libs",
    "async"        : "../libs/async/async",
    "backbone"    : "../libs/backbone/backbone-min",
    "backbone.validation"  : "../libs/backbone.validation/backbone-validation-amd-min",
    "bootstrap"   : "../libs/bootstrap/js/bootstrap",
		"aes"		  : "../libs/crypto-js/aes",
    "enc-base64"  : "../libs/crypto-js/enc-base64-min",
    "hmac-sha1"   : "../libs/crypto-js/hmac-sha1",
		"fullcalendar": "../libs/fullcalendar/fullcalendar",
		"moment": "../libs/fullcalendar/moment.min",
		"iosOverlay": "../libs/iosOverlay/iosOverlay",
    "jquery"      : "../libs/jquery/jquery-1.11.2.min",
    "jqueryui"      : "../libs/jqueryui/js/jquery-ui-1.11.2.min",
    "blockUI"      : "../libs/jquery.blockUI/jquery.blockUI",
		"jquery.confirm": "../libs/jquery.confirm/jquery.confirm",
    "jquery.cookie"      : "../libs/jquery.cookie/jquery.cookie",
    "jquery.fileDownload"   : "../libs/jquery.fileDownload/jquery.fileDownload",
		"jquery.loadJSON"      : "../libs/jquery.loadJSON/jquery.loadJSON",
    "jquery.lazyload"      : "../libs/jquery.lazyload/jquery.lazyload",
    "jquery.scrollstop"      : "../libs/jquery.scrollstop/jquery.scrollstop",
    "jquery.timepicker" : "../libs/jquery.timepicker/jquery.timepicker",
    "birthdayPicker" : "../libs/birthday-picker/jquery-birthday-picker.min",
    "json2"       : "../libs/json2/json2",
    "ladda"       : "../libs/ladda/ladda.min",
    "spin"       : "../libs/ladda/spin.min",
    "ladda.jquery"       : "../libs/ladda/ladda.jquery.min",
    "tablesorter"       : "../libs/tablesorter/jquery.tablesorter",
    "tablesorterPager"       : "../libs/tablesorter/jquery.tablesorter.pager",
    "tablesorter.widgets"       : "../libs/tablesorter/jquery.tablesorter.widgets",
		"marionette"  : "../libs/backbone.marionette/backbone.marionette.min",
    "text"        : "../libs/requirejs/text",
    "underscore"  : "../libs/underscore/underscore-1.4.4.min",


    //datepicker and timepicker
    "picker": "../libs/pickadate/picker",
    "pickadate" : "../libs/pickadate/picker.date",
    "pickatime" : "../libs/pickadate/picker.time",

	  //tinymce
    "jquery.tinymce"      : "tinymce/js/tinymce/jquery.tinymce.min",
    "tinymce"             : "tinymce/js/tinymce/tinymce.min",

    // tools
    "tools"       : "tools",
    "date"        : "tools/date",
    "encryption"  : "tools/encryption",
    "string"      : "tools/string",
    "array"       : "tools/array",

    // userfile
    "userfile"    : "../userfile",
    "i18n"        : "../userfile/i18n",
    "tpl"         : "../userfile/tpl",

    // bootstrap-table plugin
    "bootstrap-table"   : "../libs/bootstrap-table/bootstrap-table.min",
    "bootstrap-table-export"   : "../libs/bootstrap-table/extensions/export/bootstrap-table-export.min",
    "tableExport"   : "../libs/bootstrap-table/extensions/export/tableExport.min",
    "bootstrap-table-flat-json"   : "../libs/bootstrap-table/extensions/flat-json/bootstrap-table-flat-json.min",
    "bootstrap-table-filter"   : "../libs/bootstrap-table/extensions/filter/bootstrap-table-filter.min",
    "table-filter"   : "../libs/bootstrap-table/extensions/filter/table-filter",
    "bs-table"   : "../libs/bootstrap-table/extensions/filter/bs-table",
    "bootstrap-table-mobile"   : "../libs/bootstrap-table/extensions/mobile/bootstrap-table-mobile",
    "bootstrap-table-editable"   : "../libs/bootstrap-table/extensions/editable/bootstrap-table-editable",
    "bootstrap-editable"   : "../libs/bootstrap-table/extensions/editable/bootstrap-editable",
    "bootstrap-table-zh-TW"   : "../libs/bootstrap-table/locale/bootstrap-table-zh-TW.min",
    "bootstrap-table-zh-CN"   : "../libs/bootstrap-table/locale/bootstrap-table-zh-CN.min",
    "bootstrap-table-multiple-sort"   : "../libs/bootstrap-table/extensions/multiple-sort/bootstrap-table-multiple-sort",
    "bootstrap-table-cookie"   : "../libs/bootstrap-table/extensions/cookie/bootstrap-table-cookie",
    // "bootstrap-table-resizable"   : "../libs/bootstrap-table/extensions/resizable/bootstrap-table-resizable",
    // "colResizable"   : "../libs/bootstrap-table/extensions/resizable/colResizable-1.5.min",


  },

  shim: {
    "underscore" : {
      exports: "_"
    },
    "backbone" : {
      deps: ["jquery", "underscore", "json2"],
      exports: "Backbone"
    },
    "marionette" : {
      deps: ["backbone"],
      exports: "Backbone.Marionette"
    },
		"moment" : {
      deps: ["jquery"],
      exports: "moment"
    },
		"iosOverlay" : {
      deps: ["jquery", "spin"],
      exports: "iosOverlay"
    },
    "fullcalendar" : {
      deps: ["jquery"],
      exports: "fullcalendar"
    },
    "bootstrap" : {
      deps: ["jquery"],
      exports: "Bootstrap"
    },
    "jqueryui" : {
      deps: ["jquery"]
    },
    "blockUI" : {
      deps: ["jquery"]
    },
    "jquery.fileDownload" : {
      deps: ["jquery"],
      exports: "$.fn.fileDownload"
    },
    "jquery.confirm" : {
      deps: ["jquery"],
      exports: "$.fn.confirm"
    },
    "jquery.scrollstop" : {
      deps: ["jquery"],
      exports: "$.fn.scrollstop"
    },
    "jquery.lazyload" : {
      deps: ["jquery", "jquery.scrollstop"],
      exports: "$.fn.lazyload"
    },
    "jquery.loadJSON" : {
      deps: ["jquery"],
      exports: "$.fn.loadJSON"
    },
 		"jquery.timepicker" : {
			deps: ["jquery", "jqueryui"],
			exports: "$.fn.timepicker"
		},
		"birthdayPicker" : {
			deps: ["jquery"],
			exports: "$.fn.birthdayPicker"
		},
    "spin" : {
			exports: "spin"
    },
    "ladda" : {
      deps: ["spin"],
			exports: "Ladda"
    },
    "ladda.jquery" : {
      deps: ["jquery", "ladda", "spin"],
			exports: "$.fn.ladda"
    },
    "tablesorter" : {
      deps: ["jquery"],
			exports: "$.fn.tablesorter"
    },
    "tablesorterPager" : {
      deps: ["jquery", "tablesorter"],
			exports: "$.fn.tablesorterPager"
    },
    "tablesorter.widgets" : {
      deps: ["jquery"],
			exports: "$.tablesorter"
    },
    "tinymce" : {
      exports: "tinymce",
      init: function () {
        this.tinymce.DOM.events.domLoaded = true;
        return this.tinymce;
      }
    },
    "jquery.tinymce" : {
      deps: ["jquery"],
      exports: "$.fn.tinymce"
    },
    "hmac-sha1" : {
      exports: "CryptoJS"
    },
    "enc-base64" : {
      deps: ["hmac-sha1"]
    },


    /* datepicker and timepicker */
    "picker" : {
      deps: ["jquery"],
      exports: "picker"
    },
    "pickadate" : {
      deps: ["jquery", "picker"],
      exports: "$.fn.pickadate"
    },
    "pickatime" : {
      deps: ["jquery", "picker"],
      exports: "$.fn.pickatime"
    },

		/* Bootstrap-table */
    "bootstrap-table" : {
      deps: ["jquery", "bootstrap"],
      exports: "$.fn.bootstrapTable"
    },
    "bootstrap-table-export" : {
      deps: ["jquery", "bootstrap-table"]
    },
    "tableExport" : {
      deps: ["jquery", "bootstrap-table"]
    },
    "bootstrap-table-flat-json" : {
      deps: ["jquery", "bootstrap-table"]
    },
    "bootstrap-table-filter" : {
      deps: ["jquery", "bootstrap-table"]
    },
    "bs-table" : {
      deps: ["jquery", "bootstrap-table", "bootstrap-table-filter"]
    },
    "bootstrap-table-mobile" : {
      deps: ["jquery", "bootstrap-table"]
    },
    "bootstrap-table-editable" : {
      deps: ["jquery", "bootstrap-table"]
    },
    "bootstrap-editable" : {
      deps: ["jquery", "bootstrap-table"]
    },
    "bootstrap-table-zh-TW" : {
      deps: ["jquery", "bootstrap-table"]
    },
    "bootstrap-table-zh-CN" : {
      deps: ["jquery", "bootstrap-table"]
    },
    "bootstrap-table-multiple-sort" : {
      deps: ["jquery", "bootstrap-table"]
    },
    "bootstrap-table-cookie" : {
      deps: ["jquery", "bootstrap-table"]
    },
    "table-filter" : {
      deps: ["jquery", "bootstrap-table"]
    },
    // "bootstrap-table-resizable" : {
      // deps: ["jquery", "bootstrap-table", "colResizable"]
    // },
    // "colResizable" : {
      // deps: ["jquery", "bootstrap-table"]
    // },
  }
});


define([
  "questcms",
  "config",
  "core/modal",
  "core/pubsub",
  "core/router"
],

function (QuestCMS, Config, Modal, PubSub, Router) {

    QuestCMS.Config = new Config();

    QuestCMS.addInitializer(function () {
      // init other modules first


      // start the PubSub and Router after all modules are loaded
      QuestCMS.Pubsub = new PubSub();
      QuestCMS.vent.trigger("pubsub:started");
      QuestCMS.Router = new Router();
      QuestCMS.vent.trigger("routing:started");

      if (QuestCMS.Config.get("skipAuthentication")) {
        QuestCMS.Authentication.authenticate({});
      };
    });

    QuestCMS.addRegions({
      content: "#mainContent",
      modal: Modal
    });

    return QuestCMS.start();

});
