$(document).ready(function() {
	var attendeeString;
	$('#bigIconImg').removeClass();
	$('#bigIconImg').addClass("fa fa-cubes fa-2x");
	$('#bigIcon').text("Voting");
	//var startDate = $.jStorage.get("startDate");
	//var endDate = $.jStorage.get("endDate");
	var voteEventId = $.jStorage.get("voteEventId");
	//eventData id is hardcoding, pls change to voteEventId before release
	var eventData = {
		action: "findEventById",
		id: voteEventId,
	};
	
	$.ajax({
		type: 'GET',
		contentType: 'application/json',
		url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/event/',
		data: eventData,
		dataType: 'json',
		success: function(event) {
			console.log('success', event);
			$('#eventNameTab').text("Event Name: " + event.name);
			$('#eventName').text("Event Name: " + event.name);
			//need to wait Ching to add confirmedDate in result, temporary use start date
			$('#confirmDateTab').text("Confirmed Date: " + event.result.date);
			$('#confirmedDate').text("Confirmed Date: " + event.result.date);
			//need to wait Ching to return back the final result, temporary comment
			$('#voted').text("Voted: " + event.result.choice);
			for(var msgKey in event.period) {
				if(msgKey == 0)
					attendeeString = event.period[msgKey].userId.displayName;
				else
					attendeeString = attendeeString + ", " + event.period[msgKey].userId.displayName;
			}
			$('#attendee').text("Attendee: " + attendeeString);
			
		},
		error: function(err){
			console.log('failed');
		}
	});

	$('#backToHome').click(function() {
		window.location.href = "http://52.68.199.65:8081/master.html";
	});
});