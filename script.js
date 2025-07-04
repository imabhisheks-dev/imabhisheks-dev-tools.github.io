
function showSection(sectionId) {
  document.getElementById('timezone-converter').classList.add('hidden');
  document.getElementById('json-formatter').classList.add('hidden');
  document.getElementById('xml-formatter').classList.add('hidden');
  document.getElementById(sectionId).classList.remove('hidden');
}

function convertTime() {
  const timeInput = document.getElementById("time-input").value;
  const sourceZone = document.getElementById("source-timezone").value;
  const targetZone = document.getElementById("target-timezone").value;

  if (!timeInput) {
    document.getElementById("target-timezone-result").textContent = "Please enter a time.";
    return;
  }

  const [hour, minute] = timeInput.split(":").map(Number);

  const nowUtc = luxon.DateTime.utc();
  const sourceTime = luxon.DateTime.fromObject(
    {
      year: nowUtc.year,
      month: nowUtc.month,
      day: nowUtc.day,
      hour: hour,
      minute: minute
    },
    { zone: sourceZone }
  );

  const targetTime = sourceTime.setZone(targetZone);
  const targetLabel = document.getElementById("target-timezone")
    .options[document.getElementById("target-timezone").selectedIndex].text;

  const formattedMain = targetTime.toFormat("hh:mm a (cccc, dd LLL yyyy)");

  // Display main converted result
  let targettimezoneresult = `✅ Converted Time in ${targetLabel}: ${formattedMain}\n`;
  document.getElementById("target-timezone-result").innerHTML = targettimezoneresult.replace(/\n/g, "<br><br>");
  let othertimezonesresult = `🕒 Other Time Zones:\n`;

  // Define zones to show extra conversions
  const zonesToShow = [
    { label: "UTC - Universal Time", zone: "UTC" },
    { label: "IST - India Time", zone: "Asia/Kolkata" },
    { label: "EST/ET - USA Time", zone: "America/New_York" },
    { label: "PT - USA Time", zone: "America/Los_Angeles" },
    { label: "CET - UK Time", zone: "Europe/London" },
    { label: "PST - Canada Time", zone: "Canada/Toronto" }
  ];

  zonesToShow.forEach(({ label, zone }) => {
    const converted = sourceTime.setZone(zone).toFormat("hh:mm a (cccc, dd LLL yyyy)");
    othertimezonesresult += `${label} time: ${converted}\n`;
  });

  // Replace newline characters with <br> for HTML
  document.getElementById("other-timezone-result").innerHTML = othertimezonesresult.replace(/\n/g, "<br><br>");
}




function formatJSON() {
  let jsonInput = document.getElementById('json-input').value;

  // Conditional replacements based on checkboxes
  if (document.getElementById('cb-newline').checked) {
    jsonInput = jsonInput.replace(/\\n/g, '');
  }

  if (document.getElementById('cb-carriage').checked) {
    jsonInput = jsonInput.replace(/\\r/g, '');
  }

  if (document.getElementById('cb-quote').checked) {
    jsonInput = jsonInput.replace(/\\"/g, '"');
  }

  if (document.getElementById('cb-open-close-brace').checked) {
    jsonInput = jsonInput.replace(/"\{/g, '{').replace(/\}"/g, '}');
  }

  try {
    const parsed = JSON.parse(jsonInput);
    const formatted = JSON.stringify(parsed, null, 2);
    document.getElementsByClassName('inline-jsonformat-message')[0].style.color = 'green';
    document.getElementById('formatted-json-message').textContent = 'Valid JSON';
    document.getElementById('formatted-json-response').value = formatted;
  } catch (error) {
    document.getElementsByClassName('inline-jsonformat-message')[0].style.color = 'red';
    document.getElementById('formatted-json-message').textContent = "Invalid JSON";
    document.getElementById('formatted-json-response').value = "";
  }
}


function copyFormattedJSON() {
  const formattedText = document.getElementById('formatted-json');
  formattedText.select();
  formattedText.setSelectionRange(0, 99999); // For mobile devices
  document.execCommand('copy');
}

function formatXML() {
  let xmlInput = document.getElementById('xml-input').value;

  // Validate XML using DOMParser
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlInput, "application/xml");

  const parseError = xmlDoc.getElementsByTagName("parsererror");
  if (parseError.length > 0) {
    document.getElementById('formatted-xml').value = "Invalid XML:\n" + parseError[0].textContent;
    return;
  }

  // Format XML
  const formatted = formatXmlString(new XMLSerializer().serializeToString(xmlDoc));
  document.getElementById('formatted-xml').value = formatted;
}

