define([
  "esri/geometry/Extent",
  "esri/geometry/Point",
  "esript/Geocode",
  "esript/DialogMessage",
  "esript/Localizacao",
  "esript/Print",
  "esript/EditFeature",
  "esript/MyMap",
  "esript/AppConfig",
  "dojo/topic"
], function (Extent, Point, Geocode, DialogMessage, Localizacao, Print, EditFeature, MyMap, AppConfig, topic) {

  _onMessage = function (evt) {

    try {

      let data   = evt && evt.data;
      let target = data && evt.data.target;
      let state  = data && evt.data.state;

      console.log(`--------iframe message received---------`);
      console.log(`origin: ${evt.origin}`);
      console.log(`data  :`);
      console.log(JSON.stringify(evt.data, true, 2));

      switch (target.toLowerCase()) {
        case 'ongeocode':

          console.log(`-----------onGeocode started------------`);
          MyMap.showLoading();
          if(!state || !state.arruamento){
            DialogMessage.infoMessage('Erro', "Não conseguimos encontrar a rua, por favor use a pesquisa do canto superior esquerdo.");
            console.log(`state.arruamento not found on data`);
            console.log(`-----------onGeocode finished-----------`);
            MyMap.hideLoading();
            break;
          }
          Geocode.enderecamento(state)
          .then(coords => {
            console.log(`query: ${state.arruamento} ${state.numeroPolicia}`);
            console.log(`${JSON.stringify(coords, true, 2)}`);
            if(coords.error){
              DialogMessage.infoMessage('Erro', `${coords.message}`);
              let center = new Point({
                "x": -959492.6682373729,
                "y": 5036285.767262436,
                "spatialReference": {
                  "wkid": 102100
                }
              });
              MyMap.map.centerAndZoom(center, AppConfig._zoom._initialLevel);
              MyMap.hideLoading();
              return Promise.resolve();
            }
            let xmin = coords.geometry.x;
            let xmax = coords.geometry.x;
            let ymax = coords.geometry.y;
            let ymin = coords.geometry.y;
            var newExtent = new Extent({
              "xmin": xmin,
              "ymin": ymin,
              "xmax": xmax,
              "ymax": ymax,
              "spatialReference": coords.spatialReference
            });
            MyMap.map.setZoom (MyMap.map.getMaxZoom() - 1);
            MyMap.map.setExtent(newExtent);
            MyMap.hideLoading();
            console.log(`-----------onGeocode finished-----------`);
          })
          .catch(err => {
              let arruamento = state.arruamento || "";
              let numeroPolicia = state.numeroPolicia || "";
              let enderecamento = `${arruamento} ${numeroPolicia}`;
              console.log(err);
              DialogMessage.infoMessage(`Erro: `, `Não conseguimos encontrar a rua: ${addr.arruamento} por favor use a pesquisa do canto superior esquerdo.`);
              MyMap.map.setZoom(AppConfig._zoom._initialLevel);
              MyMap.map.setExtent(MyMap.fullExtent());
              MyMap.hideLoading();
              console.log(`-----------onGeocode finished-----------`);
          });
          break;

        case 'onsubmit':
          console.log(`------------onSubmit started------------`);
          MyMap.showLoading();
          if (!Localizacao.alreadyPropriedade() && !Localizacao.hasEdificacoes()) {
            window.parent.postMessage({
              target: "onSubmitError",
              data : "Não foi possível submeter localização. Propriedade ou Edificação(ões) inexistente(s) ou inválida(s)."
            }, "*");
            DialogMessage.infoMessage('Solicitação', 'Não foi possível submeter localização. Propriedade ou Edificação(ões) inexistente ou inválida.');
            MyMap.hideLoading();
            break;
          }
          Print.printMap(map, propriedadeCollection, Localizacao.getPropriedade().objectId)
          .then(url => {
            Localizacao.setImagem(url);
            return url;
          })
          .then(url  => {
            topic.publish("onSubmit", url);
          })
          .catch(err => {
            window.parent.postMessage({
              target: "onSubmitError",
              data : err
            }, "*");
            console.log(err);
            DialogMessage.infoMessage('Erro', err);
            MyMap.hideLoading();
          });
          console.log(`------------onSubmit finished-----------`);
          break;

        case 'onsubmitcomplete':

          console.log(`------------onSubmitComplete started------------`);
          MyMap.hideLoading();
          window.parent.postMessage({
            target: "onSubmitComplete",
            data : data.data
          }, "*");
          let totalEdificacoes = data.data && data.data.edificacoes.length ? data.data.edificacoes.length : 0;
          DialogMessage.infoMessage('Solicitação', `Submissão da localização de <b>${1} Propriedade</b> com <b>${totalEdificacoes } Edicação(ões)</b>, realizada com sucesso. ID Processo: ${data.data.numeroProcessoTemporario} (temporário).
          <br/><br/>
          <div style="text-align-last: center;">
            <img src="${data.data.imagem.url}" height="265" width="500">
          </div>
          <!--
          <div style="text-align: left;">
            <pre style="background-color: aliceblue;">${JSON.stringify(data.data, true, 2)}</pre>
          </div>
          -->`);
          Localizacao.reset();
          console.log(`------------onSubmit finished-----------`);
          break;


        case 'onsubmiterror':

          console.log(`------------onSubmitError started------------`);
          MyMap.hideLoading();
          window.parent.postMessage({
            target: "onSubmitError",
            data : data.data
          }, "*");
          console.log(data.data);
          DialogMessage.infoMessage('Erro', data.data);
          console.log(`------------onSubmit finished-----------`);
          break;

        case 'onprocessid':
          console.log(`----------onProcessId started------------`);
          MyMap.showLoading();
          if(!state || !state.numeroProcessoTemporario || !state.numeroProcessoNovo){
            window.parent.postMessage({
              target: "onProcessIdError",
              data : "ID de Processo, anterior/novo inexistente ou inválido."
            }, "*");
            console.log(`state not found on data`);
            DialogMessage.infoMessage('Erro', "ID de Processo, anterior/novo inexistente(s) ou inválido(s).");
            MyMap.hideLoading();
            console.log(`----------onProcessId finished-----------`);
            break;
          }

          let temporario = state.numeroProcessoTemporario;
          let novo = state.numeroProcessoNovo;

          let toUpdate = [
            EditFeature.updateByProcessId(temporario, novo, propriedadeCollection.featureLayerService),
            EditFeature.updateByProcessId(temporario, novo, edificacaoCollection.featureLayerService)
          ];

          Promise.all(toUpdate)
          .then(result => {
            window.parent.postMessage({
              target: "onProcessIdComplete",
              data : result[0]
            }, "*");
            DialogMessage.infoMessage('Aviso', result[0])
            MyMap.hideLoading();
            console.log(`----------onProcessId finished-----------`);
          })
          .catch(err => {
            window.parent.postMessage({
              target: "onProcessIdError",
              data : err
            }, "*");
            DialogMessage.infoMessage('Erro', err);
            MyMap.hideLoading();
            console.log(`----------onProcessId finished-----------`);
          });
          break;

        case 'onprint':

          console.log(`----------onPrint started------------`);
          MyMap.showLoading();
          Print.printMap(map, propriedadeCollection, Localizacao.getPropriedade().objectId)
          .then(url => {
            //send event to my parent
            Localizacao.setImagem(url);
            console.log("iframe sending onPrintError to listeners");
            window.parent.postMessage({
              target: "onPrintSuccess",
              url
            }, "*");
            //info message
            DialogMessage.infoMessage('Impressão', `<div style="text-align-last: center;">
              A imagem foi gerada com sucesso. <a target="_blank" href="${url}">Download</a>
              <br/><br/>
              <img src="${url}" height="265" width="500">
            </div>`);
            MyMap.hideLoading();
          })
          .catch(err => {
            //error message
            console.log("iframe sending onPrintError to listeners");
            window.parent.postMessage({
              target: "onPrintError",
              data: err
            }, "*");
            DialogMessage.infoMessage('Erro', err);
            MyMap.hideLoading();
            console.log(`----------onPrint finished------------`);
          });
          break;
        default:
          console.log(`target: ${target} not suported yet`);
      }
    }
    catch (e) {
        console.log(`Não foi possível processar mensagem`);
        console.log(e);
    }
  }

  window.addEventListener
  ? window.addEventListener("message", _onMessage, false)
  : window.attachEvent("onmessage", _onMessage);

});
