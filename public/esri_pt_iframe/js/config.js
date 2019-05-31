var sigConfig = {
  environment: {
      host: "https://arcgis.aguasdoporto.pt:6443",
      proxy: "https://developers.arcgis.com/proxy/",
      geometryService: "https://utility.arcgisonline.com/ArcGIS/rest/services/Geometry/GeometryServer"
  },
  zoom: {
    minLevel: 0,
    maxLevel: 21,
    initialScale: 591657527.591555,
    initialResolution: 156543.033928,
    initialLevel: 13
  },
  map: {
    basemap: {
      url: "/arcgis/rest/services/smaspcartoref102100/MapServer",
      title: "Cartografia"
    },
    featureLayers: [
      { url: "/arcgis/rest/services/LimitesPlantasLocalizacao/FeatureServer/1", index: 0 },
      { url: "/arcgis/rest/services/LimitesPlantasLocalizacao/FeatureServer/0", index: 1 },
    ],
    serviceLayers: [
      { url: "/arcgis/rest/services/smaspenderecamento102100/MapServer", index: 0 }
    ],
    spatialReference: {
      wkid : 102100
    }
  },
  print: {
    task: {
      url: "/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task"
    }
  }
}
