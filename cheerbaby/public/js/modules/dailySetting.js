/*********************************************
 * DailySetting module
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
  "moment",
  "fullcalendar",
  "text!tpl/dailySetting.html"
],


/*
 * Objects to store the marionette and the HTML template file
 */
function (Marionette, ladda, moment, fullcalendar, templateString) {


/*********************************************
 * Templates
 *********************************************/

/*
 * Read the corresponding segment of HTML code into template variables
 */
    var tplCalendarView = $('#CalendarItemView', '<div>' + templateString + '</div>').html();
    var tplDayEventItemView = $('#DayEventItemView', '<div>' + templateString + '</div>').html();


/*********************************************
 * Module scope variables
 *********************************************/

/*
 * Define the module-wide variables here
 * at least 2 variables: module and configs.
 */
    var module = "dailySetting"; // lowercase only
    var configs = {};

    var limit, pageSize, pageCount, sectionStart = 1, sectionEnd = 1, lastPage;
    var nextkey = "", startkey = "";
		var searchTerms = {};
    var cachedCollection;
    var currentPage;
    var sevenDays = 7*24*60*60*1000;
/*********************************************
 * Main function (export)
 *********************************************/

/*
 * Main module funtion here
 * name is CamelCase
 */
    var DailySetting = function () {
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

      QuestCMS.vent.on(module + ":calendar", function (alias) {
        displayCalendarView(alias);
      });

      QuestCMS.vent.on(module + ":findDailySettingsByDateRange", function (options) {
        findDailySettingsByDateRange(options);
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
			if (decision  == 'calendar') {
				displayCalendarView();
      }
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
      urlRoot: function () { return QuestCMS.Utils.setAPIUrl(this.options) +  '/' + configs[module]['dataType']; },
      idAttribute: '_id',
			getId: function(){
				return this.get('_id');
			},
			getDate: function () {
				return this.get('date');
			},
			getOpeningTime: function () {
				return this.get('openingTime');
			},
			getClosingTime: function () {
				return this.get('closingTime');
			},
			getNumOfAppointment: function () {
				return this.get('numOfAppointment');
			},
			getNumOfBookedAppointments: function () {
				return this.get('numOfBookedAppointments');
			},
      validation: {
				'branch': { required: true },
				'closingTime':  function (closingTime) {
					var closingTimes =  closingTime.split(':');
					closingTime = moment(closingTimes[0] + ':' + closingTimes[1], "HH:mm");

					var openingTimes =  this.getOpeningTime().split(':');
					var openingTime = moment(openingTimes[0] + ':' + openingTimes[1], "HH:mm");

					if (closingTime <= openingTime){
						return 'Closing time before Opening Time';
					}
        },
				'creator': { required: true },
				'date': { required: true },
				'numOfAppointment': { required: true ,pattern: 'number'},
				'openingTime': { required: true }
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
      url: function () { return QuestCMS.Utils.setAPIUrl(this.options) +  '/' + configs[module]['dataType']; },
      model: ModuleItem
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

	var ModuleCalendarView = Backbone.Marionette.ItemView.extend({
		initialize: function () {
			Backbone.history.navigate('dailySetting/calendar');
		},
		template: _.template(tplCalendarView),
		onRender: function(){
			$(document).scrollTop(0);
		},
		onShow: function(){
			var now = new Date();
			this.yyyymm = now.yyyymm();
			this.showCalendar({month: this.yyyymm});
		},
		events:{
			'click .fc-button'			: 'change'
		},
		change: function(){
			var moment = $('#calendar').fullCalendar('getDate');
			moment = new Date(moment).yyyymm();
			this.getdailySettingsAndShowCalendar({month: moment});
		},
		showCalendar:　function(options){
			$('#calendar').fullCalendar({
				selectable: true,
				header: {
					center: 'basicWeek month',
					right:  'prev,next'
				},
				// dayRender: function(date, cell){
					// console.log('dayRender', date, cell, this.highLightDay);
				// },
				select: function(start, end, jsEvent, view){
					var formatStartDate = new Date(start).toDateFormat('yyyy-MM-dd');
					end = new Date(end);
					end.setDate(end.getDate() - 1);
					var formatEndDate = end.toDateFormat('yyyy-MM-dd');
					var model = new ModuleItem();
					var select = true;
					if (formatStartDate == formatEndDate){
						select = false;
					}
					var view = new ModuleDayEventView({startDate: formatStartDate, endDate: formatEndDate, model: model, select: select});
					QuestCMS.modal.show(view);
				},
				eventClick: function (event){
					var date = new Date(event.start).toDateFormat('yyyy-MM-dd');
					var data = {
						action: 'findDailySettingById',
						id: event.className[0]
					};
					fetch(data, function (err, dailySetting, response){
						if (err) {
								var errMsg = 'There are some errors during find day setting.';
								if (response.responseText && response.responseText !== '') {
										errMsg = response.responseText;
								}
								QuestCMS.Utils.showAlert('Error', errMsg);
						} else {
								dailySetting.at(0).eventId = event._id;
								var view = new ModuleDayEventView({startDate: date, endDate: date, model: dailySetting.at(0), select: false, isEvent: true});
								QuestCMS.modal.show(view);
						}
					});
				}
			});
			this.getdailySettingsAndShowCalendar(options);
		},
		getdailySettingsAndShowCalendar: function(options){
			var self = this;
			options = options || {};
			options.month = options.month || this.yyyymm ;

			var dateRange = new Date().wholeMonth(options.month + '01');
			var dateFrom = dateRange.from;
			var dateTo = dateRange.to;
			var showCalender = function(err, dailySettings){

				if (!err){
					var events = [];
					dailySettings.forEach(function (dailySetting, index){
						var startDate =  new Date(dailySetting.getDate()).toDateFormat('yyyy-MM-dd');
						$('#calendar').fullCalendar('renderEvent', {start: startDate, className: [dailySetting.getId(), 'canClick'], title: dailySetting.getOpeningTime() + ' ~ '+ dailySetting.getClosingTime() + ' | ' + dailySetting.getNumOfAppointment(), allDay: true});
					});

				}
			};

			$('#calendar').fullCalendar( 'removeEvents');
			getDailySettingsByMonth({dateFrom: dateFrom, dateTo: dateTo}, showCalender);
		}
	});

	var ModuleDayEventView = Backbone.Marionette.ItemView.extend({
		initialize: function(options){
			var self = this;
			this.startDate = options.startDate;
			this.endDate = options.endDate;
			this.dailySettings = options.dailySettings || [];
			this.select = options.select || false;
			this.isEvent = options.isEvent || false;

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
		template: _.template(tplDayEventItemView),
		onRender: function(){
			$("#branch", this.el).html(QuestCMS.Utils.addBranchList(false));
		},
		onShow: function(){
			var self = this;
			var repeats = [];
			var startDate = new Date(this.startDate);
			var endDate = new Date(this.endDate);
			moment.locale('en-NZ');
				if(this.isEvent){
					$('.delete').removeClass('hidden');
				}
			var branch = QuestCMS.Cookie.get('branch');
				$('#startDate').val(this.startDate);
				$('#endDate').val(this.endDate);

				$('#branch').val(branch);

			  $('#startDate').datepicker({
          autoSize: false,
          dateFormat: 'yy-mm-dd',
					defaultDate: $('#startDate').val()
        });
				$('#endDate').datepicker({
          autoSize: false,
          dateFormat: 'yy-mm-dd',
					minDate: $('#startDate').val(),
					defaultDate: $('#endDate').val()
        });

			if (this.select){
				$("input[name='isRepeat'][value='true']").prop('checked', 'checked');

				while (startDate.getTime() <= endDate.getTime()) {
					var currentDay = startDate.getDay();	//Mon(1), Tue(2) ...
					if (repeats.indexOf(currentDay) == -1) {
						repeats.push(currentDay);
					}

					startDate = moment(startDate.toDateFormat('yyyyMMdd'), 'YYYYMMDD').add(1, 'days').format();
					startDate = new Date(startDate);
				}

				repeats.forEach(function (day) {
					$("input[name='repeats'][value='" + day + "']").prop('checked', 'checked');
				});

				this.showRepeat();
			} else {

				this.changeDatepicker();
			}
		},
		events: {
			'click .save'					: 'submit',
			'click .delete'				: 'deleteDailySetting',
			'change #startDate' 	: 'changeDatepicker',
			'change .isRepeat'		: 'showRepeat',
			'change #opening'			: 'changeClosingTime'
		},
		deleteDailySetting: function () {
			var self = this;
			var eventId = self.model.eventId;
			this.model.destroy({
				success: function (model) {
					$('#calendar').fullCalendar( 'removeEvents', eventId );
				},
				error: function () {
					console.log('error');
				}
			});
		},
		changeClosingTime: function(e){
			var maxTime = moment('2999-01-01', "YYYY-MM-DD");

			var openingTimes =  $('#opening').val().split(':');
			var openingTime = moment(openingTimes[0] + ':' + openingTimes[1], "HH:mm");

			this.avaliableTimes.forEach( function(avaliableTime){
				avaliableTime = moment(avaliableTime[0], "HH:mm");
				if (openingTime < avaliableTime){
					if (avaliableTime < maxTime){
						maxTime = moment(avaliableTime);
					}
				}
			});

			if (maxTime.unix() == moment('2999-01-01', "YYYY-MM-DD").unix()){
				maxTime = moment("1970-01-01 21:00", "YYYY-MM-DD HH:mm");
			}

			$('#closing').timepicker('remove');
			$('#closing').timepicker({
				timeFormat: 'H:i',
				minTime: new Date(openingTime).toDateFormat('HH:mm'),
				maxTime: new Date(maxTime).toDateFormat('HH:mm'),
				showDuration: false,
				step: 15,
				forceRoundTime: false
				// disableTimeRanges: this.avaliableTimes
			});
			if (e){
				$('#closing').val('');
			}
		},
		changeDatepicker: function(){
			var self = this;
			$('#endDate').removeClass('hasDatepicker');
			$('#endDate').val($('#startDate').val());
			$('#endDate').datepicker({
				autoSize: false,
				dateFormat: 'yy-mm-dd',
				minDate: $('#startDate').val(),
				defaultDate: $('#endDate').val()
			});

			var data = {
				action: 'findDailySettingsByDate',
				date: $('#startDate').val()
			};
			fetch(data, function (err, dailySettings, response){
				if (err) {
						var errMsg = 'There are some errors during find day setting.'
						if (response.responseText && response.responseText != '') {
								errMsg = response.responseText;
						}
						QuestCMS.Utils.showAlert('Error', errMsg);
				} else {
					self.dailySettings = [];
					dailySettings.forEach( function(dailySetting, index){
						if (dailySetting.id != self.model.getId()){
							self.dailySettings.push(dailySetting);
						}
					})
					self.changeOpeningTime();
				}
			});

		},
		changeOpeningTime: function(){
			var self = this;
			this.avaliableTimes = [];
			this.dailySettings.forEach( function(dailySetting){
				self.avaliableTimes.push([dailySetting.getOpeningTime(), dailySetting.getClosingTime()]);
			});
			var clone = this.avaliableTimes.slice(0);

				$('#opening').timepicker('remove');
				$('#opening').timepicker({
					timeFormat: 'H:i ',
					minTime: '06:00',
					maxTime: '21:00',
					showDuration: false,
					step: 15,
					forceRoundTime: false,
					disableTimeRanges: clone
				});

				this.changeClosingTime();
		},
		newLoopDay: function (repeats, startDate, endDate, data) {
			var self = this;
			moment.locale('en-NZ');

			while (startDate.getTime() <= endDate.getTime()) {
				var currentDay = startDate.getDay();	//Mon(1), Tue(2) ...

				if (repeats.indexOf(currentDay) !== -1) {
					data.date = startDate;
					self.saveDailySetting(data);
				}

				startDate = moment(startDate.toDateFormat('yyyyMMdd'), 'YYYYMMDD').add(1, 'days').format();
				startDate = new Date(startDate);
			}
		},
		submit: function(e){
			var self = this;
			var data = {
				numOfAppointment: $('#numOfAppointment').val(),
				openingTime: $('#opening').val().trim(),
				closingTime: $('#closing').val().trim(),
				creator: QuestCMS.user.id,
				branch:  $('#branch').val()
			}

			if (data.numOfAppointment != '' && data.openingTime != '' && data.closingTime != '' && data.branch != ''){
				var startDate = $('#startDate').val().split('-');
				startDate = new Date(startDate[0], startDate[1]-1, startDate[2] );
				var endDate = $('#endDate').val().split('-');
				endDate = new Date(endDate[0], endDate[1]-1, endDate[2] );
				var isRepeat = $("input[name='isRepeat']:checked").val();

				if (isRepeat == 'false'){
					data.date = startDate;
					this.saveDailySetting(data);

				} else {
					var repeats = [];

					$("input[name='repeats']:checked").each(function(index){
						repeats.unshift(Number(this.value));
					});

					self.newLoopDay(repeats, startDate, endDate, data);
				}
			} else {
				QuestCMS.Utils.showAlert('Error', 'Please Enter all field.');

			}
		},
		showRepeat: function(){
			var isRepeat = $("input[name='isRepeat']:checked").val();
			if (isRepeat == 'true') {
				$('.repeats').removeClass('hidden');
				$('.endDate').removeClass('hidden');

				$('#opening').timepicker('remove');
				$('#opening').timepicker({
					timeFormat: 'H:i ',
					minTime: '06:00',
					maxTime: '21:00',
					showDuration: false,
					step: 15,
					forceRoundTime: false
				});

				this.avaliableTimes = [];
			} else {
				$('.repeats').addClass('hidden').val();
				$('.endDate').addClass('hidden').val();
				this.changeDatepicker();
			}


		},
		saveDailySetting: function(data){
			var self = this;
			data.date = data.date.toDateFormat('yyyy-MM-dd');

			if (self.select){
				self.model = new ModuleItem(data);
			} else {
				self.model.set(data);
			}

			self.model.save({}, {
				success: function (model) {
					QuestCMS.Utils.showAlert('Success', 'saved');

					if (model.eventId){
						$('#calendar').fullCalendar( 'removeEvents', model.eventId );
					}

					var startDate =  new Date(model.getDate()).toDateFormat('yyyy-MM-dd');
					$('#calendar').fullCalendar('renderEvent', {start: startDate, title: model.getOpeningTime() + ' ~ '+ model.getClosingTime() + ' | ' + model.getNumOfAppointment(), className: [model.getId(), 'canClick'], allDay: true});

				},
				error: function (model, err) {
					var errmsg =  "Fail to saved";
					if (err.responseText != '') {
							errmsg = err.responseText;
							errmsg = errmsg.split('+')[0];
					}
					QuestCMS.Utils.showAlert('Error', errmsg);
					// this.highLightDay = err.responseText.split('+')[1];
					// $('#calendar').fullCalendar('render');
				}
			});
		}
	});
    /*
     * the default function to run when user type in a URL to trigger this module
     *
     * @param {String} alias        the querystring after the # key in URL
     */
    var resolve = function (alias) {
      var page = 1;
      QuestCMS.Cookie.save({alias: alias, page: page});
      QuestCMS.Utils.setSiteTitle(QuestCMS.l('DailySetting'));
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

    var displayCalendarView = function (options) {
			var view = new ModuleCalendarView();
			QuestCMS.layout[configs[module]['region']].show(view);
    };

		var findDailySettingsByDateRange = function (options) {
			options = options || {};

			fetch({action: 'findDailySettingsByDateRange', dateFrom: options.dateFrom, dateTo: options.dateTo}, function (err, dailySettings, response){
				if (err) {
					var errmsg = "Can't not find no. of booked appointments";
					if (response.responseText && response.responseText != '') {
							errmsg = response.responseText;
					}
          QuestCMS.Utils.showAlert('Error', errmsg);
				} else {
					options.callback(dailySettings);
				}
			})
		}

    var filter = function (options) {
      options = options || {};
      options.page = options.page || 1;

      if (cachedCollection) {
        cachedCollection = null;

      }

      fetch(options, function (err, cachedCollection, response) {
        if (err) {
            var errMsg = 'There are some errors during find daily setting.'
            if (response.responseText && response.responseText != '') {
                errMsg = response.responseText;
            }
          QuestCMS.Utils.showAlert('Error', errMsg);
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
					action: options.action || 'findAllDailySettings'
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

    var	getDailySettingsByMonth = function (options, callback) {
			fetch({dateFrom: options.dateFrom, dateTo: options.dateTo}, function (err, dailySettings, response){
        if (err) {
            var errMsg = 'There are some errors during find daily setting.'
            if (response.responseText && response.responseText != '') {
                errMsg = response.responseText;
            }

            QuestCMS.Utils.showAlert('Error', errMsg);
						callback(err);
        } else {
					callback(null, dailySettings);
        }
      });
    };

    var closeRegion = function () {
      QuestCMS.layout[configs[module]['region']].close();
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
    return DailySetting;

});
