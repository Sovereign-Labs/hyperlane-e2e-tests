import {
  Connection,
  PublicKey,
  Transaction,
  TransactionInstruction,
  Keypair,
  sendAndConfirmTransaction,
  SystemProgram,
} from "@solana/web3.js";
import * as borsh from "borsh";
import { Buffer } from "buffer";
import agentConfig from "../agents/config.json";
import solanaKeypair from "../chains/solana/environments/local/accounts/signer_keypair.json";

// Hyperlane Register program ID
const REGISTER_PROGRAM_ID = new PublicKey(
  "HX6EowhA5XwWj29iTFeqhprg1gUxHgv6RNUu4bRtUgob"
);

// Mailbox program ID
const MAILBOX_PROGRAM_ID = new PublicKey(agentConfig.chains.sealevel.mailbox);

export const SEALEVEL_SPL_NOOP_ADDRESS =
  "noopb9bkMVfRPU8AsbpTUg8AQkHtKwMYZiFUjNRtMmV";

function derivePda(seeds, programId) {
  const [pda] = PublicKey.findProgramAddressSync(
    seeds.map((s) => Buffer.from(s)),
    new PublicKey(programId)
  );
  return pda;
}

function deriveMailboxDispatchAuthorityPda(programId) {
  return derivePda(
    ["hyperlane_dispatcher", "-", "dispatch_authority"],
    programId
  );
}

function deriveMailboxOutboxPda(mailboxProgramId) {
  return derivePda(["hyperlane", "-", "outbox"], mailboxProgramId);
}

function deriveMailboxDispatchedMessagePda(
  mailboxProgramId,
  uniqueMessageAccount
) {
  return derivePda(
    [
      "hyperlane",
      "-",
      "dispatched_message",
      "-",
      new PublicKey(uniqueMessageAccount).toBuffer(),
    ],
    mailboxProgramId
  );
}

// Define the RegisterMessage structure (matches your Rust struct)
class RegisterMessage {
  constructor(destination, embedded_user, recipient) {
    this.destination = destination;
    this.embedded_user = embedded_user;
    this.recipient = recipient;
  }
}

// Define the instruction enum (matches your Rust enum)
class HyperlaneRegisterInstruction {
  constructor(register_message) {
    this.instruction = 0; // SendRegister variant
    this.register_message = register_message;
  }
}

// Borsh schema for serialization
const SCHEMA = new Map([
  [
    RegisterMessage,
    {
      kind: "struct",
      fields: [
        ["destination", "u32"],
        ["embedded_user", [32]], // 32-byte array for Pubkey
        ["recipient", "string"],
      ],
    },
  ],
  [
    HyperlaneRegisterInstruction,
    {
      kind: "struct",
      fields: [
        ["instruction", "u8"],
        ["register_message", RegisterMessage],
      ],
    },
  ],
]);

export async function executeRegisterProgram(
  connection,
  payer,
  destination,
  embeddedUser,
  recipient
) {
  try {
    // Create the register message
    const registerMessage = new RegisterMessage(
      destination,
      embeddedUser,
      recipient
    );
    const instruction = new HyperlaneRegisterInstruction(registerMessage);

    // Serialize the instruction data
    const instructionData = borsh.serialize(SCHEMA, instruction);

    const uniqueMessageAccount = Keypair.generate();
    const keys = [
      // mailbox program
      {
        pubkey: MAILBOX_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
      // mailbox outbox pda
      {
        pubkey: deriveMailboxOutboxPda(MAILBOX_PROGRAM_ID),
        isSigner: false,
        isWritable: true,
      },
      // dispatch authority
      {
        pubkey: deriveMailboxDispatchAuthorityPda(REGISTER_PROGRAM_ID),
        isSigner: false,
        isWritable: false,
      },
      // system program
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      // spl noop address
      {
        pubkey: new PublicKey(SEALEVEL_SPL_NOOP_ADDRESS),
        isSigner: false,
        isWritable: false,
      },
      // payer
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      // unique message account
      {
        pubkey: uniqueMessageAccount.publicKey,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: deriveMailboxDispatchedMessagePda(
          MAILBOX_PROGRAM_ID,
          uniqueMessageAccount.publicKey
        ),
        isSigner: false,
        isWritable: true,
      },
    ];

    // Create the transaction instruction
    const registerInstruction = new TransactionInstruction({
      keys,
      programId: REGISTER_PROGRAM_ID,
      data: Buffer.from(instructionData),
    });

    // Create and send transaction
    const transaction = new Transaction().add(registerInstruction);

    console.log("Sending transaction...");
    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [payer, uniqueMessageAccount],
      {
        commitment: "confirmed",
      }
    );

    console.log("Transaction confirmed!");
    console.log("Signature:", signature);

    // Get transaction details to see logs
    const txDetails = await connection.getTransaction(signature, {
      commitment: "confirmed",
    });

    if (txDetails?.meta?.logMessages) {
      console.log("\n=== Transaction Logs ===");
      txDetails.meta.logMessages.forEach((log, index) => {
        console.log(`${index + 1}: ${log}`);
      });
    }

    // Look for the message ID in the logs
    const registerLog = txDetails?.meta?.logMessages?.find((log) =>
      log.includes("register ")
    );

    if (registerLog) {
      const messageId = registerLog.split("register ")[1];
      console.log("\n=== Message ID ===");
      console.log("Message ID:", messageId);
    }

    return {
      signature,
      messageId: registerLog?.split("register ")[1] || null,
      success: true,
    };
  } catch (error) {
    console.error("Error executing register program:", error);
    return {
      signature: null,
      messageId: null,
      success: false,
      error: error.message,
    };
  }
}

const PAYER_KEYPAIR = Keypair.fromSecretKey(new Uint8Array(solanaKeypair));
const destination = agentConfig.chains.sovereign.domainId; // Destination domain ID
const embeddedUser = new PublicKey("11111111111111111111111111111113"); // Example embedded user

async function doTransaction() {
  const connection = new Connection("http://localhost:8899", "confirmed");
  executeRegisterProgram(
    connection,
    PAYER_KEYPAIR,
    destination,
    embeddedUser.toBytes(),
    "0xddab628a0e1371ed348dc24e9d10869a79c7df797859e7f269a3bbcb4fec98ca"
  );
}

doTransaction().then(console.log).catch(console.log);
