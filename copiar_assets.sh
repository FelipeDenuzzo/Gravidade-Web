#!/usr/bin/env bash
# =============================================================
# copiar_assets.sh
# Copia todos os assets do repo Swift (Gravidade) para assets/
#
# Uso:
#   1. Clone ambos os repos lado a lado:
#        git clone https://github.com/FelipeDenuzzo/Gravidade.git
#        git clone https://github.com/FelipeDenuzzo/Gravidade-Web.git
#   2. cd Gravidade-Web
#   3. bash copiar_assets.sh
# =============================================================
set -e

SRC="../Gravidade/Lab_gravidade iOS"
DST="./assets"

if [ ! -d "$SRC" ]; then
  echo "❌ Pasta não encontrada: $SRC"
  echo "   Certifique-se de que o repo Gravidade está clonado em ../Gravidade/"
  exit 1
fi

mkdir -p "$DST"

# ------- Esferas e itens -----------------------------------
cp -v "$SRC/esfera_vermelha.png"  "$DST/esfera_vermelha.png"
cp -v "$SRC/esfera_azul.png"      "$DST/esfera_azul.png"
cp -v "$SRC/esfera_laranja.png"   "$DST/esfera_laranja.png"
cp -v "$SRC/falsa.png"            "$DST/falsa.png"
cp -v "$SRC/ganhatempo.png"       "$DST/ganhatempo.png"
cp -v "$SRC/perdetempo.png"       "$DST/perdetempo.png"

# ------- Magnetos ------------------------------------------
cp -v "$SRC/imamG.png"            "$DST/imamG.png"
cp -v "$SRC/imamP.png"            "$DST/imamP.png"
cp -v "$SRC/magneto_grandelateraldireito.png" "$DST/magneto_grandelateraldireito.png"
cp -v "$SRC/magneto_inferior.png"             "$DST/magneto_inferior.png"
cp -v "$SRC/magneto_inferioresuperior.png"    "$DST/magneto_inferioresuperior.png"

# ------- Buraco negro e fundo ------------------------------
cp -v "$SRC/bn0.png"              "$DST/bn0.png"
cp -v "$SRC/fundo.jpg"            "$DST/fundo.jpg"
cp -v "$SRC/icone.png"            "$DST/icone.png"

# ------- Vídeos de transição -------------------------------
cp -v "$SRC/transivitoria.mp4"    "$DST/transivitoria.mp4"
cp -v "$SRC/transiderrota.mp4"    "$DST/transiderrota.mp4"

# ------- Backgrounds por fase (opcionais) ------------------
for i in $(seq 1 17); do
  F="bg_fase${i}.png"
  if [ -f "$SRC/$F" ]; then
    cp -v "$SRC/$F" "$DST/$F"
  else
    echo "⚠️  $F não encontrado (usando fallback no jogo)"
  fi
done

echo ""
echo "✅ Assets copiados para $DST"
echo "   git add assets/ && git commit -m 'assets: adiciona imagens e vídeos'"
