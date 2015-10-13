/*********************************************
 * BootstrapTable module
 *
 * author: Eric Sin
 * created: 2015-07-15T15:16:00Z
 * modified: 2015-07-15T15:16:00Z
 *
 *********************************************/

;define([
  "jquery"
],

function ($) {

	var module = "bootstraptable"; // lowercase only
	var configs = {};

/*********************************************
 * Main function (export)
 *********************************************/

  var itemList = [];

	var BootstrapTable = function () {
		configs[module] = {
		};
		$.extend(true, configs, QuestCMS.Config.toJSON());
	};


	BootstrapTable.prototype.show = function (options) {
		options = options || {};
		var $table = $(options.placeholder);

    $table.bootstrapTable(handleOptions(options));

		if (options.onClickRow) {
			$table.on('check.bs.table uncheck.bs.table ' + 'check-all.bs.table uncheck-all.bs.table', options.onClickRow);
		}

		$table = bindMethods($table);

		return $table;
	};




/*********************************************
 * Private Methods
 *********************************************/
var handleOptions = function (options) {
	options = options || {};

	var conditions = {
		locale: (options.local) ? options.local : (QuestCMS.Cookie.isChi() ? 'zh-TW' : 'en-US'),	//language: zh-TW, zh-CN, en-US
		sidePagination: 'client',		// server or client
		height: options.height || 370, // if editable is true, 400
		pagination: (typeof options.pagination != 'undefined') ? options.pagination : true,
		pageSize: options.pageSize || 5,  // limit
		pageList: options.pageList || [5, 10, 30, 50, 100],
		flat: true,
		trimOnSearch: (typeof options.trimOnSearch != 'undefined') ? options.trimOnSearch : true,
		maintainSelected: (typeof options.maintainSelected != 'undefined') ? options.maintainSelected : false,
		striped: (typeof options.striped != 'undefined') ? options.striped : true,
		search: (typeof options.search != 'undefined') ? options.search : true,
		showRefresh: (typeof options.showRefresh != 'undefined') ? options.showRefresh : true,
		showToggle: (typeof options.showToggle != 'undefined') ? options.showToggle : false,
		showColumns: (typeof options.showColumns != 'undefined') ? options.showColumns : true,
		showExport: (typeof options.showExport != 'undefined') ? options.showExport : false,
		showMultiSort: (typeof options.showMultiSort != 'undefined') ? options.showMultiSort : false,
		smartDisplay: true,
		singleSelect: options.singleSelect || false,
		mobileResponsive: true,
		maintainSelected: options.maintainSelected || false,
		editable: (typeof options.editable != 'undefined') ? options.editable : false,
		exportOptions: options.exportOptions || {fileName: 'FileList'},
		exportTypes: options.exportTypes || ['json', 'xml', 'csv', 'txt', 'excel'],
		clickToSelect: (typeof options.clickToSelect != 'undefined') ? options.clickToSelect : true,
		columns: options.columns || [],
		responseHandler: (typeof options.responseHandler != 'undefined') ? options.responseHandler : function (res) {}
	};

	if (options.cookie) {
		conditions.cookie = true;
		conditions.cookieIdTable = options.placeholder;
		conditions.cookieExpire = options.cookieExpire || '2h';
	}

	if (options.toolbar) {
		conditions.toolbar = options.toolbar;
	}

	if (options.sortName) {
		conditions.sortName = options.sortName;
		conditions.sortOrder = options.sortOrder || 'asc';
	}

	if (options.data) {
		conditions.data = options.data;
	}

	if (options.url) {
		conditions.url = options.url;
		conditions.sidePagination = 'server';
	}

	if (options.queryParams) {
		conditions.queryParams = function(params) {   // params has existing params (offset, limit etc)
			return $.extend(true, params, options.queryParams);
		}
	}

	/* methods */
	if (typeof options.onPageChange == 'function') {
		conditions.onPageChange = options.onPageChange;
	}

	if (typeof options.onAll == 'function') {
		conditions.onAll = options.onAll;
	}

	if (typeof options.onCheck == 'function') {
		conditions.onCheck = options.onCheck;
	}

	if (typeof options.onCheckAll == 'function') {
		conditions.onCheckAll = options.onCheckAll;
	}

	if (typeof options.onUncheck == 'function') {
		conditions.onUncheck = options.onUncheck;
	}

	if (typeof options.onUncheckAll == 'function') {
		conditions.onUncheckAll = options.onUncheckAll;
	}

	if (typeof options.onPreBody == 'function') {
		conditions.onPreBody = options.onPreBody;
	}

	if (typeof options.onPostBody == 'function') {
		conditions.onPostBody = options.onPostBody;
	}

	if (typeof options.onSearch == 'function') {
		conditions.onSearch = options.onSearch;
	}

	if (typeof options.onToggle == 'function') {
		conditions.onToggle = options.onToggle;
	}

	return conditions;
};



/* Bind all Bootstrap table methods */
var bindMethods = function ($table) {
	/*
	 * Guideline
	 * noPassingDataFunction = ['checkAll', 'destroy', 'getAllSelections', 'getSelections', 'getData', 'hideLoading', 'resetWidth', 'showLoading', 'uncheckAll'];
	 * passingDataFunction = ['append', 'hideColumn', 'load', 'mergeCells', 'refresh', 'resetView', 'remove', 'showColumn', 'updateRow'];
	 */

	var bootstrapTableFunctions = ['append', 'checkAll', 'destroy', 'getAllSelections', 'getSelections', 'getData', 'hideColumn', 'hideLoading', 'load', 'mergeCells', 'refresh', 'resetView', 'resetWidth', 'remove', 'showColumn', 'showLoading', 'uncheckAll', 'updateRow'];

	bootstrapTableFunctions.forEach(function (fnName) {
		$table[fnName] = function (options) {
			return $table.bootstrapTable(fnName, options);
		};
	});

	return $table;
}

/*********************************************
 * Return
 *********************************************/

	return BootstrapTable;
});
