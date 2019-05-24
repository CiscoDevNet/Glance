$(document).ready(function () {
    //submit:
    $('#id_sub').bind('click', function () {
        {
			$.ajax({
				url: '/api/v1/session/token',
				type: 'GET',
				contentType: "application/json",
				success: function (data) {
					console.log('success submit~');
					$('#id_token').text(data.token);
				},
				error: function(xhr, status, text) {
					if(xhr.status==401){
						$(location).attr('href', '/login.html?redirect=%2fshowtoken.html');
					}
				}
			});

		}
	});
    //page2 code goes here...
});