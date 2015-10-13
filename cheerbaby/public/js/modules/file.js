/*********************************************
 * File module
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
	"async",
  "text!tpl/file.html"
],


/*
 * Objects to store the marionette and the HTML template file
 */
function (Marionette, async, templateString) {


/*********************************************
 * Templates
 *********************************************/

/*
 * Read the corresponding segment of HTML code into template variables
 */
    var tplFileTable = $('#FileTable', '<div>' + templateString + '</div>').html();
    var tplUploadFile = $('#UploadFile', '<div>' + templateString + '</div>').html();

/*********************************************
 * Module scope variables
 *********************************************/

/*
 * Define the module-wide variables here
 * at least 2 variables: module and configs.
 */
    var module = "file"; // lowercase only
    var configs = {};

    var cachedCollection;
    var currentPage;
    var FileRegion;

/*********************************************
 * Main function (export)
 *********************************************/

/*
 * Main module funtion here
 * name is CamelCase
 */
    var File = function () {
      var self = this;
      configs[module] = {             // module specified config options
        isCachedCollection: false,
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


      /* module specified events */
      QuestCMS.vent.on(module + ":display", function (options) {
        display(options);
      });

      QuestCMS.vent.on(module + ":getUserFiles", function (callback) {
        callback(cachedCollection.getUserSubmittedFiles().toJSON());
      });

      QuestCMS.vent.on(module + ':upload', function (options) {
        displayUploadFileView(options);
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
		var decision = (urlParas[1]) ? urlParas[1].toLowerCase() : '';

		if (urlParas) {
			if (decision  == 'upload') {
				displayUploadFileView();
			} else {
				displayUploadFileView();
			}
		} else {
			displayUploadFileView();
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
			defaults: {
				_id: null,
				timestamp: new Date(),
				filename: '',
				fullFilepath: '',
				amazonUrl: '',
				amazonFilename : ''
			},
			getAmazonFilename: function () {
				return this.get('amazonFilename') || '';
			},
			getAmazonUrl: function () {
				return this.get('amazonUrl') || '';
			},
			getFilename: function () {
				return this.get('filename') || '';
			},
			getFullFilepath: function () {
				return this.get('fullFilepath') || '';
			},
			getTimestamp: function () {
				return this.get('timestamp') || null;
			},
			getVendorCode: function () {
				return this.get('vendorCode') || 'N/A';
			},
			isAdminFile: function () {
				return this.get('adminFile') || false;
			},
			isNew: function () {
				return this.get('isNew') || false;
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
      comparator: function (model) {
				return model.get('timestamp');
      },
			isAllowUpload: function (item) {
				var isAllow = true;
				this.filter(function (_item) {
					if (_item.getFilename() == item.name) {
						if (_item.isNew() || QuestCMS.user.isAdmin()) {
							_item.destroy();
						} else {
							isAllow = false;
						}
					}
				});
				return isAllow;
			},
			addAdminFlag: function () {
				this.each(function (_file) {
					_file.set({adminFile: true}, {silent: true});
				});
			},
			getUserSubmittedFiles: function () {
				return new ModuleCollection(this.filter(function (_file) {
					return (!_file.isAdminFile());
				}));
			},
			beforeLoad: function (userId) {
				return new ModuleCollection(this.filter(function (_file) {
					var _timestamp = (_file.getTimestamp()) ? new Date(_file.getTimestamp()).toDateFormat('yyyy-MM-dd HH:mm') : 'N/A';
					var vendorCode = (_file.getVendorCode()) ? _file.getVendorCode() : 'N/A';

					return _file.set({_timestamp: _timestamp, vendorCode: vendorCode, userId: userId}, {silent: true});
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
  var FileTableView = Backbone.Marionette.ItemView.extend({
		initialize: function () {
			this.user = this.options.user;
			this.failRemove = [];
		},
    template: _.template(tplFileTable),
		serializeData: function () {
			return {
				userId: this.user.getId()
			};
		},
    onRender: function () {
      this.addFiles();
    },
    onShow: function () {
      var self = this;

			this.$table = QuestCMS.Utils.showTable({
				placeholder: '#table-userFiles',
				data: this.collection.beforeLoad(this.user.getId()).toJSON(),
				// url: QuestCMS.Utils.setAPIUrl() + '/user?action=findUserSuchAsPagination',
				toolbar: '#toolbar',
				sortName: '_timestamp',
				sortOrder: "desc",
				onClickRow: function () {
					$('#remove', self.el).prop('disabled', !self.$table.getSelections().length);
				},
				columns: [{
					field: 'selected',
					checkbox: true,
					formatter: this.checkIsNew,
				}, {
					field: 'filename',
					title: QuestCMS.l('Files') + QuestCMS.l('Name'),
					align: 'left',
					clickToSelect: false,
          titleTooltip: 'Tip filename',
					formatter: this.filenameFormatter,
					events: this.tableEvents,
					sortable: true
				}, {
					field: '_timestamp',
					title: QuestCMS.l('Date'),
					align: 'left',
					sortable: true
				}, {
					field: 'vendorCode',
					title: QuestCMS.l('Vendor') + QuestCMS.l('Code'),
					align: 'left',
					sortable: true,
					// clickToSelect: false,
					editable: {
						type: 'text',
						title: 'Please Enter Vendor Code'
					}
				}]
			});
    },
    tableEvents: {
      'click .filepath': function (e, value, row, index) {
				fetchFileToOpen({model: new ModuleItem(row), userId: row.userId});
			},
    },
		checkIsNew: function (value, row, index) {
			if (!new ModuleItem(row).isNew()) {
				return {
					disabled: true
				};
			}
		},
    filenameFormatter: function (value, row, index) {
			return [
				'<a class="filepath" href="javascript:void(0)" >',
						value,
				'</a>',
			].join('');
    },
		events: {
			'click #remove' : 'removeFiles'
		},
    addFiles: function () {
			var self = this;

			$('.fileUpload-button', this.el).change(function () {
				if (this.files && this.files[0]) {
					var that = this;
					self.allowUpload = self.collection.isAllowUpload(that.files[0]);
					if (self.allowUpload){
						QuestCMS.Utils.uploadFileViaBase64({
							userId: self.user.getId(),
							input: that,
							url: QuestCMS.Utils.setAPIUrl(QuestCMS.Config.toJSON()) + '/file', // path
							success: function (json) {
								var fileObj = {
									fullFilepath: json[0].fullFilename,
									filename: json[0].name,
									timestamp: new Date(),
									amazonUrl: json[0].amazonUrl,
									amazonFilename: json[0].amazonFilename,
									isNew: true
								};

								self.collection.add(new ModuleItem(fileObj));
								self.$table.load(self.collection.beforeLoad(self.user.getId()).toJSON());
								QuestCMS.Utils.showAlert('Success', 'File upload successful');
							},
							error: function (err) {
								QuestCMS.Utils.showAlert('Error', 'File upload failed');
							}
						});
					} else {
						QuestCMS.Utils.showAlert('Error', 'File has already submitted.');
					}
				}
			});
    },
		removeFiles: function (e) {
			e.preventDefault();
      var self = this;
      var files = this.$table.getSelections();

			async.each(
				files,
				function (file, callback) {
					self.deleteFile(file, callback);
				},
				function (err) {
					self.finishedRemoveFiles();
				}
			);
		},
		deleteFile: function (file, callback) {     /* passing data: file*/
			var self = this;

			/* use ajax instead of backbone call because if it is a new model, it just remove it from collection, it won't call HTTP DETELE */
			$.ajax({
				type: 'DELETE',
				dataType: 'json',
				url: QuestCMS.Utils.setAPIUrl() + '/file/' + file.filename,
				data: {userId: self.user.getId(), file: file},
				headers: QuestCMS.headers,
				success: function (data, response) {
					self.collection.remove(self.collection.where({filename: file.filename}));
          callback();
				},
				error: function (err) {
					self.failRemove.push(file.filename);
					callback();
				}
			});
		},
		finishedRemoveFiles: function () {
			var self = this;

			if (this.failRemove.length > 0) {
				QuestCMS.Utils.showAlert('Error', 'Failed to remove these files - ' + this.failRemove.join(', '));
				this.failRemove = [];
			} else {
				QuestCMS.Utils.showAlert('Success', 'All Deleted');
			}

			$('#remove', this.el).prop('disabled', true);
			$(this.$table.selector + 'input:checkbox:checked').prop('checked', false);
			this.user.saveFiles(self.collection.getUserSubmittedFiles().toJSON());
			this.$table.load(self.collection.beforeLoad(self.user.getId()).toJSON());
		}
  });



  var ModuleUploadFile = Backbone.Marionette.ItemView.extend({
    initialize: function () {
      this.user = this.options.user;
    },
		template: _.template(tplUploadFile),
		onShow: function(){
      Backbone.history.navigate('file/upload');
      $(document).scrollTop(0);
			QuestCMS.Utils.setSiteTitle(QuestCMS.l("Upload File"));

			var rm = new Marionette.RegionManager();
			FileRegion = rm.addRegions({
				showTable					: "#FileTable"
			});

      showFileList({region: FileRegion.showTable, user: this.user});
		},
    events: {
      'click #file-save' : 'saveUser'
    },
    saveUser: function () {
      this.user.saveFiles(cachedCollection.getUserSubmittedFiles().toJSON(), {
        success: function (model) {
          QuestCMS.Utils.showAlert('Success', "Upload successful");
          QuestCMS.Utils.setUrlPath({pathname: "#appointment/booking"});
        },
        error: function (err) {
          QuestCMS.Utils.showAlert('Error', "Haven't save files");
        }
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

			if (cachedCollection) {
				cachedCollection = null;
			}

      showFileList({region: options.region, user: options.user});
    };

    var displayUploadFileView = function (options) {
      options = options || {};

      options.user = options.user || QuestCMS.user;
			var view = new ModuleUploadFile(options);
			QuestCMS.layout[configs[module]['region']].show(view);
    };

		/*
		 *	param: region, user
		 */
		var showFileList = function (options) {
			options = options || {};
			var collection = new ModuleCollection(options.user.getFiles());

			if (QuestCMS.user.isAdmin()) {
				fetch({action: 'findAdminFilesByFolder', path: 'data/memberFiles/' + options.user.getId(), filenames: options.user.getFilenames()}, function (err, adminFiles) {
					if (err) {
						var errMsg = "Haven't find files";
						if (err.responseText !== "" ) {
							errMsg = err.responseText;
						}
						QuestCMS.Utils.showAlert('Error', errMsg);
					} else {
						adminFiles.addAdminFlag();
						var temporayArray = adminFiles.toJSON().concat(collection.toJSON());
						cachedCollection = new ModuleCollection(temporayArray);

						var view = new FileTableView({collection: cachedCollection, user: options.user});
						options.region.show(view);
					}
				});
			} else {
				cachedCollection = collection;
				var view = new FileTableView({collection: cachedCollection, user: options.user});
				options.region.show(view);
			}
		};

		var fetchFileToOpen = function(options) {
      var url;
			options = options || {};
			var filepath = options.model.getFullFilepath();
			var filename = options.model.getFilename();
			var amazonUrl = options.model.getAmazonUrl();

			filepath = filepath.replace(/[\\]/g, '/');

      if (amazonUrl && amazonUrl !== ''){
        url = amazonUrl;
      } else {
			  url = QuestCMS.Utils.setAPIUrl() + '/file?action=getFileByFullPath&userId=' + options.userId + '&filename=' + filename + '&fullFilepath=' + filepath;
      }

			window.open(url, '_blank');
		};

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
					action: options.action || 'search'
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

/*********************************************
 * Return
 *********************************************/
    return File;

});
