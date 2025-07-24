export async function loadTournamentData() {
  const files = await fetch("./").then(r => r.text());
  const parser = new DOMParser();
  const doc = parser.parseFromString(files, "text/html");

  const links = Array.from(doc.querySelectorAll("a"));
  const fileLink = links.find(link => link.href.endsWith(".Tournament"));
  if (!fileLink) throw new Error("Archivo .Tournament no encontrado.");

  const xml = await fetch(fileLink.href).then(r => r.text());
  const xmlDoc = new DOMParser().parseFromString(xml, "application/xml");

  const players = Array.from(xmlDoc.getElementsByTagName("TournPlayer")).map(p => {
    const id = p.querySelector("ID")?.textContent ?? "";
    const name = `${p.querySelector("FirstName")?.textContent ?? ""} ${p.querySelector("LastName")?.textContent ?? ""}`.trim();
    const rank = parseInt(p.querySelector("Rank")?.textContent ?? "0");
    return { id, name, rank };
  });

  const getName = (id) => {
    const p = players.find(p => p.id === id);
    return p ? p.name : `Desconocido (${id})`;
  };

  const matches = Array.from(xmlDoc.getElementsByTagName("TournMatch")).map(m => ({
    round: parseInt(m.querySelector("Round")?.textContent ?? "0"),
    player1: m.getElementsByTagName("Player")[0]?.textContent ?? "",
    player2: m.getElementsByTagName("Player")[1]?.textContent ?? "",
    winner: m.querySelector("Winner")?.textContent ?? "",
    table: m.querySelector("Table")?.textContent ?? "",
    status: m.querySelector("Status")?.textContent ?? "",
  }));

  const currentRound = parseInt(xmlDoc.querySelector("CurrentRound")?.textContent ?? "0");
  const finalized = xmlDoc.querySelector("Finalized")?.textContent === "True";

  const currentMatches = matches.filter(m => m.round === currentRound);

  const standings = players.sort((a, b) => a.rank - b.rank).map((p, i) => ({
    ...p,
    medal: i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : "",
  }));

  const getStanding = (id) => {
    const p = standings.find(p => p.id === id);
    return p ? `${p.medal}${p.rank}` : "";
  };

  const history = matches
    .filter(m => finalized || m.round < currentRound)
    .sort((a, b) => b.round - a.round)
    .map(m => ({
      ...m,
      player1Name: getName(m.player1),
      player2Name: getName(m.player2),
      player1Standing: getStanding(m.player1),
      player2Standing: getStanding(m.player2),
    }));

  return {
    currentRound,
    finalized,
    currentMatches,
    players,
    getName,
    getStanding,
    history,
  };
}
