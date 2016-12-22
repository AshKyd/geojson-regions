const fs = require('fs');
const path = require('path');
const argv = process.argv;
const file = fs.readFileSync(argv[argv.length-1], 'utf8');
const geojson = JSON.parse(file);

const regions = {};
geojson.features.forEach(feature => {
	// Some files have uppercase property names. This will not do.
	const lowercaseProperties = {};
	Object.keys(feature.properties).forEach(propName => {
		lowercaseProperties[propName.toLowerCase()] = feature.properties[propName];
	});
	feature.properties = lowercaseProperties;

	// Pick out the country name and put it in a file.
	const regionName = feature.properties.continent;
	regions[regionName] = regions[regionName] || {};

	const countryName = feature.properties.name;
	const filename = feature.properties.sov_a3+'.geojson';
	regions[regionName][countryName] = filename;
	fs.writeFileSync(path.join(process.cwd(), filename), JSON.stringify(feature));

});

fs.writeFileSync(path.join(process.cwd(), 'index.json'), JSON.stringify(regions));
