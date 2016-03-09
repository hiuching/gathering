$(document).ready (function() {
		var parameters = location.search.substring(1);
		/*if (parameters == "forget")
			$('#titleImg').text("Forget Password");
		else if (parameters == "joinUs")
			$('#titleImg').text("Sign Up");*/

		$('.inputEnter').keypress(function (e) {
			if (e.which == 13) {
				submitData();
			}
		});

		$('#submitBtn').click(function() {
			submitData();
		});

		function submitData() {
			if (($('#email').val()) == ""){
				$('#msg').css("color", "red");
				$('#msg').text ("Please fill in your email address");
				return false;
			}
			if(!isValidEmailAddress($('#email').val())) {
				$('#msg').css("color", "red");
				$('#msg').text ("Please fill a correct email address");
				return false;
			}
			$(".inputEnter").attr("disabled", true);
			var data = {
				email: $.trim($('#email').val())
			}
			$.support.cors = true;
			data = JSON.stringify (data);
			$.ajax({
				type: 'POST',
				contentType: 'application/json',
				url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/gathering/user',
				data: data,
				dataType: 'json',
				success: function (user) {
					var str = 'email:' + user.email;
					console.log ('success', str);
					if (parameters == "forget"){
						$('#msg').css("color", "rgb(188,230,35)");
						$('#msg').html("Your password is reset successfully, Please check your mail box to get a new password.<br/> The browser will redirect to login page after 5 seconds...");
					}else if (parameters == "joinUs"){
						$('#msg').css("color", "rgb(188,230,35)");
						$('#msg').html("Registration is successful. Please check your mail box to get a password.</br> The browser will redirect to login page after 5 seconds...");
					}
					setTimeout(function() {window.location.href = 'index.html';}, 5000);

				},
				error: function (err){
					console.log ('failed', err);
					$('#msg').css("color", "red");
					$('#msg').text ("Wrong email address");
					$(".inputEnter").attr("disabled", false);
				}
			});
		}
	});

	function isValidEmailAddress(emailAddress) {
		var pattern = /^([a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+(\.[a-z\d!#$%&'*+\-\/=?^_`{|}~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]+)*|"((([ \t]*\r\n)?[ \t]+)?([\x01-\x08\x0b\x0c\x0e-\x1f\x7f\x21\x23-\x5b\x5d-\x7e\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|\\[\x01-\x09\x0b\x0c\x0d-\x7f\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))*(([ \t]*\r\n)?[ \t]+)?")@(([a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\d\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.)+([a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]|[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF][a-z\d\-._~\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]*[a-z\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])\.?$/i;
		return pattern.test(emailAddress);
	};