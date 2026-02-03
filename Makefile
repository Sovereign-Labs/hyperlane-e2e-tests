.PHONY: clean start stop

clean:
	sudo rm -rf ./chains/sovereign-solana/rollup/test-data/docker
	rm -rf ./agents/docker-data

# Pre-create agent data directories with correct ownership (container runs as uid 1000)
init-agent-dirs:
	mkdir -p ./agents/docker-data/relayer/db
	mkdir -p ./agents/docker-data/validator-sealevel/db
	mkdir -p ./agents/docker-data/validator-sealevel/signatures
	mkdir -p ./agents/docker-data/validator-sovereign/db
	mkdir -p ./agents/docker-data/validator-sovereign/signatures

start: init-agent-dirs
ifdef WITH_OBSERVABILITY
	docker compose -f tools/sov-observability/docker-compose.yml up -d
endif
	docker compose up -d

stop:
	docker compose down
	docker compose -f tools/sov-observability/docker-compose.yml down
