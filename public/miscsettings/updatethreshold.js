$(document).ready(function () {
    //submit:
    $('#id_sub').bind('click', function () {
        var threshold =$('#id_threshold').val().trim()
		var nThreshold= parseInt(threshold) || 0
		if(nThreshold<0)
			nThreshold=0

		console.log("threshold:"+threshold)
		if(nThreshold>=0){
			var submitData = {
				value:nThreshold
			};

			$.ajax({
				url: '/api/v1/zonecounting/threshold/'+nThreshold,
				type: 'POST',
				contentType: "application/json",
				data: JSON.stringify(submitData),
				success: function (inResponse) {
					console.log('success submit~');
					$('#id_threshold').val('');
				},
				error: function(xhr, status, text) {
					if(xhr.status==401){
						$(location).attr('href', '/login.html?redirect=%2fupdatethreshold.html');
					}
				}
			});

		}
	});
    //page2 code goes here...
});