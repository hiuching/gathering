//=============================================================================
//    Array
//=============================================================================

if(!Array.prototype.arrayUniqueByKey) {
	Array.prototype.arrayUniqueByKey = function (key) {
		var self = this;
		var flags = [], output = [], l = self.length, i;
		for( i=0; i<l; i++) {				
			if( flags[self[i][key]]) continue;
			flags[self[i][key]] = true;
			output.push(self[i]);
		}
		return output;
	};
}

if(!Array.prototype.arrayUnique) {
	Array.prototype.arrayUnique = function (key) {
		var a = this.concat();
		for(var i=0; i<a.length; ++i) {
			for(var j=i+1; j<a.length; ++j) {
				if(a[i] === a[j])
					a.splice(j--, 1);
			}
		}

		return a;
	};
}
