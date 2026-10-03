// Universal Engine — fact packs (capitals, constants, periodic table).
// Deterministic, no imports (unit-testable in Node), no AI.
// Sources: curated reference data. Same input -> same output.

// ---------------------------------------------------------------------------
// Country capitals — ~200 entries including common aliases (UK, USA, etc.)
// ---------------------------------------------------------------------------
const CAPITALS = {
  "afghanistan": "Kabul",
  "albania": "Tirana",
  "algeria": "Algiers",
  "andorra": "Andorra la Vella",
  "angola": "Luanda",
  "antigua and barbuda": "Saint John's",
  "argentina": "Buenos Aires",
  "armenia": "Yerevan",
  "australia": "Canberra",
  "austria": "Vienna",
  "azerbaijan": "Baku",
  "bahamas": "Nassau",
  "bahrain": "Manama",
  "bangladesh": "Dhaka",
  "barbados": "Bridgetown",
  "belarus": "Minsk",
  "belgium": "Brussels",
  "belize": "Belmopan",
  "benin": "Porto-Novo",
  "bhutan": "Thimphu",
  "bolivia": "Sucre",
  "bosnia and herzegovina": "Sarajevo",
  "botswana": "Gaborone",
  "brazil": "Brasilia",
  "brunei": "Bandar Seri Begawan",
  "bulgaria": "Sofia",
  "burkina faso": "Ouagadougou",
  "burundi": "Gitega",
  "cabo verde": "Praia",
  "cambodia": "Phnom Penh",
  "cameroon": "Yaounde",
  "canada": "Ottawa",
  "central african republic": "Bangui",
  "chad": "N'Djamena",
  "chile": "Santiago",
  "china": "Beijing",
  "colombia": "Bogota",
  "comoros": "Moroni",
  "congo": "Brazzaville",
  "democratic republic of the congo": "Kinshasa",
  "costa rica": "San Jose",
  "croatia": "Zagreb",
  "cuba": "Havana",
  "cyprus": "Nicosia",
  "czech republic": "Prague",
  "czechia": "Prague",
  "denmark": "Copenhagen",
  "djibouti": "Djibouti",
  "dominica": "Roseau",
  "dominican republic": "Santo Domingo",
  "east timor": "Dili",
  "timor-leste": "Dili",
  "ecuador": "Quito",
  "egypt": "Cairo",
  "el salvador": "San Salvador",
  "equatorial guinea": "Malabo",
  "eritrea": "Asmara",
  "estonia": "Tallinn",
  "eswatini": "Mbabane",
  "swaziland": "Mbabane",
  "ethiopia": "Addis Ababa",
  "fiji": "Suva",
  "finland": "Helsinki",
  "france": "Paris",
  "gabon": "Libreville",
  "gambia": "Banjul",
  "georgia": "Tbilisi",
  "germany": "Berlin",
  "ghana": "Accra",
  "greece": "Athens",
  "grenada": "Saint George's",
  "guatemala": "Guatemala City",
  "guinea": "Conakry",
  "guinea-bissau": "Bissau",
  "guyana": "Georgetown",
  "haiti": "Port-au-Prince",
  "honduras": "Tegucigalpa",
  "hungary": "Budapest",
  "iceland": "Reykjavik",
  "india": "New Delhi",
  "indonesia": "Jakarta",
  "iran": "Tehran",
  "iraq": "Baghdad",
  "ireland": "Dublin",
  "israel": "Jerusalem",
  "italy": "Rome",
  "ivory coast": "Yamoussoukro",
  "cote d'ivoire": "Yamoussoukro",
  "jamaica": "Kingston",
  "japan": "Tokyo",
  "jordan": "Amman",
  "kazakhstan": "Astana",
  "kenya": "Nairobi",
  "kiribati": "Tarawa",
  "north korea": "Pyongyang",
  "south korea": "Seoul",
  "korea": "Seoul",
  "kosovo": "Pristina",
  "kuwait": "Kuwait City",
  "kyrgyzstan": "Bishkek",
  "laos": "Vientiane",
  "latvia": "Riga",
  "lebanon": "Beirut",
  "lesotho": "Maseru",
  "liberia": "Monrovia",
  "libya": "Tripoli",
  "liechtenstein": "Vaduz",
  "lithuania": "Vilnius",
  "luxembourg": "Luxembourg City",
  "madagascar": "Antananarivo",
  "malawi": "Lilongwe",
  "malaysia": "Kuala Lumpur",
  "maldives": "Male",
  "mali": "Bamako",
  "malta": "Valletta",
  "marshall islands": "Majuro",
  "mauritania": "Nouakchott",
  "mauritius": "Port Louis",
  "mexico": "Mexico City",
  "micronesia": "Palikir",
  "moldova": "Chisinau",
  "monaco": "Monaco",
  "mongolia": "Ulaanbaatar",
  "montenegro": "Podgorica",
  "morocco": "Rabat",
  "mozambique": "Maputo",
  "myanmar": "Naypyidaw",
  "burma": "Naypyidaw",
  "namibia": "Windhoek",
  "nauru": "Yaren",
  "nepal": "Kathmandu",
  "netherlands": "Amsterdam",
  "new zealand": "Wellington",
  "nicaragua": "Managua",
  "niger": "Niamey",
  "nigeria": "Abuja",
  "north macedonia": "Skopje",
  "macedonia": "Skopje",
  "norway": "Oslo",
  "oman": "Muscat",
  "pakistan": "Islamabad",
  "palau": "Ngerulmud",
  "palestine": "Ramallah",
  "panama": "Panama City",
  "papua new guinea": "Port Moresby",
  "paraguay": "Asuncion",
  "peru": "Lima",
  "philippines": "Manila",
  "poland": "Warsaw",
  "portugal": "Lisbon",
  "qatar": "Doha",
  "romania": "Bucharest",
  "russia": "Moscow",
  "rwanda": "Kigali",
  "saint kitts and nevis": "Basseterre",
  "saint lucia": "Castries",
  "saint vincent and the grenadines": "Kingstown",
  "samoa": "Apia",
  "san marino": "San Marino",
  "sao tome and principe": "Sao Tome",
  "saudi arabia": "Riyadh",
  "senegal": "Dakar",
  "serbia": "Belgrade",
  "seychelles": "Victoria",
  "sierra leone": "Freetown",
  "singapore": "Singapore",
  "slovakia": "Bratislava",
  "slovenia": "Ljubljana",
  "solomon islands": "Honiara",
  "somalia": "Mogadishu",
  "south africa": "Pretoria",
  "south sudan": "Juba",
  "spain": "Madrid",
  "sri lanka": "Sri Jayawardenepura Kotte",
  "sudan": "Khartoum",
  "suriname": "Paramaribo",
  "sweden": "Stockholm",
  "switzerland": "Bern",
  "syria": "Damascus",
  "taiwan": "Taipei",
  "tajikistan": "Dushanbe",
  "tanzania": "Dodoma",
  "thailand": "Bangkok",
  "togo": "Lome",
  "tonga": "Nuku'alofa",
  "trinidad and tobago": "Port of Spain",
  "tunisia": "Tunis",
  "turkey": "Ankara",
  "turkmenistan": "Ashgabat",
  "tuvalu": "Funafuti",
  "uganda": "Kampala",
  "ukraine": "Kyiv",
  "united arab emirates": "Abu Dhabi",
  "uae": "Abu Dhabi",
  "united kingdom": "London",
  "uk": "London",
  "england": "London",
  "scotland": "Edinburgh",
  "wales": "Cardiff",
  "northern ireland": "Belfast",
  "united states": "Washington, D.C.",
  "usa": "Washington, D.C.",
  "us": "Washington, D.C.",
  "united states of america": "Washington, D.C.",
  "uruguay": "Montevideo",
  "uzbekistan": "Tashkent",
  "vanuatu": "Port Vila",
  "vatican city": "Vatican City",
  "venezuela": "Caracas",
  "vietnam": "Hanoi",
  "yemen": "Sanaa",
  "zambia": "Lusaka",
  "zimbabwe": "Harare"
};

