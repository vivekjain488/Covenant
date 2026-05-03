/**
 * Optional outbound hooks after an ALLOW decision (fire-and-forget).
 * Configure webhook URLs + credentials in environment — Covenant never executes chain txs here,
 * it only notifies systems you operate (relay, audit sink, analytics).
 */

const { uploadDecisionAuditBlob, isZeroGStorageConfigured } = require("./integrations/zero-g-storage");

async function postJson(url, headers, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${text.slice(0, 200)}`);
  }
}

function notifyAllowedDecision(config, envelope) {
  const { decisionRecord } = envelope;
  const payload = {
    source: "covenant",
    event: "execution_allowed",
    decision: decisionRecord,
  };

  const tasks = [];

  if (config.keeperHubWebhookUrl && config.keeperHubApiKey) {
    tasks.push(
      postJson(
        config.keeperHubWebhookUrl,
        { Authorization: `Bearer ${config.keeperHubApiKey}` },
        payload,
      ).catch((err) => console.error("[Covenant] KeeperHub webhook:", err.message)),
    );
  }

  if (config.zeroGAuditWebhookUrl) {
    const headers = {};
    if (config.zeroGApiKey) {
      headers.Authorization = `Bearer ${config.zeroGApiKey}`;
    }
    tasks.push(postJson(config.zeroGAuditWebhookUrl, headers, payload).catch((err) => console.error("[Covenant] 0G audit webhook:", err.message)));
  }

  if (config.uniswapNotifyUrl && config.uniswapApiKey) {
    tasks.push(
      postJson(config.uniswapNotifyUrl, { "x-api-key": config.uniswapApiKey }, payload).catch((err) =>
        console.error("[Covenant] Uniswap notify:", err.message),
      ),
    );
  }

  /* 0G Storage: real indexer upload via @0gfoundation/0g-ts-sdk when indexer + EVM RPC + signer are set */
  if (isZeroGStorageConfigured(config)) {
    tasks.push(
      uploadDecisionAuditBlob(config, decisionRecord)
        .then((uploaded) => {
          if (!uploaded.skipped) {
            console.log(`[Covenant] 0G audit uploaded rootHash=${uploaded.rootHash || uploaded.txHash || "?"}`);
          }
        })
        .catch((err) => console.error("[Covenant] 0G Storage upload:", err.message)),
    );
  }

  return Promise.allSettled(tasks);
}

function scheduleAllowedHooks(config, envelope) {
  if (!config) {
    return;
  }
  setImmediate(() => {
    notifyAllowedDecision(config, envelope).catch(() => {});
  });
}

module.exports = {
  notifyAllowedDecision,
  scheduleAllowedHooks,
};
