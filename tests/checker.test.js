// Tests : node --test tests/
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");
// La logique vit dans index.html (fichier unique pour les utilisateurs) : on l'extrait.
const html = fs.readFileSync(path.join(__dirname, "..", "index.html"), "utf8");
const src = html.match(/<script id="checker">([\s\S]*?)<\/script>/)[1];
const root = {};
new Function("self", src)(root);
const C = root.FollowbackChecker;

const DIR = path.join(__dirname, "..", "example", "connections", "followers_and_following");
const read = (n) => fs.readFileSync(path.join(DIR, n), "utf8");

// Petit générateur de ZIP (deflate) pour tester le lecteur sans dépendance.
function makeZip(files) {
  const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
  const crc32 = (b) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 0xff] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const locals = [], centrals = []; let offset = 0;
  for (const [name, content] of files) {
    const raw = Buffer.from(content), comp = zlib.deflateRawSync(raw), nameBuf = Buffer.from(name), crc = crc32(raw);
    const lh = Buffer.alloc(30); lh.writeUInt32LE(0x04034b50, 0); lh.writeUInt16LE(20, 4); lh.writeUInt16LE(0x800, 6); lh.writeUInt16LE(8, 8);
    lh.writeUInt32LE(crc, 14); lh.writeUInt32LE(comp.length, 18); lh.writeUInt32LE(raw.length, 22); lh.writeUInt16LE(nameBuf.length, 26);
    const ch = Buffer.alloc(46); ch.writeUInt32LE(0x02014b50, 0); ch.writeUInt16LE(20, 4); ch.writeUInt16LE(20, 6); ch.writeUInt16LE(0x800, 8); ch.writeUInt16LE(8, 10);
    ch.writeUInt32LE(crc, 16); ch.writeUInt32LE(comp.length, 20); ch.writeUInt32LE(raw.length, 24); ch.writeUInt16LE(nameBuf.length, 28); ch.writeUInt32LE(offset, 42);
    locals.push(lh, nameBuf, comp); centrals.push(ch, nameBuf); offset += 30 + nameBuf.length + comp.length;
  }
  const cd = Buffer.concat(centrals), end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
  end.writeUInt32LE(cd.length, 12); end.writeUInt32LE(offset, 16);
  return Buffer.concat([...locals, cd, end]);
}

const expectNames = (list) => list.map((u) => u.username);

test("analyse les fichiers JSON (ancien et nouveau format)", () => {
  const r = C.analyze([
    { name: "connections/followers_and_following/followers_1.json", text: read("followers_1.json") },
    { name: "connections/followers_and_following/following.json", text: read("following.json") },
  ]);
  assert.deepEqual(expectNames(r.notBack), ["ancien.format", "celebrite"]);
  assert.deepEqual(expectNames(r.fans), ["fan_inconnu"]);
  assert.deepEqual(expectNames(r.mutual), ["alice", "bob"]);
});

test("lit un ZIP d'export complet et ignore les autres fichiers", async () => {
  const zip = makeZip([
    ["your_instagram_activity/likes/liked_posts.json", "{}"],
    ["connections/followers_and_following/followers_1.json", read("followers_1.json")],
    ["connections/followers_and_following/followers_2.json", JSON.stringify([{ string_list_data: [{ value: "celebrite" }] }])],
    ["connections/followers_and_following/following.json", read("following.json")],
  ]);
  const file = new File([zip], "instagram-export.zip", { type: "application/zip" });
  const r = C.analyze(await C.collectJsonFiles([file]));
  assert.deepEqual(expectNames(r.notBack), ["ancien.format"]);
  assert.equal(r.followers.length, 4);
});

test("refuse un export HTML avec un message clair", () => {
  assert.throws(() => C.analyze([{ name: "followers_1.html", text: "<html>" }, { name: "following.html", text: "" }]), /format JSON/);
});

test("signale un fichier manquant", () => {
  assert.throws(() => C.analyze([{ name: "followers_1.json", text: "[]" }]), /following\.json introuvable/);
});

test("signale un fichier qui n'est pas un ZIP", async () => {
  await assert.rejects(C.collectJsonFiles([new File(["pas un zip"], "x.zip")]), /ZIP valide/);
});

test("accepte les chemins avec des « \\ » (ZIP créés sous Windows)", () => {
  const r = C.analyze([
    { name: "connections\\followers_and_following\\followers_1.json", text: read("followers_1.json") },
    { name: "connections\\followers_and_following\\following.json", text: read("following.json") },
  ]);
  assert.equal(r.notBack.length, 2);
});
