/**
 * Plugin Message API Schema
 *
 * Defines the complete contract between:
 *   - popup (src/popup/app.js) → service worker (src/background/service-worker.js)
 *   - content script (enhanced-linkedin-monitor.js) → service worker
 *
 * Status legend:
 *   OK        - implemented correctly on both sides
 *   BUG:PARAM - action exists but parameter names mismatch
 *   MISSING   - popup/content sends this action, service worker has no handler
 *   INFRA     - infrastructure-level bug (not a specific action)
 */

// ─────────────────────────────────────────────
// DATA TYPES
// ─────────────────────────────────────────────

const JobSchema = {
  id: 'string (required)',
  title: 'string (required)',
  company: 'string (required)',
  location: 'string',
  url: 'string (URI)',
  postedTime: 'string (ISO date) | Date',
  savedAt: 'string (ISO date)',           // added by DataManager
  score: 'number 0–100',
  status: '"new" | "viewed" | "applied" | "rejected"',
  viewed: 'boolean',
  applied: 'boolean',
  analysis: {
    isAiPm: 'boolean',
    sponsorStatus: '"unknown" | "confirmed" | "likely" | "unlikely"',
    experienceLevel: '"unknown" | "entry" | "mid" | "senior"',
    companyType: '"unknown" | "ai_company" | "big_tech" | "other"',
    filtersPassed: 'string[]',
  },
};

const ResumeSchema = {
  id: 'string',                           // generated if absent
  content: 'string (required)',
  version: 'string | number',
  isOriginal: 'boolean',
  jobId: 'string',
  createdAt: 'string (ISO date)',         // added by DataManager
  metadata: 'object',
};

const ApplicationSchema = {
  id: 'string',                           // generated if absent
  jobId: 'string (required)',
  status: '"applied" | "interview" | "offer" | "rejected"',
  appliedAt: 'string (ISO date)',
  notes: 'string',
  resumeVersion: 'number',
};

const SettingsSchema = {
  apiKey: 'string',
  autoOptimize: 'boolean (default true)',
  sponsorFilter: 'boolean (default true)',
  experienceFilter: 'boolean (default true)',
  monitoringEnabled: 'boolean (default true)',
};

// ─────────────────────────────────────────────
// MESSAGE API CONTRACT
// ─────────────────────────────────────────────

