//var jq = $.noConflict();
var userId = $.jStorage.get("userId");
var displayName = $.jStorage.get("displayName");
var userEmail = $.jStorage.get("userEmail");
if (userId == null ||userEmail == null)
	window.location.href = "index.html";
$(document).ready(function() {
	var parameters = location.search.substring(1);
	console.log(parameters);
	$('#logOut').click(function() {
		$.jStorage.flush();
		window.location.href = "index.html";
	});

	$('#homeBtn').click(function() {
		$('#bigIconImg').removeClass();
		$('#bigIconImg').addClass("fa fa-home fa-3x");
		$('#bigIcon').text("Home");
	});

	$('#settingBtn').click(function() {
		$('#bigIconImg').removeClass();
		$('#bigIconImg').addClass("fa fa-cogs fa-3x");
		$('#bigIcon').text("Settings");
	});

	$('#aboutusBtn').click(function() {
		$('#bigIconImg').removeClass();
		$('#bigIconImg').addClass("fa fa-home fa-3x");
		$('#bigIcon').text("About Us");
	});
});