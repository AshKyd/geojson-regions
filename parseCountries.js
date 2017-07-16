const fs = require('fs');
const path = require('path');
const argv = process.argv;
const file = fs.readFileSync(argv[argv.length-1], 'utf8');
const geojson = JSON.parse(file);

const countriesA3 = {};
const regions = {
	all: {},
};

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

	let a3 = feature.properties.iso_a3;
	if(!a3 || Number(a3) === -99){
		if(['Country', 'Sovereign country'].includes(feature.properties.type)){
			a3 = feature.properties.gu_a3;
		} else {
			a3 = feature.properties.name.toLowerCase().replace(/\W/g, '');
		}
	}
	console.log('country', countryName, feature.properties.iso_a3, JSON.stringify(a3));

	if(countriesA3[a3]) {
		console.error(a3, countryName, 'already exists');
		console.log(JSON.stringify(feature.properties));
	}
	countriesA3[a3] = a3;

	const filename = a3+'.geojson';
	feature.properties.filename = filename;

	regions[regionName][countryName] = filename;
	regions.all[a3] = {filename, countryName};
	fs.writeFileSync(path.join(process.cwd(), filename), JSON.stringify(feature));

});

fs.writeFileSync(path.join(process.cwd(), 'index.json'), JSON.stringify(regions));
