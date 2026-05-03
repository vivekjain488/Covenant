const fs = require("fs");
const path = require("path");

const DEFAULT_SCENARIO_FILE = path.join(__dirname, "..", "config", "demo-scenarios.json");

function resolveScenarioPath() {
  const override = process.env.DEMO_SCENARIOS_PATH;
  if (override && String(override).trim()) {
    return path.isAbsolute(override) ? override : path.resolve(process.cwd(), override);
  }
  return DEFAULT_SCENARIO_FILE;
}

function loadScenarioMap() {
  const scenarioPath = resolveScenarioPath();
  const raw = fs.readFileSync(scenarioPath, "utf8");
  return JSON.parse(raw);
}

let scenarioCache;

function getScenario(name) {
  if (!scenarioCache) {
    scenarioCache = loadScenarioMap();
  }
  const list = scenarioCache[name] || scenarioCache.attackReplay;
  return Array.isArray(list) ? list : [];
}

module.exports = {
  getScenario,
};
