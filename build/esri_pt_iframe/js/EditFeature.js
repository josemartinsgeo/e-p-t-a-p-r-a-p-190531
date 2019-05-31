define([
  "esri/layers/FeatureLayer",
  "esri/tasks/query"
], function (FeatureLayer, Query) {

  let _findFeaturesByWhere = (layer, where) =>
  {
    return new Promise((resolve, reject) => {
      try {

        if (!layer) {
          throw (`Não foi possível realizar consulta. FeatureLayer inexistente ou inválida`);
        }
        if (!where) {
          throw (`Não foi possível realizar consulta. Clausula where inexistente ou inválida`);
        }
        let query = new Query();
        query.where = where;
        layer.selectFeatures(query, FeatureLayer.SELECTION_NEW, (results) => {
          let features = [];
          if (results && results.length) {
            features = results.map(feature => {
              return feature;
            });
          }
          resolve(features);
        });

      } catch (err) {
        console.log(err);
        reject(err);
      }
    });
  }

  let _updateByProcessId = (temporario, novo, layer) =>
  {
      return new Promise((resolve, reject) => {

        if(!temporario || !novo){
          reject(`Numero de processo temporário/novo inexistente(s) ou inválido(s)`)
        }

        _findFeaturesByWhere(layer, `Processo_Num = '${temporario}'`)
        .then(features => {

          let hasFeatures = features && Array.isArray(features) && features.length;
          if (!hasFeatures) {
            reject(`Não foram encontrados registros com Número de Processo: ${temporario}`);
            return;
          }

          features = features.map(f => {
            f.attributes.Processo_Num = novo;
            return f;
          })

          layer.applyEdits(null, features, null)
          .then((adds, updates, deletes) => {
            if (updates && updates.length) {
               resolve(`Atualização do Numero de processo de: ${temporario} para: ${novo} realizada com sucesso.`)
            }
            reject(`Não foi possível realizar atualização do Numero de processo de: ${temporario} para: ${novo}`);
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
      });
    });
  }

  let _createIDEntidade = (key, objectId) => {
    let now = Date.now().toString();
    let a = now.slice(9, 9 + 2);
    let b = now.slice(4, 4 + 2);
    let c = now.slice(0, 2);
    if(key && objectId){
      let IdEntidade = `${key}${objectId}${a}${b}${c}`;
      return IdEntidade && IdEntidade.length > 20 ? IdEntidade.substring(0, 20) : IdEntidade;
    }
    throw(`Não foi possível criar ID Entidade: Key ou ObjectID inexistente ou inválido`);
  }

  let _updateIDEntidadeByObjectId = (objectId, key, layer) =>
  {
      return new Promise((resolve, reject) => {

        if(!objectId){
          reject(`ObjectId inexistente ou inválido`);
        }

        let where = objectId;
        if(Array.isArray(objectId)) {
          where = objectId.join(', ');
        }

        _findFeaturesByWhere(layer, `OBJECTID IN (${where})`)
        .then(features => {

          let hasFeatures = features && Array.isArray(features) && features.length;
          if (!hasFeatures) {
            reject(`Não foram encontrados registros com ObjectId: ${ObjectId}`);
            return;
          }

          features = features.map((f, index) => {
            f.attributes.IDEntidade = Array.isArray(objectId) ? _createIDEntidade(key, objectId[index]) : _createIDEntidade(key, objectId);
            return f;
          })

          layer.applyEdits(null, features, null)
          .then((adds, updates, deletes) => {
            if (updates && updates.length) {
              resolve(features.map(f => f.attributes));
            }
            reject(`Não foi possível atualizar ID Entidade`);
        })
        .catch(err => {
          console.log(err);
          reject(err);
        });
      });
    });
  }

  return {
    updateByProcessId: (temporario, novo, layer) => _updateByProcessId(temporario, novo, layer),
    updateIDEntidadeByObjectId: (objectId, key, layer) => _updateIDEntidadeByObjectId(objectId, key, layer)
  }

});
