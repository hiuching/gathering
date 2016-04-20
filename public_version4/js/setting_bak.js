//var userId = "56027b618ff1db68160fe357";
//var friendIdArray = new Array();
$(document).ready(function() {
	$('#bigIconImg').removeClass();
	$('#bigIconImg').addClass("fa fa-cogs fa-2x");
	$('#bigIcon').text("Settings");
	
	//console.log("aaaaaaaaaaaaaaaaaaaaaaa");
	//console.log(searchedUser);
	loadFdList = false;
	$('.container, .action').hide();
	if(!isSearch){
		$('#searchFdPannel').hide();
	} else {
		if (searchedUser.length <= 0) {
			$('#searchList').append("<span style = 'font-weight: bold'>No result</span>");
		} else {
			for(var i in searchedUser) {
			console.log("inArray", $.inArray(searchedUser[i]._id, friendIdArray));
				if(searchedUser[i]._id == userId)
					$('#searchList').append("<lo><div class = 'nodeContainer'><div class = 'iconContainer'><img src = 'img/" + searchedUser[i]._id + ".png' class = 'icon' onerror = 'imgError(this)'</img></div><div><span style='font-weight: bold; font-size: 16px'>" + searchedUser[i].displayName + "</span>&nbsp;&nbsp;<span>No Show:" + searchedUser[i].noShowCount + "</span><br>" + searchedUser[i].email + "</div></div></lo><hr>");
				else if(($.inArray(searchedUser[i]._id, friendIdArray)) > -1)
					$('#searchList').append("<lo><div class = 'nodeContainer'><div class = 'iconContainer'><img src = 'img/" + searchedUser[i]._id + ".png' class = 'icon' onerror = 'imgError(this)'</img></div><div><span style='font-weight: bold; font-size: 16px'>" + searchedUser[i].displayName + "</span>&nbsp;&nbsp;<span>No Show:" + searchedUser[i].noShowCount + "</span><br>" + searchedUser[i].email + "&nbsp <button id = '" + searchedUser[i]._id + "' class = 'btn btn-danger unFdBtn'>unFriend</button></div></div></lo><hr>");
				else
					$('#searchList').append("<lo><div class = 'nodeContainer'><div class = 'iconContainer'><img src = 'img/" + searchedUser[i]._id + ".png' class = 'icon' onerror = 'imgError(this)'</img></div><div><span style='font-weight: bold; font-size: 16px'>" + searchedUser[i].displayName + "</span>&nbsp;&nbsp;<span>No Show:" + searchedUser[i].noShowCount + "</span><br>" + searchedUser[i].email + "&nbsp <button id = '" + searchedUser[i]._id + "' class = 'btn btn-success addFd'>+Friend</button></div></div></lo><hr>");
				}
		}
	}
	/*var displayName = "Sheron";
	var userEmail = "sheronleungs@gmail.com";*/
	//$('.container, .action').hide();
	$('#profilePic').attr("src","img/" + userId + ".png");
	if (displayName != null){
		$('#displayName').attr("placeholder",displayName);
	}
	$('#userEmail').text(userEmail);
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
			console.log('lol success',user);
			friendList = user[0].friendList;
			$("#list").children().remove();
			if (friendList.length == 0){
				$("#list").append("<lo><span>You have no fd lor! toxic jj</span></lo>");
			}
			//friendIdArray.length = 0;
			for(var i in friendList){
				//friendIdArray.push(friendList[i]._id);
				$("#list").append("<lo><div class = 'nodeContainer'><div class = 'iconContainer'><img src = 'img/" + friendList[i]._id + ".png' class = 'icon' onerror = 'imgError(this)'</img></div><div><span style='font-weight: bold; font-size: 16px'>" + friendList[i].displayName + "</span>&nbsp;&nbsp;<span>No Show:" + friendList[i].noShowCount + "</span><br>" + friendList[i].email + "&nbsp <button id = '" + friendList[i]._id + "' class = 'btn btn-danger unFdBtn'>unFriend</button></div></div></lo><hr>");
			}
			console.log(friendIdArray);
			loadFdList = true;
		},
		error: function(err){
			console.log('failed');
		}
	});
	$('#list, #searchList').on('click', '.unFdBtn', function(){
		//console.log("clicked");
		var fdId = this.id;
		$('#' + fdId).attr("disabled", true);
		console.log(fdId);
		var data = {
			action: "removeFriend",
			friend: fdId
		}
		$.support.cors = true;
		data = JSON.stringify (data);
		$.ajax({
			type: 'PUT',
			contentType: 'application/json',
			url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/user/' + userId,
			data: data,
			dataType: 'json',
			success: function (user) {
				console.log ('success', user);
				$('#' + fdId).removeClass("unFdBtn btn-danger");
				$('#' + fdId).addClass("addFd btn-success");
				$('#' + fdId).text("+Friend");
				$('#' + fdId).attr("disabled", false);
				//console.log('changeClass');

			},
			error: function (err){
				console.log ('failed', err);
				$('#' + fdId).attr("disabled", false);
				return;
			}
		});
	});

	$('#list, #searchList').on('click', '.addFd', function(){
		//console.log("addFd");
		//console.log(this.id);
		fdId = this.id;
		$('#' + fdId).attr("disabled", true);
		var data = {
			action: "addFriend",
			friend: fdId
		}
		$.support.cors = true;
		data = JSON.stringify (data);
		$.ajax({
			type: 'PUT',
			contentType: 'application/json',
			url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/user/' + userId,
			data: data,
			dataType: 'json',
			success: function (user) {
				console.log ('success', user);
				$('#' + fdId).addClass("unFdBtn btn-danger");
				$('#' + fdId).removeClass("addFd btn-success");
				$('#' + fdId).text("unFriend");
				$('#' + fdId).attr("disabled", false);

			},
			error: function (err){
				console.log ('failed', err);
				$('#' + fdId).attr("disabled", false);
				return;
			}
		});
	});

	$('.inputEnter').keypress(function (e) {
		if (e.which == 13) {
			submitData();
		}
	});

	$('#save').click(function() {
		submitData();
	});

	$('#changePwBtn').click(function() {
		location.href = "#/ChangePassword";
	})

	//cropbox
	var options =
	{
		thumbBox: '.thumbBox',
		spinner: '.spinner'
	}
	var cropper;
	var fileName;
	var fileExt;
	$('#fileUpload').on('click', function(){ console.log("click"); });
	$('#fileUpload').on('change', function(){
		console.log("change");
		fileName = this.files[0].name;
		fileExt = fileName.substr(fileName.length - 3);
		if (this.files[0].size > (5 * 1024 * 1024)){
				$('#msg').text ("The file exceeds 5 MB!");
				$('.container, .action').hide();
				$('#profilePicContainer').show();
				return;
			}
			else if (fileExt != "png" && fileExt != "jpg" && fileExt != "PNG" && fileExt != "JPG"){
				$('#msg').text ("The file format must be .jpg or .png");
				$('.container, .action').hide();
				$('#profilePicContainer').show();
				return;
			}
		$('.container, .action').show();
		$('#profilePicContainer').hide();
		var reader = new FileReader();
		reader.onload = function(e) {
			options.imgSrc = e.target.result;
			
			//console.log(fileName);
			//console.log(fileExt);
			
			cropper = $('.imageBox').cropbox(options);
		}

		reader.readAsDataURL(this.files[0]);
	})
	$('#btnCrop').on('click', function(){
		try {
			var img = cropper.getDataURL();
			console.log("img =" + img);
		}catch(err) {
			$('#msg').text ("You haven't uploaded a new profile pic");
			$('.container, .action').show();
			$('#profilePicContainer').hide();
			return;
		}
		//console.log(fileExt);
		uploadFileViaBase64(img);
		console.log('upload');
			//refreshElement();
			
	})
	$('#btnZoomIn').on('click', function(){
		cropper.zoomIn();
	})
	$('#btnZoomOut').on('click', function(){
		cropper.zoomOut();
	})
	uploadFileViaBase64 = function (img) {
		console.log("start");
		$.support.cors = true;
		img = '{"path":"./public/img/","name": "' + userId + '.png", "base64encoded": "' + img + '"}';
		console.log(img);
		$.ajax({
		url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/file',
		contentType: 'application/json; Charset=UTF-8',
		dataType: 'json',
		type: 'POST',
		data: img
		}).done(function (result) {
			console.log("success");
			if (options.success) {
				options.success(result);
			}
		}).fail(function (err) {
			if (options.error) {
				options.error(err);
			}
		}).always(function () {
			window.location.reload();
			//alert("finish");
		});
	};

	function submitData() {
		if ($('#displayName').val() == '')
			return;
		else if ($('#displayName').val().length > 26 || $('#displayName').val().length < 3) {
			$('#msg').css("color", "red");
			$('#msg').text ("Display name cannot be shorter than 3chars or longer than 26chars");
			return;
			}
		$(".inputEnter").attr("disabled", true);
		var data = {
			displayName: $.trim($('#displayName').val())
		}
		$.support.cors = true;
		data = JSON.stringify (data);
		$.ajax({
			type: 'PUT',
			contentType: 'application/json',
			url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/user/' + userId,
			data: data,
			dataType: 'json',
			success: function (user) {
				var str = user.displayName;
				console.log ('success', str);
				$(".inputEnter").attr("disabled", false);
				$.jStorage.set("displayName", user.displayName);
				$('#msg').css("color", "rgb(188,230,35)");
				$('#msg').text ("Saved!");
			},
			error: function (err){
				console.log ('failed', err);
				$('#msg').css("color", "red");
				$('#msg').text ("Something Wrong occured. Please contact to Admin.");
				$(".inputEnter").attr("disabled", false);
				return;
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
