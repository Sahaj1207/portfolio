// Snapshots VayuCast's own published results for the desktop's VayuCast app: the latest
// forecast run for each city (from its forecast log), test and live accuracy, and the
// reasons behind forecasts (SHAP). Runs before every build; if GitHub can't be reached,
// the committed file is kept as is.
import { writeFileSync } from "node:fs";

const RAW = "https://raw.githubusercontent.com/Sahaj1207/vayucast/main";
const out = new URL("../src/content/vayucast.json", import.meta.url);

const get = async (path) => {
  const res = await fetch(`${RAW}/${path}`, { signal: AbortSignal.timeout(10_000) });
  if (!res.ok) throw new Error(`${path}: ${res.status}`);
  return res.text();
};

try {
  const [metricsText, monitoringText, logText] = await Promise.all([
    get("reports/metrics.json"),
    get("reports/monitoring.json"),
    get("data/predictions/forecast_log.csv"),
  ]);
  const metrics = JSON.parse(metricsText);
  const monitoring = JSON.parse(monitoringText);

  const [header, ...rows] = logText.trim().split(/\r?\n/);
  const cols = header.split(",");
  const log = rows.map((line) => Object.fromEntries(line.split(",").map((v, i) => [cols[i], v])));

  // The latest run per city, with its 1-, 2- and 3-day forecasts.
  const cities = {};
  for (const city of new Set(log.map((r) => r.city))) {
    const mine = log.filter((r) => r.city === city);
    const madeFrom = mine.map((r) => r.made_from).sort().at(-1);
    const days = mine
      .filter((r) => r.made_from === madeFrom)
      .sort((a, b) => Number(a.days_ahead) - Number(b.days_ahead))
      .map((r) => ({ date: r.target_date, aqi: Number(r.aqi_forecast), low: Number(r.low), high: Number(r.high) }));
    const drivers = Object.entries(metrics.shap?.by_city?.[city] ?? {})
      .slice(0, 5)
      .map(([name, value]) => [name, Math.round(value * 100) / 100]);
    cities[city] = { madeFrom, days, drivers };
  }

  const snapshot = {
    fetchedAt: new Date().toISOString().slice(0, 10),
    trainedAt: metrics.trained_at?.slice(0, 10),
    test: Object.fromEntries(
      Object.entries(metrics.test).map(([d, m]) => [d, { mae: m.mae, category: m.category_accuracy, coverage: m.interval_coverage }]),
    ),
    vsBaseline: metrics.improvement_vs_persistence_pct,
    cityMae: metrics.mae_by_city_1day,
    live: monitoring.live_performance
      ? { checkedAt: monitoring.checked_at?.slice(0, 10), scored: monitoring.live_performance.n_scored, mae: monitoring.live_performance.mae_1day, coverage: monitoring.live_performance.range_coverage }
      : null,
    cities,
  };
  writeFileSync(out, JSON.stringify(snapshot, null, 2) + "\n");
  console.log(`vayucast: ${Object.keys(cities).length} cities, latest run ${Object.values(cities)[0]?.madeFrom}`);
} catch (e) {
  console.log(`vayucast: couldn't refresh (${e.message}), keeping the committed file`);
}