const MessageAPI = {

  // ── Settings ────────────────────────────────
  getSettings: {
    status: 'OK',
    request:  { action: 'getSettings' },
    response: { success: true, settings: SettingsSchema },
  },

  updateSettings: {
    status: 'OK',
    request:  { action: 'updateSettings', settings: SettingsSchema },
    response: { success: 'boolean' },
  },

  // ── Jobs ────────────────────────────────────
  getJobs: {
    status: 'OK',
    request:  { action: 'getJobs', filter: 'object', sortBy: 'string', limit: 'number' },
    response: { success: true, jobs: 'Job[]', count: 'number' },
  },

  saveJob: {
    status: 'OK',
    request:  { action: 'saveJob', jobData: JobSchema },
    response: { success: true, job: JobSchema },
  },

  getJobStats: {
    status: 'OK',
    request:  { action: 'getJobStats' },
    response: { success: true, stats: 'JobStatistics object' },
  },

  updateJobStatus: {
    status: 'OK',
    request:  { action: 'updateJobStatus', jobId: 'string', status: 'string' },
    response: { success: true, job: JobSchema },
  },

  scanJobs: {
    // ⚠️ BUG: MISSING handler in service-worker.js switch statement.
    // Popup sends this action but default branch throws "未知操作: scanJobs".
    // Intended: forward scan request to content script via chrome.tabs.sendMessage.
    status: 'MISSING',
    request:  { action: 'scanJobs' },
    response: { success: true, message: 'string' },
    fix: 'Add case "scanJobs" in handleMessage(); use chrome.tabs.query to find active LinkedIn tab and send message to content script.',
  },

  // ── Resumes ─────────────────────────────────
  getResumes: {
    status: 'OK',
    request:  { action: 'getResumes', filter: 'object', limit: 'number' },
    response: { success: true, resumes: 'Resume[]', count: 'number' },
  },

  saveResume: {
    // ⚠️ BUG: PARAM MISMATCH
    // Popup sends:  { action:'saveResume', resume: text, version: name, isOriginal: false }
    // SW expects:   request.resumeData   → undefined → DataManager.saveResume(undefined) → crash
    // Fix: SW should read request.resume / request.version / request.isOriginal
    //   OR popup should wrap in { resumeData: { content: text, version: name, isOriginal } }
    status: 'BUG:PARAM',
    request: {
      action: 'saveResume',
      resumeData: ResumeSchema,   // ← correct field name for SW
      // popup currently sends: resume (string), version (string), isOriginal (bool) — top-level, not wrapped
    },
    response: { success: true, resume: ResumeSchema },
    fix: 'In service-worker.js handleSaveResume: build resumeData from request fields: { content: request.resume, version: request.version, isOriginal: request.isOriginal }',
  },

  getResume: {
    // ⚠️ BUG: MISSING handler in service-worker.js
    // Popup calls this to load a resume version by id
    status: 'MISSING',
    request:  { action: 'getResume', id: 'string' },
    response: { success: true, resume: ResumeSchema },
    fix: 'Add case "getResume" calling this.modules.dataManager.getResume(request.id)',
  },

  deleteResume: {
    // ⚠️ BUG: MISSING handler in service-worker.js
    status: 'MISSING',
    request:  { action: 'deleteResume', id: 'string' },
    response: { success: true },
    fix: 'Add case "deleteResume"; DataManager needs a deleteResume(id) method (uses store.delete).',
  },

  optimizeResume: {
    status: 'OK',
    request:  { action: 'optimizeResume', resume: 'string', jobDescription: 'string', preferences: 'object' },
    response: { success: true, optimizedResume: 'string', changes: 'array', optimizationReport: 'object' },
  },

  // ── Applications ────────────────────────────
  saveApplication: {
    // ⚠️ BUG: PARAM MISMATCH
    // Popup sends:  { action:'saveApplication', jobId, status, appliedAt, notes }  (flat)
    // SW expects:   request.applicationData  → undefined → DataManager.saveApplication(undefined) → crash
    status: 'BUG:PARAM',
    request: {
      action: 'saveApplication',
      applicationData: ApplicationSchema,  // ← SW reads request.applicationData
      // popup currently sends: jobId, status, appliedAt, notes  — top-level, not wrapped
    },
    response: { success: true, application: ApplicationSchema },
    fix: 'In service-worker.js handleSaveApplication: build applicationData from request fields, OR change popup to wrap in { applicationData: {...} }',
  },

  getApplications: {
    status: 'OK',
    request:  { action: 'getApplications', filter: 'object', limit: 'number' },
    response: { success: true, applications: 'Application[]', count: 'number' },
  },

  getApplicationStats: {
    status: 'OK',
    request:  { action: 'getApplicationStats' },
    response: { success: true, stats: 'ApplicationStatistics object' },
  },

  // ── Company ─────────────────────────────────
  saveCompany: {
    status: 'OK',
    request:  { action: 'saveCompany', companyData: 'object' },
    response: { success: true, company: 'object' },
  },

  getCompany: {
    status: 'OK',
    request:  { action: 'getCompany', companyName: 'string' },
    response: { success: true, company: 'object' },
  },

  // ── Data Management ─────────────────────────
  exportData: {
    status: 'OK',
    request:  { action: 'exportData' },
    response: { success: true, data: '{ version, exportedAt, jobs, resumes, applications, companies, settings }' },
  },

  importData: {
    status: 'OK',
    request:  { action: 'importData', data: 'ExportData object' },
    response: { success: true },
  },

  getDatabaseStats: {
    status: 'OK',
    request:  { action: 'getDatabaseStats' },
    response: { success: true, stats: 'object' },
  },

  cleanupData: {
    status: 'OK',
    request:  { action: 'cleanupData', daysToKeep: 'number' },
    response: { success: true, deletedCount: 'number' },
  },

  // ── System ──────────────────────────────────
  getSystemStatus: {
    status: 'OK',
    request:  { action: 'getSystemStatus' },
    response: { success: true, status: '{ version, initialized, settings, stats, database, uptime, timestamp }' },
  },

  resetSystem: {
    status: 'OK',
    request:  { action: 'resetSystem' },
    response: { success: true },
  },

  // ── Content Script → Background ─────────────
  newJobFound: {
    // ⚠️ BUG: MISSING handler in service-worker.js
    // Content script sends this after detecting a LinkedIn job, but SW throws "未知操作: newJobFound"
    // This means NO jobs ever get saved from LinkedIn scanning
    status: 'MISSING',
    direction: 'content_script → service_worker',
    request:  { action: 'newJobFound', jobData: JobSchema, timestamp: 'number' },
    response: { success: true },
    fix: 'Add case "newJobFound" calling this.handleSaveJob(request.jobData)',
  },
};

