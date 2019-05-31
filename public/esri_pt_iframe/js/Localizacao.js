define([], function () {

  let _propiedade  = {};
  let _edificacoes = [];
  let _imagem = { url : "" };

  function _reset () {
    _propiedade  = {};
    _edificacoes = [];
    _imagem = { url : "" };
  }

  function _getPropriedade() {
    return _propiedade;
  }

  function _setPropriedade(propriedade) {
    _propiedade = propriedade;
  }

  function _getEdificacoes() {
    return _edificacoes;
  }

  function _addEdificacao(edificacao) {
    _edificacoes.push(edificacao);
  }

  function _removeEdificacao(edificacao) {
    _edificacoes = _edificacoes.filter(e => e.objectId !== edificacao.objectId);
  }

  function _getImagem () {
    return _imagem;
  }

  function _setImagem (url) {
    _imagem.url = url;
  }

  function _alredyPropriedade () {
    return _propiedade && _propiedade.objectId !== undefined ? true : false;
  }

  function _hasEdificacoes () {
    return _edificacoes && _edificacoes.length;
  }

  return {
    getPropriedade: () => _getPropriedade(),
    getEdificacoes: () => _getEdificacoes(),
    getImagem: () => _getImagem(),
    setPropriedade: (propriedade) => _setPropriedade(propriedade),
    addEdificacao: (edificacao) => _addEdificacao(edificacao),
    removeEdificacao: (edificacao) => _removeEdificacao (edificacao),
    setImagem: (url) => _setImagem(url),
    reset: () => _reset(),
    alreadyPropriedade: () => _alredyPropriedade(),
    hasEdificacoes: () => _hasEdificacoes()
  }

});
