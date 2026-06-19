const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');
const REPORTS_FILE = path.join(DATA_DIR, 'reports.json');
const REFERENCE_FILE = path.join(DATA_DIR, 'reference.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function writeReports(reports) {
  fs.writeFileSync(REPORTS_FILE, JSON.stringify(reports, null, 2));
}

function getReference() {
  return readJson(REFERENCE_FILE);
}

function getReports() {
  return readJson(REPORTS_FILE);
}

function saveReport(report) {
  const reports = getReports();
  reports.unshift(report);
  writeReports(reports);
  return report;
}

function findReport(id) {
  return getReports().find((report) => report.id === id);
}

function updateReport(id, updater) {
  const reports = getReports();
  const index = reports.findIndex((report) => report.id === id);
  if (index === -1) return null;

  reports[index] = updater(reports[index]);
  writeReports(reports);
  return reports[index];
}

function deleteReport(id) {
  const reports = getReports();
  const index = reports.findIndex((report) => report.id === id);
  if (index === -1) return false;

  reports.splice(index, 1);
  writeReports(reports);
  return true;
}

function nextReportId() {
  const reports = getReports();
  const maxNum = reports.reduce((max, report) => {
    const num = parseInt(report.id.replace('SR-', ''), 10);
    return Number.isNaN(num) ? max : Math.max(max, num);
  }, 0);
  return `SR-${String(maxNum + 1).padStart(6, '0')}`;
}

function deriveStatus(report) {
  const severities = [
    ...report.pestObservations.map((o) => o.severity),
    ...report.diseaseObservations.map((o) => o.severity),
  ];

  if (severities.includes('Critical')) return 'Critical';
  if (severities.includes('High')) return 'Pending';
  if (severities.length === 0) return 'Completed';
  return 'Pending';
}

module.exports = {
  getReference,
  getReports,
  saveReport,
  findReport,
  updateReport,
  deleteReport,
  nextReportId,
  deriveStatus,
};
