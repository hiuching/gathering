/*********************************************
 * Config file
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
;define([
  "jquery",
  "underscore",
  "backbone"
],
function($, _, Backbone){

/*********************************************
 * Backbone Model
 *********************************************/
  var Config = Backbone.Model.extend({
    defaults: {
      "skipAuthentication": false,
      "apiKey": "hbvnpgfky7q9531",
      "apiSecret": "0j7d7kngniwyf4j",
      "proto": "http://",
	  "host": "127.0.0.1",
      "port": "8026",
      "path": "/questcms",
      "language": "zh-hant",
      "components": [
        'mainmenu', 'webpage'
      ],
      "homepage": {
        module: 'webpage'
      },
      "siteTitle": {
        "en-us": "CHEER BABY",
        "zh-hant": "樂兒會",
        "zh-hans": "樂兒會"
      },
      // module configs
      "activity": {
        enable: false
      },
      "adminMenu": {
        alwaysOn: false
      },
      "appointment": {
        timeslotLimit: 1
      },
      // cookie name must be unique for different app using the QuestCMS framework
      "cookie": {
        name: 'hk.cheerbaby.www'
      },
      "languagemenu": {
        display: 'imageonly',
        languages: [
          { name: "en-us", label: "English", imgsrc: "userfile/img/language/en-uk.png", order: 2, active: 1 },
          { name: "zh-hant", label: "繁體", imgsrc: "userfile/img/language/zh-hant.png", order: 1, active: 1 },
          { name: "zh-hans", label: "简体", imgsrc: "userfile/img/language/zh-hans.png", order: 3, active: 0 }
        ]
      },
      "search": {
        itemPerRow: 1, //1,  2, 3, 4 or 6
        numOfRow: 5,
        pagePerSection: 10,
        showPaginator: true
      },
      "user": {
        sendSMS: true,
        useAmazon: true
      },
      "utils": {
        showAlertDuration: 3000,
        showPopupByModalView: true
      },
      "webpage": {
        dataType: 'webpage',
        region: 'contentRegion'
      }
    }
  });




/*********************************************
 * Return
 *********************************************/
  return Config;

});
