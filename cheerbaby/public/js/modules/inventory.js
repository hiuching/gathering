/*********************************************
 * Inventory module
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
  "text!tpl/inventory.html"
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
    var tplStockInView = $('#StockInView', '<div>' + templateString + '</div>').html();
    var tplStockOutView = $('#StockOutView', '<div>' + templateString + '</div>').html();
    var tplStepFlowView = $('#StepFlowView', '<div>' + templateString + '</div>').html();


/*********************************************
 * Module scope variables
 *********************************************/

/*
 * Define the module-wide variables here
 * at least 2 variables: module and configs.
 */
    var module = "inventory"; // lowercase only
    var configs = {};

    var limit, pageSize, pageCount, sectionStart = 1, sectionEnd = 1, lastPage;
    var nextkey = "", startkey = "";
		var searchTerms = {};
    var cachedCollection;
    var currentPage;

/*********************************************
 * Main function (export)
 *********************************************/

/*
 * Main module funtion here
 * name is CamelCase
 */
    var Inventory = function () {
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

      QuestCMS.vent.on(module + ":stockIn", function (options) {
        stockIn(options);
      });

      QuestCMS.vent.on(module + ":displayStockInView", function (options) {
        displayStockInView(options);
      });

      QuestCMS.vent.on(module + ":stockOutItemAfterScanBarcode", function (options) {
        stockOutItemAfterScanBarcode(options);
      });

      QuestCMS.vent.on(module + ":stockOut", function (options) {
        stockOut(options);
      });

      QuestCMS.vent.on(module + ":displayStockOutView", function (options) {
        displayStockOutView(options);
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
			if (decision == 'stockIn') {
        stockIn();
			}  else if (decision == 'stockOut') {
        stockOut();
			} else {
				stockIn();
			}
		} else {
			stockIn();
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
          date: new Date(),
          creator: QuestCMS.user.getId(),
          quantity: '',
					remarks: [],
					branch: QuestCMS.Cookie.get('branch')
				};
			},
			getId: function () {
				return this.get('_id');
			},
			getItemId: function () {
				return this.get('itemId');
			},
			getDate: function () {
				return this.get('date') || new Date();
			},
			getRemarks: function () {
				return this.get('remarks') || [];
			},
			getResponsibleFor: function () {
				return this.get('responsibleFor') || '';
			},
			getQuantity: function () {
				return this.get('quantity') || '';
			},
			getUserId: function () {
				return this.get('userId') || ''
			},
			getItemCode: function () {
				return this.get('itemCode') || ''
			},
			getVendorCode: function () {
				return this.get('vendorCode') || ''
			},
			stockInValidation: function () {
				var result = false;

				if (this.getQuantity() != '' && this.getDate() && this.getResponsibleFor() != '') {
					result = true;
				}
				return result;
			},
			stockOutValidation: function () {
				var result = false;

				if (this.getQuantity() != '' && this.getDate() && this.getResponsibleFor() != '') {
					result = true;
				}
				return result;
			},
      validation: {
				'branch': { required: true },
				'date': { required: true },
				'quantity': { required: true, pattern: 'number' },
				'responsibleFor': { required: true }
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




		var ModuleStockInView = Backbone.Marionette.ItemView.extend({
			initialize: function () {
				if (this.options.options.itemModel) {
					this.itemModel = this.options.options.itemModel || {};
				}
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
				this.afterEdit = typeof (this.options.afterEdit) == "function " ? this.options.afterEdit : goToAdminPage;
			},
      onRender: function () {
        $(document).scrollTop(0);
        this.prepareForm();
				// this.autoComplete();
				if (QuestCMS.Cookie.get('branch') !== '') {
					$('#warehouse', this.el).val(QuestCMS.Cookie.get('branch'));
				}
      },
			onShow: function () {
				this.createButton = QuestCMS.Utils.createLadda('.inventory-create');
			},
      template: _.template(tplStockInView),
      events: {
				'click .inventory-create' : 'create',
				'click .inventory-cancel'	: 'cancel'
      },
			autoComplete: function () {
				var self = this;

        if (!this.itemModel) {
					QuestCMS.Utils.autocomplete({
						placeholder: '#itemId',
						url: QuestCMS.Utils.setAPIUrl() + '/item?action=findItemByName&name=',
						el: self.el,
						limit: 10,
						minLength: 1,
						label: 'chiName,engName,code',
						value: 'chiName',
						select: function (event, ui) {
							self.model.set({itemId: ui.item.json._id}, {silent: true});
						}
					});
				}
			},
			cancel: function (e) {
				e.preventDefault();

				QuestCMS.vent.trigger('administration:display');
			},
      create: function (e) {
				e.preventDefault();
				var self = this;
				var formInputs = $("form").find('input,select');
				$(".form-group").removeClass("has-error");

				var _modelObj = QuestCMS.Utils.getFormData('form#createStockIn', '.itemCode');

				_modelObj.remarks = $('#remarks').val();
				if (_modelObj.remarks.length > 0) {
					_modelObj.remarks = _modelObj.remarks.split('\n');
				}

				self.model.set(_modelObj, {silent: true});

				if (this.model.stockInValidation()) {
					this.model.save({}, {
						success: function (model) {
							// self.createButton.stop();
							QuestCMS.Utils.showAlert('Success', 'Created Successfully.');
							self.afterEdit();
							// QuestCMS.layout[configs[module]['region']].close();
						},
						error: function (model, err) {
							// self.createButton.stop();
							var errmsg = "Haven't create inventory.";
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
      prepareForm: function () {
        if (this.itemModel) {
					$('#itemId', this.el).val(this.itemModel.getItemCode());
					this.model.set({itemId: this.itemModel.getId()}, {silent: true});
				} else {
					if (this.model.getItemCode()) {
						$('#itemCode', this.el).val(this.model.getItemCode());
					}
				}

				if (this.model.get('currentQuantity')) {
					$('#existQuantity', this.el).val(this.model.get('currentQuantity'));
				}

				var remarks = this.model.getRemarks();
				var outputRemark = '';
				remarks.forEach(function (remark) {
					outputRemark += remark + '\n';
				})
				$('#remarks').val(outputRemark);

				$('#date', this.el).val(new Date().toDateFormat('yyyy-MM-dd'));

        $('.needDatepicker', this.el).datepicker({
          autoSize: false,
          dateFormat: 'yy-mm-dd',
					defaultDate: new Date(),
					changeMonth: true,
					changeYear: true
        });
      }
    });

		var ModuleStockOutView = Backbone.Marionette.ItemView.extend({
			initialize: function () {
				if (this.options.options.itemModel) {
					this.itemModel = this.options.options.itemModel || {};
				}
				if (this.model) {
					Backbone.Validation.bind(this);
					this.model.bind('validated', function (isValid, model, errors) {
						if (!isValid) {
							var errorMsg = "";
							$.each(errors, function (prop, val) {
								val = val.replace(/(\"|\')/g, '');
								errorMsg += val + ", ";
							});

							// self.submitButton.stop();
							QuestCMS.Utils.showAlert('Error', errorMsg);
						}
					});
				}
			this.afterEdit = typeof (this.options.afterEdit) == "function " ? this.options.afterEdit : goToAdminPage;
			},
      onRender: function () {
        $(document).scrollTop(0);
        this.prepareForm();
				this.autoComplete();
				$("input:radio,input:checkbox", this.el).closest('div').css("padding-top", "7px");
				if (QuestCMS.Cookie.get('branch') !== '') {
					$('#warehouse', this.el).val(QuestCMS.Cookie.get('branch'));
				}
      },
			onShow: function () {
				// this.createButton = QuestCMS.Utils.createLadda('.inventory-create');
			},
      template: _.template(tplStockOutView),
      events: {
				'click .inventory-create' : 'create',
				'click .inventory-cancel'	: 'cancel',
				'change'									:	'change'
      },
			autoComplete: function () {
				var self = this;

        if (!this.itemModel) {
					QuestCMS.Utils.autocomplete({
						placeholder: '#itemId',
						el: self.el,
						url: QuestCMS.Utils.setAPIUrl() + '/item?action=findItemByName&name=',
						limit: 10,
						minLength: 1,
						label: 'chiName,engName,code',
						value: 'chiName',
						select: function (event, ui) {
							self.model.set({itemId: ui.item.json._id}, {silent: true});
						}
					});
				}
			},
			cancel: function (e) {
				e.preventDefault();

				QuestCMS.vent.trigger('administration:display');
			},
			change: function(){
				if($('#transfer', this.el).prop('checked')){
					$('#transferReasonsText', this.el).attr('disabled', false);
				} else {
					$('#transferReasonsText', this.el).attr('disabled', 'disabled');
					$('#transferReasonsText', this.el).val('');
				}
				if($('#other', this.el).prop('checked')){
					$('#otherReasonsText', this.el).attr('disabled', false);
				} else {
					$('#otherReasonsText', this.el).attr('disabled', 'disabled');
					$('#otherReasonsText', this.el).val('');
				}
			},
      create: function (e) {
				e.preventDefault();
				var self = this;
				var formInputs = $("form").find('input,select');
				$(".form-group").removeClass("has-error");


				var _modelObj = QuestCMS.Utils.getFormData('form#createStockOut', '.itemCode');
				_modelObj.quantity = '-' + _modelObj.quantity;

				self.model.set(_modelObj, {silent: true});

				if (this.model.stockOutValidation()) {
					// if (!self.createButton.isLoading()) {
						// self.createButton.start();
						this.model.save({}, {
							success: function (model) {
								// self.createButton.stop();
								QuestCMS.Utils.showAlert('Success', 'Created Successfully.');
								self.afterEdit();
							},
							error: function (model, err) {
								// self.createButton.stop();
								var errmsg = "Haven't create inventory.";
								if (err.responseText != '') {
									errmsg = err.responseText;
								}
								QuestCMS.Utils.showAlert('Error', errmsg);
							}
						});
					// }
				} else {
					QuestCMS.Utils.findMissingRequiredData({form: 'form', target: ".form-group"}, function(errTarget) {
						QuestCMS.Utils.showAlert('Info', 'Missing ' + errTarget + '.');
					});
				}
      },
      prepareForm: function () {
        if (this.itemModel) {
					$('#itemCode', this.el).val(this.itemModel.getChiName());
					this.model.set({itemId: this.itemModel.getId()}, {silent: true});
				} else {
            if (this.model.getItemCode()) {
                $('#itemCode', this.el).val(this.model.getItemCode());
            }
				}

				if (this.model.get('currentQuantity')) {
					$('#existQuantity', this.el).val(this.model.get('currentQuantity'));
				}

				var remarks = this.model.getRemarks();
				var outputRemark = '';
				remarks.forEach(function (remark) {
					outputRemark += remark + '\n';
				})
				$('#remarks', this.el).val(outputRemark);

				$('#date', this.el).val(new Date().toDateFormat('yyyy-MM-dd'));

        $('#date', this.el).datepicker({
          autoSize: false,
          dateFormat: 'yy-mm-dd',
					defaultDate: new Date(),
					changeMonth: true,
					changeYear: true
        });
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
      QuestCMS.Utils.setSiteTitle(QuestCMS.l('Inventory'));
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
      displayViewAllInventoryCompositeView();
    };


    var filter = function (options) {
      options = options || {};
      options.page = options.page || 1;

      if (cachedCollection) {
        cachedCollection = null;

      }

      fetch(options, function (err, cachedCollection, response) {
        if (err) {
          QuestCMS.Utils.showAlert('Error', err);
        } else {
					// var collection = new ModuleCollection(cachedCollection.models[0].get('data'));
					// var totalCount = cachedCollection.models[0].get('total')
          displayViewAllInventoryCompositeView({collection: cachedCollection, totalCount: cachedCollection.length});
        }
      });
    };

		var displayStockInView = function (options) {
			options = options || {};

			if (!options.model) {
				options.model = new ModuleItem();
			}

			var view = new ModuleStockInView({model: options.model, options: options});
			if (options.placeholder) {
				$(options.placeholder).html(view.render().el);
			} else {
				QuestCMS.layout[configs[module]['region']].show(view);
			}
		};

		var displayStockOutView = function (options) {
			options = options || {};

			if (!options.model) {
				options.model = new ModuleItem();
			}

			var view = new ModuleStockOutView({model: options.model, options: options});
			if (options.placeholder) {
				$(options.placeholder).html(view.render().el);
			} else {
				QuestCMS.layout[configs[module]['region']].show(view);
			}
		};

		var stockIn = function (options) {
			Backbone.history.navigate('inventory/stockIn');
				
			options = options || {};

			if (!options.model) {
				options.model = new ModuleItem();
			}

			var data = {
				steps: [
					{label: '搜尋禮品'},
					{label: '禮品入貨'}
				],
				contents: [
					{trigger: 'item:displayShowItemView'},
					{trigger: 'inventory:displayStockInView'}
				],
				referenceModel: options.model,
				events: {
					'click .item-confirm' : 'confirmItem'
				},
				functions: {
					confirmItem: function (e) {
						e.preventDefault();
						var self = this;

						var data = {
							action: 'findQuantityByConditions',
							itemId: self.options.referenceModel.getItemId()
						};
						$.ajax({
							type: 'GET',
							dataType: 'json',
							url: QuestCMS.Utils.setAPIUrl() + '/' + module,
              headers: QuestCMS.headers,
							data: data,
							success: function (obj) {
								self.options.referenceModel.set({currentQuantity: obj.quantity}, {silent: true});
								self.passDataTo({currentTarget: e.currentTarget, model: self.options.referenceModel, contents: self.options.contents})
								self.nextStep({currentTarget: e.currentTarget})
							},
							error: function (err) {
								QuestCMS.Utils.showAlert('Error', "There are some errors during calculate the existing quantity.");
							}
						});
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

		var stockOut = function (options) {
			Backbone.history.navigate('inventory/stockOut');
			options = options || {};

			if (!options.model) {
				options.model = new ModuleItem();
			}

			var data = {
				steps: [
					{label: '搜尋禮品'},
					{label: '禮品出貨'}
				],
				contents: [
					{trigger: 'item:displayShowItemView'},
					{trigger: 'inventory:displayStockOutView'}
				],
				referenceModel: options.model,
				events: {
					'click .item-confirm' : 'confirmItem'
				},
				functions: {
					confirmItem: function (e) {
						e.preventDefault();
						var self = this;

						var data = {
							action: 'findQuantityByConditions',
							itemId: self.options.referenceModel.getItemId()
						};

						$.ajax({
							type: 'GET',
							dataType: 'json',
							url: QuestCMS.Utils.setAPIUrl() + '/' + module,
              headers: QuestCMS.headers,
							data: data,
							success: function (obj) {
								self.options.referenceModel.set({currentQuantity: obj.quantity}, {silent: true});
								self.passDataTo({currentTarget: e.currentTarget, model: self.options.referenceModel, contents: self.options.contents})
								self.nextStep({currentTarget: e.currentTarget})
							},
							error: function (err) {
								QuestCMS.Utils.showAlert('Error', "There are some errors during calculate the existing quantity.");
							}
						});
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

		var stockOutItemAfterScanBarcode = function (options) {
			options = options || {};

			var existError = false,
			    errMsg = '',
					items = options.items;

			items.forEach(function (item, index) {
				var inventory = new ModuleItem({quantity: '-1', itemId: item._id, reasons: 'consumption'});
				inventory.save({}, {
					error: function () {
						existError = true;
						errMsg += "Haven't save this item" + item.code;
					}
				});

				if ((index + 1) == items.length) {
					options.callback(existError, errMsg);
				}
			});
		};


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
					action: options.action || 'findAllInventorys'
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
    return Inventory;

});