function formatXmlString(xml) {
  const PADDING = '  ';
  const reg = /(>)(<)(\/*)/g;
  let formatted = '';
  let pad = 0;

  xml = xml.replace(reg, '$1\r\n$2$3');
  xml.split('\r\n').forEach((node) => {
    let indent = 0;
    if (node.match(/.+<\/\w[^>]*>$/)) {
      indent = 0;
    } else if (node.match(/^<\/\w/)) {
      if (pad !== 0) pad -= 1;
    } else if (node.match(/^<\w[^>]*[^\/]>.*$/)) {
      indent = 1;
    }

    formatted += PADDING.repeat(pad) + node + '\r\n';
    pad += indent;
  });

  return formatted.trim();
}

function copyFormattedXML() {
  const formattedText = document.getElementById('formatted-xml');
  formattedText.select();
  formattedText.setSelectionRange(0, 99999); // For mobile devices
  document.execCommand('copy');
}

const timeZones = [
  { city: "IST - Delhi", zone: "Asia/Kolkata", countryCode: "in" },
  { city: "EST/ET - New York", zone: "America/New_York", countryCode: "us" },
  { city: "PT - Los Angeles", zone: "America/Los_Angeles", countryCode: "us" },
  { city: "CET - London", zone: "Europe/London", countryCode: "gb" },
  { city: "UTC | GMT", zone: "UTC", countryCode: "un" },
  { city: "Israel - Jerusalem", zone: "Asia/Jerusalem", countryCode: "il" },
  { city: "Iran - Tehran", zone: "Asia/Tehran", countryCode: "ir" },
  { city: "Russia - Moscow", zone: "Europe/Moscow", countryCode: "ru" },
  { city: "Ukraine - Kyiv", zone: "Europe/Kyiv", countryCode: "ua" },
  { city: "Australia - Sydney", zone: "Australia/Sydney", countryCode: "au" },
  { city: "PST - Toronto", zone: "America/Toronto", countryCode: "ca" },
  { city: "GST - UAE", zone: "Asia/Dubai", countryCode: "ae" }
];

const container = document.getElementById('clockContainer');

const getFlagUrl = (code) =>
  code === "un"
    ? "https://upload.wikimedia.org/wikipedia/commons/c/c4/Globe_icon.svg"
    : `https://flagcdn.com/w80/${code}.png`;

timeZones.forEach(({ city, zone, countryCode }, index) => {
  const div = document.createElement('div');
  div.className = 'clock';
  const offset = moment.tz(zone).utcOffset();
  const offsetHours = offset / 60;
  const formattedOffset = offsetHours >= 0 ? `UTC+${offsetHours}` : `UTC${offsetHours}`;
  // Get current time in the specified time zone
  const currentTime = moment.tz(zone).format('HH:mm:ss');
  div.innerHTML = `
    <img class="flag" src="${getFlagUrl(countryCode)}" alt="${countryCode} flag">
    <div class="info">
      <div class="city">${city} (${formattedOffset})</div>
      <div class="time" id="time-${index}">${currentTime}</div>
    </div>
  `;
  container.appendChild(div);
});

function updateClocks() {
  timeZones.forEach(({ zone }, index) => {
    const now = new Date().toLocaleTimeString('en-US', {
      timeZone: zone,
      hour12: true,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    document.getElementById(`time-${index}`).textContent = now;
  });
}

updateClocks();
setInterval(updateClocks, 1000);


function formatIndianNumber(num) {
  const [integerPart, decimalPart] = num.toString().split(".");
  const lastThree = integerPart.slice(-3);
  const otherNumbers = integerPart.slice(0, -3);
  const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + (otherNumbers ? "," : "") + lastThree;
  return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
}


function formatToIndianNumberingSystem(value) {
  // Remove non-digit characters
  value = value.replace(/[^0-9]/g, '');

  if (value.length <= 3) return value;

  const lastThree = value.slice(-3);
  const rest = value.slice(0, -3);
  const formattedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");

  return formattedRest + "," + lastThree;
}

window.addEventListener("DOMContentLoaded", () => {
  // Set default values
  const today = luxon.DateTime.now();
  document.getElementById("disbursal-date").value = today.toISODate();
  document.getElementById("emi-day").value = today.day;

  // Format principal on load
  const principalInput = document.getElementById("principal");

  principalInput.addEventListener("input", () => {
    const value = principalInput.value.replace(/,/g, '');
    principalInput.value = formatToIndianNumberingSystem(value);
    calculateEMI();
  });

  principalInput.addEventListener("focus", () => {
    principalInput.value = principalInput.value.replace(/,/g, '');
  });

  principalInput.addEventListener("blur", () => {
    const value = principalInput.value.replace(/,/g, '');
    principalInput.value = formatToIndianNumberingSystem(value);
  });

  // Call calculateEMI when any other input changes
  const emiInputs = document.querySelectorAll(".emi-input");
  emiInputs.forEach(input => {
    input.addEventListener("input", () => {
      if (input.id !== "principal") {
        calculateEMI();
      }
    });
  });
});
function calculateEMIButton() {
  const principal = parseFloat(document.getElementById("principal").value.replace(/,/g, ''));
  const annualRate = parseFloat(document.getElementById("interest").value);
  const months = parseInt(document.getElementById("tenure-months").value || 0);
  const disbursalDateStr = document.getElementById("disbursal-date").value;
  const emiDay = parseInt(document.getElementById("emi-day").value);

  if (!principal || !annualRate || !months || !disbursalDateStr || !emiDay) {
    alert("Please fill in all the fields correctly.");
    return;
  }
  else {
    calculateEMI();
  }
}
function calculateEMI() {
  const principal = parseFloat(document.getElementById("principal").value.replace(/,/g, ''));
  const annualRate = parseFloat(document.getElementById("interest").value);
  const months = parseInt(document.getElementById("tenure-months").value || 0);
  const disbursalDateStr = document.getElementById("disbursal-date").value;
  const emiDay = parseInt(document.getElementById("emi-day").value);

  if (!principal || !annualRate || !months || !disbursalDateStr || !emiDay) {
    return;
  }

  const totalMonths = parseInt(document.getElementById("tenure-months").value || 0);
  const monthlyRate = annualRate / 12 / 100;
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) /
    (Math.pow(1 + monthlyRate, totalMonths) - 1);

  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - principal;

  document.getElementById("emi").textContent = emi.toFixed(2);
  document.getElementById("total-interest").textContent = totalInterest.toFixed(2);
  document.getElementById("principal-result").textContent = principal.toFixed(2);
  document.getElementById("total-payment").textContent = totalPayment.toFixed(2);

  const disbursalDate = luxon.DateTime.fromISO(disbursalDateStr);
  generateEmiSchedule(principal, monthlyRate, emi, totalMonths, disbursalDate, emiDay);
}

function generateEmiSchedule(principal, monthlyRate, emi, totalMonths, disbursalDate, emiDay) {
  const tbody = document.querySelector("#emi-schedule tbody");
  tbody.innerHTML = "";

  let balance = principal;

  // Calculate first EMI date (adjust to the emiDay of next or same month)
  let currentDate = disbursalDate.day <= emiDay
    ? disbursalDate.set({ day: emiDay })
    : disbursalDate.plus({ months: 1 }).set({ day: emiDay });

  for (let i = 0; i < totalMonths; i++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = emi - interestPayment;
    balance -= principalPayment;

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${currentDate.toFormat("dd LLL yyyy")}</td>
      <td>₹${formatIndianNumber(emi.toFixed(2))}</td>
      <td>₹${formatIndianNumber(interestPayment.toFixed(2))}</td>
      <td>₹${formatIndianNumber(principalPayment.toFixed(2))}</td>
      <td>₹${formatIndianNumber(balance > 0 ? balance.toFixed(2) : 0)}</td>
    `;

    tbody.appendChild(row);

    // Set next EMI date
    currentDate = currentDate.plus({ months: 1 }).set({ day: emiDay });
  }
}