$(document).ready(function() {

		var sites = ["http://irispass.fr"];

		sitesIndex = 0;

		$(document).on('click', '#goButton', function() {
			
			var website = $('#urlInput').val();

			if(website.substr(0,7) != 'http://'){
				website = 'http://' + website;
			}

			$('#frame').attr('src', website);
			$('#urlInput').val(website);

			sites.push(website);

			$('#backButton').on('click', function(){
				sitesIndex = (sitesIndex + sites.length - 1) % (sites.length);    
				
				var website = sites[sitesIndex];

				$('#urlInput').val(website);

				$('#frame').attr('src', website);
			});


			$('#forwardButton').on('click', function(){
				sitesIndex = (sitesIndex + sites.length + 1) % (sites.length);    
				
				var website = sites[sitesIndex];

				$('#urlInput').val(website);

				$('#frame').attr('src', website);
			});

		});

		$('#homeButton').on('click', function() {

			$('#frame').attr('src', 'http://irispass.fr');
		})

	});