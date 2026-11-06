"use strict";
(() => {
  const { run, CheckerError } = FollowbackLib;
  const $ = (id) => document.getElementById(id);
  const form = $("form"), input = $("username"), goBtn = $("go"), stopBtn = $("stop");
  const status = $("status");
  let result = null, view = "notBack", controller = null;

  const setStatus = (msg, cls = "") => { status.textContent = msg; status.className = cls; };

  try { input.value = localStorage.getItem("lastUsername") || ""; } catch {}

  // ---------------------------------------------------------------------------
  // Accès à Instagram : les requêtes sont exécutées DANS un onglet instagram.com,
  // avec ta session déjà ouverte. Aucune donnée ne part ailleurs.
  // ---------------------------------------------------------------------------

  // Cette fonction est injectée telle quelle dans l'onglet Instagram.
  async function fetchInPage(url, asText) {
    try {
      // Firefox : content.fetch() envoie la requête au nom de la page (cookies de session inclus).
      // Chrome : le fetch du script injecté se comporte déjà ainsi.
      const doFetch = (typeof content === "object" && content && typeof content.fetch === "function")
        ? content.fetch.bind(content) : fetch;
      const r = await doFetch(url, {
        credentials: "include",
        headers: asText ? {} : { "X-IG-App-ID": "936619743392459", "X-Requested-With": "XMLHttpRequest" },
      });
      const text = await r.text();
      const redirectedToLogin = r.redirected && /\/accounts\/login/.test(r.url);
      if (asText) return { status: r.status, text, redirectedToLogin };
      let json = null;
      try { json = JSON.parse(text); } catch {}
      return { status: r.status, json, redirectedToLogin };
    } catch (e) {
      return { status: 0, error: String(e) };
    }
  }

  function waitForComplete(tabId) {
    return new Promise((resolve) => {
      const listener = (id, info) => {
        if (id === tabId && info.status === "complete") { chrome.tabs.onUpdated.removeListener(listener); resolve(); }
      };
      chrome.tabs.onUpdated.addListener(listener);
      chrome.tabs.get(tabId).then((t) => { if (t.status === "complete") { chrome.tabs.onUpdated.removeListener(listener); resolve(); } });
    });
  }

  async function getInstagramTab() {
    const tabs = await chrome.tabs.query({ url: "https://www.instagram.com/*" });
    if (tabs.length) return { tab: tabs[0], created: false };
    const tab = await chrome.tabs.create({ url: "https://www.instagram.com/", active: false });
    await waitForComplete(tab.id);
    return { tab, created: true };
  }

  function makeIgFetch(tabId) {
    return async (url, opts = {}) => {
      const [res] = await chrome.scripting.executeScript({ target: { tabId }, func: fetchInPage, args: [url, !!opts.asText] });
      return res && res.result;
    };
  }

  // ---------------------------------------------------------------------------
  // Interface
  // ---------------------------------------------------------------------------

  const STEP_LABEL = { following: "Abonnements", followers: "Abonnés" };

  function showProgress(ev) {
    $("progress").hidden = false;
    if (ev.step === "profile") {
      $("barFill").style.width = "2%";
      $("progressText").textContent = "Recherche du compte…";
      return;
    }
    // Les totaux viennent de la page de profil : ils peuvent être arrondis (« 12,5K ») ou absents.
    const totalAll = ev.profile.followingCount + ev.profile.followerCount;
    if (!totalAll) {
      $("barFill").style.width = ev.step === "followers" ? "60%" : "30%";
      $("progressText").textContent = STEP_LABEL[ev.step] + " : " + ev.done + " comptes chargés";
      return;
    }
    const before = ev.step === "followers" ? ev.profile.followingCount : 0;
    const pct = Math.min(99, Math.round(((before + ev.done) / totalAll) * 100));
    $("barFill").style.width = Math.max(2, pct) + "%";
    $("progressText").textContent = STEP_LABEL[ev.step] + " : " + ev.done + " / environ " + Math.max(ev.total, ev.done) + " (" + pct + " %)";
  }

  function setRunning(running) {
    goBtn.disabled = running; input.disabled = running; stopBtn.hidden = !running;
  }

  const IG_ORIGINS = { origins: ["https://www.instagram.com/*"] };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Firefox considère l'accès à un site comme facultatif : on le demande ici.
    // L'appel doit être le premier « await » pour compter comme une action de l'utilisateur.
    let granted = true;
    try { granted = await chrome.permissions.request(IG_ORIGINS); } catch { granted = true; }
    if (!granted) {
      setStatus("L'extension a besoin d'accéder à instagram.com pour lire tes listes. Clique sur Analyser et accepte l'autorisation.", "err");
      return;
    }
    controller = new AbortController();
    setRunning(true);
    setStatus("");
    $("results").hidden = true;
    let created = false, tabId = null;
    try {
      const ig = await getInstagramTab();
      created = ig.created; tabId = ig.tab.id;
      result = await run(makeIgFetch(tabId), input.value, { onStep: showProgress, signal: controller.signal });
      try { localStorage.setItem("lastUsername", result.profile.username); } catch {}
      setStatus("Analyse terminée.", "ok");
      render();
    } catch (err) {
      console.error(err);
      let msg = err instanceof CheckerError ? err.message : "Erreur : " + (err.message || err);
      if (/Cannot access|permission/i.test(String(err.message))) {
        msg = "L'extension n'a pas accès à instagram.com. Vérifie ses autorisations dans les réglages des extensions du navigateur.";
      }
      setStatus(msg, "err");
    } finally {
      setRunning(false);
      $("progress").hidden = true;
      if (created && tabId != null) chrome.tabs.remove(tabId).catch(() => {});
    }
  });

  stopBtn.addEventListener("click", () => controller && controller.abort());

  function currentItems() {
    const q = $("search").value.trim().toLowerCase();
    const hideVerified = $("hideVerified").checked;
    return result[view].filter((u) =>
      (!hideVerified || !u.isVerified) &&
      (u.username.includes(q) || u.fullName.toLowerCase().includes(q)));
  }

  function render() {
    $("results").hidden = false;
    $("resultsTitle").textContent = "Résultats pour @" + result.profile.username;
    $("nFollowing").textContent = result.following.length;
    $("nFollowers").textContent = result.followers.length;
    $("nNotBack").textContent = result.notBack.length;
    const items = currentItems();
    const list = $("list");
    list.replaceChildren();
    if (!items.length) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "Personne dans cette liste.";
      list.append(li);
      return;
    }
    for (const u of items) {
      const li = document.createElement("li");
      const left = document.createElement("span");
      const a = document.createElement("a");
      a.href = "https://www.instagram.com/" + encodeURIComponent(u.username) + "/";
      a.target = "_blank"; a.rel = "noopener noreferrer";
      a.textContent = "@" + u.username;
      left.append(a);
      if (u.isVerified) {
        const b = document.createElement("span");
        b.className = "badge"; b.textContent = "certifié";
        left.append(b);
      }
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = u.fullName;
      li.append(left, name);
      list.append(li);
    }
  }

  document.querySelectorAll('[role="tab"]').forEach((b) => b.addEventListener("click", () => {
    view = b.dataset.view;
    document.querySelectorAll('[role="tab"]').forEach((x) => x.setAttribute("aria-selected", String(x === b)));
    render();
  }));
  $("search").addEventListener("input", render);
  $("hideVerified").addEventListener("change", render);

  $("copy").addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(currentItems().map((u) => "@" + u.username).join("\n"));
      setStatus("Liste copiée dans le presse-papiers.", "ok");
    } catch { setStatus("Copie impossible.", "err"); }
  });

  $("csv").addEventListener("click", () => {
    const rows = [["username", "nom", "certifie", "profil"]].concat(currentItems().map((u) => [
      u.username, u.fullName, u.isVerified ? "oui" : "non", "https://www.instagram.com/" + u.username + "/"]));
    // Le préfixe ' empêche Excel d'interpréter un nom commençant par = + - @ comme une formule.
    const cell = (c) => '"' + String(c).replace(/^([=+\-@])/, "'$1").replace(/"/g, '""') + '"';
    const csv = rows.map((r) => r.map(cell).join(",")).join("\r\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" }));
    a.download = "instagram-" + result.profile.username + "-" + view + ".csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
})();
