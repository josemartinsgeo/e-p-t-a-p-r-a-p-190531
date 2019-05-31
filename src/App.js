import React, { Component } from 'react';
import Iframe from 'react-iframe';
import './App.css';
import 'bootstrap/dist/css/bootstrap.css';

class App extends Component {

  componentDidMount() {
    window.addEventListener('message', this.onMessage.bind(this));
  }

  onMessage (evt) {
    console.log(`-------react app message received-------`);
    console.log(`${JSON.stringify(evt.data, true, 2)}`);
    console.log(`----------------------------------------`);

    if (evt.data && (evt.data.target === 'onPrintSuccess' || evt.data.target === 'onPrintError')) {
      this.setState({imprimindo: 0})
    }
    if (evt.data && evt.data.target) {
      switch (evt.data.target.toLowerCase()) {
        case "onprintsuccess":
        this.setState({imprimindo: false, impressaoUrl: evt.data.url})
        break;
        case "onprinterror":
        this.setState({imprimindo: false, impressaoErro: evt.data.error})
        break;
        default:
        break;
      }
    }
  }

  constructor(props) {
    super(props);
    this.state = {
      arruamento : "",
      numeroPolicia : "",
      numeroProcessoTemporario : "",
      numeroProcessoNovo: "",
      imprimindo: false,
      impressaoErro: null,
      impressaoUrl: null
    };

    this.handleArruamento = this.handleArruamento.bind(this);
    this.handleNumeroPolicia = this.handleNumeroPolicia.bind(this);
    this.handleNumeroProcessoTemporario = this.handleNumeroProcessoTemporario.bind(this);
    this.handleNumeroProcessoNovo = this.handleNumeroProcessoNovo.bind(this);
    this.handleGeocode = this.handleGeocode.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.handlePrint = this.handlePrint.bind(this);
  }

  handleArruamento(event) {
    this.setState({
      arruamento: event.target.value
    });
  }

  handleNumeroPolicia(event) {
    this.setState({
      numeroPolicia: event.target.value
    });
  }

  handleNumeroProcessoTemporario(event) {
    this.setState({
      numeroProcessoTemporario: event.target.value
    });
  }

  handleNumeroProcessoNovo(event) {
    this.setState({
      numeroProcessoNovo: event.target.value
    });
  }

  handleGeocode (event) {
    let payload = {
      target : 'onGeocode',
      state : {
        arruamento: this.state.arruamento,
        numeroPolicia: this.state.numeroPolicia
      }
    }
    console.log(`----react app send message to iframe----`);
    console.log(JSON.stringify(payload, true, 2));
    console.log(`----------------------------------------`);
    document.getElementById("iframe").contentWindow.postMessage(payload, "*");
    event.preventDefault();
  }

  handleProcessId (event) {
    let payload = {
      target : 'onProcessId',
      state : {
        numeroProcessoTemporario : this.state.numeroProcessoTemporario,
        numeroProcessoNovo : this.state.numeroProcessoNovo,
      }
    }
    console.log(`----react app send message to iframe----`);
    console.log(JSON.stringify(payload, true, 2));
    console.log(`----------------------------------------`);
    document.getElementById("iframe").contentWindow.postMessage(payload, "*");
    event.preventDefault();
  }

  handleSubmit(event) {
    let payload = {
      target : 'onSubmit'
    }
    console.log(`----react app send message to iframe----`);
    console.log(JSON.stringify(payload, true, 2));
    console.log(`----------------------------------------`);
    document.getElementById("iframe").contentWindow.postMessage(payload, "*");
    event.preventDefault();
  }

  handlePrint(event) {
    let payload = {
      target: 'onPrint',
    }
    console.log(`----react app send message to iframe----`);
    console.log(JSON.stringify(payload, true, 2));
    console.log(`----------------------------------------`);
    document.getElementById("iframe").contentWindow.postMessage(payload, "*");
    this.setState({imprimindo: true})
    event.preventDefault();
  }

  render() {
    return (
      <div className="App">

        <div className="container">

          <h1 className="display-7">ÁGUAS DO PORTO</h1>
          <hr/>
          {/*}<p className="lead">POC (Proof of concept) desenvolvida com o objetivo de validar o funcionamento de um <strong>Esri Map</strong> em uma aplicação desenvolvida em <strong>ReactJS.</strong> Os dados utilizados nessa POC são provenientes de Layers de teste (exemplos para desenvolvimento), porém cumprem o objetivo que é validar o fluxo dos dados entre o <strong>IFrame</strong> contendo o <strong>Esri Map</strong> e o app <strong>ReactJS.</strong></p>
          <hr className="my-4"/>*/}

          <div className="row justify-content-md-center">
            <div className="col col-lg-8">
              <form onSubmit={this.handleGeocode}>
                <div className="form-group row">
                  <div className="col-sm-6">
                    <input type="text" className="form-control" placeholder="Digite o arruamento para posicionar o mapa..." value={this.state.arruamento} onChange={this.handleArruamento}/>
                  </div>
                  <div className="col-sm-3">
                    <input type="text" className="form-control" placeholder="Nº Policia" value={this.state.numeroPolicia} onChange={this.handleNumeroPolicia}/>
                  </div>
                  <div className="col-sm-3">
                    <button type="submit" className="btn btn-secondary btn-block">Pesquisar</button>
                  </div>
                </div>
              </form>
            </div>
          </div>

        <Iframe
          url="/esri_pt_iframe/index.html"
          width="800"
          height="520px"
          id="iframe"
          display="initial"
          position="relative"
          scrolling="no"
          />

          <div className="row justify-content-md-center">

            <div className="col col-lg-8">
              <div className="form-group row">
                <div className="col-sm-6">
                  <form onSubmit={this.handleSubmit}>
                    <button type="submit" className="btn btn-secondary btn-block">Submeter</button>
                  </form>
                </div>
                <div className="col-sm-6">
                  {/** Botão de impressão - desabilitado enquanto a página imprime */}
                  <form onSubmit={this.handlePrint}>
                      <button disabled={this.state.imprimindo} type="submit" className="btn btn-secondary btn-block">
                        {this.state.imprimindo ? 'Imprimindo...' : "Imprimir"}
                      </button>
                  </form>
                </div>
              </div>
            </div>

            <div className="col col-lg-8">
              <div className="form-group row">
                <div className="col-sm-3">
                  <input type="text" className="form-control" placeholder="ID Temporário" value={this.state.numeroProcessoTemporario} onChange={this.handleNumeroProcessoTemporario}/>
                </div>
                <div className="col-sm-3">
                  <input type="text" className="form-control" placeholder="ID Novo" value={this.state.numeroProcessoNovo} onChange={this.handleNumeroProcessoNovo}/>
                </div>
                <div className="col-sm-6">
                  <button onClick={(evt) => this.handleProcessId(evt)} className="btn btn-secondary btn-block">Enviar ID do Processo</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
}
export default App;
