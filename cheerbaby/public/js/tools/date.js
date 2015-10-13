//=============================================================================
//    Date
//=============================================================================
Date.prototype.academicYearEnd = function (academicYear) {
	if (academicYear != null) {
	  var y = ++academicYear;
	} else {
	  y = this.getFullYear();
	}
	var m = 5;
	var d = 30;
	return (new Date(y,m,d));
};


Date.prototype.yyyymmddHHMMss = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   var HH = this.getHours().toString();
   var MM = this.getMinutes().toString();
   var ss = this.getSeconds().toString();
   return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]) + (HH[1]?HH:"0"+HH[0])+ (MM[1]?MM:"0"+MM[0])+ (ss[1]?ss:"0"+ss[0]) ; // padding
};


Date.prototype.yyyymmddHHMM = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   var HH = this.getHours().toString();
   var MM = this.getMinutes().toString();
   return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0]) + (HH[1]?HH:"0"+HH[0])+ (MM[1]?MM:"0"+MM[0]); // padding
};


Date.prototype.yyyymm = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   return yyyy + (mm[1]?mm:"0"+mm[0]); // padding
};

Date.prototype.yyyymmdd = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   var HH = this.getHours().toString();
   var MM = this.getMinutes().toString();
   var ss = this.getSeconds().toString();
   return yyyy + (mm[1]?mm:"0"+mm[0]) + (dd[1]?dd:"0"+dd[0])  ; // padding
};

Date.prototype.mm = function() {
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   return (mm[1]?mm:"0"+mm[0]); // padding
};

Date.prototype.yyyy = function() {
   var yyyy = this.getFullYear().toString();
   return yyyy;// padding
};



Date.prototype.HHMMss = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   var HH = this.getHours().toString();
   var MM = this.getMinutes().toString();
   var ss = this.getSeconds().toString();
   return (HH[1]?HH:"0"+HH[0])+ (MM[1]?MM:"0"+MM[0])+ (ss[1]?ss:"0"+ss[0]) ; // padding
};

Date.prototype.fff = function() {
   var fff = this.getMilliseconds().toString();
   return (fff[2]?fff[2]:"0") + (fff[1]?fff[1]:"0") + fff[0] ;
};

