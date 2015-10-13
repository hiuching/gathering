/*********************************************
 * Paginator module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/
 
;define([
  "marionette",
  "text!tpl/paginator.html"
], 

function (Marionette, templateString) {

/*********************************************
 * Templates
 *********************************************/
 
    var tplCompositeView = $('#ListView', '<div>' + templateString + '</div>').html();
    var tplItemView = $('#ItemView', '<div>' + templateString + '</div>').html();
    
    
/*********************************************
 * Configurations
 *********************************************/
 
    var module = "paginator";
    var configs = {};

    var pageSize = 1;

/*********************************************
 * Main function (export)
 *********************************************/
 
    var Paginator = function (data) {
      configs[module] = {
        indexPerPage: 10
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());
      
      
      /*********************************************
       * Listening events
       *********************************************/
      
      // listening events
      QuestCMS.vent.on(module + ":display", function (options) {
        display(options);
      });
      
      QuestCMS.vent.on(module + ":show", function (options) {
        show(options);
      });
      
    };

    

/*********************************************
 * Backbone Model
 *********************************************/
 
/*********************************************
 * Backbone Collection
 *********************************************/
 
 
    
    
/*********************************************
 * Backbone Marionette ItemView
 *********************************************/
    var ModuleItemView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplItemView),
      tagName: 'li',
      className: function () {
        return this.model.get("className");
      },
      events: {
        'click': 'gotoPage'
      },
      gotoPage: function (e) {
        e.preventDefault();
        var data = this.model.toJSON();
				var display = data.display || ":display";
        QuestCMS.vent.trigger(data.module + display, {page: data.page});
      }
    });
    
    
    
/*********************************************
 * Backbone Marionette CompositeView
 *********************************************/
    var ModuleCompositeView = Backbone.Marionette.CompositeView.extend({
      initialize: function () {
        this.module = this.options.module;
        this.page = this.options.page;
        this.sectionStart = this.options.sectionStart;
        this.sectionEnd = this.options.sectionEnd;
        this.pageCount = this.options.pageCount;
        this.display = this.options.display;
      },
      itemView: ModuleItemView,
      render: function () {
        $(this.el).append(tplCompositeView);
        var end = Math.min(this.pageCount, this.sectionEnd);
        if (this.sectionStart > 1) {
          var model = new Backbone.Model({page: this.sectionStart - 1, label: "<", module: this.module, display: this.display});
          $('.questcms-paginators', this.el).append(new ModuleItemView({model: model}).render().el);
        }
        for (var i = this.sectionStart; i <= end; i++) {
          var className = "";
          if (i == this.page) {
            className = "active";
          }
          var model = new Backbone.Model({page: i, label: i, module: this.module, className: className, display: this.display});
          $('.questcms-paginators', this.el).append(new ModuleItemView({model: model}).render().el);
        } //for (var i = 0; i < len; i++)
        if (this.pageCount > end) {
          var model = new Backbone.Model({page: end + 1, label: ">", module: this.module, display: this.display});
          $('.questcms-paginators', this.el).append(new ModuleItemView({model: model}).render().el);
        }
        return this;
      }
    });
    
/*********************************************
 * common functions
 *********************************************/
 
    
/*********************************************
 * functions
 *********************************************/
 
    var display = function (options) {
        var view = new ModuleCompositeView({page: options.page, sectionStart: options.sectionStart, sectionEnd: options.sectionEnd, pageCount: options.pageCount, module: options.module, display: options.display});
        $(options.el).html(view.render().el);
    };
    
    
    var show = function (options) {
      options = options || {};
      
      var collection = options.collection;
      var configs = options.configs;
      var module = options.module;
      var page = options.page;
      var target = options.target || '.questcms-paginator';
      
      pageSize = configs[module]['itemPerRow'] * configs[module]['numOfRow'];
      pageCount = Math.ceil(collection.length / pageSize );
      var section = Math.ceil(page / configs[module]['pagePerSection']);
      sectionStart = (section - 1) * configs[module]['pagePerSection'] + 1;
      sectionEnd = section * configs[module]['pagePerSection'];
        
      var view = new ModuleCompositeView({page: page, sectionStart: sectionStart, sectionEnd: sectionEnd, pageCount: pageCount, module: module});
      $(target).html(view.render().el);

    };

/*********************************************
 * Return
 *********************************************/
    return Paginator;
    
});