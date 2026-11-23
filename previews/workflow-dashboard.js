(function () {
  const API = "/api";
  let reviewRequest = 0;
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

  async function loadInbox(message = "") {
    setMessage(message);
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
          <td><button class="btn secondary" data-report-id="${esc(r.reportId)}">Review</button></td>
        </tr>`).join("");
      body.querySelectorAll("[data-report-id]").forEach((button) => {
        button.addEventListener("click", () => openWorkflow(button.dataset.reportId));
      });
    } catch (error) {
      setMessage(error.message, true);
    }
  }

  async function openWorkflow(reportId) {
    const request = ++reviewRequest;
    const modal = document.getElementById("workflowModal");
    const verifyActions = document.getElementById("verifyActions");
    const checklistFieldset = document.getElementById("verificationChecklist");
    const reviewMessage = document.getElementById("reviewMessage");
    try {
      const result = await api(`${API}/workflow/${encodeURIComponent(reportId)}`);
      if (request !== reviewRequest) return;
      const wf = result.workflow;
      document.getElementById("comment").value = "";
      if (reviewMessage) reviewMessage.textContent = "";
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
        (wf.currentHolderUserId === user?.id || (wf.stage === "awaiting_admin" && user?.role === "admin"));
      document.getElementById("verifyActions").style.display = verifyable ? "flex" : "none";
      document.getElementById("shareActions").style.display = "none";
      const recipient = document.getElementById("recipient");
      if (recipient) recipient.innerHTML = "";
      if (checklistFieldset) checklistFieldset.hidden = true;
      if (verifyable && checklistFieldset) {
        const encodedId = encodeURIComponent(reportId);
        const [{ report }, { checklist }] = await Promise.all([
          api(`${API}/canonical-observations/${encodedId}/full`),
          api(`${API}/workflow/${encodedId}/checklist`),
        ]);
        if (request !== reviewRequest) return;
        renderReview(report, checklist, checklistFieldset, verifyActions);
      }

      if (wf.stage === "supervisor_verified" && user?.role === "inter_farm_supervisor") await loadRecipients("head_of_department");
      if (wf.stage === "hod_verified" && user?.role === "head_of_department") await loadRecipients("admin");
      if (["supervisor_verified", "hod_verified"].includes(wf.stage) && wf.currentHolderUserId === user?.id) {
        document.getElementById("shareActions").style.display = "flex";
      }
      if ((wf.stage === "draft" || wf.stage === "returned_to_scout") && user?.role === "scout" && wf.ownerId === user.id) {
        await loadRecipients("inter_farm_supervisor");
        document.getElementById("shareActions").style.display = "flex";
      }

      if (request !== reviewRequest) return;
      modal.classList.add("open");
      modal.dataset.reportId = reportId;
      document.getElementById("history").innerHTML = (wf.history || []).map((e) =>
        `<li><strong>${esc(e.action)}</strong> · ${esc(stageLabels[e.toStage] || e.toStage)} · ${esc(e.actorName || e.actorRole)} · ${esc(e.createdAt)}${e.comment ? ` — ${esc(e.comment)}` : ""}</li>`
      ).join("") || "<li>No history.</li>";
    } catch (error) { setMessage(error.message, true); }
  }

  function renderReview(report, checklist, fieldset, actions) {
    const details = document.createElement("details");
    details.open = true;
    const summary = document.createElement("summary");
    summary.textContent = "Report details and observations";
    details.append(summary);
    const reportFields = Object.fromEntries(Object.entries(report).filter(([key]) =>
      !["workflow", "workflowHistory", "current_holder_user_id", "owner_id", "stage"].includes(key)
    ));
    details.append(renderFields(reportFields));
    document.getElementById("selectedDetails").append(details);

    const legend = document.createElement("legend");
    legend.textContent = "Verification checklist";
    fieldset.replaceChildren(legend);
    for (const item of checklist.items) {
      const label = document.createElement("label");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.value = item.itemKey;
      checkbox.checked = item.completed;
      checkbox.dataset.required = String(item.required);
      label.append(checkbox, " " + item.label);
      fieldset.append(label);
    }
    const approve = actions.querySelector("button");
    const updateApproval = () => {
      approve.disabled = Array.from(fieldset.querySelectorAll('input[data-required="true"]')).some((input) => !input.checked);
    };
    fieldset.onchange = updateApproval;
    updateApproval();
    fieldset.hidden = false;
  }

  function renderFields(value) {
    const list = document.createElement("ul");
    for (const [key, field] of Object.entries(value)) {
      if (field == null || field === "" || (typeof field === "object" && !Object.keys(field).length)) continue;
      const item = document.createElement("li");
      const label = key.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/_/g, " ");
      if (!Array.isArray(value)) item.append(label + ": ");
      item.append(typeof field === "object" ? renderFields(field) : String(field));
      list.append(item);
    }
    return list;
  }

  async function loadRecipients(role) {
    const result = await api(`${API}/workflow/recipients/${encodeURIComponent(role)}`);
    const select = document.getElementById("recipient");
    select.innerHTML = `<option value="">Select recipient…</option>` + (result.recipients || []).map((r) => `<option value="${esc(r.id)}">${esc(r.name)} — ${esc(r.email)}</option>`).join("");
  }

  async function verify(decision) {
    const reportId = document.getElementById("workflowModal").dataset.reportId;
    const comment = document.getElementById("comment").value;
    const fieldset = document.getElementById("verificationChecklist");
    const reviewMessage = document.getElementById("reviewMessage");
    const actions = document.getElementById("verifyActions");
    if (actions.dataset.submitting === "true") return;
    const items = decision === "approve" && fieldset
      ? Array.from(fieldset.querySelectorAll("input"), (input) => ({ itemKey: input.value, completed: input.checked }))
      : undefined;
    actions.dataset.submitting = "true";
    if (reviewMessage) reviewMessage.textContent = "";
    try {
      const { workflow } = await api(`${API}/workflow/${encodeURIComponent(reportId)}/verify`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ decision, comment, items }),
      });
      closeWorkflow();
      if (workflow.stage === "hod_verified") {
        await loadInbox("Report verified. Choose an administrator for final approval.");
        await openWorkflow(reportId);
      } else {
        const message = workflow.stage === "approved" ? "Report approved and sent to analytics."
          : decision === "approve" ? "Report verified successfully." : "Report returned for correction.";
        await loadInbox(message);
      }
    } catch (error) {
      if (reviewMessage) reviewMessage.textContent = error.message;
      else setMessage(error.message, true);
    } finally {
      delete actions.dataset.submitting;
    }
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
      await loadInbox("Report shared to the next verification stage.");
    } catch (error) {
      const reviewMessage = document.getElementById("reviewMessage");
      if (reviewMessage) reviewMessage.textContent = error.message;
      else setMessage(error.message, true);
    }
  }

  function closeWorkflow() {
    reviewRequest++;
    document.getElementById("workflowModal").classList.remove("open");
  }
  window.loadInbox = loadInbox;
  window.openWorkflow = openWorkflow;
  window.closeWorkflow = closeWorkflow;
  window.verifyWorkflow = verify;
  window.shareWorkflow = share;
  window.addEventListener("DOMContentLoaded", () => loadInbox());
})();
