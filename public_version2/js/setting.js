//var userId = "56027b618ff1db68160fe357";

$(document).ready(function() {
	$('.container, .action').hide();
	/*var displayName = "Sheron";
	var userEmail = "sheronleungs@gmail.com";*/
	//$('.container, .action').hide();
	$('#profilePic').attr("src","img/" + userId + ".png");
	$('#userName').text(displayName);
	$('#userEmail').val(userEmail);
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
			$("#list").children().remove();
			if (friendList.length == 0){
				$("#list").append("<lo><span>You have no fd lor! toxic jj</span></lo>");
			}
			for(var i in friendList){
				$("#list").append("<lo><div class = 'nodeContainer'><div class = 'iconContainer'><img src = 'img/" + friendList[i]._id + ".png' class = 'icon' onerror = 'imgError(this)'</img></div><div><span style='font-weight: bold; font-size: 16px'>" + friendList[i].displayName + "</span>&nbsp;&nbsp;<span>No Show:" + friendList[i].noShowCount + "</span><br>" + friendList[i].email + "&nbsp <button id = '" + friendList[i]._id + "' class = 'btn btn-danger unFdBtn'>unFriend</button></div></div></lo><br>");
			}
			console.log(user[0].friendList);
		},
		error: function(err){
			console.log('failed');
		}
	});
	$('#list').on('click', '.unFdBtn', function(){
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
				$('#' + fdId).text("+friend");
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

	$('#list').on('click', '.addFd', function(){
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

	$('#testAddFd').click(function() {
		var data = {
			action: "addFriend",
			friend: "56027b778ff1db68160fe358"
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

			},
			error: function (err){
				console.log ('failed', err);
				return;
			}
		});
	});

	$('#changePwBtn').click(function() {
		location.href = "#/ChangePassword";
	})
});
$(window).load(function() {
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

});
function imgError(image) {
			//console.log("gg");
			image.src = "img/noImg.jpg";
			image.onerror = "";
			return true;
		}
