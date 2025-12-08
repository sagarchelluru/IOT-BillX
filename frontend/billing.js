const tableBody = document.getElementById("billing-table-body");
const searchInput = document.getElementById("search-input");
const statusFilter = document.getElementById("status-filter");
const monthFilter = document.getElementById("month-filter");
const pillButtons = document.querySelectorAll(".pill");
const invoicePreview = document.getElementById("invoice-preview");
const exportBtn = document.getElementById("export-btn");
const connectWalletBtn = document.getElementById("billing-connect-wallet");
const totalUsageEl = document.getElementById("total-usage");
const avgTariffEl = document.getElementById("avg-tariff");
const pendingAmountEl = document.getElementById("pending-amount");

const ledger = [
  {
    name: "Meter #001",
    usage: 112,
    tariff: 0.15,
    segment: "residential",
    status: "Settled",
    billingCycle: "2025-11",
    wallet: "0x39aB...72Cf",
    meterId: "MTR-001",
    timestamp: "2025-11-27 09:42 UTC",
    tx: "0x2f3...8e1",
  },
  {
    name: "Community Solar",
    usage: 420,
    tariff: 0.13,
    segment: "microgrid",
    status: "Settled",
    billingCycle: "2025-11",
    wallet: "0x81D0...9251",
    meterId: "MTR-201",
    timestamp: "2025-11-27 09:30 UTC",
    tx: "0xa8d...92c",
  },
  {
    name: "EV Hub Alpha",
    usage: 285,
    tariff: 0.17,
    segment: "ev",
    status: "Pending",
    billingCycle: "2025-11",
    wallet: "0x92B9...a4F2",
    meterId: "MTR-318",
    timestamp: "2025-11-27 09:18 UTC",
    tx: "0x7a4...302",
  },
  {
    name: "Campus Grid A",
    usage: 731,
    tariff: 0.12,
    segment: "commercial",
    status: "Settled",
    billingCycle: "2025-10",
    wallet: "0x501E...5529",
    meterId: "MTR-510",
    timestamp: "2025-10-30 23:58 UTC",
    tx: "0xe20...2fd",
  },
  {
    name: "Agri Pump Coop",
    usage: 198,
    tariff: 0.11,
    segment: "residential",
    status: "Pending",
    billingCycle: "2025-09",
    wallet: "0x6341...551A",
    meterId: "MTR-607",
    timestamp: "2025-09-28 07:24 UTC",
    tx: "0xf14...8d1",
  },
  {
    name: "Metro Mall",
    usage: 965,
    tariff: 0.19,
    segment: "commercial",
    status: "Flagged",
    billingCycle: "2025-11",
    wallet: "0xB1c3...91DE",
    meterId: "MTR-740",
    timestamp: "2025-11-27 08:55 UTC",
    tx: "0x8bc...441",
  },
];

let activeSegment = "residential";
let currentView = [...ledger];

const usdFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
});

const badge = (status) => {
  const normalized = status.toLowerCase();
  const style = normalized === "settled" ? "ok" : normalized === "pending" ? "pending" : "";
  return `<span class="badge ${style}">${status}</span>`;
};

const renderTable = (rows) => {
  tableBody.innerHTML = rows
    .map(
      (entry, idx) => `
        <tr data-index="${idx}">
          <td>
            <strong>${entry.name}</strong><br />
            <small>${entry.meterId}</small>
          </td>
          <td>${entry.usage.toFixed(1)}</td>
          <td>$${entry.tariff.toFixed(2)}</td>
          <td>${usdFormatter.format(entry.usage * entry.tariff)}</td>
          <td>${badge(entry.status)}</td>
        </tr>
      `
    )
    .join("");

  tableBody.querySelectorAll("tr").forEach((row) => {
    row.addEventListener("click", () => {
      tableBody
        .querySelectorAll("tr")
        .forEach((r) => r.classList.remove("selected"));
      row.classList.add("selected");
      const index = Number(row.dataset.index);
      renderDetail(rows[index]);
    });
  });
};

