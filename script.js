
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
