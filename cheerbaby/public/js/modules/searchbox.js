/*********************************************
 * Search Box module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

;define([
  "marionette",
  "text!tpl/searchbox.html"
],

function (Marionette, templateString) {

/*********************************************
 * Templates
 *********************************************/

    var tplFormView = $('#FormView', '<div>' + templateString + '</div>').html();
    var tplFoundUsersListView = $('#FoundUsersListView', '<div>' + templateString + '</div>').html();
    var tplFoundUsersItemView = $('#FoundUsersItemView', '<div>' + templateString + '</div>').html();



/*********************************************
 * Configurations
 *********************************************/
    var module = "searchbox";
    var configs = {};

    var searchTerm = "", cachedCollection;
    var limit, pageSize, pageCount, sectionStart = 1, sectionEnd = 1, lastPage, currentPage;



/*********************************************
 * Main function (export)
 *********************************************/
    var SearchBox = function () {
      var self = this;
      configs[module] = {
        region: 'searchBoxRegion',
				displayRegion: 'contentRegion',
        itemPerRow: 1,
        numOfRow: 5,
        pagePerSection: 10,
        showPaginator: true
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());
      pageSize = configs[module]['itemPerRow'] * configs[module]['numOfRow'];
      limit = pageSize * configs[module]['pagePerSection'] + 1;
      //console.log('new ' + module);

      /*********************************************
       * Listening events
       *********************************************/

      /* common events */
      // QuestCMS.vent.on("layout:rendered", function () {
        // if (QuestCMS.user && QuestCMS.user.isAdmin()) {
          // display();
        // }
      // });
			
			QuestCMS.vent.on(module + ':showSearchBox', function () {
        if (QuestCMS.user && QuestCMS.user.isAdmin()) {
          // display();
        }
			});

      QuestCMS.vent.on("languagemenu:switch", function (lang) {
        // display();
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
    var FormView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplFormView),
      initialize: function () {
        var self = this;
        QuestCMS.vent.on(module + ":start", function (term) {
          self.$('#searchTerm').val(term);
        });
      },
			onShow: function () {
				QuestCMS.Utils.autocomplete({
					placeholder: '#searchTerm',
					el: self.el,
					url: QuestCMS.Utils.setAPIUrl() + '/user?action=findByUniversalSearch&universalSearch=',
					limit: 10,
					minLength: 1,
					label: 'firstName,lastName',
					value: 'email',
					select: function (event, ui) {
						var options = {
							email: ui.item.json.email
						};
						QuestCMS.vent.trigger("user:searchUsers", options);
						// $(document).scrollTop(0);
					}
				});
			},
      events: {
        'submit': 'submit'
      },
      search: function () {
				var options = {
          universalSearch: this.$('#searchTerm').val().trim(),
					callback: function (collection) {
						cachedCollection = collection;
						currentPage = (options.page || currentPage) || 1;
						var view = new ModuleCompositeView({ collection: collection, page: currentPage });
						QuestCMS.layout[configs[module]['displayRegion']].show(view);
					}
				};

        QuestCMS.vent.trigger("user:universalSearchUsers", options);
      },
      submit: function (e) {
        e.preventDefault();
        this.search();
      }
    });



		var ModuleFoundUsersItemView = Backbone.Marionette.ItemView.extend({
      onShow: function (){

      },
      template: _.template(tplFoundUsersItemView),
			tagName: 'tr',
      events: {
        'click .user-edit'   : 'edit'
      },
      edit: function (e) {
        e.preventDefault();
        if (QuestCMS.user) {
					QuestCMS.vent.trigger("user:searchUsers", {model: this.model});
        }
      }
    });

/*********************************************
 * Backbone Marionette CompositeView
 *********************************************/
     var ModuleCompositeView = Backbone.Marionette.CompositeView.extend({
      initialize: function () {
        this.page = this.options.page;
        this.start = (this.page - 1) * pageSize ;
        this.end = this.page * pageSize;
      },
      itemView: ModuleFoundUsersItemView,
      template: _.template(tplFoundUsersListView),
      appendHtml: function (collectionView, itemView, index) {
        if ((this.start <= index) && (index < this.end)) {
          collectionView.$(".questcms-users").append(itemView.el);
        }
      },
      onRender: function () {
        if (configs[module]['showPaginator']) {
          this.showPaginator();
        }
        $(document).scrollTop(0);
      },
			onShow: function () {
        this.showFilterItemCount();
				$("#searchedUser").tablesorter({
					theme: 'default',
					widthFixed: true,
					widgets: ['zebra']
				}).tablesorterPager({
					container: $("#pager"),
					page: 0,
					size: 10,
					output: '{startRow} to {endRow} ({totalRows})'
				});
			},
			events: {

			},
      showPaginator: function () {
        pageCount = Math.ceil(this.collection.length / pageSize );
        var section = Math.ceil(this.page / configs[module]['pagePerSection']);
        sectionStart = (section - 1) * configs[module]['pagePerSection'] + 1;
        sectionEnd = section * configs[module]['pagePerSection'];

        var el = $('.questcms-paginator', this.el);
        var options = {
          el: el,
          module: module,
          page: this.page,
          sectionStart: sectionStart,
          sectionEnd: sectionEnd,
          pageCount: pageCount
        };
        QuestCMS.vent.trigger("paginator:display", options);
      },
      showFilterItemCount: function () {
        $(".filter_count", this.el).html(' - ' + this.collection.length);
      },
    });

/*********************************************
 * functions
 *********************************************/

    var display = function () {
        var view = new FormView();
        QuestCMS.layout[configs[module]['region']].show(view);
    };


/*********************************************
 * Return
 *********************************************/
    return SearchBox;

});
