/*********************************************
 * Item module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

/*
 * Require.js load AMD modules
 * each module should at least load marionette and one HTML template file
 */
;define([
  "marionette",    // path refer to js/main.js
	"ladda",
  "text!tpl/item.html"
],


/*
 * Objects to store the marionette and the HTML template file
 */
function (Marionette, ladda, templateString) {


/*********************************************
 * Templates
 *********************************************/

/*
 * Read the corresponding segment of HTML code into template variables
 */
    var tplCreateNewItemView = $('#createNewItem', '<div>' + templateString + '</div>').html();
    var tplStepFlowView = $('#StepFlowView', '<div>' + templateString + '</div>').html();
    var tplShowItemView = $('#ShowItemView', '<div>' + templateString + '</div>').html();
    var tplViewAllItemsByVendorCompositeView = $('#ViewAllItemsByVendorCompositeView', '<div>' + templateString + '</div>').html();
    var tplViewEachItemByVendorItemView = $('#ViewEachItemByVendorItemView', '<div>' + templateString + '</div>').html();
    var tplVendorDetailsItemView = $('#VendorDetailsItemView', '<div>' + templateString + '</div>').html();

/*********************************************
 * Module scope variables
 *********************************************/

/*
 * Define the module-wide variables here
 * at least 2 variables: module and configs.
 */
    var module = "item"; // lowercase only
    var configs = {};

    var limit, pageSize, pageCount, sectionStart = 1, sectionEnd = 1, lastPage;
    var nextkey = "", startkey = "";
		var searchTerms = {};
    var cachedCollection;
    var currentPage;
		var newRegion;

/*********************************************
 * Main function (export)
 *********************************************/

/*
 * Main module funtion here
 * name is CamelCase
 */
    var Item = function () {
      var self = this;
      configs[module] = {             // module specified config options
        isCachedCollection: false,
        isOnAdminList: false,         // is shown on the admin menu list
        isSearchable: false,          // is this module data searchable
        itemPerRow: 1,
        numOfRow: 5,
        pagePerSection: 10,
        showPaginator: false,
        dataType: module,             // this module data source
        region: 'contentRegion'  // default display region
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());  // merge with QuestCMS system config, refer to js/config/config.js
      pageSize = configs[module]['itemPerRow'] * configs[module]['numOfRow'];
      limit = pageSize * configs[module]['pagePerSection'] + 1;

      /*********************************************
       * Listening events
       *********************************************/

      /* common events */
      QuestCMS.vent.on("pubsub:started", function () {  // run the callback when the event "pubsub:started" is triggered
        if (configs[module]['isOnAdminList']) {
          QuestCMS.Pubsub.subscribe("admin:list:start", module, adminliststart);
        }
        if (configs[module]['isSearchable']) {
          QuestCMS.Pubsub.subscribe("search:start", module, search);
        }
      });


      QuestCMS.vent.on("layout:rendered", function () {
      });


      QuestCMS.vent.on(module + ":resolve", function (alias) {
        resolve(alias);
      });


      /* module specified events */
      QuestCMS.vent.on(module + ":display", function () {
        QuestCMS.Cookie.set({module: module});
        var alias = QuestCMS.Cookie.get("alias");
        Backbone.history.navigate(alias);
        display({alias: alias});
      });

      QuestCMS.vent.on(module + ":createNewItem", function (options) {
        createNewItem(options);
      });

      QuestCMS.vent.on(module + ":manageItem", function (options) {
        manageItem(options);
      });

      QuestCMS.vent.on(module + ":displayViewAllItemsByVendorCompositeView", function (options) {
        displayViewAllItemsByVendorCompositeView(options);
      });

      QuestCMS.vent.on(module + ":displayShowItemView", function (options) {
        displayShowItemView(options);
      });

      QuestCMS.vent.on(module + ":displayCreateNewItemView", function (options) {
        displayCreateNewItemView(options);
      });

      QuestCMS.vent.on(module + ":displayStepFlowView", function (options) {
        displayStepFlowView(options);
      });

      QuestCMS.vent.on(module + ":getModuleViewAllItemsByVendorCompositeView", function (options, callback) {
				if (options.universalSearch){
					searchTerms = {
						universalSearch: options.universalSearch,
						branch: options.branch,
						stockType: options.stockType
					}
					QuestCMS.vent.trigger("vendor:getVendorModel ", {searchTerms: options.universalSearch}, function(err, model){
						if(!err){
							var vendorId = model.getId();
								fetch({vendorId: vendorId, branch: options.branch, action: 'findActiveItemByVendorIdWithInventory'}, function(err, collection){
									if(err){
										QuestCMS.Utils.showAlert('Error', 'No this Vendor');
										getModuleViewAllItemsByVendorCompositeView(new ModuleCollection(), callback);
									} else {
										getModuleViewAllItemsByVendorCompositeView(collection, callback);
									}

								});
						} else {
							getModuleViewAllItemsByVendorCompositeView(new ModuleCollection(), callback);
						}
					});

				} else {
					getModuleViewAllItemsByVendorCompositeView(new ModuleCollection(), callback);
				}
			});


      QuestCMS.vent.on(module + ":ReturnCompositeView", function (options, callback) {
				var collection = new ModuleCollection();
				var compositeView = new ModuleViewAllItemsByVendorCompositeView({collection: collection, fromReport: true, itemViewOptions: {fromReport: true}});
				callback(compositeView);
			});

      QuestCMS.vent.on(module + ":URLController", function (alias) {
        URLController(alias);
      });
    };


/*********************************************
 * URL Controller
 *********************************************/
  var URLController = function (alias) {
		var urlParas = alias.split('/');
		var decision = (urlParas[1]) ? urlParas[1] : '';

		if (urlParas) {
			if (decision == 'viewAll') {
        displayViewAllItemCompositeView();
			} else if (decision == 'createNewItem') {
        createNewItem();
			} else if (decision == 'manageItem') {
        displayViewAllItemsByVendorCompositeView();
			} else {
				displayBookItemView();
			}
		} else {
				displayBookItemView();
		}
	};



/*********************************************
 * Backbone Model
 *********************************************/

/*
 * Default Backbone Model
 * urlRoot: constructed by the configs
 */
    var ModuleItem = Backbone.Model.extend({
      initialize: function () { this.options = configs; },
      urlRoot: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType']; },
      idAttribute: '_id',
			defaults: function () {
				return {
					_id: null,
          chiName: '',
          engName: '',
          description: [],
          creator: QuestCMS.user.getId(),
          vendorId: '',
          replenishmentLevel: '',
          supplyPeriod: '',
					vendorCode: ''
				};
			},
			getId: function () {
				return this.get('_id');
			},
			getChiName: function () {
				return this.get('chiName') || '';
			},
			getEngName: function () {
				return this.get('engName') || '';
			},
			getDescription: function () {
				return this.get('description') || [];
			},
			getCode: function () {
				return this.get('code') || '';
			},
			getItemCode: function () {
				return this.get('itemCode') || '';
			},
			getVendorCode: function () {
				return this.get('vendorCode') || '';
			},
      getReplenishmentLevel: function () {
        return this.get('replenishmentLevel') || '';
      },
      getSupplyPeriod: function () {
        return this.get('supplyPeriod') || '';
      },
			getVendorId: function () {
				return this.get('vendorId') || '';
			},
			getCreator: function () {
				return this.get('creator') || '';
			},
			isActive: function () {
				return this.get('active');
			},
      isValidModel: function () {
        var result = false;
        if (this.getChiName() != '' && this.getEngName() != '' && this.getCreator() != '') {
            result = true;
        }
        return result;
      },
			validation: {
				chiName: {required: true},
				engName: {required: true},
				unit: {required: true},
				replenishmentLevel: {required: true, pattern: 'number' },
				supplyPeriod: {required: true},
				active: {required: true}
      }
    });



/*********************************************
 * Backbone Collection
 *********************************************/

/*
 * Default Backbone Collection
 * url: constructed by the configs
 * comparator: sorting function
 * filters: some filtering functions to reduce the collection
 */
    var ModuleCollection = Backbone.Collection.extend({
      initialize: function () { this.options = configs; },
      url: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType']; },
      model: ModuleItem,
      comparator: function (data) {
        return data.get("order");
      },
      filterText: function (text) {
        var regexp = new RegExp(text, "i");
        return new ModuleCollection(this.filter(function (data) {
          return (data.get("content").match(regexp) || data.get("title").match(regexp));
        }));
      },
      filterId: function (id) {
        return new ModuleCollection(this.filter(function (data) {
          return data.get("id") == id;
        }));
      },
      filterAlias: function (alias) {
        return new ModuleCollection(this.filter(function (data) {
          return data.get("alias") == alias;
        }));
      },
      filterLanguage: function (language) {
        return new ModuleCollection(this.filter(function (data) {
          return data.get("language") == language;
        }));
      }
    });




/*********************************************
 * Backbone Marionette ItemView
 *********************************************/

/*
 * Default Backbone ItemView
 * template: underscore import the template
 * className: class name for the output html element, default: <div class="className"></div>
 * events: user defined events to trigger ItemView functions
 * functions: user defined fuctions
 */

/***************************** Step Flow Template (Don't REMOVE) *****************************/
		var ModuleStepFlowView = Backbone.Marionette.ItemView.extend({
			initialize: function () {
				this.options = this.options.options || {};
				this.addonEvents = this.options.events;
				this.requiredEvents = {
					'click .goToWhichStep' 	: 'goToWhichStep',
					'click .nextStep' 			: 'nextStep'
				};
				this.events = $.extend(this.requiredEvents, this.addonEvents);
				$.extend(this, this.options.functions);
			},
      onShow: function () {
        $(document).scrollTop(0);
				$('.step-content', this.el).hide();
				$('.goToWhichStep.btn-primary', this.el).trigger('click');
				this.createStepFlows(this.options.steps);
				this.createStepContents(this.options.contents);
      },
      template: _.template(tplStepFlowView),
			createStepFlows: function (steps) {
				var self = this;
				steps = steps || [];

				steps.forEach(function (step) {
					var $lastStepFlowDiv = $('.questcms-stepFlow-step:last', self.el);
					var $newStepFlowDiv = $lastStepFlowDiv.clone(true);

					$newStepFlowDiv.removeClass('hidden');
					$newStepFlowDiv.find('a').each(function () {
						var href = $(this).prop('href');
						var number = parseInt(href.slice(-1));
						number++;
						if (number > 1) {
							$(this).removeClass('btn-primary').addClass('btn-default').attr('disabled', true);
						}
						$(this).prop('href', href.slice(href.indexOf('#'), -1) + number.toString());
						$(this).text(number.toString());
					});
					$newStepFlowDiv.find('p.questcms-stepFlow-label').each(function () {
						$(this).text(step.label);
					});
					$('.questcms-stepFlow-row', self.el).append($newStepFlowDiv);
				});
			},
			createStepContents: function (contents) {
				var self = this;
				contents = contents || [];

				contents.forEach(function (content) {
					var $lastStepContentDiv = $('.step-content:last', self.el);
					var $newStepContentDiv = $lastStepContentDiv.clone(true);

					$newStepContentDiv.removeClass('hidden');
					var id = $newStepContentDiv.prop('id');
					var number = parseInt(id.slice(-1));
					number++;
					if (number > 1) {
						$newStepContentDiv.hide();
					}
					var newId = id.slice(0, -1) + number.toString();
					$newStepContentDiv.prop('id', newId);
					$('#step-contents>fieldset', self.el).append($newStepContentDiv);

					// Display the first step-content
					if (number == 1) {
						var options = {
							placeholder: '#' + newId,
							model: content.model || self.options.referenceModel
						};
						QuestCMS.vent.trigger(content.trigger, options);
					}
				});
			},
			passDataTo: function (options) {
				options = options || {};
				var curArea = $(options.currentTarget).closest(".step-content"),
            curStepBtn = curArea.attr("id"),
            nextStepWizard = $('div.step-panel div a[href="#' + curStepBtn + '"]').parent().next().children("a"),
						nextStepBtnHref = nextStepWizard.prop('href'),
						placeholder = nextStepBtnHref.slice(nextStepBtnHref.indexOf('#')),
						number = nextStepBtnHref.slice(-1);

				var conditions = {
					placeholder: placeholder,
					model: options.model
				};

				$.extend(conditions, options);

				QuestCMS.vent.trigger(options.contents[number - 1].trigger, conditions);
			},
			goToWhichStep: function (e) {
				e.preventDefault();

        var $target = $($(e.currentTarget).attr('href')),
            $item = $(e.currentTarget);

        if (!$item.hasClass('disabled')) {
					$('.goToWhichStep').removeClass('btn-primary').addClass('btn-default');
					$item.addClass('btn-primary');
					$('.step-content').hide();
					$target.show();
					$target.find('input:eq(0)').focus();
        }
			},
			nextStep: function (options) {
        var curArea = $(options.currentTarget).closest(".step-content"),
            curStepBtn = curArea.attr("id"),
            nextStepWizard = $('div.step-panel div a[href="#' + curStepBtn + '"]').parent().next().children("a"),
            curInputs = curArea.find("input,select,textarea"),
            isValid = true;

        $(".form-group").removeClass("has-error");
        for(var i=0; i < curInputs.length; i++){
					if (!curInputs[i].validity.valid){
						isValid = false;
						$(curInputs[i]).closest(".form-group").addClass("has-error");
					}
        }

        if (isValid) {
					nextStepWizard.removeAttr('disabled').trigger('click');
				}
			}
    });

/***************************** End of Step Flow Template (Don't REMOVE) *****************************/



		var ModuleCreateNewItemView = Backbone.Marionette.ItemView.extend({
			initialize: function(){
				this.afteredit = this.options.afteredit;
				if (this.model) {
					Backbone.Validation.bind(this);
					this.model.bind('validated', function (isValid, model, errors) {
						if (!isValid) {
							var errorMsg = "";
							$.each(errors, function (prop, val) {
                if (val.indexOf('.') !== -1) {
                  var values = val.split('.');
                  val = values[values.length - 1].trim();
                } else {
  								val = val.replace(/(\"|\')/g, '');
                }
								errorMsg += val + ", ";
							});

							QuestCMS.Utils.showAlert('Error', errorMsg.trim().slice(0, -1));
						}
					});
				}
			},
			template: _.template(tplCreateNewItemView),
			onRender: function () {
				var self = this;
				$('form#itemDetail input[data-toggle="floatLabel"]', this.el).each(function () {
          $(this, self.el).attr('data-value', $(this).val());
        });
				this.active = this.model.isActive();
				if( typeof(this.active) == 'undefined'){
					this.active = true;
				}
				this.perpareForm();
				this.addDatepicker();
			},
			events: {
				'keyup [data-toggle="floatLabel"]'	: 'floating',
				'change [data-toggle="floatLabel"]'	: 'floating',
				'click .item-create' 								: 'create',
				'click .item-cancel'								: 'cancel',
				'click #createItemNext'							: 'finished'
			},
			floating: function (e) {
				e.preventDefault();
				$(e.currentTarget).attr('data-value', $(e.currentTarget).val());
			},
			finished: function (e) {
				e.preventDefault();
			},
			addDatepicker: function () {
        $('#supplyPeriod', this.el).datepicker({
          autoSize: false,
          dateFormat: 'yy-mm-dd',
					defaultDate: new Date(),
					changeMonth: true,
					changeYear: true
        });
			},
			cancel: function (e) {
				e.preventDefault();

				this.afteredit();
			},
      create: function (e) {
        e.preventDefault();
				var self = this;
				var formInputs = $("form").find('input');
				$(".form-group").removeClass("has-error");

				var _modelObj = QuestCMS.Utils.getFormData('form#itemDetail');

				_modelObj.description = $('#description').val();
				_modelObj.creator = QuestCMS.user.getId();
				if (_modelObj.description.length > 0) {
					_modelObj.description = _modelObj.description.split('\n');
				}

				self.model.set(_modelObj, {silent: true});

				if (this.model.isValidModel()) {
					this.model.save({}, {
						success: function (model) {
						 $('#createItemNext').click();
							QuestCMS.Utils.showAlert('Success', 'Created Successfully.');
							if (typeof (self.afteredit) == "function"){
								self.afteredit();
							}
						},
						error: function (model, err) {
							var errmsg = "Haven't create item.";
							if (err.responseText != '') {
								errmsg = err.responseText;
							}
							QuestCMS.Utils.showAlert('Error', errmsg);
						}
					});
				} else {
					QuestCMS.Utils.findMissingRequiredData({form: 'form', target: ".form-group"}, function(errTarget) {
						QuestCMS.Utils.showAlert('Info', 'Missing ' + errTarget + '.');
					});
				}
      },
			perpareForm: function () {
				var description = this.model.getDescription();

        if (description.length > 0) {
          var outputDescription = '';
          description.forEach(function (text) {
            outputDescription += text + '\n';
          });
          $('#description', this.el).val(outputDescription);
        }

				$('form#itemDetail').loadJSON(this.model.toJSON());
				$('#vendorCode', this.el).val(this.model.getVendorCode());

				if(!this.active){
					$( "input[name='active']",this.el ).filter('[value="false"]').attr('checked', true);
				} else {
					$( "input[name='active']",this.el ).filter('[value="true"]').attr('checked', true);
				}

			}
		});

		var ModuleShowItemView = Backbone.Marionette.ItemView.extend({
			template: _.template(tplShowItemView),
			onRender: function () {
				var self = this;
				$('#itemDetails', this.el).hide();

				QuestCMS.Utils.autocomplete({
					placeholder: '#itemId',
					el: self.el,
					url: QuestCMS.Utils.setAPIUrl() + '/item?action=findByUniversalSearch&univeralSearch=',
					limit: 10,
					minLength: 1,
					label: 'chiName,engName',
					value: 'itemCode',
					select: function (event, ui) {
						var item = ui.item.json;
						item.vendorCode = item.vendorId.vendorCode;
						var description = item.description || [];
						var outputDescription = '';
						description.forEach(function (text) {
							outputDescription += text + '\n';
						});
						item.description = outputDescription;

						$('#itemDetails', self.el).show();
						$('#itemDetails', self.el).loadJSON(item);
						self.model.set({itemId: item._id, itemCode: item.itemCode}, {silent: true});
					}
				});
			},
			events: {
				'change #itemId' : 'searchItem',
				'click .item-cancel' : 'cancel'
			},
			searchItem: function (e) {
				e.preventDefault();
				var self = this;
				var itemId = $('#itemId').val();

				fetch({univeralSearch: itemId, action: 'findByUniversalSearch'}, function (err, items) {
					if (err) {
						QuestCMS.Utils.showAlert('Error', 'There is no item');
					} else {
						var item = items.at(0);
						item.set({vendorCode: item.getVendorId().vendorCode}, {silent: true});
						var description = item.getDescription();
						var outputDescription = '';
						description.forEach(function (text) {
							outputDescription += text + '\n';
						});
						item.set({description: outputDescription}, {silent: true});

						$('#itemDetails', self.el).show();
						$('#itemDetails', self.el).loadJSON(item.toJSON());
						self.model.set({itemId: item.getId(), itemCode: item.getItemCode()}, {silent: true});
					}
				});
			},
			cancel: function(e){
				e.preventDefault();
				QuestCMS.Utils.setUrlPath({pathname: '#administration'});
			}
		});

		var ModuleVendorDetailsItemView = Backbone.Marionette.ItemView.extend({
			template: _.template(tplVendorDetailsItemView)
		});



    var ModuleViewEachItemByVendorItemView = Backbone.Marionette.ItemView.extend({
			tagName: 'tr',
      template: _.template(tplViewEachItemByVendorItemView),
			onShow: function(){
				if(this.options.fromReport){
					$('.edit').addClass('hidden');
					$('.export').removeClass('hidden');
				};
			},
      events: {
        'click .editItem' : 'edit',
        'click .exportByItem' : 'exportByItem'
      },
      edit: function (e) {
        e.preventDefault();
        displayCreateNewItemView({model: this.model, afteredit: displayViewAllItemCompositeView})
				// this.options.referenceOptions.itemModel.set(this.model.toJSON());
				// $('#editItemNext', this.el).click();
      },
      exportByItem: function (e) {
        e.preventDefault();
				var itemId = this.model.getId();
        QuestCMS.vent.trigger('export:stockByItemReport', {itemId: itemId, branch: searchTerms.branch, stockType: searchTerms.stockType});
      }
    });


/*********************************************
 * Backbone Marionette CompositeView
 *********************************************/

/*
 * Default Backbone CompositeView
 * template: underscore import the template
 * appendHtml: default function to construct the composite view by adding up the item views
 * onRender: function will be executed after the view is rendered. Suitable to add some jQuery codes here to further modified the DOM
 */
	var ModuleViewAllItemsByVendorCompositeView = Backbone.Marionette.CompositeView.extend({
      initialize: function () {
				Backbone.history.navigate('item/manageItem');
				
				this.totalCount = this.options.totalCount;
				this.fromReport = this.options.fromReport || false;
      },
      itemView: ModuleViewEachItemByVendorItemView,
			itemViewOptions: function (model, index) {
				return {
					referenceOptions: this.options.options
				}
			},
      template: _.template(tplViewAllItemsByVendorCompositeView),
      appendHtml: function (collectionView, itemView, index) {
          collectionView.$(".questcms-items").append(itemView.el);
      },
      onRender: function () {
        $(document).scrollTop(0);
        this.showFilterItemCount();
        $('form', this.el).loadJSON(searchTerms);
				var rm = new Marionette.RegionManager();
					newRegion = rm.addRegions({
						vendorDetails: "#vendorDetails"
					});
				$("#itemTable", this.el).tablesorter({
					theme: 'default',
					widthFixed: true,
					widgets: ['zebra']
				}).tablesorterPager({
					container: $("#pager"),
					page: 0,
					size: 5,
					output: '{startRow} to {endRow} ({totalRows})'
				});
				$("#branch", this.el).html(QuestCMS.Utils.addBranchList(false));
      },
			onShow: function(){
				if(this.fromReport){
					this.parpareForReport();
				}

			},
			events: {
        // 'change form' 											: 'change',
				'reset'  														: 'reset',
				'submit' 										: 'submit'
			},
      // change: function (e) {
        // e.preventDefault();
        // var name = $(e.target).prop('name');
        // searchTerms[name] = $(e.target).val().trim();
      // },
      reset: function (e) {
        searchTerms = {};
      },
			submit: function(e) {
        e.preventDefault();
				var self = this;
				searchTerms = {
					universalSearch: $('.universalSearch').val(),
					branch: $('#branch').val(),
					stockType: $('#stockType').val()
				};
				if(this.fromReport){

					var options = searchTerms;
					QuestCMS.vent.trigger('export:displayStockReport', options);


				} else {
					displayAllItemsByVendor(searchTerms);
				}
			},
      showFilterItemCount: function () {
        if (this.collection) {
            $(".center_count", this.el).html(' - ' + this.collection.models.length);
        }
      },
			parpareForReport: function(){
				$('.branch').attr('disabled', false);
				$('.stockTypeRegion').removeClass('hidden');
				$('.branchRegion').outerWidth(330);
				$('.reviewItemHeader').addClass('hidden');
			}
    });


/*********************************************
 * common functions
 *********************************************/



    /*
     * the Callback function subsribed to the PubSub topic "admin:list:start"
     * called by the publisher (mostly the admin module) to the topic "admin:list:start"
     *
     * @param {String} topic        subscribed topic for the PubSub system
     * @param {String} publisher    name of the caller module
     * @param {Object} options      target (String) search target (all or specified module name)
     *                              term (String) the search term
     *                              showall (Boolean) show all or not
     */
    var adminliststart = function (topic, publisher, options) {
      if ((options.target == 'all') || (options.target == module)) {
        var query = {term: options.term, showall: options.showall};
        QuestCMS.vent.trigger("search:search", {module: module, query: query, collection: ModuleCollection});
      }
    };

    var isAuthorize = function (options) {
      return QuestCMS.user.isTeacher();
    };


    /*
     * the default function to run when user type in a URL to trigger this module
     *
     * @param {String} alias        the querystring after the # key in URL
     */
    var resolve = function (alias) {
      var page = 1;
      QuestCMS.Cookie.save({alias: alias, page: page});
      QuestCMS.Utils.setSiteTitle(QuestCMS.l('Item'));
      // if (isAuthorize()) {
        display({alias: alias, page: page});
      // }
    };


    /*
     * the Callback function subsribed to the PubSub topic "search:start"
     * called by the publisher (mostly the search module) to the topic "search:start"
     *
     * @param {String} topic        subscribed topic for the PubSub system
     * @param {String} publisher    name of the caller module
     * @param {Object} options      module (String) this module name
     *                              query (Object) the search term
     *                              collection (Backbone Collection) this module default Collection
     */
    var search = function (topic, publisher, term) {
        var query = {term: term};
        QuestCMS.vent.trigger("search:search", {module: module, query: query, collection: ModuleCollection});
    };

/*********************************************
 * functions
 *********************************************/


    /*
     * Default dipslay wrapper for this module
     * call Fetch to get the collection first
     * and then call another function to show the view
     *
     * @param {Object} options      alias (String) URL alias (after the # key)
     */
    var display = function (options) {
      options = options || {};
      options.page = options.page || 1;
      displayViewAllItemCompositeView();
    };


    var filter = function (options, callback) {
      options = options || {};
      options.page = options.page || 1;
			QuestCMS.vent.trigger("vendor:getVendorModel ", {searchTerms: options.universalSearch}, function(err, model){
				if(err){
					callback(err);
				}
				if(model){
					var vendorId = model.getId();
						fetch({vendorId: vendorId, branch: options.branch, action: 'findItemsByVendorIdWithInventory'}, function(err, collection){
							if(err){
								callback(err);
							} else {
								callback('', model, collection);
							}
						})
				}
			});

    };


    var displayAllItemsByVendor = function (options) {
			var collection, compositeView;
      filter( options, function(err, model, collection){
				if(err){
					QuestCMS.Utils.showAlert('Error', 'No Vendor');
					collection = new ModuleCollection();
					compositeView = new ModuleViewAllItemsByVendorCompositeView({collection: collection});
					QuestCMS.layout[configs[module]['region']].show(compositeView);
				} else {
					compositeView = new ModuleViewAllItemsByVendorCompositeView({collection: collection});
					QuestCMS.layout[configs[module]['region']].show(compositeView);
					var view = new ModuleVendorDetailsItemView({model: model});
					newRegion.vendorDetails.show(view);
				}
			})
    };


    // var displayAllItemsByVendorInExport = function (options, callback) {
			// if(options.universalSearch && options.branch){
				// var collection, compositeView;
				// filter( options, function(err, model, collection){
					// if(err){
						// collection = new ModuleCollection();
						// QuestCMS.Utils.showAlert('Error', 'No Vendor');
					// }
						// compositeView = new ModuleViewAllItemsByVendorCompositeView({collection: collection, fromReport: true, itemViewOptions: {fromReport: true}});
						// callback(compositeView);
				// });
			// } else {
				// collection = new ModuleCollection();
				// compositeView = new ModuleViewAllItemsByVendorCompositeView({collection: collection, fromReport: true, itemViewOptions: {fromReport: true}});
				// callback(compositeView);
			// }
    // };


		var displayCreateNewItemView = function (options) {
			options = options || {};

			if (!options.model) {
				options.model = new ModuleItem();
			}
			var view;
			if(options.afteredit){
				view = new ModuleCreateNewItemView({model: options.model, afteredit: options.afteredit});
			} else {
				view = new ModuleCreateNewItemView({model: options.model});
			}
			if (options.placeholder) {
					$(options.placeholder).html(view.render().el);
			} else {
					QuestCMS.layout[configs[module]['region']].show(view);
			}
		};

		var displayViewAllItemCompositeView = function (options) {
			options = options || {};
      var view = new ModuleViewAllItemsByVendorCompositeView(options);
      QuestCMS.layout[configs[module]['region']].show(view);
		};


		var displayShowItemView = function (options) {
			options = options || {};

			if (!options.model) {
				options.model = new ModuleItem();
			}

			var view = new ModuleShowItemView({model: options.model});
			if (options.placeholder) {
					$(options.placeholder).html(view.render().el);
			} else {
					QuestCMS.layout[configs[module]['region']].show(view);
			}
		};


		var showViewAllItemsByVendorCompositeView = function (options) {
			options = options || {};

			fetch({action: 'findActiveItemByVendorIdWithInventory', vendorId: options.model.getVendorId()}, function (err, items) {
				if (err) {
					QuestCMS.Utils.showAlert('Error', 'Find items error');
				} else {
					var view = new ModuleViewAllItemsByVendorCompositeView({collection: cachedCollection, totalCount: cachedCollection.length, options: options});
					if (options.placeholder) {
						$(options.placeholder).html(view.render().el);
					} else {
						QuestCMS.layout[configs[module]['region']].show(view);
					}
				}
			});
		};

		var displayViewAllItemsByVendorCompositeView = function (options) {
			options = options || {};
			var collection = new ModuleCollection();

			var view = new ModuleViewAllItemsByVendorCompositeView({collection: collection});
			if (options.placeholder) {
				$(options.placeholder).html(view.render().el);
			} else {
				QuestCMS.layout[configs[module]['region']].show(view);
			}
		};

/*
		var manageItem = function (options) {
			options = options || {};

			if (!options.model) {
				options.model = new ModuleItem();
			}

			var data = {
				steps: [
					{label: '搜尋商戶'},
					{label: '選擇禮品'},
					{label: '檢視禮品'}
				],
				contents: [
					{trigger: 'vendor:displayShowVendorDetailsView'},
					{trigger: 'item:showViewAllItemsByVendorCompositeView'},
					{trigger: 'item:displayCreateNewItemView'}
				],
				referenceModel: options.model,
				itemModel: new ModuleItem(),
				events: {
					'click #vendorConfirmNext'     : 'vendorConfirmNext',
					'click #editItemNext'		 			 : 'editItemNext',
					'click #createItemNext'				 : 'createItemNext'
				},
				functions: {
					vendorConfirmNext: function (e) {
						e.preventDefault();
					 // MUST Pass [e.currentTarget], [this.options.contents] to passDataTo function
						this.passDataTo({currentTarget: e.currentTarget, model: this.options.referenceModel, contents: this.options.contents, itemModel: this.options.itemModel})
						this.nextStep({currentTarget: e.currentTarget});
					},
					editItemNext: function (e) {
						e.preventDefault();
						this.passDataTo({currentTarget: e.currentTarget, model: this.options.itemModel, contents: this.options.contents})
						this.nextStep({currentTarget: e.currentTarget});
					},
					createItemNext: function (e) {
						e.preventDefault();
						goToAdminPage();
					}
				}
			}

			var view = new ModuleStepFlowView({options: data});
			if (options.placeholder) {
					$(options.placeholder).html(view.render().el);
			} else {
					QuestCMS.layout[configs[module]['region']].show(view);
			}
		};
*/

		var createNewItem = function (options) {
			options = options || {};
			Backbone.history.navigate('item/createNewItem');

			if (!options.model) {
				options.model = new ModuleItem();
			}

			var data = {
				steps: [
					{label: '搜尋商戶'},
					{label: '加入新禮品'},
					{label: '禮品入貨'}
				],
				contents: [
					{trigger: 'vendor:displayShowVendorDetailsView'},
					{trigger: 'item:displayCreateNewItemView'},
					{trigger: 'inventory:displayStockInView'}
				],
				referenceModel: options.model,
				events: {
					'click #vendorConfirmNext' : 'vendorConfirmNext',
					'click #createItemNext'		 : 'createItemNext'
				},
				functions: {
					vendorConfirmNext: function (e) {
						e.preventDefault();
						this.passDataTo({currentTarget: e.currentTarget, model: this.options.referenceModel, contents: this.options.contents})
						this.nextStep({currentTarget: e.currentTarget});
					},
					createItemNext: function (e) {
						e.preventDefault();
						this.passDataTo({currentTarget: e.currentTarget, itemModel: this.options.referenceModel, contents: this.options.contents})
						this.nextStep({currentTarget: e.currentTarget});
					}
				}
			}

			var view = new ModuleStepFlowView({options: data});
			if (options.placeholder) {
					$(options.placeholder).html(view.render().el);
			} else {
					QuestCMS.layout[configs[module]['region']].show(view);
			}
		};

		var getModuleViewAllItemsByVendorCompositeView = function(collection, callback){
			collection = collection || new ModuleCollection();
			var compositeView = new ModuleViewAllItemsByVendorCompositeView({collection: collection, fromReport: true, itemViewOptions: {fromReport: true}});
			callback(compositeView);
		}
    /*
     * Fetch and cache the data collection
     *
     * @param {Object} options      for backend filtering
     * @param {Callback} callback      callback accept 2 arguments (err, collection)
     */
    var fetch = function (options, callback) {
      options = options || {};

      if (configs[module]['isCachedCollection'] && cachedCollection) {
        callback(null, cachedCollection);
      } else {
        var deferred = $.Deferred();
        cachedCollection = new ModuleCollection();
        cachedCollection.on("reset", function (data) {
          deferred.resolve(data);  // call deferred.done
        });

				var data = {
					action: options.action || 'findAllItems'
				};

				$.extend(data, options);

        cachedCollection.fetch({
				  data: data,
					error: function (collection, response) {
						if (response.status == 0) {
							response.status = 500;
						}
            callback(response.status, collection, response);
					}
				});


        deferred.done(function () {
          callback(null, cachedCollection);
        });
      }
    };


    /*
     * Function being trigger when the view is closed
     */
    var viewOnClose = function () {
      /* do something such as close the sidebar view */
      QuestCMS.layout.toolBoxRegion.close();
    };

		var goToAdminPage = function () {
			QuestCMS.vent.trigger('administration:display');
		};

/*********************************************
 * Return
 *********************************************/
    return Item;

});
