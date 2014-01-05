window.onload = function(){
	// create a map in the "map" div, set the view to a given place and zoom
	var au = [
		[-10,110],
		[-44,155]
	];
	var allowedCountries = {};
	var map = L.map('map',{minZoom:2})
		.fitBounds(au);

	$.getJSON('../data/source/ne_110m_admin_0_countries.geo.json',function(json){
		L.geoJson(json,{
		    clickable:true,
		    style: function(item){
		    	if(item.properties.type == 'stateline'){
		    		return {
					    fill:false,
					    stroke:true,
					    color:'#EAEAEA',
					    weight:2
					}
		    	} if(item.geometry.type == 'Point'){
		    		if(item.properties.importance > 1){
		    			return {
		    				fill:false,
		    				stroke:false
		    			}
		    		}

		    		return {
			        	fill:true,
			        	fillOpacity:1,
			        	stroke:false,
			        	fillColor:"#aaa",
			        	radius: 2 / item.properties.importance
		       		}
		       		
		        } else {
		    		return {
					    fillColor:'#fff',
					    fillOpacity:1,
					    fill:true,
					    color:'#eeeeff',
					    weight:1
					}
		    	}
		    },
		    pointToLayer: function (feature, latlng) {
		        return L.circleMarker(latlng)
		        	.bindLabel(feature.properties.name,{
		        		noHide:true
		        	});
		    },
		    onEachFeature: function (feature, layer) {
		    	var name = feature.properties.name;
		    	function ctxFillColor(){
		    		return allowedCountries[name] ? '#ffddff' : '#fff';
		    	}
		    	layer.on('click',function(){
			    	allowedCountries[name] = !allowedCountries[name];
			    	console.log(allowedCountries[name])
			    	layer.setStyle({
			    		fillColor: ctxFillColor()
			    	});
		    	});

		    	layer.on('mouseover',function(){
		    		layer.setStyle({
		    			fillColor: '#ffaaff'
		    		})
		    	})

		    	layer.on('mouseout',function(){
		    		layer.setStyle({
		    			fillColor: ctxFillColor()
		    		})
		    	})
		    }
		}).addTo(map);

	});

}
