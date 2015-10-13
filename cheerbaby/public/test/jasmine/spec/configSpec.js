describe('QuestCMS :: config', function() {

  var mockData = { title: 'Foo Bar', timestamp: new Date().getTime() };

  beforeEach(function() {
    var that = this;
    var done = false;

    require([
        "questcms",
        "config/config"
      ], function(QuestCMS, Config) {
        QuestCMS.Config = new Config();
        QuestCMS.start();
        done = true;
    });
    
    waitsFor(function() {
      return done;
    });
  });

  afterEach(function(){
    var done = false;
    var isDone = function(){ return done; };
  });

  describe('init', function() {
    it('host should equal to 210.245.150.92', function() {
      expect(QuestCMS.Config.get("host")).toEqual("210.245.150.92");
    });
  });


});