/**
 * Optimized Dev Tools Utility
 * Modern JavaScript with improved performance and organization
 */

class DevToolsApp {
    constructor() {
        this.activeSection = 'timezone-converter';
        this.clockUpdateInterval = null;
        this.debounceTimers = new Map();
        this.paymentBreakdownChart = null;
        this.yearlyBreakdownChart = null;
        this.timeZones = [
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
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupClocks();
        this.setupEMICalculator();
        this.showSection('timezone-converter');
    }

    setupEventListeners() {
        // Timezone converter
        document.getElementById('time-input')?.addEventListener('input', 
            this.debounce(() => this.convertTime(), 300));
        document.getElementById('source-timezone')?.addEventListener('change', 
            () => this.convertTime());
        document.getElementById('target-timezone')?.addEventListener('change', 
            () => this.convertTime());

        // JSON formatter
        document.getElementById('json-input')?.addEventListener('input', 
            this.debounce(() => this.formatJSON(), 500));
        
        // XML formatter
        document.getElementById('xml-input')?.addEventListener('input', 
            this.debounce(() => this.formatXML(), 500));

        // EMI calculator inputs
        const emiInputs = document.querySelectorAll('.emi-input');
        emiInputs.forEach(input => {
            if (input.id === 'principal') {
                input.addEventListener('input', () => this.handlePrincipalInput());
                input.addEventListener('focus', () => this.handlePrincipalFocus());
                input.addEventListener('blur', () => this.handlePrincipalBlur());
            } else {
                input.addEventListener('input', this.debounce(() => this.calculateEMI(), 300));
            }
        });

        // Copy functionality
        this.setupCopyButtons();
    }

    setupCopyButtons() {
        const copyButtons = document.querySelectorAll('button[onclick*="copy"]');
        copyButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetId = button.getAttribute('onclick').match(/copy(\w+)/)?.[1];
                if (targetId) {
                    this.copyToClipboard(targetId);
                }
            });
        });
    }

    debounce(func, wait) {
        return (...args) => {
            const key = func.toString();
            clearTimeout(this.debounceTimers.get(key));
            this.debounceTimers.set(key, setTimeout(() => func.apply(this, args), wait));
        };
    }

    showSection(sectionId) {
        const sections = ['timezone-converter', 'json-formatter', 'xml-formatter', 'emi-calculator'];
        
        sections.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.classList.toggle('hidden', id !== sectionId);
            }
        });

        this.activeSection = sectionId;
        
        // Start/stop clock updates based on active section
        if (sectionId === 'timezone-converter') {
            this.startClockUpdates();
        } else {
            this.stopClockUpdates();
        }

        // Initialize charts when EMI calculator is shown
        if (sectionId === 'emi-calculator') {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                if (!this.paymentBreakdownChart || !this.yearlyBreakdownChart) {
                    this.initializeCharts();
                }
            }, 100);
        }
    }

    // Timezone Converter Methods
    convertTime() {
        const timeInput = document.getElementById("time-input")?.value;
        const sourceZone = document.getElementById("source-timezone")?.value;
        const targetZone = document.getElementById("target-timezone")?.value;
        const resultElement = document.getElementById("target-timezone-result");
        const otherResultElement = document.getElementById("other-timezone-result");

        if (!timeInput || !sourceZone || !targetZone) {
            if (resultElement) resultElement.textContent = "Please select time and time zones.";
            return;
        }

        try {
            const [hour, minute] = timeInput.split(":").map(Number);
            const nowUtc = luxon.DateTime.utc();
            const sourceTime = luxon.DateTime.fromObject({
                year: nowUtc.year,
                month: nowUtc.month,
                day: nowUtc.day,
                hour: hour,
                minute: minute
            }, { zone: sourceZone });

            const targetTime = sourceTime.setZone(targetZone);
            const targetLabel = document.getElementById("target-timezone")
                ?.options[document.getElementById("target-timezone").selectedIndex]?.text;

            const formattedMain = targetTime.toFormat("hh:mm a (cccc, dd LLL yyyy)");

            if (resultElement) {
                resultElement.innerHTML = `<strong>✅ ${targetLabel}:</strong> ${formattedMain}`;
            }

            this.showOtherTimezones(sourceTime, otherResultElement);
        } catch (error) {
            if (resultElement) resultElement.textContent = "Error converting time. Please check your input.";
            console.error('Time conversion error:', error);
        }
    }

    showOtherTimezones(sourceTime, container) {
        if (!container) return;

        const zonesToShow = [
            { label: "UTC - Universal Time", zone: "UTC" },
            { label: "IST - India Time", zone: "Asia/Kolkata" },
            { label: "EST/ET - USA Time", zone: "America/New_York" },
            { label: "PT - USA Time", zone: "America/Los_Angeles" },
            { label: "CET - UK Time", zone: "Europe/London" },
            { label: "PST - Canada Time", zone: "America/Toronto" }
        ];

        const otherTimezones = zonesToShow.map(({ label, zone }) => {
            const converted = sourceTime.setZone(zone).toFormat("hh:mm a (cccc, dd LLL yyyy)");
            return `<div class="timezone-result"><strong>${label}:</strong> ${converted}</div>`;
        }).join('');

        container.innerHTML = `<div class="other-timezones">
            <h3>🕒 Other Time Zones:</h3>
            ${otherTimezones}
        </div>`;
    }

    // Clock Methods
    setupClocks() {
        const container = document.getElementById('clockContainer');
        if (!container) return;

        container.innerHTML = this.timeZones.map(({ city, zone, countryCode }, index) => {
            const flagUrl = this.getFlagUrl(countryCode);
            const currentTime = luxon.DateTime.now().setZone(zone);
            const offset = currentTime.offset / 60;
            const formattedOffset = offset >= 0 ? `UTC+${offset}` : `UTC${offset}`;
            const formattedTime = currentTime.toFormat('hh:mm:ss a');

            return `
                <div class="clock">
                    <img class="flag" src="${flagUrl}" alt="${countryCode} flag" loading="lazy">
                    <div class="clock-info">
                        <div class="city">${city} (${formattedOffset})</div>
                        <div class="time" id="time-${index}">${formattedTime}</div>
                    </div>
                </div>
            `;
        }).join('');

        this.startClockUpdates();
    }

    getFlagUrl(code) {
        return code === "un"
            ? "https://upload.wikimedia.org/wikipedia/commons/c/c4/Globe_icon.svg"
            : `https://flagcdn.com/w80/${code}.png`;
    }

    startClockUpdates() {
        if (this.clockUpdateInterval) return;
        
        this.clockUpdateInterval = setInterval(() => {
            if (this.activeSection === 'timezone-converter') {
                this.updateClocks();
            }
        }, 1000);
    }

    stopClockUpdates() {
        if (this.clockUpdateInterval) {
            clearInterval(this.clockUpdateInterval);
            this.clockUpdateInterval = null;
        }
    }

    updateClocks() {
        this.timeZones.forEach(({ zone }, index) => {
            const element = document.getElementById(`time-${index}`);
            if (element) {
                const now = luxon.DateTime.now().setZone(zone);
                element.textContent = now.toFormat('hh:mm:ss a');
            }
        });
    }

    // JSON Formatter Methods
    formatJSON() {
        const input = document.getElementById('json-input');
        const output = document.getElementById('formatted-json-response');
        const message = document.getElementById('formatted-json-message');

        if (!input || !output || !message) return;

        let jsonInput = input.value.trim();
        if (!jsonInput) {
            this.updateJSONMessage(message, 'Ready to format JSON...', 'info');
            output.value = '';
            return;
        }

        // Apply conditional replacements
        const replacements = [
            { checkbox: 'cb-newline', pattern: /\\n/g, replacement: '' },
            { checkbox: 'cb-carriage', pattern: /\\r/g, replacement: '' },
            { checkbox: 'cb-quote', pattern: /\\"/g, replacement: '"' },
            { checkbox: 'cb-open-close-brace', pattern: /"\{/g, replacement: '{' },
            { checkbox: 'cb-open-close-brace', pattern: /\}"/g, replacement: '}' }
        ];

        replacements.forEach(({ checkbox, pattern, replacement }) => {
            if (document.getElementById(checkbox)?.checked) {
                jsonInput = jsonInput.replace(pattern, replacement);
            }
        });

        try {
            const parsed = JSON.parse(jsonInput);
            const formatted = JSON.stringify(parsed, null, 2);
            output.value = formatted;
            this.updateJSONMessage(message, 'Valid JSON ✅', 'success');
        } catch (error) {
            this.updateJSONMessage(message, `Invalid JSON ❌: ${error.message}`, 'error');
            output.value = '';
        }
    }

    updateJSONMessage(element, text, type) {
        element.textContent = text;
        element.className = `inline-jsonformat-message ${type}`;
    }

    // XML Formatter Methods
    formatXML() {
        const input = document.getElementById('xml-input');
        const output = document.getElementById('formatted-xml');

        if (!input || !output) return;

        const xmlInput = input.value.trim();
        if (!xmlInput) {
            output.value = '';
            return;
        }

        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlInput, "application/xml");
            const parseError = xmlDoc.getElementsByTagName("parsererror");

            if (parseError.length > 0) {
                output.value = `Invalid XML:\n${parseError[0].textContent}`;
                return;
            }

            const formatted = this.formatXmlString(new XMLSerializer().serializeToString(xmlDoc));
            output.value = formatted;
        } catch (error) {
            output.value = `Error formatting XML: ${error.message}`;
        }
    }

    formatXmlString(xml) {
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

    // EMI Calculator Methods
    setupEMICalculator() {
        const today = luxon.DateTime.now();
        const disbursalDate = document.getElementById("disbursal-date");
        const emiDay = document.getElementById("emi-day");

        if (disbursalDate) disbursalDate.value = today.toISODate();
        if (emiDay) emiDay.value = today.day;
    }

    handlePrincipalInput() {
        const principalInput = document.getElementById("principal");
        if (!principalInput) return;

        const value = principalInput.value.replace(/,/g, '');
        principalInput.value = this.formatToIndianNumberingSystem(value);
        this.debounce(() => this.calculateEMI(), 300)();
    }

    handlePrincipalFocus() {
        const principalInput = document.getElementById("principal");
        if (principalInput) {
            principalInput.value = principalInput.value.replace(/,/g, '');
        }
    }

    handlePrincipalBlur() {
        const principalInput = document.getElementById("principal");
        if (principalInput) {
            const value = principalInput.value.replace(/,/g, '');
            principalInput.value = this.formatToIndianNumberingSystem(value);
        }
    }

    formatToIndianNumberingSystem(value) {
        value = value.replace(/[^0-9]/g, '');
        if (value.length <= 3) return value;

        const lastThree = value.slice(-3);
        const rest = value.slice(0, -3);
        const formattedRest = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ",");

        return formattedRest + "," + lastThree;
    }

    formatIndianNumber(num) {
        const [integerPart, decimalPart] = num.toString().split(".");
        const lastThree = integerPart.slice(-3);
        const otherNumbers = integerPart.slice(0, -3);
        const formattedInteger = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + 
            (otherNumbers ? "," : "") + lastThree;
        return decimalPart ? `${formattedInteger}.${decimalPart}` : formattedInteger;
    }

    calculateEMI() {
        const principal = parseFloat(document.getElementById("principal")?.value.replace(/,/g, '') || 0);
        const annualRate = parseFloat(document.getElementById("interest")?.value || 0);
        const months = parseInt(document.getElementById("tenure-months")?.value || 0);
        const disbursalDateStr = document.getElementById("disbursal-date")?.value;
        const emiDay = parseInt(document.getElementById("emi-day")?.value || 0);

        if (!principal || !annualRate || !months || !disbursalDateStr || !emiDay) {
            this.clearEMIResults();
            return;
        }

        try {
            const monthlyRate = annualRate / 12 / 100;
            const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
                       (Math.pow(1 + monthlyRate, months) - 1);

            const totalPayment = emi * months;
            const totalInterest = totalPayment - principal;

            // Update results
            document.getElementById("emi").textContent = this.formatIndianNumber(emi.toFixed(2));
            document.getElementById("total-interest").textContent = this.formatIndianNumber(totalInterest.toFixed(2));
            document.getElementById("principal-result").textContent = this.formatIndianNumber(principal.toFixed(2));
            document.getElementById("total-payment").textContent = this.formatIndianNumber(totalPayment.toFixed(2));

            const disbursalDate = luxon.DateTime.fromISO(disbursalDateStr);
            this.generateEmiSchedule(principal, monthlyRate, emi, months, disbursalDate, emiDay);
            this.updateCharts(principal, monthlyRate, emi, months, disbursalDate, emiDay);
        } catch (error) {
            console.error('EMI calculation error:', error);
            this.clearEMIResults();
        }
    }

    clearEMIResults() {
        const resultIds = ["emi", "total-interest", "principal-result", "total-payment"];
        resultIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.textContent = "0";
        });

        const tbody = document.querySelector("#emi-schedule tbody");
        if (tbody) tbody.innerHTML = "";

        // Reset payment breakdown chart title
        const chartTitleElement = document.querySelector('#paymentBreakdownChart')?.closest('.emi-result')?.querySelector('h3');
        if (chartTitleElement) {
            chartTitleElement.textContent = 'Payment Breakdown';
        }

        // Clear charts
        if (this.paymentBreakdownChart) {
            this.paymentBreakdownChart.data.datasets[0].data = [0, 0];
            this.paymentBreakdownChart.update();
        }
        if (this.yearlyBreakdownChart) {
            this.yearlyBreakdownChart.data.labels = [];
            this.yearlyBreakdownChart.data.datasets[0].data = [];
            this.yearlyBreakdownChart.data.datasets[1].data = [];
            this.yearlyBreakdownChart.update();
        }
    }

    generateEmiSchedule(principal, monthlyRate, emi, totalMonths, disbursalDate, emiDay) {
        const tbody = document.querySelector("#emi-schedule tbody");
        const exportTbody = document.querySelector("#emi-schedule-export tbody");
        
        if (!tbody || !exportTbody) return;

        tbody.innerHTML = "";
        exportTbody.innerHTML = "";

        let balance = principal;
        let currentDate = disbursalDate.day <= emiDay
            ? disbursalDate.set({ day: emiDay })
            : disbursalDate.plus({ months: 1 }).set({ day: emiDay });

        for (let i = 0; i < totalMonths; i++) {
            const interestPayment = balance * monthlyRate;
            const principalPayment = emi - interestPayment;
            balance = Math.max(0, balance - principalPayment);

            const dateStr = currentDate.toFormat("dd LLL yyyy");
            const emiStr = this.formatIndianNumber(emi.toFixed(2));
            const interestStr = this.formatIndianNumber(interestPayment.toFixed(2));
            const principalStr = this.formatIndianNumber(principalPayment.toFixed(2));
            const balanceStr = this.formatIndianNumber(balance.toFixed(2));

            // Display table
            const displayRow = document.createElement("tr");
            displayRow.innerHTML = `
                <td>${dateStr}</td>
                <td>₹${emiStr}</td>
                <td>₹${interestStr}</td>
                <td>₹${principalStr}</td>
                <td>₹${balanceStr}</td>
            `;
            tbody.appendChild(displayRow);

            // Export table
            const exportRow = document.createElement("tr");
            exportRow.innerHTML = `
                <td>${dateStr}</td>
                <td>${emi.toFixed(2)}</td>
                <td>${interestPayment.toFixed(2)}</td>
                <td>${principalPayment.toFixed(2)}</td>
                <td>${balance.toFixed(2)}</td>
            `;
            exportTbody.appendChild(exportRow);

            currentDate = currentDate.plus({ months: 1 }).set({ day: emiDay });
        }
    }

    // Chart Methods
    initializeCharts() {
        this.initializePaymentBreakdownChart();
        this.initializeYearlyBreakdownChart();
    }

    initializePaymentBreakdownChart() {
        const ctx = document.getElementById('paymentBreakdownChart');
        if (!ctx) return;

        this.paymentBreakdownChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: ['Principal Amount', 'Total Interest'],
                datasets: [{
                    data: [0, 0],
                    backgroundColor: [
                        '#007BFF',
                        '#FF6B6B'
                    ],
                    borderColor: [
                        '#0056b3',
                        '#ff5252'
                    ],
                    borderWidth: 2,
                    hoverBackgroundColor: [
                        '#0056b3',
                        '#ff5252'
                    ],
                    hoverBorderColor: [
                        '#ffffff',
                        '#ffffff'
                    ],
                    hoverBorderWidth: 4,
                    hoverOffset: 10
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#007BFF',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            label: function(context) {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                return `${label}: ₹${value.toLocaleString('en-IN')} (${percentage}%)`;
                            },
                            afterLabel: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                return `Total Amount: ₹${total.toLocaleString('en-IN')}`;
                            }
                        }
                    }
                },
                elements: {
                    arc: {
                        borderWidth: 2
                    }
                },
                animation: {
                    animateScale: true,
                    animateRotate: true,
                    duration: 1000
                }
            }
        });
    }

    initializeYearlyBreakdownChart() {
        const ctx = document.getElementById('yearlyBreakdownChart');
        if (!ctx) return;

        this.yearlyBreakdownChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Principal Payment',
                    data: [],
                    borderColor: '#007BFF',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#007BFF',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#0056b3',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 3
                }, {
                    label: 'Interest Payment',
                    data: [],
                    borderColor: '#FF6B6B',
                    backgroundColor: 'rgba(255, 107, 107, 0.1)',
                    fill: true,
                    tension: 0.4,
                    pointRadius: 6,
                    pointHoverRadius: 8,
                    pointBackgroundColor: '#FF6B6B',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointHoverBackgroundColor: '#ff5252',
                    pointHoverBorderColor: '#ffffff',
                    pointHoverBorderWidth: 3
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false,
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true,
                            font: {
                                size: 12
                            }
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        borderColor: '#007BFF',
                        borderWidth: 1,
                        cornerRadius: 8,
                        displayColors: true,
                        callbacks: {
                            title: function(context) {
                                return `Year: ${context[0].label}`;
                            },
                            label: function(context) {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y || 0;
                                return `${label}: ₹${value.toLocaleString('en-IN')}`;
                            },
                            afterBody: function(context) {
                                const total = context.reduce((sum, item) => sum + item.parsed.y, 0);
                                return `Total for ${context[0].label}: ₹${total.toLocaleString('en-IN')}`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Year',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: 'Amount (₹)',
                            font: {
                                size: 14,
                                weight: 'bold'
                            }
                        },
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '₹' + value.toLocaleString('en-IN');
                            }
                        }
                    }
                },
                elements: {
                    line: {
                        borderWidth: 3
                    }
                }
            }
        });
    }

    updateCharts(principal, monthlyRate, emi, totalMonths, disbursalDate, emiDay) {
        const totalPayment = emi * totalMonths;
        const totalInterest = totalPayment - principal;

        // Update payment breakdown chart title
        const chartTitleElement = document.querySelector('#paymentBreakdownChart').closest('.emi-result').querySelector('h3');
        if (chartTitleElement) {
            const formattedTotal = this.formatIndianNumber(totalPayment.toFixed(0));
            chartTitleElement.textContent = `Total Payment ₹${formattedTotal}`;
        }

        // Update payment breakdown chart
        if (this.paymentBreakdownChart) {
            this.paymentBreakdownChart.data.datasets[0].data = [principal, totalInterest];
            this.paymentBreakdownChart.update();
        }

        // Generate yearly data for the line chart
        const yearlyData = this.generateYearlyData(principal, monthlyRate, emi, totalMonths, disbursalDate, emiDay);
        
        // Update yearly breakdown chart
        if (this.yearlyBreakdownChart) {
            this.yearlyBreakdownChart.data.labels = yearlyData.labels;
            this.yearlyBreakdownChart.data.datasets[0].data = yearlyData.principalData;
            this.yearlyBreakdownChart.data.datasets[1].data = yearlyData.interestData;
            this.yearlyBreakdownChart.update();
        }
    }

    generateYearlyData(principal, monthlyRate, emi, totalMonths, disbursalDate, emiDay) {
        const yearlyData = {};
        let balance = principal;
        let currentDate = disbursalDate.day <= emiDay
            ? disbursalDate.set({ day: emiDay })
            : disbursalDate.plus({ months: 1 }).set({ day: emiDay });

        for (let i = 0; i < totalMonths; i++) {
            const year = currentDate.year;
            const interestPayment = balance * monthlyRate;
            const principalPayment = emi - interestPayment;
            balance = Math.max(0, balance - principalPayment);

            if (!yearlyData[year]) {
                yearlyData[year] = {
                    totalInterest: 0,
                    totalPrincipal: 0
                };
            }

            yearlyData[year].totalInterest += interestPayment;
            yearlyData[year].totalPrincipal += principalPayment;

            currentDate = currentDate.plus({ months: 1 }).set({ day: emiDay });
        }

        const labels = Object.keys(yearlyData).sort();
        const principalData = labels.map(year => Math.round(yearlyData[year].totalPrincipal));
        const interestData = labels.map(year => Math.round(yearlyData[year].totalInterest));

        return {
            labels,
            principalData,
            interestData
        };
    }

    // Export Methods
    exportEmiScheduleToCSV() {
        const table = document.getElementById("emi-schedule-export");
        if (!table) return;

        // Get current loan details for filename
        const principal = document.getElementById("principal")?.value.replace(/,/g, '') || '0';
        const interest = document.getElementById("interest")?.value || '0';
        const tenure = document.getElementById("tenure-months")?.value || '0';
        const emiDay = document.getElementById("emi-day")?.value || '0';

        const rows = Array.from(table.querySelectorAll("tr"));
        const csvContent = rows
            .map(row => Array.from(row.children)
                .map(cell => `"${cell.textContent.trim()}"`)
                .join(","))
            .join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `EMI-Schedule-${principal}-${interest}-${tenure}-${emiDay}.csv`;
        link.click();
        URL.revokeObjectURL(link.href);
    }

    destroyCharts() {
        if (this.paymentBreakdownChart) {
            this.paymentBreakdownChart.destroy();
            this.paymentBreakdownChart = null;
        }
        if (this.yearlyBreakdownChart) {
            this.yearlyBreakdownChart.destroy();
            this.yearlyBreakdownChart = null;
        }
    }
}

// Global functions for backward compatibility
let devToolsApp;

function showSection(sectionId) {
    devToolsApp?.showSection(sectionId);
}

function convertTime() {
    devToolsApp?.convertTime();
}

function formatJSON() {
    devToolsApp?.formatJSON();
}

function formatXML() {
    devToolsApp?.formatXML();
}

function calculateEMI() {
    devToolsApp?.calculateEMI();
}

function exportEmiScheduleToCSV() {
    devToolsApp?.exportEmiScheduleToCSV();
}

function copyFormattedJSON() {
    devToolsApp?.copyToClipboard('FormattedJSON');
}

function copyFormattedXML() {
    devToolsApp?.copyToClipboard('FormattedXML');
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    devToolsApp = new DevToolsApp();
    
    // Add CSS animation for toast
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
    `;
    document.head.appendChild(style);

    // Cleanup on page unload
    window.addEventListener('beforeunload', () => {
        if (devToolsApp) {
            devToolsApp.stopClockUpdates();
            devToolsApp.destroyCharts();
        }
    });
});
