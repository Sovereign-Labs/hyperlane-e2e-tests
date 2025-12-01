import { createStandardRollup } from "@sovereign-sdk/web3";
import { Ed25519Signer } from "@sovereign-sdk/signers";

// taken from ../../registry/chains/metadata.yaml
const SOLANA_DOMAIN_ID = 1337;
// taken from ../solana/environments/local/warp-routes/sealevel-sovereignsolana/program-ids.json
const SOLANA_WARP_ROUTE_ID =
  "0xcbb6266a1860446ea4ea06eaa02c443b64e3358756fb2e28e2476c57b3521ac7";

// tx_signer_private_key.json
const privKey = new Uint8Array([
  39, 195, 119, 77, 82, 231, 30, 162, 102, 169, 197, 37, 108, 217, 139, 154,
  230, 126, 98, 242, 174, 94, 211, 74, 102, 141, 184, 234, 168, 62, 27, 172,
]);
const deployerAddress = "7bWFTGcxY59KfAc5p7SaBaPieQkcSBXs7xCyRoL7vPtf";
const signer = new Ed25519Signer(privKey);
const rollup = await createStandardRollup<any>({
  // if env var not set defaults to http://localhost:12346
  url: process.env.SOVEREIGN_ROLLUP_URL,
});

const createWarpRoute = async () => {
  const maxU128 = "340282366920938463463374607431768211455";
  const call = {
    warp: {
      register: {
        // The deployer can modify the warp route
        admin: { InsecureOwner: deployerAddress },
        ism: {
          MessageIdMultisig: {
            threshold: 1,
            validators: ["0x2c25Ab04F9cD2beC3D98921b02AFBE54B792cad0"],
          },
        },
        token_source: {
          Synthetic: {
            remote_token_id: SOLANA_WARP_ROUTE_ID,
            local_decimals: 9,
            remote_decimals: 9,
          },
        },
        remote_routers: [[SOLANA_DOMAIN_ID, SOLANA_WARP_ROUTE_ID]],
        inbound_transferrable_tokens_limit: maxU128,
        inbound_limit_replenishment_per_slot: maxU128,
        outbound_transferrable_tokens_limit: maxU128,
        outbound_limit_replenishment_per_slot: maxU128,
      },
    },
  };
  const { response } = await rollup.call(call, { signer });
  console.log("Warp route created:", response);
};

const configureIgp = async () => {
  const call = {
    interchain_gas_paymaster: {
      set_relayer_config: {
        beneficiary: deployerAddress,
        default_gas: 2000,
        domain_default_gas: [
          {
            default_gas: 3000,
            domain: SOLANA_DOMAIN_ID,
          },
        ],
        domain_oracle_data: [
          {
            data_value: {
              gas_price: 1,
              token_exchange_rate: 1,
            },
            domain: SOLANA_DOMAIN_ID,
          },
        ],
      },
    },
  };
  const { response } = await rollup.call(call, { signer });
  console.log("IGP configured:", response);
};

const isRouteAlreadyExistsError = (error: any) => {
  return (error as any)?.error?.details?.message?.includes(
    "was already registered by sender",
  );
};

const main = async () => {
  try {
    await createWarpRoute();
    await configureIgp();
  } catch (error) {
    if (isRouteAlreadyExistsError(error)) return;
    throw error;
  }
};

main();
