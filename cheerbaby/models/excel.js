/*********************************************
 * The Excel model
 *
 * author: Don Lee
 * created: 2013-09-12T15:16:00Z
 * modified: 2013-09-20T15:16:00Z
 *
 *********************************************/


/*********************************************
 * Include modules
 *********************************************/
var arrayHelper = require('../lib/arrayHelper');
 

/*********************************************
 * CONSTANT declaration
 *********************************************/


/*********************************************
 * Include models
 *********************************************/
 

/*********************************************
 * Class definition
 *********************************************/
function Excel(options){
	options = options || {};
	
	this.worksheetName = options.worksheetName || 'Sheet1';
	this.data = options.data;
	
}

/*********************************************
 * Instance methods
 *********************************************/
Excel.prototype.getData = function () {
	return this.data;
};

Excel.prototype.getWorksheetName = function () {
	return this.worksheetName;
};

Excel.prototype.updateData = function (newData) {
	this.data = newData;
};

Excel.prototype.updateWorksheetName = function (newWorksheetName) {
	this.worksheetName = newWorksheetName;
};

Excel.prototype.getDataHeader = function () {
	for (var ii = 0; ii < this.data.length; ii++) {
		if (this.data[ii].indexOf('[index]') != -1) {
			return this.data[ii];
			break;
		}
	}
};

Excel.prototype.loadDataToRows = function (options) {
	var self = this;
	var headers = this.getDataHeader();
	options = options || {};
	exportRow = options.exportRow || exportRow;
	
	if (options.rows) {
		arrayHelper.prepareArray({}, {headers: headers, rows: options.rows, callback: exportRow()}, function (err, records) {
			for (var ii = 0; ii < self.data.length; ii++) {
				if (self.data[ii].indexOf('[index]') != -1) {
					(records.length == 0) ? records.push(['There are no records']) : records;
					self.data.splice.apply(self.data, [ii, 1].concat(records));
				}
			}
		});
	} else {
		console.log('Excel Module ~ "loadDataToRows" function - Missing data.');
	}
};

Excel.prototype.loadDataToHeader = function (dataObj) {
	var self = this;
	
	self.data.forEach(function (row, index) {
		for (var prop in dataObj) {
			var displayProp = '{' + prop + '}';
			row.forEach(function (data, index) {
				if (data.indexOf('{nextLine}') != -1) {
					data = data.replace('{nextLine}', '');
				} else if (data.indexOf(displayProp) != -1) {
					data = data.replace(displayProp, dataObj[prop]);
				}
				row[index] = data;
			});
		}
	});
};


/*********************************************
 * Helper functions
 *********************************************/
var exportRow = function () {
  var rowIndex = 0;
	
  return function (row, header, callback) {
		if (header) {
			if (header.indexOf('+') != -1) {
				header = header.split('+');
			}
			
			if (header.indexOf('[') != -1 || header.indexOf(']') != -1){
				header = header.replace('[', '');
				header = header.replace(']', '');
			}
			
			if (Array.isArray(header)) {
				var self = exportRow();
				var result = '';
				
				header.forEach(function (prop) {
					if (prop.trim().length != 0) {
						self(row, prop.trim(), function (value){
							result += value;
						})
					} else {
						result += ' ';
					}
				});
				callback(result);
			} else if (header == 'index') {
				rowIndex++;
				callback(rowIndex);
			} else if (!/^[a-zA-Z]*$/g.test(header) && header.length == 1) {
				// only have one character and it is special character
				callback(header);
			} else if (header.indexOf('.') != -1) {
				var headers = header.split('.');
				var len = headers.length,
						i = 0;
				
				while (len != 0) {
					row = row[headers[i]]
					i++;
					len--;
				}
				callback(row);
			} else if (header.indexOf('_') == 0) {
				callback(header.substr(1));
			} else if (arrayHelper.isArray( row[header] )) {
				callback(row[header].join(','));
			} else if (typeof row[header] == 'string') {
				callback(row[header].toString());
			} else if (typeof row[header] == 'boolean') {
				callback(row[header]);
			} else if (typeof row[header] != 'undefined') {
				callback(row[header]);
			} else {
				callback('');
			}
		} else {
			callback('');
		}
	};
};




/*********************************************
 * Export as a module
 *********************************************/
module.exports = Excel;