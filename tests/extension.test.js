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
    if (u.pathname === "/api/v1/users/web_profile_info/") {
      return { status: 200, json: { data: { user: {
        id: "42", username: u.searchParams.get("username"), is_private: false,
        edge_followed_by: { count: followers.length }, edge_follow: { count: following.length } } } } };
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
  ["compte introuvable", { "web_profile_info": { status: 404, json: null } }, "notFound"],
  ["pas connecté", { "/following/": { status: 200, json: null, redirectedToLogin: true } }, "login"],
  ["limite de requêtes", { "/following/": { status: 429, json: { message: "Please wait a few minutes before you try again." } } }, "rateLimit"],
  ["compte privé", { "/following/": { status: 400, json: { message: "Not authorized to view user", status: "fail" } } }, "private"],
  ["réseau", { "web_profile_info": { status: 0, error: "Failed to fetch" } }, "network"],
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
