$(document).ready(function () {
    //submit:
    $('#id_sub').bind('click', function () {
        var token =$('#id_spark_token').val().trim()
		var acc =$('#id_spark_acc').val().trim()
		var name =$('#id_spark_name').val().trim()
		if(name=="")
			name="DevNet Glance"
		console.log("token:"+token)
		if(token!="" && acc!="" && name!=""){
			var spark={
				uri: "https://api.ciscospark.com/v1/messages",
				account: acc,
				displayName: name,
				avatar: "",
				token: token
			}

			var submitData = {
				value:spark
			};

			$.ajax({
				url: '/api/v1/conf/sparkSetting',
				type: 'POST',
				contentType: "application/json",
				data: JSON.stringify(submitData),
				success: function (inResponse) {
					console.log('success submit~');
					$('#id_spark_token').val('');
					$('#id_spark_acc').val('');
					$('#id_spark_name').val('');
				},
				error: function(xhr, status, text) {
					if(xhr.status==401){
						$(location).attr('href', '/login.html?redirect=%2fupdatespark.html');
					}
				}
			});

		}
	});
    //page2 code goes here...
});