// =============================================================
// IntroSystem.js
// Equivalente a: IntroAndOverlaySystem.swift
//
// Reproduz vídeos de transição no <video id="videoOverlay">.
// Expoãe: introPlayVideo(src, onEnd) e introStop().
// =============================================================

'use strict';

const _videoEl = document.getElementById('videoOverlay');

// Token incremental: cada chamada a introPlayVideo gera um novo.
// Listeners de eventos antigos ignoram tokens desatualizados.
let _introToken = 0;

// -------------------------------------------------------------
// introPlayVideo(src, onEnd)
// -------------------------------------------------------------
function introPlayVideo(src, onEnd) {
  // Para qualquer reprodução anterior sem disparar callbacks
  introStop();

  // Token desta chamada — callbacks de chamadas anteriores serão ignorados
  const myToken = ++_introToken;

  function _concluir() {
    if (_introToken !== myToken) return; // chamada obsoleta, ignora
    _videoEl.style.display = 'none';
    _videoEl.removeAttribute('src');
    _videoEl.load(); // reseta estado interno do elemento
    if (onEnd) onEnd();
  }

  _videoEl.style.display  = 'block';
  _videoEl.style.opacity  = '0';
  _videoEl.style.transition = '';
  _videoEl.src = src;

  // Usa onended/onerror diretamente (sobrescreve, evita acumulo de listeners)
  _videoEl.onended = _concluir;
  _videoEl.onerror = _concluir; // arquivo não encontrado → passa direto

  const playPromise = _videoEl.play();
  if (playPromise) {
    playPromise
      .then(() => {
        if (_introToken !== myToken) return;
        _videoEl.style.transition = 'opacity 0.25s';
        _videoEl.style.opacity    = '1';
      })
      .catch(() => {
        // Autoplay bloqueado pelo browser → pula o vídeo
        _concluir();
      });
  }
}

// -------------------------------------------------------------
// introStop()
// Para imediatamente SEM disparar callback de onEnd.
// -------------------------------------------------------------
function introStop() {
  _introToken++; // invalida qualquer callback pendente

  _videoEl.onended = null;
  _videoEl.onerror = null;

  if (!_videoEl.paused) {
    // pause() só pode ser chamado após play() resolver
    const p = _videoEl.play().catch(() => {});
    Promise.resolve(p).then(() => _videoEl.pause()).catch(() => {});
  }

  _videoEl.style.display = 'none';
  _videoEl.style.opacity = '0';
  _videoEl.removeAttribute('src');
  _videoEl.load();
}
