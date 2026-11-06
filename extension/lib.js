/*!
 * Follow-back Checker — logique de récupération via l'API web d'Instagram.
 * Ne dépend d'aucun objet navigateur : la fonction `igFetch(url)` est injectée
 * (dans l'extension elle s'exécute dans un onglet instagram.com ; dans les tests elle est simulée).
 * Licence MIT.
 */
(function (root) {
  "use strict";

  const BASE = "https://www.instagram.com";
  const PAGE_SIZE = 50;
  const MAX_PAGES = 2000;

  class CheckerError extends Error {
    constructor(code, message) { super(message); this.code = code; }
  }

  const MESSAGES = {
    login: "Tu n'es pas connecté·e à Instagram dans ce navigateur. Ouvre instagram.com, connecte-toi, puis relance.",
    notFound: "Ce compte Instagram est introuvable. Vérifie le pseudo.",
    private: "Ce compte est privé et tu ne le suis pas : impossible de voir ses listes.",
    rateLimit: "Instagram limite temporairement les requêtes. Attends quelques minutes (voire une heure) avant de réessayer.",
    network: "Problème de connexion avec Instagram. Vérifie ta connexion Internet et réessaie.",
    unexpected: "Réponse inattendue d'Instagram. Le site a peut-être changé ; réessaie plus tard.",
    username: "Pseudo invalide : uniquement lettres, chiffres, points et « _ » (30 caractères max).",
  };

  const fail = (code, extra) => { throw new CheckerError(code, MESSAGES[code] + (extra ? " (" + extra + ")" : "")); };

  function normalizeUsername(input) {
    const u = String(input || "").trim().replace(/^@/, "")
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/[/?#].*$/, "").toLowerCase();
    if (!/^[a-z0-9._]{1,30}$/.test(u)) fail("username");
    return u;
  }

  function checkResponse(res) {
    if (!res || res.status === 0) fail("network", res && res.error);
    const msg = String((res.json && res.json.message) || "").toLowerCase();
    if (res.status === 429 || /wait a few minutes|please wait|rate/.test(msg)) fail("rateLimit");
    if (res.redirectedToLogin || res.status === 401 || (res.json && res.json.require_login)) fail("login");
    if (res.status === 404) fail("notFound");
    if (!res.json) fail("unexpected", "HTTP " + res.status);
  }

  async function getProfile(igFetch, username) {
    const res = await igFetch(BASE + "/api/v1/users/web_profile_info/?username=" + encodeURIComponent(username));
    checkResponse(res);
    const user = res.json.data && res.json.data.user;
    if (!user) fail("notFound");
    return {
      id: String(user.id),
      username: user.username,
      fullName: user.full_name || "",
      isPrivate: !!user.is_private,
      followerCount: (user.edge_followed_by && user.edge_followed_by.count) || 0,
      followingCount: (user.edge_follow && user.edge_follow.count) || 0,
    };
  }

  const defaultSleep = (ms) => new Promise((r) => setTimeout(r, ms));

  /**
   * Récupère toute la liste "followers" ou "following" d'un compte, page par page,
   * avec une pause aléatoire entre chaque page pour rester discret.
   */
  async function fetchList(igFetch, userId, kind, opts = {}) {
    const { onProgress = () => {}, sleep = defaultSleep, minDelay = 900, maxDelay = 1900, signal } = opts;
    const users = new Map();
    let maxId = null;
    for (let page = 0; page < MAX_PAGES; page++) {
      if (signal && signal.aborted) throw new CheckerError("aborted", "Analyse annulée.");
      let url = BASE + "/api/v1/friendships/" + encodeURIComponent(userId) + "/" + kind + "/?count=" + PAGE_SIZE;
      if (kind === "followers") url += "&search_surface=follow_list_page";
      if (maxId) url += "&max_id=" + encodeURIComponent(maxId);

      const res = await igFetch(url);
      if (res && (res.status === 400 || res.status === 403) && !(res.json && res.json.require_login)) {
        const msg = String((res.json && res.json.message) || "").toLowerCase();
        if (!/wait|rate/.test(msg)) fail("private");
      }
      checkResponse(res);
      if (!Array.isArray(res.json.users)) fail("unexpected", "liste absente");

      for (const u of res.json.users) {
        const username = String(u.username || "").toLowerCase();
        if (username && !users.has(username)) {
          users.set(username, { username, fullName: u.full_name || "", isVerified: !!u.is_verified, isPrivate: !!u.is_private });
        }
      }
      onProgress(users.size);

      const next = res.json.next_max_id;
      if (!next || next === maxId || res.json.users.length === 0) break;
      maxId = String(next);
      await sleep(minDelay + Math.random() * (maxDelay - minDelay));
    }
    return [...users.values()];
  }

  function compare(followers, following) {
    const followerSet = new Set(followers.map((u) => u.username));
    const followingSet = new Set(following.map((u) => u.username));
    const byName = (a, b) => a.username.localeCompare(b.username);
    return {
      followers,
      following,
      notBack: following.filter((u) => !followerSet.has(u.username)).sort(byName),
      fans: followers.filter((u) => !followingSet.has(u.username)).sort(byName),
      mutual: following.filter((u) => followerSet.has(u.username)).sort(byName),
    };
  }

  /** Analyse complète : profil → abonnements → abonnés → comparaison. */
  async function run(igFetch, rawUsername, opts = {}) {
    const { onStep = () => {} } = opts;
    const username = normalizeUsername(rawUsername);
    onStep({ step: "profile" });
    const profile = await getProfile(igFetch, username);
    onStep({ step: "following", done: 0, total: profile.followingCount, profile });
    const following = await fetchList(igFetch, profile.id, "following", {
      ...opts, onProgress: (n) => onStep({ step: "following", done: n, total: profile.followingCount, profile }),
    });
    onStep({ step: "followers", done: 0, total: profile.followerCount, profile });
    const followers = await fetchList(igFetch, profile.id, "followers", {
      ...opts, onProgress: (n) => onStep({ step: "followers", done: n, total: profile.followerCount, profile }),
    });
    return { profile, ...compare(followers, following) };
  }

  const api = { run, getProfile, fetchList, compare, normalizeUsername, CheckerError, MESSAGES };
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.FollowbackLib = api;
})(typeof self !== "undefined" ? self : this);