// ─────────────────────────────────────────────
// INFRASTRUCTURE BUGS (not action-specific)
// ─────────────────────────────────────────────

const InfrastructureBugs = {

  serviceWorkerLifecycle: {
    severity: 'CRITICAL',
    symptom: 'Could not establish connection. Receiving end does not exist.',
    cause: 'MV3 service workers are ephemeral and get killed after ~30s of inactivity. '
         + 'If the SW dies between popup opens, chrome.runtime.sendMessage finds no listener.',
    fix: 'Use chrome.storage.local instead of IndexedDB for critical settings (apiKey). '
       + 'Or use chrome.runtime.getServiceWorker() / keepAlive ping pattern. '
       + 'Most importantly: the SW must re-register its onMessage listener every startup.',
  },

  dataManagerDoubleInit: {
    severity: 'HIGH',
    symptom: 'SW may fail to respond to any message if DB init races',
    cause: 'DataManager constructor calls this.init() (line 62 in data-manager.js). '
         + 'AIPMJobAssistant.init() then calls await this.modules.dataManager.init() again. '
         + 'Two concurrent openDatabase() calls can cause onupgradeneeded to fire incorrectly.',
    fix: 'Remove the this.init() call from DataManager constructor. '
       + 'Let AIPMJobAssistant.init() be the only caller.',
  },

  localStorageInServiceWorker: {
    severity: 'MEDIUM',
    symptom: 'Periodic backup silently fails; possible unhandled error',
    cause: 'data-manager.js backupToLocalStorage() and restoreFromLocalStorage() use localStorage '
         + 'which is NOT available in MV3 service workers (ReferenceError).',
    fix: 'Replace localStorage with chrome.storage.session or chrome.storage.local.',
  },

  windowPopupAppRaceCondition: {
    severity: 'LOW',
    symptom: 'window.popupApp is undefined when script first loads',
    cause: 'popup/app.js line 915: window.popupApp = popupApp runs before DOMContentLoaded, '
         + 'so popupApp is undefined at that point.',
    fix: 'Move window.popupApp = popupApp inside DOMContentLoaded callback (after line 901 assignment).',
  },
};

// ─────────────────────────────────────────────
// SUMMARY OF ALL BUGS
// ─────────────────────────────────────────────

const BugSummary = [
  { id: 'B1', type: 'INFRA',      severity: 'CRITICAL', description: 'Service worker lifecycle — "Could not establish connection"' },
  { id: 'B2', type: 'MISSING',    severity: 'HIGH',     description: 'scanJobs action not handled in service worker' },
  { id: 'B3', type: 'MISSING',    severity: 'HIGH',     description: 'newJobFound action not handled — LinkedIn scanning never saves jobs' },
  { id: 'B4', type: 'BUG:PARAM',  severity: 'HIGH',     description: 'saveResume param mismatch: popup sends resume/version, SW reads resumeData' },
  { id: 'B5', type: 'BUG:PARAM',  severity: 'HIGH',     description: 'saveApplication param mismatch: popup sends flat fields, SW reads applicationData' },
  { id: 'B6', type: 'MISSING',    severity: 'MEDIUM',   description: 'getResume action not handled in service worker' },
  { id: 'B7', type: 'MISSING',    severity: 'MEDIUM',   description: 'deleteResume action not handled in service worker' },
  { id: 'B8', type: 'INFRA',      severity: 'HIGH',     description: 'DataManager double-init race condition' },
  { id: 'B9', type: 'INFRA',      severity: 'MEDIUM',   description: 'localStorage used in service worker context' },
];

module.exports = { MessageAPI, InfrastructureBugs, BugSummary, JobSchema, ResumeSchema, ApplicationSchema, SettingsSchema };
