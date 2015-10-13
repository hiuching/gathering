/*********************************************
 * Appointment module
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
	"async",
  "moment",
  "fullcalendar",
  "text!tpl/appointment.html"
],


/*
 * Objects to store the marionette and the HTML template file
 */
function (Marionette, ladda, async, moment, fullcalendar, templateString) {


/*********************************************
 * Templates
 *********************************************/

/*
 * Read the corresponding segment of HTML code into template variables
 */
    var tplViewAllAppointmentCompositeView = $('#ViewAllAppointmentCompositeView', '<div>' + templateString + '</div>').html();
    var tplViewAllAppointmentItemView = $('#ViewAllAppointmentItemView', '<div>' + templateString + '</div>').html();
    var tplReviewSubmittedFiles = $('#ReviewSubmittedFiles', '<div>' + templateString + '</div>').html();
    var tplViewMonthBookingAppointmentItemView = $('#ViewMonthBookingAppointmentItemView', '<div>' + templateString + '</div>').html();

    var tplAppointmentHistoryCompositeView = $('#AppointmentHistoryCompositeView', '<div>' + templateString + '</div>').html();
    var tplAppointmentHistoryItemView = $('#AppointmentHistoryItemView', '<div>' + templateString + '</div>').html();
    var tplMakeAppointmentView = $('#MakeAppointmentView', '<div>' + templateString + '</div>').html();

/*********************************************
 * Module scope variables
 *********************************************/

/*
 * Define the module-wide variables here
 * at least 2 variables: module and configs.
 */
    var module = "appointment"; // lowercase only
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
    var Appointment = function () {
      var self = this;
      configs[module] = {             // module specified config options
        isCachedCollection: false,
        isOnAdminList: false,         // is shown on the admin menu list
        isSearchable: false,          // is this module data searchable
        itemPerRow: 1,
        numOfRow: 5,
        pagePerSection: 10,
        showPaginator: false,
				timeslotLimit: 1,
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

      QuestCMS.vent.on(module + ":displayViewAllAppointmentCompositeView", function (options) {
        displayViewAllAppointmentCompositeView(options);
      });

      QuestCMS.vent.on(module + ":displayReviewAppointmentForm", function (options) {
        displayReviewAppointmentForm(options);
      });

      QuestCMS.vent.on(module + ":findAllAppointmentsOnToday", function (options) {
        findAllAppointmentsOnToday(options);
      });

      QuestCMS.vent.on(module + ":findAllAppointmentsOnThisMonth", function (options) {
        findAllAppointmentsOnThisMonth(options);
      });

      QuestCMS.vent.on(module + ":getTodayAppointments", function (callback) {
        getTodayAppointments(callback);
      });

      QuestCMS.vent.on(module + ":showAppointmentHistory", function (options) {
        showAppointmentHistory(options);
      });

      QuestCMS.vent.on(module + ":makeAppointment", function (options) {
        showMakeAppointmentView(options);
      });

      QuestCMS.vent.on(module + ":getModuleViewAllAppointmentCompositeView", function (options) {
			options = options || {};
			// if(searchTerms.date === undefined){
				// searchTerms.date = new Date().toDateFormat('yyyy-MM-dd');
			// }
				if (searchTerms){
					fetch(searchTerms, function(err, collection){
						if(err){
							QuestCMS.utils.showAlert('Error', 'No Appointment');
							var  compositeView = new ModuleViewAllAppointmentCompositeView({collection: new ModuleCollection(), totalCount: collection.length, fromReport: true, itemViewOptions: {fromReport: true}});
						} else {
							// var collection = new ModuleCollection(collection.models);
							var  compositeView = new ModuleViewAllAppointmentCompositeView({collection: collection, totalCount: collection.length, fromReport: true, itemViewOptions: {fromReport: true}});
							options.callback(compositeView);
						}
					});
				} else {
					var compositeView = new ModuleViewAllAppointmentCompositeView({collection: new ModuleCollection(), fromReport: true, itemViewOptions: {fromReport: true}});
					options.callback(compositeView);
				}
      });

      QuestCMS.vent.on(module + ":URLController", function (alias) {
        URLController(alias);
      });
    };


/*********************************************
 * URL Controller
 *********************************************/
  var URLController = function (alias) {
    QuestCMS.Utils.setSiteTitle(QuestCMS.l('Appointment'));
		var urlParas = alias.split('/');
		var decision = (urlParas[1]) ? urlParas[1] : '';

		if (urlParas) {
			if (decision == 'viewTodayAppointment') {
        findAllAppointmentsOnToday();
      } else if (decision == 'viewMonthAppointment') {
        findAllAppointmentsOnThisMonth();
			} else {
				findAllAppointmentsOnToday();
			}
		} else {
				findAllAppointmentsOnToday();
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
				var today = new Date();
				var startDate = new Date();
				startDate.setDate(today.getDate() + 3);

				return {
					_id: null,
          date: startDate.toDateFormat('yyyy-MM-dd'),
          time: '',
          userId: null,
          arrived: false,
          reviewing: false,
					status: 'pending'
				};
			},
			getDate: function () {
				return this.get('date') || '';
			},
			getId: function () {
				return this.get('_id');
			},
      isReviewing: function () {
				return this.get('reviewing') || false;
      },
			getStatus: function () {
				return this.get('status') || '';
			},
			getTime: function () {
				return this.get('time') || '';
			},
			getUserId: function () {
				return this.get('userId');
			},
			bookAppointment: function (options) {
				options.userId = options.user.getId() || QuestCMS.user.getId();
				this.set(options, {silent: true});
			},
			cancelAppointment: function () {
				return this.set({status: 'cancelled', arrived: false, action: 'cancelAppointment'}, {silent: true});
			},
			changeAppointment: function () {
				return this.set({status: 'pending', arrived: false, action: 'changeAppointment'}, {silent: true});
			},
			confirmAppointment: function () {
				return this.set({status: 'confirmed', action: 'confirmAppointment'}, {silent: true});
			},
			finishedReviewing: function () {
				return this.set({reviewing: false}, {silent: true});
			},
			setReviewing: function () {
				return this.set({reviewing: true}, {silent: true});
			},
			toggleArrival: function () {
				var arrived = (this.isArrived()) ? false : true;
				return this.set({arrived: arrived}, {silent: true});
			},
			isArrived: function () {
				return this.get('arrived') || false;
			},
      isCancelled: function () {
				var status = this.getStatus();

        return (status.toLowerCase() == 'cancelled');
      },
      isConfirmed: function () {
				var status = this.getStatus();
        return (status.toLowerCase() == 'confirmed');
      },
			isExpired: function () {
				var appointmentDate = moment(this.getDate());
				var today = moment();

				return (today.diff(appointmentDate, 'days') > 0);
			},
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
      comparator: function (currentData, nextData) {
				if (currentData.get('date') > nextData.get('date')) return -1;
				if (nextData.get('date') > currentData.get('date')) return 1;
        return 0;
      },
      filterAlias: function (alias) {
        return new ModuleCollection(this.filter(function (data) {
          return data.get("alias") == alias;
        }));
      },
      filterId: function (id) {
        return new ModuleCollection(this.filter(function (data) {
          return data.get("id") == id;
        }));
      },
      filterLanguage: function (language) {
        return new ModuleCollection(this.filter(function (data) {
          return data.get("language") == language;
        }));
      },
      filterText: function (text) {
        var regexp = new RegExp(text, "i");
        return new ModuleCollection(this.filter(function (data) {
          return (data.get("content").match(regexp) || data.get("title").match(regexp));
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
    /* Book Appointment Page */
    var ModuleViewAllAppointmentItemView = Backbone.Marionette.ItemView.extend({
			tagName: 'tr',
			className: 'appointment-detail',
      template: _.template(tplViewAllAppointmentItemView),
      onBeforeRender: function () {
        var self = this;
        var user = this.model.getUserId();
        QuestCMS.vent.trigger('user:init', {json: user, callback: function (err, user) {
          if (err) {
            QuestCMS.Utils.showAlert('Error', 'no user found');
            // stop or destroy this view
          } else {
            self.user = user;
            self.isUserVerified = user.isVerified();
          }
        }});
      },
      onRender: function () {
        this.setupButtons();
        // verified column
        if (this.isUserVerified) {
          $('.appointment-isVerified', this.el).removeClass('glyphicon-remove').addClass('glyphicon-ok');
        } else {
          $('.appointment-isVerified', this.el).removeClass('glyphicon-ok').addClass('glyphicon-remove');
        }
				$('#noOfLabel', this.el).val('10');
				this.fromReport = this.options.fromReport;
				if(this.fromReport){
					$('.information', this.el).addClass('hidden');
					$('.task', this.el).addClass('hidden');
					$('.printLabel-td', this.el).addClass('hidden');
					$('.export', this.el).removeClass('hidden');

				}
      },
      events: {
				'click .appointment-details' 				: 'showDetails',
				'click .appointment-vendors' 				: 'showVendorList',
				'click .appointment-arrival' 				: 'toggleArrival',
				'click .appointment-reviewFile' 		: 'reviewFile',
				'click .appointment-confirm' 				: 'confirm',
				'click .appointment-delete'  				: 'cancel',
				'click .printLabel' 				 				: 'noOfLabel',
				'keydown #noOfLabel'				 				: 'noOfLabel',
				'click .appointment-export'	 				: 'exportAppointment'
      },
			noOfLabel: function (e) {
				if (e.keyCode == 13 || $(e.currentTarget).hasClass('printLabel')){
						var noOfLabel = $("#noOfLabel", this.el).val();
					if(noOfLabel <= 100){
						if(noOfLabel !== ''){
							var member = this.model.getUserId();
							QuestCMS.vent.trigger('user:printLabel', {id: member._id, noOfLabel: noOfLabel});
						}
					} else {
						QuestCMS.Utils.showAlert('Error', 'The maximum amount of label printing is 100');
					}
				}
			},
			reviewFile: function () {
				var user = this.model.getUserId();
				var userFiles = user.files || [];

				if (userFiles.length == 1) {
					userFile = userFiles[0];

					var conditions = {
						filepath: userFile.fullFilepath,
						filename: userFile.filename,
						amazonUrl: userFile.amazonUrl,
						userId: userFile._id
					};
					QuestCMS.Utils.fetchFileToOpen(conditions);
				} else if (userFiles.length > 1) {
					var view = new ModuleReviewSubmittedFiles({submittedFiles: userFiles, userId: user._id, username: user.firstname + ' ' + user.lastName});
					QuestCMS.modal.show(view);
				} else {
					QuestCMS.Utils.showAlert('Info', "Haven't submitted files");
				}
			},
			exportAppointment: function(){
				var user = this.model.getUserId();
				var date = this.model.getDate();
				QuestCMS.vent.trigger('export:memberTranscationReport', {userId: user._id, date: date});
			},
      showDetails: function () {
				var self = this;

				function reRender (user) {
					self.model.set({userId: user}, {silent: true});
					self.render();
				}

        showAppointmentDetails({model: this.user, afterEdit: reRender});
      },
      showVendorList: function () {
        showVendorList({model: this.user});
      },
			toggleArrival: function () {
        this.model.toggleArrival();
        this.saveAppointment('Successful', 'There are some errors during update arrival.');
			},
      confirm: function () {
        this.model.confirmAppointment();
        this.saveAppointment('Confirmed', 'There are some errors during comfirm the appointment.');
      },
			cancel: function () {
        this.model.cancelAppointment();
        this.saveAppointment('Cancelled', 'There are some errors during cancel the appointment.');
			},
      saveAppointment: function (successMsg, errorMsg, conditions) {
        var self = this;
				conditions = conditions || {};
        this.model.save(conditions, {
          success: function () {
            QuestCMS.Utils.showAlert('Success', successMsg);
            self.render();
          },
          error: function (model, err) {
            QuestCMS.Utils.showAlert('Error', errorMsg);
          }
        });
      },
      setupButtons: function () {
				if (this.model.isConfirmed()) {
					$('.appointment-confirm', this.el).text(QuestCMS.l("Confirmation Email"));
					$('.appointment-confirm', this.el).removeClass('btn-success').addClass('btn-warning');
				}

				if (this.model.isArrived()) {
					$('.appointment-arrival', this.el).html(QuestCMS.l("Unarrival")).removeClass('btn-success').addClass('btn-danger');
				} else {
					$('.appointment-arrival', this.el).html(QuestCMS.l("Arrival")).removeClass('btn-danger').addClass('btn-success');
				}
      },
			perpareReportPage: function(){
				$('.information').addClass('hidden');
				$('.task').addClass('hidden');
				$('.PrintLabel').addClass('hidden');

			}
    });


    var ModuleReviewSubmittedFiles = Backbone.Marionette.ItemView.extend({
			initialize: function () {
				this.submittedFiles = this.options.submittedFiles;
				this.userId = this.options.userId;
			},
			template: _.template(tplReviewSubmittedFiles),
			serializeData: function () {
				return {
					username: this.options.username
				};
			},
			onShow: function () {
				this.showUploadedFiles();
			},
			events: {
				'click .filepath': 'viewFile'
			},
			viewFile: function (e) {
				e.preventDefault();

				var conditions = {
					filepath: $(e.currentTarget).data('value'),
  				amazonUrl: $(e.currentTarget).attr('data-amazonUrl'),
					filename: $(e.currentTarget).text(),
          userId: this.userId
				};

				QuestCMS.Utils.fetchFileToOpen(conditions);

			},
			showUploadedFiles: function () {
				var self = this;
				$('.submittedFiles', self.el).empty();
				var li = '';
				if (this.submittedFiles && this.submittedFiles.length > 0) {
					this.submittedFiles.forEach( function (submittedFile) {
						var filename = submittedFile.filename;
						var path = submittedFile.fullFilepath;
            var amazonUrl = uploadFile.amazonUrl || '';

						li = '<li><a href="#" class="filepath" data-amazonUrl="' + amazonUrl + '"  data-value="data/memberFiles/' + self.userId+ '/' + filename + '">' + filename + '</a></li>';
						$('.submittedFiles', self.el).append(li);
					});
				}
			}
		});


    var ModuleMonthBookingItemView = Backbone.Marionette.ItemView.extend({
  		initialize: function () {
  			Backbone.history.navigate('appointment/viewMonthAppointment');
  		},
  		template: _.template(tplViewMonthBookingAppointmentItemView),
  		onShow: function(){
  			var self = this;
  			var now = new Date();
  			this.yyyymm = now.yyyymm();

  			this.getAppointmentsAndShowCalendar({month: this.yyyymm});

  		},
  		events:{
  		'click .fc-button'			: 'change'
  		},
  		change: function(){
  			var moment = $('#MonthBookingAppointment').fullCalendar('getDate');
  			moment = new Date(moment).yyyymm();
  			this.getAppointmentsByMonthAndShowCalendar({month: moment});
  		},
  		showDayAppointment: function(date){
  			searchTerms = {
  				date: date
  			};
        filter(searchTerms);
  		},
  		getAppointmentsAndShowCalendar: function(options){
  			var self = this;
  			options = options || {};
  			options.month = options.month || this.yyyymm ;

  			var dateRange = new Date().wholeMonth(options.month + '01');
  			var dateFrom = dateRange.from;
  			var dateTo = dateRange.to;

  				$('#MonthBookingAppointment').fullCalendar({
  					header: {
  						right:  'prev,next'
  					},
  					dayClick: function(date, jsEvent, view) {
  						date = new Date(date);
  						date = date.toDateFormat('yyyy-MM-dd');
  						self.showDayAppointment(date);
  					},
  					eventClick: function(calEvent, jsEvent, view) {
  					var date = calEvent.start;
  						date = new Date(date);
  						date = date.toDateFormat('yyyy-MM-dd');
  						self.showDayAppointment(date);
  					}
  				});

  			this.getAppointmentsByMonthAndShowCalendar(options);
  		},
  		getAppointmentsByMonthAndShowCalendar: function(options){
  			var self = this;
  			options = options || {};
  			options.month = options.month || this.yyyymm ;

  			var dateRange = new Date().wholeMonth(options.month + '01');
  			var dateFrom = dateRange.from;
  			var dateTo = dateRange.to;

  			var showCalender = function (dailySettings) {
  				var events = [];
  				if(dailySettings.length > 0){
  					dailySettings.each(function (dailySetting) {
  						$('#MonthBookingAppointment').fullCalendar('renderEvent', {start: dailySetting.getDate(),  title: dailySetting.getOpeningTime() + ' ~ ' + dailySetting.getClosingTime() + ' | ' + dailySetting.getNumOfBookedAppointments() + ' / ' + dailySetting.getNumOfAppointment(), allDay: true});
  					});
  				}
  			};

  			$('#MonthBookingAppointment').fullCalendar( 'removeEvents');
  			QuestCMS.vent.trigger('dailySetting:findDailySettingsByDateRange', {dateFrom: dateFrom, dateTo: dateTo, callback: showCalender});
  		}

  	});



  	var AppointmentHistoryItemView = Backbone.Marionette.ItemView.extend({
  		template: _.template(tplAppointmentHistoryItemView),
  		tagName: 'tr',
  		onRender: function() {
  			this.prepareForm();
  			$('.bookedTime', this.el).timepicker();
  		},
  		events: {
  			'change .bookedDate'						: 'getNewTimeRange',
  			'click .appointment-change'     : 'changeAppointment',
  			'click .appointment-save'    		: 'saveAppointment',
  			'click .appointment-cancel'    	: 'cancelEdit',
  			'click .appointment-delete' 		: 'deleteAppointment'
  		},
  		getNewTimeRange: function(){
  			var self = this;

  			showBookingAppointmentTimepicker({
  				self: this,
  				timepickerPlaceholder: '.bookedTime',
  				bookingDate: $('.bookedDate', this.el).val()
  			}, function () {
  				$('.bookedTime', this.el).val("");
  			});
  		},
  		changeAppointment: function(e) {
  			e.preventDefault();
  			var self = this;
  			async.series([
  				function (callback) {
  					showBookingAppointmentDatepicker({
  						self: self,
  						datepickerPlaceholder: '.bookedDate',
  						datepickerDisplayDate: self.model.getDate()
  					}, callback);
  				},
  				function (callback) {
  					showBookingAppointmentTimepicker({
  						self: self,
  						timepickerPlaceholder: '.bookedTime',
  						bookingDate: $('.bookedDate', self.el).val()
  					}, callback);
  				}
  			], function (err, results) {
  				$('.appointment-save', self.el).show();
  				$('.appointment-cancel', self.el).show();
  				$('.appointment-change', self.el).hide();
  				$('.appointment-delete', self.el).hide();
  				var tr = $(e.currentTarget).closest('tr');
  				tr.find('input, select').removeClass('hidden');
  				tr.find('label').addClass('hidden');
  			});
  		},
  		cancelEdit: function (e) {
  			$('.appointment-save', this.el).hide();
  			$('.appointment-cancel', this.el).hide();
  			$('.appointment-change', this.el).show();
  			$('.appointment-delete', this.el).show();
  			var tr = $(e.currentTarget).closest('tr');
  			tr.find('input').addClass('hidden');
  			tr.find('label').removeClass('hidden');
  		},
  		saveAppointment: function(e) {
  			e.preventDefault();
  			var self = this,
  					data = {};

  			var tr = $(e.currentTarget).closest('tr');
  			tr.find('input').each(function () {
  				var name = $(this).prop('name');
  				data[name] = $(this).val();
  			});

  			if (data.date && data.time) {
  				this.model.set(data, {silent: true});
  				this.model.changeAppointment();
  				this.model.save({}, {
  					success: function (model) {
  						QuestCMS.Utils.showAlert('Success', 'Updated Successful.');
  						$('.appointment-save', self.el).hide();
  						$('.appointment-change', self.el).show();
  						tr.find('input').addClass('hidden');
  						tr.find('label').removeClass('hidden');
  						self.render();
  					},
  					error: function (model, err) {
  						QuestCMS.Utils.showAlert('Error', "Haven't update appointment.");
  					}
  				});
  			} else {
  				QuestCMS.Utils.showAlert('info', 'Missing Date or Time');
  			}
  		},
  		deleteAppointment : function (e) {
  			e.preventDefault();
  			var self = this;

  			this.model.cancelAppointment();
  			this.model.save({skipSendEmail: true},{
  				success: function (model) {
  					QuestCMS.Utils.showAlert('Success', 'Booking Cancelled.');
  					self.render();
  				},
  				error: function (model, err) {
  					var errmsg = "Fail to Cancel the booking";
  					if (err.responseText !== '') {
  							errmsg = err.responseText;
  					}
  					QuestCMS.Utils.showAlert('Error', errmsg);
  				}
  			});
  		},
  		prepareForm: function () {
  			$('.appointment-save', this.el).hide();
  			$('.appointment-change', this.el).hide();
  			$('.appointment-processing', this.el).hide();
  			$('.appointment-delete', this.el).hide();
  			$('.appointment-cancel', this.el).hide();

  			if (!this.model.isArrived() && !this.model.isExpired() && !this.model.isCancelled()) {
  				if (this.model.isReviewing()) {
  					$('.appointment-processing', this.el).show();
  				} else {
  					$('.appointment-change', this.el).show();
  					$('.appointment-delete', this.el).show();
  				}
  			}
  		}
  	});


  	var MakeAppointmentView = Backbone.Marionette.ItemView.extend({
  		initialize: function (options) {
  			Backbone.history.navigate('appointment/booking');
        this.user = this.options.user;
  			this.datepickerDisplayDate;
  			this.dailySettings = [];
  		},
  		template: _.template(tplMakeAppointmentView),
  		onShow: function () {
  			var self = this;

        $('#DisplayUsername').text(this.user.getFullName() + ' - ');

  			$(document).scrollTop(0);
  			$("#branch", this.el).html(QuestCMS.Utils.addBranchList(false));
  			this.ladda = QuestCMS.Utils.createLadda('.ladda-button');

  			async.series([
  				function (callback) {
  					showBookingAppointmentDatepicker({
  						self: self,
  						datepickerPlaceholder: '.bookingDate',
  						datepickerDisplayDate: self.datepickerDisplayDate
  					}, callback);
  				},
  				function (callback) {
  					showBookingAppointmentTimepicker({
  						self: self,
  						timepickerPlaceholder: '.bookingTime',
  						bookingDate: $('.bookingDate', self.el).val()
  					}, callback);
  				}
  			], function (err, results) {
  				// console.log('Generated');
  			});
  		},
  		events: {
  			'change .bookingDate'				: 'getNewTimeRange',
  			'click .appointment-submit' : 'book',
  		},
  		getNewTimeRange: function(){
  			var self = this;

  			showBookingAppointmentTimepicker({
  				self: this,
  				timepickerPlaceholder: '.bookingTime',
  				bookingDate: $('.bookingDate', this.el).val()
  			});
  		},
  		book: function (e) {
  			e.preventDefault();
  			var self = this;
  			var formInputs = $("form").find('input');
  			$(".form-group").removeClass("has-error");

  			var booking = {
  				date: $('.bookingDate').val(),
  				time: $('.bookingTime').val(),
  				branch: $('#branch').val(),
          user: this.user
  			};

  			if (booking.date && booking.time && booking.branch) {
  				if (!self.ladda.isLoading()) {
  					self.ladda.start();

  					this.model.bookAppointment(booking);
  					this.model.save({}, {
  						success: function (model) {
  							self.ladda.stop();
  							cachedCollection.add(self.model);
                self.model = new ModuleItem();
  							QuestCMS.Utils.showAlert('Success', 'Booking Successful.', true);
  						},
  						error: function (model, err) {
  							self.ladda.stop();
  							var errmsg = "Haven't book the appointment.";
  							if (err.responseText !== '') {
  									errmsg = err.responseText;
  							}
  							QuestCMS.Utils.showAlert('Error', QuestCMS.l(errmsg), true);
  						}
  					});
  				}
  			} else {
  				var errTarget = '';
  				for (var i = 0; i < formInputs.length; i++) {
  					if (!formInputs[i].validity.valid) {
  						$(formInputs[i]).closest('.form-group').addClass("has-error");
  						errTarget += $(formInputs[i]).prop('name') + ', ';
  					}
  				}
  				errTarget = errTarget.substring(0, errTarget.length - 2);
  				QuestCMS.Utils.showAlert('Info', 'Missing ' + errTarget + '.', true);
  			}
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
  	var ModuleViewAllAppointmentCompositeView = Backbone.Marionette.CompositeView.extend({
      initialize: function () {
				Backbone.history.navigate('appointment/viewTodayAppointment');

        this.page = this.options.page;
        this.start = (this.page - 1) * pageSize ;
        this.end = this.page * pageSize;
				this.fromReport = this.options.fromReport || false;
				this.totalCount = this.options.totalCount;
      },
      itemView: ModuleViewAllAppointmentItemView,
      template: _.template(tplViewAllAppointmentCompositeView),
      appendHtml: function (collectionView, itemView, index) {
        // if ((this.start <= index) && (index < this.end)) {
          collectionView.$(".questcms-appointments").append(itemView.el);
        // }
      },
      onRender: function () {
        if (configs[module]['showPaginator']) {
          this.showPaginator();
        }
				$('[data-toggle="floatLabel"]', this.el).attr('data-value', '');
        $(document).scrollTop(0);
				$("#branch", this.el).html(QuestCMS.Utils.addBranchList(false));
      },
			onShow: function () {
				//$('#reviewAppointment', this.el).hide();
        var rm = new Marionette.RegionManager();
        newRegion = rm.addRegions({
          reviewAppointment: "#reviewAppointment"
        });

        this.showFilterItemCount();
        this.showTimepicker();
        this.showDatepicker();
				this.ladda = QuestCMS.Utils.createLadda('.submit-search');
        $('form', this.el).loadJSON(searchTerms);

				$("#AllAppointmentList").tablesorter({
					theme: 'default',
					widthFixed: true,
					widgets: ['zebra']
				}).tablesorterPager({
					container: $("#pager"),
					page: 0,
					size: 20,
					output: '{startRow} to {endRow} ({totalRows})'
				});

				if(this.fromReport){
					this.parpareForReport();
				}

			},
			events: {
				'reset'  														: 'reset',
				'submit' 														: 'submit',
				'keyup [data-toggle="floatLabel"]'	: 'floating',
				'change [data-toggle="floatLabel"]'	: 'floating'
				//'click .appointment-detailss'				: 'showUserDetail'
			},
			floating: function (e) {
				e.preventDefault();
				$(e.currentTarget).attr('data-value', $(e.currentTarget).val());
			},
      reset: function (e) {
        e.preventDefault();
        searchTerms = {};

        $('.bookingDate').val(new Date().toDateFormat('yyyy-MM-dd'));
      },
			submit: function(e) {
					e.preventDefault();
					var self = this;

					if (!self.ladda.isLoading()) {
						self.ladda.start();
						if(!this.fromReport){
							$('form.filter-form').find('input:not(".btn"),select').each(function(){
								var name = $(this).prop('name');
								searchTerms[name] = $(this).val();
							});

							for (var prop in searchTerms) {
								if (searchTerms[prop] == '' || !searchTerms[prop]) {
									delete searchTerms[prop];
								}
							}


							filter(searchTerms);
						} else {
							searchTerms = {
								date: $('.bookingDate').val(),
								startTime: $('.bookingStartTime').val(),
								bookingStartTime: $('.bookingEndTime').val(),
								HKID: $('.HKID').val(),
								status: $('#status').val()
							};
							for (var prop in searchTerms) {
								if (searchTerms[prop] == '' || !searchTerms[prop]) {
									delete searchTerms[prop];
								}
							}
							var options = {
								searchTerms: searchTerms
							};
							QuestCMS.vent.trigger('export:displayFrontDeskReport', options);

						}
					}
			},
      showPaginator: function () {
        this.totalCount = this.totalCount || 0;
        pageCount = Math.ceil(this.totalCount / pageSize );
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
        if (this.totalCount) {
            $(".filter_count", this.el).html(' - ' + this.totalCount);
        }
      },
			showTimepicker: function () {
				$('input.bookingStartTime').timepicker({
					timeFormat: 'h:i A',
					minTime: '00:00am',
					maxTime: '23:59pm',
					showDuration: false,
					step: 10,
					forceRoundTime: false,
					disableTimeRanges: [] //[[], []]
				});
				$('input.bookingEndTime').timepicker({
					timeFormat: 'h:i A',
					minTime: '00:00am',
					maxTime: '23:59pm',
					showDuration: false,
					step: 10,
					forceRoundTime: false,
					disableTimeRanges: [] //[[], []]
				});
			},
			showDatepicker: function () {
        var setting = {
          autoSize: false,
          dateFormat: 'yy-mm-dd',
					changeMonth: true,
					changeYear: true
          // minDate: new Date()
        };
				QuestCMS.Utils.addDatepicker({placeholder: 'input.bookingDate', self: this, setting: setting});
			},
			parpareForReport: function(){
				$('.viewAllAppointment').html(QuestCMS.l("Member ") + '' + QuestCMS.l("Transaction ") + '' + QuestCMS.l("Report"));
				$('.information').addClass('hidden');
				$('.task').addClass('hidden');
				$('.print').html(QuestCMS.l("Export"));
				$('.dailyAppointmentHeader').addClass('hidden');
			}
    });


    var AppointmentHistoryCompositeView = Backbone.Marionette.CompositeView.extend({
  		itemView: AppointmentHistoryItemView,
  		template: _.template(tplAppointmentHistoryCompositeView),
  		appendHtml: function (collectionView, itemView, index) {
  			collectionView.$(".questcms-appointmentHistory").append(itemView.el);
  		},
  		onShow: function () {
  			$("#myAppointmentList").tablesorter({
  				theme: 'default',
  				widthFixed: true,
  				widgets: ['zebra']
  			}).tablesorterPager({
  			container: $("#pager"),
  				page: 0,
  				size: 5,
  				output: '{startRow} to {endRow} ({totalRows})'
  			});
  		},
      collectionEvents: {
        'add'   : 'addedModel'
      },
      addedModel: function() {
        this.rerender();
      },
  		events: {
  			'click .refresh'						: 'refresh'
  		},
  		refresh: function(e) {
  			e.preventDefault();
  			this.rerender();
  		},
      rerender: function () {
        showAppointmentHistory({region: this.options.region});
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
      QuestCMS.Utils.setSiteTitle(QuestCMS.l('Appointment'));
      display({alias: alias, page: page});
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
      displayViewAllAppointmentCompositeView();
    };

		var findAllAppointmentsOnToday = function (options) {
			options = options || {};
			if ($.isEmptyObject(searchTerms)) {
				searchTerms.date = new Date().toDateFormat('yyyy-MM-dd');
			}

      fetch(searchTerms, function (err, appointments, response){
        if (err) {
					var errmsg = 'There are some error during find your appointments.';
					if (response.responseText && response.responseText !== '') {
							errmsg = response.responseText;
					}
					QuestCMS.Utils.showAlert('Error', errmsg);
        } else {
					//var view = new ModuleViewAllAppointmentCompositeView({collection: appointments.data, totalCount: appointments.total});
					var view = new ModuleViewAllAppointmentCompositeView({collection: appointments, totalCount: appointments.length});
					QuestCMS.layout[configs[module]['region']].show(view);
        }
      });
		};

		var findAllAppointmentsOnThisMonth = function (options) {
			var view = new ModuleMonthBookingItemView();
			QuestCMS.layout[configs[module]['region']].show(view);
		};

    var getTodayAppointments = function (callback) {
      fetch({date: new Date().toDateFormat('yyyy-MM-dd'), statusNotEqual: 'cancelled'}, function (err, appointments){
        callback(err, appointments);
      });
    }

    var displayViewAllAppointmentCompositeView = function (options) {
      var view = new ModuleViewAllAppointmentCompositeView(options);
      QuestCMS.layout[configs[module]['region']].show(view);
    };


    var filter = function (options) {
      options = options || {};

      if (cachedCollection) {
        cachedCollection = null;

      }

      fetch(options, function (err, cachedCollection, response) {
        if (err) {
          QuestCMS.Utils.showAlert('Error', err);
        } else {
					// var collection = new ModuleCollection(cachedCollection.models[0].get('data'));
					// var totalCount = cachedCollection.models[0].get('total')
          displayViewAllAppointmentCompositeView({collection: cachedCollection, totalCount: cachedCollection.length});
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
					action: options.action || 'findAllAppointments'
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

		var handleOpeningAndClosingTime = function () {
			var previousDailySetting = {};

			return function (officeHour, dailySetting) {
				if (!officeHour.openingTime || officeHour.openingTime > dailySetting.openingTime) {
					officeHour.openingTime = dailySetting.openingTime;
				}

				if (!officeHour.closingTime || officeHour.closingTime < dailySetting.closingTime) {
					officeHour.closingTime = dailySetting.closingTime;
				}

				if (previousDailySetting && previousDailySetting.closingTime < dailySetting.openingTime) {
					var timeRange = [];
					var disableOpeningTime = moment(previousDailySetting.closingTime, 'HH:mm').add(1, 'minutes').format('HH:mm');
					var disableClosingTime = moment(dailySetting.openingTime, 'HH:mm').subtract(1, 'minutes').format('HH:mm');
					timeRange.push(disableOpeningTime);
					timeRange.push(disableClosingTime);
					officeHour.disableTimeRanges.push(timeRange);
				}
				previousDailySetting = dailySetting;
			};
		};


    var closeRegion = function () {
      QuestCMS.layout[configs[module]['region']].close();
    };

    var showAppointmentDetails = function (options) {
      options = options || {};
      if (options.model) {
        // create a new view
						//options.review = true;
						QuestCMS.vent.trigger('user:displayUserProfile', {model: options.model, afterEdit: options.afterEdit, review: true, callback: function(err, view){
							newRegion.reviewAppointment.show(view);
						}});
      } else {
        QuestCMS.Utils.showAlert('Error', 'Error in displaying appointment');
      }
    };


		var showMakeAppointmentView = function (options) {
			options = options || {};

			options.model = (options.model) ? options.model : new ModuleItem();

			var view = new MakeAppointmentView({model: options.model, user: options.user});
			QuestCMS.layout[configs[module]['region']].show(view);
		};

    var showAppointmentHistory = function (options) {
			options = options || {};

      var conditions = {
        userId: QuestCMS.user.getId(),
        action: 'findAppointmentsByUserId'
      };
      fetch(conditions, function (err, cachedCollection, response){
        if (err) {
					var errmsg = 'There are some error during find your appointments.';
					if (response.responseText && response.responseText !== '') {
							errmsg = response.responseText;
					}
					QuestCMS.Utils.showAlert('Error', errmsg, true);
        } else {
					var view = new AppointmentHistoryCompositeView({collection: cachedCollection, region: options.region});
					options.region.show(view);
        }
      });
		};


		var showBookingAppointmentDatepicker = function (options, callback) {
			options = options || {};

			fetchValidBookingDates(function (dates) {
				if (dates.length > 0) {
					if (!options.datepickerDisplayDate) {
						options.datepickerDisplayDate = dates[0];
					}

					var setting = {
						autoSize: false,
						dateFormat: 'yy-mm-dd',
						changeMonth: true,
						changeYear: true
					};

					QuestCMS.Utils.addDatepicker({placeholder: options.datepickerPlaceholder, self: self, setting: setting, readonly: true}, true, false, dates);
					$(options.datepickerPlaceholder, options.self.el).datepicker('setDate', options.datepickerDisplayDate);
					callback();
				} else {
					$(options.datepickerPlaceholder, options.self.el).attr('disabled', 'disabled').removeClass('readonlyButVisible');
					callback();
				}
			});
		};

		var showBookingAppointmentTimepicker = function (options, callback) {
			options = options || {};

			getNewDailySettingTimeRange({bookingDate: options.bookingDate}, function(err, officeHour) {
				if (err) {
					$(options.timepickerPlaceholder, options.self.el).attr('disabled', 'disabled').removeClass('readonlyButVisible');
					if (callback) {
						callback();
					}
				} else {
          officeHour = officeHour || {closingTime: '8:00pm', openingTime: '12:00am'};

          var data = {
            min: officeHour.openingTime.split(':'),
            max: moment(officeHour.closingTime, 'HH:mm').subtract(configs[module]['eachTimeRange'], 'minute').format('HH:mm').split(':'),
            disable: (officeHour.disableTimeRanges.length > 0) ? officeHour.disableTimeRanges : false
          };

          var $input = $(options.timepickerPlaceholder, options.self.el).addClass('readonlyButVisible').pickatime({
            clear: '',
            interval: configs[module]['eachTimeRange'],
            format: 'hh:i A'
          });
          var picker = $input.pickatime('picker');
          picker.set(data, { muted: true });

          if (callback) {
            callback();
          }
				}
			});
		};

    var fetchValidBookingDates = function (callback) {
      $.ajax({
        type: 'GET',
        dataType: 'json',
        headers: QuestCMS.headers,
        url: QuestCMS.Utils.setAPIUrl() + '/dailySetting',
        data: {action: 'findVaildBookingDates'},
        success: function (dates) {
          dates.sort();
          callback(dates);
        },
        error: function (err) {
          console.log("Haven't find booked appointments dates");
          callback([]);
        }
      });
    };

    var getNewDailySettingTimeRange = function (options, callback) {
			options = options || {};

			var officeHour = {
				disableTimeRanges: []
			};

			var data = {
				action: 'findDailySettingsByDate',
				date: options.bookingDate
			};

			$.ajax({
				type: 'GET',
				dataType: 'json',
				headers: QuestCMS.headers,
				url: QuestCMS.Utils.setAPIUrl() + '/dailySetting',
				data: data,
				success: function (dailySettings) {
					if (dailySettings.length !== 0){
						var disableTimeRanges = [];
						var handleDailySetting = handleOpeningAndClosingTime();
						/* dailySettings are ascending */
						dailySettings.forEach(function (dailySetting) {
							handleDailySetting(officeHour, dailySetting);
						});

						$.ajax({
							type: 'GET',
							dataType: 'json',
							headers: QuestCMS.headers,
							url: QuestCMS.Utils.setAPIUrl() + '/' + module,
							data: {action: 'mapReduceAppointmentTimeByDate', query: {date: options.bookingDate, status: {$ne: 'cancelled'}}},
							success: function (appointments) {
								appointments.forEach(function (appointment) {
									/* appointment._id = time, appointment.value = count */
									if (appointment.value >= configs[module]['timeslotLimit']) {
										var time = moment(appointment._id, "h:mm A").format('HH:mm').split(':');
										officeHour.disableTimeRanges.push(time);
									}
								});
								callback(null, officeHour);
							},
							error: function (err) {
								callback(err);
							}
						});
					} else {
						callback(true);
					}
				},
				error: function (err) {
					callback(err);
				}
			});
		};


    var showVendorList = function (options) {
      options = options || {};
      if (options.model) {
				QuestCMS.vent.trigger('user:showVendorList', {model: options.model, callback: function(err, view){
					// newRegion.reviewAppointment.show(view);
					QuestCMS.modal.show(view);
				}});
      } else {
        QuestCMS.Utils.showAlert('Error', 'Error in displaying appointment');
      }
    };

/*********************************************
 * Return
 *********************************************/
    return Appointment;

});
