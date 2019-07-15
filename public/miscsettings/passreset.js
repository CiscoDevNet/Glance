$(document).ready(function () {
    //submit:
    $('#id_sub').bind('click', function () {
        var acc =$('#id_account_name').val().trim()
		var prevPass =$('#id_old_pass').val().trim()
		var newPass =$('#id_new_pass').val().trim()
		var newPassRetype =$('#id_new_pass_retype').val().trim()
		if(acc!="" && prevPass!="" && newPass!="" && newPassRetype==newPass){
			var tmpurl="/api/v1/session/pass?uid="+acc +"&password="+prevPass+"&newpass="+newPass
			var submitData = {
				uid:acc
			};

			$.ajax({
				url: tmpurl,
				type: 'POST',
				contentType: "application/json",
				data: JSON.stringify(submitData),
				success: function (inResponse) {
					console.log('success submit~');
					$('#id_account_name').val('');
					$('#id_old_pass').val('');
					$('#id_new_pass').val('');
					$('#id_new_pass_retype').val('');
				},
				error: function(xhr, status, text) {
					if(xhr.status==401){
						$(location).attr('href', '/login.html?redirect=%2fupdatetitle.html');
					}
				}
			});

		}
	});
    //page2 code goes here...
});