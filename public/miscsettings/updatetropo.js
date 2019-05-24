$(document).ready(function () {
    //submit:
    $('#id_sub').bind('click', function () {
        var title =$('#id_tropo').val().trim()
		console.log("token:"+title)
		if(title!=""){
			var submitData = {
				value:title
			};

			$.ajax({
				url: '/api/v1/conf/tropoSetting/tropoAuthToken',
				type: 'POST',
				contentType: "application/json",
				data: JSON.stringify(submitData),
				success: function (inResponse) {
					console.log('success submit~');
					$('#id_tropo').val('');
				},
				error: function(xhr, status, text) {
					if(xhr.status==401){
						$(location).attr('href', '/login.html?redirect=%2fupdatetropo.html');
					}
				}
			});

		}
	});
    //page2 code goes here...
});