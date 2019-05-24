$(document).ready(function () {
    //submit:
    $('#id_sub').bind('click', function () {
        var on =false
		if($('#id_movement_animation').prop('checked'))
			on =true
		console.log("Movement Animation:"+on)
		var submitData = {
			value:on
		};

		$.ajax({
			url: '/api/v1/conf/animationSupport',
			type: 'POST',
			contentType: "application/json",
			data: JSON.stringify(submitData),
			success: function (inResponse) {
				console.log('success submit~');
				$('#id_movement_animation').prop('checked', !on)
			},
			error: function(xhr, status, text) {
				if(xhr.status==401){
					$(location).attr('href', '/login.html?redirect=%2fonffanimation.html');
				}
			}
		});


	});
    //page2 code goes here...
});