const telemetryFeed = document.getElementById("telemetry-feed");
const usageChartCanvas = document.getElementById("usage-chart");
const billingTable = document.getElementById("billing-table");
const marketOffers = document.getElementById("market-offers");
const settlementList = document.getElementById("settlement-list");
const notificationFeed = document.getElementById("notification-feed");
const connectWalletBtn = document.getElementById("connect-wallet");
const tariffForm = document.getElementById("tariff-form");
const tariffOutput = document.getElementById("tariff-output");
const baseRateInput = document.getElementById("base-rate");
const peakRateInput = document.getElementById("peak-rate");
const offPeakRateInput = document.getElementById("offpeak-rate");

const sampleConsumers = [
  { name: "Meter #001", usage: 112, tariff: 0.15, status: "Settled" },
  { name: "Community Solar", usage: 420, tariff: 0.13, status: "Settled" },
  { name: "EV Hub Alpha", usage: 285, tariff: 0.17, status: "Pending" },
  { name: "Campus Grid A", usage: 731, tariff: 0.12, status: "Settled" },
];

const offers = [
  { seller: "Solar DAO", volume: 80, price: 0.11 },
  { seller: "Wind Collective", volume: 120, price: 0.12 },
  { seller: "Hydro Nexus", volume: 55, price: 0.1 },
];

const settlements = [
  {
    batch: "Batch #812",
    status: "Finalized",
    energy: "4.2 MWh",
    amount: 6120,
    tx: "0x2f3...8e1",
    ago: "2 min ago",
  },
  {
    batch: "Batch #811",
    status: "Queued",
    energy: "3.8 MWh",
    amount: 5510,
    tx: "0xa8d...92c",
    ago: "17 min ago",
  },
  {
    batch: "Batch #810",
    status: "Finalized",
    energy: "5.1 MWh",
    amount: 7420,
    tx: "0x7a4...302",
    ago: "32 min ago",
  },
];

const notifications = [
  {
    title: "Validator quorum secured",
    body: "8/8 validators attested Batch #812.",
    tone: "positive",
    time: "2 min ago",
  },
  {
    title: "Tariff hash rotated",
    body: "Policy v2.4 anchored to contract 0x92B9...a4F2.",
    tone: "warning",
    time: "14 min ago",
  },
  {
    title: "Oracle heartbeat",
    body: "Chainlink PoR feed synchronized (Polygon zkEVM).",
    tone: "positive",
    time: "28 min ago",
  },
];

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const telemetryTemplate = ({ meter, voltage, current, energy }) => `
  <div class="telemetry-row">
    <span>${meter}</span>
    <span>${voltage} V</span>
    <span>${current} A</span>
    <span>${energy} Wh</span>
  </div>
`;

const badge = (status) => {
  const normalized = status.toLowerCase();
  const style = normalized === "settled" ? "ok" : "pending";
  return `<span class="badge ${style}">${status}</span>`;
};

const renderBillingTable = () => {
  if (!billingTable) return;
  billingTable.innerHTML = sampleConsumers
    .map(
      ({ name, usage, tariff, status }) => `
        <tr>
          <td>${name}</td>
          <td>${usage.toFixed(1)}</td>
          <td>$${tariff.toFixed(2)}</td>
          <td>$${(usage * tariff).toFixed(2)}</td>
          <td>${badge(status)}</td>
        </tr>
      `
    )
    .join("");
};

const renderOffers = () => {
  if (!marketOffers) return;
  marketOffers.innerHTML = offers
    .map(
      ({ seller, volume, price }) => `
        <div class="offer-card">
          <div>
            <p>${seller}</p>
            <small>${volume} MWh available</small>
          </div>
          <div>
            <p>$${price.toFixed(2)}/kWh</p>
            <button class="ghost-btn">Bid</button>
          </div>
        </div>
      `
    )
    .join("");
};

const renderSettlements = () => {
  if (!settlementList) return;
  settlementList.innerHTML = settlements
    .map(
      ({ batch, status, energy, amount, tx, ago }) => `
        <li class="timeline-row">
          <div>
            <span class="tag">${ago}</span>
            <strong>${batch}</strong>
            <small>${energy} · ${usdFormatter.format(amount)}</small>
          </div>
          <div style="text-align:right;">
            <span class="badge ${status === "Finalized" ? "ok" : "pending"}">
              ${status}
            </span>
            <small>${tx}</small>
          </div>
        </li>
      `
    )
    .join("");
};

