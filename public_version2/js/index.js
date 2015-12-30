$(document).ready(function() {
	$("#left_circle").click(function(){
		document.location.href='register.html?forget';
	});

	$("#right_circle").click(function(){
		document.location.href='register.html?joinUs';
	});

	$(".inputEnter").keypress(function (e) {
		if (e.which == 13) {
			submitData();
		}
	});

	$("#login").click(function () {
			submitData();
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
		field: '#pw',
		control: '#showPw'
	});

	function submitData(){
		if ($('#email').val() == "" || $('#pw').val() == "") {
			$('#msg').text ("Please fill in both email and password");
			return;
		}
		var data = {
			email: $.trim($('#email').val()),
			password: $.trim($('#pw').val())
		}
		$.support.cors = true;
		$.ajax({
			type: 'GET',
			contentType: 'application/json',
			url: 'http://ec2-52-68-199-65.ap-northeast-1.compute.amazonaws.com:8081/login',
			data: data,
			dataType: 'json',
			success: function(user) {
				var str = 'email:' + user.email;
				console.log('success', str);
				$('#msg').css("color", "rgb(188,230,35)");
				$('#msg').text ("Login successful");
				$.jStorage.set("userEmail", user.email);
				$.jStorage.set("userId", user._id);
				$.jStorage.set("displayName", user.displayName);
				//$.jStorage.set("currentPage", "home");
				if (user.displayName == null)
					window.location.href = 'master.html/#setting';
					else
						window.location.href = 'master.html';
				
			},
			error: function(err){
				console.log('failed', err);
				$('#msg').text ("Incorrect email or password");
			}
		});
	}
});