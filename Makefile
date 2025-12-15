.PHONY: clean start stop

clean:
	sudo rm -rf ./chains/sovereign-solana/rollup/test-data/docker
	rm -rf ./agents/docker-data

start:
ifdef WITH_OBSERVABILITY
	docker compose -f tools/sov-observability/docker-compose.yml up -d
endif
	docker compose up -d

stop:
	docker compose down
	docker compose -f tools/sov-observability/docker-compose.yml down
