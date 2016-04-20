$.support.cors = true;
var i=0;

		var eventData = {
			action: "findEventById",
			id: "56e075998b0dcd304d1ae68c",
		};
		$.ajax({
			type: 'GET',
			contentType: 'application/json',
			url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/event',
			data: eventData,
			dataType: 'json',
			success: function(event) {
				console.log('success', event);
				$('#name').text(event.name);
				$('#period').text(event.startDate + " ~ " + event.endDate);
				$('#eventType').text(event.types);
				for(i in event.choice) {
                $('#listid').append("<li>" + event.choice[i].suggestion + "<li>");
                }
                },
			error: function(err){
				console.log('failed');
			}
		});

