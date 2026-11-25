#!/bin/bash
# Deploy do sistema da recepção na VPS.
#
# Instalado em /opt/campbel/recepcao/deploy.sh (dono root, só root altera).
# O GitHub Actions entra por SSH com uma chave que só consegue rodar este script
# e manda o .jar novo pela entrada padrão:
#
#     ssh root@vps < target/recepcao.jar
#
# O que ele faz:
#   1. recebe o .jar e confere se é um arquivo .jar válido;
#   2. faz backup do banco;
#   3. guarda o .jar em versoes/ com data e hora e aponta o app.jar para ele;
#   4. reinicia o serviço e espera o sistema responder;
#   5. se não responder, volta para a versão anterior e termina com erro;
#   6. mantém só as versões e os backups mais recentes.

set -euo pipefail

SERVICO=campbel-recepcao
PASTA=/opt/campbel/recepcao
VERSOES=$PASTA/versoes
BACKUPS=$PASTA/backups
ATALHO=$PASTA/app.jar
BANCO=recepcao_db
ENDERECO=http://127.0.0.1:8080/
MANTER_VERSOES=15
MANTER_BACKUPS=30
ESPERA_EM_SEGUNDOS=120

# Um deploy por vez.
exec 9>/run/lock/deploy-recepcao.lock
if ! flock -n 9; then
  echo "Já tem outro deploy em andamento." >&2
  exit 1
fi

carimbo=$(date +%Y%m%d-%H%M%S)
novo=$VERSOES/recepcao-$carimbo.jar
recebendo=$(mktemp "$VERSOES/.recebendo-XXXXXX")
trap 'rm -f "$recebendo"' EXIT

# 1. Recebe e confere o .jar
cat > "$recebendo"
tamanho=$(stat -c %s "$recebendo")
if [ "$tamanho" -lt 1000000 ]; then
  echo "O arquivo recebido tem só $tamanho bytes: não parece o .jar do sistema." >&2
  exit 1
fi
if ! python3 -c 'import sys, zipfile; sys.exit(zipfile.ZipFile(sys.argv[1]).testzip() is not None)' "$recebendo"; then
  echo "O arquivo recebido está corrompido ou não é um .jar." >&2
  exit 1
fi
chmod 644 "$recebendo"
mv "$recebendo" "$novo"
echo "Versão nova: $novo ($((tamanho / 1024 / 1024)) MB)"

anterior=""
if [ -L "$ATALHO" ]; then
  anterior=$(readlink -f "$ATALHO")
  echo "Versão anterior: $anterior"
fi

# 2. Backup do banco (o sistema altera as tabelas sozinho ao ligar)
backup=$BACKUPS/$BANCO-antes-$carimbo.dump
runuser -u postgres -- pg_dump -Fc "$BANCO" > "$backup"
echo "Backup do banco: $backup"

# 3 e 4. Troca a versão e espera o sistema responder
responde() {
  local codigo
  codigo=$(curl -s -o /dev/null -w '%{http_code}' --max-time 5 "$ENDERECO" || true)
  [ "$codigo" -ge 200 ] 2>/dev/null && [ "$codigo" -lt 500 ]
}

ligar() {
  ln -sfn "$1" "$ATALHO"
  systemctl enable --quiet "$SERVICO"
  systemctl restart "$SERVICO"
  for ((i = 0; i < ESPERA_EM_SEGUNDOS / 5; i++)); do
    sleep 5
    if responde; then
      return 0
    fi
  done
  return 1
}

if ligar "$novo"; then
  echo "Sistema no ar com a versão nova."
else
  echo "A versão nova não respondeu em $ESPERA_EM_SEGUNDOS segundos. Últimas linhas do log:" >&2
  journalctl -u "$SERVICO" -n 60 --no-pager >&2 || true
  if [ -n "$anterior" ] && [ -f "$anterior" ]; then
    echo "Voltando para $anterior..." >&2
    if ligar "$anterior"; then
      echo "Versão anterior de volta no ar." >&2
    else
      echo "ATENÇÃO: nem a versão anterior respondeu. Veja: journalctl -u $SERVICO" >&2
    fi
  fi
  exit 1
fi

# 6. Limpeza: só as mais recentes
ls -1t "$VERSOES"/recepcao-*.jar 2>/dev/null | tail -n +$((MANTER_VERSOES + 1)) | xargs -r rm -f -- || true
ls -1t "$BACKUPS"/"$BANCO"-antes-*.dump 2>/dev/null | tail -n +$((MANTER_BACKUPS + 1)) | xargs -r rm -f -- || true
