var joinFdIdArray = new Array();

$(document).ready(function() {
	$('#bigIconImg').removeClass();
	$('#bigIconImg').addClass("fa fa-users fa-2x");
	$('#bigIcon').text("Create Gathering");

	var nowDate = new Date();
	var today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0, 0, 0);
    
	$('#date1').datepicker({
		dateFormat: 'mm/dd/yyyy',
		startDate: today
	});
	/*var date1Val = $('#date1').date();
	var selectDate = new Date(date1Val);
	var filterDate = new Date(selectDate.getFullYear(), selectDate.getMonth(), selectDate.getFullYear(), 0, 0, 0, 0);*/
	$('#date2').datepicker({
		dateFormat: 'mm/dd/yyyy',
		startDate: today
	});
	/*$('#date2').click(function() {
		console.log(selectDate);
	})*/
	var data = {
		_id: userId,
	};
	$.support.cors = true;
	//data = JSON.stringify(data);
	$.ajax({
		type: 'GET',
		contentType: 'application/json',
		url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/user/',
		data: data,
		dataType: 'json',
		success: function(user) {
			console.log('success',user);
			friendList = user[0].friendList;
			$("#inviteList").children().remove();
			if (friendList.length == 0){
				$("#inviteList").append("<lo><span>You have no fd lor! toxic jj</span></lo>");
			}
			for(var i in friendList){
				$("#inviteList").append("<lo><div class = 'loContainer'><img src = 'img/" + friendList[i]._id + ".png' class = 'icon' onerror = 'imgError(this)'></img><span class='defaultspan'style='font-weight: bold; font-size: 12px'>" + friendList[i].displayName + "</span><i id = '" + friendList[i]._id + "' name = '" + friendList[i].displayName + "' class = ' notInvited fa fa-puzzle-piece fa-3x'></i></div></div></div></lo><br>");
			}
			console.log(user[0].friendList);
		},
		error: function(err){
			console.log('failed');
		}
	});

	$('#inviteList').on('click', '.notInvited', function(){
		var fdName = $(this).attr("name");
		var fdId = this.id;
		var inviteNum = parseInt($('#inviteNum').val());
		$('#inviteNum').val(inviteNum + 1);
		$("#joinFd").append("<span id = '" + fdId + "Name' class = 'friend '>" + fdName + "<section class = 'glyphicon glyphicon-remove'></section></span>");
		$('#' + fdId).removeClass("fa-puzzle-piece notInvited");
		$('#' + fdId).addClass("fa-child invited");
		joinFdIdArray.push(fdId);
		console.log(joinFdIdArray);
	});

	$('#inviteList').on('click', '.invited', function(){
		var fdName = $(this).attr("name");
		var fdId = this.id;
		var inviteNum = parseInt($('#inviteNum').val());
		$('#inviteNum').val(inviteNum - 1);
		$('#' + fdId + 'Name').remove();
		$('#' + fdId).removeClass("fa-child invited");
		$('#' + fdId).addClass("fa-puzzle-piece notInvited");
		joinFdIdArray = $.grep(joinFdIdArray, function(n, i) { return n != fdId; });
		console.log(joinFdIdArray);
	});

	$('#createBtn').click(function() {
		console.log("clicked");
		$("#createBtn").attr("disabled", true);
		if($('.inputEvent').val() == '' || $('.inputEvent').val() == null){
			$('#msg').text ("Please Complete the form");
			$("#createBtn").attr("disabled", false);
			return false;
		}
		postEvent();
	});

	function postEvent() {
		var data = {
			owner: userId,
			name: $.trim($('#eventname').val()),
			types: $('#eventtype').val(),
			startDate: $('#date1').val(),
			endDate: $('#date2').val(),
			location: $('#location').val(),
			budget: $('#budget').val(),
			invited: joinFdIdArray,
			description: $('#description').val(),
		}
		$.support.cors = true;
		data = JSON.stringify (data);
		$.ajax({
			type: 'POST',
			contentType: 'application/json',
			url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/event',
			data: data,
			dataType: 'json',
			success: function (event) {
				console.log ('success', event);
				$('#msg').css("color", "Green");
				$('#msg').html("Event created successful. You will be redirected after 5 seconds...");
				//$("#createBtn").attr("disabled", false);
				setTimeout(function() {window.location.href = '#/';}, 5000);
			},
			error: function (err){
				console.log ('failed', err);
				$('#msg').css("color", "red");
				$('#msg').text ("Something Wrong. Please contact Administrater");
				$("#createBtn").attr("disabled", false);
			}
		});
	}
});

function imgError(image) {
	//console.log("gg");
	image.src = "img/noImg.jpg";
	image.onerror = "";
	return true;
}