// ---------------------------------------------------------------------------
// Periodic table — all 118 elements
// ---------------------------------------------------------------------------
const ELEMENTS = [
  {z:1,sym:"H",name:"hydrogen",mass:1.008,cat:"nonmetal"},
  {z:2,sym:"He",name:"helium",mass:4.003,cat:"noble gas"},
  {z:3,sym:"Li",name:"lithium",mass:6.941,cat:"alkali metal"},
  {z:4,sym:"Be",name:"beryllium",mass:9.012,cat:"alkaline earth metal"},
  {z:5,sym:"B",name:"boron",mass:10.81,cat:"metalloid"},
  {z:6,sym:"C",name:"carbon",mass:12.011,cat:"nonmetal"},
  {z:7,sym:"N",name:"nitrogen",mass:14.007,cat:"nonmetal"},
  {z:8,sym:"O",name:"oxygen",mass:15.999,cat:"nonmetal"},
  {z:9,sym:"F",name:"fluorine",mass:18.998,cat:"halogen"},
  {z:10,sym:"Ne",name:"neon",mass:20.18,cat:"noble gas"},
  {z:11,sym:"Na",name:"sodium",mass:22.99,cat:"alkali metal"},
  {z:12,sym:"Mg",name:"magnesium",mass:24.305,cat:"alkaline earth metal"},
  {z:13,sym:"Al",name:"aluminum",mass:26.982,cat:"post-transition metal"},
  {z:14,sym:"Si",name:"silicon",mass:28.086,cat:"metalloid"},
  {z:15,sym:"P",name:"phosphorus",mass:30.974,cat:"nonmetal"},
  {z:16,sym:"S",name:"sulfur",mass:32.06,cat:"nonmetal"},
  {z:17,sym:"Cl",name:"chlorine",mass:35.45,cat:"halogen"},
  {z:18,sym:"Ar",name:"argon",mass:39.948,cat:"noble gas"},
  {z:19,sym:"K",name:"potassium",mass:39.098,cat:"alkali metal"},
  {z:20,sym:"Ca",name:"calcium",mass:40.078,cat:"alkaline earth metal"},
  {z:21,sym:"Sc",name:"scandium",mass:44.956,cat:"transition metal"},
  {z:22,sym:"Ti",name:"titanium",mass:47.867,cat:"transition metal"},
  {z:23,sym:"V",name:"vanadium",mass:50.942,cat:"transition metal"},
  {z:24,sym:"Cr",name:"chromium",mass:51.996,cat:"transition metal"},
  {z:25,sym:"Mn",name:"manganese",mass:54.938,cat:"transition metal"},
  {z:26,sym:"Fe",name:"iron",mass:55.845,cat:"transition metal"},
  {z:27,sym:"Co",name:"cobalt",mass:58.933,cat:"transition metal"},
  {z:28,sym:"Ni",name:"nickel",mass:58.693,cat:"transition metal"},
  {z:29,sym:"Cu",name:"copper",mass:63.546,cat:"transition metal"},
  {z:30,sym:"Zn",name:"zinc",mass:65.38,cat:"transition metal"},
  {z:31,sym:"Ga",name:"gallium",mass:69.723,cat:"post-transition metal"},
  {z:32,sym:"Ge",name:"germanium",mass:72.63,cat:"metalloid"},
  {z:33,sym:"As",name:"arsenic",mass:74.922,cat:"metalloid"},
  {z:34,sym:"Se",name:"selenium",mass:78.971,cat:"nonmetal"},
  {z:35,sym:"Br",name:"bromine",mass:79.904,cat:"halogen"},
  {z:36,sym:"Kr",name:"krypton",mass:83.798,cat:"noble gas"},
  {z:37,sym:"Rb",name:"rubidium",mass:85.468,cat:"alkali metal"},
  {z:38,sym:"Sr",name:"strontium",mass:87.62,cat:"alkaline earth metal"},
  {z:39,sym:"Y",name:"yttrium",mass:88.906,cat:"transition metal"},
  {z:40,sym:"Zr",name:"zirconium",mass:91.224,cat:"transition metal"},
  {z:41,sym:"Nb",name:"niobium",mass:92.906,cat:"transition metal"},
  {z:42,sym:"Mo",name:"molybdenum",mass:95.95,cat:"transition metal"},
  {z:43,sym:"Tc",name:"technetium",mass:98,cat:"transition metal"},
  {z:44,sym:"Ru",name:"ruthenium",mass:101.07,cat:"transition metal"},
  {z:45,sym:"Rh",name:"rhodium",mass:102.906,cat:"transition metal"},
  {z:46,sym:"Pd",name:"palladium",mass:106.42,cat:"transition metal"},
  {z:47,sym:"Ag",name:"silver",mass:107.868,cat:"transition metal"},
  {z:48,sym:"Cd",name:"cadmium",mass:112.414,cat:"transition metal"},
  {z:49,sym:"In",name:"indium",mass:114.818,cat:"post-transition metal"},
  {z:50,sym:"Sn",name:"tin",mass:118.71,cat:"post-transition metal"},
  {z:51,sym:"Sb",name:"antimony",mass:121.76,cat:"metalloid"},
  {z:52,sym:"Te",name:"tellurium",mass:127.6,cat:"metalloid"},
  {z:53,sym:"I",name:"iodine",mass:126.904,cat:"halogen"},
  {z:54,sym:"Xe",name:"xenon",mass:131.293,cat:"noble gas"},
  {z:55,sym:"Cs",name:"cesium",mass:132.905,cat:"alkali metal"},
  {z:56,sym:"Ba",name:"barium",mass:137.327,cat:"alkaline earth metal"},
  {z:57,sym:"La",name:"lanthanum",mass:138.905,cat:"lanthanide"},
  {z:58,sym:"Ce",name:"cerium",mass:140.116,cat:"lanthanide"},
  {z:59,sym:"Pr",name:"praseodymium",mass:140.908,cat:"lanthanide"},
  {z:60,sym:"Nd",name:"neodymium",mass:144.242,cat:"lanthanide"},
  {z:61,sym:"Pm",name:"promethium",mass:145,cat:"lanthanide"},
  {z:62,sym:"Sm",name:"samarium",mass:150.36,cat:"lanthanide"},
  {z:63,sym:"Eu",name:"europium",mass:151.964,cat:"lanthanide"},
  {z:64,sym:"Gd",name:"gadolinium",mass:157.25,cat:"lanthanide"},
  {z:65,sym:"Tb",name:"terbium",mass:158.925,cat:"lanthanide"},
  {z:66,sym:"Dy",name:"dysprosium",mass:162.5,cat:"lanthanide"},
  {z:67,sym:"Ho",name:"holmium",mass:164.93,cat:"lanthanide"},
  {z:68,sym:"Er",name:"erbium",mass:167.259,cat:"lanthanide"},
  {z:69,sym:"Tm",name:"thulium",mass:168.934,cat:"lanthanide"},
  {z:70,sym:"Yb",name:"ytterbium",mass:173.045,cat:"lanthanide"},
  {z:71,sym:"Lu",name:"lutetium",mass:174.967,cat:"lanthanide"},
  {z:72,sym:"Hf",name:"hafnium",mass:178.49,cat:"transition metal"},
  {z:73,sym:"Ta",name:"tantalum",mass:180.948,cat:"transition metal"},
  {z:74,sym:"W",name:"tungsten",mass:183.84,cat:"transition metal"},
  {z:75,sym:"Re",name:"rhenium",mass:186.207,cat:"transition metal"},
  {z:76,sym:"Os",name:"osmium",mass:190.23,cat:"transition metal"},
  {z:77,sym:"Ir",name:"iridium",mass:192.217,cat:"transition metal"},
  {z:78,sym:"Pt",name:"platinum",mass:195.084,cat:"transition metal"},
  {z:79,sym:"Au",name:"gold",mass:196.967,cat:"transition metal"},
  {z:80,sym:"Hg",name:"mercury",mass:200.592,cat:"transition metal"},
  {z:81,sym:"Tl",name:"thallium",mass:204.38,cat:"post-transition metal"},
  {z:82,sym:"Pb",name:"lead",mass:207.2,cat:"post-transition metal"},
  {z:83,sym:"Bi",name:"bismuth",mass:208.98,cat:"post-transition metal"},
  {z:84,sym:"Po",name:"polonium",mass:209,cat:"post-transition metal"},
  {z:85,sym:"At",name:"astatine",mass:210,cat:"halogen"},
  {z:86,sym:"Rn",name:"radon",mass:222,cat:"noble gas"},
  {z:87,sym:"Fr",name:"francium",mass:223,cat:"alkali metal"},
  {z:88,sym:"Ra",name:"radium",mass:226,cat:"alkaline earth metal"},
  {z:89,sym:"Ac",name:"actinium",mass:227,cat:"actinide"},
  {z:90,sym:"Th",name:"thorium",mass:232.038,cat:"actinide"},
  {z:91,sym:"Pa",name:"protactinium",mass:231.036,cat:"actinide"},
  {z:92,sym:"U",name:"uranium",mass:238.029,cat:"actinide"},
  {z:93,sym:"Np",name:"neptunium",mass:237,cat:"actinide"},
  {z:94,sym:"Pu",name:"plutonium",mass:244,cat:"actinide"},
  {z:95,sym:"Am",name:"americium",mass:243,cat:"actinide"},
  {z:96,sym:"Cm",name:"curium",mass:247,cat:"actinide"},
  {z:97,sym:"Bk",name:"berkelium",mass:247,cat:"actinide"},
  {z:98,sym:"Cf",name:"californium",mass:251,cat:"actinide"},
  {z:99,sym:"Es",name:"einsteinium",mass:252,cat:"actinide"},
  {z:100,sym:"Fm",name:"fermium",mass:257,cat:"actinide"},
  {z:101,sym:"Md",name:"mendelevium",mass:258,cat:"actinide"},
  {z:102,sym:"No",name:"nobelium",mass:259,cat:"actinide"},
  {z:103,sym:"Lr",name:"lawrencium",mass:266,cat:"actinide"},
  {z:104,sym:"Rf",name:"rutherfordium",mass:267,cat:"transition metal"},
  {z:105,sym:"Db",name:"dubnium",mass:268,cat:"transition metal"},
  {z:106,sym:"Sg",name:"seaborgium",mass:269,cat:"transition metal"},
  {z:107,sym:"Bh",name:"bohrium",mass:270,cat:"transition metal"},
  {z:108,sym:"Hs",name:"hassium",mass:277,cat:"transition metal"},
  {z:109,sym:"Mt",name:"meitnerium",mass:278,cat:"transition metal"},
  {z:110,sym:"Ds",name:"darmstadtium",mass:281,cat:"transition metal"},
  {z:111,sym:"Rg",name:"roentgenium",mass:282,cat:"transition metal"},
  {z:112,sym:"Cn",name:"copernicium",mass:285,cat:"transition metal"},
  {z:113,sym:"Nh",name:"nihonium",mass:286,cat:"post-transition metal"},
  {z:114,sym:"Fl",name:"flerovium",mass:289,cat:"post-transition metal"},
  {z:115,sym:"Mc",name:"moscovium",mass:290,cat:"post-transition metal"},
  {z:116,sym:"Lv",name:"livermorium",mass:293,cat:"post-transition metal"},
  {z:117,sym:"Ts",name:"tennessine",mass:294,cat:"halogen"},
  {z:118,sym:"Og",name:"oganesson",mass:294,cat:"noble gas"},
];

