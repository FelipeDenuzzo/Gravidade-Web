// =============================================================
// HUD.js
// Equivalente a: HUDManager.swift + HUDComponents.swift
//
// Atualiza labels de tempo e fase no DOM.
// Exibe o contador central grande de tempo (urgente/normal).
// Controla visibilidade e estado do botão Sair.
// =============================================================

'use strict';

// Referências aos elementos DOM criados no index.html
const hudEl = {
  tempo:     document.getElementById('labelTempo'),
  fase:      document.getElementById('labelFase'),
  btnSair:   document.getElementById('btnSair'),
  contador:  null,   // criado por hudInit()
};

// -------------------------------------------------------------
// Inicialização — cria o contador central grande
// Equivale a HUDManager.makeContadorTempoLabel()
// -------------------------------------------------------------
function hudInit() {
  const el = document.createElement('div');
  el.id = 'contadorTempo';
  el.style.display = 'none';
  document.body.appendChild(el);
  hudEl.contador = el;

  hudEl.btnSair.addEventListener('click', _onSairClick);
}

function _onSairClick() {
  if (gameState.botaoSairBloqueado || !gameState.jogoAtivo) return;
  overlayMostrarSaida();
}

// -------------------------------------------------------------
// Atualização por frame (chamado pelo main.js)
// Equivale às atualizações de labels no GameViewController
// -------------------------------------------------------------
function hudAtualizar() {
  const usaTempo = modoUsaTempo(gameState.modo);

  // Label de fase (sempre visível durante jogo)
  hudEl.fase.textContent = `Fase: ${gameState.faseAtual}`;

  if (usaTempo) {
    // Modo com tempo: mostra tempo restante
    hudEl.tempo.style.display = '';
    const t = Math.max(0, Math.ceil(gameState.tempoRestante));
    hudEl.tempo.textContent  = `Tempo: ${t}s`;

    // Contador central grande
    if (hudEl.contador) {
      hudEl.contador.style.display = '';
      hudEl.contador.textContent   = `${t}`;
      // Modo urgente: vermelho piscante abaixo de 10s (igual ao Swift)
      if (t <= 10) {
        hudEl.contador.classList.add('urgente');
      } else {
        hudEl.contador.classList.remove('urgente');
      }
    }
  } else {
    // Modo livre sem tempo: mostra tempo decorrido
    hudEl.tempo.style.display = '';
    const t = Math.floor(gameState.tempoDecorrido);
    hudEl.tempo.textContent  = `Tempo: ${t}s`;

    if (hudEl.contador) hudEl.contador.style.display = 'none';
  }
}

// -------------------------------------------------------------
// Visibilidade do HUD
// -------------------------------------------------------------
function hudMostrar() {
  document.getElementById('hud').style.display = '';
}

function hudOcultar() {
  document.getElementById('hud').style.display = 'none';
  if (hudEl.contador) hudEl.contador.style.display = 'none';
}

// -------------------------------------------------------------
// Botão Sair
// Equivale a HUDManager.atualizarEstadoBotaoSair()
// -------------------------------------------------------------
function hudBotaoSairAtivo(ativo) {
  gameState.botaoSairBloqueado = !ativo;
  hudEl.btnSair.disabled = !ativo;
  hudEl.btnSair.style.opacity = ativo ? '0.7' : '0.0';
}
