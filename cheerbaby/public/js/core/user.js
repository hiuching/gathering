/*********************************************
 * User module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

;define([
  "marionette",
	"async",
	"ladda",
	"birthdayPicker",
  "encryption",
  "core/admin",
  "core/adminmenu",
  "text!tpl/user.html",
	"spin"
],

function (Marionette, async, ladda, birthdayPicker, encryption, Admin, AdminMenu, templateString) {


/*********************************************
 * Templates
 *********************************************/
    var tplEditView = $('#ItemEdit', '<div>' + templateString + '</div>').html();
    var tplLoginFormView = $('#FormView', '<div>' + templateString + '</div>').html();
    var tplEmailEditView = $('#EmailEdit', '<div>' + templateString + '</div>').html();
    var tplSignUpFormView = $('#SignUpFormView', '<div>' + templateString + '</div>').html();
    var tplReviewSubmittedFiles = $('#ReviewSubmittedFiles', '<div>' + templateString + '</div>').html();
    var tplReviewUserJoinedClubsView = $('#ReviewUserJoinedClubCompositeView', '<div>' + templateString + '</div>').html();
    var tplReviewUserJoinedClubItemView = $('#ReviewUserJoinedClubItemView', '<div>' + templateString + '</div>').html();
    var tplStepFlowView = $('#StepFlowView', '<div>' + templateString + '</div>').html();
    var tplShowUserDetailView = $('#ShowUserDetail', '<div>' + templateString + '</div>').html();
    var tplSearchUserView = $('#SearchUserView', '<div>' + templateString + '</div>').html();
    var tplAssignAdminModalView = $('#AssignAdminModalView', '<div>' + templateString + '</div>').html();

		/* Refactored */
    var tplCompositeView = $('#CompositeView', '<div>' + templateString + '</div>').html();
    var tplSearchUserRegion = $('#SearchUserRegion', '<div>' + templateString + '</div>').html();
    var tplDisplayUserRegion = $('#DisplayUserRegion', '<div>' + templateString + '</div>').html();

/*********************************************
 * Configurations
 *********************************************/
    var module = "user";
    var configs = {};

    var limit, pageSize, pageCount, sectionStart = 1, sectionEnd = 1, lastPage, currentPage, lang;
    var nextkey = "", startkey = "";
    var cachedCollection;
		var searchTerms = {};
    var userIdAttribute = "_id";
    var minPasswordLength = 6;
    var isCardShown = false;
		var registerMaxDate = getLastDayOfMonth(6);
		var registerMinDate = new Date('2015-01-01');
		var firstDateOfThisMonth = moment().startOf('month').format('YYYY-MM-DD');
		var newRegion, UserRegion;

