const ADJUSTMENTS = [
  { date: "2020-01-23", percent: 10, materials: ["MDP", "MDF"], requiresBrilhart: false },
  { date: "2020-09-04", percent: 5, materials: ["MDP", "MDF"], requiresBrilhart: false },
  { date: "2020-11-11", percent: 4.9, materials: ["MDP", "MDF"], requiresBrilhart: false },
  { date: "2021-02-25", percent: 7, materials: ["MDP", "MDF"], requiresBrilhart: false },
  { date: "2021-03-25", percent: 10, materials: ["MDP", "MDF"], requiresBrilhart: false },
  { date: "2021-04-26", percent: 6, materials: ["MDP", "MDF"], requiresBrilhart: false },
  { date: "2021-08-05", percent: 8.5, materials: ["MDP", "MDF"], requiresBrilhart: false },
  { date: "2021-12-09", percent: 6.9, materials: ["MDP", "MDF"], requiresBrilhart: false },
  { date: "2022-03-31", percent: 5, materials: ["MDP", "MDF"], requiresBrilhart: false },
  { date: "2022-08-01", percent: 13, materials: ["MDP", "MDF"], requiresBrilhart: false },
  { date: "2023-03-02", percent: 8, materials: ["MDP", "MDF"], requiresBrilhart: false },
  { date: "2023-10-24", percent: 2, materials: ["MDP", "MDF"], requiresBrilhart: false },
  { date: "2024-07-10", percent: 6, materials: ["MDP", "MDF"], requiresBrilhart: false },
  { date: "2024-12-16", percent: 2.9, materials: ["MDP", "MDF"], requiresBrilhart: false },
  { date: "2025-06-27", percent: 11, materials: ["MDP", "MDF"], requiresBrilhart: true },
  { date: "2025-07-30", percent: 5.9, materials: ["MDP"], requiresBrilhart: false },
  { date: "2025-07-30", percent: 5.9, materials: ["MDF"], requiresBrilhart: false },
  { date: "2026-03-04", percent: 5.9, materials: ["MDP"], requiresBrilhart: false },
  { date: "2026-03-04", percent: 2.9, materials: ["MDF"], requiresBrilhart: false }
];

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL"
});

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
});

const form = document.getElementById("calculator-form");
const resultMessage = document.getElementById("resultMessage");
const totalAdjustmentElement = document.getElementById("totalAdjustment");
const projectStatusElement = document.getElementById("projectStatus");
const realPercentElement = document.getElementById("realPercent");
const realValueElement = document.getElementById("realValue");
const adjustmentListElement = document.getElementById("adjustmentList");

function parseInputDate(dateString) {
  return new Date(`${dateString}T00:00:00`);
}

function formatCurrency(value) {
  return currencyFormatter.format(value);
}

function formatPercent(value) {
  return `${percentFormatter.format(value)}%`;
}

function formatAdjustmentDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${day}/${month}/${year}`;
}

function getApplicableAdjustments(saleDate, material, hasBrilhart) {
  return ADJUSTMENTS.filter((adjustment) => {
    const adjustmentDate = parseInputDate(adjustment.date);
    const isAfterSale = adjustmentDate > saleDate;
    const matchesMaterial = adjustment.materials.includes(material);
    const matchesBrilhart = adjustment.requiresBrilhart ? hasBrilhart : true;

    return isAfterSale && matchesMaterial && matchesBrilhart;
  });
}

function sumAdjustmentPercent(adjustments) {
  return adjustments.reduce((total, adjustment) => total + adjustment.percent, 0);
}

function calculateRealDeficit(deficitValue, deficitPercent, totalAdjustment) {
  if (deficitPercent <= totalAdjustment) {
    return {
      healthy: true,
      realPercent: 0,
      realValue: 0
    };
  }

  const valuePerPercent = deficitValue / deficitPercent;
  const realPercent = deficitPercent - totalAdjustment;
  const realValue = valuePerPercent * realPercent;

  return {
    healthy: false,
    realPercent,
    realValue
  };
}

function renderAdjustmentList(adjustments) {
  if (adjustments.length === 0) {
    adjustmentListElement.innerHTML = "<li>Nenhum reajuste foi aplicado para essa venda.</li>";
    return;
  }

  adjustmentListElement.innerHTML = adjustments
    .map((adjustment) => `<li>${formatAdjustmentDate(adjustment.date)}: ${formatPercent(adjustment.percent)}</li>`)
    .join("");
}

function clearStatusStyles() {
  projectStatusElement.classList.remove("status-ok", "status-alert");
}

function renderResult(totalAdjustment, result) {
  totalAdjustmentElement.textContent = formatPercent(totalAdjustment);
  realPercentElement.textContent = formatPercent(result.realPercent);
  realValueElement.textContent = formatCurrency(result.realValue);

  clearStatusStyles();

  if (result.healthy) {
    resultMessage.textContent = "O percentual de déficit foi totalmente absorvido pelos reajustes válidos após a venda.";
    projectStatusElement.textContent = "Projeto saudável";
    projectStatusElement.classList.add("status-ok");
    return;
  }

  resultMessage.textContent = "O projeto ainda possui déficit real após descontar o reajuste acumulado.";
  projectStatusElement.textContent = "Déficit real identificado";
  projectStatusElement.classList.add("status-alert");
}

function validateFormData(saleDate, deficitValue, deficitPercent) {
  if (!saleDate || Number.isNaN(saleDate.getTime())) {
    throw new Error("Informe uma data de venda válida.");
  }

  if (Number.isNaN(deficitValue) || deficitValue < 0) {
    throw new Error("Informe um valor de déficit válido.");
  }

  if (Number.isNaN(deficitPercent) || deficitPercent <= 0) {
    throw new Error("Informe um percentual de déficit maior que zero.");
  }
}

function collectFormData() {
  const saleDate = parseInputDate(document.getElementById("saleDate").value);
  const deficitValue = Number(document.getElementById("deficitValue").value);
  const deficitPercent = Number(document.getElementById("deficitPercent").value);
  const material = document.getElementById("material").value;
  const hasBrilhart = document.getElementById("hasBrilhart").checked;

  validateFormData(saleDate, deficitValue, deficitPercent);

  return {
    saleDate,
    deficitValue,
    deficitPercent,
    material,
    hasBrilhart
  };
}

function handleCalculation(event) {
  event.preventDefault();

  try {
    const formData = collectFormData();
    const applicableAdjustments = getApplicableAdjustments(
      formData.saleDate,
      formData.material,
      formData.hasBrilhart
    );
    const totalAdjustment = sumAdjustmentPercent(applicableAdjustments);
    const result = calculateRealDeficit(
      formData.deficitValue,
      formData.deficitPercent,
      totalAdjustment
    );

    renderAdjustmentList(applicableAdjustments);
    renderResult(totalAdjustment, result);
  } catch (error) {
    clearStatusStyles();
    resultMessage.textContent = error.message;
    totalAdjustmentElement.textContent = "-";
    projectStatusElement.textContent = "Verifique os dados";
    projectStatusElement.classList.add("status-alert");
    realPercentElement.textContent = "-";
    realValueElement.textContent = "-";
    adjustmentListElement.innerHTML = "<li>Corrija os campos para gerar um cálculo válido.</li>";
  }
}

form.addEventListener("submit", handleCalculation);
