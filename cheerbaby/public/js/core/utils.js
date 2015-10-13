/*********************************************
 * Utility module
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

;define([
  "jquery",
	"ladda",
  "encryption",
  "marionette",
  "iosOverlay",
  "spin",
	"core/ui/alert",
	"core/ui/selection",
	"core/ui/form",
	"core/ui/bootstraptable",
	"core/ui/dialog",
  "text!tpl/utils.html"
],

function ($, ladda, encryption, Marionette, iosOverlay, spin, Alert, Selection, Form, BootstrapTable, Dialog, templateString) {

    var tplModalView = $('#ModalView', '<div>' + templateString + '</div>').html();
    var tplSpinnerView = $('#SpinnerView', '<div>' + templateString + '</div>').html();

    var module = "utils"; // lowercase only
    var configs = {};

/*********************************************
 * Main function (export)
 *********************************************/
    var Utils = function () {
      configs[module] = {
			  //showPopupByModalView: true,
        showModalDuration: 3000
      };
      $.extend(true, configs, QuestCMS.Config.toJSON());
    };

    var ModuleItem = Backbone.Model.extend({
      idAttribute: '_id',
      default: function () {
        return {
          _id: null,
          title: '',
          content: ''
        };
      }
    });

    var ModalView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplModalView)
    });


    var SpinnerView = Backbone.Marionette.ItemView.extend({
      template: _.template(tplSpinnerView)
    });

