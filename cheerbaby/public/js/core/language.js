define([
  "text!i18n/language.txt"
],

function (jsonLanguageStr) {

    var Language = function () {
      this.jsonLanguage = JSON.parse(jsonLanguageStr);
      // console.log('new lang', this.jsonLanguage);
    };

    Language.prototype.l = function (text) {
      var textToLower = text.toLowerCase().trim();
      var lang = QuestCMS.Cookie.get("lang");
      if ((this.jsonLanguage[lang]) && (this.jsonLanguage[lang][textToLower])) {
        return this.jsonLanguage[lang][textToLower];
      }
      return text;
    };
      
    return Language;
   
});