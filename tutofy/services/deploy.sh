#!/bin/bash
# Запускать на Oracle VM каждый раз когда хочешь задеплоить обновления
set -e

echo "=== Собираем и запускаем все сервисы ==="
docker compose -f docker-compose.yml -f docker-compose.prod.yml --env-file .env.prod up -d --build

echo "=== Статус контейнеров ==="
docker compose -f docker-compose.yml -f docker-compose.prod.yml ps

echo ""
echo "✅ Деплой завершён!"
echo "Открой в браузере: http://$(grep SERVER_IP .env.prod | cut -d= -f2)"
