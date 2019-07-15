$(document).ready(function () {
    //submit:
    $('#id_sub').bind('click', function () {
        var on =false
		if($('#id_auto_userprofile').prop('checked'))
			on=true
		console.log("auto user profile:"+on)
		var submitData = {
			value:on
		};

		$.ajax({
			url: '/api/v1/conf/userDataImportSupported',
			type: 'POST',
			contentType: "application/json",
			data: JSON.stringify(submitData),
			success: function (inResponse) {
				console.log('success submit~');
				$('#id_auto_userprofile').prop('checked', !on)
			},
			error: function(xhr, status, text) {
				if(xhr.status==401){
					$(location).attr('href', '/login.html?redirect=%2fonoffautoprofile.html');
				}
			}
		});


	});
    //page2 code goes here...
});