const renderNotifications = () => {
  if (!notificationFeed) return;
  notificationFeed.innerHTML = notifications
    .map(
      ({ title, body, tone, time }) => `
        <div class="notification-card ${tone}">
          <h4>${title}</h4>
          <p>${body}</p>
          <small>${time}</small>
        </div>
      `
    )
    .join("");
};

const updateTariffSummary = (baseRate, peakMultiplier, offPeakMultiplier) => {
  if (!tariffOutput) return;
  const peakRate = baseRate * peakMultiplier;
  const offPeakRate = baseRate * offPeakMultiplier;
  const projectedRevenue =
    (peakRate * 0.35 + baseRate * 0.4 + offPeakRate * 0.25) * 12000;

  tariffOutput.innerHTML = `
    <div>
      <p class="label">Peak Window</p>
      <h3>${peakRate.toFixed(2)} USD/kWh</h3>
      <small>17:00-22:00 local</small>
    </div>
    <div>
      <p class="label">Off-Peak Window</p>
      <h3>${offPeakRate.toFixed(2)} USD/kWh</h3>
      <small>00:00-06:00 local</small>
    </div>
    <div>
      <p class="label">Projected Revenue</p>
      <h3>${usdFormatter.format(projectedRevenue)}</h3>
      <small>Next 24h</small>
    </div>
  `;
};

let chart;
const setupChart = () => {
  if (!usageChartCanvas || typeof Chart === "undefined") return;
  chart = new Chart(usageChartCanvas, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "kW load",
          data: [],
          borderColor: "#5ef2b6",
          tension: 0.4,
          borderWidth: 2,
          fill: true,
          backgroundColor: "rgba(94, 242, 182, 0.08)",
        },
      ],
    },
    options: {
      animation: false,
      plugins: {
        legend: { display: false },
      },
      scales: {
        x: {
          ticks: { color: "#7f808a" },
          grid: { color: "#1f1f24" },
        },
        y: {
          ticks: { color: "#7f808a" },
          grid: { color: "#1f1f24" },
          beginAtZero: true,
          suggestedMax: 20,
        },
      },
    },
  });
};

const pushTelemetry = () => {
  if (!telemetryFeed || !chart) return;
  const payload = {
    meter: `Meter #${Math.floor(Math.random() * 200 + 1)}`,
    voltage: (220 + Math.random() * 10).toFixed(1),
    current: (5 + Math.random() * 3).toFixed(2),
    energy: (Math.random() * 500).toFixed(2),
  };

  telemetryFeed.innerHTML =
    telemetryTemplate(payload) + telemetryFeed.innerHTML;

  if (telemetryFeed.children.length > 8) {
    telemetryFeed.removeChild(telemetryFeed.lastElementChild);
  }

  const now = new Date();
  const timestamp = `${now.getHours()}:${String(now.getMinutes()).padStart(
    2,
    "0"
  )}:${String(now.getSeconds()).padStart(2, "0")}`;

  if (chart.data.labels.length > 15) {
    chart.data.labels.shift();
    chart.data.datasets[0].data.shift();
  }

  chart.data.labels.push(timestamp);
  chart.data.datasets[0].data.push(Number(payload.energy / 50));
  chart.update();
};

const connectWallet = async () => {
  if (!window.ethereum) {
    alert("No Ethereum provider detected. Install MetaMask to continue.");
    return;
  }

  try {
    await window.ethereum.request({ method: "eth_requestAccounts" });
    connectWalletBtn.textContent = "Wallet Connected";
    connectWalletBtn.disabled = true;
  } catch (error) {
    console.error(error);
    alert("Connection cancelled.");
  }
};

renderBillingTable();
renderOffers();
renderSettlements();
renderNotifications();
updateTariffSummary(
  Number(baseRateInput?.value) || 0.14,
  Number(peakRateInput?.value) || 1.6,
  Number(offPeakRateInput?.value) || 0.85
);

if (telemetryFeed && usageChartCanvas) {
  setupChart();
  pushTelemetry();
  setInterval(pushTelemetry, 3000);
}

connectWalletBtn?.addEventListener("click", connectWallet);

tariffForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const base = Number(baseRateInput.value) || 0;
  const peak = Number(peakRateInput.value) || 0;
  const offPeak = Number(offPeakRateInput.value) || 0;
  updateTariffSummary(base, peak, offPeak);
});

