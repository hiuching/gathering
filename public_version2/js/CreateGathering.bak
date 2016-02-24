var joinFdIdArray = new Array;

$(document).ready(function() {
    $('#date1').datepicker({dateFormat: 'mm/dd/yyyy' });
	$('#date2').datepicker({dateFormat: 'mm/dd/yyyy' });
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
				$("#inviteList").append("<lo><div class = 'loContainer'><img src = 'img/" + friendList[i]._id + ".png' class = 'icon' onerror = 'imgError(this)'></img><span style='font-weight: bold; font-size: 12px'>" + friendList[i].displayName + "</span><i id = '" + friendList[i]._id + "' name = '" + friendList[i].displayName + "' class = ' notInvited fa fa-puzzle-piece fa-3x'></i></div></div></div></lo><br>");
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
		$("#joinFd").append("<span id = '" + fdId + "Name'>" + fdName + "</span>");
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
});