/*********************************************
 * Vendor module
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
	"tablesorter",
	"tablesorterPager",
  "text!tpl/vendor.html"
],


/*
 * Objects to store the marionette and the HTML template file
 */
function (Marionette, ladda, tablesorter, tablesorterPager,  templateString) {


/*********************************************
 * Templates
 *********************************************/

/*
 * Read the corresponding segment of HTML code into template variables
 */
		var tplCreateVendorItemView = $('#CreateVendorItemView', '<div>' + templateString + '</div>').html();
		var tplViewAllVendorsInventoryListView = $('#ViewAllVendorsInventoryListView', '<div>' + templateString + '</div>').html();
		var tplViewAllVendorsInventoryItemView = $('#ViewAllVendorsInventoryItemView', '<div>' + templateString + '</div>').html();
		var tplCreateVendorCategoryCompositeView = $('#CreateVendorCategoryCompositeView', '<div>' + templateString + '</div>').html();
		var tplCreateVendorCategoryItemView = $('#CreateVendorCategoryItemView', '<div>' + templateString + '</div>').html();
		var tplShowVendorDetailsView = $('#ShowVendorDetailsView', '<div>' + templateString + '</div>').html();
		var tplSelectVendorAndItemCompositeView = $('#SelectVendorAndItemCompositeView', '<div>' + templateString + '</div>').html();
		var tplSelectedVendorAndItemView = $('#SelectedVendorAndItemView', '<div>' + templateString + '</div>').html();

    var tplShowJoinedClubView = $('#ViewAllClubInventoryItemView', '<div>' + templateString + '</div>').html();
/*********************************************
 * Module scope variables
 *********************************************/

/*
 * Define the module-wide variables here
 * at least 2 variables: module and configs.
 */
    var module = "vendor"; // lowercase only
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
    var Vendor = function () {
      var self = this;
      configs[module] = {             // module specified config options
        isCachedCollection: false,
        isOnAdminList: false,         // is shown on the admin menu list
        isSearchable: false,          // is this module data searchable
        itemPerRow: 1,
        numOfRow: 5,
        pagePerSection: 5,
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

			QuestCMS.vent.on(module　+ ":getVendorModel", function (options, callback) {
				fetch({universalSearch: options.searchTerms, action: 'findByUniveralSearch'}, function (err, items) {
					if (err) {
						QuestCMS.Utils.showAlert('Error', 'There is no item');
						callback(err);
					} else if (items.length == 1){
						var item = items.at(0);
						callback(null, item);
					} else {
						callback('more than one vendor searched');
					}
				});
			});

			QuestCMS.vent.on("vendor:getVendorsCollection", function(options, callback){
				fetch({universalSearch: options.universalSearch, action: 'findAllActiveAndPublishVendorsWithInventory'}, function (err, vendors) {
					if (err) {
						QuestCMS.Utils.showAlert('Error', 'There is no item');
					} else {
						callback(vendors);
					}
				});
			});

      QuestCMS.vent.on(module + ":showJoinedClubs", function (options) {
        showJoinedClubs(options);
      });

			QuestCMS.vent.on(module　+ ":findCategoriesList", function (options, callback) {
				findCategoriesList(options, callback);
			});

      QuestCMS.vent.on(module + ":searchVendorAndItem", function (options) {
        searchVendorAndItem(options);
      });

      QuestCMS.vent.on(module + ":displayShowVendorDetailsView", function (options) {
        displayShowVendorDetailsView(options);
      });

      QuestCMS.vent.on(module + ":displayCreateVendorItemView", function (options) {
        displayCreateVendorItemView(options);
      });

      QuestCMS.vent.on(module + ":showCreateVendorCategoryCompositeView", function (options) {
        showCreateVendorCategoryCompositeView(options);
      });

			QuestCMS.vent.on(module + ":displayViewAllVendorsInventoryCompositeView", function (options) {
        displayViewAllVendorsInventoryCompositeView(options);
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
			if (decision  == 'create') {
				displayCreateVendorItemView();
			} else if (decision == 'findAll') {
				displayViewAllVendorsInventoryCompositeView();
			} else if (decision == 'findClub') {
				showJoinedClubs();
			} else if (decision == 'createVendorCategory') {
				showCreateVendorCategoryCompositeView();
			}  else if (decision == 'createVendor') {
				displayCreateVendorItemView();
			} else {
				showJoinedClubs();
			}
		} else {
			showJoinedClubs();
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
					active: true,
					publish: true
				};
			},

      getCategoryId: function () {
        return this.get('categoryId') || '';
      },
      getChiBrandName: function () {
        return this.get('chiBrandName') || '';
      },
      getContactList: function () {
        return this.get('contactList') || [];
      },
			getContract: function () {
				return this.get('contract') || {};
			},
			getFiles: function () {
				return this.get('files') || [];
			},
			getFilenames: function () {
				var files = this.getFiles() || [];
				var filenames = [];

				files.forEach(function (file) {
					filenames.push(file.filename);
				});

				return filenames;
			},
			getId: function () {
				return this.get('_id');
			},
			getInformation: function () {
				return this.get('information') || {};
			},
			getName: function () {
				return this.get('name') || '';
			},
			getRemarks: function () {
				return this.get('remarks') || [];
			},
			getShortName: function () {
				return this.get('shortName') || '';
			},
      getVendorCode: function () {
        return this.get('vendorCode') || '';
      },
			addFiles: function (options) {
				options = options || {};
				var files = this.getFiles();
				var exists = false;

				files.forEach(function (file) {
					if (file.src == options.src) {
						exists = true;
					}
				});

				if (!exists) {
					files.push(options);
				}
				this.set({files: files}, {silent: true});
			},
			setContact: function (obj) {
				var contact = this.getContactList();
				obj = obj || {};

				for (var prop in obj) {
					var key = prop.replace('contactPerson', '').toLowerCase();
					contact[key] = obj[prop];
				}

				this.set({contact: contact}, {silent: true});
			},
      validation: {
				chiCompanyName: { required: true, maxLength: 39 },
				engCompanyName: { required: true, maxLength: 39 },
				chiBrandName: { required: true, maxLength: 20 },
				engBrandName: { required: true, maxLength: 20 },
				categoryId: { required: true },
				'information.chiAddressLine1': { required: true, maxLength: 30 },
				'information.chiAddressLine2': { required: true, maxLength: 30 },
				'information.engAddressLine1': { required: true, maxLength: 30 },
				'information.engAddressLine2': { required: true, maxLength: 30 },
				'information.district': { required: true },
				'information.region': { required: true },
				'information.country': { required: true },
				'information.tel': { required: true},
				'contract.service': { required: true },
				'contract.fee': { required: true },
				'contract.paymentMethod': { required: true },
				'contract.cooperationPeriod': { required: true },
				'contract.startDate': { required: true },
				'contract.endDate': { required: true }
      }
    });

    var CategoryItem = Backbone.Model.extend({
      initialize: function () { this.options = configs; },
      urlRoot: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/vendorCategory'; },
      idAttribute: '_id',
			defaults: function () {
				return {
					_id: null,
          name: '',
					code: '',
					active: true
				};
			},
			getCode: function () {
				return this.get('code') || '';
			},
			getId: function () {
				return this.get('_id');
			},
      getName: function () {
        return this.get('name');
      },
			isActive: function () {
				return this.get('active');
			},
			setIsActive: function () {
				var isActive = this.isActive();
				var active = (isActive) ? false : true;
				this.set({active: active}, {silent: true});
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
					return data.get('code');
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
      },
			getItem: function () {
				var items = [];
				this.filter(function (model) {
					items.push(model.get('item'));
				})
				return items;
			}
    });


    var CategoryCollection = Backbone.Collection.extend({
      initialize: function () { this.options = configs; },
      url: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/vendorCategory'; },
      model: CategoryItem,
      comparator: function (data) {
        return data.get("name");
      },
      filterId: function (id) {
        return new ModuleCollection(this.filter(function (data) {
          return data.get("id") == id;
        }));
      },
			save: function (callback) {
				var err = null;

				this.filter(function (model) {
					model.save({}, {
						success: function (model) {
						},
						error: function (model, err) {
							err = err;
							return false;
						}
					})
				});

				callback(err);
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
    var ModuleCreateVendorItemView = Backbone.Marionette.ItemView.extend({
			initialize: function () {
				Backbone.history.navigate('vendor/create');

				var self = this;
				this.categories = this.options.categories;
        this.afterEdit = this.options.afterEdit || goToAdminPage;
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

							self.createVendor.stop();
							QuestCMS.Utils.showAlert('Error', errorMsg.trim().slice(0, -1));
						}
					});
				}
			},
      template: _.template(tplCreateVendorItemView),
			onRender: function () {
				this.prepareForm();
			},
			onShow: function () {
        this.countWord();
				this.createVendor = QuestCMS.Utils.createLadda('.create');
				this.showDatepicker();
				this.showSubmittedFiles();
				$("input:radio,input:checkbox", this.el).closest('div').css("padding-top", "7px");
			},
      events: {
				'keyup [data-toggle="floatLabel"]'	: 'floating',
        'keyup #chiAddressLine1, #chiAddressLine2, #engAddressLine1, #engAddressLine2' : 'countWord',
				'change [data-toggle="floatLabel"]'	: 'floating',
				'blur .maxlength'										: 'checkLength',
				'click .create'											: 'create',
				'change #address-district'					: 'changeRegion',
				'click .addContact' 								: 'addContact',
				'click .removeContact' 							: 'removeContact',
				'click .cancel'											: 'cancel',
				'click .filepath'										:	'viewFile',
				'click .deleteItem'									: 'deleteItem'
      },
			floating: function (e) {
				e.preventDefault();
				$(e.currentTarget).attr('data-value', $(e.currentTarget).val());
			},
      countWord: function () {
        var max = 30;
        $('#chiAddressLine1Word', this.el).text(max - $('#chiAddressLine1', this.el).val().length);
        $('#chiAddressLine2Word', this.el).text(max - $('#chiAddressLine2', this.el).val().length);
        $('#engAddressLine1Word', this.el).text(max - $('#engAddressLine1', this.el).val().length);
        $('#engAddressLine2Word', this.el).text(max - $('#engAddressLine2', this.el).val().length);
      },
			checkLength: function(e){
				var maxlength = Number($(e.target).data('length'));
				var length = $(e.target).val().length;
				if(length > maxlength){
					QuestCMS.Utils.showAlert('Error', 'More than ' + maxlength + ' digital');
					$(e.target).focus();
				}
			},
			changeRegion: function () {
				var self = this;
				var information = this.model.getInformation();
				var district = $('#address-district', this.el).val();
				var lang = (QuestCMS.Cookie.isChi()) ? 'chiName' : 'engName';
				$('#address-region', this.el).find('option').remove();

				QuestCMS.Utils.getRegionSelection(function (region, index) {
          var selected = '';
					if (region.code == information.region) {
						selected = 'selected';
					}
					if (region.district == district) {
						var option = '<option value="'+ region.code +'" ' + selected + ' >'+ QuestCMS.l(region[lang]) + '</option>';
						$('#address-region', self.el).append(option);
					}
        });
			},
			addContact: function (e) {
				e.preventDefault();
				var self = this;

				QuestCMS.Utils.addTableRowByjQuery('contactList', '', self);
			},
			removeContact: function (e) {
				e.preventDefault();
				if($('#contactList tr').length > 3){
					$(e.target).closest('tr').remove();
				}
			},
			create: function (e) {
				e.preventDefault();
				var self = this;

				if (!this.createVendor.isLoading()) {
					this.createVendor.start();

					var _modelObj = QuestCMS.Utils.getFormData('form#createVendor', '.notRead');
					_modelObj.categoryCode = $('.categoriesList option:selected').data('category');
					_modelObj.files = self.uploadFiles;
					self.model.set(_modelObj, {silent: true});

					var	remarks = $('#remarks').val();
					self.model.set({remarks: remarks.split('\n')});

					self.model.save({}, {
						success: function (model) {
							self.createVendor.remove();
							QuestCMS.Utils.showAlert('Success', "Created Successfully");
							self.afterEdit();
						},
						error: function (model, err) {
							QuestCMS.Utils.showAlert('Error', err.responseText);
							self.createVendor.remove();
						}
					});
				}
			},
			cancel: function (e) {
				e.preventDefault();

				this.afterEdit();
			},
			importFiles: function () {
        var self = this;
        $('.importFiles', this.el).change(function () {
          QuestCMS.Utils.uploadFileViaBase64({
            input: this,
            url: QuestCMS.Utils.setAPIUrl(QuestCMS.Config.toJSON()) + '/' + module, // path
            data: {action: 'importFiles'},
            success: function (json) {
							var fullFilename = json[0].fullFilename;
							fullFilename = fullFilename.replace('public', '');
							var fileObj = ({fullFilepath: fullFilename, filename: json[0].name, timestamp: new Date()});

							self.uploadFiles.forEach( function(uploadFile, index){
								if (uploadFile.filename == fileObj.filename){
									self.uploadFiles.splice(index, 1);
								}
							});
							self.uploadFiles.push(fileObj);
							QuestCMS.Utils.showAlert('Success', 'File upload successful');
							self.showUploadedFiles();
            },
            error: function (err) {
              QuestCMS.Utils.showAlert('Error', 'File upload failed');
            }
          });
        });
			},
			showSubmittedFiles: function () {
				this.uploadFiles = [];
				var self = this;
				$.ajax({
					type: 'GET',
					dataType: 'json',
					url: QuestCMS.Utils.setAPIUrl() + '/file',
					data: {action: 'findFilesByFolder', path: 'data/vendorFiles/' + self.model.getId(), filenames: self.model.getFilenames()},
					headers: QuestCMS.headers,
					success: function (files) {
						self.uploadFiles = files;
						self.showUploadedFiles();
					},
					error: function (err) {
						var errMsg = "Haven't find files";
						if (err.responseText !== "" ) {
							errMsg = err.responseText;
						}
						QuestCMS.Utils.homepageAlert('Error', errMsg);
					}
				});
			},
			showUploadedFiles: function () {
				var self = this;

				$('tbody.submittedFiles', self.el).empty();
				var tr = '';
				if (this.uploadFiles && this.uploadFiles.length > 0) {
					this.uploadFiles.forEach( function (uploadFile) {
						var filename = uploadFile.filename;
						var filepath = uploadFile.fullFilepath;
						var deleteButton = '<span class="glyphicon glyphicon-remove-circle deleteItem canClick" data-target="' + filename + '" data-filepath="' + filepath + '"  style="color:red"></span>';
						var documentDate = new Date(uploadFile.timestamp).toDateFormat('yyyy-MM-dd') || 'N/A';
						var documentTime = new Date(uploadFile.timestamp).toDateFormat('HH:mm') || 'N/A';
							tr = '<tr><td><a href="#" class="filepath" data-value="data/vendorFiles/' + self.model.getId() + '/' + filename + '">' + filename + '</a></td><td>' + documentDate + '</td><td>' + documentTime + '</td><td>' + deleteButton + '</td></tr>';

							$('tbody.submittedFiles', self.el).append(tr);
						});
				}
				$("#uploadedFiles", self.el).trigger("update");

			},
			viewFile: function (e) {
				e.preventDefault();

				var filepath = $(e.currentTarget).data('value');
				var filename = $(e.currentTarget).text();
				filename = (filename.indexOf('.') != -1) ? filename.substring(0, filename.indexOf('.')) : filename;

				var url = QuestCMS.Utils.setAPIUrl() + '/file?action=getFileByFullPath&filename=' + filename + '&fullFilepath=' + filepath;
				window.open(url,'_blank');
			},
			deleteItem: function(e){
				var self = this;
				var filename = $(e.target).data('target');
				var path = $(e.target).data('filepath');

				this.uploadFiles.forEach( function(uploadFile, index){
					if(uploadFile.filename == filename){

						$.ajax({
							type: 'DELETE',
							dataType: 'json',
							url: QuestCMS.Utils.setAPIUrl() + '/file/' + filename,
							data: {userId: self.model.getId(), filename: filename, fullFilepath: path},
							headers: QuestCMS.headers,
							success: function () {
								QuestCMS.Utils.showAlert('Success', 'File Deleted.');
								self.uploadFiles.splice(index, 1);
								self.showUploadedFiles();
							},
							error: function (err) {
								var errMsg = "Haven't delete files";
								if (err.responseText != "" ) {
									errMsg = err.responseText;
								}
								QuestCMS.Utils.showAlert('Error', errMsg);
							}
						});
					}
				});
			},
			prepareForm: function () {
				var self = this;
				var remarks = this.model.getRemarks();
				var contract = this.model.getContract();
				var contactList = this.model.getContactList();
				var data = QuestCMS.Utils.prepareLoadJSONData(this.model.toJSON());

				this.changeRegion();
				this.importFiles();

        if (contactList.length > 0) {
					contactList.forEach(function (contact) {
						QuestCMS.Utils.addTableRowByjQuery('contactList', contact, self);
					});
        } else {
          $('.addContact', this.el).click();
        }

				if(contract.startDate && contract.startDate !== ''){
					var startDate = new Date(contract.startDate).toDateFormat('yyyy-MM-dd');
					data['contract.startDate'] = startDate;
				}
				if(contract.endDate && contract.endDate !== ''){
					var endDate = new Date(contract.endDate).toDateFormat('yyyy-MM-dd');
					data['contract.endDate'] = endDate;
				}

				var outputRemark = remarks.join('\n');
				data.remarks = outputRemark;
				$('form', this.el).loadJSON(data);

				$('form input[data-toggle="floatLabel"]', this.el).each(function () {
					$(this, self.el).attr('data-value', $(this).val());
				});

				this.categories.forEach(function (category) {
					var selected = '';
					if (self.model.getCategoryId()._id == category.getId()) {
						selected = 'selected';
					}
					var option = '<option value="' + category.getId() + '" data-category="' + category.getName().substring(0, 1) + '"' + selected + '>' + category.getName() + '</option>';
					$('.categoriesList', self.el).append(option);
				});

				$("#uploadedFiles", this.el).tablesorter({
					theme: 'default',
					widthFixed: true,
					widgets: ['zebra']
				}).tablesorterPager({
					container: $("#pager", this.el),
					page: 0,
					size: 5,
					output: '{startRow} to {endRow} ({totalRows})'
				});
			},
			showDatepicker: function () {
				$('input.cooperationDate').datepicker({
					autoSize: false,
					dateFormat: 'yy-mm-dd',
					changeMonth: true,
					changeYear: true
					// minDate: new Date()
				});
			}
    });

    var ModuleViewAllVendorsInventoryItemView = Backbone.Marionette.ItemView.extend({
      onShow: function () {
        this.prepareForm();
				if (this.model.get('replenishmentLevel') && (this.model.get('replenishmentLevel') >= this.model.get('quantity'))) {
					$('.quantity', this.el).addClass('overReplenishmentLevel');
				}
      },
			tagName: 'tr',
      template: _.template(tplViewAllVendorsInventoryItemView),
      events: {
        'click .editVendor' : 'edit'
      },
      edit: function () {
        displayCreateVendorItemView({model: this.model, afterEdit: displayViewAllVendorsInventoryCompositeView});
      },
      prepareForm: function () {
				$('.receivedGift', this.el).hide();

				if (QuestCMS.user.isGotThisVendorGift({vendorId: this.model.getId()}) && QuestCMS.user.isExistingVendor({vendorId: this.model.getId()})) {
					$('.receivedGift', this.el).show();
				}
      }
    });


    var ModuleCreateVendorCategoryItemView = Backbone.Marionette.ItemView.extend({
      onRender: function () {
        this.prepareForm();
      },
			tagName: 'tr',
      template: _.template(tplCreateVendorCategoryItemView),
      events: {
				'click .isActive'	: 'setActive',
				'change'					: 'change'
      },
			change: function (e) {
				e.preventDefault();

        var input = {target: e.target};
        var change = QuestCMS.Utils.inputChange(input);
				this.model.set(change, {silent: true});
			},
			setActive: function (e) {
				e.preventDefault();

				this.model.setIsActive();
				this.changeLabelAndButton();
				this.render();
			},
			changeLabelAndButton: function () {
				if (this.model.isActive()) {
					$('.isActive', this.el).removeClass('btn-primary').addClass('btn-danger');
					$('.isActive', this.el).html('In Active')
					$('.status', this.el).html('Active');
				} else {
					$('.isActive', this.el).removeClass('btn-danger').addClass('btn-primary');
					$('.isActive', this.el).html('Active')
					$('.status', this.el).html('In Active');
				}
			},
      prepareForm: function () {
				this.changeLabelAndButton();
      }
    });

		var ModuleShowVendorDetailsView = Backbone.Marionette.ItemView.extend({
			template: _.template(tplShowVendorDetailsView),
			onRender: function () {
				var self = this;
				$('#vendorDetails', this.el).hide();

				QuestCMS.Utils.autocomplete({
					placeholder: '#vendorId',
					el: self.el,
					url: QuestCMS.Utils.setAPIUrl() + '/vendor?action=findByUniveralSearch&universalSearch=',
					limit: 10,
					minLength: 1,
					label: 'chiCompanyName,engCompanyName',
					value: 'chiCompanyName',
					select: function (event, ui) {
						var item = ui.item.json;
						$('#vendorDetails', self.el).show();
						$('#vendorDetails', self.el).loadJSON(item);
						self.model.set({vendorId: item._id, vendorCode: item.vendorCode}, {silent: true});

					}
				});

			},
			events: {
				'change #vendorId' : 'searchItem'
			},
			changeRegion: function (item) {
				var self = this;
				var information = item.getInformation();
				var district = $('#address-district', this.el).val();
				var lang = (QuestCMS.Cookie.isChi()) ? 'chiName' : 'engName';
				$('#address-region', this.el).find('option').remove();

				QuestCMS.Utils.getRegionSelection(function (region, index) {
          var selected = '';
					if (region.code == information.region) {
						selected = 'selected';
					}
					if (region.district == district) {
						var option = '<option value="'+ region.code +'" ' + selected + ' >'+ QuestCMS.l(region[lang]) + '</option>';
						$('#address-region', self.el).append(option);
					}
        });
			},
			searchItem: function (e) {
				e.preventDefault();
				var self = this;
				var vendorId = $('#vendorId').val();

				fetch({universalSearch: vendorId, action: 'findByUniveralSearch'}, function (err, items) {
					if (err) {
						QuestCMS.Utils.showAlert('Error', 'There is no item');
					} else if (items.length == 1) {
						var item = items.at(0);
						$('#vendorDetails', self.el).show();
						var data = QuestCMS.Utils.prepareLoadJSONData(item.toJSON());
						$('#vendorDetails', self.el).loadJSON(data);
						self.changeRegion(item);
						self.model.set({vendorId: item.getId(), vendorCode: item.getVendorCode()}, {silent: true});
					}
				});
			}
		});

		var ModuleSelectedVendorAndItemView = Backbone.Marionette.ItemView.extend({
			initialize: function () {
				this.collection = this.collection || this.options.collection;
				this.model.set({order: this.collection.length}, {silent: true});
			},
			template: _.template(tplSelectedVendorAndItemView),
			tagName: 'tr',
			events: {
				'click .deleteItem' : 'deleteItem'
			},
			deleteItem: function (e) {
				e.preventDefault();

				this.collection.remove(this.model);
			}
		});

    var ModuleViewJoinedClubsView = Backbone.Marionette.ItemView.extend({
			initialize: function () {
				Backbone.history.navigate('vendor/joinedClubs');
        this.user = this.options.user;
			},
      template: _.template(tplShowJoinedClubView),
      onRender: function () {
				var self = this;
        $(document).scrollTop(0);
      },
			onShow: function () {
				var self = this;

				var joinedClubs = this.user.getVendors();
				joinedClubs.forEach(function(joinedClub, index){

					var registrationDate = new Date(joinedClub.registrationDate);
					registrationDate = registrationDate.toDateFormat('yyyy-MM-dd');
					var club = '<tr><td><b>' + joinedClub.engName + ' ' + joinedClub.chiName + '</b></td><td><b>' + registrationDate + '</b></td></tr>';

					$('.questcms-joinedclubs', self.el).append(club);
				});

				$("#clubList").tablesorter({
						theme: 'default',
						widthFixed: true,
						widgets: ['zebra']
				}).tablesorterPager({
						container: $("#clubListpager"),
						page: 0,
						size: 20,
						output: '{startRow} to {endRow} ({totalRows})'
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
	var ModuleViewAllVendorsInventoryCompositeView = Backbone.Marionette.CompositeView.extend({
      initialize: function () {
				Backbone.history.navigate('vendor/findAll');

        this.page = this.options.page;
        this.start = (this.page - 1) * pageSize ;
        this.end = this.page * pageSize;

        this.totalCount = this.options.totalCount;
				this.categories = this.options.categories;
        this.noOfAppointments = this.options.noOfAppointments;
      },
      itemView: ModuleViewAllVendorsInventoryItemView,
      template: _.template(tplViewAllVendorsInventoryListView),
      appendHtml: function (collectionView, itemView, index) {
        //if ((this.start <= index) && (index < this.end)) {
          collectionView.$(".questcms-vendors").append(itemView.el);
        //}
      },
      onRender: function () {
        if (configs[module]['showPaginator']) {
          this.showPaginator();
        }
				$('[data-toggle="floatLabel"]', this.el).attr('data-value', '');
				this.createVendorCategoriesList();
        $('#noOfAppointments', this.el).text(this.noOfAppointments);
        $(document).scrollTop(0);

      },
			onShow: function () {
        this.showFilterItemCount();
				this.ladda = ladda.create( document.querySelector('.ladda-button') );
        $('form', this.el).loadJSON(searchTerms);

				$("#vendorTable").tablesorter({
					theme: 'default',
					widthFixed: true,
					widgets: ['zebra']
				}).tablesorterPager({
					container: $("#pager"),
					page: 0,
					size: 20,
					output: '{startRow} to {endRow} ({totalRows})'
				});
				if(searchTerms.replanishment == true){
					$('.refill').addClass('btn-danger').removeClass('btn-success');
				}
			},
			events: {
        'change form' 											: 'change',
				'reset'  														: 'reset',
				'keyup [data-toggle="floatLabel"]'	: 'floating',
				'change [data-toggle="floatLabel"]'	: 'floating',
				'mousedown .vendorCategory'					: 'selectCategory',
				'mousedown .refill'									: 'replenishment',
				'submit' 														: 'submit'
			},
			floating: function (e) {
				e.preventDefault();
				$(e.currentTarget).attr('data-value', $(e.currentTarget).val());
			},
      change: function (e) {
        e.preventDefault();
        var name = $(e.target).prop('name');
        searchTerms[name] = $(e.target).val().trim();
      },
      selectCategory: function (e) {
        e.preventDefault();
				//searchTerms.page = 1;

				if (searchTerms['categoryId'] == $(e.currentTarget).val()) {
					delete searchTerms['categoryId'];
				} else {
					searchTerms['categoryId'] = $(e.currentTarget).val();
				}
				filter(searchTerms);
      },
			replenishment: function(){
				if( $('.refill').hasClass('btn-danger')){
					$('.refill').addClass('btn-success').removeClass('btn-danger');
					searchTerms.replanishment = false;
				} else {
					$('.refill').addClass('btn-danger').removeClass('btn-success');
					searchTerms.replanishment = true;
				}
				filter(searchTerms);

			},
      createVendorCategoriesList: function () {
				var self = this;

				this.categories.forEach(function (category) {
					if (searchTerms['categoryId'] != category.getId()) {
						var button = '<button class="btn btn-md btn-default vendorCategory col-md-3" value="' + category.getId() + '">' + QuestCMS.l(category.getName()) + '</button>';
					} else {
						var button = '<button class="btn btn-md btn-primary vendorCategory col-md-3" value="' + category.getId() + '">' + QuestCMS.l(category.getName()) + '</button>';
					}
					$('.vendorCategoriesList', self.el).append(button);
				});
      },
      reset: function (e) {
        searchTerms = {};
				$('.refill').addClass('btn-success').removeClass('btn-danger');
      },
			submit: function(e) {
        e.preventDefault();
				var self = this;
				if (!self.ladda.isLoading()) {
					self.ladda.start();
					for (prop in searchTerms){
						if(searchTerms[prop] == ""){
							delete searchTerms[prop];
						}
					}
					//searchTerms.page = 1;
					filter(searchTerms);
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
        $(".filter_count", this.el).html(' - ' + this.totalCount);
      }
    });

	var ModuleCreateVendorCategoryCompositeView = Backbone.Marionette.CompositeView.extend({
      initialize: function () {
				Backbone.history.navigate('vendor/createVendorCategory');

        this.page = this.options.page;
        this.start = (this.page - 1) * pageSize ;
        this.end = this.page * pageSize;

        this.totalCount = this.options.totalCount;
      },
      itemView: ModuleCreateVendorCategoryItemView,
      template: _.template(tplCreateVendorCategoryCompositeView),
      appendHtml: function (collectionView, itemView, index) {
        // if ((this.start <= index) && (index < this.end)) {
          collectionView.$(".questcms-vendorCategory").append(itemView.el);
        // }
      },
      onRender: function () {
        if (configs[module]['showPaginator']) {
          this.showPaginator();
        }
        $(document).scrollTop(0);
      },
			onShow: function () {
        this.showFilterItemCount();
				this.saveButton = ladda.create( document.querySelector('.category-submit') );
        $('form', this.el).loadJSON(searchTerms);
			},
			events: {
        'click .add-category' 		: 'add',
        'click .category-cancel'  : 'cancel',
        'click .category-submit'  : 'submit'
			},
      add: function (e) {
        e.preventDefault();

				var newCategory = new CategoryItem();
				this.collection.add(newCategory);
      },
			cancel: function (e) {
				e.preventDefault();

				QuestCMS.vent.trigger('administration:display');
			},
			submit: function(e) {
        e.preventDefault();
				var self = this;

				if (!self.saveButton.isLoading()) {
					self.saveButton.start();

					this.collection.save(function (err) {
						if (err) {
							QuestCMS.Utils.showAlert('Error', "There are a problem during saving vendor categories.");
							self.saveButton.stop();
						} else {
							QuestCMS.Utils.showAlert('Success', 'Saved successful.')
							self.saveButton.stop();
							QuestCMS.vent.trigger('administration:display');
						}
					});
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
        $(".filter_count", this.el).html(' - ' + this.totalCount);
      },
    });


	var ModuleSelectVendorAndItemCompositeView = Backbone.Marionette.CompositeView.extend({
      initialize: function () {
				this.member = this.options.options.model;
        this.totalCount = this.options.totalCount || this.collection.length;
				this.afterEdit = this.options.afterEdit || goToAdminPage;
      },
      itemView: ModuleSelectedVendorAndItemView,
			itemViewOptions: function (model, index) {
				return {
					collection: this.collection
				}
			},
      template: _.template(tplSelectVendorAndItemCompositeView),
      appendHtml: function (collectionView, itemView, index) {
        collectionView.$(".selectedVendorItem").append(itemView.el);
      },
      onRender: function () {
				var self = this;
        $(document).scrollTop(0);
      },
			onShow: function () {
				this.saveButton = ladda.create( document.querySelector('.category-submit') );
			},
			collectionEvents: {
				'remove' : 'collectionRemoved'
			},
			events: {
        'click .category-cancel'  : 'cancel',
				'change #code' 						: 'searchItem',
        'click .confirm' 					: 'confirm',
				'click .afterConfirm'			:	'afterConfirm',
				'click .printList'				: 'printList'
			},
			afterConfirm: function (e) {
				e.preventDefault();
			},
			collectionRemoved: function () {
				this.render();
			},
			cancel: function (e) {
				e.preventDefault();

				this.afterEdit();
			},
			searchItem: function (e) {
				e.preventDefault();
				var self = this;
				var options = {};
				var code = $('#code', this.el).val();
				if (code == '999'){
					fetch({action: 'findVendorAndItemByVendorService', vendorService: 'Info Easy'}, function (err, vendors) {
						if (err) {
							QuestCMS.Utils.showAlert('Error', 'There is no item');
						} else {
							$(e.target).val('');
							vendors.each(function (vendor, index) {
								if (vendor.get('item') && vendor.get('item').quantity > 0) {
									if (!self.member.isGotThisVendorGift(vendor.get('item'))) {
										self.collection.add(vendor);
									} else {
										QuestCMS.Utils.showAlert('Error', "This member already get this vendor's item");
									}
								} else {
									QuestCMS.Utils.showAlert('Error', 'This vendor has no item');
								}
							});
						}
					});
				} else {
					fetch({code: code, action: 'findVendorAndItemByCode'}, function (err, vendors) {
						if (err) {
							QuestCMS.Utils.showAlert('Error', 'There is no item');
						} else {
							$(e.target).val('');
							var vendor = vendors.at(0);
							if (vendor.get('item') && vendor.get('item').quantity > 0) {
								if (!self.member.isGotThisVendorGift(vendor.get('item'))) {
									self.collection.add(vendor);
								} else {
									QuestCMS.Utils.showAlert('Error', "This member already get this vendor's item");
								}
							} else {
								QuestCMS.Utils.showAlert('Error', 'This vendor has no item');
							}
						}
					});
				}
			},
			printList: function(){
				var vendors = this.collection;
				QuestCMS.vent.trigger("export:displayPDF", {collection: vendors, member: this.member});

			},
			confirm: function(e) {
        e.preventDefault();
				var self = this;
				var items = this.collection.getItem();

				var _callback = function (err, errMsg) {
					if (err) {
						QuestCMS.Utils.showAlert('Error', errMsg);
					} else {
						self.member.joinVendor(self.collection.toJSON(), function (existError) {
							if (existError) {
								QuestCMS.Utils.showAlert('Error', 'err');
							} else {
								QuestCMS.Utils.showAlert('Success', 'Stock out successful');
								$('.afterConfirm', self.el).click();
							}
						});
					}
				};
				QuestCMS.vent.trigger('inventory:stockOutItemAfterScanBarcode', {items: items, callback: _callback});
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
      QuestCMS.Utils.setSiteTitle(QuestCMS.l('Vendor'));
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
      displayCreateVendorItemView();
    };

    var displayCreateVendorItemView = function (options) {
      options = options || {};

			findCategoriesList({action: 'findAllActiveCategories'}, function (err, categories) {
				if (err) {
					var errmsg = "Haven't find the categories list.";
					if (err.responseText !== '') {
						errmsg = err.responseText;
					}
					QuestCMS.Utils.showAlert('Error', errmsg);
				} else {
          if (!options.model) {
            options.model = new ModuleItem();
          }
					var view = new ModuleCreateVendorItemView({model: options.model, categories: categories, afterEdit: options.afterEdit});
					QuestCMS.layout[configs[module]['region']].show(view);
				}
			});
    };

    var displayViewAllVendorsInventoryCompositeView = function (options) {
      options = options || {};
			options.action = 'findAllVendorsWithInventory';

			fetch(options, function (err, vendors, response) {
				if (err) {
          var errmsg = 'There are no vendors.';
          if (response.responseText !== '') {
            errmsg = response.responseText;
          }
          QuestCMS.Utils.showAlert('Error', errmsg);
				} else {
					showViewAllVendorsInventoryCompositeView({iosOverlay: iosOverlay});
				}
			});
    };

		var displayShowVendorDetailsView = function (options) {
			options = options || {};

			if (!options.model) {
				options.model = new ModuleItem();
			}

			var view = new ModuleShowVendorDetailsView({model: options.model});
			if (options.placeholder) {
					$(options.placeholder).html(view.render().el);
			} else {
					QuestCMS.layout[configs[module]['region']].show(view);
			}
		};

		var searchVendorAndItem = function (options) {
			options = options || {};

			if (!options.collection) {
				options.collection = new ModuleCollection();
			}

			var view = new ModuleSelectVendorAndItemCompositeView({collection: options.collection, options: options});
			if (options.placeholder) {
					$(options.placeholder).html(view.render().el);
			} else {
					QuestCMS.layout[configs[module]['region']].show(view);
			}
		};

		var findCategoriesList = function (options, callback) {
			options = options || {};
			options.action = options.action || 'findAllCategories';

			$.ajax({
				type: 'GET',
				dataType: 'json',
				url: QuestCMS.Utils.setAPIUrl() + '/vendorCategory',
				data: options,
				success: function (categories) {
					callback(null, new CategoryCollection(categories));
				},
				error: function (err) {
					callback(err, null);
				}
			});
		};

    var filter = function (options) {
      options = options || {};
      // options.page = options.page || 1;
			options.action = 'findAllVendorsWithInventory';

      if (cachedCollection) {
        cachedCollection = null;
      }

      fetch(options, function (err, cachedCollection, response) {
        if (err) {
          QuestCMS.Utils.showAlert('Error', err.responseText);
        } else {
			    showViewAllVendorsInventoryCompositeView();
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
					action: options.action || 'findAllActiveAndPublishVendors'
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

	var showViewAllVendorsInventoryCompositeView = function (options) {
		options = options || {};

		findCategoriesList({action: 'findAllActiveCategories'}, function (err, categories, response) {
			if (err) {
				var errMsg = "Haven't find the categories list.";
				if (response.responseText !== "" ) {
					errMsg = response.responseText;
				}
				QuestCMS.Utils.showAlert('Error', errMsg);
			} else {
				QuestCMS.vent.trigger('appointment:getTodayAppointments', function(err, appointments, response) {
					if (err) {
						var errMsg = "There are some errors during find today appointments.";
						if (response.responseText !== "" ) {
							errMsg = response.responseText;
						}
						QuestCMS.Utils.showAlert('Error', errMsg);
					} else {
						var view = new ModuleViewAllVendorsInventoryCompositeView({collection: cachedCollection, totalCount: cachedCollection.length, categories: categories, noOfAppointments: appointments.length});
						QuestCMS.layout[configs[module]['region']].show(view);
					}
				});
			}
		});
	};

	var showJoinedClubs = function (options) {
		options = options || {};

    options.user = options.user || QuestCMS.user;
		var view = new ModuleViewJoinedClubsView(options);
		QuestCMS.layout[configs[module]['region']].show(view);
	};

	var showCreateVendorCategoryCompositeView = function () {
		findCategoriesList({}, function (err, categories) {
			if (err) {
				var errMsg = "Haven't find the categories list.";
				if (err.responseText != "" ) {
					errMsg = err.responseText;
				}
				QuestCMS.Utils.showAlert('Error', errMsg);
			} else {
				var view = new ModuleCreateVendorCategoryCompositeView({collection: categories, totalCount: collection.length});
				QuestCMS.layout[configs[module]['region']].show(view);
			}
		});
	};

    var goToAdminPage = function () {
        QuestCMS.vent.trigger('administration:display');
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
    return Vendor;

});
