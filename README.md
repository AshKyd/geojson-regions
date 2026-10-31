GeoJSON Regions
===============

A repo to create simplified GeoJSON regions so we can display map-based
visualisations without having to load tiles all over the place.

These are compiled from on [the Natural Earth data](http://www.naturalearthdata.com/)
which offers public domain shapefiles.

The data
--------

Data is organised by resolution (10m, 50m & 110m), and each country is stored
under a [ISO 3166-1 alpha-3](https://en.wikipedia.org/wiki/ISO_3166-1_alpha-3)
country code.

This stuff is fairly subjective. Natural earth states:

> Natural Earth Vector draws boundaries of sovereign states according to defacto
> status. We show who actually controls the situation on the ground. For
> instance, we show China and Taiwan as two separate states. But we show
> Palestine as part of Israel. Please feel free to mashup our countries and
> disputed areas themes to match your particular political outlook.

Point of view
-------------

Natural Earth also publishes de jure outlines for several dozen countries and
alliances, at 10m only. These are stored under `static/countries/pov/<code>/10m`
(for example `pov/ind/10m`). The list of codes and names is
`static/countries/povs.json`.

Fetching the latest data
------------------------

Requires Docker. From this directory:

```
npm run update-data
```

This runs the `countries-data` service in `docker-compose.yml`, which downloads
every outline from Natural Earth, writes one GeoJSON file per country, an
`index.json` and an `all.geojson` for each set, and writes a Brotli (quality 11)
`.br` copy beside each file. Output goes to `static/countries`.

Development
-----------

```
npm install
npm run dev
npm test
npm run build
```

`npm run build` also Brotli-compresses everything in `build`. The production
image uses Caddy, which serves the `.br` files as they are.

Contributing
------------

The only data changes I'll accept in this repo are those fetched from
naturalearthdata.com. Please don't make a pull request with modified data.

If you can improve the build tools, or have a new transformation you want to add
go for it!
