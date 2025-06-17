
function showSection(sectionId) {
    document.getElementById('timezone-converter').classList.add('hidden');
    document.getElementById('json-formatter').classList.add('hidden');
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
    { label: "EST - USA Time", zone: "America/New_York" },
    { label: "CET - UK Time", zone: "Europe/London" },
    { label: "PST - Canada Time", zone: "America/Toronto" }
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

    // Clean the input
    jsonInput = jsonInput
        .replace(/\\r\\n/g, '')
        .replace(/\\"/g, '"')
        .replace(/"\{/g, '{')
        .replace(/\}"/g, '}');

    try {
        const parsed = JSON.parse(jsonInput);
        const formatted = JSON.stringify(parsed, null, 2);
        document.getElementById('formatted-json').value = formatted;
    } catch (error) {
        document.getElementById('formatted-json').value = "Invalid JSON";
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
  { city: "(IST) India - Delhi", zone: "Asia/Kolkata", countryCode: "in" },
  { city: "(EST) USA - New York", zone: "America/New_York", countryCode: "us" },
  { city: "(CET) UK - London", zone: "Europe/London", countryCode: "gb" },
  { city: "(UTC | GMT) Universal Time", zone: "UTC", countryCode: "un" },
  { city: "Israel - Jerusalem", zone: "Asia/Jerusalem", countryCode: "il" },
  { city: "Iran - Tehran", zone: "Asia/Tehran", countryCode: "ir" },
  { city: "Russia - Moscow", zone: "Europe/Moscow", countryCode: "ru" },
  { city: "Ukraine - Kyiv", zone: "Europe/Kyiv", countryCode: "ua" },
  { city: "Australia - Sydney", zone: "Australia/Sydney", countryCode: "au" },
  { city: "(PST) Canada - Toronto", zone: "America/Toronto", countryCode: "ca" }
];

const container = document.getElementById('clockContainer');

const getFlagUrl = (code) =>
  code === "un"
    ? "https://upload.wikimedia.org/wikipedia/commons/c/c4/Globe_icon.svg"
    : `https://flagcdn.com/w80/${code}.png`;

timeZones.forEach(({ city, countryCode }, index) => {
  const div = document.createElement('div');
  div.className = 'clock';
  div.innerHTML = `
    <img class="flag" src="${getFlagUrl(countryCode)}" alt="${countryCode} flag">
    <div class="info">
      <div class="city">${city}</div>
      <div class="time" id="time-${index}">--:--:--</div>
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
