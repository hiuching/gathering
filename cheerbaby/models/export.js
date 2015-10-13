/*********************************************
 * The Export model
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/

 
/*********************************************
 * Include modules
 *********************************************/
var fileHelper = require('../lib/fileHelper');
var objectHelper = require('../lib/objectHelper');
var arrayHelper = require('../lib/arrayHelper');
var nodeXlsx = require('node-xlsx');
var phantom = require('phantom');
var fs = require('fs');
/*********************************************
 * Mail Class
 *********************************************/
function Export(options){
	options = options || {};
	
	this.template = options.template;
	this.reportFormat = options.reportFormat || '';
	this.displayType = options.displayType || 'attachment';
}


/*********************************************
 * CONSTANT declaration
 *********************************************/
const TEMPLATE_PATH = 'data/template/';


/*********************************************
 * Include models
 *********************************************/
var Excel = require('../models/excel');

var User = require('../models/user');
var Vendor = require('../models/vendor');
var Appointment = require('../models/appointment');
var Inventory = require('../models/inventory');
var Item = require('../models/item');
var PermissionManager = require('./permissions/permissionManager');
var permissionManager = new PermissionManager();


/*********************************************
 * Custom Class Method (Static method)
 *********************************************/

Export.exportReport = function (options, callback) {
	var query = options.query;
	var user = options.user;
	var permission = permissionManager.createChain();
	
	permission.exportReport.handleRequest({user : user}, function (err, allow) {
		if (err) {
			callback(err);
		} else {
			if (allow) {
				if (query.action == "exportUserByVendorForVendor") {
					
					console.log('Exporting user report by vendor for vendor...');
					Export.exportUserByVendorForVendor(options, callback);
					
				} else if (query.action == "exportUserByVendorForAdmin") {
					
					console.log('Exporting user report by vendor for admin...');
					Export.exportUserByVendorForAdmin(options, callback);
					
				} else if (query.action == "exportTransactionRecord") {
					
					console.log('Exporting transaction records by date...');
					Export.exportTransactionRecord(options, callback);
					
				} else if (query.action == "exportSoldItemDaily") {
					
					console.log('Exporting consumption items...');
					Export.consumptionItemDailyReport(options, callback);
					
				} else if (query.action == "exportSoldItemMonthly") {
					
					console.log('Exporting monthly sold items...');
					Export.exportSoldItemMonthly(options, callback);
					
				} else if (query.action == "exportMemberTransactionReport") {
					
					console.log('Exporting a member transaction report...');
					Export.exportMemberTransactionReport(options, callback);

				} else if (query.action == "exportTodayAppointments") {
					
					console.log('Exporting today appointments...');
					Export.exportTodayAppointments(options, callback);
					
				} else if (query.action == "exportAllActiveItemsQuantity") {
					
					console.log('Exporting all items quantity...');
					Export.exportAllActiveItemsQuantity(options, callback);
					
				} else if (query.action == "exportVendorsList") {
					
					console.log('Exporting vendors list...');
					Export.exportVendorsList(options, callback);

				} else if (query.action == "exportStockRecordByDate") {
					
					console.log('Exporting stock records By date...');
					Export.exportStockRecordByDate(options, callback);

				} else if (query.action == "exportStockRecordByItem") {
					
					console.log('Exporting stock records By item...');
					Export.exportStockRecordByItem(options, callback);
					
				} else if (query.action == "exportAllVendorRecord") {
					
					console.log('Exporting All vendors records...');
					Export.exportAllVendorRecord(options, callback);
					
				} else if (query.action == "exportVendorsApplication") {
					
					console.log('Exporting vendors application...');
					Export.exportVendorsApplication(options, callback);
					
				} else if (query.action == "getFile") {
					
					console.log('Getting file...');
					Export.getFile(options, callback);
					
					
				} else {
					callback(null, 'Wrong report type input');
				}
			} else {
				callback({code: 401, message : 'unauthorized user'})
			}
		}
	});
};


Export.exportTransactionRecord = function (options, callback){
	options = options.query || {};
	options.excel = createExcelTemplate('data/excelTemplate/1a.transactionRecord.template.xlsx');
	
	Appointment.exportTransactionRecord(options, function (err, dataArray) {
		if (err) {
			callback(err);
		} else {
			
			outputReport(options, dataArray, callback);
		}
	});
};