// ---------------------------------------------------------------------------
// Physical, mathematical, and astronomical constants
// ---------------------------------------------------------------------------
const CONSTANTS = {
  // Fundamental physics
  "speed of light": { value: 2.99792458e8, unit: "m/s", desc: "Speed of light in vacuum (c)." },
  "c": { value: 2.99792458e8, unit: "m/s", desc: "Speed of light in vacuum." },
  "gravitational constant": { value: 6.67430e-11, unit: "m^3 kg^-1 s^-2", desc: "Newtonian constant of gravitation (G)." },
  "g constant": { value: 6.67430e-11, unit: "m^3 kg^-1 s^-2", desc: "Newtonian constant of gravitation (G)." },
  "planck constant": { value: 6.62607015e-34, unit: "J s", desc: "Planck constant (h)." },
  "h constant": { value: 6.62607015e-34, unit: "J s", desc: "Planck constant." },
  "boltzmann constant": { value: 1.380649e-23, unit: "J/K", desc: "Boltzmann constant (k_B)." },
  "k_b": { value: 1.380649e-23, unit: "J/K", desc: "Boltzmann constant." },
  "avogadro number": { value: 6.02214076e23, unit: "mol^-1", desc: "Avogadro constant (N_A)." },
  "avogadro constant": { value: 6.02214076e23, unit: "mol^-1", desc: "Avogadro constant (N_A)." },
  "n_a": { value: 6.02214076e23, unit: "mol^-1", desc: "Avogadro constant." },
  "elementary charge": { value: 1.602176634e-19, unit: "C", desc: "Elementary electric charge (e)." },
  "electron mass": { value: 9.1093837015e-31, unit: "kg", desc: "Rest mass of the electron." },
  "proton mass": { value: 1.67262192369e-27, unit: "kg", desc: "Rest mass of the proton." },
  "neutron mass": { value: 1.67492749804e-27, unit: "kg", desc: "Rest mass of the neutron." },
  "vacuum permittivity": { value: 8.8541878128e-12, unit: "F/m", desc: "Electric constant / permittivity of free space (epsilon_0)." },
  "vacuum permeability": { value: 1.25663706212e-6, unit: "N/A^2", desc: "Magnetic constant / permeability of free space (mu_0)." },
  "gas constant": { value: 8.314462618, unit: "J/(mol K)", desc: "Ideal gas constant (R)." },
  "r constant": { value: 8.314462618, unit: "J/(mol K)", desc: "Ideal gas constant (R)." },
  "stefan-boltzmann constant": { value: 5.670374419e-8, unit: "W m^-2 K^-4", desc: "Stefan-Boltzmann constant (sigma)." },
  "fine structure constant": { value: 7.2973525693e-3, unit: "dimensionless", desc: "Fine-structure constant (alpha), characterizes electromagnetic interaction strength." },
  "bohr radius": { value: 5.29177210903e-11, unit: "m", desc: "Bohr radius (a_0), the most probable distance of the electron from the nucleus in the hydrogen ground state." },

  // Mathematical constants
  "pi": { value: 3.141592653589793, unit: "dimensionless", desc: "Ratio of a circle's circumference to its diameter." },
  "euler number": { value: 2.718281828459045, unit: "dimensionless", desc: "Base of the natural logarithm (e)." },
  "eulers number": { value: 2.718281828459045, unit: "dimensionless", desc: "Base of the natural logarithm (e)." },
  "golden ratio": { value: 1.618033988749895, unit: "dimensionless", desc: "The golden ratio (phi), (1 + sqrt(5)) / 2." },
  "phi": { value: 1.618033988749895, unit: "dimensionless", desc: "The golden ratio, (1 + sqrt(5)) / 2." },
  "sqrt 2": { value: 1.4142135623730951, unit: "dimensionless", desc: "Square root of 2, the diagonal of a unit square." },
  "sqrt 3": { value: 1.7320508075688772, unit: "dimensionless", desc: "Square root of 3." },
  "euler-mascheroni constant": { value: 0.5772156649015329, unit: "dimensionless", desc: "Euler-Mascheroni constant (gamma), the limiting difference between the harmonic series and the natural logarithm." },
  "apery constant": { value: 1.2020569031595942, unit: "dimensionless", desc: "Apery's constant, zeta(3), the sum of the reciprocals of the positive cubes." },

  // Astronomical
  "speed of sound": { value: 343, unit: "m/s", desc: "Speed of sound in dry air at 20 degrees C (about 1,235 km/h); it rises with temperature and is much faster in water (~1,480 m/s) and steel (~5,960 m/s)." },
  "earth mass": { value: 5.972e24, unit: "kg", desc: "Mass of the Earth." },
  "earth radius": { value: 6.371e6, unit: "m", desc: "Mean radius of the Earth." },
  "solar mass": { value: 1.989e30, unit: "kg", desc: "Mass of the Sun." },
  "sun mass": { value: 1.989e30, unit: "kg", desc: "Mass of the Sun." },
  "solar luminosity": { value: 3.828e26, unit: "W", desc: "Luminosity of the Sun." },
  "astronomical unit": { value: 1.495978707e11, unit: "m", desc: "Mean Earth-Sun distance (au)." },
  "au": { value: 1.495978707e11, unit: "m", desc: "Astronomical unit, mean Earth-Sun distance." },
  "light year": { value: 9.4607e15, unit: "m", desc: "Distance light travels in one Julian year." },
  "parsec": { value: 3.0857e16, unit: "m", desc: "One parsec, the distance at which 1 au subtends one arcsecond." },

  // Standard reference values
  "standard atmosphere": { value: 101325, unit: "Pa", desc: "Standard atmospheric pressure (1 atm)." },
  "standard gravity": { value: 9.80665, unit: "m/s^2", desc: "Standard acceleration due to gravity (g_n)." },
  "water triple point": { value: 273.16, unit: "K", desc: "Triple point of water." },
};

