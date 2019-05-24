$(document).ready(function () {
    //submit:
    $('#id_sub').bind('click', function () {
        var zoneId =$('#id_zone').val().trim()
		var msg =$('#id_msg').val().trim()

		console.log("zone:"+zoneId)
		console.log("msg:"+msg)
		if(zoneId!="" && msg!=""){
			var submitData = {
				message:msg,
				zone:zoneId
			};

			$.ajax({
				url: '/api/v1/message/spark/zone/'+zoneId+'/'+msg,
				type: 'POST',
				contentType: "application/json",
				data: JSON.stringify(submitData),
				success: function (inResponse) {
					console.log('success submit~');
					$('#id_msg').val('');
				},
				error: function(xhr, status, text) {
					if(xhr.status==401){
						$(location).attr('href', '/login.html?redirect=%2fzonebroadcasting.html');
					}else if(xhr.status==404){
						$(window).status="No active user in the zone!"
					}
				}
			});

		}
	});
    //page2 code goes here...
});