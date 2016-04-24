$(document).ready(function() {
	$('#bigIconImg').removeClass();
	$('#bigIconImg').addClass("fa fa-smile-o fa-2x");
	$('#bigIcon').text("About Us");
	$.jStorage.set("eventId", "");
	$.jStorage.set("checkOwnEvent", false);
});