/*********************************************
 * Main function (export)
 *********************************************/

    var User = function () {
      var self = this;
      configs[module] = {
        authenticaionURL: 'login',
        checkActivation: false,
        isCachedCollection: false,
        itemPerRow: 1,
        numOfRow: 10,
        pagePerSection: 10,
        showPaginator: true,
        useAmazon: true,
        sendSMS: true,
        dataType: module,
        region: 'contentRegion'
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());
      pageSize = configs[module]['itemPerRow'] * configs[module]['numOfRow'];
      limit = pageSize * configs[module]['pagePerSection'] + 1;
      // console.log('configs', configs[module]);


      /*********************************************
       * Listening events
       *********************************************/


      /* common events */
      QuestCMS.vent.on("layout:rendered", function () {
      });


      QuestCMS.vent.on("languagemenu:switch", function () {
        cachedCollection = new ModuleCollection();
      });


      QuestCMS.vent.on("pubsub:started", function () {
        /* uncomment the following line to include in search result */
        //QuestCMS.Pubsub.subscribe("search:start", module, search);
        QuestCMS.Pubsub.subscribe("admin:list:start", module, adminliststart);
      });


      QuestCMS.vent.on(module + ":resolve", function (alias) {
        resolve(alias);
      });


      /* authentication events */

      QuestCMS.vent.on(module + ":authenticate", function (options) {
        authenticate(options);
      });

      QuestCMS.vent.on(module + ":authenticateVerificationCode", function (options) {
        authenticateVerificationCode(options);
      });

      QuestCMS.vent.on(module + ":resetPassword", function (options) {
        resetPassword(options);
      });

      QuestCMS.vent.on(module + ":logout", function () {
        logout();
      });

      QuestCMS.vent.on(module + ":changeVerified", function (options) {
        changeVerified(options);
      });

      /* events trigger by other modules */
      QuestCMS.vent.on(module + ":displayLoginForm", function () {
        displayLoginForm();
      });

      QuestCMS.vent.on(module + ":displayChangePasswordForm", function (options) {
        displayChangePasswordForm(options);
      });

      QuestCMS.vent.on(module + ":searchUsers", function (options) {
				searchUsers(options);
      });

      QuestCMS.vent.on(module + ":universalSearchUsers", function (options) {
				universalSearchUsers(options);
      });

      /* events trigger by this modules*/

      QuestCMS.vent.on(module + ":display", function (options) {
        options = options || {};
        var page = options.page || 1;
        QuestCMS.Cookie.set({module: module, page: page});
        var alias = QuestCMS.Cookie.get("alias");
        Backbone.history.navigate(alias);
        display({page: page});
      });

      QuestCMS.vent.on(module + ":displayUserProfile", function (options) {
				var view = new ModuleEditView({model: options.model, afterEdit: options.afterEdit, review: options.review});
				options.callback(null, view);
      });

      QuestCMS.vent.on(module + ":showVendorList", function (options) {
				var  collection = new UserJoinedClubsCollection(options.model.getVendors());
				var view = new ModuleReviewUserJoinedClubsView({collection: collection, userName: options.model.getFullName()});
				options.callback(null, view);
      });

      QuestCMS.vent.on(module + ":edit", function (options) {
        edit(options);
      });

      QuestCMS.vent.on(module + ":reviewUser", function (options) {
				options = options || {};
        if(options.model){
					options.model = new ModuleItemView(options.model);
					edit(options);
				}
      });

      QuestCMS.vent.on(module + ":showUserDetailsView", function (options) {
				showUserDetailsView(options);
      });

      QuestCMS.vent.on(module + ":hide", function () {
        hide();
      });


      QuestCMS.vent.on(module + ":hide:card", function () {
        hideCard();
      });


      QuestCMS.vent.on(module + ":init", function (options) {
        if (options.json && options.callback) {
          var user = initUser(options.json);
          options.callback(null, user);
        } else {
          options.callback('no json');
        }
      });



      QuestCMS.vent.on(module + ":printLabel", function (options) {
			options = options || {};
				fetch({id: options.id, action: 'id'}, function (err, users, response) {
					if (err) {
						QuestCMS.Utils.showAlert('Error', ((response.responseText && response.responseText !== '') ? response.responseText : 'No this user'));
					} else {
						var user = users.at(0);
						noOfLabel = options.noOfLabel || 0;
						user.save({action: 'printLabel', noOfLabel: noOfLabel}, {
							success: function () {
								QuestCMS.Utils.showAlert('Success', 'The label is printing. Please wait a moment.');
							},
							error: function () {
								QuestCMS.Utils.showAlert('Error', "Can't print label");
							}
						});
					}
				});

			});

      QuestCMS.vent.on(module + ":login", function () {
        showCard();
      });

      QuestCMS.vent.on(module + ":reset", function () {
        reset();
      });

      QuestCMS.vent.on(module + ":show:card", function () {
        showCard();
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
			if (decision  == 'bookAppointment') {
				QuestCMS.vent.trigger('appointment:displayBookAppointmentView');
			} else if (decision == 'searchBarcode') {
				searchBarcodeView();
			} else if (decision == 'signUp') {
				displaySignUpForm();
			} else if (decision  == 'verification') {
				authenticateVerificationCode(alias);
			} else if (decision  == 'edit') {
				edit({model: QuestCMS.user});
			} else if (decision  == 'profile') {
				edit({model: QuestCMS.user});
			} else if (decision  == 'changePassword') {
				displayChangePasswordForm();
			} else if (decision  == 'search') {
				displayUserCompositeView();
			} else if (decision  == 'logout') {
				logout();
			} else {
				edit({model: QuestCMS.user});
			}
		} else {
			edit({model: QuestCMS.user});
		}
	};





/*********************************************
 * Backbone Model
 *********************************************/
    var UserJoinedClubItem = Backbone.Model.extend({
      initialize: function () { this.options = configs; },
      urlRoot: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType']; },
      idAttribute: '_id',

      getVendorId: function () {
        return this.get('vendorId') || '';
      },
      getVendorName: function () {
        return this.get('vendorName') || '';
      },
      getRegistrationDate: function () {
        return this.get('registrationDate')  || '';
      },
      isReceivedGift: function () {
        return this.get('receivedGift') || false;
      },
			setReceivedGift: function () {
				var receivedGift = this.isReceivedGift();

				var received = (receivedGift) ? false : true;
				this.set({receivedGift: received});
			}
    });

    var ModuleItem = Backbone.Model.extend({
      initialize: function () { this.options = configs; },
      urlRoot: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/' + module; },
      idAttribute: '_id',
			defaults: {

			},
      validation: {
				'address.line1': { required: true },
				'address.line2': { required: true },
				'address.district': { required: true },
				'address.region': { required: true },
				'address.country': { required: true },
				'baby.bornType': { required: true },
				'baby.EDD': { required: true },
				'baby.hospitalType': { required: true },
				email: { required: true },
				// files: { required: true },
				files: function (files) {
          if (files.length == 0) {
            return 'Please submit EDD file';
          }
        },
        firstName: { required: true },
				HKID: function(HKID){
					if (!isHKID(HKID)){
						return QuestCMS.l('invaild HKID');
					// } else {
          //   checkDuplicateHKID({HKID: HKID, userId: QuestCMS.user.getId()}, function (err) {
          //     console.log('checkDuplicateHKID', HKID, err);
          //     if (err) {
          //       return QuestCMS.l('This HKID have be used');
          //     }
          //   });
          }
				},
        interestedTypes: { required: true },
        lastName: { required: true },
				phone: { required: true, pattern: 'number' }
      },
			isValidAccount: function () {
				var self = this,
						isValid = true;
				var checkList = ['email', 'firstName', 'HKID', 'lastName', 'phone', 'baby', 'files', 'address', 'interestedTypes'];

				checkList.forEach( function(prop) {
					var item = self.get(prop);

					switch (prop) {
						case 'baby':
							var schema = ['EDD', 'hospitalType', 'bornType'];
							for (var ii = 0; ii < schema.length; ii++) {
								if (!item[schema[ii]] || item[schema[ii]] == '') {
									isValid = false;
									return false;
								}
							}
							break;
						case 'address':
							var schema = ['line1', 'line2', 'district', 'region', 'country'];
							for (var ii = 0; ii < schema.length; ii++) {
								if (!item[schema[ii]] || item[schema[ii]] == '') {
									isValid = false;
									return false;
								}
							}
							break;
						default:
							if (item === '' || item === []) {
								isValid = false;
							}
							break;
					}
				});
				return isValid;
			},
      allowEdit: function (user) {
        var result = false;
        var userRoles = user.getRoles();
        userRoles.forEach(function (userRole) {
          if (userRole == "APAO Admin") {
            result = true;
          }
        });
        return result;
      },
      activateAccount: function () {
        this.setIsActivated();
        this.clearVerificationCode();
      },
			appendDOB: function () {
        var suffix = ' 08:00:00';
        var DOB = (this.get('DOB').length == 10) ? this.get('DOB') + suffix : this.get('DOB');
        this.set({DOB: DOB});
			},
			beforeSave: function () {
				this.appendDOB();
			},
      clearVerificationCode: function () {
        this.set({verificationCode: {}});
      },
			getAddress: function () {
				return this.get('address') || '';
			},
      getAdminRoles: function () {
        return this.get('adminRoles') || [];
      },
			getCode: function () {
				return this.get('code') || '';
			},
      getDOB: function () {
        return this.get('DOB') || '';
      },
			getBaby: function () {
				return this.get('baby') || {};
			},
			getEmail: function () {
				return this.get('email');
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
			getFormatDOB: function () {
			  var dob = this.get('DOB') || '';
				if (dob !== '') {
				  var d = new Date(dob);
					dob = d.toDateFormat('yyyy-MM-dd');
				}
				return dob;
			},
			getFullName: function () {
        var name = this.get('lastName') + ', ' + this.get('firstName');
        return name.trim();
      },
			getGender: function () {
				return this.get('gender') || '';
			},
			getHKID: function () {
        return this.get('HKID') || '';
			},
			getInterestedTypes: function () {
				return this.get('interestedTypes') || [];
			},
      getId: function (){
        return this.get('_id') || null;
      },
			getInterestedOther: function () {
        return this.get('interestedOther') || '';
      },
			getNoOfBabies: function () {
				return this.get('noOfBabies') || [];
			},
      getPhone: function () {
        return this.get('phone') || '';
      },
      getRoles: function () {
        return this.get('roles') || [];
      },
      getType: function () {
        return this.get('_type') || '';
      },
      getUsername: function () {
        return this.get('username') || '';
      },
			getVendors: function () {
				return this.get('vendors') || [];
			},
      getValueByField: function (name) {
        return this.get(name) || '';
      },
      isActive: function () {
        return this.get('active');
      },
      isActivated: function () {
        return this.get('activated');
      },
      isAdmin: function () {
        return (this.getAdminRoles().length > 0);
      },
      isSameUser: function (user) {
        if (user) {
          return this.getId() == user.getId();
        } else {
          return false;
        }
      },
			isExistingVendor: function (newVendor) {
				var vendors = this.getVendors();
				var exists = false;

				vendors.forEach(function (vendor) {
					if (vendor.vendorId == newVendor.vendorId) {
						exists = true;
					}
				});

				return exists;
			},

			isGotThisVendorGift: function (newItem) {
				var vendors = this.getVendors();
				var got = false;

				vendors.forEach(function (vendor) {
					if (vendor.vendorId == newItem.vendorId) {
						var result = vendor.items.filter(function (item){
							return (item.itemId == newItem.itemId);
						});
						got = (result) ? true : false;
					}
				});

				return got;
			},
      isSelected: function () {
        return this.get('isSelected');
      },
      isVerified: function () {
        return this.get('verified');
      },
			isFilesExist: function(){
				options = options || {};
				var files = this.getFiles();
				var exists = false;

				files.forEach(function (file) {
					if (file.src == options.src) {
						exists = true;
					}
				});

				return exists;
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
				//this.set({files: files}, {silent: true});
			},
			updateFiles: function (newFiles) {
				this.set({files: newFiles});
			},
			saveFiles: function (newFiles) {
				this.save({files: newFiles}, function(err, user) {
					if (err) {
						QuestCMS.Utils.showAlert('Error', 'There are some errors during deleting file');
					}
				});
			},
      setIsActivated: function () {
        this.set({isActivated: true});
      },
			setPassword: function (password) {
			  this.set({password: password});
			},
      setIsSelected: function (isSelected, options) {
        if (options && options.silent) {
            this.set({isSelected: isSelected}, {silent: true});
        } else {
            this.set({isSelected: isSelected});
        }
      },
			setDOB: function (newDOB) {
				this.set({DOB: newDOB});
			},
      toggleIsActive: function () {
        if (this.getIsActive()) {
          this.set({isActive: false}, {silent: true});
        } else {
          this.set({isActive: true}, {silent: true});
        }
      },
			joinVendor: function (newVendors, callback) {
				var existingVendors = this.getVendors();
				newVendors.forEach(function (newVendor) {
					var result = existingVendors.filter(function (existingVendor) {
						return (existingVendor.vendorId == newVendor._id)
					});

					if (result.length == 0) {
						var vendor = {
							vendorId: newVendor._id,
							vendorCode: newVendor.vendorCode,
							chiName: newVendor.chiBrandName,
							engName: newVendor.engBrandName,
							vendorType: newVendor.contract.service,
							registrationDate: new Date().toDateFormat('yyyy-MM-dd'),
							items: [{
								itemId: newVendor.item._id,
								itemCode: newVendor.item.itemCode,
								itemName: newVendor.item.chiName,
								branch: QuestCMS.Cookie.get('branch'),
								receivedDate: new Date().toDateFormat('yyyy-MM-dd'),
								received: true
							}]
						};
						existingVendors.push(vendor);
					} else {
						var existingVendor = result[0];
						existingVendor.chiName = newVendor.chiBrandName;
						existingVendor.engName = newVendor.engBrandName;
						var itemResult = existingVendor.items.filter(function (item) {
							return (item.itemId == newVendor.item._id);
						});

						if (itemResult.length == 0) {
							var item = {
								itemId: newVendor.item._id,
								itemCode: newVendor.item.itemCode,
								itemName: newVendor.item.chiName,
								branch: QuestCMS.Cookie.get('branch'),
								receivedDate: new Date().toDateFormat('yyyy-MM-dd'),
								received: true
							}
							existingVendor.items.push(item);
						}
					}
				});

				this.save({vendors: existingVendors}, {
					success: function () {
						callback(false);
					},
					error: function () {
						callback(true);
					}
				});
			}
    });


/*********************************************
 * Backbone Collection
 *********************************************/
    var ModuleCollection = Backbone.Collection.extend({
      initialize: function () { this.options = configs; },
      url: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/' + module; },
      model: ModuleItem,

      comparator: function(data) {
        return data.get("username");
      },
      filterText: function (text) {
        var regexp = new RegExp(text, "i");
        return new ModuleCollection(this.filter(function (data) {
          return (data.get("title").match(regexp));
        }));
      },
      filterId: function (id) {
        return new ModuleCollection(this.filter(function (data) {
          return data.get("id") == id;
        }));
      },
      filterGroups: function (group) {
				return new ModuleCollection(this.filter(function (model) {
					model.get('groups').forEach( function(data) {
						return (data == group);
					});
				}));
      },
			findBy: function (options) {
				return this.find(function (model) {
					return (model.get(options.key) == options.value);
				});
			},
      getIds: function () {
				var self = this, ids = [];

				this.filter(function (model) {
					ids.push(model.getId());
				});
				return ids;
      }
    });


    var UserJoinedClubsCollection = Backbone.Collection.extend({
      initialize: function () { this.options = configs; },
      url: function () { return QuestCMS.Utils.setAPIUrl(this.options) + '/' + configs[module]['dataType']; },
      model: UserJoinedClubItem,
      unSelectAll: function (modelName)  {
        this.filter(function (model) {
          if (modelName && (model.getName() == modelName)) {
          } else {
            model.setIsSelected(false, {silent: true});
          }
        });
      },
      selectAll: function (modelName) {
        var select = false;
        if (!this.isAllSelected()){
          select = true;
        }
        this.filter(function (model){
          model.setIsSelected(select);
          // var searchParameter = new SearchParameter({key: "classItem", model: model});
        });
      },
      isAllSelected: function (modelName){
        var result = true;
        this.filter(function(model){
          if (model.get("isSelected") == false || typeof model.get("isSelected") === "undefined"){
            result = false;
          }
        });
        return result;
      }
    });

/*********************************************
 * Backbone Marionette ItemView
 *********************************************/

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




   /* User Edit Profile Page */
   var ModuleEditView = Backbone.Marionette.ItemView.extend({
     initialize: function	() {
       Backbone.history.navigate('user/profile');

       this.afterEdit = this.options.afterEdit || function () {
         QuestCMS.Utils.setUrlPath({pathname: '#appointment/booking'});
       };
       this.view = this.options.view || this;
       this.review = this.options.review || false;
       var self = this;

       Backbone.Validation.bind(this);
       lang = (QuestCMS.Cookie.isChi()) ? 'chiName' : 'engName';
     },
     template: _.template(tplEditView),
     onRender: function () {
       var self = this;
       $(document).scrollTop(0);
       this.prepareForm();
       this.addDatepicker();
     },
     onShow: function () {
       var self = this;
       this.submitButton = QuestCMS.Utils.createLadda('.user-submit');
       $("input:radio,input:checkbox", this.el).closest('div').css("padding-top", "7px");
       if(this.review){
         this.prepareReviewForm();
       }

   			var rm = new Marionette.RegionManager();
   			UserRegion = rm.addRegions({
   				AppointmentHistoryRegion		: "#AppointmentHistory"
   			});
        QuestCMS.vent.trigger('appointment:showAppointmentHistory', {region: UserRegion.AppointmentHistoryRegion});
     },
     events: {
       'keyup [data-toggle="floatLabel"]'	  : 'floating',
       'change [data-toggle="floatLabel"]'	: 'floating',
       'change #HKIDchar, #HKIDnum, #HKIDbracket' : 'checkHKID',
       'click .user-cancel'    						: 'cancel',
       'click .user-submit'    						: 'saveUser',
       'click .user-verify'    						: 'verifyUser',
       'change #district'									: 'changeRegion',
       'change #hospitalType'							: 'changeHospital',
       'change #countBabies'							:	'addRow',
       'click #changeEmail'								: 'changeEmail',
       'click #interestedOther'						:	'interestedOther',
       'click .closeRegion'								:	'closeRegion',
       'click .selectAll'                 : 'selectAllInterests',
       'click #userJoinedClubs'           : 'reviewUserJoinedClubs'
     },
     floating: function (e) {
       e.preventDefault();
       $(e.currentTarget).attr('data-value', $(e.currentTarget).val());
     },
     checkHKID: function () {
       var HKID = $("#HKIDchar").val() + $("#HKIDnum").val() + '(' + $("#HKIDbracket").val() + ')';

       if (isHKID(HKID)){
         checkDuplicateHKID({HKID: HKID, userId: this.model.getId()}, function (err) {
           if (err) {
             QuestCMS.Utils.showAlert('Error', 'This HKID have be used');
           }
         });
       }
     },
     addRow: function (e) {
       e.preventDefault();

       var currentRowsLength = $('#noOfBabies').find('tr:not(.hidden)').length;
       var noOfBabies = $(e.currentTarget).val();

       var different = noOfBabies - currentRowsLength;
       if (different >= 0) {
         for (var ii = 0; ii < different; ii++) {
           QuestCMS.Utils.addTableRowByjQuery('noOfBabies', '');
         }
       } else {
         var num = Math.abs(different);
         for (var ii = 0; ii < num; ii++) {
           $('#noOfBabies tr:last').remove();
         }
       }
     },
     addDatepicker: function () {
       var EDDSetting = {
         minDate: firstDateOfThisMonth,
         maxDate: registerMaxDate,
         changeMonth: true,
         changeYear: true
       };
       QuestCMS.Utils.addDatepicker({placeholder: '#EDD', self: this, setting: EDDSetting, readonly: true});

       var setting = {
         maxDate: new Date(),
         changeMonth: true,
         changeYear: true
       };
       QuestCMS.Utils.addDatepicker({placeholder: '.DOBDatepicker', self: this, setting: setting, readonly: true});
     },
     changeEmail: function (e) {
       e.preventDefault();

       displayChangeEmailForm({model: this.model, afterEdit: edit});
     },
     changeRegion: function () {
       var self = this;
       var address = this.model.getAddress();
       var district = $('#district', this.el).val();

       $('#region', this.el).find('option').remove();

       QuestCMS.Utils.getRegionSelection(function (region, index) {
         var selected = '';
         if (region.code == address.region) {
           selected = 'selected';
         }
         if (region.district == district) {
           var option = '<option value="'+ region.code +'" ' + selected + ' >'+ QuestCMS.l(region[lang]) + '</option>';
           $('#region', self.el).append(option);
         }
       });
     },
     changeHospital: function () {
       var self = this;
       var baby = this.model.getBaby();
       var hospitalType = $('#hospitalType', this.el).val();

       $('#hospitalList', this.el).find('option').remove();

       QuestCMS.Utils.getHospitalSelection(function (hospital, index) {
         var selected = '';
         if (hospital.code == baby.hospital) {
           selected = 'selected';
         }
         if (hospital.type == hospitalType) {
           var option = '<option value="'+ hospital.code +'" ' + selected + ' >'+ QuestCMS.l(hospital[lang]) + '</option>';
           $('#hospitalList', self.el).append(option);
         }
       });
     },
     selectAllInterests: function (e) {
       e.preventDefault();
       /* value = 55531716cee38c15b771d7b8 means the choice is "Others" */
       if ($('.selectAll', this.el).hasClass('btn-primary')){
         $('#interestedTypesList input:checkbox', this.el).not('input:checkbox[value="55531716cee38c15b771d7b8"]').prop('checked', true);
         $('.selectAll', this.el).removeClass('btn-primary').addClass('btn-danger');
         $('.selectAll', this.el).text(QuestCMS.l('Unselect All'));
       } else {
         $('#interestedTypesList input:checkbox', this.el).not('input:checkbox[value="55531716cee38c15b771d7b8"]').prop('checked', false);
         $('.selectAll', this.el).removeClass('btn-danger').addClass('btn-primary');
         $('.selectAll', this.el).text(QuestCMS.l('Select All'));
       }
     },
     showInterestedTypesList: function () {
       var self = this;
       var interestedTypes = this.model.getInterestedTypes();
       var interestedOther = this.model.getInterestedOther();
       var option = '<div class="col-md-4">';

       QuestCMS.vent.trigger('vendor:findCategoriesList', {action: 'findAllActiveCategories'}, function (err, categories) {
         if (err) {
           var errmsg = "Haven't find the interest type list.";
           if (err.responseText !== '') {
             errmsg = err.responseText;
           }
           QuestCMS.Utils.showAlert('Error', errmsg);
         } else {
           categories.forEach(function(categorie, index){
             categorieName = categorie.getName();
             categorieValue = categorie.getId();
             var	selected = '';
             if (interestedTypes.indexOf(categorieValue) != -1) {
               selected = 'checked';
             }
             index++;
             if(categorieValue !== '55531716cee38c15b771d7b8'){
               option += '<input name="interestedTypes" class="input-md interestedTypes" type="checkbox" value="'+ categorieValue +'" ' + selected + ' > ' + categorieName + '</input><br/>';
             } else {
               selected = (interestedOther == '') ? '' : 'checked';
               var disabled = (interestedOther == '') ? 'disabled' : '';
               option += '<input name="interestedTypes" id="interestedOther" class="input-md interestedTypes" type="checkbox" value="'+ categorieValue +'" ' + selected + ' > ' + categorieName + '</input> <input type="text" name="interestedOther" id="interestedOtherinput" value="' + interestedOther +'" ' + disabled +'/></label>';
               $('#interestedTypesList', self.el).append(option);
             }
             if (index % 10 == 0) {
               option += '</div><div class="col-md-4">';
             }
           });
         }
       });
     },
     cancel: function (e) {
       e.preventDefault();
       // unbind view to validation
       Backbone.Validation.unbind(this);
       this.afterEdit();
     },
     closeRegion: function (e) {
       $(this.el).addClass('hidden');
     },
     interestedOther: function (e) {
       var self = this;
       if($('#interestedOther').prop("checked")){
         $('#interestedOtherinput').attr("disabled", false);
       } else {
         $('#interestedOtherinput').attr("disabled", "disabled");
         $('#interestedOtherinput').val('');
       }
     },
     reviewUserJoinedClubs: function (e) {
       e.preventDefault();
       showJoinedClubs({model: this.model});
     },
     saveUser: function (e) {
       e.preventDefault();
       var self = this;

       if (!self.submitButton.isLoading()) {
         self.submitButton.start();

         if (!$('#agreePolicy').is(':checked')) {
           self.submitButton.stop();
           QuestCMS.Utils.showAlert('Info', QuestCMS.l('agree-policy'));
         } else {
           this.model.bind('validated', function (isValid, model, errors) {
             if (!isValid) {
               var errorMsg = "";
               $.each(errors, function (prop, val) {
                 //console.log(prop, val);
                 if (val.indexOf('.') !== -1) {
                   var values = val.split('.');
                   val = values[values.length - 1].trim();
                 } else {
                   val = val.replace(/(\"|\')/g, '');
                 }
                 errorMsg += val + "<br />";
               });

               self.submitButton.stop();
               $(document).scrollTop(0);
               QuestCMS.Utils.showAlert('Error', "Please fill in all mandatory fields");
               self.model.unbind('validated');
             }
           });

           var HKID = $("#HKIDchar").val() + $("#HKIDnum").val() + '(' + $("#HKIDbracket").val() + ')';
           var DOB = $(".birthYear").val() + '-' + $(".birthMonth").val() + '-' + $(".birthDate").val();

           var _modelObj = QuestCMS.Utils.getFormData('form#userProfile', '.notRead');

           for	(prop in _modelObj) {
             if(prop == 'birth[day]' || prop == 'birth[month]' || prop == 'birth[year]'){
               delete _modelObj[prop];
             }
           }

           _modelObj.DOB = (DOB === '0-0-0') ? '' : DOB;
           _modelObj.HKID = HKID;
           self.model.set(_modelObj, {silent: true});

           if(self.review){
             saveUser({model: self.model}, function(success, model){
               if(success){
                 self.submitButton.stop();
                 self.model.unset('__v');
                 self.model.unbind('validated');
                 self.afterEdit(self.model.toJSON());
               } else {
                 self.submitButton.stop();
               }
             });
           } else {
             saveUser({model: self.model}, function(success, model){
               if(success){
                 self.model.unbind('validated');
                 self.afterEdit();
               } else {
                 self.submitButton.stop();
               }
             });
           }
         }
       }
     },
     verifyUser: function (e) {
       e.preventDefault();
       var self = this;
       var interestedTypes = [];

       this.model.set({verified: true});
       this.model.save({}, {
         success: function (model) {
           QuestCMS.Utils.showAlert('Success', 'Verified');
           self.render();
           self.afterEdit(model.toJSON());
         },
         error: function () {
           QuestCMS.Utils.showAlert('Error', 'Verified failed');
         }
       });
     },
     prepareForm: function () {
       var self = this;
       var data = {};

       if (this.model) {
         if (this.model.isVerified()) {
           $('#babyEDD', this.el).prop('disabled', true);
         }

         var DOB = this.model.getFormatDOB();
         var noOfBabies = this.model.getNoOfBabies();
         var HKID = this.model.getHKID();
         $('#HKIDchar', this.el).val(HKID.charAt(0));
         $('#HKIDnum', this.el).val(HKID.slice(1,7));
         $('#HKIDbracket', this.el).val(HKID.charAt(8));
         $('#countBabies', this.el).val(noOfBabies.length);
         $('#noOfBabies', this.el).find('tr:not(.hidden)').remove();

         for (var ii = 0; ii < noOfBabies.length; ii++) {
           QuestCMS.Utils.addTableRowByjQuery('noOfBabies', noOfBabies[ii], self);
         }

         data = QuestCMS.Utils.prepareLoadJSONData(this.model.toJSON());
         $('form', this.el).loadJSON(data);
         this.showInterestedTypesList();

         var agreePolicy = this.model.get('agreePolicy');
         $('#agreePolicy[value="' + agreePolicy + '"]', this.el).prop('checked', 'checked');

         $('form input[data-toggle="floatLabel"]', this.el).each(function () {
           $(this, self.el).attr('data-value', $(this).val());
         })
       }

       DOB = DOB || false;
       $(".birthdayPicker", this.el).birthdayPicker({
         maxAge : 100,
         minAge : -1,
         "dateFormat" : "bigEndian",
         "monthFormat" : "number",
         "placeholder" : true,
         "defaultDate" : DOB,
         "sizeClass" : "span1"
       });
     },
     prepareReviewForm: function(){
       if(!this.model.isVerified()){
         $('.user-verify').removeClass('hidden');
       }

       $('.closeRegion').removeClass('hidden');
       $('.user-cancel').addClass('hidden');
     }
   });

    /* User Login(Sign in) Page */
    var ModuleLoginFormView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplLoginFormView),
      onRender: function() {
        QuestCMS.Utils.setSiteTitle(QuestCMS.l("Sign In"));
				lang = (QuestCMS.Cookie.isChi()) ? 'chiName' : 'engName';

				$("#branch", this.el).html(QuestCMS.Utils.addBranchList(false));
      },
			onShow: function () {
				$(".glyphicon-eye-open").show();
				$('form input:eq(0)').focus();
        $(document).scrollTop(0);
				if (QuestCMS.Cookie.get('branch') !== '') {
					$('#branch').val(QuestCMS.Cookie.get('branch'));
				}
			},
      events: {
				"click .user-forgot"       				: "forgot",
				"click .user-submit"       				: "login",
				"click .user-signUp"       				: "signUp",
        "mousedown .glyphicon-eye-open"   : "toggleHidden",
        "mouseup .glyphicon-eye-open" 		: "toggleHidden"
      },
      forgot: function (e) {
        e.preventDefault();
        QuestCMS.vent.trigger('reset:password');
      },
      login: function (e) {
        e.preventDefault();
        var email = $('#email').val().trim();
        var password = $('#password').val().trim();
				var branch = $('#branch').val();

				if (email !== '' && password !== '' && branch) {
					if (validateEmail(email)){
						QuestCMS.Cookie.save({branch: branch});
						authenticate({email: email, password: password});
					} else {
						QuestCMS.Utils.homepageAlert('Error', 'Email Is Not Valid');
					}
				} else {
					QuestCMS.Utils.findMissingRequiredData({form: 'form', target: ".control-group"}, function(errTarget) {
						QuestCMS.Utils.homepageAlert('Error', 'Please fill in ' + errTarget + '.');
					});
				}
      },
			signUp: function (e) {
        e.preventDefault();
				displaySignUpForm();
			},
      toggleHidden: function (e) {
        e.preventDefault();
        QuestCMS.Utils.toggleHidden('#password', e);
      }
    });

    /* Change Email Page */
    var ModuleEmailEditView = Backbone.Marionette.ItemView.extend({
      initialize: function () {
				this.afterEdit = this.options.afterEdit || QuestCMS.layout[configs[module]['region']].close;
      },
      template: _.template(tplEmailEditView),
			onRender: function () {
        $(document).scrollTop(0);
				$('form input:eq(0)', this.el).focus();
			},
			onShow: function () {
				this.confirmButton = QuestCMS.Utils.createLadda('#user-submit');
			},
      events: {
        'click .user-cancel'    : 'cancel',
        'click .user-submit'    : 'saveUser'
      },
      cancel: function (e) {
        e.preventDefault();

				this.afterEdit();
      },
      saveUser: function (e) {
        e.preventDefault();
				var self = this;

				if (!this.confirmButton.isLoading()) {
					this.confirmButton.start();
					checkEmail(function (isCorrect, change) {
						if (isCorrect) {
							self.model.set(change, {silent: true});
							self.model.save({action: 'changedEmail'}, {
								success: function (model) {
									QuestCMS.Utils.showAlert('Success', 'Email is updated. Please check your email and activate your account. You will be logout in 5 seconds.');
									setTimeout(function () {
										self.confirmButton.stop();
										logout();
									}, 5000);
								},
								error: function () {
									self.confirmButton.stop();
									QuestCMS.Utils.showAlert('Error', 'Error in updating email');
								}
							});
						}
					});
				}
      }
    });

    var ModuleSearchUserView = Backbone.Marionette.ItemView.extend({
      initialize: function () {
      },
      template: _.template(tplSearchUserView),
			onRender: function () {
        $(document).scrollTop(0);
				var rm = new Marionette.RegionManager();
				newRegion = rm.addRegions({
					profileRegion: "#profile",
					reviewJoinesClub: "#reviewJoinesClub"
				});
			},
			onShow: function () {
			},
      events: {
      }
    });




    /* User Register/ Sign up Page */
    var ModuleSignUpFormView = Backbone.Marionette.ItemView.extend({
			initialize: function () {
				Backbone.history.navigate('user/signUp');
			},
      template: _.template(tplSignUpFormView),
      onRender: function() {
        QuestCMS.Utils.setSiteTitle(QuestCMS.l("Sign Up"));
      },
			onShow: function () {
        $(document).scrollTop(0);
				this.prepareForm();
				$('form input:eq(0)').focus();
				this.ladda = ladda.create( document.querySelector('.ladda-button') );
			},
      events: {
				"click .user-cancel"       : "cancel",
        "click .user-submit"       : "signUp"
      },
			cancel: function (e) {
				e.preventDefault();
        QuestCMS.vent.trigger('routing:resolve');
			},
      signUp: function (e) {
        e.preventDefault();
				var self = this;
        var email = $('#email').val().trim();
				var phone = $('#phone').val().trim();
				var lastName = $('#lastName').val().trim();
				var firstName = $('#firstName').val().trim();
				var EDD = $("#EDD").val();

				if (validateEmail(email) && phone && lastName && firstName && EDD){
					if (!self.ladda.isLoading()) {
						self.ladda.start();

						var model = new ModuleItem({email: email, phone: phone, lastName: lastName, firstName: firstName, baby: {EDD: EDD}});
						model.save({}, {
							success: function (model) {
								QuestCMS.Utils.homepageAlert('Success', 'Sign Up Successfully. Please Check Your Email.');
								self.ladda.stop();
							},
							error: function () {
								QuestCMS.Utils.homepageAlert('Error', 'Email Already Exist!');
								self.ladda.stop();
							}
						});
					}
				} else {
					QuestCMS.Utils.findMissingRequiredData({form: 'form', target: ".control-group"}, function(errTarget) {
						QuestCMS.Utils.homepageAlert('Error', 'Please fill in ' + errTarget + '.');
					});
				}
      },
			prepareForm: function () {
				var today = new Date();
				$('#EDD', this.el).datepicker({
          autoSize: false,
          dateFormat: 'yy-mm-dd',
          minDate: today,
					maxDate: registerMaxDate
				});
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
				}
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

				fetchFileToOpen(conditions);
			},
			showUploadedFiles: function () {
				var self = this;
				$('.submittedFiles', self.el).empty();
				var li = '';
				if (this.submittedFiles && this.submittedFiles.length > 0) {
					this.submittedFiles.forEach( function (submittedFile) {
						var filename = submittedFile.filename;
						var path = submittedFile.fullFilepath;
            var amazonUrl = submittedFile.amazonUrl || '';

						li = '<li><a href="#" class="filepath" data-amazonUrl="' + amazonUrl + '"  data-value="data/memberFiles/' + self.userId+ '/' + filename + '">' + filename + '</a></li>';
						$('.submittedFiles', self.el).append(li);
					});
				}
			}
		});

    var ModuleReviewUserJoinedClubItemView = Backbone.Marionette.ItemView.extend({
			initialize: function () {

			},
      onRender: function () {
        this.prepareForm();
        this.afterEdit = this.options.afterEdit || closeRegion;
      },
      template: _.template(tplReviewUserJoinedClubItemView),
			tagName: 'tr',
			serializeData: function () {
				var itemsDetail = '';
				if(this.model.get('items').length > 0){
					var items = this.model.get('items');
					items.forEach(function (item) {
						itemsDetail += item.itemName + ' (' + item.itemCode + '), ';
					});
					itemsDetail = itemsDetail.slice(0, itemsDetail.length-2);
				} else {
					itemsDetail = 'no';
				}
				var date = new Date (this.model.get('registrationDate'));
				return { name: this.model.get('chiName') + ' ' + this.model.get('engName'),
								 date: date.toDateFormat('yyyy-MM-dd'),
								 items: itemsDetail
							}
			},
      events: {
      },
			receivedGift: function (e) {
				e.preventDefault();
			},
      prepareForm: function () {
      }
    });

    var ModuleShowUserDetailView = Backbone.Marionette.ItemView.extend({
			initialize: function () {
        this.afterEdit = this.options.afterEdit || goToAdminPage;
			},
      onRender: function () {
				var self = this;
				$('#userDetails', this.el).hide();

				$('form input[data-toggle="floatLabel"]', this.el).each(function () {
					$(this, self.el).attr('data-value', $(this).val());
				})
      },
      template: _.template(tplShowUserDetailView),
      events: {
				'keyup [data-toggle="floatLabel"]'	: 'floating',
				'change [data-toggle="floatLabel"]'	: 'floating',
				'change #code' 											: 'searchItem',
				'click .user-cancel'								: 'cancel'
      },
			floating: function (e) {
				e.preventDefault();
				$(e.currentTarget).attr('data-value', $(e.currentTarget).val());
			},
			cancel: function (e) {
				e.preventDefault();

				this.afterEdit();
			},
			changeRegion: function (user) {
				var self = this;
				var address = user.getAddress();
				var district = $('#address-district', this.el).val();
				$('#address-region', this.el).find('option').remove();

				QuestCMS.Utils.getRegionSelection(function (region, index) {
          var selected = '';
					if (region.code == address.region) {
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
				var code = $('#code', this.el).val();

				fetch({code: code, action: 'findByCode'}, function (err, users, response) {
					if (err) {
						QuestCMS.Utils.showAlert('Error', ((response.responseText && response.responseText != '') ? response.responseText : 'No this user'));
					} else {
						if (users.length > 0) {
						var user = users.at(0);
							$(e.target).val('');
							self.model.set(user.toJSON(), {silent: true});
							user.set({DOB: user.getFormatDOB()}, {silent: true});
							var data = QuestCMS.Utils.prepareLoadJSONData(user.toJSON());
							$('#userDetails', self.el).loadJSON(data);
							self.changeRegion(user);
							$('#userDetails', self.el).show();
						} else {
							QuestCMS.Utils.showAlert('Error', 'No this user');
						}
					}
				});
			}
    });

    var ModuleAssignAdminModalView = Backbone.Marionette.ItemView.extend({
			initialize: function () {
				this.adminRolesOfUser= QuestCMS.user.getAdminRoles();
				this.adminRoles = this.model.getAdminRoles();
			},
			onShow: function(){
			this.adminRoles.forEach(function(adminRole){
					$('.' + adminRole).attr('checked', 'checked');
					$('#userAdminRoles').append(QuestCMS.l(adminRole));
				});
			},
      template: _.template(tplAssignAdminModalView),
      events: {
				'click .submit'	: 'submit'
      },
			submit: function () {
				var self = this;
				var adminRoles = [];
				if(self.adminRolesOfUser.indexOf('admin') != -1){
					$('.adminRoles').find('input:checked,select').each(function(){
						if ($(this).hasClass('adminRole')) {
							adminRoles.push($(this).val());
						}
					});
					self.model.set({adminRoles:	adminRoles});
						self.model.save({}, {
							success: function (model) {
								QuestCMS.Utils.showAlert('Success', 'Updated');
							},
							error: function () {
								QuestCMS.Utils.showAlert('Error', 'Failed to change the admin roles');
							}
						});
				} else {
					QuestCMS.Utils.showAlert('Error', 'Your are not Admin.');
				}
			}
    });


		var ModuleComositeView = Backbone.Marionette.ItemView.extend({
      initialize: function () {
				Backbone.history.navigate('user/search');
      },
			template: _.template(tplCompositeView),
			onShow: function(){
				QuestCMS.Utils.setSiteTitle(QuestCMS.l("Book Appointment"));

				var rm = new Marionette.RegionManager();
				UserRegion = rm.addRegions({
					searchUser			: "#searchUser",
					displayUser			: "#displayUser"
				});

				showSearchUserRegion();
				showDisplayUserRegion();
			}
		});

		var SearchUserRegion = Backbone.Marionette.ItemView.extend({
			template: _.template(tplSearchUserRegion),
			onRender: function () {
        $(document).scrollTop(0);
				$('[data-toggle="floatLabel"]', this.el).attr('data-value', '');
        $('form', this.el).loadJSON(searchTerms);
			},
			events: {
				'change form' 											: 'change',
				'reset'  														: 'reset',
				'submit' 														: 'submit',
				'keyup [data-toggle="floatLabel"]'	: 'floating',
				'change [data-toggle="floatLabel"]'	: 'floating'
			},
      change: function (e) {
        e.preventDefault();
        var name = $(e.target).prop('name');
				searchTerms[name] = $(e.target).val();
      },
			floating: function (e) {
				e.preventDefault();
				$(e.currentTarget).attr('data-value', $(e.currentTarget).val());
			},
      reset: function (e) {
        searchTerms = {};
      },
			submit: function(e) {
        e.preventDefault();
				showDisplayUserRegion();
			}
		});

		var DisplayUserRegion = Backbone.Marionette.ItemView.extend({
			template: _.template(tplDisplayUserRegion),
			onShow: function () {
				var self = this;

				this.$table = QuestCMS.Utils.showTable({
					placeholder: '#table-userList',
					url: QuestCMS.Utils.setAPIUrl() + '/user?action=findUserSuchAsPagination',
					height: 650,
					cookie: true,
					pageSize: 20,
					pageList: [10, 20, 30, 50, 100, 300],
					toolbar: '#toolbar',
					search: false,
					sortName: 'code',
					queryParams: searchTerms,
					responseHandler: function (res) {
						cachedCollection = new ModuleCollection(res.rows);
						return res;
					},
					onAll: function () {
						self.handleButtons();
					},
					columns: [{
						field: 'selected',
						checkbox: true,
					}, {
						field: 'firstName',
						title: QuestCMS.l('Name'),
						align: 'left',
						formatter: this.nameFormatter,
						sortable: true
					}, {
						field: 'HKID',
						title: QuestCMS.l('HKID'),
						align: 'left',
						sortable: true
					}, {
						field: 'phone',
						title: QuestCMS.l('Phone'),
						align: 'left',
						sortable: true
					}, {
						field: 'email',
						title: QuestCMS.l('Email'),
						align: 'left',
						sortable: true
					}, {
						field: 'activated',
						title: QuestCMS.l('Activated'),
						align: 'center',
						formatter: this.TrueFalseFormatter
					}, {
						field: 'verified',
						title: QuestCMS.l('Verified'),
						align: 'center',
						formatter: this.TrueFalseFormatter
					}, {
						field: 'operate',
						title: QuestCMS.l('Task'),
						align: 'center',
						clickToSelect: false,
						formatter: this.operateFormatter,
						events: this.tableEvents(this)
					}]
				});
			},
			TrueFalseFormatter: function (value, row, index) {
				if (value) {
					return '<span class="glyphicon glyphicon-ok"></span>';
				} else {
					return '<span class="glyphicon glyphicon-remove"></span>';
				}
			},
			nameFormatter: function (value, row, index) {
				var user = new ModuleItem(row);
				return user.getCode() + '. ' + user.getFullName();
			},
			operateFormatter: function (value, row, index) {
				var memberDetail = '<button id="btnUserDetail" class="btn btn-xs btn-primary">' + QuestCMS.l("Member") + QuestCMS.l("Details") + '</button>';
				var memberClub = '<button id="btnUserJoinedClubs" class="btn btn-xs btn-success">' + QuestCMS.l("Member") + QuestCMS.l("Club") + '</button>';
				var reviewFile = '<button id="btnReviewFile" class="btn btn-xs btn-info">' + QuestCMS.l("Review File") + '</button>';
				var managePermission = '<button id="btnAssignRole" class="btn btn-xs btn-danger">' + QuestCMS.l("Manage") + QuestCMS.l("Permission") + '</button>';
				var makeAppointment = '<button id="btnMakeAppointment" class="btn btn-xs btn-warning">' + QuestCMS.l("Make Appointment") + '</button>';

				return '<div>' + memberDetail + ' ' + memberClub + ' ' + reviewFile + '</div><div>' + managePermission + ' ' + makeAppointment +'</div>';
			},
			tableEvents: function (self) {
				return {
					'click #btnUserDetail' : function (event, value, row, index) {
						var model = cachedCollection.findBy({key: '_id', value: row._id});
						self.userDetail(model);
					},
					'click #btnUserJoinedClubs' : function (event, value, row, index) {
						var model = cachedCollection.findBy({key: '_id', value: row._id});
						self.userJoinedClubs(model);
					},
					'click #btnReviewFile' : function (event, value, row, index) {
						var model = cachedCollection.findBy({key: '_id', value: row._id});
						self.reviewFile(model);
					},
					'click #btnAssignRole' : function (event, value, row, index) {
						var model = cachedCollection.findBy({key: '_id', value: row._id});
						self.assignRole(model);
					},
					'click #btnMakeAppointment' : function (event, value, row, index) {
						var model = cachedCollection.findBy({key: '_id', value: row._id});
						self.btnMakeAppointment(model);
					},
				};
			},
			handleButtons: function () {
				if (this.$table) {
					$('#operation', this.el).prop('disabled', !this.$table.getSelections().length);
					if (this.$table.getSelections().length == 1) {
						$('#userDetail', this.el).closest('li').removeClass('disabled');
						$('#userJoinedClubs', this.el).closest('li').removeClass('disabled');
						$('#reviewFile', this.el).closest('li').removeClass('disabled');
						$('#assignRole', this.el).closest('li').removeClass('disabled');
					} else {
						$('#userDetail', this.el).closest('li').addClass('disabled');
						$('#userJoinedClubs', this.el).closest('li').addClass('disabled');
						$('#reviewFile', this.el).closest('li').addClass('disabled');
						$('#assignRole', this.el).closest('li').addClass('disabled');
					}
				}
			},
			events: {
				'click #sendActivationLink'		: 'sendActivationLink',
				'click #sendActivationSMS'		: 'sendActivationSMS',
				'click #userDetail'						: function (e) {
					e.preventDefault();
					this.perpareEventData({nextEvent: this.userDetail});
				},
				'click #userJoinedClubs'			: function (e) {
					e.preventDefault();
					this.perpareEventData({nextEvent: this.userJoinedClubs});
				},
				'click #reviewFile'						: function (e) {
					e.preventDefault();
					this.perpareEventData({nextEvent: this.reviewFile});
				},
				'click #assignRole'						: function (e) {
					e.preventDefault();
					this.perpareEventData({nextEvent: this.assignRole});
				},
			},
			perpareEventData: function (options) {
				options = options || {};
				if (this.$table.getSelections().length == 1) {
					options.nextEvent(this.getUser());
				}
			},
			assignRole: function (model) {
				var view = new ModuleAssignAdminModalView({model: model});
				QuestCMS.modal.show(view);
			},
			btnMakeAppointment: function (model) {
        QuestCMS.vent.trigger('appointment:makeAppointment', {user: model});
			},
			userDetail: function (model) {
				edit({model: model, afterEdit: displayUserCompositeView});
			},
			userJoinedClubs: function (model) {
				showJoinedClubs({model: model});
			},
			reviewFile: function (model) {
				var userFiles = model.getFiles();

				if (userFiles.length == 1) {
					userFile = userFiles[0];

					var conditions = {
						filepath: userFile.fullFilepath,
						amazonUrl: userFile.amazonUrl,
						filename: userFile.filename,
						userId: model.getId()
					};
					fetchFileToOpen(conditions);
				} else if (userFiles.length > 1) {
					var view = new ModuleReviewSubmittedFiles({submittedFiles: userFiles, userId: model.getId(), username: model.getFullName()});
					QuestCMS.modal.show(view);
				} else {
					QuestCMS.Utils.showAlert('Info', "Haven't submitted files");
				}
			},
			getSelectedUsersId: function () {
				var users = this.$table.getSelections();
				return $.map(users, function (user) {
					return user._id;
				});
			},
			getUser: function () {
				var usersId = this.getSelectedUsersId();
				return cachedCollection.findBy({key: '_id', value: usersId[0]});
			},
			sendActivationLink: function () {
				var self = this;

        QuestCMS.Utils.showDialog({
          text: QuestCMS.l('Are you sure you want to send activation link(s)') + '?',
          confirm: function (button) {
            var ids = self.getSelectedUsersId();

    				$.ajax({
    					type: 'GET',
    					dataType: 'json',
    					url: QuestCMS.Utils.setAPIUrl() + '/' + module,
    					data: {userIds: ids, action: 'findUsersAndSendVerificationLink'},
    					headers: QuestCMS.headers,
    					success: function (data, response) {
    						QuestCMS.Utils.showAlert('Success', 'Emails sent');
    					},
    					error: function (err) {
    						console.log('err', err);
    						QuestCMS.Utils.showAlert('Error', 'Error during send email');
    					}
    				});
          }
        });
			},
      sendActivationSMS: function () {
				var self = this;

        QuestCMS.Utils.showDialog({
          text: QuestCMS.l('Are you sure you want to send activation link(s)') + '?',
          confirm: function (button) {
            var ids = self.getSelectedUsersId();

            $.ajax({
    					type: 'GET',
    					dataType: 'json',
    					url: QuestCMS.Utils.setAPIUrl() + '/' + module,
    					data: {userIds: ids, action: 'findUsersAndGetVerificationLink'},
    					headers: QuestCMS.headers,
    					success: function (users, response) {
    						self.sendSMS(users);
    					},
    					error: function (err) {
    						console.log('err', err);
    						QuestCMS.Utils.showAlert('Error', 'Error during prepare send SMS');
    					}
    				});
          }
        });
      },
			sendSMS: function (users) {
				var failed = [];
				async.each(
					users,
					function (user, callback) {
						var model = new ModuleItem(user);
						if (model.get('verificationLink') && model.get('verificationLink') !== '') {
							sendActivationSMS({phone: model.getPhone(), verificationLink: model.get('verificationLink')});
						} else {
							failed.push(model.getFullName());
						}
						callback();
					},
					function (err) {
						if (failed.length > 0) {
							QuestCMS.Utils.showAlert('Error', "Haven't send SMS to these users " + failed.join(', '));
						} else {
							QuestCMS.Utils.showAlert('Success', 'SMS sent');
						}
					}
				);
			}
		});

/*********************************************
 * Backbone Marionette CompositeView
 *********************************************/
    var ModuleReviewUserJoinedClubsView = Backbone.Marionette.CompositeView.extend({
			initialize: function () {
				this.user = this.options.user || {};
				this.userName = this.options.userName || {};
			},
      onShow: function () {
        this.afterEdit = this.options.afterEdit || closeRegion;
				$("#allVendorList").tablesorter({
					theme: 'default',
					widthFixed: true,
					widgets: ['zebra']
				}).tablesorterPager({
					container: $("#vendorPager"),
					page: 0,
					size: 5,
					output: '{startRow} to {endRow} ({totalRows})'
				});
      },
			serializeData: function () {
				return {
					userName: this.userName,
					lengthOfCollection: this.collection.length
				}
			},
      itemView: ModuleReviewUserJoinedClubItemView,
      template: _.template(tplReviewUserJoinedClubsView),
      appendHtml: function (collectionView, itemView, index) {
        collectionView.$(".questcms-userJoinedClubs").append(itemView.el);
      }
    });
/*********************************************
 * common functions
 *********************************************/


    /*
     * the Callback function subsribed to the topic "admin:list:start"
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
     * the Callback function subsribed to the topic "admin:list:start"
     * called by the publisher (mostly the admin module) to the topic "admin:list:start"
     *
     * @param {String} topic        subscribed topic for the PubSub system
     * @param {String} publisher    name of the caller module
     * @param {Object} options      target (String) search target (all or specified module name)
     *                              term (String) the search term
     *                              showall (Boolean) show all or not
     */
    var feedload = function (topic, publisher, options) {
      if ((options.target == 'all') || (options.target == module)) {
        var query = {};
        QuestCMS.vent.trigger("feed:load", {module: module, query: query, collection: ModuleCollection});
      }
    };


    /*
     * the Callback function subsribed to the topic "search:start"
     * called by the publisher (mostly the search module) to the topic "search:start"
     *
     * @param {String} topic        subscribed topic for the PubSub system
     * @param {String} publisher    name of the caller module
     * @param {String} options      term (String) the search term
     */
    var search = function (topic, publisher, term) {
        var query = {term: term};
        QuestCMS.vent.trigger("search:search", {module: module, query: query, collection: ModuleCollection});
    };

    var reset = function (alias) {
      cachedCollection = null;
    };

    var resolve = function (alias) {
      var page = 1;
      QuestCMS.Cookie.save({alias: alias, page: page});
      displayUsersView({});
     // display({alias: alias, page: page});
    };



/*********************************************
 * user authentication functions
 *********************************************/
		var setAuthorizationHeader = function (options) {
			options = options || {};

			var data = {
				email: options.email,
				password: options.password
			};

			return "Basic " + window.btoa(options.email+ ":" + options.password); //"Basic c3lzYWRtaW46UEAkJHcwcmQ=";
		};

		var authenticate = function (options) {
			options = options || {};
			QuestCMS.Utils.addLoadingIconToEachAjaxCall();

			var data = {
				email: options.email,
				password: options.password
			};
			var basicAuth = setAuthorizationHeader(data);

			var headers = {
				"questwork-username": options.email,
        "Authorization": basicAuth
			};
			$.ajax({
				type: 'GET',
				dataType: 'json',
				url: QuestCMS.Utils.setAPIUrl() + '/' + configs[module]['authenticaionURL'],
        //data: data,
				headers: headers,
				success: function (user) {
					var user = new ModuleItem(user);
          options.basicAuth = basicAuth;
					login(user, options);
				},
				error: function (err) {
					var errMsg = "Haven't find this account";
					if (err.responseText != "" ) {
						errMsg = err.responseText;
					}
					QuestCMS.Utils.homepageAlert('Error', errMsg);
				}
			});
		};

    var authenticateVerificationCode = function (options) {
			options = options || {};
			var url = options.split("/");
			var data = {
				verificationCode: url[2],
				action: 'verificationCode'
			};
			var conditions = {
				data: data,
				errMsg: 'VerificationCode Code Is Expired!',
				successMsg: 'Successfully! Please enter your password!',
				noNeedToLogout: true,
				cannotSkipEditProfile: true
			};

			checkVerificationCode(conditions);
		};

    var resetPassword = function (options) {
			options = options || {};
			var url = options.split("/");
			var data = {
				verificationCode: url[2],
				action: 'verificationCode'
			};
			var conditions = {
				data: data,
				errMsg: 'Code Is Expired!',
				successMsg: 'Please reset your password!',
				noNeedToLogout: true,
				cannotSkipEditProfile: false
			};

			checkVerificationCode(conditions);
		};

		var checkVerificationCode = function (options) {
			options = options || {};
			var self = this;

			if (options.data.verificationCode) {
				fetch(options.data, function (err, collection, response) {
					if (err) {
						QuestCMS.Utils.showAlert('Error', options.errMsg);
						QuestCMS.vent.trigger("routing:resolve", "");
					} else {
						var model = collection.at(0);
						var conditions = {};
						conditions.model = model;
						conditions.noNeedToLogout = options.noNeedToLogout;
						conditions.cannotSkipEditProfile = options.cannotSkipEditProfile;

						QuestCMS.Utils.showAlert('Success', options.successMsg);
						QuestCMS.vent.trigger('user:displayChangePasswordForm', conditions);
					}
				});
			}
		};

    var login = function (user, options) {
			if (!options.basicAuth) {
				options.basicAuth = setAuthorizationHeader({email: user.get('email'), password: user.get('password')});
			}
      updateQuestCMSUser(user);

			/* original code */
			// QuestCMS.Utils.setBackboneSync(options);
			// QuestCMS.vent.trigger("adminmenu:resolve", "");
			// if (options.callback) {
				// options.callback();
			// }

			/*
				If login user is admin and haven't submit files, it will use ajax to call backend find all files.
				But at this moment, QuestCMS.header is empty object. Need to setup when user login
			*/
      QuestCMS.Utils.setBackboneSyncHeaders(options, function (header) {
				QuestCMS.Utils.setBackboneSync(options);
				QuestCMS.vent.trigger("adminmenu:resolve", "");
			QuestCMS.vent.trigger('searchbox:showSearchBox');
				if (options.callback) {
					options.callback();
				}
			});
    };

    var logout = function () {
      Backbone.history.navigate('/');
      QuestCMS.Pubsub.publish("module:reset", module);
      delete QuestCMS.user;
      QuestCMS.Utils.setBackboneSync();
      QuestCMS.vent.trigger("routing:resolve", "");
    };

		var checkUserProfile = function (user) {
			var checkList = ['email', 'firstName', 'HKID', 'lastName', 'phone', 'baby', 'files', 'address'];

			checkList.forEach( function(item) {
				var key = user.get(item);
				if ( $.isEmptyObject(key) || key === '' ) {
					//If popup window, will popup two windows
					QuestCMS.Utils.showAlert('Warning', 'Please fill in the mandatory fields!');
					QuestCMS.vent.trigger(module + ':edit', {model:QuestCMS.user});
				}
			});
		};

/*********************************************
 * functions
 *********************************************/
    var checkEmail = function (callback) {
			var email = $('#email', this.el).val();
			var email_retype = $('#email_retype', this.el).val();

			if ( (email != '') && (email_retype != '') ) {
				if (email_retype == email) {
					callback(true, {email: email});
				} else {
					$('#email', this.el).val('');
					$('#email_retype', this.el).val('');
					QuestCMS.Utils.showAlert('Error', 'Emails do not match');
					callback(false);
				}
			} else {
				QuestCMS.Utils.showAlert('Error', 'Emails could not be empty');
				callback(false);
			}
    };


    var checkDuplicateHKID = function (options, callback) {
      options = options || {};
      fetch({HKID: options.HKID, userId: options.userId, action: 'findUserByHKID'}, function (err, foundUsers) {
        if (foundUsers.length == 0) {
          callback(null);
        } else {
          callback(true); // more than one users have same HKID
        }
      });
    };

    var closeRegion = function () {
      QuestCMS.layout[configs[module]['region']].close();
    };

		var deleteRow = function (rowIndex, tableId, showAlert) {
			if (document.getElementById(tableId).rows.length > 1) {
				document.getElementById(tableId).deleteRow(rowIndex);
			}
      if (showAlert){
				QuestCMS.Utils.showAlert('Error', 'You can not delete all rows');
			}
		};


    var display = function (options) {
      options = options || {};
      options.page = options.page || 1;

      searchTerms.page = options.page || 1;
      $.extend(options, searchTerms);
      fetch(options, function (err, cachedCollection) {
        if (err) {
          QuestCMS.Utils.showAlert('Error', err);
        } else {
					showUsers(options);
        }
      });
    };

    var displayUserCompositeView = function (options) {
      options = options || {};

			var view = new ModuleComositeView();
			QuestCMS.layout[configs[module]['region']].show(view);
    };

		var showSearchUserRegion = function () {
			var view = new SearchUserRegion();
			UserRegion.searchUser.show(view);
		}

		var showDisplayUserRegion = function () {
			var view = new DisplayUserRegion({model: new ModuleItem()});
			UserRegion.displayUser.show(view);
		}



    var displayLoginForm = function () {

      var view = new ModuleLoginFormView();
      QuestCMS.layout[configs[module]['region']].show(view);
		};

    var displaySignUpForm = function () {

      var view = new ModuleSignUpFormView();
      QuestCMS.layout[configs[module]['region']].show(view);
    };

    var displayChangePasswordForm = function (options) {
			options = options || {};
			var model = options.model || QuestCMS.user;

			QuestCMS.vent.trigger('password:change', {model: model, conditions: options});
    };

    var displayChangeEmailForm = function (options) {
			options = options || {};


			if (!options.model) {
				options.model = QuestCMS.user;
			}

      var view = new ModuleEmailEditView({model: options.model, afterEdit: options.afterEdit});
      QuestCMS.layout[configs[module]['region']].show(view);
    };

    var displayUsersView = function (options){

			var currentPage = 1;
			var collection = new ModuleCollection();
			var view = new ModuleCompositeView({ collection: collection, page: currentPage });
			QuestCMS.layout[configs[module]['region']].show(view);
    };

    var edit = function (options) {
			options = options || {};

			if (!options.model) {
				options.model = QuestCMS.user;
			}
			var view = new ModuleEditView({model: options.model, afterEdit: options.afterEdit});
			if (options.placeholder) {
				$(options.placeholder).html(view.render().el);
			} else {
				QuestCMS.layout[configs[module]['region']].show(view);
			}
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

		var fetchFileToOpen = function(options) {
      var url;
			options = options || {};
			options.filepath = options.filepath.replace(/[\\]/g, '/');

      if (options.amazonUrl && options.amazonUrl !== '' && configs[module]['useAmazon']){
        url = options.amazonUrl;
      } else {
			  url = QuestCMS.Utils.setAPIUrl() + '/file?action=getFileByFullPath&userId=' + options.userId + 'filename=' + options.filename + '&fullFilepath=' + options.filepath;
      }

			window.open(url, '_blank');
		};

    var hide = function () {
      QuestCMS.layout[configs[module]['region']].close();
    };

    var initUser = function (json) {
      return new ModuleItem(json);
    };

    var isEmptyPassword = function () {
        var password = $('#password', this.el).val();
        var password_retype = $('#password_retype', this.el).val();
        if ((password == '') && (password_retype == '')) {
          return true;
        } else {
          return false;
        }
    };

		var isHKID = function (str) {
		 var strValidChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"

			if (str.length < 8)
					return false;

			if (str.charAt(str.length-3) == '(' && str.charAt(str.length-1) == ')')
					str = str.substring(0, str.length - 3) + str.charAt(str.length -2);

			str = str.toUpperCase();

			var hkidPat = /^([A-Z]{1,2})([0-9]{6})([A0-9])$/;
			var matchArray = str.match(hkidPat);

			if (matchArray == null)
					return false;

			var charPart = matchArray[1];
			var numPart = matchArray[2];
			var checkDigit = matchArray[3];

			var checkSum = 0;
			if (charPart.length == 2) {
					checkSum += 9 * (10 + strValidChars.indexOf(charPart.charAt(0)));
					checkSum += 8 * (10 + strValidChars.indexOf(charPart.charAt(1)));
			} else {
					checkSum += 9 * 36;
					checkSum += 8 * (10 + strValidChars.indexOf(charPart));
			}

			for (var i = 0, j = 7; i < numPart.length; i++, j--)
					checkSum += j * numPart.charAt(i);

			var remaining = checkSum % 11;
			var verify = remaining == 0 ? 0 : 11 - remaining;

			return verify == checkDigit || (verify == 10 && checkDigit == 'A');
		};

    var newUser = function () {
      var model = new ModuleItem();
      edit({model: model});
    };

    var removeModelfromCollection = function (collection, model) {
      collection.remove(model);
    };

    var saveUser = function (options, callback) {
      options = options || {};
      var model = options.model;
      var action = model.get('action');
      if (model && model.isValid(true)) {
          model.unset('password', {silent: true});
          model.save({}, {
            success: function (model) {
              QuestCMS.Utils.showAlert('Success', 'Profile Have Been Updated');
							callback(true, model)
            },
            error: function (model, err) {
              QuestCMS.Utils.showAlert('Error', err.responseText);
							callback(false);
            }
          });
          model.set({action:""}, {silent: true});
      }
    };

    var showUsers = function (options) {
      options = options || {};
      currentPage = (options.page || currentPage) || 1;
      var collection = new ModuleCollection(cachedCollection.models[0].get('data'));
      var totalCount = cachedCollection.models[0].get('total')
      var view = new ModuleCompositeView({ collection: collection, page: currentPage, totalCount: totalCount });
      QuestCMS.layout[configs[module]['region']].show(view);
    };

    var searchUsers = function (options) {
      options = options || {};
			options.action = 'findByEmail';
			var model;
			if(!options.model){
				fetch(options, function (err, collection, response) {
					if (err) {
						QuestCMS.Utils.showAlert('Error', response.responseText);
					} else {
						model = collection.models[0];
						showSearchUsers({model: model});
					}
				});
			} else {
				model = options.model;
				showSearchUsers({model: model});
			}
    };

    var showSearchUsers = function (options) {
			options = options || {};
			if( options.model){
				var model = options.model;
				var view = new ModuleSearchUserView({model: model});
				QuestCMS.layout[configs[module]['region']].show(view);
				var profileView = new ModuleEditView({model: model});
				newRegion.profileRegion.show(profileView);
				showJoinedClubs({model: model});
			}
		};

    var showJoinedClubs = function (options) {
			options = options || {};
			var vendors = options.model.getVendors();

			var collection = new UserJoinedClubsCollection(vendors);
			var view = new ModuleReviewUserJoinedClubsView({collection: collection, userName: options.model.getFullName()});
			// newRegion.reviewJoinesClub.show(view);
			QuestCMS.modal.show(view);
		};


		var searchBarcodeView = function (options) {
			options = options || {};
			Backbone.history.navigate('user/searchBarcode');

			if (!options.model) {
				options.model = new ModuleItem();
			}

			var data = {
				steps: [
					{label: '掃描媽媽'},
					{label: '掃描廠商'}
				],
				contents: [
					{trigger: 'user:showUserDetailsView'},
					{trigger: 'vendor:searchVendorAndItem'}
				],
				referenceModel: new ModuleItem(),
				events: {
					'click .user-confirm'     		 : 'confirmUser',
					'click .afterConfirm'		 			 : 'afterConfirm'
				},
				functions: {
					confirmUser: function (e) {
						e.preventDefault();
						/* MUST Pass [e.currentTarget], [this.options.contents] to next function */
						this.passDataTo({currentTarget: e.currentTarget, model: this.options.referenceModel, contents: this.options.contents, collection: this.options.vendorCollection});
						this.nextStep({currentTarget: e.currentTarget});
					},
					afterConfirm: function (e) {
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

		var sendActivationSMS = function (options) {
			options = options || {};

			gapi.client.setApiKey('AIzaSyA2Lu1N1fDJ5bpU1zfnIEvirlDRzkXgqFk');
			gapi.client.load('urlshortener', 'v1', function() {
				var request = gapi.client.urlshortener.url.insert({
					'resource': {
						'longUrl': (options.verificationLink.indexOf(configs['host'] + ':' + configs['port']) !== -1) ? options.verificationLink.replace(configs['host'] + ':' + configs['port'], 'app.cheerbaby.hk') : options.verificationLink
					}
				});
				request.execute(function(response) {
					var shortURL = response.id || 'http://app.cheerbaby.hk';
					var msg = '您好，你已完成樂兒網會員初步登記，請登入以下連結' + shortURL + ' ，完成簡單步驟，便可成為正式會員%0a樂兒網客戶服務部';
					sendSMS({phone: options.phone, msg: msg});
				});
			});
		};

		var sendSMS = function (options) {
			options = options || {};

			if (options.phone && configs[module]['sendSMS'] && options.msg) {
				var data = {
					msg:  options.msg,
					phone: '852' + options.phone,
					pwd: '49599493',
					accountno: 11022427 // 11020787
				}

				var url = QuestCMS.Utils.setSendSMSUrl(data);
				$.ajax({
					dataType: 'jsonp',
					crossDomain: true,
					url: url,
					data: data,
					success: function (data) {
						console.log('data', data);
					},
					error: function (err) {
						console.log('err', err);
					},
					complete: function () {
						QuestCMS.Utils.showAlert('success', 'SMS sent.');
					}
				});
			} else {
				console.log("Missing phone. Can't send SMS. Or skipped send SMS.");
			}
		};

		var showUserDetailsView = function (options) {
			options = options || {};

			if (!options.model) {
				options.model = new ModuleItem();
			}
			var view = new ModuleShowUserDetailView({model: options.model});
			if (options.placeholder) {
				$(options.placeholder).html(view.render().el);
			} else {
				QuestCMS.layout[configs[module]['region']].show(view);
			}
		}


    var universalSearchUsers = function (options) {
			options = options || {};
      var conditions = {
				action: 'findByUniversalSearch',
				universalSearch: options.universalSearch
			};

			fetch(conditions, function (err, collection, response) {
				if (err) {
          QuestCMS.utils.showAlert('Error', response.responseText);
				} else {
					if (options.callback) {
						options.callback(collection);
					} else {
						console.log("Haven't callback");
					}
				}
			});
    };

    var updateQuestCMSUser = function (user) {
      // var obj = $.extend(true, {}, user);
      // QuestCMS.user = new ModuleItem(obj);
			user.unset('password', {silent: true});
      QuestCMS.user = user;
    };


		var changeVerified = function (options) {
      var userObj = new ModuleItem(options);
			userObj.set({verified: true}, {silent: true})
			userObj.save({}, {
				success: function (model) {
					QuestCMS.Utils.showAlert('Success', 'user is verified');
					QuestCMS.vent.trigger('appointment:findAllAppointmentsOnToday();');
				},
				error: function () {
					QuestCMS.Utils.showAlert('Success', 'verify failed');
				}
			});
    };

		function getLastDayOfMonth (noOfMonths) {
			var today = new Date();
			var lastDayAtMonth = new Date(today.getFullYear(), today.getMonth() + noOfMonths + 1, 0);

			return lastDayAtMonth;
		}

		var goToAdminPage = function () {
			QuestCMS.vent.trigger('administration:display');
		};

		var validateEmail = function (email) {
			var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
			return re.test(email);
		};
/*********************************************
 * Return
 *********************************************/
    return User;


});
