import { HEROES, MATCHES, MAP_IMAGES, pct, signed } from "./stats";

export default function App() {
  const root = document.getElementById("app")!;
  root.innerHTML = "";
  root.append(
    header(),
    filters(),
    tierList(),
    history()
  );
}

/* ---------------- UI de base ---------------- */

function header(): HTMLElement {
  const h = el("header", "header");
  const brand = el("div", "brand", "Ulto.GG");
  const nav = el("nav", "nav");
  const tabs = [
    { id: "home", label: "Accueil" },
    { id: "heroes", label: "Héros" },
    { id: "matches", label: "Parties" },
    { id: "synergy", label: "Synergies" }
  ];
  tabs.forEach(t => nav.append(el("button", "tab", t.label)));
  h.append(brand, nav);
  return h;
}

function filters(): HTMLElement {
  const wrap = el("section", "filters");
  wrap.append(
    select("Rang", ["Platinum", "Diamond", "Master"]),
    select("Carte", ["Toutes cartes", "Route 66", "King's Row", "Ilios", "Junkertown"]),
    select("Rôle", ["All", "Tank", "DPS", "Support"])
  );
  return wrap;
}

function tierList(): HTMLElement {
  const card = el("section", "card");
  card.append(el("h2", "", "Tier list"));

  const table = el("div", "table");
  const head = row(["Héros", "Winrate", "Pick", "Sample", "Synergies / Contres"], true);
  table.append(head);

  HEROES.forEach(h => {
    const left = el("div", "hero-cell");
    const avatar = imgSafe(h.portrait, "avatar");
    const name = el("div", "hero-name", h.name);
    const badge = el("span", "role-badge", h.role);
    const tier = el("span", "tier-badge", h.tier);
    left.append(avatar, name, badge, tier);

    const wr = statWithTrend(pct(h.winrate), h.deltaWin);
    const pr = statWithTrend(pct(h.pickrate), h.deltaPick);
    const sample = el("div", "dim", "n=" + h.sample.toLocaleString());

    const pills = el("div", "pills");
    h.synergies.forEach(s => pills.append(pill(`${s.with} ${signed(s.delta)}`, s.delta >= 0)));
    h.counters.forEach(c => pills.append(pill(`${c.vs} ${signed(c.delta)}`, c.delta < 0)));

    table.append(row([left, wr, pr, sample, pills]));
  });

  card.append(table);
  return card;
}

function history(): HTMLElement {
  const card = el("section", "card");
  card.append(el("h2", "", "Historique"));

  const list = el("div", "history");
  MATCHES.forEach(m => list.append(matchCard(m)));
  card.append(list);
  return card;
}

/* ---------------- Petites vues ---------------- */

function statWithTrend(value: string, delta: number): HTMLElement {
  const box = el("div", "stat");
  const main = el("div", "stat-main", value);
  const trend = el("div", "stat-trend " + (delta >= 0 ? "up" : "down"), (delta >= 0 ? "↑ " : "↓ ") + Math.abs(delta).toFixed(1) + "%");
  box.append(main, trend);
  return box;
}

function pill(text: string, positive: boolean): HTMLElement {
  return el("span", "pill " + (positive ? "pos" : "neg"), text);
}

function matchCard(m: import("./stats").Match): HTMLElement {
  const card = el("article", "match" + (m.victory ? " win" : " loss"));

  // fond image local, fallback gradient si fichier absent
  const url = MAP_IMAGES[m.mapId];
  card.style.setProperty("--bg-url", `url("${url}")`);

  // overlay
  const bg = el("div", "match-bg");
  const overlay = el("div", "match-overlay");

  // contenu
  const top = el("div", "match-top");
  const left = el("div", "match-left");
  const avatar = imgSafe(m.heroAvatar, "match-hero");
  const title = el("div", "match-title");
  title.append(
    el("div", "match-hero-name", m.heroName),
    el("div", "match-map", m.mapName),
    el("div", "match-kda", `K/D/A: ${m.k}/${m.d}/${m.a}`),
    el("div", "match-when dim", m.when)
  );
  left.append(avatar, title);

  const badge = el("div", "badge " + (m.victory ? "badge-win" : "badge-loss"), m.victory ? "Victoire" : "Défaite");

  top.append(left, badge);
  card.append(bg, overlay, top);
  return card;
}

/* ---------------- Helpers ---------------- */

function select(label: string, options: string[]): HTMLElement {
  const wrap = el("div", "filter");
  const lab = el("div", "dim", label);
  const sel = el("select", "sel");
  options.forEach(o => {
    const op = document.createElement("option");
    op.textContent = o;
    sel.append(op);
  });
  wrap.append(lab, sel);
  return wrap;
}

function row(cells: Array<string | Node | HTMLElement>, header = false): HTMLElement {
  const r = el("div", "row" + (header ? " head" : ""));
  cells.forEach(c => {
    const cell = el("div", "cell");
    if (typeof c === "string") cell.textContent = c;
    else cell.append(c);
    r.append(cell);
  });
  return r;
}

function imgSafe(src: string, cls = ""): HTMLImageElement {
  const i = new Image();
  i.alt = "";
  i.className = cls;
  i.src = src;
  i.onerror = () => {
    i.removeAttribute("src");
    i.classList.add("img-fallback");
  };
  return i;
}

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K, className = "", text = ""
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  if (className) n.className = className;
  if (text) n.textContent = text;
  return n;
}
