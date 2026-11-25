#!/bin/bash
# Backup diário do banco da recepção na VPS.
#
# Instalado em /opt/campbel/recepcao/backup.sh (dono root).
# Quem roda é o timer campbel-recepcao-backup.timer, todo dia às 22h.
# Para rodar na mão: systemctl start campbel-recepcao-backup.service
#
# Guarda os backups em /opt/campbel/recepcao/backups e apaga os com mais de 30 dias.
# Os backups feitos antes de cada deploy (recepcao_db-antes-*.dump) são do deploy.sh
# e não são mexidos aqui.

set -euo pipefail

BACKUPS=/opt/campbel/recepcao/backups
BANCO=recepcao_db
MANTER_DIAS=30

arquivo=$BACKUPS/$BANCO-diario-$(date +%Y%m%d-%H%M).dump

# Grava num arquivo temporário e só renomeia no fim: um backup que falhou no meio
# nunca fica com cara de backup bom.
runuser -u postgres -- pg_dump -Fc "$BANCO" > "$arquivo.parcial"
mv "$arquivo.parcial" "$arquivo"
echo "Backup feito: $arquivo ($(du -h "$arquivo" | cut -f1))"

find "$BACKUPS" -name "$BANCO-diario-*.dump" -mtime +"$MANTER_DIAS" -print -delete
find "$BACKUPS" -name "*.parcial" -mtime +1 -delete
