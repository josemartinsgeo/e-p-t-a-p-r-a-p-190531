let propriedadeCollection;
let edificacaoCollection;
let myEditor;

require([
  "esri/map",
  "esri/tasks/GeometryService",
  "esri/toolbars/draw",

  "esri/layers/ArcGISTiledMapServiceLayer",
  "esri/layers/FeatureLayer",

  "esri/geometry/Point",
  "esri/geometry/Geometry",

  "esri/Color",
  "esri/symbols/SimpleMarkerSymbol",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",
  "esri/Color",
  "esri/renderers/SimpleRenderer",
  "esri/dijit/editing/Editor",
  "esri/dijit/editing/TemplatePicker",
  "esri/dijit/Search",
  "esri/dijit/BasemapGallery",
  "esri/dijit/PopupTemplate",
  "esri/tasks/query",

  "esri/config",
  "dojo/i18n!esri/nls/jsapi",

  "dojo/_base/array", "dojo/parser", "dojo/keys", "dojo/dom", "dojo/on", "dojo/_base/lang", "dojo/topic", "dojox/uuid/generateRandomUuid",

  "esript/DialogMessage",
  "esript/Localizacao",
  "esript/AppConfig",
  "esript/MyMap",
  "esript/EditFeature",
  "esript/Messaging",

  "dijit/layout/BorderContainer", "dijit/layout/ContentPane",
  "dojo/domReady!"
], function (
  Map, GeometryService, draw,
  ArcGISTiledMapServiceLayer, FeatureLayer,
  Point, Geometry,
  Color, SimpleMarkerSymbol, SimpleLineSymbol, SimpleFillSymbol, Color, SimpleRenderer,
  Editor, TemplatePicker, Search, BasemapGallery, PopupTemplate, Query,
  esriConfig, jsapiBundle,
  arrayUtils, parser, keys, dom, on, lang, topic, uuid,
  DialogMessage, Localizacao, AppConfig, MyMap, EditFeature
) {

  parser.parse();

  let polygonsDiv = dom.byId("polygons");
  let typeDiv = dom.byId("type");
  let messageDiv = dom.byId("message");

  console.log(JSON.stringify(AppConfig, true, 2));

  esriConfig.defaults.io.proxyUrl = AppConfig._proxy;
  esriConfig.defaults.io.alwaysUseProxy = false;

  esriConfig.defaults.geometryService = new GeometryService(AppConfig._geometryService);

  let maxExtent;
  let map = MyMap.map;

  map.on("load", () => {
    maxExtent = map.extent;
  });

  let currentLevel = AppConfig._zoom._initialLevel;
  map.on("extent-change", (extent) => {

    let beforeLevel = currentLevel > map.getMinZoom() && currentLevel <= map.getMaxZoom() && currentLevel;

    let levelChange = extent && extent.levelChange;
    let delta = extent && extent.delta;
    let level = extent && extent.lod && extent.lod.level;
    let changeFromMove = extent && delta && (extent.delta.x !== 0 || extent.delta.y !== 0);
    let changeFromZoom = !changeFromMove && levelChange && level !== beforeLevel;
    let changeFromZoomIn  = changeFromZoom && level > currentLevel;
    let changeFromZoomOut = changeFromZoom && level < currentLevel;
    let changeFromNewExtent = levelChange && !changeFromMove && (!changeFromZoomIn || !changeFromZoomOut);

    if (!maxExtent) {
      maxExtent = extent.extent;
    }

    //Se houve alteração no extent por Zoom atualiza o currentZoom
    if (changeFromZoom) currentLevel = level;

    /*
    let isCenter = extent && extent.extent &&
    (extent.extent.xmax === AppConfig._mapConfig._fullExtent.xmax || extent.extent.xmax === MyMap.homeExtent().xmax) &&
    (extent.extent.xmin === AppConfig._mapConfig._fullExtent.xmin || extent.extent.xmin === MyMap.homeExtent().xmin) &&
    (extent.extent.ymax === AppConfig._mapConfig._fullExtent.ymax || extent.extent.ymax === MyMap.homeExtent().ymax) &&
    (extent.extent.ymin === AppConfig._mapConfig._fullExtent.ymin || extent.extent.ymin === MyMap.homeExtent().ymin);
        
    if (isCenter) {
      maxExtent = extent.extent;
      return;
    }
    if (changeFromNewExtent && (currentLevel === beforeLevel || currentLevel === map.getMaxZoom() - 1)
    ) {
      maxExtent = extent.extent;
      return;
    }
    */

    let verifyExtent = changeFromMove || changeFromZoomOut;
    if ( verifyExtent && ((map.extent.xmin < maxExtent.xmin) ||
                          (map.extent.ymin < maxExtent.ymin) ||
                          (map.extent.xmax > maxExtent.xmax) ||
                          (map.extent.ymax > maxExtent.ymax))
                         ){

         map.setExtent(maxExtent);
         //DialogMessage.infoMessage('Aviso', "Zoom fora da área de extensão de intervenção do arruamento e número de polícia informado.");
         console.log("Zoom fora da área de extensão de intervenção do arruamento e número de polícia informado.");
     }
  });

  map.on("layers-add-result", initEditor);

  function _createCollectionTemplate () {
    let featureCollectionDefault = {
      "layerDefinition": null,
      "featureSet": { "features": [], "geometryType": "esriGeometryPolygon" },
      "layerDefinition": {
        "geometryType": "esriGeometryPolygon", "objectIdField": "OBJECTID", "drawingInfo": {},
        "fields": [{ "name": "OBJECTID", "alias": "OBJECTID", "type": "esriFieldTypeOID" }]
      }
    };
    return featureCollectionDefault;
  }

  function _createCollectionFromLayer (url, popupTemplate) {
    return new Promise((resolve, reject) => {
      try
      {
        let collection = new FeatureLayer(_createCollectionTemplate(), {
          id: ('layer_' + Math.random().toString(36).substr(2, 9)),
          infoTemplate: popupTemplate
        });
        let layer = new FeatureLayer(url, { mode: FeatureLayer.MODE_ONDEMAND, outFields: ['*'] });
        layer.on("load", function() {
          let renderer = new SimpleRenderer(layer.renderer.getSymbol());
          collection.setRenderer(renderer);
          collection.setEditable(true);
          collection.featureLayerService = layer;
          collection.name = layer.name;
          renderer.description = layer.name;
          renderer.label = layer.name;
          resolve(collection);
        });
      }
      catch (e) {
        console.log(e);
        reject(e);
      }
    });
  }

  //define a popup template
  let popupTemplate = new PopupTemplate({});
  Promise.all([
    _createCollectionFromLayer(AppConfig._mapConfig._featureLayers[0]._url, popupTemplate),
    _createCollectionFromLayer(AppConfig._mapConfig._featureLayers[1]._url, popupTemplate)
  ])
  .then(layers => {
    propriedadeCollection = layers[0];
    edificacaoCollection  = layers[1];
    return layers;
  })
  .then(layers => {
    map.addLayers(layers)
    MyMap.hideLoading();
  })
  .catch(err => {
    console.log(err);
    MyMap.hideLoading();
  });

  function initEditor(evt) {

    let templateLayers = evt.layers.map(result => result.layer);
    let templatePicker = new TemplatePicker({
      featureLayers: templateLayers,
      grouping: false,
      rows: 1,
      columns: 2
    }, "templateDiv");
    templatePicker.startup();

    let layers = evt.layers.map(result => ({
      "featureLayer": result.layer,
      "showAttachments": false
    }));

    let settings = {
      map: map,
      templatePicker: templatePicker,
      layerInfos: layers,
      toolbarVisible: true,
       createOptions: {
        polygonDrawTools: [ Editor.CREATE_TOOL_POLYGON ]
      },
      toolbarOptions: {
        reshapeVisible: false
      }
    };

    let params = { settings: settings };
    myEditor = new Editor(params, 'editorDiv');

    var sfs = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
              new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
              new Color([0, 0, 0]), 2),new Color([0, 0, 0, 0.25]));

    myEditor.startup();
    myEditor.drawingToolbar._settings.drawToolbar.setFillSymbol(sfs);

    function _addProcessing (processing, id) {
      if (!_containsProcessing(processing, id)) {
        processing.push(id);
      }
    }

    function _removeProcessing (processing, id) {
      if (_containsProcessing(processing, id)) {
        processing.splice(processing.indexOf(id), 1);
      }
    }

    function _containsProcessing (processing, id) {
      return processing && Array.isArray(processing) && processing.indexOf(id) > -1 ? true : false;
    }

    async function _handleAddPropriedade (target, layer)
    {
      if (!target)
      {
        console.log('propriedade inexistente ou inválida...');
        return;
      }
      if(Localizacao.alreadyPropriedade())
      {
        console.log(`propriedade objectId: ${Localizacao.getPropriedade().objectId} será removida. Somente é permitido a marcação de 1 propriedade por solicitação`);
        DialogMessage.infoMessage('Aviso', `Propriedade anterior será substituída e edificações removidas. É permitido somente a marcação de 1 propriedade por solicitação.`);
        await _handleRemovePropriedade(Localizacao.getPropriedade(), layer);
        console.log(`propriedade objectId: ${target.objectId} adicionada com sucesso.`);
        Localizacao.setPropriedade(target);
      }
      else
      {
        console.log(`propriedade objectId: ${target.objectId} adicionada com sucesso.`);
        Localizacao.setPropriedade(target);
      }
      myEditor.drawingToolbar.deactivate();
    }

    let propriedadeProcessingRemoval = [];
    async function _handleRemovePropriedade (target, layer)
    {
        if (!target) {
          console.log('propriedade inexistente ou inválida...');
          return;
        }
        if(_containsProcessing(propriedadeProcessingRemoval, target.objectId)) {
          console.log(`propriedade objectId: ${target.objectId} está sendo removida...`);
          return;
        }
        _addProcessing(propriedadeProcessingRemoval, target.objectId);
        let deletes = [{ attributes : { OBJECTID: target.objectId }}];
        let edificacoes = Localizacao.getEdificacoes().map(e => ({
           objectId: e.objectId
        }));

        console.log(`propriedade objectId: ${target.objectId} será removida.`);
        await layer.applyEdits(null, null, deletes)
        .then((adds, updates, deletes) => {
          //if (_containsProcessing(deletes, target.objectId)) {
          Localizacao.reset();
          console.log(`propriedade objectId: ${target.objectId} removida com sucesso.`);
          _removeProcessing(propriedadeProcessingRemoval, target.objectId);
          //}
        })
        .catch(err => {
            _removeProcessing(propriedadeProcessingRemoval, target.objectId);
            console.log(`erro ao remover propriedade objectId: ${target.objectId}.`);
            console.log(err);
        });

        if (edificacoes && edificacoes.length)
        {
          console.log(`${edificacoes.length} serão removidas...`);
          await edificacoes.forEach((e, index) => {
            _handleRemoveEdificacao(e, edificacaoCollection)
            console.log(`edificação ${index + 1} de ${edificacoes.length} removida com sucesso.`);
          });
        }
        console.log(`${edificacoes.length} de ${edificacoes.length} removidas`);
    }

    let edificacaoProcessingAdding = [];
    async function _handleAddEdificacao (target, layer)
    {
      if (!target)
      {
        console.log('edificação inexistente ou inválida...');
        return;
      }
      if(_containsProcessing(edificacaoProcessingAdding, target.objectId)) {
        console.log(`edificação objectId: ${target.objectId} está sendo adicionada...`);
        return;
      }
      _addProcessing(edificacaoProcessingAdding, target.objectId);
      if (Localizacao.alreadyPropriedade()) {
          Localizacao.addEdificacao(target);
	        console.log(`edificacao objectId: ${target.objectId} adicionada com sucesso.`);
          _removeProcessing(edificacaoProcessingAdding, target.objectId);
          myEditor.drawingToolbar.deactivate();
          return;
      }

      await _handleRemoveEdificacao(target, layer)
      .then((adds, updates, deletes) => {
          DialogMessage.infoMessage('Aviso', 'Não é possível marcar Edificação sem antes marcar Propriedade');
          console.log("Não é possível marcar Edificação sem antes marcar Propriedade.");
      });
    }

    let edificacaoProcessingRemoval = [];
    async function _handleRemoveEdificacao (target, layer)
    {
      if (!target)
      {
        console.log('edificação inexistente ou inválida...');
        return;
      }
      if(_containsProcessing(edificacaoProcessingRemoval, target.objectId)) {
        console.log(`edificação objectId: ${target.objectId} está sendo removida...`);
        return;
      }
      _addProcessing(edificacaoProcessingRemoval, target.objectId)
      let deletes = [{ attributes : { OBJECTID: target.objectId }}];
      console.log(`edificação objectId: ${target.objectId} será removida.`);
      await layer.applyEdits(null, null, deletes)
      .then((adds, updates, deletes) => {
          //if (_containsProcessing(deletes, target.objectId)) {
          console.log(`edificação objectId: ${target.objectId} removida com sucesso.`);
          Localizacao.removeEdificacao(target);
          Localizacao.setImagem("");
          _removeProcessing(edificacaoProcessingRemoval, target.objectId);
          //}
      })
      .catch(() => {
        _removeProcessing(edificacaoProcessingRemoval, target.objectId);
        console.log(`erro ao remover edificação objectId: ${target.objectId}.`);
        console.log(err);
      });

    }

    on(propriedadeCollection, 'edits-complete', lang.hitch(this, function (evt) {

      let operation = evt && evt.adds && evt.adds.length ? 'ADD' : evt && evt.deletes && evt.deletes.length ? 'DEL' : null;
      let target = operation === 'ADD' ? evt.adds[0] : evt.deletes[0];

      if (!target) {
        console.log('propriedade inexistente ou inválida...');
        return;
      }

      console.log(`handler: Propriedade operation: ${operation} target: ${ JSON.stringify(target) }`);
      switch (operation) {
        case 'ADD':
          _handleAddPropriedade(target, propriedadeCollection);
          break;
        case 'DEL':
          _handleRemovePropriedade(target, propriedadeCollection);
          break;
        default:
          console.log(`operation: ${operation} inexistente ou inválida`);
      }

    }));

    on(edificacaoCollection, 'edits-complete', lang.hitch(this, function (evt) {

      let operation = evt && evt.adds && evt.adds.length ? 'ADD' : evt && evt.deletes && evt.deletes.length ? 'DEL' : null;
      let target = operation === 'ADD' ? evt.adds[0] : evt.deletes[0];

      console.log(`handler: Edificação operation: ${operation} target: ${ JSON.stringify(target) }`);
      switch (operation) {
        case 'ADD':
          _handleAddEdificacao(target, edificacaoCollection);
          break;
        case 'DEL':
          _handleRemoveEdificacao(target, edificacaoCollection);
          break;
        default:
          console.log(`operation: ${operation} inexistente ou inválida`);
      }

    }));

    async function _getFeatures (featureLayerCollection)
    {
      return new Promise((resolve, reject) => {
        try {
          let query = new Query();
          query.geometry = map.extent;
          featureLayerCollection.selectFeatures(query, FeatureLayer.SELECTION_NEW, (results) => {
            let features = results.map(feature => {
              return feature;
            });
            resolve(features);
          });
        } catch (err) {
          reject(err);
        }
      });
    }

    function _createNumeroProcessoTemporario () {
      return uuid().toUpperCase();
    }

    topic.subscribe('onSubmit', lang.hitch(this, async function (url) {


      let featurePropriedade = await _getFeatures(propriedadeCollection);
      let featureEdificacoes = await _getFeatures(edificacaoCollection);

      let flp = propriedadeCollection.featureLayerService;
      let fle = edificacaoCollection.featureLayerService;

      let payload = {
        numeroProcessoTemporario : _createNumeroProcessoTemporario(),
        propriedade: {},
        edificacoes:[],
        imagem: { url: url }
      };

      Promise.resolve()
      .then(() => {
        featurePropriedade = featurePropriedade && featurePropriedade.map(f => {
          //f.attributes.IDEntidade   = _createIDEntidade("oLP", f.attributes.objectId);
          f.attributes.Processo_Num = payload.numeroProcessoTemporario;
          return f;
        });
        return flp.applyEdits(featurePropriedade, null, null);
      })
      //salvou propriedade
      .then((adds, updates, deletes) => {
        if (adds && adds.length && adds[0].objectId && adds[0].globalId) {
          return adds[0].objectId;
        }
        throw(`Não foi possível salvar propriedade. Propriedade inexistente ou inválida`);
      })
      .then(objectId => EditFeature.updateIDEntidadeByObjectId(objectId, "OLP", flp))
      //salvou edificação
      .then((updates) => {
        if (updates && updates.length && updates[0].OBJECTID && updates[0].GlobalID && updates[0].IDEntidade) {
          payload.propriedade = {
            ObjectId: updates[0].OBJECTID,
            GlobalId: updates[0].GlobalID,
            IdEntidade: updates[0].IDEntidade
          };
        }
        featureEdificacoes = featureEdificacoes && featureEdificacoes.map(f => {
          f.attributes.Processo_Num   = payload.numeroProcessoTemporario;
          f.attributes.ParentGlobalID = payload.propriedade.GlobalId;
          return f;
        });
        return fle.applyEdits(featureEdificacoes, null, null)
      })
      .then((adds, updates, deletes) => {
        if (adds && adds.length) {
           return adds.map(f => f.objectId);
        }
        if (!featureEdificacoes || !featureEdificacoes.length) {
          return;
        }
        throw(`Não foi possível salvar edificação. Edificação inexistente ou inválida`);
      })
      .then(objectId => {
        if (!featureEdificacoes || !featureEdificacoes.length) {
          return;
        }
        return EditFeature.updateIDEntidadeByObjectId(objectId, "OLE", fle);
      })
      .then((updates) => {
        if (updates && updates.length) {
          payload.edificacoes = updates.map(e => ({
            ObjectId: e.OBJECTID,
            GlobalId: e.GlobalID,
            IdEntidade: e.IDEntidade
          }));
        }
      })
      //notifica sucesso da submissão
      .then(() => {
        window.postMessage({
          target : "onSubmitComplete",
          data : payload
        }, "*")
      })
      .catch(err => {
        console.log(err);
        window.postMessage({
          target: "onSubmitError",
          data : `${err}`
        }, "*");
      });

    }));
  }
});
