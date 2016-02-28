//var jq = $.noConflict();
var friendIdArray = new Array();
var userId = $.jStorage.get("userId");
var displayName = $.jStorage.get("displayName");
var userEmail = $.jStorage.get("userEmail");
var currentPage = $.jStorage.get("currentPage");
if (userId == null ||userEmail == null)
	window.location.href = "index.html";
var loadFdList;
var isSearch = false;
var searchedUser = new Array();
$(document).ready(function() {
	
	$('#logOut').click(function() {
		$.jStorage.flush();
		window.location.href = "index.html";
	});

	$('#searchBtn').click(function() {
		searchFriends();
	});

	$('#searchBtn, #searchBox').keypress(function (e) {
		if (e.which == 13) {
			searchFriends();
		}
	});
	
	function searchFriends() {
		isSearch = true;
		if(($('#searchBox').val()) == '')
			return;
		window.location.href = "#/setting";
		$('#searchList').children().remove();
		$('#searchList').append("<span style = 'font-weight: bold'>Loding...</span>");
		var data = {
			_id: userId
		};
		$.support.cors = true;
		//find the current user's fd
		$.ajax({
			type: 'GET',
			contentType: 'application/json',
			url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/user/',
			data: data,
			dataType: 'json',
			success: function(user) {
				console.log('---success',user);
				if (user != '') {
					friendList = user[0].friendList;
					friendIdArray.length = 0;
					for(var i in friendList){
						console.log(friendList[i].email);	
						friendIdArray.push(friendList[i]._id);
					}
				}
				console.log(friendIdArray);
				data = {
				action: "searchFriends",
				displayName: $.trim($('#searchBox').val())
				};

				//show search result
				$.ajax({
					type: 'GET',
					contentType: 'application/json',
					url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/user/',
					data: data,
					dataType: 'json',
					success: function(user) {
						console.log('success search', user);
						//console.log("abc");
						//$('#searchFdPannel').show();
						$('#searchList').children().remove();
						console.log("removed");
						//console.log("inArray", $.inArray(user[i]._id, friendIdArray));
						if(user == '') {
							searchedUser = new Array();
							//$('#searchList').append("<span style = 'font-weight: bold'>No result</span>");
						} else {
							searchedUser = user;
							/*
							for(var i in user) {
							console.log("inArray", $.inArray(user[i]._id, friendIdArray));
							if(user[i]._id == userId)
								$('#searchList').append("<lo><div class = 'nodeContainer'><div class = 'iconContainer'><img src = 'img/" + user[i]._id + ".png' class = 'icon' onerror = 'imgError(this)'</img></div><div><span style='font-weight: bold; font-size: 16px'>" + user[i].displayName + "</span>&nbsp;&nbsp;<span>No Show:" + user[i].noShowCount + "</span><br>" + user[i].email + "</div></div></lo><br>");
							else if(($.inArray(user[i]._id, friendIdArray)) > -1)
								$('#searchList').append("<lo><div class = 'nodeContainer'><div class = 'iconContainer'><img src = 'img/" + user[i]._id + ".png' class = 'icon' onerror = 'imgError(this)'</img></div><div><span style='font-weight: bold; font-size: 16px'>" + user[i].displayName + "</span>&nbsp;&nbsp;<span>No Show:" + user[i].noShowCount + "</span><br>" + user[i].email + "&nbsp <button id = '" + user[i]._id + "' class = 'btn btn-danger unFdBtn'>unFriend</button></div></div></lo><br>");
							else
								$('#searchList').append("<lo><div class = 'nodeContainer'><div class = 'iconContainer'><img src = 'img/" + user[i]._id + ".png' class = 'icon' onerror = 'imgError(this)'</img></div><div><span style='font-weight: bold; font-size: 16px'>" + user[i].displayName + "</span>&nbsp;&nbsp;<span>No Show:" + user[i].noShowCount + "</span><br>" + user[i].email + "&nbsp <button id = '" + user[i]._id + "' class = 'btn btn-success addFd'>+Friend</button></div></div></lo><br>");
							}
							*/
						}
						window.location.href = "#/setting#searchFdPannel";
						//$('#searchFdPannel').show();
						isSearch = false;
					},
					error: function(err){
						console.log('failed');
						isSearch = false;
					}
				});
			},
			error: function(err){
				console.log('failed');
				isSearch = false;
			}
		});
		
	}

	//function showResult(user) {}
});