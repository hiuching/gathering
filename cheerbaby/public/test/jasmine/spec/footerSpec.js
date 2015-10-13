describe('QuestCMS :: footer', function() {

  var mockData = { title: 'Foo Bar', timestamp: new Date().getTime() };

  beforeEach(function() {
    var that = this;
    var done = false;

    require([
        "questcms",
        "config/config",
        "core/pubsub",
        "core/router"
      ], function(QuestCMS, Config, PubSub, Router) {
        QuestCMS.Config = new Config();

        QuestCMS.addInitializer(function () {
          // start the PubSub and Router after all modules are loaded
          QuestCMS.Pubsub = new PubSub();
          QuestCMS.vent.trigger("pubsub:started");
          QuestCMS.Router = new Router();    
          QuestCMS.vent.trigger("routing:started");
          
          if (QuestCMS.Config.get("skipAuthentication")) {
            QuestCMS.Authentication.authenticate({});
          };
        });

        QuestCMS.start();
        this.footerRegion = $('#footerRegion');
        done = true;
    });
    
    waitsFor(function() {
      return done;
    });
  });

  afterEach(function(){
    var done = false;
    var isDone = function(){ return done; };
    //this.footerRegion.html(''); 
  });

  describe('init', function() {
    it('host should equal to 210.245.150.92', function() {
      expect(QuestCMS.Config.get("host")).toEqual("210.245.150.92");
    });
  });
  
  describe('layout:rendered', function() {
    it('should create a footer', function() {
      expect($('#footerRegion').html()).toEqual(jasmine.any(String));
    });
  });

  describe('hide', function() {
    it('should hide a footer', function() {
      QuestCMS.vent.trigger("footer:hide");
      expect($('#footerRegion').html()).toEqual("");
    });
  });
  
  describe('languagemenu:switch', function() {
    it('should hide a footer', function() {
      QuestCMS.vent.trigger("languagemenu:switch");
      expect($('#footerRegion').html()).toEqual(jasmine.any(String));
    });
  });
  
});