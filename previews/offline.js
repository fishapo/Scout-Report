(function (window) {
  "use strict";
  const DB_NAME = "scout-report-offline";
  const STORE = "pending-reports";

  function openDb() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => request.result.createObjectStore(STORE, { keyPath: "offlineId" });
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function withStore(mode, action) {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const request = action(tx.objectStore(STORE));
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      tx.oncomplete = () => db.close();
    });
  }

  const listPending = () => withStore("readonly", store => store.getAll());
  const savePending = record => withStore("readwrite", store => store.put(record));
  const removePending = id => withStore("readwrite", store => store.delete(id));

  function statusElement() { return document.getElementById("offline-status"); }
  async function updateStatus(message) {
    const pending = await listPending().catch(() => []);
    const element = statusElement();
    if (element) {
      element.hidden = false;
      element.textContent = message || (navigator.onLine
        ? `${pending.length} offline report${pending.length === 1 ? "" : "s"} waiting to sync.`
        : `Offline mode: ${pending.length} report${pending.length === 1 ? "" : "s"} saved on this device.`);
    }
  }

  async function queueCurrentReport() {
    const user = window.browserAuth?.getUser?.();
    if (!user?.id) throw new Error('Sign in online once before saving an offline report.');
    const report = window.payload();
    if (!report.farmId) throw new Error("Farm is required.");
    if (!report.cropType || !report.variety || !report.reportDate) throw new Error("Crop, variety and report date are required.");
    const offlineId = `offline-${Date.now()}-${Math.random().toString(16).slice(2)}`;
    await savePending({
      offlineId,
      ownerUserId: user.id,
      createdAt: new Date().toISOString(),
      report: { ...report, clientSubmissionId: offlineId },
      extensions: window.collectCanonicalExtensions?.(report, offlineId) || [],
      media: window.collectPendingMedia?.() || [],
    });
    window.clearPendingMedia?.();
    await updateStatus(`Report saved safely on this device. It will submit automatically when online.`);
    const saveStatus = document.getElementById("save-status");
    if (saveStatus) saveStatus.textContent = "Offline report saved locally. Keep this browser profile until synchronization completes.";
  }

  async function syncPending() {
    if (!navigator.onLine || !window.browserAuth) return;
    const user = window.browserAuth.getUser?.();
    if (!user?.id) return updateStatus('Sign in to synchronize reports saved by this account.');
    const allPending = await listPending();
    const pending = allPending.filter(item => item.ownerUserId === user.id);
    const blockedCount = allPending.length - pending.length;
    if (!pending.length && blockedCount) {
      return updateStatus(`${blockedCount} offline report${blockedCount === 1 ? '' : 's'} belongs to another or legacy account and was not submitted.`);
    }
    if (!pending.length) return updateStatus("Online. All offline reports are synchronized.");
    await updateStatus(`Synchronizing ${pending.length} offline report${pending.length === 1 ? "" : "s"}...`);
    let completed = 0;
    for (const item of pending) {
      try {
        const response = await window.browserAuth.fetchWithAuth("/api/reports", {
          method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(item.report),
        });
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(body.error || `Submission failed (${response.status})`);
        }
        if (!body.id) throw new Error('The server did not return the synchronized report ID.');
        for (const extension of item.extensions || []) {
          const extensionResponse = await window.browserAuth.fetchWithAuth(
            `/api/canonical-observations/${body.id}/${extension.domain}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(extension.body),
            }
          );
          if (!extensionResponse.ok) {
            const extensionBody = await extensionResponse.json().catch(() => ({}));
            throw new Error(extensionBody.error || `Canonical ${extension.domain} synchronization failed (${extensionResponse.status})`);
          }
        }
        if ((item.media || []).length) {
          if (typeof window.uploadMediaItems !== "function") throw new Error("Media synchronization is not available.");
          await window.uploadMediaItems(body.id, item.media);
        }
        await removePending(item.offlineId);
        completed += 1;
      } catch (error) {
        await updateStatus(`Synchronization paused: ${error.message}. The report remains saved locally.`);
        return;
      }
    }
    await updateStatus(`${completed} offline report${completed === 1 ? "" : "s"} synchronized successfully.`);
  }

  function installOfflineSubmit() {
    if (typeof window.submitReport !== "function" || typeof window.payload !== "function") return;
    const submitOnline = window.submitReport;
    window.submitReport = async function () {
      if (navigator.onLine) return submitOnline();
      const button = document.getElementById("submit-btn");
      if (button) button.disabled = true;
      try { await queueCurrentReport(); }
      catch (error) { alert(error.message); }
      finally { if (button) button.disabled = false; }
    };
  }

  window.addEventListener("online", syncPending);
  window.addEventListener("offline", () => updateStatus());
  window.addEventListener("DOMContentLoaded", async () => {
    installOfflineSubmit();
    await updateStatus();
    if (navigator.onLine) syncPending();
    if ("serviceWorker" in navigator) navigator.serviceWorker.register("/service-worker.js").catch(() => {});
  });
  window.scoutOffline = { listPending, syncPending };
})(window);
