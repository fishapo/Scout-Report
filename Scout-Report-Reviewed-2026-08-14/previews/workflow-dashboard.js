(function () {
  const API = "/api";
  const stageLabels = {
    draft: "Draft",
    awaiting_supervisor: "Awaiting Inter-Farm Supervisor",
    supervisor_verified: "Supervisor Verified — Ready to Share",
    awaiting_hod: "Awaiting Head of Department",
    hod_verified: "HOD Verified — Ready to Share",
    awaiting_admin: "Awaiting Administrator",
    approved: "Approved",
    returned_to_scout: "Returned to Scout",
    returned_to_supervisor: "Returned to Supervisor",
    returned_to_hod: "Returned to Head of Department",
  };

  function esc(value) {
    return String(value ?? "").replace(/[&<>"']/g, (c) => ({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  }

  async function api(url, options = {}) {
    const response = await browserAuth.fetchWithAuth(url, options);
    let body = null;
    try { body = await response.json(); } catch (_) {}
    if (!response.ok) throw new Error(body?.error || `Request failed (${response.status})`);
    return body;
  }

  function setMessage(text, error = false) {
    const el = document.getElementById("message");
    if (!el) return;
    el.textContent = text || "";
    el.className = error ? "message error" : "message success";
  }

  async function loadInbox() {
    setMessage("");
    try {
      const user = await browserAuth.init({ redirectTo: "/login" });
      if (!user) return;
      const result = await api(`${API}/workflow/inbox`);
      const rows = result.items || [];
      document.getElementById("count").textContent = rows.length;
      const body = document.getElementById("rows");
      if (!rows.length) {
        body.innerHTML = `<tr><td colspan="7" class="empty">No reports are currently waiting for you.</td></tr>`;
        return;
      }
      body.innerHTML = rows.map((r) => `
        <tr>
          <td><strong>${esc(r.reportId)}</strong></td>
          <td>${esc(r.farmName)}</td>
          <td>${esc(r.cropType)}${r.variety ? ` · ${esc(r.variety)}` : ""}</td>
          <td>${esc(r.reportDate)}</td>
          <td><span class="stage">${esc(stageLabels[r.stage] || r.stage)}</span></td>
          <td>${esc(r.ownerName || "—")}</td>
          <td><button class="btn secondary" onclick="openWorkflow('${esc(r.reportId)}')">Review</button></td>
        </tr>`).join("");
    } catch (error) {
      setMessage(error.message, true);
    }
  }

  async function openWorkflow(reportId) {
    try {
      const result = await api(`${API}/workflow/${encodeURIComponent(reportId)}`);
      const wf = result.workflow;
      document.getElementById("selectedId").textContent = wf.reportId;
      document.getElementById("selectedStage").textContent = stageLabels[wf.stage] || wf.stage;
      document.getElementById("selectedDetails").innerHTML = `
        <p><strong>Farm:</strong> ${esc(wf.farmName)}</p>
        <p><strong>Crop:</strong> ${esc(wf.cropType)} ${wf.variety ? `(${esc(wf.variety)})` : ""}</p>
        <p><strong>Report date:</strong> ${esc(wf.reportDate)}</p>
        <p><strong>Current holder:</strong> ${esc(wf.currentHolderName || "—")}</p>
        <p><strong>Report status:</strong> ${esc(wf.reportStatus)}</p>`;

      const user = browserAuth.getUser();
      const verifyable = ["awaiting_supervisor", "returned_to_supervisor", "awaiting_hod", "returned_to_hod", "awaiting_admin"].includes(wf.stage) &&
        wf.currentHolderUserId === user?.id;
      document.getElementById("verifyActions").style.display = verifyable ? "flex" : "none";
      document.getElementById("shareActions").style.display = "none";
      document.getElementById("shareRecipient").innerHTML = "";

      if (wf.stage === "supervisor_verified" && user?.role === "inter_farm_supervisor") await loadRecipients("head_of_department");
      if (wf.stage === "hod_verified" && user?.role === "head_of_department") await loadRecipients("admin");
      if (["supervisor_verified", "hod_verified"].includes(wf.stage) && wf.currentHolderUserId === user?.id) {
        document.getElementById("shareActions").style.display = "flex";
      }
      if ((wf.stage === "draft" || wf.stage === "returned_to_scout") && user?.role === "scout" && wf.ownerId === user.id) {
        await loadRecipients("inter_farm_supervisor");
        document.getElementById("shareActions").style.display = "flex";
      }

      document.getElementById("workflowModal").classList.add("open");
      document.getElementById("workflowModal").dataset.reportId = reportId;
      document.getElementById("history").innerHTML = (wf.history || []).map((e) =>
        `<li><strong>${esc(e.action)}</strong> · ${esc(stageLabels[e.toStage] || e.toStage)} · ${esc(e.actorName || e.actorRole)} · ${esc(e.createdAt)}${e.comment ? ` — ${esc(e.comment)}` : ""}</li>`
      ).join("") || "<li>No history.</li>";
    } catch (error) { setMessage(error.message, true); }
  }

  async function loadRecipients(role) {
    const result = await api(`${API}/workflow/recipients/${encodeURIComponent(role)}`);
    const select = document.getElementById("recipient");
    select.innerHTML = `<option value="">Select recipient…</option>` + (result.recipients || []).map((r) => `<option value="${esc(r.id)}">${esc(r.name)} — ${esc(r.email)}</option>`).join("");
  }

  async function verify(decision) {
    const reportId = document.getElementById("workflowModal").dataset.reportId;
    const comment = document.getElementById("comment").value;
    try {
      await api(`${API}/workflow/${encodeURIComponent(reportId)}/verify`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, comment }),
      });
      closeWorkflow();
      setMessage(decision === "approve" ? "Report verified successfully." : "Report returned to the previous stage.");
      await loadInbox();
    } catch (error) { setMessage(error.message, true); }
  }

  async function share() {
    const reportId = document.getElementById("workflowModal").dataset.reportId;
    const recipientUserId = document.getElementById("recipient").value;
    const comment = document.getElementById("comment").value;
    if (!recipientUserId) return setMessage("Select a recipient before sharing.", true);
    try {
      await api(`${API}/workflow/${encodeURIComponent(reportId)}/share`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipientUserId, comment }),
      });
      closeWorkflow();
      setMessage("Report shared to the next verification stage.");
      await loadInbox();
    } catch (error) { setMessage(error.message, true); }
  }

  function closeWorkflow() { document.getElementById("workflowModal").classList.remove("open"); }
  window.loadInbox = loadInbox;
  window.openWorkflow = openWorkflow;
  window.closeWorkflow = closeWorkflow;
  window.verifyWorkflow = verify;
  window.shareWorkflow = share;
  window.addEventListener("DOMContentLoaded", loadInbox);
})();
