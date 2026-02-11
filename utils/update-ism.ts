#!/usr/bin/env bun

/**
 * Updates the MultisigISM validators for the sovereign warp route.
 *
 * Usage:
 *   bun run update-ism.ts <validator-address>
 *
 * Example:
 *   bun run update-ism.ts 0xbcbe2a570a78ae0aeda3a1fff5cef697a1051e76
 */

import { createStandardRollup } from "@sovereign-sdk/web3";
import { Ed25519Signer } from "@sovereign-sdk/signers";
import deployedWarpRoutes from "../chains/solana/environments/local/warp-routes/sealevel-sovereignsolana/program-ids.json";

const newValidator = process.argv[2];
if (!newValidator) {
  console.error("Usage: bun run update-ism.ts <validator-address>");
  process.exit(1);
}

// Same deployer used in chains/sovereign-solana/index.ts
const privKey = new Uint8Array([
  39, 195, 119, 77, 82, 231, 30, 162, 102, 169, 197, 37, 108, 217, 139, 154,
  230, 126, 98, 242, 174, 94, 211, 74, 102, 141, 184, 234, 168, 62, 27, 172,
]);
const deployerAddress = "7bWFTGcxY59KfAc5p7SaBaPieQkcSBXs7xCyRoL7vPtf";
const signer = new Ed25519Signer(privKey);

const sovereignWarpRouteId = deployedWarpRoutes.sovereign.hex;

const rollup = await createStandardRollup<any>({
  url: process.env.SOVEREIGN_ROLLUP_URL ?? "http://3.226.5.188:12346",
});

console.log(`Updating ISM for warp route ${sovereignWarpRouteId}`);
console.log(`New validator: ${newValidator}`);

const maxU128 = "340282366920938463463374607431768211455";
const call = {
  warp: {
    update: {
      warp_route: sovereignWarpRouteId,
      admin: { InsecureOwner: deployerAddress },
      ism: {
        MessageIdMultisig: {
          threshold: 1,
          validators: [newValidator],
        },
      },
      inbound_transferrable_tokens_limit: maxU128,
      inbound_limit_replenishment_per_slot: maxU128,
      outbound_transferrable_tokens_limit: maxU128,
      outbound_limit_replenishment_per_slot: maxU128,
    },
  },
};

const { response } = await rollup.call(call, { signer });
console.log("Update response:", JSON.stringify(response, null, 2));
console.log("ISM validators updated successfully!");
