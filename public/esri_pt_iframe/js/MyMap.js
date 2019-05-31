define([
  "esri/map",
  "esri/layers/ArcGISDynamicMapServiceLayer",
  "esri/SpatialReference",
  "esri/geometry/Extent",
  "esri/dijit/Search",
  "esri/dijit/BasemapLayer",
  "esri/dijit/Basemap",
  "esri/dijit/BasemapGallery",
  "esri/dijit/HomeButton",
  "esri/geometry/Extent",
  "esri/tasks/ProjectParameters",
  "esri/tasks/GeometryService",
  "esript/DialogMessage",
  "esript/AppConfig",
  "dojo/dom",
  "dojo/on",
  "dojo/html",
  "dojo/query",
  "dojo"
], function (Map, ArcGISDynamicMapServiceLayer, SpatialReference, Extent, Search, BasemapLayer, Basemap, BasemapGallery, HomeButton, Extent, ProjectParameters, GeometryService, DialogMessage, AppConfig, dom, on, html, query, dojo) {

  let _enableContent = (ids) => {
    ids.forEach(id => {
      dojo.removeClass(id, "disabledContent")
    });
  }

  let _disableContent = (ids) => {
    ids.forEach(id => {
      dojo.addClass(id, "disabledContent")
    });
  }

  let _showLoading = () => {
    _disableContent(elements);
    esri.show(loading);
    map.disableMapNavigation();
    map.hideZoomSlider();
  }

  let _hideLoading = (error) => {
    _enableContent(elements);
    esri.hide(loading);
    map.enableMapNavigation();
    map.showZoomSlider();
  }

  let loading = dom.byId("loadingImg");
  let elements = ["templateDiv", "search", "basemapGallery", "homeButton"];

  let smaspcartoref = new ArcGISDynamicMapServiceLayer(AppConfig._mapConfig._basemap._url);
  smaspcartoref.on("error", function (msg) {
    console.log("dynamic map service layer:  ", msg);
    DialogMessage.infoMessage('Erro', msg.error.message);
    _hideLoading();
  });


  let cartoref = new BasemapLayer({ url: AppConfig._mapConfig._basemap._url });
  let enderecamento = new BasemapLayer({ url: AppConfig._mapConfig._serviceLayers[0]._url });
  let homeExtent = { xmax: 0, xmin: 0, ymax: 0, ymin: 0 };

  var basemap = new Basemap({
    layers:[cartoref, enderecamento],
    title: AppConfig._mapConfig._basemap._title,
    thumbnailUrl: AppConfig._mapConfig._basemap._thumbnail
  });

  let map = new Map("map", {
    //basemap: "satellite",
    center: AppConfig._mapConfig._center,
    zoom: AppConfig._zoom._initialLevel,
    lods: AppConfig._zoom._lods,
    sliderStyle: "small"
  });

  //resolve _getInfo() error
  map.spatialReference = new SpatialReference(AppConfig._mapConfig._spatialReference._wkid);
  map.extent = new Extent(AppConfig._mapConfig._fullExtent);

  let basemapGallery = new BasemapGallery({
    showArcGISBasemaps: true,
    map: map
  }, "basemapGallery");

  _disableContent(["selectBasemapGallery"]);
  basemapGallery.add(basemap);
  basemapGallery.select("basemap_0");
  basemapGallery.startup();

  basemapGallery.on("load", function (s) {
    basemapGallery.basemaps = basemapGallery.basemaps.filter(bm => bm.id === "basemap_0" || bm.id === "basemap_10")
    _enableContent(["selectBasemapGallery"]);
  });

  basemapGallery.on("error", function (msg) {
    console.log("basemap gallery error:  ", msg);
    DialogMessage.infoMessage('Erro', `não foi possível carregar a galeria de mapa base: ${msg.message}`)
    _hideLoading();
  });

  let search = new Search({
    map: map,
    enableInfoWindow: false,
    enableHighlight: false
  }, "search");
  search.startup();

  var home = new HomeButton({
    map: map,
    extent: smaspcartoref.fullExtent
  }, "homeButton");
  home.startup();

  home.on("load", function(){
    homeExtent = home.extent;
  });

  home.on("home", function(){
    search.clear();
  });

  return {
    map: map,
    fullExtent : () => smaspcartoref.fullExtent,
    homeExtent : () => homeExtent,
    showLoading: () => _showLoading(),
    hideLoading: () => _hideLoading(),
    setBaseMapCartografia: () => basemapGallery.select("basemap_0")
  }

});
