import { Component } from 'react';

/** Evita tela branca: qualquer erro de renderização vira uma mensagem com opção de recarregar. */
export default class ErrorBoundary extends Component {
  state = { comErro: false };

  static getDerivedStateFromError() {
    return { comErro: true };
  }

  componentDidCatch(erro, info) {
    console.error('Erro não tratado na interface:', erro, info);
  }

  render() {
    if (this.state.comErro) {
      return (
        <div className="auth-screen">
          <div className="auth-card">
            <p className="state-message">Ocorreu um erro inesperado. Recarregue a página para continuar.</p>
            <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>
              Recarregar
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
