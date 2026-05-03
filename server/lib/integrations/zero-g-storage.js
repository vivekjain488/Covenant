/**
 * 0G Storage ledger upload using @0gfoundation/0g-ts-sdk (+ ethers v6.13.1 peer).
 * Uploads Covenant decision JSON as a compact audit blob when indexer / EVM RPC / signer env are present.
 */

const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const crypto = require("crypto");

function isZeroGStorageConfigured(config) {
  const indexer =
    config?.zeroGIndexerRpc ||
    config?.zerogIndexerRpc ||
    process.env.ZEROG_INDEXER_RPC ||
    "";
  const evm =
    config?.zeroGEvmRpcUrl || config?.zerogEvmRpcUrl || process.env.ZEROG_EVM_RPC_URL || process.env.ZERO_G_EVM_RPC || "";
  const pk =
    config?.zeroGPrivateKey || config?.zerogPrivateKey || process.env.ZEROG_PRIVATE_KEY || process.env.ZERO_G_PRIVATE_KEY || "";
  return Boolean(String(indexer).trim() && String(evm).trim() && String(pk).trim());
}

/**
 * Persist decision record (+ optional preimage for audit) via 0G indexer upload.
 * Returns { txHash?, rootHash?, txSeq?, txHashes? } on success.
 */
async function uploadDecisionAuditBlob(config, decisionRecord) {
  if (!isZeroGStorageConfigured(config)) {
    return { skipped: true, reason: "0G indexer, EVM RPC, or signer not configured" };
  }

  const { Indexer, ZgFile } = require("@0gfoundation/0g-ts-sdk");
  const { ethers } = require("ethers");

  const indexerRpc = String(config.zeroGIndexerRpc || process.env.ZEROG_INDEXER_RPC).trim();
  const evmRpc = String(config.zeroGEvmRpcUrl || process.env.ZEROG_EVM_RPC_URL || process.env.ZERO_G_EVM_RPC).trim();
  const privateKey = String(config.zeroGPrivateKey || process.env.ZEROG_PRIVATE_KEY || process.env.ZERO_G_PRIVATE_KEY).trim();

  const replica = Number(config.zeroGUploadReplicas ?? process.env.ZEROG_UPLOAD_REPLICAS ?? 1);

  const payload = {
    covenant_audit_v1: {
      emittedAt: new Date().toISOString(),
      decisionHash: decisionRecord.entryHash,
      decision: decisionRecord,
    },
  };
  const json = `${JSON.stringify(payload)}\n`;

  const name = `covenant-${decisionRecord.timestamp || Date.now()}-${crypto.randomBytes(4).toString("hex")}.json`;
  const tmpPath = path.join(os.tmpdir(), name);

  let zgFile;
  try {
    await fs.writeFile(tmpPath, json, "utf8");
    zgFile = await ZgFile.fromFilePath(tmpPath);

    const indexer = new Indexer(indexerRpc);
    const provider = new ethers.JsonRpcProvider(evmRpc);
    const signer = new ethers.Wallet(privateKey, provider);

    const [result, err] = await indexer.upload(zgFile, evmRpc, signer, { expectedReplica: replica });
    if (err) {
      throw err;
    }

    const first = Array.isArray(result?.txHashes) ? { txHash: result.txHashes[0], rootHash: result.rootHashes?.[0] } : result;

    return {
      skipped: false,
      txHash: first?.txHash ?? null,
      rootHash: first?.rootHash ?? null,
      txSeq: first?.txSeq ?? null,
    };
  } finally {
    await zgFile?.close?.().catch(() => {});
    await fs.unlink(tmpPath).catch(() => {});
  }
}

module.exports = {
  isZeroGStorageConfigured,
  uploadDecisionAuditBlob,
};
