/*********************************************
 * Export module
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
  "text!tpl/export.html"
],


/*
 * Objects to store the marionette and the HTML template file
 */
function (Marionette, templateString) {


/*********************************************
 * Templates
 *********************************************/

/*
 * Read the corresponding segment of HTML code into template variables
 */
	var tplListView = $('#ListView', '<div>' + templateString + '</div>').html();
	var tplListView = $('#ListView', '<div>' + templateString + '</div>').html();
	var tplAppointmentReportItemView = $('#AppointmentReportItemView', '<div>' + templateString + '</div>').html();
	var tplSentGiftReportItemView = $('#SentGiftReportItemView', '<div>' + templateString + '</div>').html();
	var tplTransactionReportItemView = $('#TransactionReportItemView', '<div>' + templateString + '</div>').html();
	var tplVendorsApplicationReportItemView = $('#VendorsApplicationReportItemView', '<div>' + templateString + '</div>').html();
	var tplStockTakeReportItemView = $('#StockTakeReportItemView', '<div>' + templateString + '</div>').html();
	var tplStockReportByPeriodItemView = $('#StockReportByPeriodItemView', '<div>' + templateString + '</div>').html();
	var tplAllVendorRecordItemView = $('#AllVendorRecordItemView', '<div>' + templateString + '</div>').html();
	var tplVendorReportItemView = $('#VendorReportItemView', '<div>' + templateString + '</div>').html();
	var tplVendorListReportItemView = $('#VendorListReportItemView', '<div>' + templateString + '</div>').html();
	var tplVendorReportCompositeView = $('#VendorReportCompositeView', '<div>' + templateString + '</div>').html();
	var tplAccountingCompositeView = $('#AccountingCompositeView', '<div>' + templateString + '</div>').html();
	var tplFrontdeskCompositeView = $('#FrontdeskCompositeView', '<div>' + templateString + '</div>').html();
	var tplStockCompositeView = $('#StockCompositeView', '<div>' + templateString + '</div>').html();
	var tplPDFTemplate = $('#PDFTemplate', '<div>' + templateString + '</div>').html();

/*********************************************
 * Module scope variables
 *********************************************/

/*
 * Define the module-wide variables here
 * at least 2 variables: module and configs.
 */
    var module = "export"; // lowercase only
    var configs = {};

    var cachedCollection;
    var currentPage;
    var FrontdeskRegion;
    var AccountingRegion;
    var StockRegion;
		var searchTerms = {};
/*********************************************
 * Main function (export)
 *********************************************/

/*
 * Main module funtion here
 * name is CamelCase
 */
    var Export = function () {
      var self = this;
      configs[module] = {             // module specified config options
        isOnAdminList: false,         // is shown on the admin menu list
        isSearchable: false,          // is this module data searchable
        dataType: module,             // this module data source
        region: 'contentRegion'  // default display region
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());  // merge with QuestCMS system config, refer to js/config/config.js


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

      QuestCMS.vent.on(module + ":adminReport", function (options) {
        adminReport(options);
      });

			QuestCMS.vent.on(module + ":vendorReport", function (options) {
        vendorReport(options);
      });

			QuestCMS.vent.on(module + ":memberTranscationReport", function (options) {
        memberTranscationReport(options);
      });

			QuestCMS.vent.on(module + ":stockByItemReport", function (options) {
        stockByItemReport(options);
      });

			QuestCMS.vent.on(module + ":displayAccountingReport", function (options) {
        displayAccountingReport(options);
      });

			QuestCMS.vent.on(module + ":displayAdminReport", function (options) {
        displayAdminReport(options);
      });

			QuestCMS.vent.on(module + ":displayVendorsApplicationReport", function (options) {
        displayVendorsApplicationReport(options);
      });

			QuestCMS.vent.on(module + ":displayFrontDeskReport", function (options) {
        displayFrontDeskReport(options);
      });

			QuestCMS.vent.on(module + ":displayStockReport", function (options) {
        displayStockReport(options);
      });

			QuestCMS.vent.on(module + ":displayPDF", function (options) {
        displayPDF(options);
      });

      QuestCMS.vent.on(module + ":URLController", function (alias) {
        URLController(alias);
      });


      /* module specified events */
      QuestCMS.vent.on(module + ":display", function () {
        QuestCMS.Cookie.set({module: module});
        var alias = QuestCMS.Cookie.get("alias");
        Backbone.history.navigate(alias);
        display({alias: alias});
      });
    };


/*********************************************
 * URL Controller
 *********************************************/
  var URLController = function (alias) {
		var urlParas = alias.split('/');
		var decision = (urlParas[1]) ? urlParas[1] : '';

		if (urlParas) {
			if (decision  == 'frontdeskReport') {
				displayFrontDeskReport();
			} else if (decision == 'stockReport') {
				displayStockReport();
			} else if (decision == 'accountingReport') {
				displayAccountingReport();
			}  else if (decision == 'applicationReport') {
				displayVendorsApplicationReport();
			} else {
				displayFrontDeskReport();
			}
		} else {
			displayFrontDeskReport();
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
      idAttribute: '_id'
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
    var ModuleListView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplListView),
			events: {
			'click .transactionReport'   :	'ShowTransactionReport'
			},
			ShowTransactionReport: function(){
				displayFrontDeskReport();
			}
    });

