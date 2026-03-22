#!/bin/bash

PROJECT_NAME="tutofy"

echo "Creating project structure..."

# Root
mkdir -p $PROJECT_NAME
cd $PROJECT_NAME

# Root README
echo "# Tutofy - OLMS Microservices Project" > README.md

# Main folders
mkdir -p api-gateway services shared infrastructure frontend scripts docs

# README for main folders
echo "# API Gateway" > api-gateway/README.md
echo "# Services" > services/README.md
echo "# Shared modules" > shared/README.md
echo "# Infrastructure" > infrastructure/README.md
echo "# Scripts" > scripts/README.md
echo "# Documentation" > docs/README.md

# frontend (empty but tracked)
touch frontend/.gitkeep

# -------------------------
# SERVICES
# -------------------------

SERVICES=(
auth-service
user-service
course-service
lesson-service
enrollment-service
assignment-service
grading-service
progress-service
payment-service
notification-service
messaging-service
media-service
)

for service in "${SERVICES[@]}"
do
  echo "Creating $service..."
  
  BASE="services/$service"

  mkdir -p $BASE/{cmd,internal/{handler,service,repository,model,middleware,config},proto,migrations,pkg}

  # main.go
  touch $BASE/cmd/main.go

  # go files
  touch $BASE/internal/handler/.gitkeep
  touch $BASE/internal/service/.gitkeep
  touch $BASE/internal/repository/.gitkeep
  touch $BASE/internal/model/.gitkeep
  touch $BASE/internal/middleware/.gitkeep
  touch $BASE/internal/config/.gitkeep

  touch $BASE/proto/.gitkeep
  touch $BASE/migrations/.gitkeep
  touch $BASE/pkg/.gitkeep

  # service README
  echo "# $service" > $BASE/README.md

  # go mod
  touch $BASE/go.mod
  touch $BASE/go.sum

  # docker
  touch $BASE/Dockerfile
done

# -------------------------
# API GATEWAY
# -------------------------

mkdir -p api-gateway/{cmd,internal/{handler,middleware,proxy,config},routes}

touch api-gateway/cmd/main.go
touch api-gateway/internal/handler/.gitkeep
touch api-gateway/internal/middleware/.gitkeep
touch api-gateway/internal/proxy/.gitkeep
touch api-gateway/internal/config/.gitkeep
touch api-gateway/routes/.gitkeep

touch api-gateway/go.mod
touch api-gateway/go.sum
touch api-gateway/Dockerfile

# -------------------------
# SHARED
# -------------------------

mkdir -p shared/{proto,middleware,utils,constants}

touch shared/proto/.gitkeep
touch shared/middleware/.gitkeep
touch shared/utils/.gitkeep
touch shared/constants/.gitkeep

# -------------------------
# INFRASTRUCTURE
# -------------------------

mkdir -p infrastructure/{docker,kubernetes,terraform,monitoring}

touch infrastructure/docker/.gitkeep
touch infrastructure/kubernetes/.gitkeep
touch infrastructure/terraform/.gitkeep
touch infrastructure/monitoring/.gitkeep

# -------------------------
# DONE
# -------------------------

echo "✅ Project structure created successfully!"