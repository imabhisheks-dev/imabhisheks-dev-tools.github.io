
function showSection(sectionId) {
    document.getElementById('timezone-converter').classList.add('hidden');
    document.getElementById('json-formatter').classList.add('hidden');
    document.getElementById(sectionId).classList.remove('hidden');
}

function convertTime() {
    const DateTime = luxon.DateTime;

    const datetime = document.getElementById('datetime').value;
    const sourceTimezone = document.getElementById('source-timezone').value;
    const targetTimezone = document.getElementById('target-timezone').value;

    if (!datetime) {
        document.getElementById('result').innerText = "Please enter a valid date and time.";
        return;
    }

    const dt = DateTime.fromISO(datetime, { zone: sourceTimezone });
    const converted = dt.setZone(targetTimezone).toLocaleString(DateTime.DATETIME_FULL);

    document.getElementById('result').innerText = converted;
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