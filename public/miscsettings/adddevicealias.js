$(document).ready(function () {
    //submit:
    $('#id_sub').bind('click', function () {
        var id_val =$('#id_device_id').val().trim()
		var id_mac =$('#id_device_mac_address').val().trim()
		//console.log("title:"+title)
		if(id_val!="" && id_mac!=""){
			var submitData = {
				id:id_val,
				macAddress:id_mac
			};

			$.ajax({
				url: '/api/v1/device_alias/add',
				type: 'POST',
				contentType: "application/json",
				data: JSON.stringify(submitData),
				success: function (inResponse) {
					console.log('success submit~');
					$('#id_device_id').val('');
					$('#id_device_mac_address').val('');
				},
				error: function(xhr, status, text) {
					if(xhr.status==401){
						$(location).attr('href', '/login.html?redirect=%2fadddevicealias.html');
					}
				}
			});

		}
	});
    //page2 code goes here...
});