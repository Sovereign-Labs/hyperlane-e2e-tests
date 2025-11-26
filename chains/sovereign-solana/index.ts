import { createStandardRollup } from "@sovereign-sdk/web3";
import { Ed25519Signer } from "@sovereign-sdk/signers";

// tx_signer_private_key.json
const privKey = new Uint8Array([
  39, 195, 119, 77, 82, 231, 30, 162, 102, 169, 197, 37, 108, 217, 139, 154,
  230, 126, 98, 242, 174, 94, 211, 74, 102, 141, 184, 234, 168, 62, 27, 172,
]);
const deployerAddress = "7bWFTGcxY59KfAc5p7SaBaPieQkcSBXs7xCyRoL7vPtf";
const signer = new Ed25519Signer(privKey);
const rollup = await createStandardRollup<any>();

const maxU128 = "340282366920938463463374607431768211455";
const solanaWarpRouteId =
  "0xcbb6266a1860446ea4ea06eaa02c443b64e3358756fb2e28e2476c57b3521ac7";
const call = {
  warp: {
    register: {
      // The deployer can modify the warp route
      admin: { InsecureOwner: deployerAddress },
      ism: {
        MessageIdMultisig: {
          threshold: 1,
          validators: ["0x70997970C51812dc3A010C7d01b50e0d17dc79C8"],
        },
      },
      token_source: {
        Synthetic: {
          remote_token_id: solanaWarpRouteId,
          local_decimals: 9,
          remote_decimals: 9,
        },
      },
      remote_routers: [[1337, solanaWarpRouteId]],
      inbound_transferrable_tokens_limit: maxU128,
      inbound_limit_replenishment_per_slot: maxU128,
      outbound_transferrable_tokens_limit: maxU128,
      outbound_limit_replenishment_per_slot: maxU128,
    },
  },
};
const { response } = await rollup.call(call, { signer });
console.log(JSON.stringify(response.events, null, 2));