Export.consumptionItemDailyReport = function (options, callback) {
	options = options.query || {};
	options.excel = createExcelTemplate('data/excelTemplate/2.consumptionItemRecord.template.xlsx');
	
	Inventory.findQuantityByConditionsWithItemName(options, function (err, dataArray) {
		if (err) {
			callback(err);
		} else {
			
			outputReport(options, dataArray, callback);
		}
	});
};

Export.exportMemberTransactionReport = function (options, callback){
	options = options.query || {};
	options.excel = createExcelTemplate('data/excelTemplate/3.memberTransactionRecord.template.xlsx');
	
	Appointment.exportMemberTransactionReport(options, function (err, dataArray) {
		if (err) {
			callback(err);
		} else {
			
			outputReport(options, dataArray, callback);
		}
	});
};

Export.exportTodayAppointments = function (options, callback){
	options = options.query || {};
	options.excel = createExcelTemplate('data/excelTemplate/4.appointmentRecord.template.xlsx');
	
	Appointment.exportTodayAppointments(options, function (err, dataArray) {
		if (err) {
			callback(err);
		} else {
			
			outputReport(options, dataArray, callback);
		}
	});
};

Export.exportAllActiveItemsQuantity = function (options, callback){
	options = options.query || {};
	options.excel = createExcelTemplate('data/excelTemplate/5.itemList.template.xlsx');
	
	Item.exportAllActiveItemsQuantity(options, function (err, dataArray) {
		if (err) {
			callback(err);
		} else {
			
			outputReport(options, dataArray, callback);
		}
	});
};

Export.exportVendorsList = function (options, callback){
	options = options.query || {};
	options.excel = createExcelTemplate('data/excelTemplate/6.vendorList.template.xlsx');
	
	Vendor.exportVendorsList(options, function (err, dataArray) {
		if (err) {
			callback(err);
		} else {
			
			outputReport(options, dataArray, callback);
		}
	});
};

Export.exportStockRecordByDate = function (options, callback){
	options = options.query || {};
	options.excel = createExcelTemplate('data/excelTemplate/7a.monthStockRecord.template.xlsx');
	
	Inventory.exportStockRecord(options, function (err, dataArray) {
		if (err) {
			callback(err);
		} else {
			
			outputReport(options, dataArray, callback);
		}
	});
};

Export.exportStockRecordByItem = function (options, callback){
	options = options.query || {};
	options.excel = createExcelTemplate('data/excelTemplate/7b.itemStockRecord.template.xlsx');
	
	Inventory.exportStockRecord(options, function (err, dataArray) {
		if (err) {
			callback(err);
		} else {
			
			outputReport(options, dataArray, callback);
		}
	});
};

Export.exportUserByVendorForVendor = function (options, callback){
	options = options.query || {};
	
	if (options.vendorService == 'Member Easy') {
		options.excel = createExcelTemplate('data/excelTemplate/8a.vendorReportForMemberEasy.template.xlsx');
	} else {
		options.excel = createExcelTemplate('data/excelTemplate/8a.vendorReportForInfoEasy.template.xlsx');
	}
	
	Vendor.exportToArray(options, function (err, dataArray) {
		if (err) {
			callback(err);
		} else {
			
			outputReport(options, dataArray, callback);
		}
	});
};


Export.exportUserByVendorForAdmin = function (options, callback){
	options = options.query || {};
	options.excel = createExcelTemplate('data/excelTemplate/8b.vendorReportForAdmin.template.xlsx');
	
	Vendor.exportToArray(options, function (err, dataArray) {
		if (err) {
			callback(err);
		} else {
			
			outputReport(options, dataArray, callback);
		}
	});
};

Export.exportAllVendorRecord = function (options, callback){
	options = options.query || {};
	options.excel = createExcelTemplate('data/excelTemplate/9.allVendorRecord.template.xlsx');
	
	Vendor.exportAllVendorRecord(options, function (err, dataArray) {
		if (err) {
			callback(err);
		} else {
			
			outputReport(options, dataArray, callback);
		}
	});
};

Export.exportVendorsApplication = function (options, callback){
	options = options.query || {};
	options.excel = createExcelTemplate('data/excelTemplate/10.joinedVendorRecord.template.xlsx');
	
	Vendor.exportVendorsApplication(options, function (err, dataArray) {
		if (err) {
			callback(err);
		} else {
			
			outputReport(options, dataArray, callback);
		}
	});
};