Date.prototype.toDateFormat = function(format) {
   var monthAbbrNames = ['Month', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
   var monthFullNames = ['Month', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
   
   var yyyy = this.getFullYear().toString();
   var month = (this.getMonth()+1); // getMonth() is zero-based
   MM = month < 10 ? "0" + month : month;
   var dd  = this.getDate();
   dd  = dd > 9 ? dd : "0" + dd;
   var HH = this.getHours();
   HH  = HH > 9 ? HH : "0" + HH;
   var mm = this.getMinutes();
   mm  = mm > 9 ? mm : "0" + mm;
   var ss = this.getSeconds();
   ss  = ss > 9 ? ss : "0" + ss;
   var fff = this.getMilliseconds().toString();

   var formattedDate = format;
   formattedDate = formattedDate.replace('MMMM', monthFullNames[month]);
   formattedDate = formattedDate.replace('MMM', monthAbbrNames[month]);
   formattedDate = formattedDate.replace('yyyy', yyyy);
   formattedDate = formattedDate.replace('MM', MM);
   formattedDate = formattedDate.replace('dd', dd);
   formattedDate = formattedDate.replace('HH', HH);
   formattedDate = formattedDate.replace('mm', mm);
   formattedDate = formattedDate.replace('ss', ss);
   formattedDate = formattedDate.replace('fff', fff);
   
   return formattedDate;
};

Date.prototype.setJavaScriptSerializer = function (string, format) {
  format = format || "yyyy-MM-dd";
  var regexp = /Date\([0-9]+\)/;
  if (string.match(regexp)) {
    var dateValue = parseInt(string.replace(/\/Date\((\d+)\)\//g, "$1"));
    return (new Date(dateValue)).toDateFormat(format);
  } else {
    return string;
  }
};


Date.prototype.setYYYYMMDD = function (string) {
  var year = string.substr(0,4);
  var month = parseInt(string.substr(4,2)) - 1;
  var day = string.substr(6,2);
  return (new Date(year, month, day));
};


Date.prototype.setYYYYMMDDhhmmss = function (string) {
  var year = string.substr(0,4);
  var month = parseInt(string.substr(4,2)) - 1;
  var day = string.substr(6,2);
  var hour = string.substr(8,2);
  var minute = string.substr(10,2);
  var second = string.substr(12,2);
  return (new Date(year, month, day, hour, minute, second));
};


Date.prototype.setISO8601 = function (string) {
    var regexp = "([0-9]{4})(-([0-9]{2})(-([0-9]{2})" +
        "(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
        "(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
    var d = string.match(new RegExp(regexp));

    var offset = 0;
    var date = new Date(d[1], 0, 1);

    if (d[3]) { date.setMonth(d[3] - 1); }
    if (d[5]) { date.setDate(d[5]); }
    if (d[7]) { date.setHours(d[7]); }
    if (d[8]) { date.setMinutes(d[8]); }
    if (d[10]) { date.setSeconds(d[10]); }
    if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
    if (d[14]) {
        offset = (Number(d[16]) * 60) + Number(d[17]);
        offset *= ((d[15] == '-') ? 1 : -1);
    }

    offset -= date.getTimezoneOffset();
    time = (Number(date) + (offset * 60 * 1000));
    this.setTime(Number(time));
};
Date.prototype.firstDate = function () {
	return (new Date(this.getFullYear(), this.getMonth(), 1));
};
Date.prototype.lastDate = function () {
	return (new Date(this.getFullYear(), this.getMonth(), this.daysInMonth(), 23, 59, 59, 999));
};

Date.prototype.wholeMonth = function (datestring) {
  // this = date obj
	var from = this.setYYYYMMDD(datestring);
  // return new date object of the last day of that month
	// console.log('wholeMonth', from);
	return {from: from.firstDate(), to: from.lastDate()};
};

Date.prototype.dateRange = function (datestring) {
  // this = date obj
  var from = this.setYYYYMMDD(datestring);
  // return new date object of the last day of that month
  return {from: from, to: from.lastDate()};
};

Date.prototype.toEndOfMonth = function (datestring) {
  // this = date obj
	var from = this.setYYYYMMDD(datestring);
  // return new date object of the last day of that month
	return {from: from, to: from.lastDate()};
};

Date.prototype.daysInMonth = function () {
  var m = this.getMonth(); // 0 - 11
	var y = this.getFullYear();
	var d = 31;
	switch (m) {
		case 1 :
			d = (y % 4 == 0 && y % 100 != 0) || y % 400 == 0 ? 29 : 28;
		case 8 : case 3 : case 5 : case 10 :
			d = 30;
	}
	return d;
};


if (!Date.prototype.toISOString) {
    Date.prototype.toISOString = function() {
        function pad(n) { return n < 10 ? '0' + n : n }
        return this.getUTCFullYear() + '-'
            + pad(this.getUTCMonth() + 1) + '-'
            + pad(this.getUTCDate()) + 'T'
            + pad(this.getUTCHours()) + ':'
            + pad(this.getUTCMinutes()) + ':'
            + pad(this.getUTCSeconds()) + 'Z';
    };
}


/* misc date funtion */

var getNthDaysOfMonth = function (weekNums, dayOfWeek, month, year) {
  var dates = getDaysOfMonth(dayOfWeek, month, year);
  if (weekNums && weekNums.length > 0) {
    var new_dates = [];
    $.each(weekNums, function () {
      new_dates.push(dates[this -1]);
    });
    return new_dates;
  } else {
    return dates;
  }
};


var getNthDayOfMonth = function (weekNum, dayOfWeek, month, year) {
  var dates = getDaysOfMonth(dayOfWeek, month, year);
  return dates[weekNum - 1];
};

var getDaysOfMonth = function (dayOfWeek, month, year) {
  var d = new Date(year, month, 1);           // get the first of the month
  var dow_first = d.getDay();                 // find out what DoW that was 
  var date = (7 + dayOfWeek - dow_first) % 7 + 1;   // and the first day matching dow

  var dates = [];
  d.setDate(date);
  do {
    dates.push(new Date(d));      // store a copy of that date
    date += 7;                    // go forward a week
    d.setDate(date);            
  } while (d.getMonth() === month); // until the end of the month

  return dates;
};

Date.prototype.getDaysOfMonth = function () {
  return getDaysOfMonth(this.getDay(), this.getMonth(), this.getFullYear());
};

Date.prototype.getNthDayOfMonth = function (weekNum, dayOfWeek) {
  return getNthDayOfMonth(weekNum, dayOfWeek, this.getMonth(), this.getFullYear());
};

Date.prototype.getFirstDayInSameMonth = function () {
  var d = new Date(this.getFullYear(), this.getMonth(), 1);           // get the first of the month
  return d;
};

Date.prototype.getDateRange = function (duration, unit) {
  var dates = [];
  var current = this.getFirstDayInSameMonth();
  var next = new Date(current.getTime());
  dates.push(next);

  var dir = (duration > 0) ? 1 : -1;
  for(var i= 1; i< Math.abs(duration);i++){
    if(unit == 'month'){
      current.setMonth(current.getMonth() + dir);
    }else if(unit == 'day'){
      current.setDay(current.getDay() + dir);
    }else if(unit == 'year'){
      current.setYear(current.getYear() + dir);
    }
    next = new Date(current.getTime());
    dates.push(next);
  }
  return dates;
};