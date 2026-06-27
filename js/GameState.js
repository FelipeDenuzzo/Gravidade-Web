// =============================================================
// GameState.js
// Equivalente a: enum ModoDeJogo, enum DificuldadeJogo,
//                class GameState, class PhaseState (Swift)
// =============================================================

'use strict';

// -------------------------------------------------------------
// Modos de jogo (enum ModoDeJogo)
// -------------------------------------------------------------
const MODOS = {
  LIVRE_SEM_TEMPO:    'livre_sem_tempo',
  LIVRE_COM_TEMPO:    'livre_com_tempo',
  SEQUENCIA_HISTORIA: 'sequencia_historia',
};

// -------------------------------------------------------------
// Dificuldades (enum DificuldadeJogo)
// multiplicadorTempo aplicado sobre tempoBase (30s)
// -------------------------------------------------------------
const DIFICULDADES = [
  { id: 'muito_facil',    titulo: 'Muito fácil',     multiplicadorTempo: 1.60 },
  { id: 'facil',          titulo: 'Fácil',            multiplicadorTempo: 1.35 },
  { id: 'intermediario',  titulo: 'Intermediário',    multiplicadorTempo: 1.15 },
  { id: 'medio_avancado', titulo: 'Médio avançado',   multiplicadorTempo: 1.00 },
  { id: 'avancado',       titulo: 'Avançado',         multiplicadorTempo: 0.85 },
];

// Helpers para o modo selecionado
function modoUsaTempo(modo) {
  return modo === MODOS.LIVRE_COM_TEMPO || modo === MODOS.SEQUENCIA_HISTORIA;
}
function modoPermiteEscolherFase(modo) {
  return modo === MODOS.LIVRE_SEM_TEMPO || modo === MODOS.LIVRE_COM_TEMPO;
}
function modoSegueOrdem(modo) {
  return modo === MODOS.SEQUENCIA_HISTORIA;
}

// -------------------------------------------------------------
// Estado global do jogo (equivale à class GameState do Swift)
// -------------------------------------------------------------
const gameState = {
  jogoAtivo:    false,
  jogoPausado:  false,
  alertaEmExibicao: false,
  botaoSairBloqueado: false,

  faseAtual:    1,
  nivelPro:     false,

  tempoIniciado:   false,
  tempoDecorrido:  0,      // segundos corridos (modo livre)
  tempoRestante:   0,      // segundos restantes (modo com tempo)

  contadorLaranjasColetadasFase17: 0,
  respawnAzulFase17Agendado: false,

  // Modo e dificuldade selecionados
  modo:        MODOS.LIVRE_SEM_TEMPO,
  dificuldade: DIFICULDADES[3],  // padrão: médio avançado
};

// Calcula o tempo limite para uma fase com base na dificuldade
function tempoLimiteParaFase(fase) {
  const tempoBase = 30;
  const comDificuldade = tempoBase * gameState.dificuldade.multiplicadorTempo;
  return Math.max(5, Math.round(comDificuldade));
}

// -------------------------------------------------------------
// Estado por fase (equivale à class PhaseState do Swift)
// Resetado a cada nova fase via resetPhaseState()
// -------------------------------------------------------------
const phaseState = {
  // Arrays de itens
  itensAzuisGeramQuatro:  [],
  itensAzuisGeramOito:    [],
  itensAzuisEspeciais:    [],
  itensLaranjaImpostores: [],
  itensLaranjaFalsas:     [],
  itensGanhaTempo:        [],
  itensPerdeTempo:        [],

  // Esfera azul grande fase 7
  esferaAzulGrandeFase7:               null,
  esferaAzulGrandeFase7MovimentoAtivo: false,
  esferaAzulGrandeFase7TimerId:        null,

  // Esfera azul grande fase 8+
  esferaAzulGrandeFase8:         null,
  esferaAzulGrandeMovimentoAtivo: false,

  // Item azul especial (impostores)
  itemAzulEspecial: null,
};

function resetPhaseState() {
  phaseState.itensAzuisGeramQuatro  = [];
  phaseState.itensAzuisGeramOito    = [];
  phaseState.itensAzuisEspeciais    = [];
  phaseState.itensLaranjaImpostores = [];
  phaseState.itensLaranjaFalsas     = [];
  phaseState.itensGanhaTempo        = [];
  phaseState.itensPerdeTempo        = [];

  phaseState.esferaAzulGrandeFase7               = null;
  phaseState.esferaAzulGrandeFase7MovimentoAtivo = false;
  if (phaseState.esferaAzulGrandeFase7TimerId) {
    clearInterval(phaseState.esferaAzulGrandeFase7TimerId);
    phaseState.esferaAzulGrandeFase7TimerId = null;
  }

  phaseState.esferaAzulGrandeFase8          = null;
  phaseState.esferaAzulGrandeMovimentoAtivo = false;
  phaseState.itemAzulEspecial               = null;

  gameState.contadorLaranjasColetadasFase17 = 0;
  gameState.respawnAzulFase17Agendado       = false;
}
