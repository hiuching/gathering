if (!String.prototype.endsWith) {
	String.prototype.endsWith = function (searchString, position) {
		var subjectString = this.toString();
		if (position === undefined || position > subjectString.length) {
			position = subjectString.length;
		}
		position -= searchString.length;
		var lastIndex = subjectString.indexOf(searchString, position);
		return lastIndex !== -1 && lastIndex === position;
	};
}

if (!String.prototype.capitalize) {
	String.prototype.capitalize = function () {
			return this.charAt(0).toUpperCase() + this.slice(1);
	};
}

if (!String.prototype.wordCount) {
	String.prototype.wordCount = function () {
		var regex = /\s+/gi;
		var len = 0;
		if (this != ''){
			 len = this.trim().replace(regex, ' ').split(' ').length;
		}
		return len;
	};
}