const renderDetail = (entry) => {
  if (!entry) {
    invoicePreview.innerHTML = `<p class="muted">Select a ledger row to view details.</p>`;
    return;
  }

  invoicePreview.innerHTML = `
    <div class="detail-heading">
      <h3>${entry.name}</h3>
      <span>${entry.billingCycle}</span>
    </div>
    <div class="detail-grid">
      <div>
        <p class="label">Meter ID</p>
        <p>${entry.meterId}</p>
      </div>
      <div>
        <p class="label">Wallet</p>
        <p>${entry.wallet}</p>
      </div>
      <div>
        <p class="label">Usage</p>
        <p>${entry.usage.toFixed(1)} kWh</p>
      </div>
      <div>
        <p class="label">Tariff</p>
        <p>$${entry.tariff.toFixed(2)}/kWh</p>
      </div>
      <div>
        <p class="label">Amount</p>
        <p>${usdFormatter.format(entry.usage * entry.tariff)}</p>
      </div>
      <div>
        <p class="label">Status</p>
        ${badge(entry.status)}
      </div>
    </div>
    <div class="detail-meta">
      <p>Recorded: ${entry.timestamp}</p>
      <p>Tx Hash: ${entry.tx}</p>
    </div>
    <button class="primary-btn full-width">Re-send Settlement Receipt</button>
  `;
};

const updateStats = (rows) => {
  const totalUsage = rows.reduce((sum, entry) => sum + entry.usage, 0);
  const avgTariff =
    rows.reduce((sum, entry) => sum + entry.tariff * entry.usage, 0) /
    (totalUsage || 1);
  const pendingAmount = rows
    .filter((entry) => entry.status !== "Settled")
    .reduce((sum, entry) => sum + entry.usage * entry.tariff, 0);

  if (totalUsageEl) totalUsageEl.textContent = `${totalUsage.toFixed(1)} kWh`;
  if (avgTariffEl)
    avgTariffEl.textContent = `$${avgTariff.toFixed(2)} / kWh`;
  if (pendingAmountEl)
    pendingAmountEl.textContent = usdFormatter.format(pendingAmount);
};

const applyFilters = () => {
  const term = searchInput.value.toLowerCase();
  const status = statusFilter.value;
  const cycle = monthFilter.value;

  currentView = ledger.filter((entry) => {
    const matchesSegment = entry.segment === activeSegment;
    const matchesSearch =
      entry.name.toLowerCase().includes(term) ||
      entry.meterId.toLowerCase().includes(term) ||
      entry.wallet.toLowerCase().includes(term);
    const matchesStatus = status === "all" || entry.status === status;
    const matchesCycle = cycle === "all" || entry.billingCycle === cycle;

    return matchesSegment && matchesSearch && matchesStatus && matchesCycle;
  });

  renderTable(currentView);
  updateStats(currentView);
  renderDetail(currentView[0]);
};

const handleExport = () => {
  const header = ["Consumer", "Meter ID", "Usage (kWh)", "Tariff", "Amount", "Status", "Wallet", "Billing Cycle"];
  const rows = currentView.map((entry) => [
    entry.name,
    entry.meterId,
    entry.usage.toFixed(2),
    entry.tariff.toFixed(2),
    (entry.usage * entry.tariff).toFixed(2),
    entry.status,
    entry.wallet,
    entry.billingCycle,
  ]);
  const csv = [header, ...rows].map((row) => row.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "power-ledger-billing.csv";
  link.click();
  URL.revokeObjectURL(url);
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

pillButtons.forEach((button) => {
  button.addEventListener("click", () => {
    pillButtons.forEach((pill) => pill.classList.remove("active"));
    button.classList.add("active");
    activeSegment = button.dataset.pill;
    applyFilters();
  });
});

searchInput.addEventListener("input", applyFilters);
statusFilter.addEventListener("change", applyFilters);
monthFilter.addEventListener("change", applyFilters);
exportBtn.addEventListener("click", handleExport);
connectWalletBtn.addEventListener("click", connectWallet);

applyFilters();