Export.exportConfirmationList = function (options, callback) {
	var report = options || {};
	var self = this;
	report._dir = 'data/pdf/';
	var html = report.template;
	
	report.paperSize = {
		format: 'A4',
		orientation: 'portrait',
		border: {top: '1cm', left: '2cm', bottom: '1cm', right: '2cm'},
		header: {height: '2cm', contents: function(pageNum, numPages) { return "<div style='text-align:center; font-size: 20px;'>樂兒網(Cheer Baby)</div><div style='text-align:center; font-size: 20px;'>領取禮品確認書</div>"; }},
		footer: {height: '3.5cm', contents: function(pageNum, numPages) { 
			var footer = (pageNum == 1) ? "<div>本人證明以上物品已領取。</div>" : "<br>";
			return footer + "<br><br><br><div>______________________________</div><div>會員簽名</div>"; 
		}} 
	};
	
	// fs.readFile(TEMPLATE_PATH + '/confirmationList.html', {encoding: 'utf8'}, function(err, template) {
	  // if (err) {
			// callback(err, template);
		// } else {
			// html = html.replace('{{imgsrc}}', photo.image);
			generatePDF(report, html, callback);
		// }
	// });
	
};


/*
 * ph.callback(function (pageNum, numPages) {});
 *
 */

var generatePDF = function (report, content, callback) {
  report = report || {};
	// console.log(report, content);
	phantom.create(function(ph) {
		var filename = report.filename + '.pdf' || 'report.pdf';
		var fullFilepath = report._dir + filename;
		var paperSize = report.paperSize || { format: 'A4', orientation: 'portrait', border: '1cm' };  /* margin: '1cm', */ 
		paperSize = handleHeaderFooter(ph, paperSize);
		
		var viewportSize = report.viewportSize || { width: 800, height: 600 };
	
		ph.createPage(function(page) {
			page.set('paperSize', paperSize);
			// page.set('content', content); // read content

			page.setContent(content, '', function () {
				page.render(fullFilepath, function() {
					ph.exit();
					callback(null, {fullFilepath: fullFilepath, filename: filename, contentType: 'application/pdf'});
				});
			});
		});
	},{
		dnodeOpts: {weak: false}
	});
};

var handleHeaderFooter = function (ph, setting) {
	setting = setting || {};
	
	if (setting['header'] || setting['footer']) {
		for (var prop in setting) {
			switch(prop) {
				case 'header':
					if (setting['header']['contents']) {
						setting['header']['contents'] = ph.callback(setting['header']['contents']);
					}
					break;
				case 'footer':
					if (setting['footer']['contents']) {
						setting['footer']['contents'] = ph.callback(setting['footer']['contents']);
					}
					break;
				default :
					break;
			}
		}
		return setting;
	}
}
/*********************************************
 * Helper functions
 *********************************************/
var createExcelTemplate = function (filepath) {
	var excelTemplate = nodeXlsx.parse(filepath);
	return new Excel(excelTemplate[0]);
}
 
var generateBuffer = function (options, dataArray, callback)  {
  options = options || {};
	var worksheetName = options.worksheetName || 'Sheet1';
  var buffer = nodeXlsx.build([{name: worksheetName, data: dataArray}]); //for new version nodeXlsx

	callback(null, buffer);
};

var generateCSV = function (options, dataArray, callback)  {
  options = options || {};
	
	var worksheetName = options.worksheetName || 'Sheet1';
	var len = dataArray.length;
	var body = '';
	dataArray.forEach(function (row, index) {
		body += arrayHelper.safeJoin(row, ',') + '\n';
	});
	callback(null, body);
};

var outputReport = function (options, dataArray, callback) {
	options = options || {};
  var fileprefix = options.filename || 'report';
  
	// console.log('options', options);
	
	if (options.reportFormat == 'csv') {
		var report = {
      filename: fileprefix + '.' + options.reportFormat,
			contentType: 'text/csv',
			fileExtension: options.reportFormat,
			displayType: 'attachment'
		};
		generateCSV(options, dataArray, function (err, csv) {
			report.data = csv;
			callback(err, report);
		});
	} else {
		options.reportFormat = 'xlsx';
		var report = {
      filename: fileprefix + '.' + options.reportFormat,
			contentType: 'application/vnd.openxmlformats',
			fileExtension: options.reportFormat,
			displayType: 'attachment'
		};
		generateBuffer(options, dataArray, function (err, buffer) {
			report.data = buffer;
			callback(err, report);
		});
	}
};
/*********************************************
 * Export as a module
 *********************************************/
module.exports = Export;
