$(document).ready(function () {
    //submit:
    $('#id_sub').bind('click', function () {
        var title =$('#id_company_title').val().trim()
		console.log("title:"+title)
		if(title!=""){
			var submitData = {
				value:title
			};

			$.ajax({
				url: '/api/v1/conf/companyName',
				type: 'POST',
				contentType: "application/json",
				data: JSON.stringify(submitData),
				success: function (inResponse) {
					console.log('success submit~');
					$('#id_company_title').val('');
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