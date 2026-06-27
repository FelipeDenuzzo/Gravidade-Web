// =============================================================
// Physics.js
// Equivalente a: UIDynamicAnimator + UIGravityBehavior +
//   UICollisionBehavior + RollingProperties + CMMotionManager
//   (GameViewController.swift + PhysicsSystem.swift)
//
// Loop manual via requestAnimationFrame.
// Acelerômetro via DeviceOrientationEvent.
// Teclado (W/A/S/D ou setas) para testes em desktop.
// =============================================================

'use strict';

// -------------------------------------------------------------
// Constantes (equivale a RollingProperties + constantes do GVC)
// -------------------------------------------------------------
const PHYSICS = {
  GRAVIDADE_ESCALA:      1800,   // px/s² — "peso" da gravidade do acelerômetro
  ATRITO:                0.985,  // por frame (equivale a rollingFriction: 0.98)
  MAX_ANGULAR_VELOCITY:  3.0,    // rad/s (RollingProperties.maxAngularVelocity)
  ANGULAR_FRICTION:      0.98,   // amortecimento de rotação
  MIN_VEL_THRESHOLD:     0.5,    // px/s mínimo para mover (evita tremulão)
  REBOTE:                0.35,   // coeficiente de rebote nas paredes
};

// -------------------------------------------------------------
// Estado do jogador
// -------------------------------------------------------------
const player = {
  x: 0, y: 0,       // posição centro
  vx: 0, vy: 0,     // velocidade px/s
  r: 20,            // raio (atualizado por ItemFactory ao criar a fase)
  angle: 0,         // ângulo de rotação visual (rolagem)
  angularVelocity: 0,
};

// Gravidade bruta do acelerômetro (range -1..1 por eixo)
const gravity = { x: 0, y: 0 };
// Gravidade anterior (para cálculo de delta rolagem)
let lastGravityX = 0;

// Referência ao canvas + bounds do labírinto
let _canvas = null;
let _bounds = { w: 0, h: 0, marginX: 0, marginY: 0 };

// Callback chamado a cada frame pelo main.js
let _onFrameUpdate = null;
// RAF id
let _rafId = null;
// Timestamp do frame anterior
let _lastTime = null;

// -------------------------------------------------------------
// Acelerômetro (DeviceOrientationEvent)
// Equivalente ao CMMotionManager do Swift
// -------------------------------------------------------------
function iniciarAcelerometro() {
  // iOS 13+ exige permissão explícita
  if (typeof DeviceOrientationEvent !== 'undefined' &&
      typeof DeviceOrientationEvent.requestPermission === 'function') {
    DeviceOrientationEvent.requestPermission()
      .then(state => { if (state === 'granted') _registrarOrientacao(); })
      .catch(console.error);
  } else {
    _registrarOrientacao();
  }
}

function _registrarOrientacao() {
  window.addEventListener('deviceorientation', _onOrientation, { passive: true });
}

function _onOrientation(e) {
  if (!gameState.jogoAtivo || gameState.jogoPausado) return;
  // gamma = inclinação lateral (-90..90) → eixo X
  // beta  = inclinação frente/trás (-180..180) → eixo Y
  // Normaliza para range -1..1
  gravity.x =  (e.gamma ?? 0) / 90;
  gravity.y =  (e.beta  ?? 0) / 90;
}

// Teclado para testes em desktop (WASD / setas)
const _keys = {};
window.addEventListener('keydown', e => { _keys[e.key] = true;  });
window.addEventListener('keyup',   e => { _keys[e.key] = false; });

function _gravityFromKeyboard() {
  const s = 0.6;
  gravity.x = (_keys['ArrowRight'] || _keys['d'] ? s : 0) - (_keys['ArrowLeft'] || _keys['a'] ? s : 0);
  gravity.y = (_keys['ArrowDown']  || _keys['s'] ? s : 0) - (_keys['ArrowUp']   || _keys['w'] ? s : 0);
}

// -------------------------------------------------------------
// Inicialização
// -------------------------------------------------------------
function physicsInit(canvas, bounds, onFrameUpdate) {
  _canvas         = canvas;
  _bounds         = bounds;
  _onFrameUpdate  = onFrameUpdate;
  player.x        = bounds.w / 2;
  player.y        = bounds.h / 4;
  player.vx = player.vy = 0;
  player.angle = player.angularVelocity = 0;
  lastGravityX = 0;
}

function physicsReset() {
  player.vx = player.vy = 0;
  player.angle = player.angularVelocity = 0;
  gravity.x = gravity.y = 0;
  lastGravityX = 0;
}

