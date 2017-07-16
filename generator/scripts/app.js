(function(){
	var continents = require('../../countries/10m/index');
	var leafletCountries = {};
	var allowedCountries = {};
	var async = require('async');
	var filesaver = require('filesaver.js');
	var base64 = require('js-base64').Base64;
	var DEFAULT_FILL='#fff';
	var SELECTED_FILL='#aaffaa';
	var ALERT_TEXT = '<div class="alert alert-danger"><strong>Hold up, cowboy!</strong> This browser is <em>way too old</em> to be using the Internet.'+
					 '<br><br>This web app won\'t work until you <a class="btn btn-danger" href="http://browsehappy.com/">Update your Browser</a></div>';
	var $progressBar = $('<div class="panel panel-default panel-progress"><div class="panel-heading">Loading…</div><div class="panel-body"><div class="progress progress-striped active"><div class="progress-bar"  role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0"></div></div></div></div>');
	var maps = {};

	var analytics = function(){
		(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
		(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
		m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
		})(window,document,'script','//www.google-analytics.com/analytics.js','ga');

		ga('create', 'UA-2547771-21', 'kyd.com.au');
		ga('send', 'pageview');
	}


	// Ensure we have jQuery, JSON and Blob support. jQuery 2 will fail to load
	// in older browsers, so check it.
	if(!window.$ || !window.JSON || !window.Blob || !window.console || !window.console.log){
		window.onload = function(){
			document.getElementById('oldie-fallback').innerHTML = ALERT_TEXT;
		}
		analytics();
		return;
	}

	// Let's get this globe rolling.
	console.log(
		'%c              •••• •••••                                  \n'+
		'            ••••••••••••••           ••                     \n'+
		'           •• •• ••••••••     ••           ••               \n'+
		'         •    • •••••••••     ••            •               \n'+
		'           ••     •••••••             •    ••••    •        \n'+
		'       •• ••••     •••••               • ••••••••           \n'+
		' •••  • •••  ••••  •••••       ••      ••••••••••••••••     \n'+
		' •••••••••••••  •• •••        ••••••••••••••••••••••••••••• \n'+
		'•••••••••••••   •   •        •••••••••••••••••••••••••••••  \n'+
		'  •  ••••••• • •••                          •••••••   •     \n'+
		'      •••••••• ••••   CUSTOM GEOJSON MAPS!  ••••••••        \n'+
		'       •••••••••• •                         ••••••••        \n'+
		'       •••••••••          •••••••••••••••••••••••  •        \n'+
		'        •••••••           •••• •  •••••••••••••• •          \n'+
		'         •••             ••••••••••••  •••••••••            \n'+
		'             •           ••••••••••••   ••  ••              \n'+
		'               •••        •• •••••••     •  •  •            \n'+
		'               ••••••         •••••          ••   •         \n'+
		'               •••••••        •••••               ••        \n'+
		'                •••••         •••• •           ••••••       \n'+
		'                ••••           ••              ••••••       \n'+
		'                •••                                ••       \n'+
		'               ••                                           \n'+
		'               ••                                           \n',
		'background: #fff; color: #68f',
		"\nPlease don't be alarmed at HTTP errors in here. Some countries "+
		"aren't available at lower resolutions, and this is a blunt"+
		"tool. :)\n\n"
	);

	var progress = function(action,valuenow,max){
		var $bw = $('.build-widget');
		var $ele = $('.build-widget').parent();
		var $progress = $ele.find('.panel-progress');

		if(action === false){
			$progress.remove();
			$bw.show();
			return;
		}
		if($progress.length == 0){
			$progress = $progressBar.clone();
			$ele.append($progress);
			$bw.hide();
		}

		$progress
			.find('.progress-bar')
				.attr('aria-valuemax',max)
				.attr('aria-valuenow',valuenow)
				.width((valuenow/max*100)+'%');
		$progress
			.find('.panel-heading')
				.html(action);
	}

	var ctxFillColor = function(country){
		return allowedCountries[country] ? SELECTED_FILL : DEFAULT_FILL;
	}
	var setCountry = function(country,val){
    	allowedCountries[country] = val;
    	if(leafletCountries[country]){
    		leafletCountries[country].setStyle({
	    		fillColor: ctxFillColor(country)
	    	});
    	}

    	var count = 0;
    	for(var i in allowedCountries){
    		if(allowedCountries[i]){
    			count++;
    		}
    	}
    	if(count == 0){
    		$('button.build').attr('disabled','disabled');
    	} else {
    		$('button.build').removeAttr('disabled');
    	}
	}

	$(document).ready(function(){

		$('#setup').hide();

		progress('Loading initial map&hellip;',100,100);
		$.getJSON('countries/110m/all.geojson',function(json){
			progress(false);
			initMap('map',json,{
			    clickable:true,
			    style: {
				    fillColor:'#fff',
				    fillOpacity:1,
				    fill:true,
				    color:'#eee',
				    weight:1,
				    opacity:1
			    },
			    pointToLayer: function (feature, latlng) {
			        return L.circleMarker(latlng)
			        	.bindLabel(feature.properties.name,{
			        		noHide:true
			        	});
			    },
			    onEachFeature: function (feature, layer) {
			    	var name = feature.properties.name;
			    	leafletCountries[name] = layer;
			    	layer.on('click',function(){
			    		setCountry(name,!allowedCountries[name]);
			    	});

			    	layer.on('mouseover',function(){
			    		layer.setStyle({
			    			fillColor: '#ffffaa'
			    		})
			    	})

			    	layer.on('mouseout',function(){
			    		layer.setStyle({
			    			fillColor: ctxFillColor(name)
			    		})
			    	})
			    }
			});
		});

		analytics();

		function initMap(target,data,opts){
			if(maps[target]){
				maps[target].remove();
			}
			maps[target] = L.map(target,{
				minZoom:1,
				maxZoom:10,
				scrollWheelZoom:false
			}).setView([0,0],2);
			L.geoJson(data,opts).addTo(maps[target]);
			return map;
		}

		$('.build').click(function(){
			var resolution = $('[name=resolution]:checked').val();
			var files = [];
			for(var country in allowedCountries){
				for(var continent in continents){
					if(allowedCountries[country] && continents[continent][country]){
						files.push('countries/'+resolution+'/'+continents[continent][country]);
					}
				}
			}

			var features = [];
			var downloadsComplete = 0;
			function progressText(){
				return 'Downloaded '+(downloadsComplete+1)+' of '+files.length+' countries&hellip;';
			}
			var action = function(item,callback){
				$.ajax({
					dataType:'json',
					url:item,
					success:function(data){
						features = features.concat(data);
						progress(progressText(),++downloadsComplete,files.length);
						callback();
					},
					error: function(e){
						progress(progressText(),++downloadsComplete,files.length);
						callback();
					}
				})
			}
			var complete = function(err){
				var geojson = {
				  "type": "FeatureCollection",
				  "features": features
				}
				var jsonString = JSON.stringify(geojson);
				var geoJsonBlob = new Blob([jsonString], {type: "application/json;charset=utf-8"});
				filesaver.saveAs(geoJsonBlob,'custom.geo.json');
				$('.results .kb').text(Math.round(jsonString.length/1024));



				$('#setup').show();
				initMap('preview-map',geojson,{
					clickable:false,
					style:{
			            color:'#fff',
			            weight:1,
			            opacity:1,
			            fill: true,
			            fillColor: '#fff',
			            fillOpacity: 1
			        }
				});
				$("html, body").animate({ scrollTop: $('#setup').offset().top+'px' });
				progress(false);

			}

			// Download files two at a time.
			progress(progressText(),0,files.length);
			async.eachLimit(files,10,action,complete);
		});

		$('.continents input').change(function(){
			var val = $(this).is(':checked');
			var continent = $(this).val();

			for(var country in continents[continent]){
				setCountry(country,val);
			};
		});

	});
})();
