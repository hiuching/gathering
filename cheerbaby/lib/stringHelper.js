var stringHelper = {};

stringHelper.escapeSpeacialCharacters = function (string) {
	return (new String(string)).replace(/([.*+?=^!:${}()|[\]\/\\])/g, '\\$1');
};

stringHelper.escapeMetaCharacters = function (string) {
	string = string.replace(/[\n\r\t]/g, '\$1');
	return string;
};

stringHelper.escapeQuotationMarks = function (string) {
	string = string.replace(/[\"]/g, '\$1');
	return string;
};

module.exports = stringHelper;