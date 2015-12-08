$(document).ready(function() {
		$('#saveButton').click(function() {
			submitData();
		});	

		$(".inputEnter").keypress(function (e) {
			if (e.which == 13) {
				submitData();
			}
		});

		$.toggleShowPassword = function (options) {
			var settings = $.extend({
				field: "#password",
				control: "#toggle_show_password",
			}, options);

			var control = $(settings.control);
			var field = $(settings.field)

			control.bind('click', function () {
				if (control.is(':checked')) {
					field.attr('type', 'text');
				} else {
					field.attr('type', 'password');
				}
			});
		};
		//Here how to call above plugin from everywhere in your application document body
		$.toggleShowPassword({
			field: '#currentPw',
			control: '#showPw'
		});
		$.toggleShowPassword({
			field: '#newPw',
			control: '#showPw'
		});
		$.toggleShowPassword({
			field: '#confirmPw',
			control: '#showPw'
		});

		function submitData() {
			if ($('#newPw').val() == '' || $('#confirmPw').val() == '')
				return;

			if ($('#newPw').val().length < 8 || $('#newPw').val().length > 16){
				$('#msg').css("color", "red");
				$('#msg').text ("The length of password need to be longer than 8chars and shorter than 16chars!");
				return;
			}

			if ($('#newPw').val() != $('#confirmPw').val()){
				$('#msg').css("color", "red");
				$('#msg').text("The new password is not same to the confirmed password");
				return;
			}

			console.log($('#newPw').val());
			console.log($('#newPw').val().length);
			var data = {
				action: "setPassword",
				currentPassword: $.trim($('#currentPw').val()),
				newPassword: $.trim($('#newPw').val())
			}
			$.support.cors = true;
			data = JSON.stringify(data);
			$.ajax({
				type: 'PUT',
				contentType: 'application/json',
				url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/user/'+ userId,
				data: data,
				dataType: 'json',
				success: function(user) {
					var str = user.email;
					console.log('success', str);
					$('#msg').css("color", "rgb(188,230,35)");
					$('#msg').text("Your password is updated successfully.");
					$('.textbox').val("");
				},
				error: function(err){
					console.log('failed', err);
					$('#msg').css("color", "red");
					$('#msg').text("Incorrect password");
					$('.textbox').val("");
				}
			});
		}
	});