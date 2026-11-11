"use client";

import { useState } from "react";
import data from "@/content/vayucast.json";
import { haptic } from "@/lib/haptics";

/**
 * VayuCast's real output: the latest forecast run for each city from its own forecast log,
 * with the likely range, the AQI category, what usually drives forecasts there, and test
 * vs live accuracy. Snapshotted at every build of this site (scripts/vayucast.mjs).
 */

type City = { madeFrom: string; days: { date: string; aqi: number; low: number; high: number }[]; drivers: [string, number][] };
const cities = data.cities as unknown as Record<string, City>;
const ORDER = ["belagavi", "kolhapur", "pune", "mumbai", "bengaluru", "hyderabad", "kurnool", "lucknow", "delhi"].filter((c) => cities[c]);

/** CPCB AQI categories, with text colours that keep contrast on each chip. */
const BANDS = [
  { max: 50, name: "Good", bg: "#55a84f", ink: "#0b1a09" },
  { max: 100, name: "Satisfactory", bg: "#a3c853", ink: "#142007" },
  { max: 200, name: "Moderate", bg: "#f6dd3b", ink: "#2a2400" },
  { max: 300, name: "Poor", bg: "#f29c33", ink: "#2b1600" },
  { max: 400, name: "Very poor", bg: "#e93f33", ink: "#ffffff" },
  { max: 500, name: "Severe", bg: "#af2d24", ink: "#ffffff" },
];
const band = (aqi: number) => BANDS.find((b) => aqi <= b.max) ?? BANDS[BANDS.length - 1];

const DRIVER: Record<string, string> = {
  aqi_1d_ago: "Yesterday's AQI",
  aqi_today: "Today's AQI",
  pm2_5_today: "Today's PM2.5",
  pm10_today: "Today's PM10",
  wind_speed_target_day: "Wind on the day",
  wind_change: "Change in wind",
  rain_target_day: "Rain on the day",
  aqi_mean_30d: "30-day average",
  aqi_mean_3d: "3-day average",
  pressure_today: "Air pressure",
};
const label = (k: string) => DRIVER[k] ?? k.replace(/_/g, " ");
const title = (c: string) => c[0].toUpperCase() + c.slice(1);
const day = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString([], { weekday: "short", day: "numeric", month: "short" });

export function VayuCastDemo() {
  const [city, setCity] = useState(ORDER[0]);
  const c = cities[city];
  const top = Math.max(60, ...c.days.map((d) => d.high)) * 1.15;
  const maxDriver = Math.max(...c.drivers.map(([, v]) => v));
  const cityMae = (data.cityMae as Record<string, number>)[title(city)];

  // Chart geometry: three days across, AQI up.
  const CW = 680;
  const CH = 170;
  const px = (i: number) => 40 + i * ((CW - 80) / Math.max(1, c.days.length - 1));
  const py = (v: number) => CH - 16 - (v / top) * (CH - 32);
  const area = [...c.days.map((d, i) => `${px(i)},${py(d.high)}`), ...c.days.map((d, i) => `${px(i)},${py(d.low)}`).reverse()].join(" ");

  return (
    <div className="demo vayu-demo">
      <div className="vc-cities" role="tablist" aria-label="City">
        {ORDER.map((k) => (
          <button key={k} type="button" role="tab" aria-selected={k === city} onClick={() => (setCity(k), haptic("tick"))}>
            {title(k)}
          </button>
        ))}
      </div>

      <div className="vc-main">
        <div className="vc-days">
          {c.days.map((d, i) => {
            const b = band(d.aqi);
            return (
              <div key={d.date} className="vc-day">
                <p className="vc-when">{i + 1} day{i ? "s" : ""} ahead · {day(d.date)}</p>
                <p className="vc-aqi">{d.aqi}</p>
                <p className="vc-chip" style={{ background: b.bg, color: b.ink }}>{b.name}</p>
                <p className="vc-range">likely {d.low}–{d.high}</p>
              </div>
            );
          })}
        </div>

        <svg className="vc-chart" viewBox={`0 0 ${CW} ${CH}`} role="img" aria-label={`Forecast AQI for ${title(city)} with its likely range`}>
          {BANDS.filter((b, i) => (i === 0 ? 0 : BANDS[i - 1].max) < top).map((b, i, arr) => {
            const lo = i === 0 ? 0 : arr[i - 1].max;
            return <rect key={b.name} x={24} width={CW - 48} y={py(Math.min(b.max, top))} height={py(lo) - py(Math.min(b.max, top))} fill={b.bg} opacity={0.12} />;
          })}
          <polygon points={area} className="vc-area" />
          <polyline points={c.days.map((d, i) => `${px(i)},${py(d.aqi)}`).join(" ")} className="vc-line" />
          {c.days.map((d, i) => (
            <g key={d.date}>
              <circle cx={px(i)} cy={py(d.aqi)} r={4.5} className="vc-dot" />
              <text x={px(i)} y={CH - 2} textAnchor="middle" className="vc-axis">{day(d.date)}</text>
            </g>
          ))}
        </svg>

        <div className="vc-why">
          <p className="demo-label">What usually drives forecasts in {title(city)}</p>
          <ul>
            {c.drivers.map(([k, v]) => (
              <li key={k}>
                <span>{label(k)}</span>
                <i style={{ width: `${(v / maxDriver) * 100}%` }} aria-hidden="true" />
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="vc-foot">
        <span><b>±{data.test["1"].mae.toFixed(1)}</b> next-day error on the locked test year</span>
        {data.live && <span><b>±{data.live.mae.toFixed(1)}</b> live, over {data.live.scored} forecasts scored so far</span>}
        {cityMae != null && <span><b>±{cityMae.toFixed(1)}</b> for {title(city)} on the test year</span>}
        <span>Forecast made {day(c.madeFrom)} · model trained {data.trainedAt ? day(data.trainedAt) : "recently"}</span>
        <a href="https://vayucast.streamlit.app" target="_blank" rel="noreferrer">Open the live dashboard ↗</a>
      </div>
    </div>
  );
}
