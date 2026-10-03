// DI's general knowledge base: one matcher over curated tables. Each branch reads the question's
// shape (what does X stand for, why is X, who was X, how long do X live, the largest X, how many X,
// the formula for X, the currency of X, ...), looks the subject up exactly, and returns null when
// the subject is not in its tables, so the rest of the engine (or an honest refusal) takes over.
import { COUNTRY, COUNTRY_ALIAS, POP_YEAR } from "./kb-countries.js";
import { PEOPLE, PEOPLE_ALIAS, ANIMALS, ANIMAL_ALIAS, ANIMAL_RECORDS } from "./kb-people.js";
import { SYNTAX, SYNTAX_LANGS, LANG_ALIAS, CONSTRUCTS } from "./kb-syntax.js";

const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const titleCase = (s) => s.replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\b(Of|And|The|In|On|De|Da|Van|Von|Du)\b/g, (w, _x, i) => (i ? w.toLowerCase() : w));
export function norm(input) {
  return String(input || "").toLowerCase().replace(/[’‘]/g, "'").replace(/[“”"]/g, "").replace(/[?!.]+\s*$/, "").replace(/\s+/g, " ").trim()
    .replace(/^(?:hey |hi |ok |okay |so |um |please |quick question:? |question:? )+/, "")
    .replace(/^(?:can|could|would) you (?:please )?(?:tell me|explain|say) /, "").replace(/^(?:do you know|i (?:want|would like) to know|i wonder|tell me|explain(?: to me)?|please explain) /, "")
    .replace(/ please$/, "").replace(/\bwhats\b/g, "what's").replace(/\bwhat's\b/g, "what is").replace(/\bwho's\b/g, "who is").replace(/\bhow's\b/g, "how is")
    .replace(/\bwhy's\b/g, "why is").replace(/\bwhere's\b/g, "where is").replace(/\bdoes'nt|doesnt\b/g, "doesn't").replace(/\s+/g, " ").trim();
}
const R = (text, title = "Fact", note) => ({ ok: true, kind: "kb", title, text, note });

// ------------------------------------------------------------------ acronyms
const ACRONYMS = {
  cpu: "Central Processing Unit", gpu: "Graphics Processing Unit", ram: "Random Access Memory", rom: "Read-Only Memory", ssd: "Solid-State Drive", hdd: "Hard Disk Drive", usb: "Universal Serial Bus",
  html: "HyperText Markup Language", css: "Cascading Style Sheets", http: "HyperText Transfer Protocol", https: "HyperText Transfer Protocol Secure", url: "Uniform Resource Locator", uri: "Uniform Resource Identifier",
  ip: "Internet Protocol", tcp: "Transmission Control Protocol", udp: "User Datagram Protocol", dns: "Domain Name System", vpn: "Virtual Private Network", lan: "Local Area Network", wan: "Wide Area Network",
  wifi: "Wi-Fi is a brand name (from the Wi-Fi Alliance), not an acronym; it is often wrongly expanded as 'wireless fidelity'", api: "Application Programming Interface", sdk: "Software Development Kit", ide: "Integrated Development Environment",
  sql: "Structured Query Language", json: "JavaScript Object Notation", xml: "eXtensible Markup Language", pdf: "Portable Document Format", jpeg: "Joint Photographic Experts Group", jpg: "Joint Photographic Experts Group", png: "Portable Network Graphics", gif: "Graphics Interchange Format",
  ai: "Artificial Intelligence", ml: "Machine Learning", llm: "Large Language Model", gpt: "Generative Pre-trained Transformer", ui: "User Interface", ux: "User Experience", os: "Operating System", bios: "Basic Input/Output System",
  saas: "Software as a Service", iot: "Internet of Things", seo: "Search Engine Optimization", faq: "Frequently Asked Questions", captcha: "Completely Automated Public Turing test to tell Computers and Humans Apart",
  ssh: "Secure Shell", ssl: "Secure Sockets Layer", tls: "Transport Layer Security", ftp: "File Transfer Protocol", smtp: "Simple Mail Transfer Protocol", gps: "Global Positioning System", lcd: "Liquid Crystal Display", led: "Light-Emitting Diode", oled: "Organic Light-Emitting Diode",
  nasa: "National Aeronautics and Space Administration", fbi: "Federal Bureau of Investigation", cia: "Central Intelligence Agency", nato: "North Atlantic Treaty Organization", un: "United Nations", eu: "European Union", who: "World Health Organization",
  unesco: "United Nations Educational, Scientific and Cultural Organization", unicef: "United Nations Children's Fund (originally United Nations International Children's Emergency Fund)", imf: "International Monetary Fund", wto: "World Trade Organization", opec: "Organization of the Petroleum Exporting Countries",
  usa: "United States of America", uk: "United Kingdom", uae: "United Arab Emirates", ussr: "Union of Soviet Socialist Republics", nba: "National Basketball Association", nfl: "National Football League", fifa: "Fédération Internationale de Football Association (International Federation of Association Football)", mlb: "Major League Baseball", nhl: "National Hockey League", ufc: "Ultimate Fighting Championship", wwe: "World Wrestling Entertainment",
  dna: "Deoxyribonucleic Acid", rna: "Ribonucleic Acid", atp: "Adenosine Triphosphate", mri: "Magnetic Resonance Imaging", ct: "Computed Tomography", ecg: "Electrocardiogram", ekg: "Electrocardiogram (from the German Elektrokardiogramm)", icu: "Intensive Care Unit", er: "Emergency Room", cpr: "Cardiopulmonary Resuscitation",
  hiv: "Human Immunodeficiency Virus", aids: "Acquired Immunodeficiency Syndrome", adhd: "Attention-Deficit/Hyperactivity Disorder", ocd: "Obsessive-Compulsive Disorder", ptsd: "Post-Traumatic Stress Disorder", bmi: "Body Mass Index", covid: "Coronavirus Disease (COVID-19: coronavirus disease 2019)",
  laser: "Light Amplification by Stimulated Emission of Radiation", radar: "Radio Detection And Ranging", sonar: "Sound Navigation And Ranging", scuba: "Self-Contained Underwater Breathing Apparatus",
  asap: "As Soon As Possible", rsvp: "Répondez s'il vous plaît (French for 'please reply')", eta: "Estimated Time of Arrival", diy: "Do It Yourself", fyi: "For Your Information", aka: "Also Known As", btw: "By The Way", lol: "Laughing Out Loud", omg: "Oh My God",
  brb: "Be Right Back", idk: "I Don't Know", imo: "In My Opinion", imho: "In My Humble Opinion", tbh: "To Be Honest", smh: "Shaking My Head", fomo: "Fear Of Missing Out", yolo: "You Only Live Once", tldr: "Too Long; Didn't Read", "tl;dr": "Too Long; Didn't Read", afk: "Away From Keyboard", irl: "In Real Life", dm: "Direct Message", pov: "Point Of View", goat: "Greatest Of All Time", nsfw: "Not Safe For Work",
  ceo: "Chief Executive Officer", cfo: "Chief Financial Officer", cto: "Chief Technology Officer", coo: "Chief Operating Officer", hr: "Human Resources", roi: "Return On Investment", kpi: "Key Performance Indicator", b2b: "Business to Business", b2c: "Business to Consumer", ipo: "Initial Public Offering", gdp: "Gross Domestic Product", vat: "Value-Added Tax", atm: "Automated Teller Machine", pin: "Personal Identification Number",
  phd: "Doctor of Philosophy (Latin: Philosophiae Doctor)", mba: "Master of Business Administration", gpa: "Grade Point Average", sat: "originally Scholastic Aptitude Test; today SAT is just the test's name", ceo_: "", stem: "Science, Technology, Engineering and Mathematics", esl: "English as a Second Language",
  am: "ante meridiem (Latin: before midday)", pm: "post meridiem (Latin: after midday)", bc: "Before Christ", ad: "Anno Domini (Latin: in the year of the Lord)", bce: "Before Common Era", ce: "Common Era", utc: "Coordinated Universal Time", gmt: "Greenwich Mean Time",
  ps: "Postscript (Latin: post scriptum)", eg: "exempli gratia (Latin: for example)", "e.g": "exempli gratia (Latin: for example)", ie: "id est (Latin: that is)", "i.e": "id est (Latin: that is)", etc: "et cetera (Latin: and the rest)", vs: "versus", mph: "Miles Per Hour", kph: "Kilometres Per Hour", rpm: "Revolutions Per Minute", ufo: "Unidentified Flying Object", sos: "SOS is not an acronym: it is a Morse code distress signal (... --- ...) chosen because it is easy to send; 'save our souls' was added later",
};
delete ACRONYMS.ceo_;

// ------------------------------------------------------------------ why / how explainers
// [pattern over the normalized question, title, explanation]
const EXPLAIN = [
  [/\bsky\b.*\bblue\b|\bblue sky\b/, "Why the sky is blue", "Sunlight contains all colours. Air molecules scatter short (blue) wavelengths much more strongly than long (red) ones: Rayleigh scattering grows as 1/wavelength^4. That scattered blue light reaches your eyes from every direction of the sky. It is not violet because sunlight has less violet, some is absorbed high in the atmosphere, and our eyes are less sensitive to it."],
  [/\bsunsets?\b.*\b(?:red|orange|pink)\b|\b(?:red|orange) sunsets?\b|\bsky (?:red|orange) at (?:sunset|sunrise)\b/, "Why sunsets are red", "At sunrise and sunset, sunlight crosses far more air to reach you. Most of the blue is scattered out of the beam along the way, so the light that arrives directly is mostly orange and red. Dust and smoke can make the colours stronger."],
  [/\b(?:ocean|sea|oceans|seas)\b.*\bsalty\b|\bsalt\b.*\b(?:ocean|sea)\b/, "Why the ocean is salty", "Rain is slightly acidic and slowly dissolves minerals from rocks. Rivers carry those dissolved salts (mostly sodium and chloride ions) into the sea. When seawater evaporates, the water leaves but the salt stays, so over millions of years the salt built up. Undersea vents add more. Seawater is about 3.5% salt."],
  [/\bwhy do (?:we|people|humans) dream\b|\bwhy (?:do|does) (?:we |people )?(?:have )?dreams?\b|\bwhat (?:causes|are) dreams\b/, "Why we dream", "Scientists do not fully agree. Most vivid dreams happen in REM sleep, when the brain is very active. Leading ideas are that dreaming helps consolidate memories, process emotions, and rehearse responses to threats. Another idea is that dreams are the brain making sense of random activity. It is likely a mix of these."],
  [/\b(?:airplanes?|aeroplanes?|planes?|aircraft|jets?)\b.*\b(?:fly|stay up|stay in the air)\b/, "How airplanes fly", "Four forces act on a plane: lift, weight, thrust and drag. Engines provide thrust, which pushes the plane forward against drag. As air flows over the wings, their shape and angle turn the airflow downward. By Newton's third law, the air pushes the wing up, and the pressure above the wing drops (Bernoulli). That upward force is lift. When lift equals the plane's weight, it holds its height."],
  [/\bhow (?:does|do) the internet work\b|\bhow is the internet\b/, "How the internet works", "The internet is a network of networks. Your data is split into small packets, each labelled with source and destination IP addresses. Routers pass packets hop by hop toward their destination, across cables, fibre and wireless links run by many providers. TCP puts the packets back in order and resends lost ones. DNS turns names like example.com into IP addresses. Protocols like HTTPS run on top to deliver web pages, securely."],
  [/\bhow (?:do|does) (?:a )?vaccines? work\b/, "How vaccines work", "A vaccine shows the immune system a harmless version or piece of a germ. That can be an inactivated or weakened germ, a protein, or mRNA instructions to make one protein. The immune system makes antibodies and memory cells against it. If the real germ arrives later, those memory cells recognise it and respond fast, often before you get seriously ill."],
  [/\b(?:what causes|why do we have|how do) earthquakes?\b|\bwhy do earthquakes happen\b|\bearthquakes?\b.*\b(?:caused|happen|occur)\b/, "What causes earthquakes", "Earth's crust is broken into tectonic plates that move a few centimetres a year. Where plates meet, friction locks them together while stress builds up. When the rock suddenly slips along a fault, the stored energy is released as seismic waves: an earthquake. Most happen at plate boundaries, such as the Pacific Ring of Fire."],
  [/\b(?:what causes|how does|why does it|how do you get|where does|what makes) rain\b|\bhow is rain (?:formed|made)\b/, "What causes rain", "The Sun heats water, which evaporates into water vapour. As warm air rises it cools, and the vapour condenses onto tiny dust particles as cloud droplets or ice crystals. Droplets collide and merge, or ice crystals grow and melt as they fall. When they get too heavy for the rising air to hold, they fall as rain. This is part of the water cycle."],
  [/\brainbows?\b.*\b(?:form|made|happen|caused|work)\b|\b(?:what causes|how do you get|how are) rainbows?\b|^what is a rainbow$/, "How rainbows form", "Sunlight enters raindrops, bends (refracts), reflects off the back of the drop, and bends again on the way out. Each colour bends by a slightly different amount, so white light spreads into a spectrum. You see a rainbow when the Sun is behind you and rain is in front. The bow sits about 42 degrees from the point directly opposite the Sun."],
  [/\bmagnets?\b.*\bwork\b|\bhow (?:does|do) magnetism work\b|\bwhat makes (?:a )?magnets?\b/, "How magnets work", "Magnetism comes from moving electric charge, including the spin of electrons. In most materials electron spins point randomly and cancel out. In iron, nickel and cobalt they line up in regions called domains. When most domains point the same way, the material becomes a magnet with north and south poles. Opposite poles attract, and like poles repel."],
  [/\b(?:what causes|why do we have|why are there|how do) (?:the )?seasons\b|\bseasons\b.*\b(?:caused|happen)\b/, "What causes the seasons", "Earth's axis is tilted about 23.4 degrees. As Earth orbits the Sun, each hemisphere takes turns leaning toward it. The hemisphere tilted toward the Sun gets more direct sunlight and longer days, so it has summer. The hemisphere tilted away has winter. The seasons are not caused by Earth's distance from the Sun: Earth is actually closest to the Sun in early January."],
  [/\b(?:what causes|how do|why are there|why do we have) (?:the )?tides?\b|\btides?\b.*\b(?:caused|work)\b/, "What causes tides", "The Moon's gravity pulls hardest on the side of Earth facing it and weakest on the far side. That difference stretches the oceans into two bulges, one toward the Moon and one opposite. As Earth rotates through the bulges, most coasts get two high and two low tides a day. The Sun adds a smaller effect. When the Sun and Moon line up, at new and full moon, you get extra-large spring tides."],
  [/\b(?:what causes|how does|why does|how do|what is) (?:lightning|thunder)\b|\bthunder\b.*\blightning\b|\blightning\b.*\bthunder\b/, "Lightning and thunder", "Inside storm clouds, colliding ice and water particles separate electric charge: the top of the cloud becomes positive and the bottom negative. When the voltage grows large enough, a giant spark jumps within the cloud or to the ground. That spark is lightning. It heats the air to about 30,000 degrees C in a fraction of a second, and the air expands explosively, which you hear as thunder. Light is faster than sound, so you see the flash first. Count the seconds between flash and thunder and divide by 3 for the distance in km (by 5 for miles)."],
  [/\bleaves\b.*\b(?:change colou?r|turn (?:red|yellow|orange|brown)|fall)\b/, "Why leaves change colour", "Leaves are green because of chlorophyll, which captures sunlight. In autumn, shorter days and cooler nights make trees stop producing chlorophyll. As it breaks down, yellow and orange pigments (carotenoids) that were there all along show through. Some trees also make red pigments (anthocyanins). Then the tree seals off the leaf stem, and the leaf falls."],
  [/\bwhy do (?:we|people|humans) (?:need to )?sleep\b|\bwhy is sleep important\b/, "Why we sleep", "Sleep lets the brain and body recover. During sleep the brain consolidates memories and learning, and clears waste products. It also resets emotional balance. The body repairs tissue, releases growth hormone and supports the immune system. Long-term lack of sleep harms attention, mood, metabolism and health. Most adults need 7 or more hours a night."],
  [/\bwhy do (?:we|people) yawn\b|\bwhy (?:is|are) yawn(?:ing|s) contagious\b/, "Why we yawn", "The exact reason is still debated. A leading idea is that yawning helps cool the brain, by drawing in air and increasing blood flow. It often comes when we are tired or bored, or when our state is changing, such as waking up. It is contagious, probably linked to social bonding and empathy, and is more contagious between people who are close."],
  [/\bice\b.*\bfloat\b/, "Why ice floats", "Water is unusual: it is densest as a liquid at about 4 degrees C. When it freezes, hydrogen bonds lock the molecules into an open hexagonal lattice, which takes up about 9% more space. Ice is therefore less dense than liquid water, so it floats. That is why lakes freeze from the top down, which protects the life below."],
  [/\b(?:grass|plants?|leaves)\b.*\bgreen\b/, "Why plants are green", "Plants contain chlorophyll, which absorbs mostly red and blue light to power photosynthesis. It reflects green light, so green is the colour we see."],
  [/\bhow (?:does|do) (?:the |a |your )?(?:human )?heart work\b|\bhow does blood (?:flow|circulate)\b/, "How the heart works", "The heart is a muscular pump with four chambers. The right side receives oxygen-poor blood from the body and pumps it to the lungs. The left side receives oxygen-rich blood from the lungs and pumps it out to the body. Valves keep the blood flowing one way. An electrical signal from the sinoatrial node sets each beat, about 60 to 100 times a minute at rest."],
  [/\bcats?\b.*\bpurr\b/, "Why cats purr", "Cats purr by rapidly twitching the muscles of the larynx as they breathe in and out, about 25 to 150 times a second. They purr when content, but also when stressed, injured or giving birth. So it seems to be both communication and self-soothing. Some research suggests the vibration frequencies may even help healing."],
  [/\bhow do birds fly\b|\bhow can birds fly\b/, "How birds fly", "Birds' wings are shaped like aerofoils. Moving air over them creates lift, just like an airplane wing. Flapping pushes air down and back, giving both lift and thrust. Birds are also built for flight: hollow but strong bones, powerful breast muscles, feathers that make a light, smooth wing surface, and a very efficient one-way airflow through their lungs."],
  [/\bhow (?:does|do) electricity work\b|\bwhat is electricity\b/, "How electricity works", "Electricity is the flow of electric charge, usually electrons moving through a conductor such as copper. A voltage (like a battery or generator) pushes the charge around a closed circuit. Current is how much charge flows per second, and resistance opposes the flow; Ohm's law ties them together as V = I x R. Electrical energy can be turned into light, heat, motion and more."],
  [/\bhow (?:does|do) (?:a )?computers? work\b/, "How computers work", "A computer stores everything as binary: 0s and 1s in memory. The CPU fetches instructions from memory, decodes them and executes them, billions of times a second. It does arithmetic, compares values and moves data around. Its circuits are built from billions of tiny transistor switches. Input devices feed it data, storage keeps it, and the operating system coordinates programs and hardware."],
  [/\bhow (?:does|do) (?:wi-?fi|wireless internet) work\b/, "How Wi-Fi works", "A Wi-Fi router sends and receives data as radio waves, usually at 2.4, 5 or 6 GHz. Your device's wireless chip encodes data onto those waves and decodes the waves it receives. The router connects to your internet line and passes packets between your devices and the internet. WPA2 or WPA3 encryption protects the traffic from eavesdroppers."],
  [/\bhow (?:does|do) (?:a )?gps work\b/, "How GPS works", "About 30 GPS satellites orbit Earth, each broadcasting its position and a precise time from an atomic clock. Your receiver measures how long each signal took to arrive, which gives its distance from that satellite. With four or more satellites it can solve for its position and the clock error: this is trilateration. The satellites' clocks even need corrections for relativity."],
  [/\bhow (?:does|do) (?:a )?batter(?:y|ies) work\b/, "How batteries work", "A battery has two electrodes (anode and cathode) separated by an electrolyte. Chemical reactions at the anode release electrons. The electrons can only reach the cathode through the outside circuit, so they flow through your device as an electric current. Ions move through the electrolyte inside to balance the charge. In a rechargeable battery, such as lithium-ion, charging drives the reactions in reverse."],
  [/\bhow (?:does|do) (?:a )?(?:fridge|refrigerator)s? work\b/, "How refrigerators work", "A refrigerant fluid is pumped around a loop. Inside the fridge it evaporates, and evaporating absorbs heat, cooling the interior. A compressor then squeezes the vapour, which makes it hot. It releases that heat through the coils at the back and condenses back into a liquid. Then it passes through an expansion valve and the cycle repeats. The fridge moves heat out; it does not make cold."],
  [/\b(?:what causes|what makes|where does) (?:the )?wind\b|\bhow is wind (?:formed|made)\b/, "What causes wind", "The Sun heats Earth unevenly: land warms faster than sea, and the equator more than the poles. Warm air rises and lowers the pressure below it. Cooler, higher-pressure air flows in to replace it, and that moving air is wind. Earth's rotation deflects large-scale winds (the Coriolis effect), which shapes global wind belts."],
  [/\b(?:what causes|how do|why do) volcano(?:e)?s?\b|\bvolcano(?:e)?s?\b.*\b(?:erupt|form)\b/, "How volcanoes work", "Deep underground, rock melts into magma, mostly where tectonic plates pull apart, where one plate sinks under another, or over hot spots. Magma is lighter than the rock around it, so it rises and collects in chambers. Gas dissolved in it builds pressure, like a shaken bottle. When the pressure beats the rock above, magma erupts as lava, ash and gas."],
  [/\b(?:northern|southern) lights\b|\baurora(?:s| borealis| australis)?\b/, "What causes the northern lights", "The Sun constantly streams charged particles (the solar wind). Earth's magnetic field steers some of them toward the poles. There they hit oxygen and nitrogen atoms in the upper atmosphere, about 100 to 300 km up. The atoms release that energy as light: green and red from oxygen, blue and purple from nitrogen. Strong solar storms make auroras brighter and visible farther from the poles."],
  [/\bleap years?\b.*\b(?:why|exist|have)\b|\bwhy (?:do we have|is there|are there) (?:a )?leap (?:years?|days?)\b/, "Why we have leap years", "Earth takes about 365.2422 days to go around the Sun, not exactly 365. Without a correction, the calendar would drift by about 1 day every 4 years against the seasons. So we add 29 February every 4 years. Century years are skipped unless divisible by 400 (2000 was a leap year, 1900 was not), which fine-tunes the average year to 365.2425 days."],
  [/\b(?:phases? of the moon|moon'?s? phases?|moon change shape|moon changes? shape)\b/, "Why the Moon has phases", "The Moon does not make its own light; the Sun always lights half of it. As the Moon orbits Earth every 29.5 days, we see different amounts of that lit half. The cycle runs new moon (lit side facing away), crescent, first quarter, gibbous, full moon (lit side facing us), then back again. Earth's shadow does not cause the phases; that only happens in a lunar eclipse."],
  [/\beclipses?\b.*\b(?:happen|caused|work)\b|\b(?:what causes|how do) (?:an? )?(?:solar |lunar )?eclipses?\b/, "How eclipses happen", "A solar eclipse happens when the Moon passes between the Sun and Earth, casting its shadow on Earth. It can only happen at new moon. A lunar eclipse happens when Earth passes between the Sun and Moon, so Earth's shadow falls on the Moon, often turning it red. It can only happen at full moon. Eclipses do not happen every month because the Moon's orbit is tilted about 5 degrees."],
  [/\bstars?\b.*\btwinkle\b/, "Why stars twinkle", "Starlight passes through turbulent layers of air with different temperatures and densities, which bend it by constantly changing amounts. Stars are so far away that they are effectively points of light, so the bending makes them flicker in brightness and colour. Planets look like tiny discs and average the effect out, so they twinkle much less."],
  [/\bhow does the sun (?:produce|make|create|generate) (?:energy|light|heat)\b|\bhow does the sun (?:shine|work|burn)\b/, "How the Sun makes energy", "Nuclear fusion in its core. At about 15 million degrees C and enormous pressure, hydrogen nuclei fuse into helium, and a little mass becomes energy (E = mc^2). The Sun converts about 4 million tonnes of mass into energy every second. That energy takes thousands of years or more to work its way out of the Sun, then 8 minutes 20 seconds to reach Earth as light."],
  [/\b(?:what causes|why do (?:we|you|people) get) hiccups\b|\bhiccups?\b.*\b(?:caused|happen)\b/, "What causes hiccups", "A hiccup is an involuntary spasm of the diaphragm. It makes you suddenly breathe in, then your vocal cords snap shut with a 'hic'. Triggers include eating fast, a full stomach, fizzy drinks, alcohol and sudden excitement. Most bouts stop on their own within minutes. See a doctor if they last more than 48 hours."],
  [/\bonions?\b.*\b(?:cry|tears)\b/, "Why onions make you cry", "Cutting an onion breaks its cells and releases enzymes. They turn sulphur compounds into a gas called syn-propanethial-S-oxide. When it reaches your eyes it irritates them, and your tear glands flush it out. Chilling the onion or using a sharp knife reduces it."],
  [/\bhow do bees make honey\b|\bhow is honey made\b/, "How bees make honey", "Worker bees collect nectar from flowers and store it in a special honey stomach, where enzymes begin breaking its sugars down. Back at the hive they pass it between bees and deposit it into wax cells. They fan it with their wings until most of the water evaporates. Then they seal the cell with wax. A bee makes only about 1/12 of a teaspoon of honey in its lifetime."],
  [/\bwhy do (?:we|people|humans) sweat\b/, "Why we sweat", "Sweating cools you down. Glands release water with a little salt onto the skin. As it evaporates, it takes heat away from the body. You sweat more in heat, during exercise, with fever and when stressed. Sweat itself is almost odourless: body odour comes from skin bacteria breaking it down."],
  [/\bhow (?:does|do) (?:a )?microwaves? (?:oven )?work\b/, "How microwave ovens work", "A magnetron makes microwaves at about 2.45 GHz. The waves' electric field flips direction billions of times a second, and water molecules, which have a positive and a negative end, try to rotate with it. That jostling turns into heat, which cooks the food from the water inside. Metal reflects microwaves, which is why the oven's walls and door mesh keep them in."],
  [/\bhow (?:does|do) soap work\b|\bhow does soap (?:clean|kill)\b/, "How soap works", "A soap molecule has a water-loving head and an oil-loving tail. The tails bury themselves in grease and dirt, and the heads face out into the water. Together they form tiny balls (micelles) that trap the grease so water can rinse it away. Soap also breaks apart the fatty outer layer of many viruses and bacteria."],
  [/\bhow do fish breathe\b/, "How fish breathe", "Fish take water in through the mouth and push it over their gills, feathery organs full of tiny blood vessels. Oxygen dissolved in the water passes into the blood, and carbon dioxide passes out. Blood flows the opposite way to the water (countercurrent exchange), which lets gills extract up to about 80% of the oxygen."],
  [/\bgoosebumps\b/, "Why we get goosebumps", "Tiny muscles at the base of each hair contract, which pulls the hairs upright and dimples the skin. It is a reflex left over from furrier ancestors: raised fur traps warm air and makes an animal look bigger. It is triggered by cold, fear and strong emotions, such as moving music."],
  [/\bhow (?:does|do) the stock market work\b|\bwhat is the stock market\b/, "How the stock market works", "Companies sell shares (small pieces of ownership) to raise money. Investors then buy and sell those shares from each other on exchanges, such as the NYSE or NASDAQ. Prices move with supply and demand: expectations about a company's future profits, the economy, interest rates and sentiment. Shareholders can gain from rising prices and dividends, and can also lose money."],
  [/\bhow (?:does|do) (?:a |an )?(?:car|combustion|petrol|gasoline) engines? work\b|\bhow (?:does|do) (?:a )?cars? (?:engine )?work\b/, "How a car engine works", "Most petrol engines use a four-stroke cycle in each cylinder. Intake: a piston moves down, drawing in air and fuel. Compression: the piston moves up and squeezes the mixture. Power: a spark plug ignites it, and the expanding gas forces the piston down. Exhaust: the piston pushes the burnt gas out. The pistons turn a crankshaft, which drives the wheels through the transmission."],
  [/\bhow (?:does|do) (?:the )?(?:human )?brain work\b/, "How the brain works", "The brain has about 86 billion neurons. Each connects to thousands of others through synapses, making roughly 100 trillion connections. Neurons communicate with electrical impulses and chemical messengers (neurotransmitters). Different regions specialise, for example vision in the occipital lobe and planning in the frontal lobe, but most tasks involve networks of regions working together. Connections strengthen or weaken with use, which is how we learn."],
  [/\bwhat is gravity\b|\bhow (?:does|do) gravity work\b|\bwhy do things fall\b/, "Gravity", "Gravity is the attraction between things with mass or energy. Newton described it as a force that grows with mass and weakens with the square of distance (F = G m1 m2 / r^2). Einstein's general relativity explains it more precisely: mass and energy curve spacetime, and objects follow that curvature. On Earth it accelerates falling objects at about 9.81 m/s^2."],
  [/^what is the cloud$|\bcloud computing\b/, "The cloud", "\"The cloud\" means computing services (storage, servers, databases, software) run in someone else's large data centres and used over the internet, instead of on your own machines. Examples include AWS, Microsoft Azure, Google Cloud, Google Drive and iCloud. You rent what you use and can scale it up or down quickly."],
  [/\bhow (?:does|do) (?:a )?(?:solar panels?|solar power) work\b/, "How solar panels work", "Solar cells are made of silicon layers treated to create an electric field between them. When light hits the cell, photons knock electrons loose (the photovoltaic effect). The field pushes those electrons one way, which produces a direct current. An inverter converts it to the alternating current used in homes. Typical panels turn about 18 to 23% of sunlight into electricity."],
  [/\bhow (?:does|do) (?:a )?(?:touch ?screens?) work\b/, "How touchscreens work", "Most phone screens are capacitive: a grid of transparent electrodes holds a small electric field. Your finger conducts electricity, so touching the glass changes the capacitance at that spot. The controller measures where the change is, many times a second, which also lets it track several fingers at once. That is why ordinary gloves do not work."],
  [/\bwhat happens when (?:we|you) die\b/, "What happens when we die", "Biologically, death is when the heart and breathing stop for good and the brain permanently stops functioning. Without oxygen, cells begin to break down within minutes. What happens beyond that, such as an afterlife, is a question of religion and philosophy, and science cannot answer it. Different traditions give very different answers."],
];

// ------------------------------------------------------------------ records (superlatives)
const RECORDS = {
  "smallest country": "Vatican City is the smallest country, at about 0.49 square km (121 acres), with roughly 800 residents. Monaco is second, at about 2 square km.",
  "largest country": "Russia is the largest country by area, about 17.1 million square km; Canada is second (about 10 million square km).",
  "most populous country": "India has been the most populous country since 2023, with about 1.45 billion people (2024 estimate), ahead of China at about 1.42 billion.",
  "least populous country": "Vatican City, with roughly 800 residents.",
  "largest city": "Tokyo is usually named the largest metropolitan area, at about 37 million people. Rankings differ with how a city's boundaries are drawn, and some recent UN estimates put Jakarta or Dhaka ahead.",
  "largest continent": "Asia is the largest continent, both by area (about 44.6 million square km, 30% of the land) and by population (about 4.8 billion people).",
  "smallest continent": "Australia (the continent of Australia/Oceania) is the smallest, at about 8.6 million square km.",
  "smallest ocean": "The Arctic Ocean is the smallest and shallowest, at about 15.6 million square km.",
  "deepest ocean": "The Pacific. Its Mariana Trench holds the deepest known point on Earth, the Challenger Deep, about 10,935 m (35,876 ft) below sea level.",
  "deepest point": "The Challenger Deep in the Mariana Trench, western Pacific: about 10,935 m (35,876 ft) below sea level.",
  "deepest lake": "Lake Baikal in Siberia, Russia, about 1,642 m deep. It is also the oldest lake (about 25 million years) and holds about 20% of the world's unfrozen fresh surface water.",
  "largest lake": "The Caspian Sea (about 371,000 square km) is the largest lake by area; it is salty. The largest freshwater lake by area is Lake Superior (about 82,100 square km), and by volume it is Lake Baikal.",
  "largest island": "Greenland, at about 2.17 million square km (Australia is counted as a continent, not an island).",
  "highest waterfall": "Angel Falls in Venezuela, with a total height of 979 m (3,212 ft) and an uninterrupted drop of 807 m.",
  "tallest waterfall": "Angel Falls in Venezuela, with a total height of 979 m (3,212 ft) and an uninterrupted drop of 807 m.",
  "tallest building": "The Burj Khalifa in Dubai, at 828 m (2,717 ft), completed in 2010. The Jeddah Tower in Saudi Arabia is being built to pass it.",
  "tallest structure": "The Burj Khalifa in Dubai, 828 m (2,717 ft).",
  "longest bridge": "The Danyang-Kunshan Grand Bridge in China, a high-speed rail viaduct about 164.8 km (102.4 miles) long.",
  "hardest substance": "Diamond is the hardest natural material (10 on the Mohs scale). A few lab-made materials, such as aggregated diamond nanorods, can test harder in some measurements.",
  "hardest natural substance": "Diamond is the hardest natural material (10 on the Mohs scale).",
  "hardest mineral": "Diamond is the hardest natural material (10 on the Mohs scale).",
  "closest star": "The Sun is the closest star to Earth. After it comes Proxima Centauri, about 4.24 light years away, part of the Alpha Centauri system.",
  "nearest star": "The Sun is the closest star to Earth. After it comes Proxima Centauri, about 4.24 light years away, part of the Alpha Centauri system.",
  "closest star to earth": "The Sun is the closest star to Earth. After it comes Proxima Centauri, about 4.24 light years away, part of the Alpha Centauri system.",
  "brightest star": "Sirius (in Canis Major) is the brightest star in the night sky, at magnitude -1.46, and about 8.6 light years away. The Sun is far brighter from Earth, of course.",
  "hottest planet": "Venus is the hottest planet, at about 465 degrees C at the surface, even though Mercury is closer to the Sun. Its thick carbon dioxide atmosphere traps heat in a runaway greenhouse effect.",
  "coldest planet": "Uranus has recorded the coldest atmosphere, about -224 degrees C, although Neptune is farther from the Sun.",
  "smallest planet": "Mercury is the smallest planet, about 4,880 km across (a little larger than the Moon).",
  "largest planet": "Jupiter is the largest planet, about 139,820 km across, more than 11 times Earth's diameter and over twice the mass of all the other planets combined.",
  "biggest planet": "Jupiter is the largest planet, about 139,820 km across, more than 11 times Earth's diameter.",
  "largest moon": "Ganymede, a moon of Jupiter, is the largest in the solar system, about 5,268 km across: bigger than the planet Mercury.",
  "largest volcano": "On Earth, Mauna Loa in Hawaii, by volume. In the solar system, Olympus Mons on Mars, about 22 km high and 600 km wide.",
  "tallest volcano": "Olympus Mons on Mars (about 22 km). On Earth, Ojos del Salado (6,893 m) is the highest by elevation, and Mauna Kea is the tallest measured from its base on the sea floor (about 10,200 m).",
  "largest star": "Among well-measured stars, the red supergiants UY Scuti and Stephenson 2-18 are among the largest known, around 1,500 to 2,000 times the Sun's radius. Exact rankings are uncertain.",
  "largest rainforest": "The Amazon rainforest, about 5.5 million square km, spread over nine countries, mostly Brazil.",
  "driest place": "The Atacama Desert in Chile: some weather stations there have recorded almost no rain for decades. Parts of Antarctica's Dry Valleys are drier still.",
  "wettest place": "Mawsynram in Meghalaya, India, averages about 11,870 mm (467 inches) of rain a year; nearby Cherrapunji is close behind.",
  "hottest place": "The highest air temperature on record is 56.7 degrees C (134 degrees F), at Furnace Creek in Death Valley, California, on 10 July 1913. The reading is disputed by some researchers. The Lut Desert in Iran has recorded surface temperatures near 70 degrees C by satellite.",
  "coldest place": "The lowest air temperature measured at ground level is -89.2 degrees C (-128.6 degrees F), at Vostok Station, Antarctica, on 21 July 1983. Satellites have found even colder surface pockets on the East Antarctic plateau, around -98 degrees C.",
  "largest organ": "The skin is the largest organ of the human body, about 1.5 to 2 square metres in adults. The largest internal organ is the liver.",
  "largest organ in the human body": "The skin, about 1.5 to 2 square metres in adults. The largest internal organ is the liver.",
  "longest bone": "The femur (thigh bone) is the longest and strongest bone in the human body.",
  "smallest bone": "The stapes (stirrup), in the middle ear, is the smallest bone, about 3 mm long.",
  "strongest muscle": "It depends how you measure it. By force for its size, the masseter (jaw muscle) is usually named. The heart is the hardest-working muscle, and the gluteus maximus is the largest.",
  "largest muscle": "The gluteus maximus (buttock) is the largest muscle in the human body.",
  "most spoken language": "English has the most total speakers, about 1.5 billion including second-language speakers. Mandarin Chinese has the most native speakers, about 940 million.",
  "most abundant gas in the atmosphere": "Nitrogen, about 78% of dry air. Oxygen is about 21%, argon about 0.9%, and carbon dioxide about 0.04%.",
  "most abundant element": "In the universe, hydrogen (about 74% of ordinary matter by mass, then helium about 24%). In Earth's crust, oxygen (about 46%, then silicon). In the human body, oxygen by mass.",
  "most abundant element in the universe": "Hydrogen, about 74% of ordinary matter by mass, followed by helium at about 24%.",
  "lightest element": "Hydrogen (atomic number 1) is the lightest element.",
  "heaviest element": "The heaviest naturally occurring element in quantity is uranium (atomic number 92). The heaviest known element is oganesson (118), made in labs a few atoms at a time.",
  "densest element": "Osmium, at about 22.59 g/cm^3, with iridium a very close second.",
  "most expensive metal": "Rhodium has usually been the most expensive precious metal by weight, though prices change. Gold and platinum trade far lower.",
  "longest wall": "The Great Wall of China. Counting all its sections, a 2012 Chinese survey measured about 21,196 km.",
  "oldest university": "The University of al-Qarawiyyin in Fez, Morocco, founded in 859, is often cited as the oldest continuously operating university. Among European universities, Bologna (1088) is the oldest.",
  "tallest mountain": "Mount Everest is the highest above sea level, at 8,848.86 m (29,031.7 ft). Measured from base to peak, Mauna Kea in Hawaii (about 10,200 m, mostly under the sea) is taller.",
  "highest mountain": "Mount Everest, at 8,848.86 m (29,031.7 ft) above sea level, on the Nepal-China border.",
  "longest river": "The Nile (about 6,650 km) is usually named the longest; some measurements put the Amazon (about 6,400 to 7,000 km) ahead.",
  "largest ocean": "The Pacific Ocean, about 165 million square km.",
  "largest desert": "Antarctica, about 14 million square km, is a desert because it gets so little precipitation. The largest hot desert is the Sahara, about 9.2 million square km.",
  "longest river in the us": "The Missouri River is the longest river in the United States, about 3,767 km (2,341 miles), just ahead of the Mississippi.",
  "largest state": "Alaska is the largest US state, about 1.72 million square km, more than twice the size of Texas.",
  "smallest state": "Rhode Island is the smallest US state, about 4,000 square km.",
  "most populous state": "California is the most populous US state, with about 39 million people.",
  "fastest car": "Production-car speed records change often. The ThrustSSC holds the land speed record: 1,227.985 km/h (763.035 mph) in 1997, the first car to break the sound barrier.",
  "fastest man": "Usain Bolt holds the 100 m world record, 9.58 seconds, set in 2009. That is a peak speed of about 44.7 km/h (27.8 mph).",
  "fastest woman": "Florence Griffith-Joyner holds the 100 m world record, 10.49 seconds, set in 1988.",
  "tallest person": "Robert Wadlow (1918-1940) of the United States is the tallest person reliably measured, at 2.72 m (8 ft 11.1 in).",
  "oldest person": "Jeanne Calment of France is the oldest verified person ever. She lived to 122 years and 164 days (1875-1997).",
};
const REC_SYN = [[/\bbiggest\b/g, "largest"], [/\bhighest\b(?= (?:building|structure|waterfall|volcano))/g, "tallest"], [/\bnearest\b/g, "closest"], [/\bmost populated\b/g, "most populous"], [/\bdeepest part of the ocean\b/g, "deepest point"], [/\bhardest (?:natural )?(?:material|thing|mineral|substance)\b/g, "hardest substance"], [/\bthe\s+/g, ""]];

// ------------------------------------------------------------------ how many / how old / how far / how tall
const COUNTS = [
  [/\bbones?\b.*\b(?:human|body|adult|person|people|skeleton|we have|you have)\b|^how many bones do (?:we|you|humans|i) have$/, "An adult human skeleton has 206 bones. Babies are born with around 270 to 300, and many fuse together as they grow."],
  [/\bbones?\b.*\bhands?\b/, "Each human hand has 27 bones (including the 8 wrist bones)."],
  [/\bhearts?\b.*\boctopus(?:es)?\b|\boctopus(?:es)?\b.*\bhearts?\b/, "An octopus has 3 hearts: two pump blood through the gills and one pumps it to the rest of the body. It also has blue, copper-based blood."],
  [/\bstates\b.*\b(?:us|usa|united states|america)\b|\bhow many states (?:are there|does america have|in america)\b/, "The United States has 50 states, plus the District of Columbia (Washington, D.C.) and several territories such as Puerto Rico and Guam."],
  [/\bcountries\b.*\b(?:world|are there|on earth)\b|^how many countries are there$/, "There are 195 countries by the most common count: 193 UN member states plus 2 observer states (Vatican City and Palestine). Some counts differ over places such as Taiwan and Kosovo."],
  [/\btime ?zones?\b.*\brussia\b|\brussia\b.*\btime ?zones?\b/, "Russia has 11 time zones, from UTC+2 (Kaliningrad) to UTC+12 (Kamchatka), the most of any single contiguous country. France has 12 counting its overseas territories."],
  [/\btime ?zones?\b.*\b(?:us|usa|united states|america)\b/, "The United States uses 6 standard time zones for its states (Eastern, Central, Mountain, Pacific, Alaska, Hawaii-Aleutian), or 9 counting territories such as Puerto Rico and Guam."],
  [/\btime ?zones?\b.*\b(?:world|are there|in total)\b/, "There are 24 hourly time zones in theory. In practice there are about 38 local times in use, because some places use 30- or 45-minute offsets (for example India at UTC+5:30 and Nepal at UTC+5:45)."],
  [/\b(?:keys?)\b.*\bpiano\b/, "A standard piano has 88 keys: 52 white and 36 black."],
  [/\bcards?\b.*\bdeck\b/, "A standard deck has 52 cards in 4 suits of 13, plus usually 2 jokers."],
  [/\bplayers?\b.*\b(?:soccer|football) team\b|\b(?:soccer|football) team\b.*\bplayers?\b/, "A soccer (association football) team has 11 players on the field, including the goalkeeper. An American football team also has 11 on the field."],
  [/\bplayers?\b.*\bbasketball\b/, "A basketball team has 5 players on the court at a time."],
  [/\bplayers?\b.*\b(?:cricket|baseball)\b/, "Cricket teams have 11 players; baseball teams field 9."],
  [/\bplayers?\b.*\b(?:volleyball)\b/, "A volleyball team has 6 players on the court (beach volleyball: 2)."],
  [/\bchromosomes?\b/, "Humans have 46 chromosomes in 23 pairs: 22 pairs of autosomes plus the sex chromosomes (XX or XY)."],
  [/\bmuscles?\b.*\b(?:human|body)\b/, "The human body has roughly 600 skeletal muscles (counts range from about 600 to 840, depending on how muscles are grouped)."],
  [/\bletters?\b.*\b(?:english )?alphabet\b/, "The English alphabet has 26 letters: 5 vowels (a, e, i, o, u, with y sometimes a vowel) and 21 consonants."],
  [/\bchambers?\b.*\bheart\b/, "The human heart has 4 chambers: two atria on top and two ventricles below."],
  [/\bsenses\b/, "Traditionally 5 senses: sight, hearing, touch, taste and smell. Scientists count more, including balance, temperature, pain, and proprioception (the sense of body position)."],
  [/\bstrings?\b.*\bguitar\b/, "A standard guitar has 6 strings (tuned E A D G B E); bass guitars usually have 4."],
  [/\bmoons?\b.*\bearth\b|\bearth\b.*\bmoons?\b/, "Earth has 1 natural moon, the Moon."],
  [/\bmoons?\b.*\bjupiter\b/, "Jupiter has 95 officially recognised moons (as of 2023); more small ones keep being found. The four largest are Io, Europa, Ganymede and Callisto."],
  [/\bmoons?\b.*\bsaturn\b/, "Saturn has the most known moons: 274 officially recognised as of 2025, after dozens of new discoveries. Titan is the largest."],
  [/\boceans\b/, "There are 5 oceans: Pacific, Atlantic, Indian, Southern (Antarctic) and Arctic, from largest to smallest."],
  [/\bzeros?\b.*\bmillion\b/, "A million has 6 zeros (1,000,000)."], [/\bzeros?\b.*\bbillion\b/, "A billion has 9 zeros (1,000,000,000), in the short scale used in English today."], [/\bzeros?\b.*\btrillion\b/, "A trillion has 12 zeros (1,000,000,000,000)."],
  [/\bdegrees?\b.*\bcircle\b/, "A full circle has 360 degrees (2 pi radians)."], [/\bdegrees?\b.*\btriangle\b/, "The angles of a triangle add up to 180 degrees (in flat, Euclidean geometry)."], [/\bdegrees?\b.*\b(?:square|rectangle|quadrilateral)\b/, "The angles of any quadrilateral add up to 360 degrees; each angle of a square or rectangle is 90 degrees."],
  [/\bsides?\b.*\b(?:triangle)\b/, "A triangle has 3 sides."], [/\bsides?\b.*\b(?:square|rectangle|quadrilateral|rhombus)\b/, "It has 4 sides."], [/\bsides?\b.*\bpentagon\b/, "A pentagon has 5 sides."], [/\bsides?\b.*\bhexagon\b/, "A hexagon has 6 sides."],
  [/\bsides?\b.*\bheptagon\b/, "A heptagon has 7 sides."], [/\bsides?\b.*\boctagon\b/, "An octagon has 8 sides."], [/\bsides?\b.*\bnonagon\b/, "A nonagon has 9 sides."], [/\bsides?\b.*\bdecagon\b/, "A decagon has 10 sides."], [/\bsides?\b.*\bdodecagon\b/, "A dodecagon has 12 sides."], [/\bsides?\b.*\bcircle\b/, "A circle has no straight sides; it is one continuous curve (some say one side)."],
  [/\bfaces?\b.*\bcube\b/, "A cube has 6 faces, 12 edges and 8 vertices."],
  [/\bhow many (?:people|humans) (?:are there |live )?(?:in|on) (?:the )?(?:world|earth|planet)\b|\b(?:world|global) population\b|\bpopulation of (?:the )?(?:world|earth)\b/, "About 8.2 billion people (2024 UN estimate). The world passed 8 billion in November 2022, and growth is slowing."],
  [/\bwords?\b.*\benglish (?:language|dictionary)\b|\bhow many words (?:are there )?in english\b/, "The Oxford English Dictionary has about 500,000 entries including obsolete words; about 170,000 words are in current use. A typical adult native speaker knows 20,000 to 35,000 words."],
  [/\blanguages?\b.*\b(?:world|are there)\b/, "About 7,100 to 7,200 living languages are spoken today (Ethnologue); around 40% are endangered."],
  [/\bspecies\b.*\b(?:world|earth|are there)\b/, "About 2.1 million species have been formally described. Estimates of the true total range from about 8.7 million to far more, most of them insects and microbes."],
  [/\bstars\b.*\b(?:milky way|galaxy)\b/, "The Milky Way has an estimated 100 to 400 billion stars."], [/\bgalax(?:y|ies)\b.*\buniverse\b/, "The observable universe holds an estimated 200 billion to 2 trillion galaxies."],
  [/\bcells?\b.*\b(?:human )?body\b/, "The human body has roughly 30 to 37 trillion cells, and about as many bacterial cells living on and in it."],
  [/\bteeth\b.*\b(?:child|kid|baby)\b|\bbaby teeth\b/, "Children have 20 baby (primary) teeth; adults usually have 32 permanent teeth."],
  [/\blitres? of blood\b|\bliters? of blood\b|\bhow much blood\b/, "An adult has about 4.5 to 5.5 litres (about 5 quarts) of blood, roughly 7 to 8% of body weight."],
  [/\bhow many (?:us )?presidents\b/, "Donald Trump is the 47th US president (inaugurated 20 January 2025), but only 45 different people have held the office, because Grover Cleveland (22nd and 24th) and Trump (45th and 47th) each served non-consecutive terms."],
  [/\bhow many (?:books|chapters) (?:are )?in the bible\b/, "The Protestant Bible has 66 books (39 Old Testament, 27 New Testament); Catholic Bibles have 73."],
  [/\bhow many (?:rings|circles) (?:are )?(?:on|in) the olympic\b/, "The Olympic symbol has 5 interlocking rings (blue, yellow, black, green and red) on a white background."],
];
const AGES = [
  [/\bhow old is the universe\b|\bage of the universe\b/, "About 13.8 billion years, measured mainly from the cosmic microwave background (Planck satellite: 13.787 +/- 0.020 billion years)."],
  [/\bhow old is (?:the )?earth\b|\bage of (?:the )?earth\b/, "About 4.54 billion years (+/- 50 million), from radiometric dating of meteorites and Earth's oldest minerals."],
  [/\bhow old is the sun\b|\bage of the sun\b/, "About 4.6 billion years; it is about halfway through its roughly 10-billion-year life as a main-sequence star."],
  [/\bhow old is the moon\b|\bage of the moon\b/, "About 4.5 billion years. It probably formed from debris after a Mars-sized body hit the young Earth."],
  [/\bhow (?:long|old) (?:have|has) (?:humans|homo sapiens|people) (?:been around|existed)\b|\bhow old (?:are|is) (?:humans|humanity|homo sapiens)\b/, "Modern humans (Homo sapiens) have existed for about 300,000 years, based on fossils from Jebel Irhoud, Morocco."],
  [/\bhow far (?:away )?is the sun\b|\bdistance (?:from|to|between) (?:the )?(?:earth and the )?sun\b/, "On average 149.6 million km (93 million miles), a distance called 1 astronomical unit. Its light takes about 8 minutes 20 seconds to reach us."],
  [/\bhow far (?:away )?is mars\b|\bdistance to mars\b/, "It varies a lot, because both planets orbit the Sun: from about 54.6 million km at the closest possible approach to about 401 million km when Mars is on the far side of the Sun."],
  [/\bhow long (?:does it take|is a (?:trip|flight)) to (?:get to |reach |go to )?mars\b/, "About 7 to 9 months with current rockets, launched when Earth and Mars line up (every 26 months)."],
  [/\bhow long (?:does it take )?(?:for light )?(?:from the sun )?to reach (?:the )?earth\b|\bhow long does sunlight take\b/, "Sunlight takes about 8 minutes 20 seconds to reach Earth."],
  [/\bhow long is a day on mars\b/, "A day on Mars (a sol) lasts 24 hours 39 minutes 35 seconds."], [/\bhow long is a year on mars\b/, "A Mars year lasts 687 Earth days."],
  [/\bhow long is a day on venus\b/, "Venus rotates once every 243 Earth days, longer than its year (225 Earth days), and it spins backwards."],
  [/\bhow (?:big|large) is the sun\b|\bsize of the sun\b/, "The Sun is about 1.39 million km across: 109 times Earth's diameter. About 1.3 million Earths would fit inside it."],
  [/\bhow big is (?:the )?earth\b|\bsize of (?:the )?earth\b|\bcircumference of (?:the )?earth\b/, "Earth is about 12,742 km (7,918 miles) across on average, with an equatorial circumference of about 40,075 km (24,901 miles)."],
  [/\bhow hot is the sun\b|\btemperature of the sun\b/, "The Sun's surface is about 5,500 degrees C; its core is about 15 million degrees C, and its outer atmosphere, the corona, is over 1 million degrees C."],
  [/\bhow deep is the ocean\b|\baverage depth of the ocean\b/, "The ocean averages about 3,700 m (12,100 ft) deep; its deepest point, the Challenger Deep, is about 10,935 m."],
  [/\bhow long (?:is|was) (?:a )?(?:human )?pregnan(?:cy|t)\b/, "A human pregnancy lasts about 40 weeks (280 days) counted from the first day of the last menstrual period, or about 38 weeks from conception."],
  [/\bhow long can (?:a )?(?:human|person|you) (?:survive|live|go) without water\b/, "Usually about 3 days, depending on heat, activity and health."], [/\bhow long can (?:a )?(?:human|person|you) (?:survive|live|go) without food\b/, "Weeks, commonly cited as up to about 1 to 2 months with water, depending on body fat and health."],
];
const HEIGHTS = {
  "eiffel tower": "The Eiffel Tower is 330 m (1,083 ft) tall including antennas since 2022; the original structure was 300 m (1889).",
  "statue of liberty": "The Statue of Liberty is 46 m (151 ft) from base to torch, or 93 m (305 ft) from the ground including the pedestal.",
  "burj khalifa": "The Burj Khalifa is 828 m (2,717 ft) tall, the tallest building in the world since 2010.",
  "empire state building": "The Empire State Building is 381 m (1,250 ft) to the roof and 443 m (1,454 ft) to the tip of its antenna.",
  "big ben": "The Elizabeth Tower, home of the bell Big Ben, is 96 m (316 ft) tall.",
  "great pyramid": "The Great Pyramid of Giza was about 146.6 m (481 ft) tall when built (around 2560 BC); it is about 138.5 m today after losing its outer casing and tip.",
  "great pyramid of giza": "The Great Pyramid of Giza was about 146.6 m (481 ft) tall when built (around 2560 BC); it is about 138.5 m today.",
  "leaning tower of pisa": "The Leaning Tower of Pisa is about 56 m (183 ft) tall on its high side and leans about 4 degrees.",
  "taj mahal": "The Taj Mahal is about 73 m (240 ft) tall to the top of its finial.",
  "cn tower": "The CN Tower in Toronto is 553.3 m (1,815 ft) tall.",
  "christ the redeemer": "Christ the Redeemer in Rio de Janeiro is 30 m (98 ft) tall, plus an 8 m pedestal; its arms span 28 m.",
  "mount everest": "Mount Everest is 8,848.86 m (29,031.7 ft) above sea level (2020 survey by China and Nepal).",
  "everest": "Mount Everest is 8,848.86 m (29,031.7 ft) above sea level (2020 survey by China and Nepal).",
  "k2": "K2 is 8,611 m (28,251 ft), the second-highest mountain on Earth.",
  "mount kilimanjaro": "Mount Kilimanjaro is 5,895 m (19,341 ft), the highest mountain in Africa.", "kilimanjaro": "Mount Kilimanjaro is 5,895 m (19,341 ft), the highest mountain in Africa.",
  "mont blanc": "Mont Blanc is about 4,806 m (15,768 ft); its exact height changes a little with its ice cap.",
  "mount fuji": "Mount Fuji is 3,776 m (12,388 ft), the highest mountain in Japan.",
  "golden gate bridge": "The Golden Gate Bridge's towers rise 227 m (746 ft) above the water; its main span is 1,280 m.",
  "the shard": "The Shard in London is 310 m (1,016 ft) tall.", "one world trade center": "One World Trade Center in New York is 541 m (1,776 ft) tall to its spire.",
  "space needle": "The Space Needle in Seattle is 184 m (605 ft) tall.", "great wall of china": "The Great Wall averages about 6 to 7 m (20 to 23 ft) high; its sections total about 21,196 km in length.",
  "giraffe": "An adult giraffe is about 4.3 to 5.7 m (14 to 19 ft) tall, the tallest living animal.",
};

// ------------------------------------------------------------------ formulas
const FORMULAS = [
  [/\bpythagor(?:as|ean)(?:'s)?(?: theorem| formula)?\b/, "Pythagorean theorem", "In a right triangle, a^2 + b^2 = c^2, where c is the hypotenuse (the side opposite the right angle). Example: sides 3 and 4 give c = sqrt(9 + 16) = 5."],
  [/\barea of (?:a )?triangle\b|\btriangle area\b/, "Area of a triangle", "A = (1/2) x base x height. With three sides a, b, c: Heron's formula, A = sqrt(s(s-a)(s-b)(s-c)) where s = (a+b+c)/2."],
  [/\barea of (?:a )?circle\b|\bcircle area\b/, "Area of a circle", "A = pi x r^2, where r is the radius (or pi x d^2 / 4 with the diameter d)."],
  [/\b(?:circumference|perimeter) of (?:a )?circle\b/, "Circumference of a circle", "C = 2 x pi x r = pi x d."],
  [/\barea of (?:a )?(?:rectangle|square)\b/, "Area of a rectangle", "A = length x width. For a square with side s: A = s^2."],
  [/\bperimeter of (?:a )?(?:rectangle|square)\b/, "Perimeter of a rectangle", "P = 2 x (length + width). For a square: P = 4 x s."],
  [/\barea of (?:a )?trapezo(?:id|ium)\b/, "Area of a trapezoid", "A = (1/2) x (a + b) x h, where a and b are the parallel sides and h the height between them."],
  [/\barea of (?:a )?parallelogram\b/, "Area of a parallelogram", "A = base x height (the perpendicular height, not the slanted side)."],
  [/\bvolume of (?:a )?sphere\b/, "Volume of a sphere", "V = (4/3) x pi x r^3."], [/\bsurface area of (?:a )?sphere\b/, "Surface area of a sphere", "A = 4 x pi x r^2."],
  [/\bvolume of (?:a )?cube\b/, "Volume of a cube", "V = s^3, where s is the edge length."], [/\bvolume of (?:a )?(?:rectangular prism|box|cuboid)\b/, "Volume of a box", "V = length x width x height."],
  [/\bvolume of (?:a )?cylinder\b/, "Volume of a cylinder", "V = pi x r^2 x h."], [/\bvolume of (?:a )?cone\b/, "Volume of a cone", "V = (1/3) x pi x r^2 x h."], [/\bvolume of (?:a )?pyramid\b/, "Volume of a pyramid", "V = (1/3) x base area x height."],
  [/\bquadratic formula\b/, "Quadratic formula", "For ax^2 + bx + c = 0: x = (-b +/- sqrt(b^2 - 4ac)) / (2a). The discriminant b^2 - 4ac tells you if there are two real roots (> 0), one (= 0) or none (< 0)."],
  [/\bslope formula\b|\bslope of a line\b|\bformula for slope\b/, "Slope", "m = (y2 - y1) / (x2 - x1). A line is y = mx + b, where b is the y-intercept."],
  [/\bdistance formula\b/, "Distance formula", "d = sqrt((x2 - x1)^2 + (y2 - y1)^2)."], [/\bmidpoint formula\b/, "Midpoint formula", "M = ((x1 + x2)/2, (y1 + y2)/2)."],
  [/\bcompound interest\b/, "Compound interest", "A = P(1 + r/n)^(nt): P principal, r yearly rate as a decimal, n compounding periods per year, t years. Continuous compounding: A = P e^(rt)."],
  [/\bsimple interest\b/, "Simple interest", "I = P x r x t (principal x yearly rate x years); total A = P(1 + rt)."],
  [/\bspeed(?:,)? (?:distance|formula)\b|\bdistance(?:,)? speed(?:,)? (?:and )?time\b|\bformula for speed\b/, "Speed, distance and time", "speed = distance / time; distance = speed x time; time = distance / speed."],
  [/\bformula for density\b|\bdensity formula\b/, "Density", "density = mass / volume (for example, g/cm^3 or kg/m^3)."],
  [/\bnewton'?s second law\b|\bf ?= ?ma\b|\bformula for force\b/, "Newton's second law", "F = m x a: force (newtons) = mass (kg) x acceleration (m/s^2)."],
  [/\be ?= ?mc\s?(?:\^?2|squared)\b|\bmass.energy equivalence\b/, "E = mc^2", "Energy equals mass times the speed of light squared: a tiny mass holds enormous energy. 1 gram of mass is about 9 x 10^13 joules, about 21 kilotons of TNT."],
  [/\bohm'?s law\b/, "Ohm's law", "V = I x R: voltage (volts) = current (amps) x resistance (ohms). Power P = V x I = I^2 R."],
  [/\bkinetic energy\b/, "Kinetic energy", "KE = (1/2) x m x v^2."], [/\bpotential energy\b/, "Gravitational potential energy", "PE = m x g x h (g is about 9.81 m/s^2 on Earth)."],
  [/\bpercent(?:age)? (?:change|increase|decrease) formula\b|\bformula for percent(?:age)? (?:change|increase|decrease)\b|\bhow (?:do you|to) (?:calculate|find) (?:a )?percent(?:age)? (?:change|increase|decrease)\b/, "Percentage change", "percent change = (new - old) / old x 100. Positive is an increase, negative a decrease."],
  [/\bhow (?:do you|to) (?:calculate|find|work out) (?:the )?(?:average|mean)\b|\bformula for (?:the )?(?:average|mean)\b/, "Average (mean)", "Add up all the values and divide by how many there are. Example: (2 + 4 + 9) / 3 = 5. (Try: average of 2, 4, 9.)"],
  [/\bhow (?:do you|to) (?:calculate|find|work out) (?:a )?percent(?:age)?(?: of)?\b/, "Percentages", "X% of Y = X / 100 x Y. To find what percent A is of B: A / B x 100. (Try: what is 15% of 80, or 12 is what percent of 48.)"],
  [/\beuler'?s (?:identity|formula)\b/, "Euler's identity", "e^(i pi) + 1 = 0, a special case of Euler's formula, e^(ix) = cos x + i sin x."],
  [/\blaw of cosines\b/, "Law of cosines", "c^2 = a^2 + b^2 - 2ab cos C."], [/\blaw of sines\b/, "Law of sines", "a / sin A = b / sin B = c / sin C."],
  [/\bsohcahtoa\b|\bsin cos tan\b|\btrig(?:onometry)? ratios\b/, "Trigonometric ratios (SOH CAH TOA)", "sin = opposite / hypotenuse, cos = adjacent / hypotenuse, tan = opposite / adjacent."],
];

// ------------------------------------------------------------------ health (general information)
const HEALTH = [
  [/\b(?:normal|average|healthy) (?:human )?body temperature\b|\bnormal temperature (?:for|of) (?:a )?(?:human|person|body)\b/, "Normal body temperature is about 37 degrees C (98.6 degrees F), with a typical healthy range of about 36.1 to 37.2 degrees C (97 to 99 degrees F). A fever is usually 38 degrees C (100.4 degrees F) or higher."],
  [/\bhow much water (?:should|do) (?:i|you|we|people|a person) (?:drink|need)\b|\bwater (?:intake )?(?:per|a) day\b/, "A common guideline (US National Academies) is about 2.7 litres a day of total fluids for women and 3.7 litres for men, counting water from food and all drinks. Roughly 20% comes from food. You need more in heat, when exercising, or when pregnant or breastfeeding. Thirst and pale-yellow urine are good everyday guides."],
  [/\bhow (?:much|many hours of) sleep\b|\bhow many hours (?:should|do) (?:i|you|we|adults?|kids?|teens?|teenagers?|children) (?:need to )?sleep\b/, "Recommended sleep (CDC/AASM): adults 7 or more hours; teenagers (13 to 18) 8 to 10 hours; children 6 to 12, 9 to 12 hours; ages 3 to 5, 10 to 13 hours including naps."],
  [/\b(?:normal|healthy|resting) heart rate\b/, "A normal resting heart rate for adults is 60 to 100 beats per minute; very fit people can be lower, around 40 to 60."],
  [/\b(?:normal|healthy) blood pressure\b/, "Normal adult blood pressure is below 120/80 mmHg. 120 to 129 over less than 80 is elevated, and 130/80 or higher is high blood pressure (hypertension), under US guidelines."],
  [/\bhow many (?:steps|steps a day)\b/, "10,000 steps is a popular goal that began as a 1960s Japanese marketing slogan. Studies suggest benefits rise up to about 7,000 to 10,000 steps a day for most adults, and any increase helps."],
  [/\bhow much (?:exercise|physical activity)\b/, "WHO guidance for adults: at least 150 to 300 minutes of moderate activity (or 75 to 150 minutes of vigorous activity) a week, plus muscle-strengthening on 2 or more days."],
  [/\bhow many calories (?:should|do) (?:i|you|a person|an adult|adults) (?:eat|need)\b/, "Typical estimates (US Dietary Guidelines): about 1,600 to 2,400 kcal a day for adult women and 2,000 to 3,000 for adult men, depending on age, size and activity. Food labels use 2,000 kcal as a reference."],
];
const CALORIES = {
  apple: "about 95 kcal (medium, 182 g)", banana: "about 105 kcal (medium, 118 g)", orange: "about 62 kcal (medium)", egg: "about 72 kcal (large egg, 50 g)", "boiled egg": "about 78 kcal (large)",
  "slice of bread": "about 80 kcal (white, 30 g)", bread: "about 80 kcal per slice (white, 30 g)", rice: "about 205 kcal per cup of cooked white rice (158 g)", "cup of rice": "about 205 kcal (cooked white rice)",
  avocado: "about 240 kcal (medium, 150 g of flesh)", "glass of milk": "about 150 kcal (whole milk, 1 cup) or about 90 kcal (skim)", milk: "about 150 kcal per cup of whole milk (about 90 for skim)",
  "can of coke": "about 140 kcal (355 ml can)", coke: "about 140 kcal per 355 ml can", "slice of pizza": "about 285 kcal (cheese, 1/8 of a 14-inch pizza)", pizza: "about 285 kcal per slice (cheese, 1/8 of a 14-inch pizza)",
  "big mac": "about 590 kcal", potato: "about 160 kcal (medium, baked, with skin)", "chicken breast": "about 165 kcal per 100 g (cooked, skinless)", almonds: "about 165 kcal per ounce (28 g, about 23 almonds)",
  "peanut butter": "about 190 kcal per 2 tablespoons", "cup of coffee": "about 2 kcal (black)", coffee: "about 2 kcal per cup (black)", beer: "about 150 kcal per 355 ml regular beer", "glass of wine": "about 125 kcal (150 ml)",
  carrot: "about 25 kcal (medium)", strawberry: "about 4 kcal each (about 32 kcal per cup)", grapes: "about 104 kcal per cup", oatmeal: "about 150 kcal per cup cooked", donut: "about 250 kcal (glazed)", "chocolate bar": "about 230 kcal (43 g milk chocolate bar)",
};

// ------------------------------------------------------------------ DI about itself, fun facts, riddles
const SELF = [
  [/^(?:what is|tell me) your name$|^(?:do you have|what'?s) (?:a|your) name$|^who am i (?:talking|speaking) (?:to|with)$/, "My name is DI (Deterministic Intelligence), Darknode's offline engine."],
  [/^are you (?:an? )?(?:ai|artificial intelligence|robot|bot|chatbot|machine|computer|human|real person|person|real)$/, "I am software, but not the usual kind of AI. I am **DI**, a deterministic engine: no language model and no neural network. I answer from exact computation (math, units, dates, code generation) and curated knowledge tables, so the same question always gets the same, checkable answer. When I do not know, I say so instead of guessing."],
  [/^are you (?:smart|intelligent|clever|dumb|stupid)$|^how smart are you$/, "Smart in a narrow, reliable way. I do exact maths, conversions, dates, code generation, definitions for most English words, and thousands of curated facts, and I show my work. I am not a free-form thinker like a large language model; for open-ended requests, Smart mode connects one."],
  [/^(?:can|will|could) you help me (?:with )?(?:my |some )?(?:homework|studying|school ?work|assignment|exam|test)$|^help me with (?:my )?homework$/, "Yes, for a lot of it. Give me the actual question, such as \"solve 2x + 5 = 17\", \"what is the formula for the volume of a sphere\", \"define photosynthesis\", \"difference between mitosis and meiosis\" or \"convert 5 miles to km\", and I will answer exactly, with the steps. For essays or open-ended work, use Smart mode."],
  [/^(?:how do you work|how were you (?:made|built)|what are you (?:made|built) (?:of|with)|how does di work)$/, "I read your question through a typo fixer and a rephraser, then score it against about 30 skills: math, units, dates, code generation, text tools, a dictionary, curated knowledge and more. The best-scoring skill runs. Answers come from computation or curated tables, never from guessing, and I tell you when something is outside what I know."],
  [/^(?:are you|do you have) (?:sentient|conscious|feelings|emotions|alive)|^do you (?:feel|think|dream|sleep)$/, "No. I am a deterministic program: I follow rules and look things up. I have no feelings, awareness or experiences."],
  [/^(?:can|do) you learn$|^do you remember (?:me|things|our conversation)$/, "Only a little. I adapt my next-word suggestions to what you type in this browser, but my knowledge and rules change only when the Darknode team updates them. I do not send your conversations anywhere."],
  [/^(?:are you|is di) better than (?:chat ?gpt|gpt|claude|gemini|an? (?:ai|llm))$|^(?:how are you different from|what is the difference between you and) (?:chat ?gpt|claude|gemini|an? (?:ai|llm))$/, "Different, not better at everything. A large language model can discuss almost anything, but it can be wrong with confidence. I cover less, but inside my skills my answers are exact and reproducible, work offline, and cost nothing. Darknode offers both: DI for exact answers and Smart mode for open-ended ones."],
  [/^what is darknode$|^what does darknode do$/, "Darknode is the platform this runs on. It includes DI (this offline engine), Quelvra (verified maths), a toolbox of client-side utilities, and Smart mode AI chat."],
  [/^what is the best programming language$|^which programming language is (?:the )?best$|^(?:what is )?(?:the )?best (?:programming |coding |computer )?language(?: to (?:learn|start with|learn first))?(?: for beginners)?$/, "There is no single best one; it depends on the goal:\n- **Python**: first language, data, AI, scripting\n- **JavaScript/TypeScript**: websites and web apps\n- **Java or Kotlin**: Android and large back-end systems\n- **C#**: games (Unity) and Windows apps\n- **Go**: servers and cloud tools\n- **Rust**: fast, memory-safe systems code\n- **Swift**: iPhone and Mac apps\n- **SQL**: working with databases"],
  [/\blearn\b.*\b(?:python|javascript|js)\b.*\b(?:or|vs|versus)\b.*\b(?:javascript|python|js)\b|\b(?:python|javascript) (?:vs|or) (?:javascript|python) (?:first|to learn|for (?:a )?beginners?)\b/, "Start with **Python** if you want the gentlest syntax, or you are interested in data, AI, automation or science. Start with **JavaScript** if you mainly want to build websites, because it runs in every browser and you see results instantly. The core ideas (variables, loops, functions) carry over, so the second one is much easier."],
  [/^what can i ask you$|^what (?:kinds? of )?questions can (?:i ask|you answer)$/, "Try: maths (\"solve 3x - 7 = 11\"), units (\"72 f in c\"), dates (\"days until christmas\"), code (\"python function that returns the average of the even numbers\"), facts (\"currency of japan\", \"who was marie curie\"), explanations (\"why is the sky blue\"), comparisons (\"tcp vs udp\"), words (\"define ubiquitous\", \"rhymes with light\") and more."],
];
const FUN_FACTS = [
  "Honey never spoils: edible honey has been found in ancient Egyptian tombs over 3,000 years old.",
  "Octopuses have three hearts and blue blood.",
  "A day on Venus (243 Earth days) is longer than its year (225 Earth days).",
  "Bananas are berries, but strawberries are not, botanically speaking.",
  "Wombat poop is cube-shaped, which stops it rolling away.",
  "There are more possible games of chess than atoms in the observable universe (the Shannon number, about 10^120).",
  "Sharks existed before trees: sharks appeared about 450 million years ago, trees about 385 million.",
  "The Eiffel Tower can grow about 15 cm taller in summer because the iron expands in the heat.",
  "A group of flamingos is called a flamboyance.",
  "Humans share about 60% of their genes with bananas (counting genes with a recognisable counterpart).",
  "Cleopatra lived closer in time to the Moon landing than to the building of the Great Pyramid of Giza.",
  "Oxford University is older than the Aztec Empire: teaching there began by 1096, and Tenochtitlan was founded in 1325.",
  "Hot water can sometimes freeze faster than cold water (the Mpemba effect), though when and why is still debated.",
  "The shortest war in history, between Britain and Zanzibar in 1896, lasted about 38 to 45 minutes.",
  "A single cloud can weigh over 500 tonnes (a typical cumulus cloud holds about 500,000 kg of water).",
  "Sea otters hold hands while they sleep so they do not drift apart.",
  "The inventor of the Pringles can, Fredric Baur, had some of his ashes buried in one.",
  "Neutron stars are so dense that a teaspoon of one would weigh around a billion tonnes on Earth.",
  "The heart of a blue whale weighs about 180 kg, roughly the weight of two adult men.",
  "Scotland's national animal is the unicorn.",
  "Your stomach gets a new lining every few days, so it does not digest itself.",
  "Light from the Sun is about 8 minutes old when it reaches you, but the energy was made in the core thousands of years or more earlier.",
  "The word 'set' has more meanings than almost any other English word: the Oxford English Dictionary lists hundreds of senses.",
  "Butterflies taste with their feet.",
  "A bolt of lightning is about five times hotter than the surface of the Sun.",
  "The first computer bug was a real moth, found in the Harvard Mark II relay in 1947 and taped into the logbook.",
  "Koalas have fingerprints so similar to humans' that they could confuse a crime scene.",
  "Saturn is less dense than water: in a big enough bathtub it would float.",
  "Some turtles can breathe through their rear ends (cloacal respiration) during winter hibernation.",
  "The Great Wall of China is not visible to the naked eye from the Moon, a popular myth.",
];
const RIDDLES = [
  ["What has keys but cannot open locks?", "A piano."], ["What gets wetter the more it dries?", "A towel."], ["What has a face and two hands but no arms or legs?", "A clock."],
  ["What can you catch but not throw?", "A cold."], ["What has to be broken before you can use it?", "An egg."], ["I'm tall when I'm young and short when I'm old. What am I?", "A candle."],
  ["What month of the year has 28 days?", "All of them."], ["What is full of holes but still holds water?", "A sponge."], ["What goes up but never comes down?", "Your age."],
  ["What has one eye but cannot see?", "A needle."], ["What belongs to you, but other people use it more than you?", "Your name."], ["What can travel around the world while staying in a corner?", "A stamp."],
  ["The more you take, the more you leave behind. What are they?", "Footsteps."], ["What has a neck but no head?", "A bottle."], ["What runs but never walks, has a mouth but never talks?", "A river."],
  ["What is always in front of you but cannot be seen?", "The future."], ["If you have me, you want to share me. If you share me, you no longer have me. What am I?", "A secret."], ["What has many teeth but cannot bite?", "A comb."],
];
const pick = (arr, seed) => arr[Math.abs(Math.floor(seed)) % arr.length];

// ------------------------------------------------------------------ lookups over the data modules
const COUNTRY_KEYS = [...Object.keys(COUNTRY), ...Object.keys(COUNTRY_ALIAS)].sort((a, b) => b.length - a.length);
const wordRe = (k) => new RegExp("(?:^|[^a-z])" + k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![a-z])");
function findCountry(t) {
  for (const k of COUNTRY_KEYS) if (wordRe(k).test(t)) { const key = COUNTRY[k] ? k : COUNTRY_ALIAS[k]; if (COUNTRY[key]) return key; }
  return null;
}
const THE_C = /^(?:united states|united kingdom|netherlands|philippines|bahamas|gambia|maldives|czech republic|dominican republic|central african republic|democratic republic of the congo|republic of the congo|united arab emirates|marshall islands|solomon islands|comoros|seychelles|vatican city)$/;
const countryName = (k) => (THE_C.test(k) ? "the " : "") + titleCase(k).replace(/^Usa$/, "USA").replace(/^Uk$/, "UK");
const fmtPop = (m) => m >= 1000 ? (m / 1000).toFixed(2).replace(/0$/, "") + " billion" : m >= 1 ? (m >= 100 ? Math.round(m) : m >= 10 ? m.toFixed(1).replace(/\.0$/, "") : m.toFixed(2).replace(/0$/, "")) + " million" : Math.round(m * 1e6).toLocaleString("en-US");
const fmtInt = (n) => Math.round(n).toLocaleString("en-US");

function countryAnswer(t) {
  let field = null;
  if (/\b(?:currency|currencies|money)\b/.test(t)) field = "currency";
  else if (/\bcontinent\b|\bwhich part of the world\b/.test(t) || /^where is\b/.test(t)) field = "continent";
  else if (/\bpopulation\b|\bhow many (?:people|humans|citizens|inhabitants) (?:live|are there|are|reside)\b|\bhow many people (?:in|does)\b|\bhow populated\b/.test(t)) field = "population";
  else if (/\b(?:area|land area|size|surface area) of\b|^how (?:big|large) is\b|^what is the (?:area|size) of\b/.test(t)) field = "area";
  else if (/\b(?:calling|dialing|dialling|phone|telephone|country|international) (?:code|prefix)\b|\bcode (?:for|to) call\b/.test(t)) field = "code";
  else if (/\bdrive on\b|\bside of the road\b|\bdriving side\b|\bwhich side (?:do|does) .* drive\b/.test(t)) field = "drive";
  if (!field) return null;
  if (field === "population" && /\b(?:world|earth|planet)\b/.test(t)) return null; // handled by COUNTS
  const k = findCountry(t);
  if (!k) return null;
  const [cont, cur, code, pop, area, dial, drive] = COUNTRY[k], N = countryName(k), Nc = cap(N);
  const note = "Source: DI country reference table (curated).";
  switch (field) {
    case "currency": return cur ? R(`The currency of ${N} is the **${cur}** (${code}).`, "Currency of " + titleCase(k), note) : null;
    case "continent": return cont ? R(`${Nc} is in **${cont}**.`, "Where is " + titleCase(k), note) : null;
    case "population": return pop != null ? R(`${Nc} has about **${fmtPop(pop)}** people (${POP_YEAR} estimate).`, "Population of " + titleCase(k), "Rounded estimate from DI's country table; populations change every year.") : null;
    case "area": return area ? R(`${Nc} covers about **${fmtInt(area)} square km** (${fmtInt(area * 0.386102)} square miles).`, "Area of " + titleCase(k), note) : null;
    case "code": return dial ? R(`The international calling code for ${N} is **${dial}**.`, "Calling code", note) : null;
    case "drive": return drive ? R(`In ${N}, people drive on the **${drive}**.`, "Driving side", note) : null;
  }
  return null;
}

function personAnswer(t) {
  const m = t.match(/^(?:who (?:is|was|were)|(?:tell me )?about|what (?:is|was|did) .*? (?:known|famous) for|what did|why is|why was|biography of|bio of|info on|facts about)\s+(.+?)(?:\s+(?:known for|famous for|do|invent|discover|and what did (?:he|she|they) do))?$/);
  if (!m) return null;
  let name = m[1].replace(/^(?:the )/, "").replace(/'s?$/, "").trim();
  const key = PEOPLE[name] ? name : PEOPLE_ALIAS[name];
  if (!key || !PEOPLE[key]) return null;
  const [disp, years, role, sum] = PEOPLE[key];
  return R(`**${disp}** (${years}) was ${/^(?:a|an|the) /.test(role) ? role : /^(?:last|first|only|founding|longest|greatest|current|youngest|oldest|second|third)\b/.test(role) ? "the " + role : (/^[aeiou]/i.test(role) ? "an " : "a ") + role}. ${sum}`.replace(/ was (?=.*born \d)/, " is "), disp, "Source: DI curated biographies (hand-written, not generated).");
}

function animalKey(w) { w = w.replace(/^(?:a|an|the) /, "").trim(); return ANIMALS[w] ? w : ANIMAL_ALIAS[w] || null; }
function animalAnswer(t) {
  let m, a;
  const note = "Source: DI curated animal facts.";
  if ((m = t.match(/^(?:how long (?:do|does|can) (.+?) live(?: for)?|what is the (?:average )?(?:life ?span|life expectancy) of (?:an? |the )?(.+?)|(.+?) (?:life ?span|life expectancy))$/))) {
    a = animalKey(m[1] || m[2] || m[3]); if (a && ANIMALS[a].life) return R(`${cap(ANIMALS[a].plural || a)} typically live **${ANIMALS[a].life}**.`, "Lifespan: " + a, note);
  }
  if ((m = t.match(/^what (?:do|does) (.+?) eat$|^what is (?:the|an?) (.+?)(?:'s)? diet$|^(?:diet of|food for) (?:an? |the )?(.+)$/))) {
    a = animalKey(m[1] || m[2] || m[3]);
    if (a && ANIMALS[a].diet) {
      const d = ANIMALS[a].diet.match(/^([a-z -]+?):\s*(.+)$/), P = cap(ANIMALS[a].plural || a);
      return R(d ? `${P} are ${d[1].replace(/(?:y)$/, "ie").replace(/([^s])$/, "$1s")}: they eat ${d[2].replace(/\.$/, "")}.` : `${P}: ${ANIMALS[a].diet}.`, "Diet: " + a, note);
    }
  }
  if ((m = t.match(/^how fast (?:is|are|can|do|does) (.+?)(?: (?:run|fly|swim|go|move))?$/))) {
    a = animalKey(m[1]); if (a && ANIMALS[a].speed) return R(`${cap(ANIMALS[a].plural || a)} can reach **${ANIMALS[a].speed}**.`, "Speed: " + a, note);
  }

  if ((m = t.match(/^(?:tell me )?(?:a |some )?(?:fun |interesting )?facts? about (.+)$|^(?:tell me )?about (.+)$/))) {
    a = animalKey(m[1] || m[2]); const x = a && ANIMALS[a];
    if (x) return R([x.group && `The ${a} is ${/^[aeiou]/.test(x.group) ? "an" : "a"} ${x.group}.`, x.life && `Lifespan: ${x.life}.`, x.diet && `Diet: ${x.diet}.`, x.speed && `Top speed: ${x.speed}.`, x.fact].filter(Boolean).join("\n\n"), cap(a), note);
  }
  return null;
}

function recordAnswer(t) {
  const m = t.match(/^(?:what|which|who|where) (?:is|are|was) (?:the )?(.+?)$/) || t.match(/^(?:the )?((?:largest|biggest|smallest|tallest|highest|deepest|longest|fastest|slowest|hottest|coldest|closest|nearest|brightest|hardest|oldest|most|least|lightest|heaviest|densest|driest|wettest|strongest)\b.+)$/);
  if (!m) return null;
  let k = m[1];
  for (const [re, to] of REC_SYN) k = k.replace(re, to);
  const variants = [k, k.replace(/ (?:in|on|of) (?:the )?(?:world|earth|planet|solar system|universe|history)$/, "").replace(/ (?:ever|of all time|known)$/, "").replace(/ in the (?:human )?body$/, "")];
  for (const v of variants) {
    if (RECORDS[v]) return R(RECORDS[v], "Record", "Source: DI curated records; records can change.");
    if (ANIMAL_RECORDS[v]) return R(ANIMAL_RECORDS[v], "Record", "Source: DI curated animal facts.");
  }
  return null;
}

function syntaxAnswer(t) {
  // "how do i make a for loop in java", "if else in python", "python dictionary", "how to print in rust"
  const langs = Object.keys(SYNTAX_LANGS), aliases = Object.keys(LANG_ALIAS);
  const lm = t.match(new RegExp("(?:^|\\s)(?:in |using |with )?(" + [...langs, ...aliases].map((x) => x.replace(/[+#]/g, "\\$&")).sort((a, b) => b.length - a.length).join("|") + ")(?=\\s|$)"));
  if (!lm) return null;
  const lang = SYNTAX_LANGS[lm[1]] ? lm[1] : LANG_ALIAS[lm[1]];
  if (!lang) return null;
  const rest = (" " + t.replace(lm[0], " ") + " ").replace(/\s+/g, " ");
  if (!/\b(?:how|what|syntax|example|make|write|create|use|declare|define|do|show|an?|the)\b/.test(rest) && rest.trim().split(" ").length > 4) return null;
  let best = null, bestLen = 0;
  for (const [key, c] of Object.entries(CONSTRUCTS)) for (const w of [key, ...(c.words || [])]) {
    if (w.length > bestLen && new RegExp("(?:^|[^a-z])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![a-z])").test(rest)) { best = key; bestLen = w.length; }
  }
  if (!best || !SYNTAX[best]) return null;
  const used = [best, ...(CONSTRUCTS[best].words || [])].sort((a, b) => b.length - a.length);
  let left = rest;
  for (const w of used) left = left.replace(new RegExp("(?:^|[^a-z])" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "(?![a-z])", "g"), " ");
  const FILL = /^(?:how|do|does|i|you|we|to|make|write|create|use|using|declare|define|a|an|the|in|with|show|me|example|examples|of|syntax|for|what|is|are|simple|basic|can|code|give|please|proper|correct|way|work|works|an?|my|own|new|get|one|tell|about)$/;
  if (left.split(" ").filter((w) => w && !FILL.test(w)).length) return null;
  const e = SYNTAX[best][lang];
  if (!e) return { ok: true, kind: "kb", title: CONSTRUCTS[best].title + " in " + SYNTAX_LANGS[lang], text: `${SYNTAX_LANGS[lang]} has no built-in ${CONSTRUCTS[best].title.toLowerCase()}.`, note: "Source: DI syntax reference." };
  return { ok: true, kind: "syntax", title: CONSTRUCTS[best].title + " in " + SYNTAX_LANGS[lang], lang, code: e[0], text: e[1] || "", note: "Source: DI syntax reference (hand-written, not generated)." };
}

function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  let s = w.replace(/(?:[^laeiouy]es|[^laeiouy]ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  const n = (s.match(/[aeiouy]{1,2}/g) || []).length + (/[^aeiouy]le$/.test(w) ? 1 : 0) - (/[^aeiouy]le$/.test(w) && /[aeiouy]{1,2}le$/.test(s) ? 1 : 0);
  return Math.max(1, n + (/(?:ia|io|eo|ua|ui(?!c))/.test(w.replace(/(?:tion|sion|cious|tious)/g, "")) ? 1 : 0));
}

// ------------------------------------------------------------------ the matcher
export function answer(input, seed = Date.now()) {
  const t = norm(input);
  if (!t || t.length > 200) return null;
  let m;
  // pi and e to N digits
  if ((m = t.match(/^(?:what is |give me |show me |print )?(pi|e|euler'?s number|the golden ratio|phi|sqrt ?2|square root of 2) (?:to|with) (\d{1,3}) (?:digits|decimal places|decimals|places|dp)$/))) {
    const D = { pi: "3.14159265358979323846264338327950288419716939937510582097494459230781640628620899862803482534211706798214808651", e: "2.71828182845904523536028747135266249775724709369995957496696762772407663035354759457138217852516642742746639", phi: "1.61803398874989484820458683436563811772030917980576286213544862270526046281890244970720720418939113748475408807", sqrt2: "1.41421356237309504880168872420969807856967187537694807317667973799073247846210703885038753432764157273501384623" };
    const k = /^pi/.test(m[1]) ? "pi" : /^(?:e|euler)/.test(m[1]) ? "e" : /phi|golden/.test(m[1]) ? "phi" : "sqrt2", n = +m[2], str = D[k];
    if (n >= 1 && n <= 100) {
      const digits = str.slice(0, 2 + n + 1), last = +digits.slice(-1), cut = str.slice(0, 2 + n);
      const rounded = last >= 5 ? (BigInt(cut.replace(".", "")) + 1n).toString().replace(/^(\d)/, "$1.") : cut;
      return R(`**${rounded}** (${m[1]} to ${n} decimal place${n === 1 ? "" : "s"}, rounded)${cut === rounded ? "" : `. Truncated: ${cut}`}.`, "Digits of " + m[1], "From DI's stored 100-digit values.");
    }
  }
  // "what country has the calling code +44"
  if ((m = t.match(/\b(?:country|calling|dialing|dialling|phone|telephone|international) (?:code|prefix)\b.*?\+?\s?(\d{1,4})\b|^(?:whose|which country'?s?) (?:code|number) is \+?(\d{1,4})|^\+(\d{1,4}) (?:is )?(?:which|what) country/))) {
    const code = "+" + (m[1] || m[2] || m[3]), bySig = new Map();
    for (const [k, v] of Object.entries(COUNTRY)) {
      if (v[5] !== code || /^(?:uk|usa|us|america|england|scotland|wales|northern ireland|britain|great britain|korea|holland|burma|czech republic|ivory coast|swaziland|macedonia|east timor|united states of america)$/.test(k)) continue;
      const sig = JSON.stringify(v); if (!bySig.has(sig) || k.length > bySig.get(sig).length) bySig.set(sig, k);
    }
    const uniq = [...bySig.values()].sort().map(countryName);
    if (uniq.length) return R(`**${code}** is the calling code for ${uniq.length > 6 ? uniq.slice(0, 6).join(", ") + " and " + (uniq.length - 6) + " more" : uniq.join(uniq.length === 2 ? " and " : ", ")}.`, "Calling code " + code, "Source: DI country reference table (curated).");
  }
  // acronyms
  if ((m = t.match(/^(?:what (?:does|do|did) (?:the )?(?:acronym |abbreviation |letters )?|what is the (?:full form|meaning|expansion|long form) of (?:the )?(?:acronym |abbreviation )?)([a-z0-9&.;]+)(?: (?:stand for|mean|short for))?$/)) || (m = t.match(/^([a-z0-9&.;]+) (?:stands for|full form|meaning|acronym|abbreviation)$/))) {
    const k = m[1].replace(/\.$/, "").replace(/\./g, (x, i, s) => (s.length <= 4 ? "." : "")).replace(/^(?:e\.g|i\.e)$/, (x) => x), v = ACRONYMS[k] || ACRONYMS[k.replace(/\./g, "")];
    if (v && (/stand|full form|expansion|long form|short for|acronym|abbreviation/.test(t) || k.length <= 5)) return R(/^[A-Z]/.test(v) && !/ is |not an acronym/.test(v) ? `**${k.toUpperCase().replace(/;/, ";")}** stands for **${v}**.` : `**${k.toUpperCase()}**: ${v}.`, "Acronym", "Source: DI acronym table (curated).");
  }
  // DI itself
  for (const [re, text] of SELF) if (re.test(t)) return R(text, "About DI");
  if (/^(?:tell me |give me |share )?(?:a |an |another |one more )?(?:fun|random|interesting|cool|weird) fact(?:s)?(?: please)?$|^(?:tell me )?something (?:interesting|cool|new|fun|i don't know|random)$|^(?:did you know|teach me something)$/.test(t))
    return R(pick(FUN_FACTS, seed), "Fun fact", "From DI's curated fact list; ask again for another.");
  if (/^(?:tell me |give me |ask me |do you (?:know|have) )?(?:a |another |one more )?riddles?(?: me)?(?: please)?$|^riddle me(?: this)?$/.test(t)) {
    const [q, a] = pick(RIDDLES, seed);
    return R(q + "\n\n\n\nAnswer: " + a, "Riddle", "Think first, then read the answer.");
  }
  // the ceo / president of X now: live data
  if (/^who is (?:the )?(?:current |present |new )?(?:ceo|president|prime minister|pm|king|queen|chancellor|leader|owner|head|chairman|governor|mayor|pope|monarch|coach|captain)(?: of| for)? /.test(t) || /^who (?:runs|owns|leads) /.test(t))
    return R("That changes over time, so I will not state it from memory. DI works offline with no live data. Check a current source, or turn on Smart mode, which can search the web.", "Needs current information");
  // why / how explanations
  for (const [re, title, text] of EXPLAIN) if (re.test(t) && /^(?:why|how|what|where|explain|when)\b|\b(?:cause|causes|work|works|happen|form)\b/.test(t)) return R(text, title, "Source: DI curated explanations (hand-written, simplified but accurate).");
  // formulas
  const digits = /\d/.test(t);
  if (!digits && /\bformula\b|\btheorem\b|\blaw\b|\bequation for\b|^how (?:do you|to|do i) (?:calculate|find|work out|get)\b|^what is (?:the )?(?:area|volume|perimeter|circumference|surface area) of\b|\bsohcahtoa\b|\be ?= ?mc/.test(t))
    for (const [re, title, text] of FORMULAS) if (re.test(t)) return R(text, title, "Source: DI formula sheet.");
  // health
  if (!digits) for (const [re, text] of HEALTH) if (re.test(t)) return R(text, "Health information", "General information, not medical advice. For your own situation, ask a doctor.");
  if ((m = t.match(/^how many calories (?:are )?(?:in|does) (?:an? |one |a medium |a large )?(.+?)(?: have| contain)?$|^calories (?:in|of) (?:an? )?(.+)$/))) {
    const f = (m[1] || m[2]).trim(), c = CALORIES[f] || CALORIES[f.replace(/s$/, "")];
    if (c) return R(`${cap(f)}: ${c}.`, "Calories", "Typical values (USDA FoodData Central); exact numbers vary with size and preparation.");
  }
  // how many / how old / how far / how tall
  if (!digits && /^how (?:many|much|old|far|long|big|large|hot|deep)\b|\bpopulation of (?:the )?(?:world|earth)\b|\b(?:world|global) population\b|\bage of\b/.test(t)) {
    for (const [re, text] of AGES) if (re.test(t)) return R(text, "Fact", "Source: DI curated reference facts.");
    for (const [re, text] of COUNTS) if (re.test(t)) return R(text, "Fact", "Source: DI curated reference facts.");
  }
  if ((m = t.match(/^(?:how (?:tall|high|big) is|what is the height of|height of) (?:the )?(.+)$/))) {
    const h = HEIGHTS[m[1]] || HEIGHTS[m[1].replace(/^mt\.? /, "mount ")];
    if (h) return R(h, "Height", "Source: DI curated reference facts.");
  }
  // country data, people, animals, records
  const c = digits ? null : countryAnswer(t); if (c) return c;
  const p = personAnswer(t); if (p) return p;
  const a = animalAnswer(t); if (a) return a;
  const r = recordAnswer(t); if (r) return r;
  // syllables (computed by rule, so it says so)
  if ((m = t.match(/^how many syllables (?:are )?(?:in|does) (?:the word )?"?([a-z]+)"?(?: have)?$|^(?:count )?(?:the )?syllables (?:in|of) (?:the word )?"?([a-z]+)"?$/))) {
    const w = m[1] || m[2], n = syllables(w);
    return R(`**${w}** has **${n}** syllable${n === 1 ? "" : "s"}.`, "Syllables", "Counted by English spelling rules (vowel groups, silent e, -le endings). A few words break the rules, so say it aloud if it matters.");
  }
  // programming syntax
  const sx = syntaxAnswer(t); if (sx) return sx;
  return null;
}
export const KB_VOCAB = [...new Set([...Object.keys(ACRONYMS), ...Object.keys(COUNTRY), ...Object.keys(COUNTRY_ALIAS), ...Object.keys(PEOPLE), ...Object.keys(PEOPLE_ALIAS), ...Object.keys(ANIMALS), ...Object.keys(ANIMAL_ALIAS), ...Object.keys(HEIGHTS), ...Object.keys(CALORIES)].join(" ").split(/[^a-z]+/).filter((w) => w.length > 2))];
export { syllables };
