define([
  "esri/tasks/query",
  "esri/graphic",
  "esri/graphicsUtils",
  "esri/tasks/PrintTask",
  "esri/tasks/PrintParameters",
  "esri/tasks/PrintTemplate",
  "esri/geometry/scaleUtils",
  "esript/DialogMessage",
  "esript/MyMap",
  "esript/AppConfig"
], function (Query, Graphic, graphicsUtils, PrintTask, PrintParameters, PrintTemplate, scaleUtils, DialogMessage, MyMap, AppConfig ) {

  let _printForReal = (map) => {

    return new Promise((resolve, reject) => {

      let scale = scaleUtils.getScale(map);

      // Does not work with layers (it does now, I think)
      var printTask = new PrintTask(AppConfig._print._task._url);

      // Add 20% to the scale, then round to the nearest 250
      let newScale = Math.ceil((scale * 1.2) / 250) * 250;

      var params = new PrintParameters();
      params.map = map;

      var template = new PrintTemplate();
      template.exportOptions = {
        width: 750,
        height: 400,
        dpi: 96
      };

      template.format = "png32";
      template.layout = "MAP_ONLY";
      template.preserveScale = true; // false preserves extent instead of scale
      template.outScale = newScale;
      template.showAttribution = false;
      template.showLabels = true;
      template.spatialReference = { wkid: AppConfig._mapConfig._spatialReference._wkid };

      params.template = template;
      printTask.execute(params, (result) => resolve(result.url), (err) => reject(err));

    });
  };

  /**
   * Center and zoom the map to cover the entire property, then print. If there's
   * no property, print it without changing the map. The result will be returned
   * in generated messages.
   * Print the map. The result will be returned in other messages.
   * @param {*} map - The map to print. Position and scale will be maintained
   * only if there's no geometry to print.
   * @param {*} layer - Layer where the feature will be searched.
   * @param {*} propriedadeId - The generated image will be centered on this graphic.
   * If omitted, the map will be centered on any feature, or not centered at all if
   * there's no feature in the layer.
   */
  let _printMap = (map, layer, propriedadeId) => {

    return new Promise((resolve, reject) => {
      try {

        var query = new Query();
        if (typeof propriedadeId !== "undefined") {
          query.objectIds = [propriedadeId];
        } else {
          query.where = "1 = 1";
        }

        layer.selectFeatures(query, layer.SELECTION_NEW, result => {
            // got a result
            if (result && result.length && result[0] && result[0].geometry) {
              let graphic = new Graphic(result[0].geometry, null, null, null);
              let propriedadeExtent = graphicsUtils.graphicsExtent([graphic]);
              propriedadeCollection.clearSelection();
              edificacaoCollection.clearSelection();
              myEditor.drawingToolbar.deactivate();
              MyMap.setBaseMapCartografia();
              MyMap
                .map.setExtent(propriedadeExtent, true)
                .then(() => {
                  _printForReal(MyMap.map)
                  .then(result => resolve(result))
                  .catch(err => reject(err));
                })
                .catch(err => {
                  console.log("Could not move to property. Will print without moving.");
                  console.log(err);
                  // but print anyway
                  _printForReal(map)
                  .then(result =>  resolve(result))
                  .catch(err => reject(err));
                });
            } else {
              console.log('Nenhuma propriedade encontrada.')
              reject("Nenhuma propriedade encontrada.");
            }
          },
          err => {
            console.log("Não foi possível realizar consulta de propriedades. Propriedade inexistente ou inválida.");
            reject("Não foi possível realizar consulta de propriedades. Propriedade inexistente ou inválida.");
          }
        );
      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  };

  return {
    printMap: (map, layer, propriedadeId) => _printMap(map, layer, propriedadeId)
  }
});
