$(document).ready(function() {
	var colorCount = 0;
	var colorAns;
	var color;
	var aDate = [];
	var between = [];
	var eventStart,eventEnd;

	
    // page is now ready, initialize the calendar...
    $('#calendar').fullCalendar({

		schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
		selectable: true,
		selectHelper: true,
		select: function(start, end) {
			var startDate = start;
			var endDate = end;
			var currentDate = new Date(startDate);
			between = [];

			while (currentDate < endDate) {
				//var currentDateStr = currentDate.getFullYear() + '-' + (currentDate.getMonth() + 1) + '-' + currentDate.getDate();
				var currentDateStr = moment(currentDate).format("YYYY-MM-DD");
				between.push(currentDateStr);
				currentDate.setDate(currentDate.getDate() + 1);
				//console.log(currentDateStr);
			}
			console.log(between);
		},
		events: function(start, end, timezone, callback) {
				var events = [];
				$.support.cors = true;
				var eventData = {
					action: "findEventById",
					id: "56d40ffc3a4952851f51e367",
				};
				$.ajax({
					type: 'GET',
					contentType: 'application/json',
					url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/event',
					data: eventData,
					dataType: 'json',
					success: function(event) {
						console.log('success', event);
						eventStart 	= event.startDate;
						eventEnd	= event.endDate;
						for(var msgKey in event.period) {
							colorAns = colorCount % 5;
							switch(colorAns) {
								case 0:
									color = "blue";
									break;
								case 1:
									color = "green";
									break;
								case 2:
									color = "orange";
									break;
								case 3:
									color = "red";
									break;
								case 4:
									color = "purple";
									break;
							}
							colorCount++;
							for(var key in event.period[msgKey].period) {
								console.log(event.period[msgKey].userId.displayName + "_" + event.period[msgKey].period[key]);
								events.push({
									title: event.period[msgKey].userId.displayName,
									start: event.period[msgKey].period[key],
									color: color
								});
							}
						}
						var eventEndDate = toDate(eventEnd);
						console.log("event End Date" + eventEndDate);
						events.push({
							start: eventStart,
							end: eventEndDate,
							overlap: true,
							rendering: 'background',
							color: '#FFDDD5'
						});
						callback(events);
						//console.log(joinName);
						//console.log(aDate);
					},
					error: function(err){
						console.log('failed');
					}
				});
		},
		/*selectConstraint: {
          		start: eventStart,
          		end: eventEnd
        	},*/
		
		
    });

	$('#submit').click(function(){
		
		var putData = {
			"action" : "period",
			"period" : {
				"userId" : "56027b778ff1db68160fe358",
				"period" : between
			},
			"choice" : {
				"suggestion" : $.trim($('#suggest').val())
			}
		};

		$.support.cors = true;
		putData = JSON.stringify (putData);
		$.ajax({
			type: 'PUT',
			contentType: 'application/json',
			url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/event/56d40ffc3a4952851f51e367',
			data: putData,
			dataType: 'json',
			success: function (event) {
				console.log ('success', event);
				
			},
			error: function (err){
				console.log ('failed', err);
	
			}
		});
	});
});

function toDate(dateStr) {
    var parts = dateStr.split("-");
	parts[2] = parseInt(parts[2]) + 1;
    var date = parts[0] + "-" + parts[1] + "-" + parts[2];
	return date;
}