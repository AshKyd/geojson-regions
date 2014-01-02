window.onload = function(){
	// create a map in the "map" div, set the view to a given place and zoom
	var map = L.map('map')
		.fitBounds([
			[-10,110],
			[-44,155]
		]);

	$.getJSON('../regions/australia.geojson',function(json){
		L.geoJson(json,{
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
					    fillColor:'white',
					    fillOpacity:1,
					    fill:true,
					    stroke:false
					}
		    	}
		    },
		    pointToLayer: function (feature, latlng) {
		        return L.circleMarker(latlng)
		        	.bindLabel(feature.properties.name,{
		        		noHide:true
		        	});
		    }
		}).addTo(map);
	})

}