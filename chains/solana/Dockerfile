# ubuntu:20 is required to avoid SSL1.0 issues.
# This old version of ssl is required for the old solana cli.
FROM ubuntu:20.04 AS base

ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=UTC

RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    pkg-config \
    libudev-dev \
    llvm \
    libclang-dev \
    protobuf-compiler \
    libssl-dev \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*


RUN curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
ENV PATH="/root/.cargo/bin:${PATH}"

RUN rustup install 1.75.0
RUN rustup default 1.75.0

WORKDIR /workspace

RUN git clone https://github.com/Sovereign-Labs/hyperlane-monorepo.git

# Build sealevel related artifacts
FROM base AS sealevel-builder

WORKDIR /workspace/hyperlane-monorepo/rust/sealevel/programs

# This version MUST be used to build hyperlane sealevel programs
RUN chmod +x install-solana-1.14.20.sh && ./install-solana-1.14.20.sh
ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"

RUN chmod +x build-programs.sh && ./build-programs.sh all

WORKDIR /workspace/hyperlane-monorepo/rust/sealevel
RUN cargo build --release --bin hyperlane-sealevel-client

# Build SPL related artifacts
FROM base AS spl-builder

WORKDIR /workspace/spl
RUN curl -L https://github.com/hyperlane-xyz/solana-program-library/releases/download/2024-08-23/spl.tar.gz \
    | tar -xz

# Final image with everything prepared
FROM base

# Get the sealevel client
COPY --from=sealevel-builder /workspace/hyperlane-monorepo/rust/sealevel/target/release/hyperlane-sealevel-client /usr/local/bin/hyperlane-sealevel-client
RUN chmod +x /usr/local/bin/hyperlane-sealevel-client

# Get hyperlane sealevel programs
COPY --from=sealevel-builder /workspace/hyperlane-monorepo/rust/sealevel/target/deploy /opt/sealevel

# Get SPL programs
COPY --from=spl-builder /workspace/spl /opt/spl

# This solana version is chosen to match the version used in hyperlane repo and e2e tests
RUN sh -c "$(curl -sSfL https://release.anza.xyz/v2.0.24/install)"
ENV PATH="/root/.local/share/solana/install/active_release/bin:${PATH}"

# Solana setup & configs
COPY entrypoint.sh init.sh deployer_account.json deployer_keypair.json /opt/solana/
RUN chmod +x /opt/solana/entrypoint.sh
RUN chmod +x /opt/solana/init.sh

