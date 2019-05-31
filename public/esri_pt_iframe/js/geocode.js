define([
  "esript/AppConfig"
], function (AppConfig) {
  return {

      enderecamento: async function (addr)
      {
        let arruamento = addr && addr.arruamento ? `ARRUAMENTO+LIKE+'%${addr.arruamento}%'`.toUpperCase().replace(' ', '+') : "";
        let numeroPolicia = arruamento && addr && addr.numeroPolicia ? `+AND+NumeroPolicia='${addr.numeroPolicia}'` : "";
        let where = `${arruamento}${numeroPolicia}`;
        let service = `${AppConfig._mapConfig._serviceLayers[0]._url}/0`;
        let wkid = AppConfig._mapConfig._spatialReference._wkid;

        let enderecamento =  `${service}/query?where=${where}&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&outFields=['features']&returnGeometry=true&returnTrueCurves=false&outSR={+wkid:+'${wkid}'+}+&returnIdsOnly=false&returnCountOnly=false&returnZ=false&returnM=false&returnDistinctValues=false&returnExtentsOnly=false&f=pjson`;

        let response = await fetch(encodeURI(enderecamento));
        let data = await response.json();

        let hasResponse = data;
        let hasFeatures = hasResponse && hasResponse.features && hasResponse.features.length;
        let hasGeometry = hasFeatures && hasResponse.features[0].geometry && hasResponse.features[0].geometry.x && hasResponse.features[0].geometry.y;
        let hasSpatialReference = hasResponse && hasResponse.spatialReference;

        let result = {
          error : false,
          message : ""
        };

        if ( !hasGeometry ) {
            result.error = true;            
            result.message = `Não conseguimos encontrar a rua: ${addr.arruamento} por favor use a pesquisa do canto superior esquerdo.`;
            return result;
        }
        result.geometry = hasResponse.features[0].geometry;
        result.spatialReference = hasSpatialReference ? hasResponse.spatialReference : {};

        return result;
      }
  };
});
