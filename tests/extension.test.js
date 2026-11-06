// Tests de la logique de l'extension avec une API Instagram simulée : node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../extension/lib.js");

const noSleep = async () => {};
const user = (username, extra = {}) => ({ username, full_name: username.toUpperCase(), is_verified: false, ...extra });

/** Faux Instagram : profil + listes paginées par pages de `pageSize`. */
function fakeInstagram({ followers, following, pageSize = 2, overrides = {} }) {
  const calls = [];
  const igFetch = async (url) => {
    calls.push(url);
    const u = new URL(url);
    for (const [pattern, res] of Object.entries(overrides)) if (url.includes(pattern)) return res;
    // Page de profil HTML, au format observé sur instagram.com en novembre 2026.
    const profile = u.pathname.match(/^\/([a-z0-9._]+)\/$/);
    if (profile && profile[1] !== "api") {
      return { status: 200, text:
        '<html><head><meta property="og:description" content="' + followers.length + ' followers, ' +
        following.length + ' suivis, 12 publications - Voir les photos (&#064;' + profile[1] + ')" />' +
        '</head><body><script>{"page_id":"profilePage_42","profile_id":"42"}</script></body></html>' };
    }
    const m = u.pathname.match(/^\/api\/v1\/friendships\/42\/(followers|following)\/$/);
    if (m) {
      const list = m[1] === "followers" ? followers : following;
      const start = Number(u.searchParams.get("max_id") || 0);
      const end = start + pageSize;
      return { status: 200, json: { users: list.slice(start, end), next_max_id: end < list.length ? String(end) : null } };
    }
    return { status: 404, json: null };
  };
  return { igFetch, calls };
}

test("compare les listes en suivant la pagination", async () => {
  const { igFetch, calls } = fakeInstagram({
    followers: [user("alice"), user("bob"), user("fan")],
    following: [user("alice"), user("bob"), user("star", { is_verified: true }), user("ex")],
  });
  const steps = [];
  const r = await L.run(igFetch, "@Moi", { sleep: noSleep, onStep: (s) => steps.push(s.step) });
  assert.equal(r.profile.username, "moi");
  assert.deepEqual(r.notBack.map((u) => u.username), ["ex", "star"]);
  assert.equal(r.notBack[1].isVerified, true);
  assert.deepEqual(r.fans.map((u) => u.username), ["fan"]);
  assert.deepEqual(r.mutual.map((u) => u.username), ["alice", "bob"]);
  assert.equal(calls.filter((c) => c.includes("/following/")).length, 2);
  assert.equal(calls.filter((c) => c.includes("/followers/")).length, 2);
  assert.deepEqual([...new Set(steps)], ["profile", "following", "followers"]);
});

test("accepte un lien de profil comme pseudo", () => {
  assert.equal(L.normalizeUsername("https://www.instagram.com/Some.User_1/?hl=fr"), "some.user_1");
  assert.throws(() => L.normalizeUsername("pas un pseudo!"), { code: "username" });
});

test("fait une pause entre les pages", async () => {
  const { igFetch } = fakeInstagram({ followers: [], following: [user("a"), user("b"), user("c"), user("d"), user("e")] });
  const pauses = [];
  await L.fetchList(igFetch, "42", "following", { sleep: async (ms) => pauses.push(ms) });
  assert.equal(pauses.length, 2);
  assert.ok(pauses.every((ms) => ms >= 900 && ms <= 1900));
});

const errorCases = [
  ["compte introuvable", { "instagram.com/moi/": { status: 404, text: "" } }, "notFound"],
  ["page sans identifiant", { "instagram.com/moi/": { status: 200, text: "<html></html>" } }, "notFound"],
  ["pas connecté", { "/following/": { status: 200, json: null, redirectedToLogin: true } }, "login"],
  ["limite de requêtes", { "/following/": { status: 429, json: { message: "Please wait a few minutes before you try again." } } }, "rateLimit"],
  ["compte privé", { "/following/": { status: 400, json: { message: "Not authorized to view user", status: "fail" } } }, "private"],
  ["réseau", { "instagram.com/moi/": { status: 0, error: "Failed to fetch" } }, "network"],
  ["pas connecté (profil)", { "instagram.com/moi/": { status: 200, text: "", redirectedToLogin: true } }, "login"],
];
for (const [name, overrides, code] of errorCases) {
  test("erreur claire : " + name, async () => {
    const { igFetch } = fakeInstagram({ followers: [], following: [user("a")], overrides });
    await assert.rejects(L.run(igFetch, "moi", { sleep: noSleep }), (e) => e instanceof L.CheckerError && e.code === code);
  });
}

test("peut être annulé", async () => {
  const { igFetch } = fakeInstagram({ followers: [], following: [user("a"), user("b"), user("c")] });
  const ctrl = new AbortController();
  await assert.rejects(
    L.fetchList(igFetch, "42", "following", { sleep: async () => ctrl.abort(), signal: ctrl.signal }),
    { code: "aborted" });
});

test("lit les compteurs approximatifs du profil", () => {
  assert.equal(L.parseCount("686M"), 686000000);
  assert.equal(L.parseCount("12,5K"), 12500);
  assert.equal(L.parseCount("12.5k"), 12500);
  assert.equal(L.parseCount("1,234"), 1234);
  assert.equal(L.parseCount("1 234"), 1234);
  assert.equal(L.parseCount("168"), 168);
});

test("récupère l'identifiant et les compteurs depuis la page de profil", async () => {
  const igFetch = async () => ({ status: 200, text:
    '<meta property="og:description" content="686M followers, 168 suivis, 8,636 publications - Voir (&#064;instagram)" />' +
    '"page_id":"profilePage_25025320","profile_id":"25025320"' });
  const p = await L.getProfile(igFetch, "instagram");
  assert.deepEqual(p, { id: "25025320", username: "instagram", followerCount: 686000000, followingCount: 168 });
});
