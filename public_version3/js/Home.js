
$(document).ready(function() {
	$.jStorage.set("currentPage", "home");
	$('#bigIconImg').removeClass();
	$('#bigIconImg').addClass("fa fa-home fa-2x");
	$('#bigIcon').text("Home");
	//console.log("in");
	var data = {
		action: "findEventByInvolvedUser",
		user: userId
	}
	$.support.cors = true;
	$.ajax({
		type: 'GET',
		contentType: 'application/json',
		url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/event',
		data: data,
		dataType: 'json',
		success: function(event) {
			console.log('success', event);
			var myEventCount = 0;
			for(var i in event){
				if(event[i].owner._id == userId) {
					$('#ownEventName').text(event[i].name);
					$('#joinNo').text(event[i].accepted.length);
					$('#ownEventContainer').append($('.blank').html());
					myEventCount++;
				} else {
					$('#ownerImg').attr("src","img/" + event[i].owner._id + ".png");
					$('#ownerName').text(event[i].owner.displayName);
					$('#eventName').text(event[i].name);
					$('#description').text(event[i].description);
					$('#period').text(event[i].startDate + " - " + event[i].endDate);
					$('#noOfFd').text(event[i].invited.length);
					$('#budget').text(event[i].budget);
					$('#cd-timeline').append($('#appendBlock').html());
				}
			}
			$("#ownEventContainer").css("width", myEventCount * 260 + "px");
			$('.rectangle_bottom').on("click", function() {
				console.log("ownEventName = " + $(this).children("#ownEventName").text());
			})
		},
		error: function(err){
			console.log('failed', err);

		}
	});

	$('#createLink').click(function() {
		window.location.href = "#/create";
		$('#bigIconImg').removeClass();
		$('#bigIconImg').addClass("fa fa-users fa-2x");
		$('#bigIcon').text("Create Gathering");
	});

	
});

function imgError(image) {
	//console.log("gg");
	image.src = "img/noImg.jpg";
	image.onerror = "";
	return true;
}