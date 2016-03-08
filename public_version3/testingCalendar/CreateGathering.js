var joinFdIdArray = new Array();
var eventId = $.jStorage.get("eventId");
var checkOwnEvent = $.jStorage.get("checkOwnEvent");

$(document).ready(function() {
	console.log("event id = " + eventId);
	console.log("checkOwnEvent = " + checkOwnEvent);
	$('#bigIconImg').removeClass();
	$('#bigIconImg').addClass("fa fa-users fa-2x");
	$('#bigIcon').text("Create Gathering");
	console.log("datepicker value = " + $('#date1').val());

	var nowDate = new Date();
	var today = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), 0, 0, 0, 0);
    
	$('#date1').datepicker({
		dateFormat: 'yyyy-mm-dd',
		startDate: today,
		autoclose: true
	}).on('changeDate', function (ev) {
		$('#date2').datepicker({
			dateFormat: 'yyyy-mm-dd',
			autoclose: true,
		}).datepicker('setStartDate', ev.date);
		$("#date2").focus();
	});

	if (checkOwnEvent == true){
		//console.log("if is true");
		$.support.cors = true;
		var eventData = {
			action: "findEventById",
			id: eventId,
		};
		$.ajax({
			type: 'GET',
			contentType: 'application/json',
			url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/event',
			data: eventData,
			dataType: 'json',
			success: function(event) {
				console.log('success', event);
				$('#eventname').val(event.name);
				$('#eventtype').val(event.types);
				$('#date1').val(event.startDate);
				$('#date2').val(event.endDate);
				$('#location').val(event.location);
				$('#eventTime').val(event.eventTime);
				$('#budget').val(event.budget);
				$('#description').val(event.description);
				$('#createBtn').val('Save');
				console.log(event.period);
				for(var key in event.invited) {
					$("#inviteList").append("<lo><div class = 'loContainer'><img src = 'img/" + event.invited[key]._id + ".png' class = 'icon' onerror = 'imgError(this)'></img><span class='defaultspan'style='font-weight: bold; font-size: 12px'>" + event.invited[key].displayName + "</span></div></div></div></lo><br>");
				}
				for(var msgKey in event.period) {
					$("#joinFd").append("<span><section class = 'glyphicon'>" + event.period[msgKey].userId.displayName + "</section></span>");
				}
				$('#invitedAndJoin').text("Join");
				$('#inviteNum').val(event.period.length);
			},
			error: function(err){
				console.log('failed');
			}
		});
	}else {
		var data = {
			_id: userId,
		};
		$.support.cors = true;
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
	}

	$('#inviteList').on('click', '.notInvited', function(){
		var fdName = $(this).attr("name");
		var fdId = this.id;
		var inviteNum = parseInt($('#inviteNum').val());
		$('#inviteNum').val(inviteNum + 1);
		$("#joinFd").append("<span id = '" + fdId + "Name' name = '" + fdId + "'class = 'friend '><section class = 'glyphicon glyphicon-remove'>" + fdName + "</section></span>");
		$('#' + fdId).removeClass("fa-puzzle-piece notInvited");
		$('#' + fdId).addClass("fa-child invited");
		joinFdIdArray.push(fdId);
		console.log(joinFdIdArray);
	});

	$('#joinFd').on('click', '.friend', function(){
		var fdName = $(this).attr("name");
		var fdId = this.id;
		var inviteNum = parseInt($('#inviteNum').val());
		$('#inviteNum').val(inviteNum - 1);
		$('#' + fdId).remove();
		$('#' + fdName).removeClass("fa-child invited");
		$('#' + fdName).addClass("fa-puzzle-piece notInvited");
		joinFdIdArray = $.grep(joinFdIdArray, function(n, i) { return n != fdId; });
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
		var trimedInputEvent = $.trim($('.inputEvent').val());
		if(trimedInputEvent == '' || trimedInputEvent == null) {
			$('#msg').text ("Please Complete the form");
			$("#createBtn").attr("disabled", false);
			return false;
		}

		if($('#date1').val() == '' || $('#date1').val() == null || $('#date2').val() == '' || $('#date2').val() == null) {
			$('#msg').text ("Please Complete the form");
			$("#createBtn").attr("disabled", false);
			return false;
		}

		if($('#createBtn').val() == "Save") putEvent();
		else {
			console.log(joinFdIdArray);
			if(joinFdIdArray == "" || joinFdIdArray == null) {
				$('#msg').text ("Please invite your friends to join.");
				$("#createBtn").attr("disabled", false);
				return false;
			}
			postEvent();
		}
	});

	function putEvent() {
		var putData = {
			name: $.trim($('#eventname').val()),
			types: $('#eventtype').val(),
			startDate: $('#date1').val(),
			endDate: $('#date2').val(),
			location: $('#location').val(),
			budget: $('#budget').val(),
			eventTime: $('#eventTime').val(),
			//invited: joinFdIdArray,
			description: $.trim($('#description').val()),
		}

		$.support.cors = true;
		putData = JSON.stringify (putData);
		$.ajax({
			type: 'PUT',
			contentType: 'application/json',
			url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/event/' + eventId,
			data: putData,
			dataType: 'json',
			success: function (event) {
				console.log ('success', event);
				$('#msg').css("color", "Green");
				$('#msg').html("Event details are changed successful. You will be redirected after 5 seconds...");
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

	function postEvent() {
		var data = {
			owner: userId,
			name: $.trim($('#eventname').val()),
			types: $('#eventtype').val(),
			startDate: $('#date1').val(),
			endDate: $('#date2').val(),
			location: $('#location').val(),
			budget: $('#budget').val(),
			eventTime: $('#eventTime').val(),
			invited: joinFdIdArray,
			description: $.trim($('#description').val()),
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