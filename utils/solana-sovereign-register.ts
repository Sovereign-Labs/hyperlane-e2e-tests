import {
  Connection,
  PublicKey,
  Keypair,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import agentConfig from "../agents/config.json";
import solanaKeypair from "../chains/solana/environments/local/accounts/signer_keypair.json";
import { HyperlaneSolanaRegister } from "@sovereign-sdk/hyperlane-solana-register";
import { createStandardRollup } from "@sovereign-sdk/web3";

async function waitForSovereignConfirmation() {
  const rollup = await createStandardRollup();

  return new Promise<void>((resolve) => {
    const handle = setInterval(async () => {
      const events = await rollup.ledger.events.list();
      for (const event of events) {
        if (event.key === "SolanaRegistration/UserRegistered") {
          console.log(JSON.stringify(event, null, 2));
          clearInterval(handle);
          resolve();
        }
      }
    }, 500);
  });
}

// Hyperlane Register program ID
const REGISTER_PROGRAM_ID = new PublicKey(
  "HX6EowhA5XwWj29iTFeqhprg1gUxHgv6RNUu4bRtUgob"
);

// Mailbox program ID
const MAILBOX_PROGRAM_ID = new PublicKey(agentConfig.chains.sealevel.mailbox);

export const SEALEVEL_SPL_NOOP_ADDRESS =
  "noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV";

const hyperlaneRegister = new HyperlaneSolanaRegister({
  mailbox: MAILBOX_PROGRAM_ID.toBase58(),
  register: REGISTER_PROGRAM_ID.toBase58(),
});

const PAYER_KEYPAIR = Keypair.fromSecretKey(new Uint8Array(solanaKeypair));
const destination = agentConfig.chains.sovereign.domainId; // Destination domain ID
const embeddedUser = new PublicKey("11111111111111111111111111111113"); // Example embedded user

// Setup events subscription to wait for confirmation on Sovereign
const waitForSovereign = waitForSovereignConfirmation();
const { signers, transaction } = hyperlaneRegister.build(PAYER_KEYPAIR, {
  destination,
  embedded_user: embeddedUser,
});

const connection = new Connection("http://localhost:8899", "confirmed");
const signature = await sendAndConfirmTransaction(
  connection,
  transaction,
  signers,
  {
    commitment: "confirmed",
  }
);
console.log("Transaction confirmed on Solana with signature:", signature);

await waitForSovereign;

console.log("Hyperlane registration should now be confirmed on Sovereign.");
