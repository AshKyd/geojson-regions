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

Fetching the latest data
------------------------

I'm aiming to keep this one up to date, but if you need to fetch the latest data
you can do so by running `go.sh` in the repo root.

If you notice the repo is out of date, please feel free to make a pull request.

Note: you require gdal installed on your system (ogr2ogr command converts
shapediles to geojson).

Contributing
------------

The only data changes I'll accept in this repo are those fetched from
naturalearthdata.com. Please don't make a pull request with nodified data.

If you can improve the build tools, or have a new transformation you want to add
go for it!