/*********************************************
 * functions
 *********************************************/
		Utils.prototype.addLoadingIconToEachAjaxCall = function () {
			var overlay;

      $.ajaxSetup({
          beforeSend: function (xhr)
          {
            if (QuestCMS.headers.Authorization) {
              xhr.setRequestHeader("Authorization",QuestCMS.headers.Authorization);
            }
          }
      });

			$(document).ajaxStart(function () {
				$.blockUI({message: null});
				overlay = QuestCMS.Utils.showIOSOverlay();
			});

			$(document).ajaxStop(function () {
				$.unblockUI();
				QuestCMS.Utils.hideIOSOverlay({overlay: overlay});
			});
		};

		Utils.prototype.showIOSOverlay = function (options) {
			options = options || {};
			var showSuccess = options.showSuccess || false;

			var opts = {
				lines: 13, // The number of lines to draw
				length: 11, // The length of each line
				width: 5, // The line thickness
				radius: 17, // The radius of the inner circle
				corners: 1, // Corner roundness (0..1)
				rotate: 0, // The rotation offset
				color: '#FFF', // #rgb or #rrggbb
				speed: 1, // Rounds per second
				trail: 60, // Afterglow percentage
				shadow: false, // Whether to render a shadow
				hwaccel: false, // Whether to use hardware acceleration
				className: 'spinner', // The CSS class to assign to the spinner
				zIndex: 2e9, // The z-index (defaults to 2000000000)
				top: 'auto', // Top position relative to parent in px
				left: 'auto' // Left position relative to parent in px
			};

			var target = document.createElement("div");
			document.body.appendChild(target);
			var spinner = new spin(opts).spin(target);
			overlay = iosOverlay({
				text: "Loading",
				spinner: spinner
			});

			return overlay;
		};

		Utils.prototype.showSuccessIOSOverlay = function (options) {
			options = options || {};

			window.setTimeout(function() {
				options.overlay.update({
					icon: "../userfile/img/check.png",
					text: "Success"
				});
			}, 500);		// 1e3 means 1000

			window.setTimeout(function() {
				options.overlay.destroy();
			}, 1e3);

			return false;
		};

		Utils.prototype.hideIOSOverlay = function (options) {
			options = options || {};
			options.overlay.hide();

			return false;
		};


    Utils.prototype.autocomplete = function (options) {
      options = options || {};
			var el = options.el || '';
      var placeholder = options.placeholder;
      var url = options.url;
      var limit = options.limit || 5;
			var select = options.select || function (event, ui) {};
			var headers = QuestCMS.headers || {};

      $( placeholder, el ).autocomplete({
				delay: options.delay || 0,
        minLength: options.minLength || 3,
        source: function( request, response ) {
          $.ajax({
						headers: headers,
						global: false,
            url: url + request.term,
            success: function( data ) {
              response( $.map( data, function( item ) {
								var outputLabel = '';

								if (options.label.split(',').length == 0) {
									outputLabel = item[options.label];
								} else {
									var labels = options.label.split(',');
									labels.forEach(function (label) {
										outputLabel += item[label] + ', ';
									});
									outputLabel = outputLabel.slice(0, -2);
								}

								return {
									label: outputLabel,
									value: item[options.value] || item,
									json: item
								};
              }));
            },
						error: function( result ){
							alert("Error");
						}
          });
        },
        select: select,
				/* Hide the default message */
				messages: {
					noResults: '',
					results: function() {}
				}
      });

    };

		Utils.prototype.addDatepicker = function (options, disableDay, disableWeekends, specificDays) {
			options = options || {};
			options.self = options.self || '';

			/* show all day and hide specific days */
			function disableSpecificDaysAndWeekends(date) {
				specificDays = specificDays || [];
				date = date.toDateFormat('yyyy-MM-dd');

				for (var i = 0; i < specificDays.length; i++) {
					if ($.inArray(date, specificDays) != -1 || new Date() > date) {
						return [false];
					}
				}

				/* Hide weekends */
				if (disableWeekends) {
					var noWeekend = $.datepicker.noWeekends(date);
					return !noWeekend[0] ? noWeekend : [true];
				} else {
					return [true];
				}
			}

			/* hide all day and show specific days */
			function showAvailabelDate(date) {
				specificDays = specificDays || [];
				date = date.toDateFormat('yyyy-MM-dd');

				for (var i = 0; i < specificDays.length; i++) {
					if ($.inArray(date, specificDays) != -1 || new Date() > date) {
						return [true];
					}
				}

				return [false];
			}

			if (disableDay) {
				/* see what you need to call which function */
				options.setting.beforeShowDay = showAvailabelDate;
				// options.setting.beforeShowDay = disableSpecificDaysAndWeekends;
			}

			if (options.readonly) {
				$(options.placeholder, options.self.el).attr('readonly', 'readonly').css({
					"background":"white",
					"cursor": "default"
				});
			}

			$(options.placeholder, options.self.el).datepicker(options.setting);

		};

		Utils.prototype.addBranchList = function (allowEmpty) {
				var branches = ["Cheung Sha Wan"];
				allowEmpty = allowEmpty || false;
				allowEmpty = allowEmpty ? "" : "disabled";
				var str = '';
				if (allowEmpty !== "disabled"){
					str = str + '<option value="" '+ allowEmpty + ' selected>' + QuestCMS.l("Branch") + '</option>';
				}
				branches.forEach( function(branch){
					str = str + '<option value="' + branch + '">' + QuestCMS.l(branch) + '</option>';
				});

				return str;
		}

    Utils.prototype.addValidationError = function (field, message) {
        var controlGroup = $('#' + field).parent().parent();
        controlGroup.addClass('error');
        $('.help-inline', controlGroup).html(message);
    };

    Utils.prototype.checkRequiredInput = function (formInputs, closestDiv) {
			for (var i = 0; i < formInputs.length; i++) {
				if (!formInputs[i].validity.valid) {
					$(formInputs[i]).closest(closestDiv).addClass("has-error");
				}
			}
    };


		Utils.prototype.addTableRow = function (tableId, object) {
			var table = document.getElementById(tableId);
			if (table.tBodies[0].rows[0]) {
				var new_row = table.tBodies[0].rows[0].cloneNode(true);
			} else {
				var new_row = table.rows[0].cloneNode(true);
			}
			var len = table.rows.length;
			var cells = document.getElementById(tableId).rows[0].cells.length;

			for (var ii = 0; ii < cells; ii++) {
				var currentCell = table.rows[len-1].cells[ii];
				$(currentCell).find('input:text,input:radio,input:checkbox').each(function () {
					var name = $(this).attr('name');
					var row = new_row.cells[ii].getElementsByTagName('input')[0];
					var nextId = $(this).attr('id');
					if (nextId) {
						var number = parseInt(nextId.slice(-2));
						number = ((number + 1) > 9) ? (number + 1) : "0" + (number + 1);
						$(this).prop('id', nextId.substring(0, nextId.length-2) + number.toString());
					}
					var value = (object !== '') ? object[name] : '';
					$(this).val(value);
				});
				$(currentCell).find('select').each(function () {
					var name = $(this).attr('name');
					$(this).find('option').each(function () {
						if ($(this).val() == object[name]) {
							$(this).attr('selected', 'selected');
						}
					});
				});
			}
			$(new_row).removeClass("hidden");
			$(new_row).find('input').removeClass('hasDatepicker');
			table.tBodies[0].appendChild( new_row );
		};

		Utils.prototype.addTableRowByjQuery = function (tableId, object, self) {
			if (self) {
				var $table = $('#' + tableId, self.el);
			} else {
				var $table = $('#' + tableId);
			}
			var $lastTr = $table.find('tr:last'),
					$newTr = $lastTr.clone(true);

			$newTr.find('input:text,input:radio,input:checkbox').each(function () {
				var type = $(this).prop('type'),
						name = $(this).prop('name');

						if (name.indexOf('.') != -1) {
							var props = name.split('.');
							name = props[1];
						}
				if (type == 'radio') {
					if ($(this).val() == object[name]) {
						$(this).prop('selected', true);
					} else {
						$(this).prop('selected', false);
					}
				} else if (type == 'checkbox') {
					if (object[name] && object[name].indexOf($(this).val()) !== -1) {
						$(this).prop('checked', true);
					} else {
						$(this).prop('checked', false);
					}
				} else {
					var nextId = $(this).attr('id');
					if (nextId) {
						var number = parseInt(nextId.slice(-2));
						number = ((number + 1) > 9) ? (number + 1) : "0" + (number + 1);
						$(this).prop('id', nextId.substring(0, nextId.length-2) + number.toString());
					}
					if ($(this).hasClass('hasDatepicker')) {
						var settings = $(this).datepicker('option', 'all');
						$(this).removeClass('hasDatepicker');
						$(this).datepicker(settings);
					}

					var value = (object !== '') ? object[name] : '';
					$(this).val(value);
				}
			});

			$newTr.find('select').each(function () {
				var name = $(this).prop('name'),
						nextId = $(this).attr('id');

				if (name.indexOf('.') != -1) {
					var props = name.split('.');
					name = props[1];
				}

				if (nextId) {
					var number = parseInt(nextId.slice(-2));
					number = ((number + 1) > 9) ? (number + 1) : "0" + (number + 1);
					$(this).prop('id', nextId.substring(0, nextId.length-2) + number.toString());
				}
				$(this).find('option').each(function () {
					if ($(this).val() == object[name]) {
						$(this).prop('selected', true);
					}
				});
			});

			$newTr.removeClass('hidden');
			$newTr.find('[data-toggle="floatLabel"]').each(function () {
				$(this).attr('data-value', '');
			});
			$newTr.insertAfter($lastTr);
		}

    Utils.prototype.createLadda = function (classname) {
			return ladda.create( document.querySelector(classname) );
    };

    Utils.prototype.displayInputDate = function (dateString, format) {
			var date = new Date();
			if (dateString && dateString != '0000-00-00T00:00:00Z') {
				date.setISO8601(dateString);
				return date.toDateFormat(format);
			} else {
				return '';
			}
    };

    Utils.prototype.displayValidationErrors = function(messages) {
			for (var key in messages) {
					if (messages.hasOwnProperty(key)) {
							this.addValidationError(key, messages[key]);
					}
			}
				Alert.getInstance().showAlert('Warning', 'Fix validation errors and try again');
    };

    Utils.prototype.findMissingRequiredData = function (options, callback) {
			// var form = new Form();
			// form.checkIsMissingRequiredData(options, callback);
			options = options || {};
			var isValid = true;

			var formInputs = $(options.form).find('input[type="text"],input[type="password"],select,textarea,input:radio,input:checkbox');
			$(options.target).removeClass("has-error");
			var errTarget = '';
			for (var i = 0; i < formInputs.length; i++) {
				if (!formInputs[i].validity.valid) {
					isValid = false;
					$(formInputs[i]).closest(options.target).addClass("has-error");
					errTarget += $(formInputs[i]).prop('name') + ', ';
				}
			}
			errTarget = errTarget.substring(0, errTarget.length - 2);
			callback(errTarget, isValid);
    };

		Utils.prototype.fetchFileToOpen = function(options) {
			var url;
			options = options || {};
			options.filepath = options.filepath.replace(/[\\]/g, '/');

			if (options.amazonUrl && options.amazonUrl !== ''){
				url = options.amazonUrl;
			} else {
				url = QuestCMS.Utils.setAPIUrl() + '/file?action=getFileByFullPath&userId=' + options.userId + '&filename=' + options.filename + '&fullFilepath=' + options.filepath;
			}


			// options.filename = (options.filename.indexOf('.') != -1) ? options.filename.substring(0, options.filename.indexOf('.')) : options.filename;
			// options.filepath = options.filepath.replace(/[\\]/g, '/');

			// var url = QuestCMS.Utils.setAPIUrl() + '/file?action=getFileByFullPath&filename=' + options.filename + '&fullFilepath=' + options.filepath;
			window.open(url, '_blank');
		};

		/*
		 * Handle checkbox, radio button, input text box, select option, table row
		 */
		Utils.prototype.getFormData = function (formID, withoutClasses) {
		  var form = new Form();
			return form.getData(formID, withoutClasses);
		};

		Utils.prototype.prepareLoadJSONData = function (obj) {
		  var form = new Form();
			return form.prepareLoadJSONData(obj);
		};

		Utils.prototype.getTableData = function (tableID) {
			var table_data = [];
			var result = {};
			$('#' + tableID + ' tbody').find('tr:not(.hidden)').each(function(){
				var row_data = {};
				$('td', this).each(function(){
					$(this).find('input[type="text"],input[type="checkbox"]:checked').each(function () {
						var name = $(this).prop('name');
						var val = $(this).val();
						if ($(this).prop('type') == 'checkbox') {
							if (!$.isArray(row_data[name])) {
								row_data[name] = [];
							}
							row_data[name].push(val);
						} else {
							row_data[name] = val;
						}
					});

					$(this).find('select').each(function () {
            var name = $(this).prop('name');
            var val = $(this).val();
            row_data[name] = val;
					})
          if ($(this).find('label').attr('name') === 'clientId' || $(this).find('label').attr('name') === 'secret'){
            var name = $(this).find('label').attr('name');
            var val = $(this).find('label').val();
            row_data[name] = val;
          }
				});
				table_data.push(row_data);
			});
			result[tableID] = table_data;
			return result;
		};

		Utils.prototype.showTable = function (options) {
			if (options.placeholder) {
				return new BootstrapTable().show(options);
			}
		};

    Utils.prototype.showDialog = function (options) {
			return new Dialog().show(options);
		};

		Utils.prototype.getRowData = function (rowId) {
			var result = {};
			var row_data = {};
			$('#' + rowId).find('input[type="text"],input:checked,input:selected').each(function(){
				if ($(this).val() !== '') {
					var name = $(this).prop('name');
					var val = $(this).val();
					row_data[name] = val;
				}
			});
			$('#' + rowId).find('select').each(function(){
          var name = $(this).prop('name');
          var val = $(this).val();
          row_data[name] = val;
      });

			if (! $.isEmptyObject(row_data)) {
				result[rowId] = row_data;
			} else {
				result[rowId] = '';
			}
			return result;
		};

		Utils.prototype.showSelection = function (id, callback) {
		  var selection = new Selection();
			selection.showSelection(id, callback);
		};

		Utils.prototype.getRegionSelection = function (callback) {
		  this.showSelection('region', callback);
		};


		Utils.prototype.getHospitalSelection = function (callback) {
		  this.showSelection('hospital', callback);
		};


		Utils.prototype.getInterestedTypesSelection = function (callback) {
		  this.showSelection('interestedType', callback);
		};


		Utils.prototype.getCountrySelection = function (callback) {
		  this.showSelection('country', callback);
		};

    Utils.prototype.getRandomString = function (length, chars) {
    	var mask = '';
        if (chars.indexOf('a') > -1) mask += 'abcdefghijkmnpqrstuvwxyz';
        if (chars.indexOf('A') > -1) mask += 'ABCDEFGHJKLMNPQRSTUVWXYZ';
	    if (chars.indexOf('#') > -1) mask += '0123456789';
	    if (chars.indexOf('!') > -1) mask += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
	    var result = '';
	    for (var i = length; i > 0; --i) result += mask[Math.round(Math.random() * (mask.length - 1))];
	    return result;
    }

		Utils.prototype.setUrlPath = function (options) {
      options = options || {};

      window.location.href = window.location.pathname.substring(0, window.location.pathname.lastIndexOf( '/' ) + 1 ) + options.pathname;
			QuestCMS.Cookie.save({alias: options.pathname});
		};

    Utils.prototype.getUserPrimaryEmail = function(emails) {
        var email = "";
        if (emails.length > 0) {
          var ii = 0;
          while (email == "") {
            if (emails[ii].label == 'primary') {
              email = emails[ii].email;
            }
            ii++;
          }
        }
        return email;
    };

    Utils.prototype.hideAlert = function(id) {
        $('.'+id).hide();
    };


    Utils.prototype.inputChange = function(options, callback) {
        options = options || {};
        var change = {};

        if (options.target) {
            var target = options.target;
            var type = $(target).prop('type');
            if ((type.indexOf('text') != -1) || (type.indexOf('radio') != -1)) {
                if (! options.callback) {
                  change[target.name] = target.value.trim();
                } else {
                  change[target.name] = options.callback(target.value.trim());
                }
            } else if (type.indexOf('checkbox') != -1) {
              change[target.name] = ($(target).is(":checked")) ? target.value.trim() : "";
            } else if (type.indexOf('select-one') != -1) {
              var selected = $(target).find('option:selected').val().trim();
              if (! options.callback) {
                change[target.name] = selected;
              } else {
                change[target.name] = options.callback(selected);
              }
            } else if (type.indexOf('file') != -1) {
              this.uploadFileViaBackbone({
                input: target,
                url: '/questcms/fileUpload',
                success: function (file) {
                  if (callback) {
                    callback({file: file});
                  }
                }
              });
            }

        }

        //console.log(change);
        return change;
    };


    Utils.prototype.isEmptyObject = function(obj) {
        if (obj === null || obj === undefined) return true;
        // Assume if it has a length property with a non-zero value
        // that that property is correct.
        if (obj.length && obj.length > 0)    return false;
        if (obj.length === 0)  return true;

        for (var key in obj) {
            if (hasOwnProperty.call(obj, key))    return false;
        }
        return true;
    };


    Utils.prototype.loadTinyMCE = function(options, callback) {
      options = options || {};
      var height = 480;
      var self = this;

      tinymce.init({
        selector: 'textarea.editor',
        convert_fonts_to_spans: true,
        forced_root_block: false,
        height: height,
        image_advtab: true,
        menubar: false,
        plugins: [
          'advlist anchor autolink charmap code contextmenu filemanager hr image link lists',
          'media nonbreaking pagebreak paste preview print searchreplace spellchecker',
          'tabfocus table template textcolor visualblocks visualchars wordcount'
        ],
        setup: function (editor) {
          // set height
          var el = editor.getElement();
          height = $(el).data('height') || height;
          editor.settings.height = height;

          // set callback to get data
          editor.on('blur', function (e) {
            if (callback) {
              var el = e.target.getElement();
              var name = $(el).prop('name');
              var value = e.target.getContent();
              // may need to remove the newline \n before passing the value to change object
              var change = {};
              change[name] = value;
              //console.log(change);
              callback(options, change);
            }
          });
        },
        style_formats: [
          {title: 'bold text', inline: 'b'},
          {title: 'red header', block: 'h1', classes: 'redHeader'},
          {title: 'green header', inline: 'span', classes: 'greenHeader'}
        ],
        subfolder: '',
        theme: 'modern',
        toolbar1: 'undo redo | styleselect | fontname fontsize | bold italic underline | forecolor backcolor | alignleft aligncenter alignright alignjustify',
        toolbar2: 'bullist numlist outdent indent | link image media hr anchor charmap | preview print visualblocks visualchars code'
      });
    };


    Utils.prototype.removeValidationError = function(field) {
        var controlGroup = $('#' + field).parent().parent();
        controlGroup.removeClass('error');
        $('.help-inline', controlGroup).html('');
    };


    Utils.prototype.setAPIUrl = function(options) {
      options = options || QuestCMS.Config.toJSON();
      return options.proto + options.host + ':' + options.port + options.path;
    };

    Utils.prototype.setSendSMSUrl = function(options) {
			options = options || {};
      config = QuestCMS.Config.toJSON();

			var api = config.proto + 'api.accessyou.com/sms/sendsms-utf8-senderid.php?from=Cheerbaby&accountno=' + options.accountno + '&pwd=' + options.pwd + '&phone=' + options.phone;

			if (options.msg) {
				api += '&msg=' + options.msg;
			}

			if (options.from) {
				api += '&from=' + options.from;
			}

			if (options.size) {
				api += '&size=' + options.size;
			}
			// if (options.dnc) {
				// api += '&dnc=' + options.dnc;
			// }
			// if (options.callback_accinfo_url) {
				// api += '&callback_accinfo_url=' + options.callback_accinfo_url;
			// }

      return api;
    };


    Utils.prototype.setBackboneSync = function (authOptions) {
      var self = this;
      self.options = authOptions;
      var sync = Backbone.sync;
      Backbone.sync = function (method, model, options) {
        self.setBackboneSyncHeaders(self.options, function (headers) {
          options.headers = headers;
          sync(method, model, options);
        });
      };
    };

    Utils.prototype.setBackboneSyncHeaders = function (options, callback) {
      var headers = {};
      if (options) {
        // var timestamp = new Date();
        // var nounce = timestamp.fff();
        var username = QuestCMS.user.get('username');
        var basicAuth = options.basicAuth;
        // var password = options.password;
        // var apiKey    = options.apiKey;
        // var apiSecret = options.apiSecret;
        options = null;

        // encryption.getToken(apiKey, apiSecret, function (err, apiToken) {
          // if (err === null) {
            // var longdisplay_string = username + apiToken + timestamp.yyyymmddHHMMss() + nounce;
            // encryption.getToken(longdisplay_string, password, function (err, authToken) {
              // if (err === null) {
                // then just set the options:
                headers = {
                  "Authorization": basicAuth,
                  "questwork-userid": QuestCMS.user.id,
                  // "questwork-timestamp": timestamp.yyyymmddHHMMss(),
                  // "questwork-nounce": nounce,
                  // "questwork-token": authToken,
                  // "questwork-apikey": apiKey,
                  "questwork-username": username
                };
								QuestCMS.headers = headers;
                callback(headers);
              // } else {
                // callback(headers);
              // }
            // }); //encryption.getToken
          // } else {
            // callback(headers);
          // }
        // }); //encryption.getToken
      } else {
        callback(headers);
      }
    };


    Utils.prototype.setSiteTitle = function(prefix) {
      var siteTitle = QuestCMS.Config.get("siteTitle");
      document.title = prefix + ' - ' + siteTitle[QuestCMS.Cookie.get("lang")];
    };



		Utils.prototype.homepageAlert = function (type, text) {
		  Alert.getInstance().setPlaceholder('#output').showNoPopup(type, text);
		};

		Utils.prototype.showAlert = function (type, text, popup) {
		  if (popup) {
				Alert.getInstance().showPopup(type, text);
			} else {
			  Alert.getInstance().showAlert(type, text);
			}
		};


    Utils.prototype.showModal = function (title, content) {
      var duration = configs[module]['showAlertDuration'] || 3000;
      var model = new ModuleItem({title: title, content: content});
      var view = new ModalView({model: model});
      QuestCMS.modal.show(view);
      setTimeout(function () {
        QuestCMS.modal.close();
      }, duration);
    };


    Utils.prototype.shuffleArray = function (array) {
      var currentIndex = array.length
        , temporaryValue
        , randomIndex
        ;

      // While there remain elements to shuffle...
      while (0 !== currentIndex) {

        // Pick a remaining element...
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;

        // And swap it with the current element.
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
      }

      return array;
    };


    Utils.prototype.toggleHidden = function(target, e) {
	  if (e.type=="mousedown") {
		$(target).prop('type', 'text');
	  } else {
	    $(target).prop('type', 'password');
	  }
	};



    Utils.prototype.toTitleCase = function(str) {
        return str.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
    };


    Utils.prototype.uploadFileViaBase64 = function (options) {
      options = options || {};
      var userId = options.userId || '';
      var input = options.input;

      if (input.files && input.files[0]) {
        var path = $(input).data('path') || "upload";
        var data = {path: path};
        var file = input.files[0];
        var fileReader = new FileReader();
        fileReader.onload = function (e) {
					Alert.getInstance().showAlert('Info', 'Uploading...');
          $.extend(true, data, {"name": file.name, "base64encoded": e.target.result, "contentType": file.type, "userId": userId}, options.data);
          $.ajax({
						headers: QuestCMS.headers,
            url: options.url,
            contentType: 'application/json; Charset=UTF-8',
            dataType: 'json',
            type: 'POST',
            data: JSON.stringify(data)
          }).done(function (result) {
            if (options.success) {
              options.success(result);
            }
          }).fail(function (err) {
            if (options.error) {
              options.error(err);
            }
          });
        };
        fileReader.readAsDataURL(file);
      }
    };

    Utils.prototype.uploadFileViaBackbone = function (options) {
      options = options || {};
      var input = options.input;

      if (input.files && input.files[0]) {
        var path = $(input).data('path') || "upload";
        var data = {path: path};
        var file = input.files[0];
        var fileReader = new FileReader();
        fileReader.onload = function (e) {
					Alert.getInstance().showAlert('Info', 'Uploading...');
          $.extend(true, data, {"name": file.name, "base64encoded": e.target.result}, options.data);
          if (options.success) {
            options.success(data);
          }
        };
        fileReader.readAsDataURL(file);
      }
    };

/*********************************************
 * Return
 *********************************************/
    return Utils;

});
