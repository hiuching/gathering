//=============================================================================
//    String
//=============================================================================

if(!String.prototype.trim) {
    String.prototype.trim = function () {
        return this.replace(/^\s+|\s+$/g,'');
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
