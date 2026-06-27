// =============================================================
// IntroSystem.js
// Equivalente a: IntroAndOverlaySystem.swift
//
// Reproduz vídeos de transição no <video id="videoOverlay">.
// Expoãe: introPlayVideo(src, onEnd) e introStop().
// =============================================================

'use strict';

const _videoEl = document.getElementById('videoOverlay');
let   _introOnEnd = null;

// Ouve o fim do vídeo
_videoEl.addEventListener('ended', () => {
  _videoEl.style.display = 'none';
  _videoEl.src = '';
  if (_introOnEnd) { const cb = _introOnEnd; _introOnEnd = null; cb(); }
});

// Caso o vídeo falhe (arquivo não encontrado), passa direto
_videoEl.addEventListener('error', () => {
  _videoEl.style.display = 'none';
  _videoEl.src = '';
  if (_introOnEnd) { const cb = _introOnEnd; _introOnEnd = null; cb(); }
});

// -------------------------------------------------------------
// introPlayVideo(src, onEnd)
// Equivale a mostrarTransicaoVideo() do Swift
// -------------------------------------------------------------
function introPlayVideo(src, onEnd) {
  introStop();
  _introOnEnd = onEnd;

  _videoEl.src = src;
  _videoEl.style.display = 'block';
  _videoEl.style.opacity = '0';

  const playPromise = _videoEl.play();
  if (playPromise) {
    playPromise
      .then(() => {
        // Fade-in (equivale ao UIView.animate alpha:1 do Swift)
        _videoEl.style.transition = 'opacity 0.25s';
        _videoEl.style.opacity    = '1';
      })
      .catch(() => {
        // Autoplay bloqueado: pula o vídeo
        _videoEl.style.display = 'none';
        if (_introOnEnd) { const cb = _introOnEnd; _introOnEnd = null; cb(); }
      });
  }
}

// -------------------------------------------------------------
// introStop()
// Equivale a pararVideoOverlay() do Swift
// -------------------------------------------------------------
function introStop() {
  _videoEl.pause();
  _videoEl.style.display = 'none';
  _videoEl.src  = '';
  _introOnEnd   = null;
}
