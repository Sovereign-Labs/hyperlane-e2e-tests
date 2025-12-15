# Sovereign Observability Stack

A comprehensive observability stack for monitoring Sovereign rollups in development environments.

## Components

- **Grafana** (v11.4.0) - Visualization and dashboards
- **Prometheus** - Metrics collection  
- **Loki** (v3.3.2) - Log aggregation
- **Tempo** (v2.6.1) - Distributed tracing
- **InfluxDB** (v2.7) - Time-series database
- **Telegraf** (v1.34) - System metrics collection
- **Grafana Alloy** (v1.5.1) - OpenTelemetry collector for logs and traces

## Quick Start

1. Start the observability stack:
   ```bash
   make start
   ```

2. Access Grafana at http://localhost:3000
   - Username: `admin`
   - Password: `admin123`

3. To monitor your rollup, start it with the Prometheus exporter:
   ```bash
   cd ../examples/demo-rollup/ && cargo run -- \
      --da-layer celestia \
      --rollup-config-path demo_rollup_config.toml \
      --genesis-config-dir ../test-data/genesis/demo/celestia \
      --prometheus-exporter-bind=0.0.0.0:9845
   ```

## Available Commands

```bash
make start    # Start all services
make stop     # Stop all services  
make restart  # Restart all services
make logs     # View logs for all services
make clean    # Clean up volumes and data
make help     # Show all available commands
```

## Custom Port Configuration

To use different ports, create a `.env` file or export environment variables:

```bash
# Copy the example file
cp different_ports.env .env

# Or export directly
export PROMETHEUS_PORT=9190
export GRAFANA_PORT=3100
export INFLUX_PORT=9096
export TELEGRAF_PORT=8096
export ALLOY_HTTP_PORT=5138
export ALLOY_GRPC_PORT=5137
```

## Data Sources

All data sources are automatically configured:
- **Prometheus** - Metrics from rollup and system
- **InfluxDB** - Time-series metrics via Telegraf
- **Loki** - Logs collection via Grafana Alloy
- **Tempo** - Distributed traces via OpenTelemetry

## Monitoring Rollup Data Directory

To monitor rollup file counts and disk usage:

1. Uncomment the volume mount in `docker-compose.yml` under telegraf service
2. Uncomment the `[[inputs.filecount]]` section in `telegraf/telegraf.conf`
3. Set the `ROLLUP_DATA_DIR` environment variable to your rollup data path

## Development Notes

- All services include health checks for reliable startup
- Data directories are excluded from git via `.gitignore`
- The stack is optimized for local development with minimal resource usage
- Celestia validator metrics are disabled by default (uncomment in `prometheus.yml` if needed)

## Continuous Integration

The repository includes a GitHub Actions workflow that automatically tests the observability stack:

- Runs on every push to main and pull requests
- Verifies that `make start` successfully starts all containers
- Checks that all services reach a healthy state
- Tests accessibility of key services (Grafana and Prometheus)
- Cleans up resources after testing

This ensures that the observability stack remains functional as changes are made to the repository.

## Saving Dashboard Changes

After editing a dashboard in Grafana:
1. Export it to JSON from the dashboard settings
2. Save to `grafana/dashboards/` directory
3. Changes will persist on next restart