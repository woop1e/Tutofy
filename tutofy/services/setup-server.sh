#!/bin/bash
# Запусти этот скрипт на Oracle VM один раз:
#   bash setup-server.sh

set -e

echo "=== Обновляем систему ==="
sudo apt-get update -y && sudo apt-get upgrade -y

echo "=== Устанавливаем Docker ==="
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

echo "=== Устанавливаем Docker Compose plugin ==="
sudo apt-get install -y docker-compose-plugin

echo "=== Открываем порты в firewall Ubuntu ==="
sudo ufw allow 22    # SSH
sudo ufw allow 80    # Frontend
sudo ufw allow 8080  # API gateway (опционально)
sudo ufw allow 9000  # MinIO
sudo ufw --force enable

echo "=== Готово! Переподключись к серверу и запускай deploy.sh ==="
echo "Не забудь также открыть порты 80, 8080, 9000 в Security List Oracle Cloud Console!"