// ---------------------------------------------------------------------------
// Matching: whole-word phrase search over the question, longest key first, so
// "speed of light" keeps its "of", and a one-letter key like "c" or an alias
// like "us" can never match inside another word ("planck", "belarus").
// ---------------------------------------------------------------------------
function clean(input) {
  return " " + String(input || "").toLowerCase().replace(/[’']/g, "'").replace(/'s\b/g, "").replace(/[?.!,;:()]/g, " ").replace(/\s+/g, " ").trim() + " ";
}
const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
function findKey(text, keys) {
  for (const k of keys) if (new RegExp("(?:^|\\s)" + esc(k) + "(?=\\s|$)").test(text)) return k;
  return null;
}
const byLen = (a, b) => b.length - a.length;
const CAP_KEYS = Object.keys(CAPITALS).sort(byLen);
for (const [a, k] of [["euler", "euler number"], ["e number", "euler number"], ["golden mean", "golden ratio"], ["speed of light in vacuum", "speed of light"], ["gravity", "standard gravity"], ["atmospheric pressure", "standard atmosphere"], ["lightyear", "light year"], ["mass of the earth", "earth mass"], ["mass of the sun", "solar mass"], ["radius of the earth", "earth radius"], ["square root of 2", "sqrt 2"], ["square root of 3", "sqrt 3"], ["avogadros number", "avogadro number"], ["avogadro's number", "avogadro number"], ["mass of a proton", "proton mass"], ["mass of the proton", "proton mass"], ["mass of an electron", "electron mass"], ["mass of the electron", "electron mass"], ["mass of a neutron", "neutron mass"], ["mass of the neutron", "neutron mass"], ["charge of an electron", "elementary charge"], ["electron charge", "elementary charge"], ["sound speed", "speed of sound"], ["plancks constant", "planck constant"], ["gravitational acceleration", "standard gravity"]])
  if (!CONSTANTS[a]) CONSTANTS[a] = CONSTANTS[k];
const CONST_KEYS = Object.keys(CONSTANTS).sort(byLen);
const EL_NAMES = ELEMENTS.map((e) => e.name).sort(byLen);
// alternate spellings people type
const EL_ALIAS = { aluminium: "aluminum", sulphur: "sulfur", caesium: "cesium" };

const EL_BY_NAME = {}, EL_BY_SYM = {}, EL_BY_Z = {};
for (const el of ELEMENTS) { EL_BY_NAME[el.name] = el; EL_BY_SYM[el.sym.toLowerCase()] = el; EL_BY_Z[el.z] = el; }
const titleCase = (s) => s.replace(/(^|[\s-])([a-z])/g, (m, a, c) => a + c.toUpperCase()).replace(/\b(And|Of|The)\b/g, (w) => w.toLowerCase());
// display names for short aliases, so "uk" answers as "United Kingdom"
const DISPLAY = { england: "England (United Kingdom)", scotland: "Scotland (United Kingdom)", wales: "Wales (United Kingdom)", "northern ireland": "Northern Ireland (United Kingdom)", uk: "United Kingdom", usa: "United States", us: "United States", "united states of america": "United States", uae: "United Arab Emirates", korea: "South Korea", burma: "Myanmar", swaziland: "Eswatini", macedonia: "North Macedonia", "czech republic": "Czechia", "east timor": "Timor-Leste", "ivory coast": "Cote d'Ivoire" };
const countryName = (k) => DISPLAY[k] || titleCase(k);
// names read with "the" in a sentence ("the capital of the Netherlands")
const THE = /^(united |netherlands|philippines|bahamas|gambia|central african|czech republic|dominican republic|democratic republic|republic of|maldives|marshall islands|solomon islands|seychelles|comoros|vatican)/i;
export const withThe = (name) => (THE.test(name) ? "the " : "") + name;
const elRes = (el) => ({ ok: true, z: el.z, sym: el.sym, name: el.name, mass: el.mass, cat: el.cat });

// capital("what is the capital of france") => { ok, country, capital }
// Also answers the reverse: "paris is the capital of which country".
export function capital(input) {
  const t = clean(input);
  const k = findKey(t, CAP_KEYS);
  if (k) return { ok: true, country: countryName(k), capital: CAPITALS[k] };
  for (const c of CAP_KEYS) {
    const city = CAPITALS[c].toLowerCase();
    if (/which country|what country|capital of what/.test(t) && t.includes(" " + city + " ")) return { ok: true, country: countryName(c), capital: CAPITALS[c], reverse: true };
  }
  return { ok: false, error: "no country found", countries: CAP_KEYS.length };
}

// constant("speed of light") => { ok, name, value, unit, desc }
export function constant(input) {
  const t = clean(input);
  const k = findKey(t, CONST_KEYS);
  if (!k) return { ok: false, error: "no constant found" };
  const c = CONSTANTS[k];
  return { ok: true, name: k, value: c.value, unit: c.unit, desc: c.desc };
}

// element("gold" | "Au" | "26" | "element 26") => { ok, z, sym, name, mass, cat }
export function element(input, byNumber = true) {
  const t = clean(input);
  for (const a in EL_ALIAS) if (t.includes(" " + a + " ")) return elRes(EL_BY_NAME[EL_ALIAS[a]]);
  const n = findKey(t, EL_NAMES);
  if (n) return elRes(EL_BY_NAME[n]);
  const z = t.match(/(?:^|\s)(\d{1,3})(?=\s|$)/);
  if (byNumber && z && EL_BY_Z[+z[1]]) return elRes(EL_BY_Z[+z[1]]);
  // a symbol is only trusted when written with its real casing ("Fe", "Au"),
  // so ordinary words like "he", "in", "no", "as" are never read as elements.
  const raw = String(input || "").match(/\b[A-Z][a-z]?\b/g) || [];
  for (const s of raw) { const el = EL_BY_SYM[s.toLowerCase()]; if (el && el.sym === s && s !== "I") return elRes(el); }
  return { ok: false, error: "no element found", count: ELEMENTS.length };
}

// sci(2.99792458e8) => "2.99792458 x 10^8"; ordinary magnitudes print as-is.
export function sci(v) {
  if (v === 0 || (Math.abs(v) >= 1e-3 && Math.abs(v) < 1e6)) return String(v);
  const [m, e] = v.toExponential().split("e");
  return m + " x 10^" + (+e);
}

// everyday reference facts, matched on the whole question so nothing nearby is misread
const TRIVIA = [
  [/^(?:how many|number of) continents(?: are there)?(?: in the world| on earth)?$/, "There are 7 continents by the most common count: Africa, Antarctica, Asia, Australia (Oceania), Europe, North America and South America."],
  [/^(?:how many|number of) oceans(?: are there)?(?: in the world| on earth)?$/, "There are 5 oceans: Pacific, Atlantic, Indian, Southern and Arctic."],
  [/^(?:how many|number of) planets(?: are there| are| exist)?(?: in (?:the|our) solar system)?$/, "There are 8 planets in the solar system: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus and Neptune."],
  [/^(?:what is |whats |how (?:far|long) is )?(?:the |an? )?(?:(?:official |full |standard )?marathon|marathon distance|length of a marathon|distance of a marathon)(?: distance| length)?(?: in (?:km|kilometers|kilometres|miles|meters|metres))?$/, "A marathon is 42.195 km (26.219 miles, 26 miles 385 yards); the distance was fixed in 1921 from the 1908 London Olympic course."],
  [/^(?:what is |whats |how (?:far|long) is )?(?:the |an? )?(?:half[- ]marathon|half marathon distance|length of a half marathon|distance of a half marathon)(?: distance| length)?(?: in (?:km|kilometers|kilometres|miles|meters|metres))?$/, "A half marathon is 21.0975 km (13.109 miles), exactly half the marathon distance of 42.195 km."],
  [/^(?:what is |whats |how (?:far|long) is )?(?:a |an )?(?:5k|5 k|five k)(?: run| race| distance)?(?: in (?:miles|km|kilometers|kilometres))?$/, "A 5K is 5 kilometres, which is 3.107 miles (about 12.5 laps of a 400 m track)."],
  [/^(?:what is |whats |how (?:far|long) is )?(?:a |an )?(?:10k|10 k|ten k)(?: run| race| distance)?(?: in (?:miles|km|kilometers|kilometres))?$/, "A 10K is 10 kilometres, which is 6.214 miles (25 laps of a 400 m track)."],
  [/^(?:how far (?:away )?is|(?:what is |whats )?(?:the )?distance (?:to|of|from earth to)) (?:the )?moon(?: from (?:the )?earth)?$/, "The Moon is about 384,400 km (238,900 miles) from Earth on average; its orbit is elliptical, so the distance ranges from roughly 363,300 km (perigee) to 405,500 km (apogee)."],
  [/^(?:how far (?:away )?is|(?:what is |whats )?(?:the )?distance (?:to|of|from earth to)) (?:the )?sun(?: from (?:the )?earth)?$/, "The Sun is about 149.6 million km (93 million miles) from Earth on average, a distance defined as 1 astronomical unit (AU); light takes about 8 minutes 20 seconds to cover it."],
  [/^(?:how (?:tall|high) is|(?:what is |whats )?(?:the )?(?:height|elevation) of) (?:mount |mt\.? )?everest$/, "Mount Everest is 8,848.86 m (29,031.7 ft) above sea level, the 2020 figure agreed by China and Nepal; it is the highest point on Earth."],
  [/^(?:what is |whats )?(?:the )?(?:tallest|highest) mountain(?: in the world| on earth)?$/, "Mount Everest, at 8,848.86 m (29,031.7 ft) above sea level, is the highest mountain on Earth."],
  [/^(?:what is |whats )?(?:the )?(?:deepest|lowest) (?:point|place)(?: in the ocean| on earth| in the world)?$/, "The Challenger Deep in the Mariana Trench, about 10,935 m (35,876 ft) below sea level, is the deepest known point in the ocean."],
  [/^(?:what is |whats )?(?:the )?(?:longest river)(?: in the world| on earth)?$/, "The Nile (about 6,650 km) is usually named the longest river, though some measurements put the Amazon (about 6,400 km or more, depending on the source counted) ahead of it."],
  [/^(?:what is |whats )?(?:the )?(?:largest|biggest) ocean(?: in the world| on earth)?$/, "The Pacific Ocean is the largest, covering about 165 million square km, more than all the land on Earth combined."],
  [/^(?:what is |whats )?(?:the )?(?:largest|biggest) (?:country|nation)(?: in the world| on earth| by area)?$/, "Russia is the largest country by area, at about 17.1 million square km."],
  [/^(?:what is |whats )?(?:the )?(?:largest|biggest) desert(?: in the world| on earth)?$/, "Antarctica is the largest desert (about 14 million square km, a desert by rainfall); the Sahara, at about 9 million square km, is the largest hot desert."],
  [/^(?:what is |whats )?(?:the )?(?:speed of sound)(?: in air)?$/, "Sound travels at about 343 m/s (1,235 km/h, 767 mph) in dry air at 20 degrees C; it is faster in warmer air and much faster in water (about 1,480 m/s)."],
  [/^(?:how (?:hot|warm) is|(?:what is |whats )?(?:the )?(?:surface )?temperature of) (?:the )?sun(?:'s surface)?$/, "The Sun's surface (photosphere) is about 5,500 degrees C (5,772 K); its core is about 15 million degrees C."],
  [/^(?:how many|number of) (?:moons?|natural satellites?) (?:does|do) (?:the )?earth have$/, "Earth has 1 natural moon."],
  [/^(?:how many|number of) (?:moons?|natural satellites?) (?:does|do) (?:the )?(?:planet )?mars have$/, "Mars has 2 moons, Phobos and Deimos."],
  [/^(?:how many|number of) (?:chromosomes?) (?:do|does) (?:a )?humans?(?: have)?$/, "Humans have 46 chromosomes, in 23 pairs."],
  [/^(?:how many|number of) (?:elements?) (?:are (?:there |in )?|on |in )?(?:the )?periodic table$/, "The periodic table has 118 confirmed elements, from hydrogen (1) to oganesson (118)."],
  [/^(?:how many|number of) (?:keys?) (?:are (?:there )?)?on a piano$/, "A standard piano has 88 keys: 52 white and 36 black."],
  [/^(?:how many|number of) (?:strings?) (?:does|do|on) (?:a )?(?:standard )?guitars?(?: have)?$/, "A standard guitar has 6 strings (a bass guitar usually has 4)."],
  [/^(?:how many|number of) (?:players?) (?:are (?:there )?)?(?:on|in) a (?:soccer|football) team$/, "A soccer (association football) team fields 11 players, one of them the goalkeeper."],
  [/^(?:how many|number of) (?:cards?) (?:are (?:there )?)?in a (?:standard |normal )?(?:deck|pack)(?: of (?:playing )?cards)?$/, "A standard deck has 52 cards: 4 suits of 13, plus usually 2 jokers that are not counted."],
  [/^(?:how many|number of) (?:squares?) (?:are (?:there )?)?on a (?:chess ?board|checkerboard)$/, "A chessboard has 64 squares, 8 by 8."],
  [/^(?:how many|number of) (?:zeros?) (?:are (?:there )?)?in (?:a |one )?million$/, "A million is 1,000,000: six zeros."],
  [/^(?:how many|number of) (?:zeros?) (?:are (?:there )?)?in (?:a |one )?billion$/, "A billion is 1,000,000,000: nine zeros (the short scale used in English today)."],
  [/^(?:how many|number of) (?:zeros?) (?:are (?:there )?)?in (?:a |one )?trillion$/, "A trillion is 1,000,000,000,000: twelve zeros (short scale)."],
  [/^(?:how many|number of) (?:zeros?) (?:are (?:there )?)?in (?:a |one )?googol$/, "A googol is 10 to the power 100: a 1 followed by 100 zeros."],
  [/^(?:what is |whats )?(?:the )?(?:largest|biggest) planet(?: in (?:the|our) solar system)?$/, "Jupiter is the largest planet in the solar system."],
  [/^(?:what is |whats )?(?:the )?(?:smallest) planet(?: in (?:the|our) solar system)?$/, "Mercury is the smallest planet in the solar system."],
  [/^(?:how many|number of) bones(?: are there)? in (?:the|an?) (?:adult )?human(?: body)?$/, "An adult human body has 206 bones (babies are born with around 270, which fuse as they grow)."],
  [/^(?:how many|number of) teeth(?: does)? (?:an? )?adults?(?: human)?(?: have)?$/, "An adult usually has 32 permanent teeth, including 4 wisdom teeth."],
  [/^(?:what is |whats )?(?:the )?boiling point of (?:pure )?water(?: in (?:celsius|centigrade|c|degrees c(?:elsius)?))?$/, "Water boils at 100 degrees C (212 degrees F) at sea-level pressure; it boils at a lower temperature higher up."],
  [/^(?:what is |whats )?(?:the )?boiling point of (?:pure )?water in (?:fahrenheit|f|degrees f(?:ahrenheit)?)$/, "Water boils at 212 degrees F (100 degrees C) at sea-level pressure; it boils at a lower temperature higher up."],
  [/^(?:what is |whats )?(?:the )?boiling point of (?:pure )?water in (?:kelvin|k)$/, "Water boils at 373.15 K (100 degrees C, 212 degrees F) at sea-level pressure."],
  [/^(?:what is |whats )?(?:the )?(?:freezing|melting) point of (?:pure )?water(?: in (?:celsius|centigrade|c|degrees c(?:elsius)?))?$/, "Water freezes at 0 degrees C (32 degrees F) at sea-level pressure."],
  [/^(?:what is |whats )?(?:the )?(?:freezing|melting) point of (?:pure )?water in (?:fahrenheit|f|degrees f(?:ahrenheit)?)$/, "Water freezes at 32 degrees F (0 degrees C) at sea-level pressure."],
  [/^(?:what is |whats )?(?:the )?(?:freezing|melting) point of (?:pure )?water in (?:kelvin|k)$/, "Water freezes at 273.15 K (0 degrees C, 32 degrees F) at sea-level pressure."],
  [/^(?:how many|number of) days(?: are there)? in a leap year$/, "A leap year has 366 days (February has 29)."],
  [/^(?:how many|number of) days(?: are there)? in a (?:common|normal|non leap|regular) year$/, "A common year has 365 days."],
  [/^(?:what is |whats )?(?:the )?(?:tallest|highest) mountain(?: in the world| on earth)?$/, "Mount Everest is the highest mountain above sea level, about 8,849 m (29,032 ft)."],
  [/^(?:what is |whats )?(?:the )?(?:largest|biggest) ocean(?: in the world| on earth)?$/, "The Pacific is the largest ocean."],
  [/^(?:what is |whats )?(?:the )?(?:largest|biggest) continent$/, "Asia is the largest continent, by both area and population."],
];
const AUTHORS = { "romeo and juliet": "William Shakespeare", hamlet: "William Shakespeare", macbeth: "William Shakespeare", othello: "William Shakespeare", "king lear": "William Shakespeare", "a midsummer night dream": "William Shakespeare", "pride and prejudice": "Jane Austen", "emma": "Jane Austen", "1984": "George Orwell", "nineteen eighty four": "George Orwell", "animal farm": "George Orwell", "war and peace": "Leo Tolstoy", "anna karenina": "Leo Tolstoy", "the odyssey": "Homer", "the iliad": "Homer", "don quixote": "Miguel de Cervantes", "moby dick": "Herman Melville", "to kill a mockingbird": "Harper Lee", "the great gatsby": "F. Scott Fitzgerald", "on the origin of species": "Charles Darwin", "the origin of species": "Charles Darwin", "crime and punishment": "Fyodor Dostoevsky", "frankenstein": "Mary Shelley", "dracula": "Bram Stoker", "the hobbit": "J. R. R. Tolkien", "the lord of the rings": "J. R. R. Tolkien", "a tale of two cities": "Charles Dickens", "great expectations": "Charles Dickens", "oliver twist": "Charles Dickens", "the divine comedy": "Dante Alighieri", "les miserables": "Victor Hugo", "jane eyre": "Charlotte Bronte", "wuthering heights": "Emily Bronte", "the adventures of tom sawyer": "Mark Twain", "adventures of huckleberry finn": "Mark Twain", "the catcher in the rye": "J. D. Salinger", "brave new world": "Aldous Huxley", "the old man and the sea": "Ernest Hemingway", "one hundred years of solitude": "Gabriel Garcia Marquez" };
export function trivia(input) {
  const t = clean(input).trim().replace(/^(?:tell me |do you know )/, "");
  for (const [re, text] of TRIVIA) if (re.test(t)) return { ok: true, trivia: true, text };
  const w = t.match(/^who (?:wrote|is the author of|authored) (.+)$/) || t.match(/^(?:who is the |the )?author of (.+)$/);
  if (w) { const k = w[1].replace(/^(?:the (?:book|novel|play|poem) )/, "").trim(); const a = AUTHORS[k] || AUTHORS["the " + k];
    if (a) return { ok: true, trivia: true, text: titleCase(k).replace(/^[a-z]/, (c) => c.toUpperCase()) + " was written by " + a + "." }; }
  return { ok: false, error: "no trivia found" };
}

// facts(input) — pick the pack from the question's wording, then fall through.
// common chemical formulas, read case-insensitively ("what is h2o")
const COMPOUNDS = { h2o: "water", co2: "carbon dioxide", co: "carbon monoxide", o2: "oxygen gas", o3: "ozone", n2: "nitrogen gas", h2: "hydrogen gas", nacl: "sodium chloride (table salt)", h2o2: "hydrogen peroxide", ch4: "methane", nh3: "ammonia", h2so4: "sulfuric acid", hcl: "hydrochloric acid", hno3: "nitric acid", naoh: "sodium hydroxide (lye)", c6h12o6: "glucose", c12h22o11: "sucrose (table sugar)", c2h5oh: "ethanol", c2h6o: "ethanol", caco3: "calcium carbonate (chalk, limestone)", nahco3: "sodium bicarbonate (baking soda)", so2: "sulfur dioxide", no2: "nitrogen dioxide", n2o: "nitrous oxide", fe2o3: "iron(III) oxide (rust)", sio2: "silicon dioxide (quartz, sand)", c8h10n4o2: "caffeine", ch3cooh: "acetic acid (vinegar)", kcl: "potassium chloride", mgso4: "magnesium sulfate (Epsom salt)" };
const FORMULA_OF = Object.fromEntries(Object.entries(COMPOUNDS).map(([f, n]) => [n.replace(/ \(.*\)$/, ""), f]));
export function facts(input) {
  const tv = trivia(input); if (tv.ok) return tv;
  const t = clean(input);
  const cf = t.match(/^\s*(?:what is |whats |what's |define )?(?:the )?(?:formula )?([a-z0-9]+)\s*$/);
  if (cf && COMPOUNDS[cf[1]] && /\d/.test(cf[1])) return { ok: true, trivia: true, text: cf[1].toUpperCase() + " is " + COMPOUNDS[cf[1]] + "." };
  const fo = t.match(/(?:chemical )?formula (?:for|of) (?:the )?([a-z ()]+?)\s*$/);
  if (fo && FORMULA_OF[fo[1].trim()]) return { ok: true, trivia: true, text: "The chemical formula of " + fo[1].trim() + " is " + FORMULA_OF[fo[1].trim()].toUpperCase() + "." };
  if (/\bhow many (?:chemical )?elements\b/.test(t)) return { ok: true, trivia: true, text: "There are " + ELEMENTS.length + " known elements, from hydrogen (1) to oganesson (" + ELEMENTS.length + ")." };
  const ext = t.match(/\b(heaviest|lightest|last|first) (?:chemical )?element\b/);
  if (ext) { const el = /heaviest|last/.test(ext[1]) ? EL_BY_Z[ELEMENTS.length] : EL_BY_Z[1]; return { ...elRes(el), trivia: ext[1] }; }
  if (/\scapital\s/.test(t)) return capital(input);
  if (/\s(element|atomic|periodic|symbol)\s/.test(t)) return element(input);
  if (/\sconstant\s/.test(t)) return constant(input);
  // no keyword: a bare number is a quantity, not an element ("what is 36" is not krypton)
  for (const f of [constant, (x) => element(x, false), capital]) { const r = f(input); if (r.ok) return r; }
  return { ok: false, error: "no fact found" };
}

// Export data for test introspection
export { CAPITALS, ELEMENTS, CONSTANTS };
