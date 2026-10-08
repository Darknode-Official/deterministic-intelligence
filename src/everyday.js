// Copyright (c) 2026 Darknode-Official (Manav Prasad). All rights reserved. See LICENSE.
// Everyday tools DI answers exactly, offline: clock arithmetic ("hours between 9am and
// 5:30pm", "add 45 minutes to 10:20"), the current time in a city, random draws (coin,
// dice, number, pick one), UUIDs, placeholder text, tip / BMI / loan / savings maths,
// travel time, well-known network ports, and "what year was N years ago".
// Each handler is a strict pattern with one exact computation behind it; a request that
// does not fit a pattern is not claimed (ask() returns null), so nothing here guesses.

const NUM = "(\\d+(?:\\.\\d+)?)";
const money = (s) => Number(String(s).replace(/[,$]/g, "").replace(/k$/i, "000"));
const r2 = (n) => Math.round(n * 100) / 100;
const fmt = (n) => Number.isInteger(n) ? String(n) : String(Math.round(n * 1e6) / 1e6);
const usd = (n) => n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const plural = (n, w) => n + " " + w + (n === 1 ? "" : "s");
const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

// ---------------------------------------------------------------------------
// Clock arithmetic
// ---------------------------------------------------------------------------
const TIME = "(\\d{1,2})(?::(\\d{2}))?\\s*(am|pm|a\\.m\\.|p\\.m\\.)?|noon|midnight";
function parseTime(str) {
  const t = String(str).toLowerCase().replace(/\./g, "").trim();
  if (t === "noon") return 12 * 60;
  if (t === "midnight") return 0;
  const m = t.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/);
  if (!m) return null;
  let h = +m[1]; const min = m[2] ? +m[2] : 0;
  if (min > 59) return null;
  if (m[3]) { if (h < 1 || h > 12) return null; if (m[3] === "pm" && h !== 12) h += 12; if (m[3] === "am" && h === 12) h = 0; }
  else if (h > 23) return null;
  return h * 60 + min;
}
function fmtClock(mins, ampm) {
  mins = ((mins % 1440) + 1440) % 1440;
  const h = Math.floor(mins / 60), m = mins % 60;
  if (!ampm) return String(h).padStart(2, "0") + ":" + String(m).padStart(2, "0");
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return h12 + ":" + String(m).padStart(2, "0") + " " + (h < 12 ? "AM" : "PM");
}
function fmtDur(mins) {
  const h = Math.floor(mins / 60), m = Math.round(mins % 60);
  const parts = []; if (h) parts.push(plural(h, "hour")); if (m || !h) parts.push(plural(m, "minute"));
  return parts.join(" ");
}
const MONTH_INDEX = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const TIME_RE = new RegExp(TIME, "i");
const hasClock = (s) => /\b\d{1,2}:\d{2}\b|\b\d{1,2}\s*(?:am|pm|a\.m\.|p\.m\.)\b|\bnoon\b|\bmidnight\b/i.test(s)
  || /\bhours?\b/.test(s) && /\b\d{1,2}\s+(?:to|until|till)\s+\d{1,2}\b/.test(s); // "9 to 5 is how many hours"