/*********************************************
 * Backbone Marionette ItemView
 *********************************************/
     var ModuleAllVendorRecordItemView = Backbone.Marionette.ItemView.extend({
		  template: _.template(tplAllVendorRecordItemView),
			onRender: function () {
				$("#allVendorRecord-branch", this.el).html(QuestCMS.Utils.addBranchList(false));
			},
			onShow: function () {
				var today = new Date();
				this.today = today.yyyymmdd();

				var dateRange = new Date().wholeMonth(this.today);
				var dateFrom = dateRange.from.toDateFormat('yyyy-MM-dd');
				var dateTo = dateRange.to.toDateFormat('yyyy-MM-dd');
				$('.allVendorRecord-startDate').val(dateFrom);
				$('.allVendorRecord-endDate').val(dateTo);
				this.showDatePicker();
			},
			events: {
				'submit'															: 'exportAllVendorRecord',
				'reset'																:'reset',
				'change .allVendorRecord-startDate'		: 'showDatePicker'
			},
			reset: function(e){
				e.preventDefault();
			},
			exportAllVendorRecord: function(e){
				e.preventDefault();
				var dateTo = $('.allVendorRecord-endDate').val();
				var dateFrom = $('.allVendorRecord-startDate').val();
				var branch = $('#allVendorRecord-branch').val();
				allVendorRecord({dateFrom: dateFrom, dateTo: dateTo, branch: branch});
			},
			showDatePicker: function(){
				this.startDate = $('.allVendorRecord-startDate').val() || this.today;
				this.endDate = $('.allVendorRecord-endDate').val() || this.today;

				$('.allVendorRecord-startDate').removeClass('hasDatepicker');
				$('.allVendorRecord-endDate').removeClass('hasDatepicker');

				var startDateSetting = {
					autoSize: false,
					dateFormat: 'yy-mm-dd',
					changeMonth: true,
					changeYear: true
				};
				QuestCMS.Utils.addDatepicker({placeholder: '.allVendorRecord-startDate', self: this, setting: startDateSetting});

				var endDateSetting = {
					autoSize: false,
					dateFormat: 'yy-mm-dd',
					minDate: this.startDate,
					changeMonth: true,
					changeYear: true
				};

				QuestCMS.Utils.addDatepicker({placeholder: '.allVendorRecord-endDate', self: this, setting: endDateSetting});
			}
    });

    var ModuleAppointmentReportItemView = Backbone.Marionette.ItemView.extend({
		  template: _.template(tplAppointmentReportItemView),
			onRender: function(){
				$("#appointmentReport-branch", this.el).html(QuestCMS.Utils.addBranchList(false));
			},
			onShow: function(){
			var today = new Date();
			this.today = today.toDateFormat('yyyy-MM-dd');

				$('.appointmentReport-startDate').val(this.today);
				$('.appointmentReport-endDate').val(this.today);

				this.showDatePicker();
			},
			events: {
				'submit'															: 'exportappointmentReport',
				'reset'																:'reset',
				'change .appointmentReport-startDate'	: 'showDatePicker'
			},
			reset: function(e){
				e.preventDefault();
			},
			exportappointmentReport: function(e){
				e.preventDefault();
				var dateFrom = $('.appointmentReport-startDate').val();
				var dateTo = $('.appointmentReport-endDate').val();
				var branch = $('#appointmentReport-branch').val();
				appointmentReport({dateFrom: dateFrom, dateTo: dateTo, branch: branch});
			},
			showDatePicker: function(){
				this.startDate = $('.appointmentReport-startDate').val() || this.today;
				this.endDate = $('.appointmentReport-endDate').val() || this.today;

				$('.appointmentReport-startDate').removeClass('hasDatepicker');
				$('.appointmentReport-endDate').removeClass('hasDatepicker').val(this.startDate);

				var startDateSetting = {
					autoSize: false,
					dateFormat: 'yy-mm-dd',
					changeMonth: true,
					changeYear: true
				};
				QuestCMS.Utils.addDatepicker({placeholder: '.appointmentReport-startDate', self: this, setting: startDateSetting});

				var endDateSetting = {
					autoSize: false,
					dateFormat: 'yy-mm-dd',
					minDate: this.startDate,
					changeMonth: true,
					changeYear: true
				};

				QuestCMS.Utils.addDatepicker({placeholder: '.appointmentReport-endDate', self: this, setting: endDateSetting});
			}
    });


    var ModuleVendorsApplicationReportItemView = Backbone.Marionette.ItemView.extend({
		  template: _.template(tplVendorsApplicationReportItemView),
			onShow: function(){
				var today = new Date();
				this.today = today.toDateFormat('yyyy-MM-dd');
				this.showDatePicker();

				$('.vendorsApplicationReport-startDate').val(this.today);
				$('.vendorsApplicationReport-endDate').val(this.today);
			},
			events: {
				'submit'																		: 'exportvendorsApplicationReport',
				'change .vendorsApplicationReport-startDate': 'showDatePicker',
				'reset'																			:'reset'
			},
			reset: function(e){
				e.preventDefault();
			},
			exportvendorsApplicationReport: function(e){
				e.preventDefault();
				this.startDate = $('.vendorsApplicationReport-startDate').val();
				this.endDate = $('.vendorsApplicationReport-endDate').val();
				vendorsApplicationReport({dateFrom: this.startDate, dateTo: this.endDate});
			},
			showDatePicker: function(){
				this.startDate = $('.vendorsApplicationReport-startDate').val() || this.today;
				this.endDate = $('.vendorsApplicationReport-endDate').val() || this.today;

				$('.vendorsApplicationReport-startDate').removeClass('hasDatepicker');
				$('.vendorsApplicationReport-endDate').removeClass('hasDatepicker').val(this.startDate);

				var startDateSetting = {
					autoSize: false,
					dateFormat: 'yy-mm-dd',
					changeMonth: true,
					changeYear: true
				};
				QuestCMS.Utils.addDatepicker({placeholder: '.vendorsApplicationReport-startDate', self: this, setting: startDateSetting});

				var endDateSetting = {
					autoSize: false,
					dateFormat: 'yy-mm-dd',
					minDate: this.startDate,
					changeMonth: true,
					changeYear: true
				};

				QuestCMS.Utils.addDatepicker({placeholder: '.vendorsApplicationReport-endDate', self: this, setting: endDateSetting});
			}
    });

		var ModulePDFTemplate = Backbone.Marionette.ItemView.extend({
      template: _.template(tplPDFTemplate),
			serializeData: function(){
				return {
					date: new Date().toDateFormat('yyyy-MM-dd'),
					time: new Date().toDateFormat('HH:mm'),
					branch: QuestCMS.l(QuestCMS.Cookie.get('branch')),
					memberCode: this.options.member.get('code'),
					memberName: this.options.member.getFullName()
				}

			},
			onRender: function() {
				var self = this;
				var memberEasyArrays = [], memberEasyCount = 1;
				var infoEasyArrays = [], infoEasyCount = 1;

				var vendors = this.options.vendors.models;
				vendors.forEach(function(array){
					var contract = array.getContract();

					if(contract.service == 'Member Easy'){
						memberEasyArrays.push(array);
					} else
						infoEasyArrays.push(array);
				});

				for (var ii=0; (memberEasyArrays.length > ii) || (infoEasyArrays.length > ii); ii++){
					if(memberEasyArrays[ii]){
						var memberEasyStr = '<td class="pdfTemplate-tbody" style="text-align:left; vertical-align:middle;border: 2px solid black; border-collapse: collapse;"><input type="checkbox"> ' + memberEasyCount + '. ' + memberEasyArrays[ii].getChiDisplayName() + '</td>';
						memberEasyCount++;
					} else {
						var memberEasyStr = '<td class="pdfTemplate-tbody" style="text-align:left; vertical-align:middle;border: 2px solid black; border-collapse: collapse;"></td>';
					}
					if(infoEasyArrays[ii]){
						var infoEasyStr = '<td class="pdfTemplate-tbody" style="text-align:left; vertical-align:middle;border: 2px solid black; border-collapse: collapse;"><input type="checkbox"> ' + infoEasyCount + '. ' + infoEasyArrays[ii].getChiDisplayName() + '</td>';
						infoEasyCount++;
					} else {
						var infoEasyStr = '<td class="pdfTemplate-tbody" style="text-align:left; vertical-align:middle;border: 2px solid black; border-collapse: collapse;"></td>';
					}
					$('.questcms-vendorsByService', self.el).append('<tr>' + memberEasyStr + infoEasyStr + '</tr>')
				}
			}
    });

		var ModuleSentGiftReportItemView = Backbone.Marionette.ItemView.extend({
		  template: _.template(tplSentGiftReportItemView),
			onRender: function(){

			},
			onShow: function(){
			var today = new Date();
			this.today = today.toDateFormat('yyyy-MM-dd');
			this.showDatePicker();
				$('.sentGiftReport-startDate').val(this.today);
				$('.sentGiftReport-endDate').val(this.today);
			},
			events: {
				'submit'															: 'exportSentGiftReport',
				'reset'																:'reset',
				'change .sentGiftReport-startDate'	: 'showDatePicker'
			},
			reset: function(e){
				e.preventDefault();
			},
			exportSentGiftReport: function(e){
				e.preventDefault();
				var dateFrom = $('.sentGiftReport-startDate').val();
				var dateTo = $('.sentGiftReport-endDate').val();
				var vendorService = $('#sentGiftReport-vendorService').val()
				sentGiftReport({dateFrom: dateFrom, dateTo: dateTo, vendorService: vendorService});
			},
			showDatePicker: function(){
				this.startDate = $('.sentGiftReport-startDate').val() || this.today;
				this.endDate = $('.sentGiftReport-endDate').val() || this.today;

				$('.sentGiftReport-startDate').removeClass('hasDatepicker');
				$('.sentGiftReport-endDate').removeClass('hasDatepicker').val(this.startDate);

				var startDateSetting = {
					autoSize: false,
					dateFormat: 'yy-mm-dd',
					changeMonth: true,
					changeYear: true
				};
				QuestCMS.Utils.addDatepicker({placeholder: '.sentGiftReport-startDate', self: this, setting: startDateSetting});

				var endDateSetting = {
					autoSize: false,
					dateFormat: 'yy-mm-dd',
					minDate: this.startDate,
					changeMonth: true,
					changeYear: true
				};

				QuestCMS.Utils.addDatepicker({placeholder: '.sentGiftReport-endDate', self: this, setting: endDateSetting});
			}
    });

		var ModuleStockTakeReportItemView = Backbone.Marionette.ItemView.extend({

		  template: _.template(tplStockTakeReportItemView),
			onRender: function(){
				$("#stockTakeReport-branch", this.el).html(QuestCMS.Utils.addBranchList(false));
			},
			events: {
				'submit'			: 'exportstockTakeReport',
				'reset'																:'reset'
			},

			reset: function(e){
				e.preventDefault();
			},
			exportstockTakeReport: function(e){
				e.preventDefault();
				var branch = $('#stockTakeReport-branch').val();
				stockTakeReport({branch: branch});
			}
    });

		var ModuleStockReportByPeriodItemView = Backbone.Marionette.ItemView.extend({
		  template: _.template(tplStockReportByPeriodItemView),
			onShow: function(){
			var today = new Date();
			this.today = today.toDateFormat('yyyy-MM-dd');
			this.showDatePicker();

				$('.stockReportByPeriod-startDate').val(this.today);
				$('.stockReportByPeriod-endDate').val(this.today);
			},
			events: {
				'submit'																: 'exportStockReportByPeriod',
				'reset'																	:'reset',
				'change .stockReportByPeriod-startDate'	: 'showDatePicker'
			},
			reset: function(e){
				e.preventDefault();
			},
			exportStockReportByPeriod: function(e){
				e.preventDefault();
				var dateFrom = $('.stockReportByPeriod-startDate').val();
				var dateTo = $('.stockReportByPeriod-endDate').val();
				var stockType = $('#stockReportByPeriod-stockType').val();

					stockByDateReport({dateFrom: dateFrom, dateTo: dateTo, stockType: stockType});
			},
			showDatePicker: function(){
				this.startDate = $('.stockReportByPeriod-startDate').val() || this.today;
				this.endDate = $('.stockReportByPeriod-endDate').val() || this.today;

				$('.stockReportByPeriod-startDate').removeClass('hasDatepicker');
				$('.stockReportByPeriod-endDate').removeClass('hasDatepicker').val(this.startDate);;

			var startDateSetting = {
					autoSize: false,
					dateFormat: 'yy-mm-dd',
					changeMonth: true,
					changeYear: true
				};
				QuestCMS.Utils.addDatepicker({placeholder: '.stockReportByPeriod-startDate', self: this, setting: startDateSetting});

				var endDateSetting = {
					autoSize: false,
					dateFormat: 'yy-mm-dd',
					minDate: this.startDate,
					changeMonth: true,
					changeYear: true
				};

				QuestCMS.Utils.addDatepicker({placeholder: '.stockReportByPeriod-endDate', self: this, setting: endDateSetting});
			}
    });

		var ModuleTransactionReportItemView = Backbone.Marionette.ItemView.extend({
		  template: _.template(tplTransactionReportItemView),
			onRender: function(){
				$("#transactionReport-branch", this.el).html(QuestCMS.Utils.addBranchList(false));
			},
			onShow: function(){
			var today = new Date();
			this.today = today.toDateFormat('yyyy-MM-dd');
			this.showDatePicker();

					$('.transactionReport-startDate').val(this.today);
					$('.transactionReport-endDate').val(this.today).val(this.startDate);
			},
			events: {
				'submit'																: 'exportTransactionReport',
				'reset'																	:'reset',
				'change .transactionReport-startDate'	: 'showDatePicker'
			},
			reset: function(e){
				e.preventDefault();
			},
			exportTransactionReport: function(e){
				e.preventDefault();
				var dateFrom = $('.transactionReport-startDate').val();
				var dateTo = $('.transactionReport-endDate').val();
				var type = $('#transactionReport-type').val();
				var branch = $('#transactionReport-branch').val();
				transactionReport({dateFrom: dateFrom, dateTo: dateTo, type: type, branch: branch});
			},
			showDatePicker: function(){
				this.startDate = $('.transactionReport-startDate').val() || this.today;
				this.endDate = $('.transactionReport-endDate').val() || this.today;

				$('.transactionReport-startDate').removeClass('hasDatepicker');
				$('.transactionReport-endDate').removeClass('hasDatepicker').val(this.startDate);

				var startDateSetting = {
					autoSize: false,
					dateFormat: 'yy-mm-dd',
					changeMonth: true,
					changeYear: true
				};
				QuestCMS.Utils.addDatepicker({placeholder: '.transactionReport-startDate', self: this, setting: startDateSetting});

				var endDateSetting = {
					autoSize: false,
					dateFormat: 'yy-mm-dd',
					minDate: this.startDate,
					changeMonth: true,
					changeYear: true
				};

				QuestCMS.Utils.addDatepicker({placeholder: '.transactionReport-endDate', self: this, setting: endDateSetting});
			}
    });

		var ModuleVendorListReportItemView = Backbone.Marionette.ItemView.extend({
		  template: _.template(tplVendorListReportItemView),
			onShow: function(){
			},
			events: {
				'submit'		: 'exportVendorListReport',
				'reset'															:'reset'
			},
			reset: function(e){
				e.preventDefault();
			},
			exportVendorListReport: function(e){
				e.preventDefault();
				var vendorService = $("#vendorListReport-vendorService").val();
				vendorListReport({vendorService: vendorService});
			}
    });

		var ModuleVendorReportItemView = Backbone.Marionette.ItemView.extend({
			tagName: 'tr',
		  template: _.template(tplVendorReportItemView),
			onShow: function(){
				this.vendorService = this.model.getContract().service;
				$('.service', this.el).html(QuestCMS.l(this.vendorService));
			},
			events: {
        'click .adminReport' : 'adminReport',
        'click .vendorReport' : 'vendorReport'
      },
			adminReport: function(){
				adminReport( {id: this.model.getId(), dateFrom: $('.vendorReport-startDate').val(), dateTo: $('.vendorReport-endDate').val()} )
			},
			vendorReport: function(){
				vendorReport( {id: this.model.getId(), vendorService: this.vendorService, dateFrom: $('.vendorReport-startDate').val(), dateTo: $('.vendorReport-endDate').val()} )
			}
    });



		/*
 * Default Backbone CompositeView
 * template: underscore import the template
 * appendHtml: default function to construct the composite view by adding up the item views
 * onRender: function will be executed after the view is rendered. Suitable to add some jQuery codes here to further modified the DOM
 */

    var ModuleVendorReportCompositeView = Backbone.Marionette.CompositeView.extend({
			initialize: function(){
				this.totalCount = this.options.totalCount;
			},
      itemView: ModuleVendorReportItemView,
      template: _.template(tplVendorReportCompositeView),
      appendHtml: function (collectionView, itemView, index) {
        collectionView.$(".questcms-vendorsReport").append(itemView.el);
      },
			onShow: function(){
				var today = new Date();
				this.today = today.yyyymmdd();

				if (!searchTerms.dateFrom && !searchTerms.dateTo) {
					var dateRange = new Date().wholeMonth(this.today);
					searchTerms.dateFrom = dateRange.from.toDateFormat('yyyy-MM-dd');
					searchTerms.dateTo = dateRange.to.toDateFormat('yyyy-MM-dd');
				}

				$('.vendorReport-startDate').val(searchTerms.dateFrom);
				$('.vendorReport-endDate').val(searchTerms.dateTo);
				this.showDatePicker();

				$("#vendorReportTable").tablesorter({
					theme: 'default',
					widthFixed: true,
					widgets: ['zebra']
				}).tablesorterPager({
					container: $("#pager"),
					page: 0,
					size: 20,
					output: '{startRow} to {endRow} ({totalRows})'
				});
				this.showFilterItemCount();
			},
			events: {
        'submit' : 'submit',
				'change .vendorReport-startDate'		: 'showDatePicker'
      },
			showFilterItemCount: function () {
        if (this.totalCount) {
            $(".filter_count", this.el).html(' - ' + this.totalCount);
        }
      },
			submit: function(e){
				e.preventDefault();
				searchTerms.dateFrom = $('.vendorReport-startDate').val();
				searchTerms.dateTo = $('.vendorReport-endDate').val();
				searchTerms.code = $('.vendorReport-code').val() || '';

				displayAccountingReport();
			},
			showDatePicker: function(){
				this.startDate = $('.vendorReport-startDate').val() || this.today;
				this.endDate = $('.vendorReport-endDate').val() || this.today;

				$('.vendorReport-startDate').removeClass('hasDatepicker');
				$('.vendorReport-endDate').removeClass('hasDatepicker');

				var startDateSetting = {
					autoSize: false,
					dateFormat: 'yy-mm-dd',
					changeMonth: true,
					changeYear: true
				};
				QuestCMS.Utils.addDatepicker({placeholder: '.vendorReport-startDate', self: this, setting: startDateSetting});

				var endDateSetting = {
					autoSize: false,
					dateFormat: 'yy-mm-dd',
					minDate: this.startDate,
					changeMonth: true,
					changeYear: true
				};

				QuestCMS.Utils.addDatepicker({placeholder: '.vendorReport-endDate', self: this, setting: endDateSetting});
			}
    });

    var ModuleAccountingCompositeView = Backbone.Marionette.CompositeView.extend({
		  template: _.template(tplAccountingCompositeView),
			onShow: function(){
        var rm = new Marionette.RegionManager();
        AccountingRegion = rm.addRegions({
					allVendorRecord		:	"#allVendorRecord",
					vendorReport			: "#vendorReport"
        });
			}
    });

    var ModuleFrontdeskCompositeView = Backbone.Marionette.CompositeView.extend({
		  template: _.template(tplFrontdeskCompositeView),
			onShow: function(){
        var rm = new Marionette.RegionManager();
        FrontdeskRegion = rm.addRegions({
          transactionReport					: "#transactionReport",
          sentGiftReport						: "#sentGiftReport",
          memberTranscationReport		: "#memberTranscationReport",
					appointmentReport					: "#appointmentReport"
        });
			}
    });

    var ModuleStockCompositeView = Backbone.Marionette.CompositeView.extend({
		  template: _.template(tplStockCompositeView),
			onShow: function(){
        var rm = new Marionette.RegionManager();
        StockRegion = rm.addRegions({
          stockTakeReport					: "#stockTakeReport",
          vendorListReport					: "#vendorListReport",
          stockReportByPeriod					: "#stockReportByPeriod",
          stockReportByItem		: "#stockReportByItem"
        });
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


    /*
     * the default function to run when user type in a URL to trigger this module
     *
     * @param {String} alias        the querystring after the # key in URL
     */
    var resolve = function (alias) {
      var page = 1;
      QuestCMS.Cookie.save({alias: alias, page: page});
      display({alias: alias, page: page});
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
      showView(options);
    };

    var exportReport = function (options) {
      options = options || {};

      if (options.url) {
        window.open(options.url,'_blank');
      }
    };

    var adminReport = function (options) {
			if (options.id && options.dateFrom && options.dateTo){
        var url = QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType'] + "?action=exportUserByVendorForAdmin&filename=vendorReportForAdmin&id=" + options.id + "&dateFrom=" + options.dateFrom + "&dateTo=" + options.dateTo;
	      exportReport({url: url});
			}
    };

    var vendorReport = function (options) {
			if (options.id && options.dateFrom && options.dateTo){
        var url = QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType'] + "?action=exportUserByVendorForVendor&filename=vendorReportForVendoor&id=" + options.id + "&vendorService=" + options.vendorService + "&dateFrom=" + options.dateFrom + "&dateTo=" + options.dateTo;
	      exportReport({url: url});
			}
    };

    var vendorsApplicationReport = function (options) {
			if (options.dateFrom){
        var url = QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType'] + "?action=exportVendorsApplication&filename=vendorsApplicationReport&dateFrom=" + options.dateFrom + "&dateTo=" + options.dateTo;
	      exportReport({url: url});
			}
    };

    var appointmentReport = function (options) {
			if (options.dateFrom){
        var url = QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType'] + "?action=exportTodayAppointments&filename=appointment&dateFrom=" + options.dateFrom  + "&dateTo=" + options.dateTo + "&branch=" + options.branch;
	      exportReport({url: url});
			}
    };

    var allVendorRecord = function (options) {
			if (options.dateFrom){
        var url = QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType'] + "?action=exportAllVendorRecord&filename=allVendorRecord&dateFrom=" + options.dateFrom  + "&dateTo=" + options.dateTo + "&branch=" + options.branch;
	      exportReport({url: url});
			}
    };

    var memberTranscationReport = function (options) {
			if (options.userId){
        var url = QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType'] + "?action=exportMemberTransactionReport&filename=memberTranscationReport&userId=" + options.userId + "&date=" + options.date;
	      exportReport({url: url});
			}
    };

    var sentGiftReport = function (options) {

			if (options.dateFrom){
        var url = QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType'] + "?action=exportSoldItemDaily&filename=giftReport&dateFrom=" + options.dateFrom  + "&dateTo=" + options.dateTo + "&vendorService=" + options.vendorService;
	      exportReport({url: url});
			}
    };

    var stockTakeReport = function (options) {

			var url = QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType'] + "?action=exportAllActiveItemsQuantity&filename=stockTakeReport&branch=" + options.branch;
			exportReport({url: url});
    };

    var stockByItemReport = function (options) {

			if (options.itemId){
        var url = QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType'] + "?action=exportStockRecordByItem&filename=stockByItemReport&itemId=" + options.itemId + "&branch=" + options.branch + "&stockType=" + options.stockType;
	      exportReport({url: url});
			}
    };


		var stockByDateReport = function (options) {

			if (options.dateFrom){
        var url = QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType'] + "?action=exportStockRecordByDate&filename=stockBydateReport&dateFrom=" + options.dateFrom  + "&dateTo=" + options.dateTo + "&stockType=" + options.stockType;
	      exportReport({url: url});
			}
    };

    var transactionReport = function (options) {

			if (options.dateFrom && options.type){
        var url = QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType'] + "?action=exportTransactionRecord&filename=transactionReport&dateFrom=" + options.dateFrom  + "&dateTo=" + options.dateTo + "&type=" + options.type + "&branch=" + options.branch;
	      exportReport({url: url});
			}
    };

    var vendorListReport = function (options) {

        var url = QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType'] + "?action=exportVendorsList&filename=vendorsList&vendorService=" + options.vendorService;
	      exportReport({url: url});
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
          deferred.resolve(data);
        });

        var data = {};
        if (options) {
          data = options;
        }
        cachedCollection.fetch({data: data});
        deferred.done(function () {
          callback(null, cachedCollection);
        });
      }
    };



    /*
     * Actual function to display the view
     * call Fetch to get the collection first
     * and then call another function to show the view
     *
     * @param {Object} options      alias (String) URL alias (after the # key)
     */
    var displayPDF = function (options) {
      options = options || {};
			var model =  new ModuleItem();
			QuestCMS.Utils.showAlert('Info', 'Please wait a minute. Loading...');

      var memberEasyVendors = [];
      var infoEasyVendors = [];

      var vendors = options.collection.models;
      vendors.forEach(function(array){
        var contract = array.getContract();

        if(contract.service == 'Member Easy'){
          memberEasyVendors.push(array.getChiBrandName());
        } else
          infoEasyVendors.push(array.getChiBrandName());
      });


      var view = new ModulePDFTemplate({vendors: options.collection, member: options.member});
      // var PDFInfo = {
        // date: new Date().toDateFormat('yyyy-MM-dd'),
        // time: new Date().toDateFormat('HH:mm'),
        // branch: QuestCMS.l(QuestCMS.Cookie.get('branch')),
        // memberEasyVendors: memberEasyVendors,
        // infoEasyVendors: infoEasyVendors
      // };
      model.save({action: 'generatePDF', template: view.render().el.innerHTML, filename: 'giftList'}, {
        success: function (model) {
          var url = QuestCMS.Utils.setAPIUrl() + '/file?action=getFileByFullPath&filename=' + model.get('filename') + '&fullFilepath=' + model.get('fullFilepath');
          window.open(url, '_blank');
        },
        error: function () {
          QuestCMS.Utils.showAlert('Error', "Can't create PDF.");
        }
      });
			 // QuestCMS.layout[configs[module]['region']].show(view);
    };

		var displayAccountingReport = function (options) {
			Backbone.history.navigate('export/accountingReport');
      options = options || {};
      options.date = options.date || new Date().toDateFormat('yyyy-MM-dd');
			var model =  new ModuleItem();

			var view = new ModuleAccountingCompositeView({ model: model});
			QuestCMS.layout[configs[module]['region']].show(view);

			var allVendorRecordview = new ModuleAllVendorRecordItemView({ model: model});
			AccountingRegion.allVendorRecord.show(allVendorRecordview);

			QuestCMS.vent.trigger('vendor:getVendorsCollection', {universalSearch: searchTerms.code}, function(vendors){
				var vendorReportview = new ModuleVendorReportCompositeView({ collection: vendors, totalCount: vendors.length});
				AccountingRegion.vendorReport.show(vendorReportview);
			});
    };

		var displayVendorsApplicationReport = function (options) {
			Backbone.history.navigate('export/applicationReport');
      options = options || {};
      options.date = options.date || new Date().toDateFormat('yyyy-MM-dd');
			var model =  new ModuleItem();

			var view = new ModuleVendorsApplicationReportItemView({ model: model});
			QuestCMS.layout[configs[module]['region']].show(view);
    };

		var displayFrontDeskReport = function (options) {
      options = options || {};
      options.date = options.date || new Date().toDateFormat('yyyy-MM-dd');
			var model =  new ModuleItem();

			var view = new ModuleFrontdeskCompositeView({ model: model});
			QuestCMS.layout[configs[module]['region']].show(view);

			var transactionReportview = new ModuleTransactionReportItemView({model: model});
			FrontdeskRegion.transactionReport.show(transactionReportview);

			var sentGiftReportView = new ModuleSentGiftReportItemView({model: model});
			FrontdeskRegion.sentGiftReport.show(sentGiftReportView);
			if(options.searchTerms){
				QuestCMS.vent.trigger("appointment:getModuleViewAllAppointmentCompositeView", {searchTerms: options.searchTerms, callback: function(compositeView){
					Backbone.history.navigate('administration');
					Backbone.history.navigate('export/frontdeskReport');
					FrontdeskRegion.memberTranscationReport.show(compositeView);
				}
				});
			} else {
				QuestCMS.vent.trigger("appointment:getModuleViewAllAppointmentCompositeView", {callback: function(compositeView){
					Backbone.history.navigate('administration');
					Backbone.history.navigate('export/frontdeskReport');
					FrontdeskRegion.memberTranscationReport.show(compositeView);
				}
				});
			}
			var appointmentReportView = new ModuleAppointmentReportItemView({model: model});
			FrontdeskRegion.appointmentReport.show(appointmentReportView);
    };

		var displayStockReport = function (options) {
      options = options || {};
			var model =  new ModuleItem();

			var view = new ModuleStockCompositeView({ model: model});
			QuestCMS.layout[configs[module]['region']].show(view);

			var stockTakeReportview = new ModuleStockTakeReportItemView({model: model});
			StockRegion.stockTakeReport.show(stockTakeReportview);

			var vendorListReportView = new ModuleVendorListReportItemView({model: model});
			StockRegion.vendorListReport.show(vendorListReportView);

			var stockReportByPeriodView = new ModuleStockReportByPeriodItemView({model: model});
			StockRegion.stockReportByPeriod.show(stockReportByPeriodView);

			QuestCMS.vent.trigger("item:getModuleViewAllItemsByVendorCompositeView", {universalSearch: options.universalSearch, branch: options.branch, stockType: options.stockType}, function(compositeView){
				Backbone.history.navigate('administration');
				Backbone.history.navigate('export/stockReport');
				StockRegion.stockReportByItem.show(compositeView);
			});
		};

		var showView = function (options) {
      options = options || {};
      currentPage = options.page || currentPage;

			var model = new ModuleItem();
      var view = new ModuleListView({ model: model });
      QuestCMS.layout[configs[module]['region']].show(view);
    };

    /*
     * Function being trigger when the view is closed
     */
    var viewOnClose = function () {
      /* do something such as close the sidebar view */
      QuestCMS.layout.toolBoxRegion.close();
    };



/*********************************************
 * Return
 *********************************************/
    return Export;

});
