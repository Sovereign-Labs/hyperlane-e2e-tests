.PHONY: up down restart logs ps clean grafana prometheus loki tempo influxdb help

PROJECT_ROOT := $(shell git rev-parse --show-toplevel)
# Detect which docker compose command is available
# docker-setup-buildx doesn’t install docker-compose v1, and the GitHub Actions runner no longer includes it.
DOCKER_COMPOSE := $(shell if command -v docker-compose >/dev/null 2>&1; then echo "docker-compose"; else echo "docker compose"; fi)

# Default target
.DEFAULT_GOAL := help

## Start all services
start:
	@echo "Starting observability services..."
	@$(DOCKER_COMPOSE) up -d --build --force-recreate
	@echo "Waiting for all services to become healthy..."
	@timeout=60; \
	while [ $$timeout -gt 0 ]; do \
		if $(DOCKER_COMPOSE) ps --format json | jq -e 'select(.Health != "healthy") | .Name' > /dev/null 2>&1; then \
			printf "\r⏳ Waiting for services... ($$timeout seconds remaining)    "; \
			sleep 1; \
			timeout=$$((timeout - 1)); \
		else \
			echo ""; \
			echo "✅ All observability services are healthy!"; \
			echo ""; \
			echo "🚀 Observability stack is ready:"; \
			echo "   - Grafana:     http://localhost:$${GRAFANA_PORT:-3000} (admin/admin123)"; \
			echo "   - InfluxDB:    http://localhost:$${INFLUX_PORT:-8086} (admin/admin123)"; \
			echo ""; \
			echo "📊 To monitor your rollup, check out https://sovlabs.notion.site/Tutorial-Getting-started-with-Grafana-Cloud-17e47ef6566b80839fe5c563f5869017?pvs=74"; \
			exit 0; \
		fi; \
	done; \
	echo ""; \
	echo "⚠️  Timeout waiting for services to become healthy"; \
	echo "Check service status with: $DOCKER_COMPOSE ps"; \
	echo "View logs with: make logs"; \
	exit 1

start-alloy-only:
	@echo "Starting Grafana Alloy only..."
	@$(DOCKER_COMPOSE) up -d --build --force-recreate grafana-alloy
	sleep 10

start-telegraf-only:
	@echo "Starting Telegraf only..."
	@$(DOCKER_COMPOSE) up -d --build --force-recreate telegraf
	@echo "Waiting for Telegraf to become healthy..."
	@timeout=60; \
	while [ $$timeout -gt 0 ]; do \
		status=$$($(DOCKER_COMPOSE) ps telegraf --format json | jq -r '.Health // "starting"'); \
		if [ "$$status" = "healthy" ]; then \
			echo ""; \
			echo "✅ Telegraf is healthy!"; \
			echo ""; \
			echo "🚀 Telegraf is ready:"; \
			echo "   - UDP endpoint: localhost:$${TELEGRAF_PORT:-8094}"; \
			echo "   - TCP endpoint: localhost:$${TELEGRAF_PORT:-8094}"; \
			echo ""; \
			exit 0; \
		else \
			printf "\r⏳ Waiting for Telegraf... ($$timeout seconds remaining)    "; \
			sleep 1; \
			timeout=$$((timeout - 1)); \
		fi; \
	done; \
	echo ""; \
	echo "⚠️  Timeout waiting for Telegraf to become healthy"; \
	echo "Check service status with: docker compose ps telegraf"; \
	echo "View logs with: docker compose logs telegraf"; \
	exit 1

make start-agents-only: start-telegraf-only start-alloy-only

## Stop all services
stop:
	@echo "Shutting down services..."
	@$(DOCKER_COMPOSE) down

## Restart all services
restart: down up

## Show logs for all services
logs:
	@$(DOCKER_COMPOSE) logs -f

## Clean up volumes and networks
clean:
	@echo "Cleaning up volumes and networks..."
	@$(DOCKER_COMPOSE) down -v --remove-orphans
	rm -rf grafana-alloy/storage/*
	rm -rf grafana-tempo/data/*
	rm -rf influxdb-data/engine/*
	rm -rf influxdb-data/influx*


## Show this help message
help:
	@echo "Available targets:"
	@awk '/^##/ {c=$$0} /^[a-z_-]+:/ {gsub("##", "", c); printf "  %-15s %s\n", $$1, c}' $(MAKEFILE_LIST)