// ---------------------------------------------------------------------------
// Time zones: city / country / abbreviation -> IANA zone
// ---------------------------------------------------------------------------
const ZONES = {
  utc: "UTC", gmt: "UTC", zulu: "UTC", est: "America/New_York", edt: "America/New_York", cst: "America/Chicago", cdt: "America/Chicago", mst: "America/Denver", mdt: "America/Denver", pst: "America/Los_Angeles", pdt: "America/Los_Angeles",
  cet: "Europe/Paris", cest: "Europe/Paris", bst: "Europe/London", ist: "Asia/Kolkata", jst: "Asia/Tokyo", kst: "Asia/Seoul", aest: "Australia/Sydney", aedt: "Australia/Sydney", hkt: "Asia/Hong_Kong", sgt: "Asia/Singapore", eet: "Europe/Athens", msk: "Europe/Moscow",
  "new york": "America/New_York", nyc: "America/New_York", boston: "America/New_York", miami: "America/New_York", toronto: "America/Toronto", montreal: "America/Toronto", atlanta: "America/New_York", washington: "America/New_York", "washington dc": "America/New_York", philadelphia: "America/New_York", detroit: "America/Detroit",
  chicago: "America/Chicago", houston: "America/Chicago", dallas: "America/Chicago", "mexico city": "America/Mexico_City", mexico: "America/Mexico_City", denver: "America/Denver", phoenix: "America/Phoenix", "salt lake city": "America/Denver",
  "los angeles": "America/Los_Angeles", la: "America/Los_Angeles", "san francisco": "America/Los_Angeles", seattle: "America/Los_Angeles", "las vegas": "America/Los_Angeles", vancouver: "America/Vancouver", "san diego": "America/Los_Angeles", portland: "America/Los_Angeles",
  anchorage: "America/Anchorage", honolulu: "Pacific/Honolulu", hawaii: "Pacific/Honolulu", alaska: "America/Anchorage",
  "sao paulo": "America/Sao_Paulo", "são paulo": "America/Sao_Paulo", rio: "America/Sao_Paulo", "rio de janeiro": "America/Sao_Paulo", brazil: "America/Sao_Paulo", "buenos aires": "America/Argentina/Buenos_Aires", argentina: "America/Argentina/Buenos_Aires", santiago: "America/Santiago", chile: "America/Santiago", lima: "America/Lima", peru: "America/Lima", bogota: "America/Bogota", colombia: "America/Bogota", caracas: "America/Caracas",
  london: "Europe/London", uk: "Europe/London", england: "Europe/London", dublin: "Europe/Dublin", ireland: "Europe/Dublin", lisbon: "Europe/Lisbon", portugal: "Europe/Lisbon", reykjavik: "Atlantic/Reykjavik", iceland: "Atlantic/Reykjavik",
  paris: "Europe/Paris", france: "Europe/Paris", berlin: "Europe/Berlin", germany: "Europe/Berlin", munich: "Europe/Berlin", frankfurt: "Europe/Berlin", madrid: "Europe/Madrid", spain: "Europe/Madrid", barcelona: "Europe/Madrid", rome: "Europe/Rome", italy: "Europe/Rome", milan: "Europe/Rome", amsterdam: "Europe/Amsterdam", netherlands: "Europe/Amsterdam", brussels: "Europe/Brussels", belgium: "Europe/Brussels", zurich: "Europe/Zurich", switzerland: "Europe/Zurich", geneva: "Europe/Zurich", vienna: "Europe/Vienna", austria: "Europe/Vienna", prague: "Europe/Prague", "czech republic": "Europe/Prague", warsaw: "Europe/Warsaw", poland: "Europe/Warsaw", stockholm: "Europe/Stockholm", sweden: "Europe/Stockholm", oslo: "Europe/Oslo", norway: "Europe/Oslo", copenhagen: "Europe/Copenhagen", denmark: "Europe/Copenhagen", helsinki: "Europe/Helsinki", finland: "Europe/Helsinki", athens: "Europe/Athens", greece: "Europe/Athens", istanbul: "Europe/Istanbul", turkey: "Europe/Istanbul", kyiv: "Europe/Kyiv", kiev: "Europe/Kyiv", ukraine: "Europe/Kyiv", moscow: "Europe/Moscow", russia: "Europe/Moscow", budapest: "Europe/Budapest", hungary: "Europe/Budapest", bucharest: "Europe/Bucharest", romania: "Europe/Bucharest",
  cairo: "Africa/Cairo", egypt: "Africa/Cairo", lagos: "Africa/Lagos", nigeria: "Africa/Lagos", nairobi: "Africa/Nairobi", kenya: "Africa/Nairobi", johannesburg: "Africa/Johannesburg", "cape town": "Africa/Johannesburg", "south africa": "Africa/Johannesburg", casablanca: "Africa/Casablanca", morocco: "Africa/Casablanca", accra: "Africa/Accra", ghana: "Africa/Accra", addis: "Africa/Addis_Ababa", "addis ababa": "Africa/Addis_Ababa", ethiopia: "Africa/Addis_Ababa",
  dubai: "Asia/Dubai", uae: "Asia/Dubai", "abu dhabi": "Asia/Dubai", riyadh: "Asia/Riyadh", "saudi arabia": "Asia/Riyadh", doha: "Asia/Qatar", qatar: "Asia/Qatar", tehran: "Asia/Tehran", iran: "Asia/Tehran", "tel aviv": "Asia/Jerusalem", jerusalem: "Asia/Jerusalem", israel: "Asia/Jerusalem", baghdad: "Asia/Baghdad", iraq: "Asia/Baghdad",
  karachi: "Asia/Karachi", pakistan: "Asia/Karachi", lahore: "Asia/Karachi", islamabad: "Asia/Karachi", delhi: "Asia/Kolkata", "new delhi": "Asia/Kolkata", mumbai: "Asia/Kolkata", bangalore: "Asia/Kolkata", bengaluru: "Asia/Kolkata", chennai: "Asia/Kolkata", hyderabad: "Asia/Kolkata", kolkata: "Asia/Kolkata", india: "Asia/Kolkata", dhaka: "Asia/Dhaka", bangladesh: "Asia/Dhaka", kathmandu: "Asia/Kathmandu", nepal: "Asia/Kathmandu", colombo: "Asia/Colombo", "sri lanka": "Asia/Colombo",
  bangkok: "Asia/Bangkok", thailand: "Asia/Bangkok", hanoi: "Asia/Ho_Chi_Minh", "ho chi minh": "Asia/Ho_Chi_Minh", vietnam: "Asia/Ho_Chi_Minh", jakarta: "Asia/Jakarta", indonesia: "Asia/Jakarta", bali: "Asia/Makassar", "kuala lumpur": "Asia/Kuala_Lumpur", malaysia: "Asia/Kuala_Lumpur", singapore: "Asia/Singapore", manila: "Asia/Manila", philippines: "Asia/Manila",
  beijing: "Asia/Shanghai", shanghai: "Asia/Shanghai", china: "Asia/Shanghai", shenzhen: "Asia/Shanghai", "hong kong": "Asia/Hong_Kong", taipei: "Asia/Taipei", taiwan: "Asia/Taipei", seoul: "Asia/Seoul", korea: "Asia/Seoul", "south korea": "Asia/Seoul", tokyo: "Asia/Tokyo", japan: "Asia/Tokyo", osaka: "Asia/Tokyo", kyoto: "Asia/Tokyo",
  sydney: "Australia/Sydney", melbourne: "Australia/Melbourne", canberra: "Australia/Sydney", brisbane: "Australia/Brisbane", perth: "Australia/Perth", adelaide: "Australia/Adelaide", australia: "Australia/Sydney", auckland: "Pacific/Auckland", wellington: "Pacific/Auckland", "new zealand": "Pacific/Auckland", fiji: "Pacific/Fiji",
};
const ZONE_KEYS = Object.keys(ZONES).sort((a, b) => b.length - a.length);
function zoneOf(place) {
  const p = String(place).toLowerCase().replace(/[?.!,]+$/, "").replace(/^(?:the\s+)?/, "").trim();
  if (ZONES[p]) return { key: p, tz: ZONES[p] };
  for (const k of ZONE_KEYS) if (new RegExp("(?:^|\\s)" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?:\\s|$)").test(p)) return { key: k, tz: ZONES[k] };
  return null;
}
// "what time zone is new york in": the IANA zone and today's UTC offset (daylight saving included)
export function timeZoneOf(q) {
  const m = String(q || "").toLowerCase().replace(/[?.!]+$/, "").trim().match(/^(?:what|which) (?:time ?zone|tz) (?:is|does|do) (?:the )?(.+?)(?: in| use| have| on)?$|^(?:what is |what's )?(?:the )?(?:time ?zone|utc offset) (?:of|for|in) (?:the )?(.+)$/);
  if (!m) return null;
  const z = zoneOf(m[1] || m[2]);
  if (!z || !/\//.test(z.tz)) return null;
  const n = nowIn(z.tz), place = (m[1] || m[2]).replace(/\b[a-z]/g, (c) => c.toUpperCase());
  return { ok: true, kind: "kb", title: "Time zone: " + place, text: place + " uses the **" + z.tz + "** time zone, currently **" + n.offset + "** (local time now " + n.time + ", " + n.weekday + ").", note: "From DI's time-zone table; the offset is computed now by your device's clock, so it includes daylight saving." };
}
function nowIn(tz) {
  const d = new Date();
  const f = new Intl.DateTimeFormat("en-US", { timeZone: tz, weekday: "long", hour: "2-digit", minute: "2-digit", hour12: false, year: "numeric", month: "short", day: "numeric" });
  const parts = Object.fromEntries(f.formatToParts(d).filter((p) => p.type !== "literal").map((p) => [p.type, p.value]));
  // UTC offset from the zone's wall clock vs UTC (Node and every modern browser)
  const wall = new Date(new Intl.DateTimeFormat("en-US", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(d).replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, "$3-$1-$2T$4:$5:$6Z").replace("T24:", "T00:"));
  const offMin = Math.round((wall.getTime() - Math.floor(d.getTime() / 1000) * 1000) / 60000);
  const sign = offMin >= 0 ? "+" : "-", a = Math.abs(offMin);
  const off = "UTC" + sign + Math.floor(a / 60) + (a % 60 ? ":" + String(a % 60).padStart(2, "0") : "");
  const hh = parts.hour === "24" ? "00" : parts.hour;
  return { time: hh + ":" + parts.minute, weekday: parts.weekday, date: parts.month + " " + parts.day + ", " + parts.year, offset: off };
}

// ---------------------------------------------------------------------------
// Random draws (a real random source, never a guess)
// ---------------------------------------------------------------------------
function randInt(lo, hi) { // inclusive, unbiased
  const span = hi - lo + 1;
  const c = globalThis.crypto;
  if (c && c.getRandomValues) { const buf = new Uint32Array(1); const lim = Math.floor(0x100000000 / span) * span; let x; do { c.getRandomValues(buf); x = buf[0]; } while (x >= lim); return lo + (x % span); }
  return lo + Math.floor(Math.random() * span);
}
function uuid4() {
  const c = globalThis.crypto;
  if (c && c.randomUUID) return c.randomUUID();
  const b = new Uint8Array(16); if (c && c.getRandomValues) c.getRandomValues(b); else for (let i = 0; i < 16; i++) b[i] = randInt(0, 255);
  b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
  const h = [...b].map((x) => x.toString(16).padStart(2, "0")).join("");
  return h.slice(0, 8) + "-" + h.slice(8, 12) + "-" + h.slice(12, 16) + "-" + h.slice(16, 20) + "-" + h.slice(20);
}
const LOREM = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Curabitur pretium tincidunt lacus, nulla gravida orci a odio. Nullam varius, turpis et commodo pharetra, est eros bibendum elit, nec luctus magna felis sollicitudin mauris. Integer in mauris eu nibh euismod gravida. Duis ac tellus et risus vulputate vehicula. Donec lobortis risus a elit, etiam tempor. Ut ullamcorper, ligula eu tempor congue, eros est euismod turpis, id tincidunt sapien risus a quam. Maecenas fermentum consequat mi, donec fermentum. Pellentesque malesuada nulla a mi. Duis sapien sem, aliquet nec, commodo eget, consequat quis, neque. Aliquam faucibus, elit ut dictum aliquet, felis nisl adipiscing sapien, sed malesuada diam lacus eget erat. Cras mollis scelerisque nunc, nullam arcu. Aliquam consequat curabitur augue lorem, dapibus quis, laoreet et, pretium ac, nisi. Aenean magna nisl, mollis quis, molestie eu, feugiat in, orci. In hac habitasse platea dictumst.";
const LOREM_SENT = LOREM.match(/[^.]+\./g).map((s) => s.trim());
function lorem(n, unit) {
  if (unit === "words") { const w = LOREM.split(/\s+/); const out = []; for (let i = 0; i < n; i++) out.push(w[i % w.length].replace(/[.,]$/, "")); return cap(out.join(" ")) + "."; }
  if (unit === "paragraphs") { const out = []; for (let p = 0; p < n; p++) out.push(LOREM_SENT.slice((p * 5) % LOREM_SENT.length, (p * 5) % LOREM_SENT.length + 5).join(" ")); return out.join("\n\n"); }
  const out = []; for (let i = 0; i < n; i++) out.push(LOREM_SENT[i % LOREM_SENT.length]); return out.join(" ");
}

// ---------------------------------------------------------------------------
// Well-known ports (IANA assignments and de-facto defaults)
// ---------------------------------------------------------------------------
const PORTS = [
  [20, "tcp", "FTP data", ["ftp data", "ftp-data"]], [21, "tcp", "FTP (control)", ["ftp"]], [22, "tcp", "SSH (also SFTP and SCP)", ["ssh", "sftp", "scp"]], [23, "tcp", "Telnet", ["telnet"]], [25, "tcp", "SMTP", ["smtp", "mail", "email"]],
  [53, "tcp/udp", "DNS", ["dns"]], [67, "udp", "DHCP (server)", ["dhcp"]], [68, "udp", "DHCP (client)", []], [69, "udp", "TFTP", ["tftp"]], [80, "tcp", "HTTP", ["http", "web"]], [88, "tcp/udp", "Kerberos", ["kerberos"]], [110, "tcp", "POP3", ["pop3", "pop"]],
  [119, "tcp", "NNTP", ["nntp"]], [123, "udp", "NTP", ["ntp", "time sync"]], [135, "tcp", "Microsoft RPC", ["msrpc", "rpc"]], [137, "udp", "NetBIOS name service", ["netbios"]], [139, "tcp", "NetBIOS session service", []], [143, "tcp", "IMAP", ["imap"]],
  [161, "udp", "SNMP", ["snmp"]], [162, "udp", "SNMP trap", ["snmp trap"]], [194, "tcp", "IRC", ["irc"]], [389, "tcp/udp", "LDAP", ["ldap"]], [443, "tcp", "HTTPS (HTTP over TLS)", ["https", "tls", "ssl"]], [445, "tcp", "SMB (Microsoft-DS)", ["smb", "samba", "cifs"]],
  [465, "tcp", "SMTPS (SMTP over TLS)", ["smtps"]], [514, "udp", "Syslog", ["syslog"]], [587, "tcp", "SMTP submission (STARTTLS)", ["smtp submission"]], [631, "tcp", "IPP (printing, CUPS)", ["ipp", "cups"]], [636, "tcp", "LDAPS", ["ldaps"]], [853, "tcp", "DNS over TLS", ["dns over tls", "dot"]],
  [873, "tcp", "rsync", ["rsync"]], [989, "tcp", "FTPS data", []], [990, "tcp", "FTPS control", ["ftps"]], [993, "tcp", "IMAPS", ["imaps"]], [995, "tcp", "POP3S", ["pop3s"]], [1080, "tcp", "SOCKS proxy", ["socks"]], [1194, "udp", "OpenVPN", ["openvpn"]], [1433, "tcp", "Microsoft SQL Server", ["mssql", "sql server", "microsoft sql"]],
  [1521, "tcp", "Oracle database listener", ["oracle"]], [1723, "tcp", "PPTP VPN", ["pptp"]], [1883, "tcp", "MQTT", ["mqtt"]], [2049, "tcp/udp", "NFS", ["nfs"]], [2375, "tcp", "Docker daemon (unencrypted)", ["docker"]], [2376, "tcp", "Docker daemon (TLS)", []], [3000, "tcp", "common dev server (Node, Rails, Grafana)", ["grafana", "node dev server"]],
  [3306, "tcp", "MySQL / MariaDB", ["mysql", "mariadb"]], [3389, "tcp", "RDP (Remote Desktop)", ["rdp", "remote desktop"]], [4444, "tcp", "Metasploit default handler (also a common backdoor port)", ["metasploit"]], [5000, "tcp", "common dev server (Flask, UPnP)", ["flask"]], [5060, "tcp/udp", "SIP", ["sip"]], [5432, "tcp", "PostgreSQL", ["postgres", "postgresql"]],
  [5900, "tcp", "VNC", ["vnc"]], [5938, "tcp", "TeamViewer", ["teamviewer"]], [6379, "tcp", "Redis", ["redis"]], [6443, "tcp", "Kubernetes API server", ["kubernetes", "k8s"]], [6667, "tcp", "IRC (unencrypted)", []], [8000, "tcp", "common dev HTTP server (Django, python -m http.server)", ["django"]],
  [8080, "tcp", "HTTP alternate / proxies (Tomcat, Jenkins)", ["tomcat", "jenkins", "http alt"]], [8443, "tcp", "HTTPS alternate", []], [9000, "tcp", "SonarQube / PHP-FPM / Portainer", ["sonarqube", "php-fpm"]], [9090, "tcp", "Prometheus", ["prometheus"]], [9200, "tcp", "Elasticsearch", ["elasticsearch"]], [11211, "tcp", "Memcached", ["memcached"]], [27017, "tcp", "MongoDB", ["mongodb", "mongo"]],
  [51820, "udp", "WireGuard", ["wireguard"]],
];
const PORT_BY_NAME = new Map(); for (const p of PORTS) for (const n of p[3]) PORT_BY_NAME.set(n, p);
const PORT_NAMES = [...PORT_BY_NAME.keys()].sort((a, b) => b.length - a.length);

// words the typo corrector must leave alone (city names, service names, tool nouns)
export const VOCAB = [...new Set([...ZONE_KEYS.flatMap((k) => k.split(" ")), ...PORT_NAMES.flatMap((k) => k.split(/[\s-]/)), "uuid", "guid", "uuids", "guids", "lorem", "ipsum", "bmi", "mortgage", "loan", "tip", "coin", "dice", "die", "d20", "d6", "d10", "d12", "d8", "d4", "d100", "steps", "noon", "midnight", "am", "pm", "utc", "gmt", "shuffle", "pick", "choose", "port", "ports", "https", "http", "ssh", "ftp", "smtp", "dns", "rdp", "vnc", "mysql", "postgres", "redis", "mongodb",
  "json", "cron", "crontab", "minify", "minified", "prettify", "validate", "weekday", "weekdays", "weekends", "hourly", "derivative", "integral", "antiderivative", "differentiate", "integrate", "wrt", "forecast", "bitcoin", "btc", "eth", "ethereum",
  "usd", "eur", "gbp", "jpy", "cny", "inr", "aud", "cad", "chf", "nzd", "sek", "nok", "dkk", "krw", "brl", "mxn", "zar", "sgd", "hkd", "rub", "pln", "thb", "idr", "php", "myr", "vnd", "aed", "sar", "ils", "czk", "huf", "euros", "rupees", "yen", "yuan", "pesos", "rubles",
  "bitwise", "xor", "nand", "nor", "shl", "shr", "ascii", "unicode", "utf", "codepoint", "cidr", "subnet", "loopback", "localhost", "passphrase", "pwd", "entities", "unescape", "escape", "epoch", "unix", "posix", "timestamp", "iso", "multicast", "broadcast", "wildcard", "http", "https", "prime", "primes",
  "military", "pace", "mpg", "fuel", "mileage", "gallon", "gallons", "zodiac", "horoscope", "astrological", "generation", "millennial", "millennials", "boomer", "boomers", "anagram", "anagrams", "acronym", "initialism", "initials", "pizzas", "pizza", "overtime", "salary", "biweekly", "fortnight", "marathon", "puppy", "kitten", "chinese", "lunar", "sagittarius", "capricorn", "aquarius", "pisces", "aries", "taurus", "gemini", "leo", "virgo", "libra", "scorpio", "petrol", "diesel", "litre", "litres",
  "spanish", "french", "german", "italian", "portuguese", "japanese", "chinese", "mandarin", "korean", "russian", "arabic", "hindi", "dutch", "swedish", "latin", "greek", "turkish", "polish", "hebrew", "vietnamese", "thai", "tagalog", "filipino", "indonesian", "swahili"]).values()].filter((w) => w.length > 1);

// ---------------------------------------------------------------------------
// ask(): which everyday tool does this line want? (null = not one of these)
// ---------------------------------------------------------------------------
const RATE = "(mph|miles per hour|miles an hour|km/h|kmh|kph|km per hour|kilometers per hour|kilometres per hour|km an hour|m/s|meters per second|metres per second|knots?)";
const DIST = "(miles?|mi|km|kilometers?|kilometres?|m|meters?|metres?|nautical miles?|nm)";
export function ask(input) {
  const s = String(input || "").trim().replace(/\s+/g, " ");
  const low = s.toLowerCase().replace(/[?!.]+$/, "").replace(/\s+/g, " ");
  let m;
  // --- clock arithmetic ---
  if (hasClock(low)) {
    m = low.match(new RegExp("(?:how (?:many|much) (?:hours?|minutes?|time)|how long|hours?|minutes?|time|duration)\\b.*?(?:between|from|since)\\s+(" + TIME + ")\\s+(?:and|to|until|till|through)\\s+(" + TIME + ")$", "i"))
      || low.match(new RegExp("^(?:from\\s+)?(" + TIME + ")\\s+(?:to|until|till|-|–)\\s+(" + TIME + ")(?:\\s+(?:is )?how (?:long|many hours))?$", "i"));
    if (m) {
      const a = parseTime(m[1]); let b = parseTime(m[5]);
      // "9 to 5" with no am/pm: the second is the afternoon, as people mean it
      const bare = !/am|pm|noon|midnight|:/i.test(m[1] + m[5]);
      const pmAssumed = bare && a != null && b != null && b < a && b <= 12 * 60;
      if (pmAssumed) b += 12 * 60;
      if (a != null && b != null) return { kind: "between", a, b, aTxt: m[1], bTxt: m[5], pmAssumed };
    }
    const core = low.replace(/^(?:what time (?:is it |will it be |was it |is |it is )?|what is |whats |what's |calculate |find |tell me )/, "").replace(/^in\s+(?=\d)/, "").trim();
    let timeTxt, sign, n1, u1, n2;
    const shapeA = core.match(new RegExp("^(?:(add|plus|subtract|minus|take)\\s+)?" + NUM + "\\s*(hours?|hrs?|h|minutes?|mins?|m)(?:\\s+and\\s+" + NUM + "\\s*(?:minutes?|mins?|m))?\\s+(after|from|before|to|until|later than|earlier than|past)\\s+(" + TIME + ")$", "i"));
    const shapeB = shapeA ? null : core.match(new RegExp("^(" + TIME + ")\\s*(\\+|-|plus|minus|in|after)\\s*" + NUM + "\\s*(hours?|hrs?|h|minutes?|mins?|m)(?:\\s+and\\s+" + NUM + "\\s*(?:minutes?|mins?|m))?$", "i"));
    if (shapeA) {
      const verb = shapeA[1] || "", rel = shapeA[5];
      sign = (/subtract|minus|take/.test(verb) || /before|until|earlier/.test(rel)) ? -1 : 1;
      n1 = +shapeA[2]; u1 = shapeA[3]; n2 = shapeA[4] ? +shapeA[4] : 0; timeTxt = shapeA[6];
    } else if (shapeB) {
      timeTxt = shapeB[1]; sign = /^(?:-|minus)$/.test(shapeB[5]) ? -1 : 1; n1 = +shapeB[6]; u1 = shapeB[7]; n2 = shapeB[8] ? +shapeB[8] : 0;
    }
    if (shapeA || shapeB) {
      const t = parseTime(timeTxt); if (t == null) return null;
      const mins = (/^h/.test(u1) ? n1 * 60 : n1) + n2;
      return { kind: "clockadd", t, tTxt: timeTxt, delta: sign * mins, ampm: /am|pm|a\.m|p\.m|noon|midnight/i.test(timeTxt) };
    }
  }
  // --- current time somewhere ---
  m = low.match(/^(?:what(?:'s| is|s) the |what )?(?:current |local |exact )?time(?: is it| now| right now)?(?: right now| now)? in (?:the )?([a-z .'à-ÿ]+?)(?: right now| now| at the moment| currently)?$/)
    || low.match(/^(?:current |local )?time in ([a-z .'à-ÿ]+)$/) || low.match(/^([a-z .'à-ÿ]+?) (?:current |local )?time(?: now| right now)?$/)
    || low.match(/^what time is it (?:right now |now )?in ([a-z .'à-ÿ]+)$/);
  if (m) { const z = zoneOf(m[1]); if (z) return { kind: "tz", place: m[1].trim(), ...z }; if (/^(?:what|current|local|time)/.test(low)) return { kind: "tz", place: m[1].trim(), tz: null }; }
  // --- random draws ---
  if (/^(?:flip|toss) (?:a |the )?coin$|^coin (?:flip|toss)$|^heads or tails$/.test(low)) return { kind: "coin" };
  m = low.match(/^(?:roll|throw) (?:a |the |an |two |three |2 |3 |4 |\d+ )?(?:(\d*)d(\d+)|dice|die|d(\d+)|(\d+)[- ]sided (?:die|dice))$|^(?:dice|die) roll$|^(?:roll )?(\d*)d(\d+)$/);
  if (m) { const count = +(m[1] || m[5] || (low.match(/\b(two|2)\b/) ? 2 : low.match(/\b(three|3)\b/) ? 3 : low.match(/\b(\d+) dice/) ? RegExp.$1 : 1)) || 1; const sides = +(m[2] || m[3] || m[4] || m[6] || 6); if (sides >= 2 && sides <= 1000 && count >= 1 && count <= 100) return { kind: "dice", count, sides }; }
  m = low.match(new RegExp("^(?:(?:give me |pick |choose |generate |get |make )?(?:a |an )?random (?:number|integer|int|value)(?: between| from)?|pick a number(?: between| from)?|random)\\s*" + NUM + "?\\s*(?:and|to|-|through)?\\s*" + NUM + "?$"));
  if (m && /random|pick a number/.test(low)) { let lo = m[1] != null ? +m[1] : 1, hi = m[2] != null ? +m[2] : (m[1] != null ? null : 100); if (hi == null) { hi = lo; lo = 1; } if (lo > hi) [lo, hi] = [hi, lo]; if (hi - lo <= 1e15) return { kind: "randnum", lo, hi }; }
  m = low.match(/^random (?:number|integer|int) (?:up to|under|below|less than|to) (\d+)$/); if (m) return { kind: "randnum", lo: 1, hi: +m[1] };
  m = s.match(/^(?:(?:should|shall|can|could|would) (?:i|you|we) |help me |please )?(?:pick|choose|decide|select)(?: one| for me| between| from| among| out of|:)*\s+(.+)$/i);
  if (m && /(?:,| or | and |\/)/.test(m[1]) && !/\bnumber\b/i.test(low)) {
    const opts = m[1].replace(/\s+(?:or|and)\s+/gi, ",").split(/\s*[,\/]\s*/).map((x) => x.replace(/[?.!]+$/, "").trim()).filter(Boolean);
    if (opts.length >= 2 && opts.length <= 50) return { kind: "pick", opts };
  }
  m = s.match(/^shuffle(?: these| this| the list| the| :)?[: ]\s*(.+)$/i);
  if (m) { const opts = m[1].split(/\s*,\s*|\s+/).filter(Boolean); if (opts.length >= 2 && opts.length <= 200) return { kind: "shuffle", opts }; }
  if (/^(?:(?:generate|make|create|give me|get|new|random|a|an) )*(?:uuid|guid|uuid ?v4|uuid4)s?(?: v4)?$/.test(low)) return { kind: "uuid", n: 1 };
  m = low.match(/^(?:generate |make |give me |create )?(\d+) (?:random )?(?:uuid|guid)s?$/); if (m && +m[1] >= 1 && +m[1] <= 50) return { kind: "uuid", n: +m[1] };
  // --- placeholder text ---
  m = low.match(/^(?:generate |give me |make |write |some |)(?:(\d+) (words?|sentences?|paragraphs?) of )?lorem(?: ipsum)?(?: text| placeholder(?: text)?)?(?: (\d+) (words?|sentences?|paragraphs?))?$/) || low.match(/^(?:(\d+) (words?|sentences?|paragraphs?) of )?(?:placeholder|dummy|filler) text(?: (\d+) (words?|sentences?|paragraphs?))?$/);
  if (m) { const n = +(m[1] || m[3] || 3), u = (m[2] || m[4] || "sentences").replace(/s?$/, "s"); if (n >= 1 && n <= 500) return { kind: "lorem", n, unit: u }; }
  // --- tip ---
  if (/\btip\b/.test(low) && /\d/.test(low) && !/\btip (?:of the|for (?:the )?day)\b/.test(low)) {
    const pct = low.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)/);
    const amt = low.replace(/(\d+(?:\.\d+)?)\s*(?:%|percent)/, " ").match(/\$?\s*(\d[\d,]*(?:\.\d+)?)/);
    const ways = low.match(/(?:split|between|among|for|shared by)\s+(\d+)\s*(?:people|persons|ways|of us|friends|guests|diners)/);
    if (amt) { const bill = money(amt[1]); if (bill > 0 && bill < 1e7) return { kind: "tip", bill, pct: pct ? +pct[1] : null, ways: ways ? +ways[1] : null }; }
  }
  // --- BMI ---
  if (/\bbmi\b|body mass index/.test(low)) {
    const kg = low.match(/(\d+(?:\.\d+)?)\s*(kg|kgs|kilos?|kilograms?)\b/), lb = low.match(/(\d+(?:\.\d+)?)\s*(lbs?|pounds?)\b/);
    const cm = low.match(/(\d+(?:\.\d+)?)\s*(cm|centimet(?:er|re)s?)\b/), mt = low.match(/(\d(?:\.\d+)?)\s*(m|met(?:er|re)s?)\b/), ftin = low.match(/(\d)\s*(?:'|ft|feet|foot)\s*(\d{1,2})?\s*(?:"|''|in|inches)?/), inch = low.match(/(\d{2,3})\s*(?:in|inches)\b/);
    const wkg = kg ? +kg[1] : lb ? +lb[1] * 0.45359237 : null;
    const hm = cm ? +cm[1] / 100 : mt ? +mt[1] : ftin ? (+ftin[1] * 12 + +(ftin[2] || 0)) * 0.0254 : inch ? +inch[1] * 0.0254 : null;
    if (wkg && hm && wkg > 10 && wkg < 500 && hm > 0.9 && hm < 2.6) return { kind: "bmi", wkg, hm, wTxt: (kg || lb)[0].trim(), hTxt: (cm || mt || ftin || inch)[0].trim() };
  }
  // --- loan / mortgage payment ---
  if (/\b(mortgage|loan|finance|financing|borrow(?:ing)?|car payment|monthly payment)\b/.test(low) && /%|percent/.test(low)) {
    const P = low.match(/\$\s*(\d[\d,]*(?:\.\d+)?k?)|(\d[\d,]*(?:\.\d+)?k?)\s*(?:dollars|usd|bucks)|\b(?:of|on|for|borrow(?:ing)?|loan|mortgage|finance|financing)\s+(?:a |an |the |my )?\$?(\d[\d,]*(?:\.\d+)?k?)\b(?!\s*(?:%|percent|years?|months?|yrs?))/);
    const R = low.match(/(\d+(?:\.\d+)?)\s*(?:%|percent)/);
    const T = low.match(/(\d+(?:\.\d+)?)\s*(years?|yrs?|months?|mos?)\b/);
    if (P && R && T) { const p = money(P[1] || P[2] || P[3]); const months = /^m/.test(T[2]) ? +T[1] : +T[1] * 12; if (p > 0 && +R[1] >= 0 && months >= 1 && months <= 1200) return { kind: "loan", p, rate: +R[1], months, term: T[0] }; }
  }
  // --- regular saving ---
  m = low.match(/(?:save|saving|put away|set aside|invest|deposit|contribute)\s+(?:\$\s*)?(\d[\d,]*(?:\.\d+)?)\s*(?:dollars|usd|bucks)?\s+(?:a|per|each|every)\s+(day|week|month|year)\b/);
  if (m) {
    const T = low.match(/(?:for|in|over|after|within)\s+(\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|ten|twenty)\s*(years?|yrs?|months?|weeks?|days?)\b/);
    const R = low.match(/(?:at|with|earning|@)\s+(\d+(?:\.\d+)?)\s*(?:%|percent)/);
    const WORDN = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, ten: 10, twenty: 20 };
    if (T) return { kind: "save", amt: money(m[1]), per: m[2], n: WORDN[T[1]] || +T[1], unit: T[2].replace(/s$/, "").replace(/^yr$/, "year"), rate: R ? +R[1] : null };
  }
  // --- travel time / distance / speed ---
  m = low.match(new RegExp("^(?:how long (?:does it take |will it take |would it take |do i need |to )?(?:to )?(?:travel|drive|go|walk|run|cycle|ride|cover|fly|sail|bike) |travel time (?:for )?)" + NUM + "\\s*" + DIST + " at " + NUM + "\\s*" + RATE + "$"));
  if (m) return { kind: "travel", d: +m[1], du: m[2], v: +m[3], vu: m[4] };
  m = low.match(new RegExp("^how long (?:does it take |will it take |would it take |to )?(?:to )?(?:travel|drive|go|walk|run|cycle|ride|cover|fly|sail|bike) " + NUM + "\\s*" + DIST + " (?:at|going|doing) " + NUM + "$"));
  if (m) return null; // speed with no unit: not claimed
  // --- steps to distance (an estimate, said so) ---
  m = low.match(/^(?:how (?:far|many (?:miles|km|kilometers|meters)) (?:is|are) |how far is )?(\d[\d,]*)\s*steps(?: (?:in|to|into) (miles?|km|kilometers?|kilometres?|meters?|metres?|feet|ft))?$/) || low.match(/^(\d[\d,]*)\s*steps (?:in|to|into|=) (miles?|km|kilometers?|kilometres?|meters?|metres?|feet|ft)$/);
  if (m) return { kind: "steps", n: +m[1].replace(/,/g, ""), unit: m[2] || null };
  // --- ports ---
  m = low.match(/^(?:what|which)(?: is| are)?(?: the)?(?: default| standard| common| well[- ]known)? port(?: number)?s? (?:does|do|is|for|of|used by|used for|is used (?:by|for))\s+(?:the |a |an )?(.+?)(?: use| run on| listen on| use by default)?$/)
    || low.match(/^(.+?) (?:default |standard )?port(?: number)?$/) || low.match(/^(?:default |standard )?port (?:for|of) (?:the )?(.+)$/) || low.match(/^what does (.+?) (?:run|listen) on$/);
  if (m) { const name = m[1].trim().replace(/^(?:the |a |an )/, ""); const key = PORT_NAMES.find((n) => n === name) || PORT_NAMES.find((n) => new RegExp("(?:^|\\s)" + n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?:\\s|$)").test(name)); if (key) return { kind: "port", name: key, entry: PORT_BY_NAME.get(key) }; }
  m = low.match(/^(?:what (?:is|runs on|uses|listens on)|whats|what's|which service (?:uses|runs on)|service on|tcp|udp)?\s*port (\d{1,5})(?: (?:used )?for| do| does| is)?$/) || low.match(/^what (?:is|runs on|uses) (?:tcp |udp )?port (\d{1,5})$/) || low.match(/^(?:what|which) port is (\d{1,5})$/);
  if (m) { const n = +m[1]; const e = PORTS.find((p) => p[0] === n); return { kind: "portnum", n, entry: e || null }; }
  // --- years ago / from now ---
  m = low.match(/^(?:what|which) year (?:was (?:it )?|is )?(\d+) years? ago$/) || low.match(/^(\d+) years? ago(?: was)? (?:what|which) year$/) || low.match(/^(\d+) years ago$/);
  if (m) return { kind: "yearago", n: +m[1] };
  m = low.match(/^(?:what|which) year (?:will it be |is it |is )?(?:in )?(\d+) years?(?: from now| from today| later| time)?$/) || low.match(/^(?:in )?(\d+) years from now(?: is)? (?:what|which) year$/);
  if (m) return { kind: "yearahead", n: +m[1] };
  m = low.match(/^(?:what year |when )(?:was|were) (?:i|you|someone|a person|they|he|she) born (?:if|when) (?:i am|i'm|you are|you're|they are|they're|he is|she is|someone is|aged?)?\s*(\d{1,3})(?: years old| years| yo)?$/) || low.match(/^(?:birth year|year of birth|born year) (?:for|if|of) (?:someone |a person |age )?(?:aged? |who is )?(\d{1,3})(?: years old)?$/) || low.match(/^if (?:i am|i'm|you are|someone is) (\d{1,3})(?: years old)?,? (?:what year|when) (?:was|were) (?:i|you|they) born$/);
  if (m) return { kind: "birthyear", age: +m[1] };
  // --- random colour ---
  if (/^(?:(?:pick|choose|give me|generate|make|suggest|show me)\s+)?(?:me\s+)?(?:a\s+|any\s+)?random\s+(?:hex\s+|rgb\s+)?colou?r(?: code| hex| value| please)?$/.test(low) || /^random colou?r$/.test(low)) return { kind: "randcolor" };
  // --- JSON tools: format / minify / validate a pasted document ---
  if (/\bjson\b/.test(low) && /[[{]/.test(s)) {
    const a = Math.min(...[s.indexOf("{"), s.indexOf("[")].filter((i) => i >= 0)), b = Math.max(s.lastIndexOf("}"), s.lastIndexOf("]"));
    if (a >= 0 && b > a) {
      const head = (s.slice(0, a) + " " + s.slice(b + 1)).toLowerCase();
      const op = /\b(minif|compact|one line|single line|compress)/.test(head) ? "minify" : /\b(valid|check|lint|is this|correct)/.test(head) ? "validate" : /\b(format|pretty|beautif|indent|prettif|tidy|clean|write|show|print|display|output|dump|render|parse)/.test(head) ? "format" : /^\s*json\s*:?\s*$/.test(head) ? "format" : null;
      if (op) return { kind: "json", op, payload: s.slice(a, b + 1) };
    }
  }
  // --- cron expression builder (only when cron/crontab is named: the 5-field format is specific) ---
  if (/\bcron(?:tab| job| expression| schedule| string| syntax)?\b/.test(low) && !/\bhow (?:do|to|does)\b|\bwhat is (?:a )?cron\b|\bexplain\b/.test(low)) {
    const c = cronOf(low.replace(/\b(?:cron(?:tab| job| expression| schedule| string| syntax)?)\b/g, " ").replace(/\b(?:for|to|that runs|run|runs|which runs|running|a|an|the|please|me|give|make|build|create|write|generate|schedule|scheduled|i want|i need|expression)\b/g, " ").replace(/\s+/g, " ").trim());
    if (c) return { kind: "cron", ...c };
  }
  // --- calculus: pointed at Quelvra, which carries the CAS (DI does not) ---
  m = low.match(/^(?:what is |whats |what's |find |compute |calculate |give me )?(?:the )?(derivative|integral|antiderivative|limit)\s+of\s+(.+)$/) || low.match(/^(differentiate|integrate)\s+(.+)$/) || low.match(/^(d\/dx)\s*\(?\s*(.+?)\s*\)?$/);
  if (m && /[\d^()]|\b[a-z]\b/.test(m[2]) && !/^(?:a|an|the)\b/.test(m[2]) && !/\bin (?:python|javascript|js|java|c|rust|go)\b/.test(low)) return { kind: "calculus", what: m[1], expr: m[2].replace(/\s+(?:with respect to|wrt)\s+[a-z]$/, "") };
  // --- live data this offline engine cannot have (weather, news, prices, scores) ---
  m = low.match(/\b(weather|forecast|temperature (?:outside|today|right now|tomorrow)|is it (?:raining|snowing|sunny|cold|hot|windy)(?: outside| today| now)?|(?:will|is) it (?:going to )?rain|news|headlines|stock price|share price|(?:price|value) of (?:bitcoin|btc|eth|ethereum|gold|silver|oil|a stock|[a-z]+ stock)|bitcoin price|exchange rate|(?:latest|current|live) (?:score|scores|results?|price|prices)|who won (?:the|last|yesterday'?s?)|traffic (?:right now|now|today))\b/);
  if (m && !/\bjson\b|\bapi\b|\bfetch\b|\bcode\b|\bpython\b|\bjavascript\b/.test(low)) return { kind: "nolive", topic: m[1].split(" ")[0].replace(/^(?:is|will)$/, "weather") };
  // --- bitwise: xor / and / or / shifts on integers (round 8) ---
  m = low.match(/^(?:what is |whats |compute |calculate )?(?:bitwise )?(xor|and|or|nand|nor)\s+(-?\d+|0x[0-9a-f]+|0b[01]+)\s+(?:and|with|,)\s+(-?\d+|0x[0-9a-f]+|0b[01]+)$/) || low.match(/^(?:what is |whats |compute |calculate )?(-?\d+|0x[0-9a-f]+|0b[01]+)\s+(?:bitwise )?(xor|and|or|nand|nor|<<|>>|shl|shr|left shift|right shift|shifted left(?: by)?|shifted right(?: by)?)\s+(-?\d+|0x[0-9a-f]+|0b[01]+)(?: bits?)?(?: bitwise)?$/) || low.match(/^(?:what is |whats )?(-?\d+|0x[0-9a-f]+|0b[01]+)\s*(\^|&|\|)\s*(-?\d+|0x[0-9a-f]+|0b[01]+)\s+(?:bitwise|as bits|in binary|xor|and|or)$/);
  if (m) {
    const opWord = /^(?:xor|and|or|nand|nor)$/.test(m[1]) ? m[1] : m[2], A = /^(?:xor|and|or|nand|nor)$/.test(m[1]) ? m[2] : m[1], B = m[3];
    const op = ({ "^": "xor", "&": "and", "|": "or", "<<": "shl", ">>": "shr", "left shift": "shl", "right shift": "shr", "shifted left": "shl", "shifted left by": "shl", "shifted right": "shr", "shifted right by": "shr" })[opWord] || opWord;
    // a bare "5 and 3" / "5 or 3" is English, not an operator: claim it only with "bitwise" or a hex/binary literal
    if (!((op === "and" || op === "or") && !/\bbitwise\b|0x|0b/.test(low))) return { kind: "bitwise", op, a: A, b: B };
  }
  m = low.match(/^(?:what is |whats )?(?:bitwise )?not\s+(\d+|0x[0-9a-f]+|0b[01]+)(?: (?:as|in) (\d+)[- ]bits?)?$/) || low.match(/^(?:what is |whats )?~\s*(\d+|0x[0-9a-f]+|0b[01]+)(?: (?:as|in) (\d+)[- ]bits?)?$/);
  if (m) return { kind: "bitwise", op: "not", a: m[1], b: m[2] || null };
  // --- next / previous prime ---
  m = low.match(/^(?:what is |whats |find )?(?:the )?(?:(?:next|first|smallest) )?prime (?:number )?(?:after|above|greater than|bigger than|larger than|following|from|>) (\d+)$/);
  if (m && +m[1] <= 1e12) return { kind: "nearprime", dir: "next", n: +m[1] };
  m = low.match(/^(?:what is |whats |find )?(?:the )?(?:(?:previous|last|largest|biggest|greatest) )?prime (?:number )?(?:before|below|under|less than|smaller than|<) (\d+)$/);
  if (m && +m[1] <= 1e12) return { kind: "nearprime", dir: "prev", n: +m[1] };
  m = low.match(/^(?:what is |whats |find )?(?:the )?(?:nearest|closest) prime (?:number )?to (\d+)$/);
  if (m && +m[1] <= 1e12) return { kind: "nearprime", dir: "near", n: +m[1] };
  // --- word and letter statistics on a phrase ---
  m = low.match(/^(?:what is |whats |find |give me |tell me )?(?:the )?(longest|shortest) word (?:in|of) (?:the )?(?:sentence |text |phrase |string |following )?[:"']?\s*(.+?)["']?$/);
  if (m) return { kind: "wordlen", which: m[1], text: s.slice(s.length - m[2].length).replace(/["']$/, "") };
  m = low.match(/^(?:count |find )?how many (?:times )?(?:does |is |are )?(?:the )?letter ([a-z]) (?:appears?|occurs?|is there|are there|in|is in|shows? up)(?: in)? (?:the )?(?:word |sentence |text |phrase |string )?[:"']?\s*(.+?)["']?$/) || low.match(/^count (?:the )?(?:number of )?(?:letter )?([a-z])(?:'s|s)? (?:in|of) (?:the )?(?:word |sentence |text |phrase |string )?[:"']?\s*(.+?)["']?$/) || low.match(/^how many ([a-z])(?:'s|s)? (?:are |is )?(?:there )?in (?:the )?(?:word |sentence |text |phrase |string )?[:"']?\s*(.+?)["']?$/) || low.match(/^(?:number of|occurrences of) (?:the )?(?:letter )?([a-z])(?:'s|s)? in (?:the )?(?:word |sentence |text |phrase |string )?[:"']?\s*(.+?)["']?$/);
  if (m && m[2].length > 1) return { kind: "lettercount", letter: m[1], text: s.slice(s.length - m[2].length).replace(/["']$/, "") };
  // --- a plain number of seconds/minutes as a readable duration ---
  m = low.match(/^(?:how long is |how long are |what is |whats |convert |express |write )?(\d[\d,]*(?:\.\d+)?)\s*(seconds?|secs?|s|minutes?|mins?|hours?|hrs?)(?: (?:to|in|into|as) (?:hours?,? ?minutes?(?:,? ?(?:and )?seconds?)?|hours and minutes|minutes and seconds|h:?m:?s|hms|hh:mm:ss|hh:mm|days,? ?hours,? ?(?:and )?minutes|days and hours|a (?:readable |human(?:-readable)? )?(?:duration|time)|(?:a )?(?:readable|human|human-readable) (?:form|format)|time|clock time))?$/);
  if (m && (/^how long|^express|^write|(?:to|in|into|as) /.test(low)) && !/^(?:what is |whats |convert )\d[\d,]*(?:\.\d+)?\s*(?:seconds?|secs?|s|minutes?|mins?|hours?|hrs?)$/.test(low)) { const secs = money(m[1]) * (/^s/.test(m[2]) ? 1 : /^m/.test(m[2]) ? 60 : 3600); if (secs >= 0 && secs < 1e12) return { kind: "duration", secs, src: m[1] + " " + m[2] }; }
  // --- random password (a real one; a password *generator* program stays with the code library) ---
  m = low.match(/^(?:(?:generate|make|create|give me|suggest|i need|need|get me|pick|produce)\s+(?:me\s+)?)?(?:a\s+|an\s+)?(?:new\s+|random\s+|strong\s+|secure\s+|safe\s+|good\s+|long\s+)*(?:random\s+|strong\s+|secure\s+|safe\s+|good\s+)?(?:(\d{1,3})[- ](?:char(?:acter)?|letter|digit)s?\s+)?(?:pass(?:word|phrase|code)|pwd)(?:\s+(?:of|with|that is|thats|that's|which is)\s+(\d{1,3})\s*(?:char(?:acter)?s?|letters|digits|long)?(?:\s+long)?)?(?:\s+(?:please|for me|pls))?$/);
  if (m && !/\b(?:generator|function|script|code|program|python|javascript|js|java|rust|bash|go|golang|how)\b/.test(low)) { const n = +(m[1] || m[2] || 20); if (n >= 8 && n <= 128) return { kind: "randpass", n, phrase: /passphrase/.test(low) }; }
  // --- html escape / unescape ---
  m = s.match(/^(?:html[- ]?)?(escape|unescape|encode|decode|entities for|entity encode|entity decode)\s+(?:(?:the|this|my)\s+)?(?:html\s+|as html\s+|for html\s+|html entities\s+)?(?:[:\-]\s*)?([\s\S]+)$/i) || s.match(/^(escape|unescape|encode|decode)\s+([\s\S]+?)\s+(?:as|for|to|from|into)\s+html(?:\s+entities)?$/i);
  if (m && /\bhtml\b/i.test(s) && !/\b(?:in|with|using)\s+(?:python|javascript|js|php|java|c#|go|rust)\b/i.test(s)) { const op = /^(?:unescape|decode|entity decode)$/i.test(m[1]) ? "unescape" : "escape"; const pay = m[2].replace(/^(?:string|text|this|the following)\s*[:\-]?\s*/i, "").trim(); if (pay) return { kind: "html", op, payload: pay }; }
  // --- character codes: ascii / unicode both ways ---
  m = s.match(/^(?:what is |whats |what's |give me |find )?(?:the )?(?:ascii|unicode|utf-?8|char(?:acter)? code|code ?point|character number|ascii value|ascii code|unicode value|unicode code ?point|char code)(?: (?:code|value|number|point))?(?: (?:of|for))? (?:the )?(?:letter |character |char |symbol |sign )?["']?(\S)["']?$/i) || s.match(/^(?:what is |whats |what's )?(?:the )?(?:letter |character |char |symbol )?["']?(\S)["']? (?:in|as|to) (?:ascii|unicode|decimal|a char code|char code|code point|utf-?8|hex)$/i);
  if (m) return { kind: "charcode", ch: m[1] };
  // "unicode of the euro sign", "ascii code for tab": named characters from the small name table
  m = low.match(/^(?:what is |whats |what's |give me |find )?(?:the )?(?:ascii|unicode|utf-?8|char(?:acter)? code|code ?point|ascii code|unicode value|unicode code ?point|char code)(?: (?:code|value|number|point))?(?: (?:of|for))? (?:the |a )?(.+?)(?: (?:character|symbol|char))?$/);
  if (m) { const want = m[1].replace(/^(?:the |a )/, ""); for (const k in CHAR_NAMES) if (CHAR_NAMES[k] === want || CHAR_NAMES[k].replace(/ \(.*\)$/, "") === want || CHAR_NAMES[k].replace(/ sign$/, "") === want.replace(/ sign$/, "")) return { kind: "charcode", ch: String.fromCodePoint(+k) }; }
  m = low.match(/^(?:what|which) (?:character|char|letter|symbol) (?:is|has|corresponds to|is at|for) (?:the )?(?:ascii|unicode|char(?:acter)? code|code ?point|code)? ?(?:code |value |number )?(?:u\+)?([0-9]{1,7}|u\+[0-9a-f]{4,6}|0x[0-9a-f]{1,6})$/) || low.match(/^(?:ascii|unicode|char(?:acter)?|chr|code ?point) (?:code |value |number )?(?:of |for )?(?:u\+)?([0-9]{1,7}|u\+[0-9a-f]{4,6}|0x[0-9a-f]{1,6})(?: (?:as|to|in) (?:a )?(?:char(?:acter)?|letter|text|symbol))?$/) || low.match(/^(u\+[0-9a-f]{4,6})$/);
  if (m) { const t = m[1]; const cp = /^u\+/.test(t) ? parseInt(t.slice(2), 16) : /^0x/.test(t) ? parseInt(t.slice(2), 16) : +t; if (cp >= 0 && cp <= 0x10ffff) return { kind: "charfrom", cp, src: t }; }
  // --- IP addresses and CIDR blocks ---
  m = low.match(/(\b(?:\d{1,3}\.){3}\d{1,3}\b)(?:\/(\d{1,2})\b)?/);
  const cidrOnly = low.match(/(?:^|\s|a )\/(\d{1,2})\b/);
  if (m && /\b(?:ip|ips|address|addresses|private|public|loopback|localhost|subnet|(?:net)?mask|cidr|network|broadcast|range|hosts?|usable|what is|whats|what kind|what type|is)\b/.test(low) && !/\bport\b|\bping\b|\bcurl\b|\bssh\b|\bhttp/.test(low)) {
    const oct = m[1].split(".").map(Number); if (oct.every((o) => o <= 255)) return { kind: "ip", ip: m[1], prefix: m[2] != null ? +m[2] : null, wantsRange: /\b(?:subnet|(?:net)?mask|cidr|network|broadcast|range|hosts?|usable|first|last)\b/.test(low) };
  }
  if (cidrOnly && /\b(?:subnet|(?:net)?mask|cidr|hosts?|addresses|ips|usable|network|block|prefix)\b/.test(low) && +cidrOnly[1] <= 32) return { kind: "cidr", prefix: +cidrOnly[1], wantsHosts: /\bhosts?\b|\baddresses\b|\bips\b|\busable\b|\bhow many\b/.test(low) };
  // --- HTTP status codes ---
  m = low.match(/^(?:what (?:is|does|do) |whats |what's |explain |meaning of |define )?(?:an? |the )?(?:http |https |http\/\d(?:\.\d)? |status |error |response )*(?:status |error |response |code |status code |error code |response code )*(\d{3})(?: (?:status|error|response|code|status code|error code|http|http status))*(?: mean| means| stand for| error| status| code| response)*$/);
  if (m && HTTP_STATUS[+m[1]] !== undefined && /\b(?:http|status|error|response|code|mean)\b/.test(low)) return { kind: "httpstatus", code: +m[1] };
  // --- round 9: clock formats ---
  m = low.match(/^(?:convert |what is |whats |what's |write |express )?(\d{1,2}):(\d{2})\s*(?:hours|hrs|h)?\s*(?:to|in|as|into)\s+(?:12[- ]?hour(?: time| format| clock)?|am\/?pm(?: time| format)?|12h|regular time|normal time|standard time)$/);
  if (m && +m[1] < 24 && +m[2] < 60) return { kind: "clockfmt", h: +m[1], mi: +m[2], to: "12" };
  m = low.match(/^(?:convert |what is |whats |what's |write |express )?(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)\s*(?:to|in|as|into)\s+(?:24[- ]?hour(?: time| format| clock)?|military(?: time| format)?|24h)$/);
  if (m && +m[1] >= 1 && +m[1] <= 12 && (!m[2] || +m[2] < 60)) { const pm = /^p/.test(m[3]); return { kind: "clockfmt", h: (+m[1] % 12) + (pm ? 12 : 0), mi: +(m[2] || 0), to: "24" }; }
  m = low.match(/^(?:what is |whats |what's |what time is |convert )?(\d{4})\s*(?:hours|hrs|h)?\s*(?:in|to|as|into|is what in|means in|means)?\s*(?:military(?: time| format)?|regular time|normal time|standard time|12[- ]?hour(?: time| format)?|24[- ]?hour(?: time)?)?$/);
  if (m && /military|regular|normal|standard|hour/.test(low) && +m[1].slice(0, 2) < 24 && +m[1].slice(2) < 60) return { kind: "clockfmt", h: +m[1].slice(0, 2), mi: +m[1].slice(2), to: "both", military: /military/.test(low) && !/regular|normal|standard|12/.test(low) };
  // --- round 9: a clock time relative to now ---
  m = low.match(new RegExp("^(?:what time (?:is it |will it be |is |it is )?|what is |whats |what's |time )?(?:in\\s+)?" + NUM + "\\s*(hours?|hrs?|h|minutes?|mins?|m)(?:\\s+(?:and\\s+)?" + NUM + "\\s*(?:minutes?|mins?|m))?\\s+(from now|from right now|later|ago|before now|earlier)$"))
    || low.match(new RegExp("^what time (?:will it be|is it|was it)\\s+(?:in\\s+)?" + NUM + "\\s*(hours?|hrs?|h|minutes?|mins?|m)(?:\\s+(?:and\\s+)?" + NUM + "\\s*(?:minutes?|mins?|m))?(?:\\s+(from now|later|ago|earlier))?$"));
  if (m) { const mins = (/^h/.test(m[2]) ? +m[1] * 60 : +m[1]) + (m[3] ? +m[3] : 0); return { kind: "fromnow", delta: /ago|before|earlier/.test(m[4] || "") ? -mins : mins }; }
  // --- round 9: pay and salary (40-hour week, 52 weeks = 2080 hours a year) ---
  m = low.match(new RegExp("^(?:what is |whats |what's |how much is )?(?:the |my )?(?:annual |yearly )?(?:salary|annual salary|yearly salary|income|pay|wage|earnings|annual income)\\s+(?:for|of|at|on|from|if (?:i|you) (?:make|earn))\\s+\\$?" + NUM + "k?(?:\\s+(?:dollars|bucks|usd))?\\s*(?:an|per|a|/|each)\\s*(?:hour|hr|h)$"))
    || low.match(new RegExp("^(?:what is |whats |what's |how much is )?\\$?" + NUM + "(?:\\s+(?:dollars|bucks|usd))?\\s*(?:an|per|a|/)\\s*(?:hour|hr|h)\\s+(?:is how much |is what |to |as |in |equals |= |converted to |annually |yearly |a year |per year |salary |annual salary |monthly |a month |per month |weekly |a week |per week |biweekly |daily |a day |per day )+(?:a |per |an )?(?:year|annual(?:ly)?|salary|yearly|annually|month|monthly|week|weekly|biweekly|fortnight|day|daily)?$"));
  if (m) { const per = /month/.test(low) ? "month" : /biweekly|fortnight/.test(low) ? "biweekly" : /week/.test(low) ? "week" : /\bday|daily/.test(low) ? "day" : "year"; return { kind: "pay", mode: "hourly", rate: +m[1], per }; }
  m = low.match(new RegExp("^(?:what is |whats |what's |how much is )?\\$?" + NUM + "(k)?(?:\\s+(?:dollars|bucks|usd))?\\s*(?:an|per|a|/)\\s*(?:year|yr|annum)(?:\\s+salary)?\\s+(?:is how much |is what |to |as |in |equals |= |converted to |broken down |per |a |an )+(?:per |a |an )?(hour(?:ly)?|hr|month(?:ly)?|week(?:ly)?|biweekly|fortnight(?:ly)?|day|daily|working day)$"))
    || low.match(new RegExp("^(?:how much is |what is |whats |what's )?(?:a |an )?(?:salary of )?\\$?" + NUM + "(k)?(?:\\s+(?:dollars|bucks|usd))?\\s+(?:a|per)\\s+year\\s+(?:per|an|a|in|as|to|by the|each)\\s+(hour(?:ly)?|hr|month(?:ly)?|week(?:ly)?|biweekly|fortnight(?:ly)?|day|daily|working day)$"))
    || low.match(new RegExp("^(?:what is |whats |what's )?(?:the )?(hourly|monthly|weekly|biweekly|daily) (?:rate|pay|wage|salary|equivalent|income|amount|breakdown) (?:of|for|on|from) (?:a |an )?(?:salary of |annual salary of |yearly salary of )?\\$?" + NUM + "(k)?(?:\\s+(?:dollars|bucks|usd))?(?:\\s+(?:a|per)\\s+year| salary| annual(?:ly)?| yearly| annual salary)?$"));
  if (m) { const flip = /^(hourly|monthly|weekly|biweekly|daily)$/.test(m[1]); const amt = flip ? +m[2] : +m[1], k = flip ? m[3] : m[2], w = flip ? m[1] : m[3]; const per = /^h/.test(w) ? "hour" : /month/.test(w) ? "month" : /biweekly|fortnight/.test(w) ? "biweekly" : /week/.test(w) ? "week" : "day"; return { kind: "pay", mode: "annual", amount: amt * (k ? 1000 : 1), per }; }
  m = low.match(new RegExp("^(?:what is |whats |what's |calculate )?(time and a half|time-and-a-half|double time|double-time|overtime(?: rate| pay)?|1\\.5x|1\\.5 x|2x)\\s+(?:of|on|for|at|from)\\s+\\$?" + NUM + "(?:\\s+(?:dollars|bucks|usd))?(?:\\s*(?:an|per|a|/)\\s*(?:hour|hr|h))?$"));
  if (m) return { kind: "pay", mode: "overtime", rate: +m[2], mult: /double|2x/.test(m[1]) ? 2 : 1.5, word: m[1] };
  m = low.match(new RegExp("^(?:pay for |wages for |earnings for |how much (?:is|for|do i (?:make|earn|get) for|will i (?:make|earn|get) for|would i (?:make|earn) for) |what is |whats |what's |total for )?" + NUM + "\\s*(?:hours?|hrs?|h)\\s+(?:at|x|times|@|for|of work at|worked at|of)\\s+\\$?" + NUM + "(?:\\s+(?:dollars|bucks|usd))?(?:\\s*(?:an|per|a|/|each)\\s*(?:hour|hr|h))?(?:\\s+(?:each|pay|rate))?$"));
  if (m) return { kind: "pay", mode: "hours", hours: +m[1], rate: +m[2] };
  // --- round 9: fuel economy ---
  m = low.match(new RegExp("^(?:(?:what is |whats |what's |calculate |find )?(?:the |my )?(?:fuel (?:consumption|economy|efficiency|usage|mileage)|gas mileage|mileage|consumption|mpg|l/100 ?km|km per liter|km/l|economy)\\s*:?\\s*)?(?:for |of |if |on |driving |i drove |i drive |a car (?:that )?(?:does|goes|drives|travels) |the car (?:did|does|went) |when |after )?" + NUM + "\\s*(km|kilometers|kilometres|miles|mi)\\s+(?:on|with|using|per|for|from|takes|took|uses|used|burns|burned|needs|needed)\\s+" + NUM + "\\s*(liters?|litres?|l|gallons?|gal|us gallons?|uk gallons?|imperial gallons?)(?:\\s+of\\s+(?:fuel|gas|petrol|diesel))?$"));
  if (m && /fuel|mileage|consumption|economy|mpg|l\/100|km per liter|km\/l|liter|litre|gallon|\bgas\b|petrol|diesel|\bl\b|\bgal\b/.test(low)) return { kind: "fuel", dist: +m[1], du: m[2], vol: +m[3], vu: m[4] };
  m = low.match(new RegExp("^(?:convert |what is |whats |what's |how much is )?" + NUM + "\\s*(mpg|miles per gallon|miles per us gallon|miles per uk gallon|us mpg|uk mpg|imperial mpg|l/100 ?km|liters per 100 ?km|litres per 100 ?km|litres/100 ?km|liters/100 ?km|km/l|km per liter|km per litre|kilometers per liter|kilometres per litre)\\s+(?:to|in|as|into|=|equals)\\s+(mpg|miles per gallon|miles per us gallon|miles per uk gallon|us mpg|uk mpg|imperial mpg|l/100 ?km|liters per 100 ?km|litres per 100 ?km|litres/100 ?km|liters/100 ?km|km/l|km per liter|km per litre|kilometers per liter|kilometres per litre)(?:\\s*\\(?(us|uk|imperial)\\)?)?$"));
  if (m) return { kind: "fuelconv", value: +m[1], from: m[2], to: m[3], region: m[4] || (/\buk\b|imperial/.test(m[2] + m[3]) ? "uk" : "us") };
  // --- round 9: running pace ---
  const DUR = "(?:(\\d{1,2}):(\\d{2})(?::(\\d{2}))?|" + NUM + "\\s*(?:hours?|hrs?|h)(?:\\s+(?:and\\s+)?" + NUM + "\\s*(?:minutes?|mins?|min|m))?|" + NUM + "\\s*(?:minutes?|mins?|min|m)(?:\\s+(?:and\\s+)?" + NUM + "\\s*(?:seconds?|secs?|sec|s))?)";
  m = low.match(new RegExp("^(?:(?:what |what's |whats |what is |calculate |find |my )?(?:the |my )?(?:running |run |walking |walk |cycling |bike |average )?pace\\s+(?:for |of |if |to run |running |when running |to finish |to do |on |over |at |per km for |per mile for )?(?:a |an )?)?" + NUM + "\\s*(km|k|kilometers|kilometres|kilometer|kilometre|miles?|mi|m|meters|metres)\\s+(?:in|at|for|takes|took|done in|finished in|run in|ran in)\\s+" + DUR + "(?:\\s+(?:is what pace|what pace|pace|what is (?:the|my) pace|what was my pace|per (?:km|mile) pace|min per (?:km|mile)))?$"))
    || low.match(new RegExp("^(?:i |we |she |he )?(?:ran|jogged|walked|cycled|biked|swam|did|finished|completed|covered) (?:a |an |the )?" + NUM + "\\s*(km|k|kilometers|kilometres|kilometer|kilometre|miles?|mi|m|meters|metres)\\s+in\\s+" + DUR + "\\.?,?\\s*(?:what (?:was|is) (?:my|the|our) (?:average )?pace|what pace (?:is|was) that|pace\\??|what is that (?:in|as a) pace|how fast|what speed)$"));
  if (m && /pace|how fast|what speed/.test(low)) {
    const secs = m[3] != null ? +m[3] * 3600 + +m[4] * 60 + +(m[5] || 0) : m[6] != null ? +m[6] * 3600 + +(m[7] || 0) * 60 : +m[8] * 60 + +(m[9] || 0);
    if (secs > 0 && +m[1] > 0) return { kind: "pace", dist: +m[1], du: m[2], secs };
  }
  m = low.match(new RegExp("^(?:how long (?:to|will it take to|does it take to|would it take to|for) (?:run|finish|complete|cover|do|jog|walk)|what (?:time|finish time) (?:for|to run|will i get for|would i run)|finish time (?:for|of)|time (?:to run|for))\\s+(?:a |an |the )?" + NUM + "?\\s*(km|k|kilometers|kilometres|miles?|mi|marathon|half marathon|half-marathon|10k|5k)\\s+at\\s+(?:a |an )?(\\d{1,2}):(\\d{2})\\s*(?:min(?:ute)?s?)?\\s*(?:pace|per km|per kilometer|per kilometre|per mile|/km|/mile|min/km|min/mile|a km|a mile|min per km|min per mile)?(?:\\s+pace)?$"));
  if (m) { const unit = m[2]; const dist = /marathon/.test(unit) ? (/half/.test(unit) ? 21.0975 : 42.195) : unit === "10k" ? 10 : unit === "5k" ? 5 : +m[1]; if (dist > 0) { const inKm = !/mile|mi$/.test(unit) || /marathon|k$/.test(unit); const perMile = /mile/.test(low.slice(low.indexOf(" at ") + 4)) || (!/km|kilomet|per k\b|\/k/.test(low.slice(low.indexOf(" at ") + 4)) && /mile/.test(unit)); return { kind: "finish", dist, inKm, paceSecs: +m[3] * 60 + +m[4], perMile }; } }
  // --- round 9: dog and cat years ---
  m = low.match(new RegExp("^(?:how old is |what is |whats |what's )?(?:a |my |the )?" + NUM + "[- ](?:year|yr)[- ]old (dog|cat|puppy|kitten|pup) (?:in|to) (?:human|people|person) years$"))
    || low.match(new RegExp("^(?:convert |what is |whats |what's )?(?:a )?(dog|cat) (?:years|age) (?:for|of|to human years for) (?:a |my )?" + NUM + "[- ](?:year|yr)[- ]old(?: (?:dog|cat|puppy|kitten))?$"))
    || low.match(new RegExp("^(?:convert |what is |whats |what's )?" + NUM + " (dog|cat) years? (?:in|to|as|into|equals|is how many) (?:human|people|person) years$"))
    || low.match(new RegExp("^(?:how old is |what is the age of )?(?:my |a |the )?(dog|cat|puppy|kitten) (?:in (?:human|people) years )?(?:if (?:it|he|she) is |aged |age |that is |who is )?" + NUM + "(?: years? old)?(?: in (?:human|people|person) years)?$"))
    || low.match(new RegExp("^(?:how old is |what is |whats |what's )?(?:a |my |the )?(dog|cat|puppy|kitten) (?:of |aged |who is |that is )?" + NUM + " (?:years? old )?in (?:human|people|person) years$"));
  if (m) { const a = /^\d/.test(m[1]) ? +m[1] : +m[2], pet = /^\d/.test(m[1]) ? m[2] : m[1]; if (a >= 0 && a <= 40) return { kind: "petyears", age: a, pet: /cat|kitten/.test(pet) ? "cat" : "dog" }; }
  // --- round 9: generations and zodiac signs ---
  m = low.match(/^(?:what|which) generation (?:is|was|am i|are you|do i belong to|does someone belong to|is someone|is a person|do people belong to)?(?: (?:someone|a person|somebody|people|i|you|if (?:i was|i am|you were|you are)))?(?: (?:born|from|who was born|who were born))?(?: (?:in|on))? (?:born in )?(?:the year )?(\d{4})$/)
    || low.match(/^(?:the )?generation (?:for|of) (?:someone |a person |people )?(?:born in )?(\d{4})$/) || low.match(/^(?:born in |born )?(\d{4}) (?:is what generation|what generation|generation)$/);
  if (m && +m[1] >= 1880 && +m[1] <= new Date().getUTCFullYear()) return { kind: "generation", year: +m[1] };
  const MON = "(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sept?|oct|nov|dec)";
  m = low.match(new RegExp("^(?:what is |whats |what's |which is )?(?:the |my )?(?:zodiac|star|astrological|astrology|horoscope|sun|birth)\\s?sign\\s+(?:is |for |of |if (?:i was |you were |someone was )?born on |for someone born on |for a birthday on |on )?(?:someone born on |a birthday on |born on |born |a )?" + MON + "\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?$"))
    || low.match(new RegExp("^(?:what is |whats |what's |which is )?(?:the |my )?(?:zodiac|star|astrological|astrology|horoscope|sun|birth)\\s?sign\\s+(?:is |for |of |if (?:i was |you were |someone was )?born on |for someone born on |for a birthday on |on )?(?:someone born on |a birthday on |born on |born |the )?(\\d{1,2})(?:st|nd|rd|th)?(?: of)?\\s+" + MON + "(?:,?\\s+\\d{4})?$"))
    || low.match(new RegExp("^(?:(?:i was |i'm |im |someone )?born (?:on )?|birthday (?:on |is )?|my birthday is )?" + MON + "\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s+\\d{4})?,?\\s+(?:what (?:is|s|'s) (?:my|the) |which |what )?(?:zodiac|star|astrological|astrology|horoscope|sun) ?sign(?: (?:am i|is that|is it))?$"));
  if (m) { const monTxt = /^\d/.test(m[1]) ? m[2] : m[1], day = +(/^\d/.test(m[1]) ? m[1] : m[2]); const mon = MONTH_INDEX[monTxt.replace(/\.$/, "").slice(0, 3)]; if (mon && day >= 1 && day <= 31) return { kind: "zodiac", mon, day }; }
  m = low.match(/^(?:what is |whats |what's |which is |what |which )?(?:the )?(?:chinese|lunar) (?:zodiac|zodiac sign|zodiac animal|animal|year|new year animal|calendar animal)(?: sign| animal)? (?:is |for |of |if (?:i was |you were |someone was )?born in |for someone born in |in |was )?(?:someone born in |born in |the year |a person born in )?(\d{4})$/)
    || low.match(/^(\d{4}) (?:chinese|lunar) (?:zodiac|zodiac sign|zodiac animal|animal|new year animal)$/) || low.match(/^(?:what|which) (?:chinese |lunar )?(?:zodiac )?animal (?:is|was|for|represents) (?:the year )?(\d{4})$/)
    || low.match(/^(?:year of the )?(?:what|which) animal is (\d{4})(?: in the chinese zodiac)?$/) || low.match(/^(\d{4}) (?:is )?(?:the )?year of (?:the|what|which) (?:animal)?$/);
  if (m && +m[1] >= 1800 && +m[1] <= 2200) return { kind: "chinese", year: +m[1] };
  // --- round 9: anagrams, acronyms and initials ---
  m = low.match(/^(?:is |are |check )?(?:an )?anagram(?: check| test)? (?:of|for|between)?:? ?([a-z]+) (?:and|,|vs|with|&) ([a-z]+)$/) || low.match(/^(?:is |are )?([a-z]+) (?:an anagram (?:of|for)|anagram (?:of|for)|and) ([a-z]+)(?: anagrams(?: of each other)?)?$/) || low.match(/^(?:is |are )?(?:the words? |these )?([a-z]+) (?:and|,) ([a-z]+) anagrams(?: of each other)?$/) || low.match(/^anagram (?:check|test)?:? ?([a-z]+) (?:and|vs|,) ([a-z]+)$/);
  if (m && /anagram/.test(low) && m[1] !== "an") return { kind: "anagram", a: m[1], b: m[2] };
  m = low.match(/^(?:what is |whats |what's |give me |make |create |form )?(?:the |an )?(?:acronym|initialism|initials|abbreviation) (?:for|of|from) (?:the (?:phrase|words) )?(.+)$/) || low.match(/^(?:the )?first letters? of (?:each|every|the|all the) words? (?:in|of) (.+)$/) || low.match(/^(?:take |give me )?(?:the )?initial letters? of (.+)$/);
  if (m) { const words = m[1].replace(/["'.,!?]/g, "").trim().split(/\s+/).filter(Boolean); if (words.length >= 2 && words.length <= 40) return { kind: "acronym", words }; }
  // --- round 9: shoe sizes differ by brand and last, so there is no single right conversion ---
  if (/\bshoe size\b|\bsize \d+(?:\.\d+)? (?:eu|us|uk|euro|european|american|british)\b|\b(?:eu|us|uk) (?:size )?\d+(?:\.\d+)? (?:in|to) (?:eu|us|uk)\b/.test(low) && /\d/.test(low)) return { kind: "noconv", what: "shoe sizes", why: "EU, US and UK shoe sizes are not defined by one formula: brands cut their lasts differently and men's, women's and children's scales are offset from each other, so any single conversion table would be a guess. A brand's own size chart is the reliable source." };
  // --- round 9: pizzas for a group (a stated rule of thumb, not a guess) ---
  m = low.match(/^how many (?:large |medium |small )?pizzas? (?:do i need |do we need |should i (?:order|get|buy) |should we (?:order|get|buy) |to order |to feed |for |needed for |will feed |are needed for |would feed )?(?:for |to feed )?(\d+) (?:people|guests|adults|persons|folks|kids|children|teenagers|teens|players|friends)$/);
  if (m && +m[1] >= 1 && +m[1] <= 10000) return { kind: "pizzas", n: +m[1], kids: /kids|children/.test(low), size: /medium/.test(low) ? "medium" : /small/.test(low) ? "small" : "large" };
  // --- translation: DI carries an English dictionary only ---
  m = low.match(/^(?:how (?:do|would|can|to) (?:you|i|u|we|one) )?(?:say|translate|write)\s+(.+?)\s+(?:in|into|to)\s+(spanish|french|german|italian|portuguese|japanese|chinese|mandarin|korean|russian|arabic|hindi|dutch|swedish|latin|greek|turkish|polish|hebrew|vietnamese|thai|tagalog|filipino|indonesian|swahili)$/) || low.match(/^(?:what is|whats|what's) (?:the )?(?:word for |translation of )?(.+?) in (spanish|french|german|italian|portuguese|japanese|chinese|mandarin|korean|russian|arabic|hindi|dutch|swedish|latin|greek|turkish|polish|hebrew|vietnamese|thai|tagalog|filipino|indonesian|swahili)$/) || low.match(/^(spanish|french|german|italian|portuguese|japanese|chinese|mandarin|korean|russian|arabic|hindi|dutch|swedish|latin|greek|turkish|polish|hebrew|vietnamese|thai|tagalog|filipino|indonesian|swahili) (?:word |translation )?for (.+)$/);
  if (m) { const lang = /^(spanish|french|german|italian|portuguese|japanese|chinese|mandarin|korean|russian|arabic|hindi|dutch|swedish|latin|greek|turkish|polish|hebrew|vietnamese|thai|tagalog|filipino|indonesian|swahili)$/.test(m[1]) ? m[1] : m[2]; return { kind: "translate", lang, phrase: lang === m[1] ? m[2] : m[1] }; }
  return null;
}

// cron: turn a plain schedule phrase into the five fields, or null when any part is unclear.
const DOW = { sunday: 0, sun: 0, monday: 1, mon: 1, tuesday: 2, tue: 2, tues: 2, wednesday: 3, wed: 3, thursday: 4, thu: 4, thur: 4, thurs: 4, friday: 5, fri: 5, saturday: 6, sat: 6 };
const DOW_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function clock(txt) {
  // "9am", "9:30 pm", "17:00", "noon", "midnight" -> { h, m } in 24h, or null
  if (txt === "noon" || txt === "midday") return { h: 12, m: 0 };
  if (txt === "midnight") return { h: 0, m: 0 };
  const t = txt.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm|a\.m\.|p\.m\.)?$/);
  if (!t) return null;
  let h = +t[1]; const mm = +(t[2] || 0), ap = (t[3] || "").replace(/\./g, "");
  if (mm > 59) return null;
  if (ap) { if (h < 1 || h > 12) return null; if (ap === "pm" && h < 12) h += 12; if (ap === "am" && h === 12) h = 0; }
  else if (h > 23) return null;
  return { h, m: mm };
}
const TIMERE = "(\\d{1,2}(?::\\d{2})?\\s*(?:am|pm|a\\.m\\.|p\\.m\\.)?|noon|midday|midnight)";
export function cronOf(p) {
  p = p.replace(/\s+/g, " ").trim();
  let m;
  if (/^(?:every minute|each minute|minutely)$/.test(p)) return { expr: "* * * * *", reads: "every minute" };
  if (/^(?:every hour|each hour|hourly)$/.test(p)) return { expr: "0 * * * *", reads: "at minute 0 of every hour" };
  if ((m = p.match(/^every (\d+) (minutes?|mins?)$/)) && +m[1] >= 1 && +m[1] <= 59) return { expr: "*/" + m[1] + " * * * *", reads: "every " + m[1] + " minutes (from the top of each hour)" };
  if ((m = p.match(/^every (\d+) (hours?|hrs?)(?: at (\d{1,2}) (?:past|minutes past)(?: the hour)?)?$/)) && +m[1] >= 1 && +m[1] <= 23) return { expr: (m[3] || "0") + " */" + m[1] + " * * *", reads: "every " + m[1] + " hours at minute " + (m[3] || "0") + " (counted from midnight)" };
  // "every day at 9am", "daily at 17:30", "at midnight", "at noon"
  m = p.match(new RegExp("^(?:(?:every day|each day|daily|everyday) (?:at )?|at )" + TIMERE + "$")) || p.match(/^(?:every day|each day|daily|everyday)$/);
  if (m) { const t = m[1] ? clock(m[1]) : { h: 0, m: 0 }; if (!t) return null; return { expr: t.m + " " + t.h + " * * *", reads: "every day at " + hm(t) }; }
  // "every monday at 9am", "every weekday at 8:30", "weekends at noon", "mondays and thursdays at 9am"
  m = p.match(new RegExp("^(?:every |each |on |on every )?((?:(?:mon|tues?|wed|thur?s?|fri|sat|sun)(?:day|nesday|sday|urday|rday)?s?)(?:(?:,| and| &|,? and) (?:mon|tues?|wed|thur?s?|fri|sat|sun)(?:day|nesday|sday|urday|rday)?s?)*|weekdays?|week ?days?|weekends?|working days)(?: at )?(?:" + TIMERE + ")?$"));
  if (m) {
    const t = m[2] ? clock(m[2]) : { h: 0, m: 0 }; if (!t) return null;
    let dow, reads;
    if (/^week ?days?$|^working days$/.test(m[1])) { dow = "1-5"; reads = "Monday to Friday"; }
    else if (/^weekends?$/.test(m[1])) { dow = "0,6"; reads = "Saturday and Sunday"; }
    else {
      const names = m[1].split(/,\s*|\s+and\s+|\s*&\s*/).map((d) => d.replace(/s$/, ""));
      const ns = names.map((d) => DOW[d]); if (ns.some((n) => n === undefined)) return null;
      dow = [...new Set(ns)].sort((a, b) => a - b).join(","); reads = [...new Set(ns)].sort((a, b) => a - b).map((n) => DOW_NAMES[n]).join(", ");
    }
    return { expr: t.m + " " + t.h + " * * " + dow, reads: reads + " at " + hm(t) };
  }
  if (/^(?:every week|each week|weekly)$/.test(p)) return { expr: "0 0 * * 0", reads: "every Sunday at 00:00 (weekly)" };
  // "every month on the 1st at 6am", "monthly", "on the 15th at 9am"
  m = p.match(new RegExp("^(?:(?:every month|each month|monthly) )?(?:on )?(?:the )?(\\d{1,2})(?:st|nd|rd|th)?(?: of (?:every|each|the) month)?(?: at " + TIMERE + ")?$")) || p.match(/^(?:every month|each month|monthly)$/);
  if (m) { const day = m[1] ? +m[1] : 1; if (day < 1 || day > 31) return null; const t = m[2] ? clock(m[2]) : { h: 0, m: 0 }; if (!t) return null; return { expr: t.m + " " + t.h + " " + day + " * *", reads: "day " + day + " of every month at " + hm(t) + (day > 28 ? " (skipped in months that are shorter)" : "") }; }
  if (/^(?:every year|each year|yearly|annually)$/.test(p)) return { expr: "0 0 1 1 *", reads: "every 1 January at 00:00" };
  return null;
}
function hm(t) { return String(t.h).padStart(2, "0") + ":" + String(t.m).padStart(2, "0"); }
// HTTP status codes (RFC 9110 and the common extras), for "what does 404 mean"
export const HTTP_STATUS = {
  100: ["Continue", "the server got the request headers and the client may send the body"], 101: ["Switching Protocols", "the server agreed to change protocol, e.g. to WebSocket"],
  200: ["OK", "the request succeeded"], 201: ["Created", "the request succeeded and a new resource was created"], 202: ["Accepted", "the request was accepted for processing but is not finished"], 204: ["No Content", "success with nothing to send back"], 206: ["Partial Content", "a byte range of the resource, as asked for with a Range header"],
  301: ["Moved Permanently", "the resource has a new permanent URL; update links and bookmarks"], 302: ["Found", "a temporary redirect; keep using the original URL"], 303: ["See Other", "fetch the result with a GET at another URL, typically after a POST"], 304: ["Not Modified", "the cached copy is still current, so no body is sent"], 307: ["Temporary Redirect", "like 302 but the method and body must not change"], 308: ["Permanent Redirect", "like 301 but the method and body must not change"],
  400: ["Bad Request", "the server could not understand the request, usually malformed syntax or invalid parameters"], 401: ["Unauthorized", "authentication is required or the credentials were wrong (despite the name it means unauthenticated)"], 402: ["Payment Required", "reserved; some APIs use it for exhausted quotas or billing problems"], 403: ["Forbidden", "the server understood but refuses; being logged in will not help"], 404: ["Not Found", "no resource at that URL, or the server is hiding it"], 405: ["Method Not Allowed", "the URL exists but not for this HTTP method, e.g. POST to a read-only endpoint"], 406: ["Not Acceptable", "nothing matches the Accept headers the client sent"], 408: ["Request Timeout", "the server gave up waiting for the request"], 409: ["Conflict", "the request clashes with the current state, e.g. an edit on stale data"], 410: ["Gone", "the resource was removed on purpose and will not be back"], 411: ["Length Required", "a Content-Length header is required"], 412: ["Precondition Failed", "an If-Match or similar precondition was not met"], 413: ["Content Too Large", "the request body is bigger than the server allows"], 414: ["URI Too Long", "the URL is longer than the server will process"], 415: ["Unsupported Media Type", "the request body format is not supported"], 416: ["Range Not Satisfiable", "the requested byte range is outside the resource"], 418: ["I'm a teapot", "an April Fools joke from RFC 2324; some servers return it for requests they will not brew"], 422: ["Unprocessable Content", "well-formed but semantically invalid, common for validation errors"], 425: ["Too Early", "the server will not risk a replayed request"], 426: ["Upgrade Required", "switch to a different protocol, such as TLS"], 428: ["Precondition Required", "the request must be conditional to avoid lost updates"], 429: ["Too Many Requests", "rate limited; check the Retry-After header and slow down"], 431: ["Request Header Fields Too Large", "headers (often cookies) are too big"], 451: ["Unavailable For Legal Reasons", "blocked by a legal demand, named after Fahrenheit 451"],
  500: ["Internal Server Error", "the server hit an unexpected error; the fault is on the server side"], 501: ["Not Implemented", "the server does not support that method"], 502: ["Bad Gateway", "a proxy or load balancer got an invalid response from the upstream server"], 503: ["Service Unavailable", "overloaded or down for maintenance; usually temporary"], 504: ["Gateway Timeout", "a proxy did not get a timely response from upstream"], 505: ["HTTP Version Not Supported", "the server refuses that HTTP version"], 507: ["Insufficient Storage", "the server is out of room to complete the request (WebDAV)"], 511: ["Network Authentication Required", "log in to the network first, e.g. a captive portal"],
};
const IP_SPECIAL = [
  [[0, 0, 0, 0], 8, "the 'this network' range (0.0.0.0/8); 0.0.0.0 means 'any address' when binding a server"],
  [[10, 0, 0, 0], 8, "a private address (RFC 1918, 10.0.0.0/8): used on LANs and not routed on the public internet"],
  [[100, 64, 0, 0], 10, "a carrier-grade NAT address (RFC 6598, 100.64.0.0/10): shared address space inside an ISP"],
  [[127, 0, 0, 0], 8, "a loopback address (127.0.0.0/8): it always points at this same machine; 127.0.0.1 is 'localhost'"],
  [[169, 254, 0, 0], 16, "a link-local address (169.254.0.0/16): self-assigned when no DHCP server answered, so it usually means 'no network'"],
  [[172, 16, 0, 0], 12, "a private address (RFC 1918, 172.16.0.0/12): used on LANs and not routed on the public internet"],
  [[192, 0, 0, 0], 24, "an IETF protocol assignment (192.0.0.0/24)"],
  [[192, 0, 2, 0], 24, "a documentation address (TEST-NET-1, 192.0.2.0/24): reserved for examples, never assigned"],
  [[192, 88, 99, 0], 24, "the deprecated 6to4 relay anycast range (192.88.99.0/24)"],
  [[192, 168, 0, 0], 16, "a private address (RFC 1918, 192.168.0.0/16): the usual home-router LAN range, not routed on the public internet"],
  [[198, 18, 0, 0], 15, "a benchmarking range (198.18.0.0/15): reserved for network testing"],
  [[198, 51, 100, 0], 24, "a documentation address (TEST-NET-2, 198.51.100.0/24): reserved for examples"],
  [[203, 0, 113, 0], 24, "a documentation address (TEST-NET-3, 203.0.113.0/24): reserved for examples"],
  [[224, 0, 0, 0], 4, "a multicast address (224.0.0.0/4): one sender to many subscribed receivers"],
  [[240, 0, 0, 0], 4, "a reserved address (240.0.0.0/4, 'class E'); 255.255.255.255 is the limited broadcast address"],
];
const ip2n = (o) => ((o[0] << 24) >>> 0) + (o[1] << 16) + (o[2] << 8) + o[3];
const n2ip = (n) => [n >>> 24, (n >>> 16) & 255, (n >>> 8) & 255, n & 255].join(".");
function ipClass(oct) { const n = ip2n(oct); if (n === 0xffffffff) return "the limited broadcast address (255.255.255.255): every host on the local link"; for (const [base, len, what] of IP_SPECIAL) { const mask = len === 0 ? 0 : (0xffffffff << (32 - len)) >>> 0; if (((n & mask) >>> 0) === ip2n(base)) return what; } return "a public (globally routable) address"; }
function cidrInfo(oct, prefix) {
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0, n = ip2n(oct), net = (n & mask) >>> 0, bcast = (net | (~mask >>> 0)) >>> 0, size = 2 ** (32 - prefix);
  const usable = prefix >= 31 ? size : size - 2;
  return { mask: n2ip(mask), wildcard: n2ip(~mask >>> 0), network: n2ip(net), broadcast: n2ip(bcast), first: prefix >= 31 ? n2ip(net) : n2ip(net + 1), last: prefix >= 31 ? n2ip(bcast) : n2ip(bcast - 1), size, usable };
}
function fmtDurLong(secs) {
  const d = Math.floor(secs / 86400), h = Math.floor((secs % 86400) / 3600), mi = Math.floor((secs % 3600) / 60), sec = Math.round((secs % 60) * 1000) / 1000;
  const parts = []; if (d) parts.push(d + " day" + (d === 1 ? "" : "s")); if (h) parts.push(h + " hour" + (h === 1 ? "" : "s")); if (mi) parts.push(mi + " minute" + (mi === 1 ? "" : "s")); if (sec || !parts.length) parts.push(sec + " second" + (sec === 1 ? "" : "s"));
  return parts.length > 1 ? parts.slice(0, -1).join(", ") + " and " + parts[parts.length - 1] : parts[0];
}
const HTML_ESC = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
const HTML_NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: "\u00a0", copy: "\u00a9", reg: "\u00ae", trade: "\u2122", euro: "\u20ac", pound: "\u00a3", yen: "\u00a5", cent: "\u00a2", deg: "\u00b0", hellip: "\u2026", mdash: "\u2014", ndash: "\u2013", laquo: "\u00ab", raquo: "\u00bb", ldquo: "\u201c", rdquo: "\u201d", lsquo: "\u2018", rsquo: "\u2019", times: "\u00d7", divide: "\u00f7", plusmn: "\u00b1", para: "\u00b6", sect: "\u00a7", middot: "\u00b7", bull: "\u2022" };
const isPrimeN = (n) => { if (n < 2) return false; if (n % 2 === 0) return n === 2; if (n % 3 === 0) return n === 3; for (let i = 5; i * i <= n; i += 6) if (n % i === 0 || n % (i + 2) === 0) return false; return true; };
const CHAR_NAMES = { 32: "space", 9: "tab", 10: "line feed (newline)", 13: "carriage return", 0: "null", 27: "escape", 127: "delete", 160: "no-break space", 8364: "euro sign", 163: "pound sign", 165: "yen sign", 169: "copyright sign", 174: "registered sign", 8482: "trade mark sign", 176: "degree sign", 960: "greek small letter pi", 8734: "infinity", 8230: "horizontal ellipsis", 8212: "em dash", 8211: "en dash", 215: "multiplication sign", 247: "division sign", 177: "plus-minus sign", 8592: "leftwards arrow", 8594: "rightwards arrow", 8593: "upwards arrow", 8595: "downwards arrow", 9829: "black heart suit", 10003: "check mark", 10007: "ballot x", 64: "commercial at", 35: "number sign", 36: "dollar sign", 37: "percent sign", 38: "ampersand", 42: "asterisk", 43: "plus sign", 45: "hyphen-minus", 47: "solidus (slash)", 92: "reverse solidus (backslash)", 95: "low line (underscore)", 126: "tilde", 94: "circumflex accent", 96: "grave accent", 124: "vertical line (pipe)" };
// kinds that are safe to answer even when the line also reads like a code request
export const CODE_OK = new Set(["uuid", "lorem", "json", "cron", "calculus", "nolive", "translate", "randcolor", "randpass", "html", "charcode", "charfrom", "bitwise", "httpstatus", "ip", "cidr"]);

// ---------------------------------------------------------------------------
// run(): compute the answer for an ask() result
// ---------------------------------------------------------------------------
const DIST_M = { mile: 1609.344, miles: 1609.344, mi: 1609.344, km: 1000, kilometer: 1000, kilometers: 1000, kilometre: 1000, kilometres: 1000, m: 1, meter: 1, meters: 1, metre: 1, metres: 1, "nautical mile": 1852, "nautical miles": 1852, nm: 1852, feet: 0.3048, ft: 0.3048 };
const RATE_MPS = (u) => /^(?:mph|miles)/.test(u) ? 0.44704 : /^(?:km|kph|kmh|kilomet)/.test(u) ? 1000 / 3600 : /knot/.test(u) ? 0.514444 : 1;
export function run(q) {
  if (!q) return { ok: false, error: "not an everyday request" };
  const nowY = new Date().getUTCFullYear();
  switch (q.kind) {
    case "between": {
      let d = q.b - q.a; const wrapped = d < 0; if (wrapped) d += 1440;
      return { ok: true, kind: q.kind, value: d / 60, text: fmtDur(d) + " (" + fmt(d / 60) + " hours)" + (wrapped ? ", assuming " + q.bTxt + " is on the next day" : q.pmAssumed ? ", reading " + q.bTxt + " as " + q.bTxt + "pm" : ""), a: q.aTxt, b: q.bTxt, minutes: d };
    }
    case "clockadd": {
      const out = q.t + q.delta, days = Math.floor(out / 1440) - (out < 0 ? 0 : 0);
      const dayNote = out >= 1440 ? " (the next day)" : out < 0 ? " (the previous day)" : "";
      return { ok: true, kind: q.kind, text: fmtClock(out, q.ampm) + dayNote, from: q.tTxt, delta: q.delta, value: null, days };
    }
    case "tz": {
      if (!q.tz) return { ok: false, error: "I do not have a time zone for “" + q.place + "”. I know major cities, countries and zone abbreviations (UTC, EST, PST, CET, IST, JST, ...)." };
      const n = nowIn(q.tz);
      const place = q.place.length <= 3 ? q.place.toUpperCase() : q.place.replace(/\b[a-z]/g, (c) => c.toUpperCase()); // "LA", "New York"
      return { ok: true, kind: q.kind, text: n.time + " on " + n.weekday + ", " + n.date + " in " + place + " (" + q.tz + ", " + n.offset + ")", time: n.time, tz: q.tz, offset: n.offset, value: null };
    }
    case "coin": { const heads = randInt(0, 1) === 1; return { ok: true, kind: q.kind, text: heads ? "Heads" : "Tails", value: null }; }
    case "dice": { const rolls = []; for (let i = 0; i < q.count; i++) rolls.push(randInt(1, q.sides)); const total = rolls.reduce((a, b) => a + b, 0); return { ok: true, kind: q.kind, rolls, total, sides: q.sides, value: total, text: q.count === 1 ? "You rolled a " + rolls[0] + " (d" + q.sides + ")" : "You rolled " + rolls.join(" + ") + " = " + total + " (" + q.count + "d" + q.sides + ")" }; }
    case "randnum": { const n = randInt(q.lo, q.hi); return { ok: true, kind: q.kind, value: n, lo: q.lo, hi: q.hi, text: String(n) }; }
    case "pick": { const i = randInt(0, q.opts.length - 1); return { ok: true, kind: q.kind, choice: q.opts[i], opts: q.opts, text: q.opts[i], value: null }; }
    case "shuffle": { const a = q.opts.slice(); for (let i = a.length - 1; i > 0; i--) { const j = randInt(0, i); [a[i], a[j]] = [a[j], a[i]]; } return { ok: true, kind: q.kind, items: a, text: a.join(", "), value: null }; }
    case "uuid": { const ids = []; for (let i = 0; i < q.n; i++) ids.push(uuid4()); return { ok: true, kind: q.kind, ids, text: ids.join("\n"), value: null }; }
    case "lorem": return { ok: true, kind: q.kind, n: q.n, unit: q.unit, text: lorem(q.n, q.unit), value: null };
    case "tip": {
      const rows = (q.pct != null ? [q.pct] : [15, 18, 20]).map((p) => ({ pct: p, tip: r2(q.bill * p / 100), total: r2(q.bill * (1 + p / 100)) }));
      return { ok: true, kind: q.kind, bill: q.bill, rows, ways: q.ways, value: q.pct != null ? rows[0].tip : null, text: rows.map((r) => r.pct + "%: tip $" + usd(r.tip) + ", total $" + usd(r.total) + (q.ways ? ", $" + usd(r.total / q.ways) + " each for " + q.ways : "")).join("\n") };
    }
    case "bmi": {
      const bmi = q.wkg / (q.hm * q.hm), b = Math.round(bmi * 10) / 10;
      const band = bmi < 18.5 ? "underweight" : bmi < 25 ? "normal weight" : bmi < 30 ? "overweight" : "obese";
      return { ok: true, kind: q.kind, value: b, band, text: "BMI " + b + " (" + band + ") for " + q.wTxt + " and " + q.hTxt };
    }
    case "loan": {
      const r = q.rate / 100 / 12, n = q.months;
      const pay = r === 0 ? q.p / n : q.p * r / (1 - Math.pow(1 + r, -n));
      const total = pay * n, interest = total - q.p;
      return { ok: true, kind: q.kind, value: r2(pay), payment: r2(pay), total: r2(total), interest: r2(interest), p: q.p, rate: q.rate, months: n, text: "$" + usd(pay) + " per month for " + n + " months; total paid $" + usd(total) + ", of which $" + usd(interest) + " is interest" };
    }
    case "save": {
      const perYear = { day: 365, week: 52, month: 12, year: 1 }[q.per];
      const years = q.unit === "year" ? q.n : q.unit === "month" ? q.n / 12 : q.unit === "week" ? q.n / 52 : q.n / 365;
      const k = Math.round(perYear * years);
      const plain = q.amt * k;
      if (q.rate == null) return { ok: true, kind: q.kind, value: r2(plain), deposits: k, plain: r2(plain), text: "$" + usd(plain) + " (" + k + " deposits of $" + usd(q.amt) + ", no interest)" };
      // future value of an ordinary annuity compounded once per deposit period
      const i = q.rate / 100 / perYear;
      const fv = i === 0 ? plain : q.amt * ((Math.pow(1 + i, k) - 1) / i);
      return { ok: true, kind: q.kind, value: r2(fv), deposits: k, plain: r2(plain), interest: r2(fv - plain), rate: q.rate, text: "$" + usd(fv) + " (" + k + " deposits of $" + usd(q.amt) + " = $" + usd(plain) + ", plus $" + usd(fv - plain) + " interest at " + q.rate + "% compounded per deposit)" };
    }
    case "travel": {
      const meters = q.d * (DIST_M[q.du] || DIST_M[q.du.replace(/s$/, "")] || 1), mps = q.v * RATE_MPS(q.vu);
      if (!(mps > 0)) return { ok: false, error: "speed must be positive" };
      const hours = meters / mps / 3600, mins = Math.round(hours * 60);
      const mixed = (/^(?:mi|mile)/.test(q.du) !== /^(?:mph|miles)/.test(q.vu)) && !/^m$|^met|nautical|nm/.test(q.du);
      return { ok: true, kind: q.kind, value: Math.round(hours * 1e6) / 1e6, hours, text: fmtDur(mins) + " (" + fmt(Math.round(hours * 1000) / 1000) + " hours)", mixed, d: q.d, du: q.du, v: q.v, vu: q.vu };
    }
    case "steps": {
      const m = q.n * 0.762; // average adult stride, about 2.5 ft
      const km = m / 1000, mi = m / 1609.344;
      const want = q.unit ? (/^mi/.test(q.unit) ? "mi" : /^k/.test(q.unit) ? "km" : /^(?:m|met)/.test(q.unit) ? "m" : "ft") : null;
      const val = want === "mi" ? mi : want === "km" ? km : want === "m" ? m : want === "ft" ? m / 0.3048 : null;
      return { ok: true, kind: q.kind, n: q.n, km: r2(km), mi: r2(mi), value: val != null ? r2(val) : r2(km), unit: want, text: q.n.toLocaleString("en-US") + " steps is about " + (want ? r2(val) + " " + want : r2(km) + " km (" + r2(mi) + " miles)") };
    }
    case "port": { const [n, proto, desc] = q.entry; return { ok: true, kind: q.kind, value: n, port: n, proto, desc, text: desc + " uses " + proto.toUpperCase() + " port " + n }; }
    case "portnum": {
      if (!q.entry) return { ok: false, error: "Port " + q.n + " has no well-known assignment in my table (I cover the common service ports: 20-25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 6379, 8080, 27017, ...)." + (q.n > 65535 ? " Port numbers only go up to 65535." : q.n >= 49152 ? " Ports 49152-65535 are dynamic/ephemeral ports handed out to client connections." : q.n >= 1024 ? " Ports 1024-49151 are registered ports; many applications pick one." : "") };
      const [n, proto, desc] = q.entry; return { ok: true, kind: q.kind, value: n, port: n, proto, desc, text: "Port " + n + " (" + proto.toUpperCase() + ") is " + desc };
    }
    case "yearago": return { ok: true, kind: q.kind, value: nowY - q.n, text: String(nowY - q.n) + " (" + q.n + " years before " + nowY + ")" };
    case "yearahead": return { ok: true, kind: q.kind, value: nowY + q.n, text: String(nowY + q.n) + " (" + q.n + " years after " + nowY + ")" };
    case "birthyear": return { ok: true, kind: q.kind, value: nowY - q.age, text: (nowY - q.age) + " if their birthday has already passed this year, otherwise " + (nowY - q.age - 1) };
    case "randcolor": {
      const r = randInt(0, 255), g = randInt(0, 255), b = randInt(0, 255);
      const hex = "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");
      const R = r / 255, G = g / 255, B = b / 255, mx = Math.max(R, G, B), mn = Math.min(R, G, B), l = (mx + mn) / 2, d = mx - mn;
      let h = 0, s = 0;
      if (d) { s = d / (1 - Math.abs(2 * l - 1)); h = mx === R ? ((G - B) / d) % 6 : mx === G ? (B - R) / d + 2 : (R - G) / d + 4; h = Math.round(h * 60); if (h < 0) h += 360; }
      const hsl = "hsl(" + h + ", " + Math.round(s * 100) + "%, " + Math.round(l * 100) + "%)";
      return { ok: true, kind: q.kind, value: hex, hex, rgb: "rgb(" + r + ", " + g + ", " + b + ")", hsl, text: hex };
    }
    case "json": {
      let parsed;
      try { parsed = JSON.parse(q.payload); }
      catch (e) {
        const at = /position (\d+)/.exec(e.message), pos = at ? +at[1] : -1;
        const line = pos >= 0 ? q.payload.slice(0, pos).split("\n").length : null, col = pos >= 0 ? pos - q.payload.lastIndexOf("\n", pos - 1) : null;
        return { ok: true, kind: q.kind, op: q.op, valid: false, value: "invalid", text: "invalid JSON: " + e.message.replace(/^JSON\.parse: /, "").replace(/ in JSON at position \d+.*$/, "") + (line ? " (line " + line + ", column " + col + ")" : ""), payload: q.payload };
      }
      const out = q.op === "minify" ? JSON.stringify(parsed) : JSON.stringify(parsed, null, 2);
      const kind = Array.isArray(parsed) ? "array of " + parsed.length : parsed && typeof parsed === "object" ? "object with " + Object.keys(parsed).length + " key" + (Object.keys(parsed).length === 1 ? "" : "s") : typeof parsed;
      return { ok: true, kind: q.kind, op: q.op, valid: true, value: out, text: out, shape: kind, bytes: q.payload.length, outBytes: out.length };
    }
    case "cron": return { ok: true, kind: q.kind, value: q.expr, expr: q.expr, reads: q.reads, text: q.expr };
    case "calculus": return { ok: true, kind: q.kind, what: q.what, expr: q.expr, value: null, text: "Quelvra handles " + q.what + " problems", link: "/quelvra/?q=" + encodeURIComponent((q.what === "d/dx" ? "derivative of " : /^(differentiate|integrate)$/.test(q.what) ? q.what + " " : q.what + " of ") + q.expr) };
    case "nolive": return { ok: true, kind: q.kind, topic: q.topic, value: null, text: "no live " + q.topic + " data offline" };
    case "translate": return { ok: true, kind: q.kind, lang: q.lang, phrase: q.phrase, value: null, text: "no " + q.lang + " dictionary" };
    case "bitwise": {
      const parse = (t) => { try { return /^0x/.test(t) ? BigInt(t) : /^0b/.test(t) ? BigInt(t) : BigInt(t); } catch (_) { return null; } };
      const a = parse(q.a), b = q.b == null ? null : parse(q.b);
      if (a === null || (q.op !== "not" && b === null)) return { ok: false, error: "those are not integers" };
      if (q.op === "not") {
        const bits = b == null ? (a < 256n ? 8n : a < 65536n ? 16n : 32n) : b; if (bits < 1n || bits > 128n) return { ok: false, error: "bit width must be 1 to 128" };
        const maskv = (1n << bits) - 1n, r = (~a) & maskv;
        return { ok: true, kind: q.kind, op: "not", value: r.toString(), a: a.toString(), bits: Number(bits), text: "NOT " + a + " = " + r + " in " + bits + " bits (0b" + r.toString(2).padStart(Number(bits), "0") + "); as a signed two's-complement number it is " + (~a).toString(), abin: a.toString(2).padStart(Number(bits), "0"), rbin: r.toString(2).padStart(Number(bits), "0") };
      }
      if ((q.op === "shl" || q.op === "shr") && (b < 0n || b > 1024n)) return { ok: false, error: "shift count must be 0 to 1024" };
      const r = q.op === "xor" ? a ^ b : q.op === "and" ? a & b : q.op === "or" ? a | b : q.op === "nand" ? ~(a & b) : q.op === "nor" ? ~(a | b) : q.op === "shl" ? a << b : a >> b;
      const w = Math.max(a.toString(2).replace("-", "").length, (b || 0n).toString(2).replace("-", "").length, r.toString(2).replace("-", "").length);
      const bin = (x) => (x < 0n ? "-" : "") + (x < 0n ? -x : x).toString(2).padStart(w, "0");
      const sym = { xor: "XOR", and: "AND", or: "OR", nand: "NAND", nor: "NOR", shl: "<<", shr: ">>" }[q.op];
      return { ok: true, kind: q.kind, op: q.op, value: r.toString(), a: a.toString(), b: b.toString(), text: a + " " + sym + " " + b + " = " + r, abin: bin(a), bbin: bin(b), rbin: bin(r), sym, hex: (r < 0n ? "-0x" + (-r).toString(16) : "0x" + r.toString(16)) };
    }
    case "nearprime": {
      const n = q.n; let up = n + 1; while (!isPrimeN(up)) up++;
      let down = n - 1; while (down >= 2 && !isPrimeN(down)) down--;
      if (q.dir === "next") return { ok: true, kind: q.kind, value: up, text: "The next prime after " + n + " is " + up, n, dir: q.dir };
      if (q.dir === "prev") { if (down < 2) return { ok: false, error: "there is no prime below " + n + " (2 is the smallest prime)" }; return { ok: true, kind: q.kind, value: down, text: "The largest prime below " + n + " is " + down, n, dir: q.dir }; }
      const self = isPrimeN(n);
      if (self) return { ok: true, kind: q.kind, value: n, text: n + " is itself prime; its neighbours are " + (down >= 2 ? down + " below and " : "") + up + " above", n, dir: q.dir };
      const pick = down >= 2 && n - down <= up - n ? down : up;
      return { ok: true, kind: q.kind, value: pick, text: "The nearest prime to " + n + " is " + pick + (down >= 2 && n - down === up - n ? " (tied with " + up + ", both " + (up - n) + " away)" : " (" + (down >= 2 ? down + " below, " : "") + up + " above)"), n, dir: q.dir };
    }
    case "wordlen": {
      const words = q.text.split(/\s+/).map((w) => w.replace(/^[^a-z0-9']+|[^a-z0-9']+$/gi, "")).filter(Boolean);
      if (!words.length) return { ok: false, error: "no words found" };
      const best = words.reduce((a, w) => (q.which === "longest" ? w.length > a.length : w.length < a.length) ? w : a, words[0]);
      const ties = [...new Set(words.filter((w) => w.length === best.length))];
      return { ok: true, kind: q.kind, value: best, which: q.which, len: best.length, ties, count: words.length, text: best + " (" + best.length + " letters)" };
    }
    case "lettercount": {
      const L = q.letter.toLowerCase(), t = q.text.toLowerCase(); let c = 0; for (const ch of t) if (ch === L) c++;
      return { ok: true, kind: q.kind, value: c, letter: q.letter, text: c + " " + (c === 1 ? "time" : "times"), total: t.replace(/[^a-z]/g, "").length };
    }
    case "duration": return { ok: true, kind: q.kind, value: q.secs, text: fmtDurLong(q.secs), src: q.src, hms: (Math.floor(q.secs / 3600)) + ":" + String(Math.floor((q.secs % 3600) / 60)).padStart(2, "0") + ":" + String(Math.floor(q.secs % 60)).padStart(2, "0") };
    case "randpass": {
      if (q.phrase) {
        const WORDS = "apple river stone cloud maple tiger lemon ocean pixel candle forest silver copper meadow falcon harbor velvet cactus marble thunder walnut ember lantern quartz saddle turnip anchor breeze cobalt dagger ferry garnet hazel iris jasper kettle lotus mango nectar orbit parrot quill raven sable tulip umber violet willow yarrow zephyr".split(" ");
        const n = Math.max(4, Math.min(8, Math.round(q.n / 5))); const out = []; for (let i = 0; i < n; i++) out.push(WORDS[randInt(0, WORDS.length - 1)]);
        return { ok: true, kind: q.kind, value: out.join("-"), text: out.join("-"), n, bits: Math.round(n * Math.log2(WORDS.length)), phrase: true };
      }
      const SETS = ["abcdefghijklmnopqrstuvwxyz", "ABCDEFGHIJKLMNOPQRSTUVWXYZ", "0123456789", "!@#$%^&*()-_=+[]{};:,.?/"];
      const ALL = SETS.join(""); const chars = [];
      for (const set of SETS) chars.push(set[randInt(0, set.length - 1)]); // at least one of each class
      while (chars.length < q.n) chars.push(ALL[randInt(0, ALL.length - 1)]);
      for (let i = chars.length - 1; i > 0; i--) { const j = randInt(0, i); [chars[i], chars[j]] = [chars[j], chars[i]]; }
      const pw = chars.join("");
      return { ok: true, kind: q.kind, value: pw, text: pw, n: q.n, bits: Math.round(q.n * Math.log2(ALL.length)), phrase: false };
    }
    case "html": {
      const out = q.op === "escape" ? q.payload.replace(/[&<>"']/g, (c) => HTML_ESC[c]) : q.payload.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m0, e) => /^#x/i.test(e) ? String.fromCodePoint(parseInt(e.slice(2), 16)) : /^#/.test(e) ? String.fromCodePoint(+e.slice(1)) : (HTML_NAMED[e.toLowerCase()] !== undefined ? HTML_NAMED[e.toLowerCase()] : m0));
      return { ok: true, kind: q.kind, op: q.op, value: out, text: out, payload: q.payload, changed: out !== q.payload };
    }
    case "charcode": { const cp = q.ch.codePointAt(0); return { ok: true, kind: q.kind, value: cp, ch: q.ch, hex: cp.toString(16).toUpperCase().padStart(4, "0"), bin: cp.toString(2).padStart(8, "0"), ascii: cp < 128, name: CHAR_NAMES[cp] || null, utf8: [...new TextEncoder().encode(q.ch)].map((b) => b.toString(16).toUpperCase().padStart(2, "0")).join(" "), text: String(cp) }; }
    case "charfrom": {
      if (q.cp >= 0xd800 && q.cp <= 0xdfff) return { ok: false, error: "U+" + q.cp.toString(16).toUpperCase() + " is a surrogate code unit, not a character" };
      const ch = String.fromCodePoint(q.cp), ctrl = q.cp < 32 || q.cp === 127;
      return { ok: true, kind: q.kind, value: ch, cp: q.cp, hex: q.cp.toString(16).toUpperCase().padStart(4, "0"), ctrl, ascii: q.cp < 128, name: CHAR_NAMES[q.cp] || null, text: ctrl ? (CHAR_NAMES[q.cp] || "control character") : ch };
    }
    case "ip": {
      const oct = q.ip.split(".").map(Number);
      const cls = ipClass(oct);
      const r = q.prefix != null && q.prefix <= 32 ? cidrInfo(oct, q.prefix) : null;
      return { ok: true, kind: q.kind, ip: q.ip, value: q.ip, cls, prefix: q.prefix, range: r, text: q.ip + " is " + cls, priv: /private/.test(cls) };
    }
    case "cidr": { const r = cidrInfo([0, 0, 0, 0], q.prefix); return { ok: true, kind: q.kind, prefix: q.prefix, value: r.mask, mask: r.mask, wildcard: r.wildcard, size: r.size, usable: r.usable, text: "/" + q.prefix + " = " + r.mask + ", " + r.size.toLocaleString("en-US") + " addresses, " + r.usable.toLocaleString("en-US") + " usable hosts" }; }
    case "httpstatus": { const e = HTTP_STATUS[q.code]; return { ok: true, kind: q.kind, code: q.code, value: e[0], name: e[0], meaning: e[1], cls: ["", "informational", "success", "redirection", "client error", "server error"][Math.floor(q.code / 100)], text: q.code + " " + e[0] + ": " + e[1] }; }
    case "clockfmt": {
      const h12 = q.h % 12 || 12, ap = q.h < 12 ? "AM" : "PM", t12 = h12 + ":" + String(q.mi).padStart(2, "0") + " " + ap, t24 = String(q.h).padStart(2, "0") + ":" + String(q.mi).padStart(2, "0"), mil = String(q.h).padStart(2, "0") + String(q.mi).padStart(2, "0");
      const text = q.to === "12" ? "**" + t24 + "** is **" + t12 + "** in 12-hour time." : q.to === "24" ? "**" + t12 + "** is **" + t24 + "** in 24-hour time (**" + mil + " hours** in military time)." : "**" + mil + " hours** is **" + t12 + "** (" + t24 + " in 24-hour time).";
      return { ok: true, kind: q.kind, value: q.to === "12" ? t12 : q.to === "24" ? t24 : t12, title: "Clock format", text, note: "12-hour: hours run 1 to 12 with AM before noon and PM after; 24-hour and military time count 00:00 to 23:59, military time drops the colon and says \"hours\"." };
    }
    case "fromnow": {
      const now = new Date(), then = new Date(now.getTime() + q.delta * 60000), f = (d) => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) + (d.toDateString() === now.toDateString() ? "" : " on " + d.toLocaleDateString("en-CA"));
      return { ok: true, kind: q.kind, value: f(then), title: "Time from now", text: "**" + fmtDur(Math.abs(q.delta)) + (q.delta >= 0 ? " from now" : " ago") + "** is **" + f(then) + "** (it is " + f(now) + " now).", note: "Read from this device's clock in its local time zone." };
    }
    case "pay": {
      const H = 2080; let text, value;
      if (q.mode === "hourly") { const yr = q.rate * H; const per = { year: yr, month: yr / 12, week: q.rate * 40, biweekly: q.rate * 80, day: q.rate * 8 }[q.per]; value = per; text = "**$" + fmt(q.rate) + " an hour is $" + usd(per) + " a " + (q.per === "biweekly" ? "fortnight (every two weeks)" : q.per) + "** before tax: " + (q.per === "year" ? "40 hours × 52 weeks = 2,080 hours × " + fmt(q.rate) : q.per === "month" ? "2,080 hours × " + fmt(q.rate) + " ÷ 12" : q.per === "week" ? "40 hours × " + fmt(q.rate) : q.per === "biweekly" ? "80 hours × " + fmt(q.rate) : "8 hours × " + fmt(q.rate)) + ". A year: $" + usd(yr) + "; a month: $" + usd(yr / 12) + "; a week: $" + usd(q.rate * 40) + "."; }
      else if (q.mode === "annual") { const per = { hour: q.amount / H, month: q.amount / 12, week: q.amount / 52, biweekly: q.amount / 26, day: q.amount / 260 }[q.per]; value = per; text = "**$" + usd(q.amount) + " a year is $" + usd(per) + " " + (q.per === "hour" ? "an hour" : q.per === "biweekly" ? "every two weeks" : "a " + q.per) + "** before tax (" + (q.per === "hour" ? "÷ 2,080 working hours" : q.per === "month" ? "÷ 12" : q.per === "week" ? "÷ 52" : q.per === "biweekly" ? "÷ 26" : "÷ 260 working days") + "). Hourly: $" + usd(q.amount / H) + "; monthly: $" + usd(q.amount / 12) + "; weekly: $" + usd(q.amount / 52) + "; daily: $" + usd(q.amount / 260) + "."; }
      else if (q.mode === "overtime") { value = q.rate * q.mult; text = "**" + q.word + " of $" + fmt(q.rate) + " is $" + usd(q.rate * q.mult) + " an hour** (" + fmt(q.rate) + " × " + q.mult + ")." + (/overtime/.test(q.word) ? " Overtime is taken as time and a half (1.5×), the usual rate; double time would be $" + usd(q.rate * 2) + "." : ""); }
      else { value = q.hours * q.rate; text = "**" + fmt(q.hours) + " hours at $" + fmt(q.rate) + " an hour is $" + usd(q.hours * q.rate) + "** before tax (" + fmt(q.hours) + " × " + fmt(q.rate) + ")."; }
      return { ok: true, kind: q.kind, value, title: "Pay", text, note: "Gross figures on a 40-hour week and a 52-week year (2,080 hours); tax, overtime and unpaid leave are not included." };
    }
    case "fuel": {
      const km = q.dist * (/^mi/.test(q.du) ? 1.609344 : 1), liters = q.vol * (/imperial|uk/.test(q.vu) ? 4.54609 : /gal/.test(q.vu) ? 3.785411784 : 1);
      if (!(km > 0) || !(liters > 0)) return { ok: false, error: "distance and fuel must both be positive" };
      const l100 = liters / km * 100, kml = km / liters, mpgUS = (km / 1.609344) / (liters / 3.785411784), mpgUK = (km / 1.609344) / (liters / 4.54609);
      return { ok: true, kind: q.kind, value: Math.round(l100 * 100) / 100, title: "Fuel economy", text: "**" + fmt(q.dist) + " " + q.du + " on " + fmt(q.vol) + " " + q.vu + " is " + fmt(Math.round(l100 * 100) / 100) + " L/100 km** = " + fmt(Math.round(kml * 100) / 100) + " km per litre = **" + fmt(Math.round(mpgUS * 10) / 10) + " mpg (US)** or " + fmt(Math.round(mpgUK * 10) / 10) + " mpg (UK).", note: (/gal/.test(q.vu) && !/uk|imperial/.test(q.vu) ? "Gallons read as US gallons (3.785 L); a UK gallon is 4.546 L. " : "") + "Lower L/100 km and higher mpg both mean less fuel." };
    }
    case "fuelconv": {
      const kind = (u) => /mpg|gallon/.test(u) ? "mpg" : /100/.test(u) ? "l100" : "kml"; const gal = q.region === "uk" ? 4.54609 : 3.785411784, kf = kind(q.from), kt = kind(q.to);
      if (!(q.value > 0)) return { ok: false, error: "the figure must be positive" };
      if (kf === kt) return { ok: false, error: "those are the same measure" };
      const l100 = kf === "l100" ? q.value : kf === "kml" ? 100 / q.value : 100 * gal / (q.value * 1.609344);
      const out = kt === "l100" ? l100 : kt === "kml" ? 100 / l100 : 100 * gal / (l100 * 1.609344);
      const lbl = { mpg: "mpg (" + q.region.toUpperCase() + " gallon)", l100: "L/100 km", kml: "km/L" };
      return { ok: true, kind: q.kind, value: Math.round(out * 100) / 100, title: "Fuel economy", text: "**" + fmt(q.value) + " " + lbl[kf] + " is " + fmt(Math.round(out * 100) / 100) + " " + lbl[kt] + "**." + (kf === "mpg" || kt === "mpg" ? " With the " + (q.region === "uk" ? "US" : "UK") + " gallon it would be " + fmt(Math.round((kt === "mpg" ? 100 * (q.region === "uk" ? 3.785411784 : 4.54609) / (l100 * 1.609344) : (kt === "l100" ? 100 * (q.region === "uk" ? 3.785411784 : 4.54609) / (q.value * 1.609344) : q.value * 1.609344 / (q.region === "uk" ? 3.785411784 : 4.54609))) * 100) / 100) + "." : ""), note: "L/100 km = 235.215 ÷ mpg (US) or 282.481 ÷ mpg (UK); km/L = 100 ÷ L/100 km." };
    }
    case "pace": {
      const km = q.dist * (/^(?:mi|mile)/.test(q.du) ? 1.609344 : /^(?:m|meter|metre)/.test(q.du) && !/^mi/.test(q.du) ? 0.001 : 1), mi = km / 1.609344;
      const pk = q.secs / km, pm = q.secs / mi, f = (s) => Math.floor(s / 60) + ":" + String(Math.round(s % 60)).padStart(2, "0"), tot = q.secs >= 3600 ? Math.floor(q.secs / 3600) + ":" + String(Math.floor(q.secs % 3600 / 60)).padStart(2, "0") + ":" + String(q.secs % 60).padStart(2, "0") : f(q.secs);
      return { ok: true, kind: q.kind, value: Math.round(pk), title: "Running pace", text: "**" + fmt(q.dist) + " " + (q.du === "k" ? "km" : q.du) + " in " + tot + " is " + f(pk) + " min/km** (" + f(pm) + " min/mile), an average speed of " + fmt(Math.round(km / q.secs * 3600 * 100) / 100) + " km/h (" + fmt(Math.round(mi / q.secs * 3600 * 100) / 100) + " mph).", note: "Pace = time ÷ distance; the seconds are rounded to the nearest second." };
    }
    case "finish": {
      const units = q.perMile ? q.dist / (q.inKm ? 1.609344 : 1) : q.dist * (q.inKm ? 1 : 1.609344), secs = Math.round(units * q.paceSecs), h = Math.floor(secs / 3600), m2 = Math.floor(secs % 3600 / 60), s2 = secs % 60;
      const f = (n) => String(n).padStart(2, "0"), tot = h ? h + ":" + f(m2) + ":" + f(s2) : m2 + ":" + f(s2);
      return { ok: true, kind: q.kind, value: secs, title: "Finish time", text: "**" + fmt(q.dist) + (q.inKm ? " km" : " miles") + " at " + Math.floor(q.paceSecs / 60) + ":" + f(q.paceSecs % 60) + " per " + (q.perMile ? "mile" : "km") + " takes " + tot + "**" + (h ? " (" + tot + " as h:mm:ss)" : " (m:ss)") + ".", note: "Time = distance × pace" + (q.inKm === q.perMile ? ", converting between km and miles first (1 mile = 1.609344 km)" : "") + "." };
    }
    case "petyears": {
      const dog = q.pet === "dog"; const human = q.age <= 0 ? 0 : q.age <= 1 ? Math.round(15 * q.age) : q.age <= 2 ? Math.round(15 + 9 * (q.age - 1)) : Math.round(24 + (dog ? 5 : 4) * (q.age - 2));
      return { ok: true, kind: q.kind, value: human, title: (dog ? "Dog" : "Cat") + " years", text: "A **" + fmt(q.age) + "-year-old " + q.pet + " is about " + human + " in human years**: the first year counts as 15, the second adds 9, and each year after that adds " + (dog ? "5 (for a medium-sized dog)" : "4") + ".", note: dog ? "Veterinary guideline (AVMA): small dogs age a little slower and large breeds faster after year two. The old \"multiply by 7\" rule is a rough myth." : "The common veterinary guideline (15 + 9, then 4 a year); indoor and outdoor cats vary." };
    }
    case "generation": {
      const G = [[1901, 1927, "Greatest Generation", "part of the Greatest Generation"], [1928, 1945, "Silent Generation", "part of the Silent Generation"], [1946, 1964, "Baby Boomers", "a Baby Boomer"], [1965, 1980, "Generation X", "Generation X (a Gen Xer)"], [1981, 1996, "Millennials", "a Millennial (Generation Y)"], [1997, 2012, "Generation Z", "Generation Z (a Gen Zer)"], [2013, 2024, "Generation Alpha", "Generation Alpha"], [2025, 2039, "Generation Beta", "Generation Beta"]];
      const g = G.find((r) => q.year >= r[0] && q.year <= r[1]);
      if (!g) return { ok: false, error: "no commonly used generation label covers " + q.year };
      const edge = q.year === g[0] || q.year === g[1];
      return { ok: true, kind: q.kind, value: g[2], title: "Generation", text: "Someone born in **" + q.year + " is " + g[3] + "** (born " + g[0] + " to " + g[1] + ")." + (edge ? " That is a boundary year, and sources place the cut-off differently." : ""), note: "Ranges follow the Pew Research Center definitions; other sources shift the boundaries by a year or two." };
    }
    case "zodiac": {
      const Z = [["Capricorn", 1, 19], ["Aquarius", 2, 18], ["Pisces", 3, 20], ["Aries", 4, 19], ["Taurus", 5, 20], ["Gemini", 6, 20], ["Cancer", 7, 22], ["Leo", 8, 22], ["Virgo", 9, 22], ["Libra", 10, 22], ["Scorpio", 11, 21], ["Sagittarius", 12, 21], ["Capricorn", 12, 31]];
      const DIM = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]; if (q.day > DIM[q.mon - 1]) return { ok: false, error: "that month has no day " + q.day };
      const i = Z.findIndex((z) => q.mon < z[1] || (q.mon === z[1] && q.day <= z[2])), sign = Z[i][0], cusp = Z.some((z) => z[1] === q.mon && Math.abs(z[2] - q.day) <= 1);
      const MN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
      return { ok: true, kind: q.kind, value: sign, title: "Zodiac sign", text: "**" + MN[q.mon - 1] + " " + q.day + " is " + sign + "**." + (cusp ? " That date sits on the boundary between two signs, and the exact cut-off shifts by a day from year to year." : ""), note: "Western tropical zodiac dates (Aries starts at the March equinox); this is a calendar lookup, not a horoscope." };
    }
    case "chinese": {
      const A = ["Rat", "Ox", "Tiger", "Rabbit", "Dragon", "Snake", "Horse", "Goat", "Monkey", "Rooster", "Dog", "Pig"], EL = ["Wood", "Fire", "Earth", "Metal", "Water"];
      const idx = ((q.year - 1900) % 12 + 12) % 12, el = EL[Math.floor((((q.year - 1924) % 10) + 10) % 10 / 2)];
      return { ok: true, kind: q.kind, value: A[idx], title: "Chinese zodiac", text: "**" + q.year + " is the year of the " + A[idx] + "** (" + el + " " + A[idx] + " in the 60-year cycle). The animals repeat every 12 years: the next " + A[idx] + " years are " + (q.year + 12) + " and " + (q.year + 24) + ".", note: "The Chinese year starts at Lunar New Year (late January to mid February), so a birthday in January or early February " + q.year + " may belong to the previous animal, the " + A[(idx + 11) % 12] + "." };
    }
    case "anagram": {
      const key = (w) => w.replace(/[^a-z]/g, "").split("").sort().join(""), yes = key(q.a) === key(q.b) && q.a !== q.b;
      return { ok: true, kind: q.kind, value: yes, title: "Anagram check", text: yes ? "**Yes: " + q.a + " and " + q.b + " are anagrams**; both use exactly the letters " + key(q.a).split("").join(", ") + "." : q.a === q.b ? "**" + q.a + " and " + q.b + " are the same word**, so not an anagram of each other." : "**No: " + q.a + " and " + q.b + " are not anagrams** (" + q.a + " sorts to " + key(q.a) + ", " + q.b + " to " + key(q.b) + ").", note: "Two words are anagrams when their letters, sorted, are identical." };
    }
    case "acronym": {
      const all = q.words.map((w) => w[0].toUpperCase()).join(""), SMALL = new Set(["of", "the", "and", "for", "a", "an", "in", "on", "to", "by", "with", "at", "or", "de", "la", "du", "von", "van"]);
      const big = q.words.filter((w) => !SMALL.has(w)).map((w) => w[0].toUpperCase()).join("");
      return { ok: true, kind: q.kind, value: big, title: "Acronym", text: "**" + big + "** from \"" + q.words.join(" ") + "\"" + (big !== all ? " (dropping the small words; with every word it is " + all + ")" : "") + ".", note: "Built from the first letter of each word; real acronyms sometimes keep or drop small words differently (LASER keeps \"by\", NASA drops \"and\")." };
    }
    case "noconv": return { ok: true, kind: q.kind, value: null, title: "No fixed conversion for " + q.what, text: q.why, note: "Refused on purpose rather than answered from a rough table." };
    case "pizzas": {
      const slicesEach = q.kids ? 2 : 3, per = q.size === "large" ? 8 : q.size === "medium" ? 6 : 4, need = q.n * slicesEach, pies = Math.ceil(need / per);
      return { ok: true, kind: q.kind, value: pies, title: "Pizzas to order", text: "**" + pies + " " + q.size + " pizza" + (pies === 1 ? "" : "s") + " for " + q.n + " " + (q.kids ? "kids" : "people") + "**: " + slicesEach + " slices each is " + need + " slices, and a " + q.size + " has " + per + ", so " + need + " ÷ " + per + " = " + fmt(Math.round(need / per * 100) / 100) + ", rounded up.", note: "A common rule of thumb (3 slices per adult, 2 per child; large 8 slices, medium 6, small 4). Hungry crowds or a main-meal setting want one more." };
    }
    default: return { ok: false, error: "not an everyday request" };
  }
}

// ---------------------------------------------------------------------------
// say(): the written answer
// ---------------------------------------------------------------------------
const RANDOM_NOTE = "Drawn from the device's cryptographic random source, so it is a fair draw, not a guess.";
export function say(res) {
  if (!res.ok) return { title: "Everyday tool", body: res.error, result: res };
  switch (res.kind) {
    case "between": return { title: "Time between", body: "From **" + res.a + "** to **" + res.b + "** is **" + res.text + "**.", note: "Clock arithmetic on the two times (no dates involved).", result: res };
    case "clockadd": return { title: "Clock math", body: "**" + res.from + "** " + (res.delta >= 0 ? "plus" : "minus") + " " + fmtDur(Math.abs(res.delta)) + " is **" + res.text + "**.", result: res };
    case "tz": return { title: "Current time", body: "It is **" + res.text + "**.", note: "Read from this device's clock and the IANA time zone database built into the browser, including daylight-saving rules.", result: res };
    case "coin": return { title: "Coin flip", body: "**" + res.text + "**.", note: RANDOM_NOTE, result: res };
    case "dice": return { title: "Dice roll", body: "**" + res.text + "**.", note: RANDOM_NOTE, result: res };
    case "randnum": return { title: "Random number", body: "**" + res.text + "** (between " + res.lo + " and " + res.hi + ", inclusive).", note: RANDOM_NOTE, result: res };
    case "pick": return { title: "Pick", body: "**" + res.choice + "**. (Chose one of " + res.opts.length + ": " + res.opts.join(", ") + ".)", note: RANDOM_NOTE, result: res };
    case "shuffle": return { title: "Shuffled", body: "In random order:", pre: res.items.join("\n"), note: "Fisher-Yates shuffle. " + RANDOM_NOTE, result: res };
    case "uuid": return { title: res.ids.length === 1 ? "UUID" : res.ids.length + " UUIDs", body: "Random (version 4) UUID" + (res.ids.length === 1 ? "" : "s") + ":", pre: res.text, note: "122 random bits from the device's cryptographic source; the version and variant bits are set per RFC 4122.", result: res };
    case "lorem": return { title: "Placeholder text", body: res.n + " " + res.unit + " of lorem ipsum:", pre: res.text, note: "The classic Cicero-derived filler, so it carries no meaning.", result: res };
    case "tip": return { title: "Tip", body: "On a bill of **$" + usd(res.bill) + "**" + (res.ways ? ", split " + res.ways + " ways" : "") + ":", pre: res.text, note: "Tip = bill x rate; rounded to the cent.", result: res };
    case "bmi": return { title: "BMI", body: "**" + res.text + "**.", note: "BMI = weight (kg) / height (m)^2. Bands: under 18.5 underweight, 18.5-24.9 normal, 25-29.9 overweight, 30+ obese (WHO adult ranges; a rough screen, not a diagnosis).", result: res };
    case "loan": return { title: "Loan payment", body: "**$" + usd(res.payment) + " per month** on $" + usd(res.p) + " at " + res.rate + "% for " + res.months + " months.", pre: "monthly payment  $" + usd(res.payment) + "\ntotal paid       $" + usd(res.total) + "\ntotal interest   $" + usd(res.interest), note: "Standard amortisation: payment = P r / (1 - (1 + r)^-n) with r the monthly rate; taxes, insurance and fees are not included.", result: res };
    case "save": return { title: "Savings", body: "You would have **" + res.text + "**.", note: res.rate == null ? "Plain total, no interest; add “at 4%” for compound growth." : "Future value of an ordinary annuity; interest compounds each deposit period.", result: res };
    case "travel": return { title: "Travel time", body: "**" + res.d + " " + res.du + "** at **" + res.v + " " + res.vu + "** takes **" + res.text + "**.", note: "time = distance / speed" + (res.mixed ? ", after converting the units to match" : "") + ".", result: res };
    case "steps": return { title: "Steps to distance", body: "**" + res.text + "**.", note: "Estimate: assumes an average stride of 0.76 m (2.5 ft); your own stride may differ by 10-20%.", result: res };
    case "port": return { title: "Port: " + res.desc.replace(/ \(.*$/, ""), body: "**" + res.text + "**.", note: "IANA service name and port number registry / de-facto default.", result: res };
    case "portnum": return { title: "Port " + res.port, body: "**" + res.text + "**.", note: "IANA service name and port number registry / de-facto default.", result: res };
    case "yearago": case "yearahead": return { title: "Year", body: "**" + res.text + "**.", note: "Counted from the current year on this device's clock.", result: res };
    case "birthyear": return { title: "Birth year", body: "**" + res.text + "**.", note: "Counted from the current year on this device's clock.", result: res };
    case "randcolor": return { title: "Random colour", body: "**" + res.hex + "**", pre: "hex  " + res.hex + "\nrgb  " + res.rgb + "\nhsl  " + res.hsl, note: "Three random bytes, one per channel. " + RANDOM_NOTE, result: res };
    case "json": return res.valid
      ? { title: res.op === "minify" ? "Minified JSON" : res.op === "validate" ? "Valid JSON" : "Formatted JSON", body: (res.op === "validate" ? "Valid JSON: " : "") + (/^[aeiou]/.test(res.shape) ? "an " : "a ") + res.shape + (res.op === "minify" ? ", minified from " + res.bytes + " to " + res.outBytes + " characters:" : res.op === "validate" ? "." : ", formatted with 2-space indent:"), pre: res.op === "validate" ? undefined : res.value, note: "Parsed with the browser's JSON parser (RFC 8259), so anything it accepts is valid JSON; comments and trailing commas are not.", result: res }
      : { title: "Invalid JSON", body: "**" + res.text + "**.", note: "The browser's JSON parser rejected it. Common causes: single quotes, a trailing comma, unquoted keys, or a comment.", result: res };
    case "cron": return { title: "Cron expression", body: "**`" + res.expr + "`** runs " + res.reads + ".", pre: "# minute hour day-of-month month day-of-week\n" + res.expr + "  /path/to/command", note: "Standard five-field cron (minute hour day month weekday; 0 = Sunday). The times are in the cron daemon's own time zone, usually the server's.", result: res };
    case "calculus": return { title: "Calculus", body: "DI's calculator does arithmetic, not symbolic calculus. **Quelvra**, the site's verified math engine, does: open [" + res.what + " of " + res.expr + "](" + res.link + ") in Quelvra and it will work it out and check the result.", note: "Quelvra runs offline in the browser too; every answer it gives is verified by a second method before it is shown.", result: res };
    case "nolive": return { title: "No live data", body: "I cannot answer that: **" + res.topic + "** needs live data, and this engine runs entirely offline with no network access, so anything I said would be made up.", note: "Fixed facts, arithmetic, conversions, dates and code are what I do have. A weather, news or market site has the live figures.", result: res };
    case "translate": return { title: "Translation", body: "I cannot translate **" + res.phrase + "** into " + res.lang.charAt(0).toUpperCase() + res.lang.slice(1) + ": the only dictionary built into this engine is English, and guessing a word in another language could be wrong or rude.", note: "An offline dictionary app or a translation service will have it.", result: res };
    case "bitwise": return res.op === "not"
      ? { title: "Bitwise NOT", body: "**" + res.text + "**.", pre: "  " + res.abin + "  (" + res.a + ")\n~ " + res.rbin + "  (" + res.value + ")", note: "NOT flips every bit, so the answer depends on the width; say “not 5 in 16 bits” to choose it.", result: res }
      : { title: "Bitwise " + res.sym, body: "**" + res.text + "** (" + res.hex + ").", pre: "     " + res.abin + "  (" + res.a + ")\n" + res.sym.padEnd(5) + res.bbin + "  (" + res.b + ")\n=    " + res.rbin + "  (" + res.value + ")", note: "Exact integer arithmetic (arbitrary width); negative numbers use two's complement.", result: res };
    case "nearprime": return { title: "Prime search", body: "**" + res.text + "**.", note: "Checked by trial division, so it is exact.", result: res };
    case "wordlen": return { title: (res.which === "longest" ? "Longest" : "Shortest") + " word", body: "**" + res.value + "** (" + res.len + " letters" + (res.ties.length > 1 ? "; tied with " + res.ties.filter((w) => w !== res.value).join(", ") : "") + ") out of " + res.count + " words.", note: "Punctuation around words is ignored.", result: res };
    case "lettercount": return { title: "Letter count", body: "The letter **" + res.letter + "** appears **" + res.value + " " + (res.value === 1 ? "time" : "times") + "** (case-insensitive, " + res.total + " letters in all).", result: res };
    case "duration": return { title: "Duration", body: "**" + res.src + "** is **" + res.text + "** (" + res.hms + " as h:mm:ss).", note: "Plain arithmetic: 60 seconds a minute, 60 minutes an hour, 24 hours a day.", result: res };
    case "randpass": return { title: res.phrase ? "Passphrase" : "Password", body: (res.phrase ? res.n + " random words, about " + res.bits + " bits of entropy:" : res.n + " characters with at least one lowercase, uppercase, digit and symbol, about " + res.bits + " bits of entropy:"), pre: res.value, note: "Made on this device from the cryptographic random source and never sent anywhere; DI does not keep a copy. Use a password manager to store it.", result: res };
    case "html": return { title: res.op === "escape" ? "HTML escaped" : "HTML unescaped", body: res.changed ? (res.op === "escape" ? "With the five reserved characters (& < > \" ') replaced by entities:" : "With entities replaced by the characters they stand for:") : "Nothing to " + res.op + ": the text has no " + (res.op === "escape" ? "reserved characters" : "entities") + ".", pre: res.changed ? res.value : undefined, result: res };
    case "charcode": return { title: "Character code", body: "**" + (res.value < 32 || res.value === 127 ? (res.name || "control character") : res.ch) + "** is code point **" + res.value + "** (U+" + res.hex + ", " + (res.ascii ? "ASCII, binary " + res.bin : "beyond ASCII, so not one byte") + ")" + (res.name ? ", the " + res.name : "") + ".", pre: "decimal  " + res.value + "\nhex      U+" + res.hex + "\nutf-8    " + res.utf8 + (res.ascii ? "\nbinary   " + res.bin : ""), result: res };
    case "charfrom": return { title: "Character", body: "Code point **" + res.cp + "** (U+" + res.hex + ") is " + (res.ctrl ? "the **" + res.text + "** control character" : "**" + res.value + "**" + (res.name ? ", the " + res.name : "")) + (res.ascii ? " (ASCII)" : "") + ".", result: res };
    case "ip": {
      const r = res.range;
      return { title: "IP address", body: "**" + res.ip + "** is " + res.cls + ".", pre: r ? "network    " + r.network + "/" + res.prefix + "\nmask       " + r.mask + "\nbroadcast  " + r.broadcast + "\nhosts      " + r.first + " - " + r.last + " (" + r.usable.toLocaleString("en-US") + " usable of " + r.size.toLocaleString("en-US") + ")" : undefined, note: "IANA special-purpose address registry (RFC 6890); add /24 or similar for the subnet range.", result: res };
    }
    case "cidr": return { title: "Subnet /" + res.prefix, body: "**/" + res.prefix + "** is subnet mask **" + res.mask + "**: " + res.size.toLocaleString("en-US") + " addresses, **" + res.usable.toLocaleString("en-US") + " usable hosts**" + (res.prefix >= 31 ? " (a /31 or /32 has no separate network and broadcast addresses)" : " (network and broadcast addresses excluded)") + ".", pre: "mask       " + res.mask + "\nwildcard   " + res.wildcard + "\naddresses  " + res.size.toLocaleString("en-US") + "\nusable     " + res.usable.toLocaleString("en-US"), result: res };
    case "httpstatus": return { title: "HTTP " + res.code + " " + res.name, body: "**" + res.code + " " + res.name + "** is a " + res.cls + " status: " + res.meaning + ".", note: "RFC 9110 (HTTP semantics) and the IANA status code registry.", result: res };
    default: return { title: res.title || "Everyday tool", body: res.text || "", note: res.note, result: res };
  }
}
