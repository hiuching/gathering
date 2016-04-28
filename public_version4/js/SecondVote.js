var voteEventId = $.jStorage.get("voteEventId");
$(document).ready(function() {
	$('#bigIconImg').removeClass();
	$('#bigIconImg').addClass("fa fa-cubes fa-2x");
	$('#bigIcon').text("Voting");
	//var startDate = $.jStorage.get("startDate");
	//var endDate = $.jStorage.get("endDate");
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
			$('#confirmDateTab').text("Confirmed Date: " + event.result.date);
			for(var i in event.choice) {
				console.log("choice" + event.choice);
				$('#suggestionText').text(event.choice[i].suggestion);
				$('#suggestionContainer').append($('.blank').html());
			}
			chooseSuggest();
			unChooseSuggest();
		},
		error: function(err){
			console.log('failed');
		}
	});

	$('#submit').click(function() {
		submitText();
		
	})

	$('#reset').click(function() {
		$('.choose').addClass("notChoose").removeClass("choose");
	});
});

function chooseSuggest() {
	$('.suggestionButton').on('click', '.notChoose', function() {
		console.log(this);
		$('.choose').addClass("notChoose").removeClass("choose");
		$(this).removeClass("notChoose");
		$(this).addClass("choose");
	});
}

function unChooseSuggest() {
	$('.suggestionButton').on('click', '.choose', function() {
		console.log(this);
		$(this).removeClass("choose");
		$(this).addClass("notChoose");
	});
}

function submitText() {
	console.log($('.choose').children("#suggestionText").text());
	if($('.choose').children("#suggestionText").text() == null && $('.choose').children("#suggestionText").text() == "" && $('.choose').children("#suggestionText").text() == undefined)
		return;
	var putData = {
		"action" : "choice",
		"userId" : userId,
		"suggestion" : $('.choose').children("#suggestionText").text(),
	};

	$.support.cors = true;
	putData = JSON.stringify (putData);
	$.ajax({
		type: 'PUT',
		contentType: 'application/json',
		url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/event/' + voteEventId,
		data: putData,
		dataType: 'json',
		success: function (event) {
			console.log ('success', event);
			alert("Success! We will redirect you to Home page");
			setTimeout(function() {window.location.href = '#/';}, 3000);
			
		},
		error: function (err){
			console.log ('failed', err);

		}
	});
}