// -------------------------------------------------------------
// Loop de física
// -------------------------------------------------------------
function physicsStart() {
  _lastTime = null;
  _rafId = requestAnimationFrame(_loop);
}

function physicsStop() {
  if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }
}

function _loop(timestamp) {
  if (_lastTime === null) _lastTime = timestamp;
  const dt = Math.min((timestamp - _lastTime) / 1000, 0.05); // cap 50ms
  _lastTime = timestamp;

  if (gameState.jogoAtivo && !gameState.jogoPausado) {
    _gravityFromKeyboard(); // no-op em mobile (gravity já vem do acelerômetro)
    _step(dt);
  }

  if (_onFrameUpdate) _onFrameUpdate(dt);
  _rafId = requestAnimationFrame(_loop);
}

// -------------------------------------------------------------
// Passo de física (equivale ao UIDynamicAnimator interno)
// -------------------------------------------------------------
function _step(dt) {
  const b = _bounds;
  const r = player.r;

  // 1. Integra gravidade na velocidade
  player.vx = (player.vx + gravity.x * PHYSICS.GRAVIDADE_ESCALA * dt) * PHYSICS.ATRITO;
  player.vy = (player.vy + gravity.y * PHYSICS.GRAVIDADE_ESCALA * dt) * PHYSICS.ATRITO;

  // 2. Aplica repulsão de magnetos (MagnetSystem.js)
  magnetAplicarRepulsao(dt);

  // 3. Aplica atração de buraco negro (BlackHole.js)
  blackHoleAplicarAtracao(dt);

  // 4. Elimina velocidade abaixo do threshold
  if (Math.abs(player.vx) < PHYSICS.MIN_VEL_THRESHOLD) player.vx = 0;
  if (Math.abs(player.vy) < PHYSICS.MIN_VEL_THRESHOLD) player.vy = 0;

  // 5. Integra posição
  player.x += player.vx * dt;
  player.y += player.vy * dt;

  // 6. Colisão com paredes (equivale a translatesReferenceBoundsIntoBoundary)
  if (player.x - r < b.marginX) {
    player.x = b.marginX + r;
    player.vx = Math.abs(player.vx) * PHYSICS.REBOTE;
  }
  if (player.x + r > b.marginX + b.w) {
    player.x = b.marginX + b.w - r;
    player.vx = -Math.abs(player.vx) * PHYSICS.REBOTE;
  }
  if (player.y - r < b.marginY) {
    player.y = b.marginY + r;
    player.vy = Math.abs(player.vy) * PHYSICS.REBOTE;
  }
  if (player.y + r > b.marginY + b.h) {
    player.y = b.marginY + b.h - r;
    player.vy = -Math.abs(player.vy) * PHYSICS.REBOTE;
  }

  // 7. Colisão com obstaculos (magnetos — caixa sólida)
  for (const obs of physicsObstacles) {
    _colideComRetangulo(obs);
  }

  // 8. Rolagem visual (equivale a RollingProperties no GVC)
  const deltaGravX = gravity.x - lastGravityX;
  lastGravityX = gravity.x;
  player.angularVelocity = Math.max(
    -PHYSICS.MAX_ANGULAR_VELOCITY,
    Math.min(
      PHYSICS.MAX_ANGULAR_VELOCITY,
      (player.angularVelocity + deltaGravX * 2.5) * PHYSICS.ANGULAR_FRICTION
    )
  );
  player.angle += player.angularVelocity;
}

// Colisão círculo-retângulo (equivale às boundaries do UICollisionBehavior)
function _colideComRetangulo(rect) {
  const r = player.r;
  const nearX = Math.max(rect.x, Math.min(player.x, rect.x + rect.w));
  const nearY = Math.max(rect.y, Math.min(player.y, rect.y + rect.h));
  const dx = player.x - nearX;
  const dy = player.y - nearY;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist >= r || dist < 0.001) return;

  const overlap = r - dist;
  const nx = dx / dist;
  const ny = dy / dist;
  player.x += nx * overlap;
  player.y += ny * overlap;

  // Reflete velocidade na normal
  const dot = player.vx * nx + player.vy * ny;
  player.vx -= (1 + PHYSICS.REBOTE) * dot * nx;
  player.vy -= (1 + PHYSICS.REBOTE) * dot * ny;
}

// Array de retângulos sólidos {x, y, w, h} gerenciado por MagnetSystem.js
const physicsObstacles = [];

function physicsAdicionarObstaculo(rect) {
  physicsObstacles.push(rect);
}

function physicsLimparObstaculos() {
  physicsObstacles.length = 0;
}
