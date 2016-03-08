
$(document).ready(function() {
	$.jStorage.set("currentPage", "home");
	$('#bigIconImg').removeClass();
	$('#bigIconImg').addClass("fa fa-home fa-2x");
	$('#bigIcon').text("Home");
	$.jStorage.set("eventId", "");
	$.jStorage.set("checkOwnEvent", false);
	$('#ownEventContainer').empty;

	function topColor(count) {
		var color = count % 4;
		switch(color) {
			case 0:
				$('#rectangle_top').css("background", "#A9D2D1");
				break;

			case 1:
				$('#rectangle_top').css("background", "#F9C848");
				break;

			case 2:
				$('#rectangle_top').css("background", "#F63D3D");
				break;

			case 3:
				$('#rectangle_top').css("background", "#00B498");
				break;

		}
	}
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
			var hasOwnEvent = false;
			for(var i in event){
				if(event[i].owner._id == userId) {
					hasOwnEvent = true;
					$('#ownEventName').text(event[i].name);
					$('#joinNo').text(event[i].period.length);
					$('#ownEventId').text(event[i]._id);
					topColor(myEventCount);
					$('#ownEventContainer').append($('.blank').html());
					myEventCount++;
				} else {
					$('#ownerImg').attr("src","img/" + event[i].owner._id + ".png");
					$('#ownerName').text(event[i].owner.displayName);
					$('#eventName').text(event[i].name);
					$('#eventId').text(event[i]._id);
					$('#description').text(event[i].description);
					$('#period').text(event[i].startDate + " - " + event[i].endDate);
					$('#noOfFd').text(event[i].invited.length);
					$('#budget').text(event[i].budget);
					$('#cd-timeline').append($('#appendBlock').html());
				}
			}

			if(hasOwnEvent == false) {
				console.log("false");
				$('#noEventContainer').append($('.board').html());
			}

			$("#ownEventContainer").css("width", myEventCount * 260 + "px");
			$('.rectangle_bottom').on("click", function() {
				console.log("ownEventId = " + $(this).children("#ownEventId").text());
				$.jStorage.set("eventId", $(this).children("#ownEventId").text());
				$.jStorage.set("checkOwnEvent", true);
				window.location.href = "#/create";
			});
			$('.rectangle_bottom_none').on("click", function() {
				window.location.href = "#/create";
			});
			setNotJoinFunction();
			//double_confirm();

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

var parentDiv;

function setNotJoinFunction() {
	$('.cd-timeline-content').on('click', '.red', function(){
		$(this).attr("disabled", true);
		var doUConfirm = confirm('Are you sure not to join this event?');
		if (doUConfirm === true) {
			parentDiv = $(this).parent().parent().parent().parent().parent().parent();
			var rejectEventId = parentDiv.children("#eventId").text();
			var notJoinData = {
				action: "reject",
				reject: userId
			};
			$.support.cors = true;
			notJoinData = JSON.stringify(notJoinData);
			$.ajax({
				type: 'PUT',
				contentType: 'application/json',
				url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/event/' + rejectEventId,
				data: notJoinData,
				dataType: 'json',
				success: function(event) {
					console.log('success');
					parentDiv.parent().remove();
					parentDiv = null;
				},
				error: function(err) {
					console.log('failed', err);
				}
			});
		}
		return false;
	});
}



function imgError(image) {
	//console.log("gg");
	image.src = "img/noImg.jpg";
	image.onerror = "";
	return true;
}