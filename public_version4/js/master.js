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
var searchFinished = false;
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
		$('#searchList').append("<span style = 'font-weight: bold'>Loading...</span>");
		var data = {
			_id: userId
		};
		$.support.cors = true;
		//find the current user's fd
		$.ajax({
			type: 'GET',
			contentType: 'application/json',
			url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/user',
			data: data,
			dataType: 'json',
			success: function(user) {
				console.log('---success',user);
				//$('#searchList').children().remove();
				//$('#searchList').append("<span style = 'font-weight: bold'>Loading...</span>");
				if (user != '') {
					friendList = user[0].friendList;
					friendIdArray.length = 0;
					for(var i in friendList){
						console.log(friendList[i].email);	
						friendIdArray.push(friendList[i]._id);
					}
				}
				console.log(friendIdArray);
				if(isValidEmailAddress($.trim($('#searchBox').val()))) {
					data = {
						action: "searchUserByEmail",
						email: $.trim($('#searchBox').val())
					};
				}else {
					data = {
						action: "searchFriends",
						displayName: $.trim($('#searchBox').val())
					};
				}
					//show search result
					$.ajax({
						type: 'GET',
						contentType: 'application/json',
						url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/user',
						data: data,
						dataType: 'json',
						success: function(user) {
							console.log('success search', user);
							$('#searchList').children().remove();
							console.log("removed");
							//console.log("inArray", $.inArray(user[i]._id, friendIdArray));
							if(user == '') {
								searchedUser = new Array();
								searchFinished = true;
								//$('#searchList').append("<span style = 'font-weight: bold'>No result</span>");
							} else {
								searchedUser = user;
								console.log("search user = " + searchedUser)
							}
							window.location.href = "#/setting#searchFdPannel";
							//$('#searchFdPannel').show();
							searchFinished = true;
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

function isValidEmailAddress(emailAddress) {
	var pattern = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
	return pattern.test(emailAddress);
};