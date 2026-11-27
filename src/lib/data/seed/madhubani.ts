import type { Tradition } from "../../types.ts";

export const madhubani: Tradition = {
  id: "trad-madhubani",
  slug: "madhubani-painting",
  passportNo: "002",
  status: "published",
  maturity: "researched",
  name: "Madhubani Painting",
  displayTitle: "Madhubani · Mithila Painting",
  tagline: "From the walls of a wedding room to the walls of the world.",
  nativeNames: [
    { text: "मिथिला चित्रकला", script: "Devanagari", lang: "Maithili / Hindi", note: "Mithila painting" },
    { text: "मधुबनी पेंटिंग", script: "Devanagari", lang: "Hindi" },
  ],
  alternateNames: ["Mithila painting", "Mithila art", "Maithil painting"],
  category: "painting",
  techniques: ["Line work (kachni)", "Filled colour (bharni)", "Wall and floor painting", "Painting on paper"],
  regionLabel: "Mithila — Bihar, India & Nepal",
  countries: ["IN", "NP"],
  collection: "IN",
  places: [
    { place: "madhubani", role: "gi-area", note: "District that gives the painting its best-known name" },
    { place: "darbhanga", role: "shared", note: "Mithila region, Bihar" },
    { place: "janakpur", role: "shared", note: "Mithila region, Nepal" },
  ],
  communities: [{ community: "mithila-women", role: "Painters, historically and today" }],
  summary:
    "A painting tradition of the Mithila region — northern Bihar and neighbouring Nepal — made for centuries by women on the walls of homes, and carried onto paper and into the world in the 20th century.",
  intro:
    "Mithila painting began as something made for a room and an occasion: a wedding chamber, a festival, a threshold. Women drew gods, fish, birds and lotus vines in dense double lines. When the world met it, first through a colonial officer's camera and then through paper sold in Delhi, its makers' names travelled more slowly than its images.",
  accent: "burgundy",
  motif: "madhubani",
  hero: "madhubani-station",
  gallery: ["madhubani-station", "madhubani-artist", "madhubani-0028", "madhubani-0103"],
  periods: ["Legend", "1934 earthquake", "1960s drought", "1980s Japan", "2007 GI"],
  origins: [
    {
      type: "p",
      text:
        "Madhubani is a district; Mithila is a region. The painting carries both names, and the region it comes from spans northern Bihar in India and the adjoining Madhesh of Nepal, around Janakpur. This passport is listed under both countries for that reason.",
      claims: ["mad-region"],
    },
    {
      type: "p",
      text:
        "It was painted by women, on the walls and floors of homes, for rituals and especially weddings. A widely told story traces it to the Ramayana — to King Janaka asking for his palace to be painted for the wedding of his daughter Sita. We record that as tradition, not history.",
      claims: ["mad-walls", "mad-legend"],
    },
    {
      type: "p",
      text:
        "Outsiders' accounts begin with disaster. After the 1934 Bihar–Nepal earthquake, the British officer William G. Archer saw paintings exposed on the inner walls of damaged houses; he returned to photograph them and published an article in the journal Marg in 1949.",
      claims: ["mad-archer"],
    },
    {
      type: "note",
      title: "Whose story was told first?",
      text:
        "Scholars note that Archer's framing centred Brahmin and Kayastha painting and overlooked other communities' traditions. A history that begins with the person who 'discovered' an art form is one of the gaps this archive exists to close.",
      claims: ["mad-archer-critique"],
    },
    { type: "figure", media: "madhubani-artist" },
    {
      type: "p",
      text:
        "In the drought of the mid-1960s, the All India Handicrafts Board — under Pupul Jayakar, with the artist-officer Bhaskar Kulkarni — encouraged women to paint on paper so their work could be sold. Wall painting became portable, and Mithila painters began to be known by name.",
      claims: ["mad-paper"],
    },
  ],
  significance: [
    {
      type: "p",
      text:
        "Commonly described styles include bharni (filled colour), kachni (fine line), tantrik, godna and kohbar — the last named for the painted wedding chamber. These are classifications used by practitioners and scholars, and the boundaries between them are not fixed.",
      claims: ["mad-styles"],
    },
    {
      type: "pull",
      text: "The painting left the wall in the 1960s. The painters' names took decades to follow.",
      attribution: "Culture Passport editorial",
    },
  ],
  makers: {
    intro: [
      {
        type: "p",
        text:
          "Mithila painting has been a women's art, and its best-known practitioners — honoured nationally since the 1970s — are women. The Padma Shri, one of India's highest civilian honours, has gone to Jagdamba Devi, Sita Devi, Ganga Devi, Mahasundari Devi, Baua Devi and Dulari Devi, among others.",
        claims: ["mad-padma"],
      },
    ],
    materials: [
      { name: "Wall and floor", detail: "The original surfaces: plastered walls and floors of homes, renewed for occasions.", level: "documented", sources: ["wiki-madhubani"] },
      { name: "Paper", detail: "Introduced for sale during the 1960s drought programme; now the most common support.", level: "documented", sources: ["fap-context"] },
      { name: "Natural pigments", detail: "Traditionally plant- and mineral-based colours; practices vary by painter and period.", level: "unverified", sources: ["wiki-madhubani"] },
    ],
    process: [
      { title: "Border first", detail: "Compositions are commonly framed with a decorated border.", level: "unverified", sources: ["wiki-madhubani"] },
      { title: "Double outline", detail: "Figures are drawn in double lines, filled with hatching (kachni) or colour (bharni).", level: "interpretation", sources: ["wiki-madhubani"] },
      { title: "No empty ground", detail: "Spaces are filled with flowers, fish, birds and geometric pattern.", level: "unverified", sources: ["wiki-madhubani"] },
    ],
    practitioners: [
      { name: "Jagdamba Devi", note: "Padma Shri, 1975 — the first Mithila painter to receive it.", sources: ["astaguru-women-artists", "wiki-madhubani"] },
      { name: "Sita Devi", note: "Padma Shri, 1981.", sources: ["astaguru-women-artists"] },
      { name: "Ganga Devi", note: "Padma Shri, 1984.", sources: ["astaguru-women-artists"] },
      { name: "Mahasundari Devi", note: "Padma Shri, 2011 (one source gives 2010).", sources: ["astaguru-women-artists"] },
      { name: "Baua Devi", note: "Padma Shri, 2017.", sources: ["astaguru-women-artists"] },
      { name: "Dulari Devi", note: "Padma Shri, 2021.", sources: ["astaguru-women-artists", "padma-2021"] },
    ],
    voicesNote:
      "The names above are public honours. We have not recorded interviews, and we do not attribute quotations to painters from secondary sources.",
  },
  timeline: [
    {
      id: "mad-t-legend",
      date: { year: -1000, approx: true, label: "Legend" },
      title: "Painting for Sita's wedding",
      body: "In the widely told story, King Janaka has his kingdom painted for his daughter Sita's wedding. It is a tradition about origins, not a dated event.",
      level: "community",
      sources: ["wiki-madhubani"],
      place: "janakpur",
      tag: "origin",
    },
    {
      id: "mad-t-1934",
      date: { year: 1934, label: "1934" },
      title: "Revealed by an earthquake",
      body: "After the Bihar–Nepal earthquake, W. G. Archer sees paintings on the exposed inner walls of damaged homes, and later photographs them.",
      level: "documented",
      sources: ["tbi-archer", "fap-historiography"],
      place: "madhubani",
      tag: "exchange",
    },
    {
      id: "mad-t-1949",
      date: { year: 1949, label: "1949" },
      title: "'Maithil painting' in Marg",
      body: "Archer's article in Marg brings the painting to scholarly attention — and shapes how it is classified for decades.",
      level: "documented",
      sources: ["fap-historiography", "tbi-archer"],
      tag: "exchange",
    },
    {
      id: "mad-t-1966",
      date: { year: 1966, approx: true, label: "c. 1966–68" },
      title: "From walls to paper",
      body:
        "During a severe drought, the All India Handicrafts Board encourages women to paint on paper for sale. Some sources date the start of the programme to 1964.",
      level: "documented",
      sources: ["fap-context", "tbi-archer"],
      place: "new-delhi",
      tag: "craft",
    },
    {
      id: "mad-t-1975",
      date: { year: 1975, label: "1975" },
      title: "A painter named nationally",
      body: "Jagdamba Devi becomes the first Mithila painter to receive the Padma Shri.",
      level: "documented",
      sources: ["astaguru-women-artists", "wiki-madhubani"],
      tag: "recognition",
    },
    {
      id: "mad-t-1982",
      date: { year: 1982, label: "1982" },
      title: "A museum in snowy Niigata",
      body:
        "Tokio Hasegawa opens the Mithila Museum in Tokamachi, Japan, in a converted elementary school. It grows into one of the largest collections of Mithila painting anywhere.",
      level: "documented",
      sources: ["fap-hasegawa", "indica-hasegawa"],
      place: "tokamachi",
      tag: "exhibition",
    },
    {
      id: "mad-t-2007",
      date: { year: 2007, month: 5, day: 16, label: "16 May 2007" },
      title: "Registered as a geographical indication",
      body: "'Madhubani Paintings' is registered as a GI for Bihar, on an application by the state's Director of Industries filed in 2005.",
      level: "documented",
      sources: ["gi-37"],
      tag: "recognition",
    },
  ],
  travels: {
    intro: [
      {
        type: "p",
        text:
          "Few Indian painting traditions have travelled further: to Delhi's craft markets, to Japanese museum walls, to railway stations and printed merchandise. The question here is not whether it should travel, but whether the women who made it travel with it.",
      },
    ],
    influences: [
      {
        title: "A collection in Japan",
        body: "The Mithila Museum in Tokamachi has collected and exhibited Mithila painting since 1982 — one of the clearest cases of an outside institution building a relationship with a tradition over decades.",
        level: "documented",
        sources: ["fap-hasegawa", "indica-hasegawa"],
      },
      {
        title: "Painting on public walls",
        body: "Madhubani railway station's walls carry large Mithila paintings, photographed in 2021.",
        level: "documented",
        sources: ["commons-madhubani-station"],
      },
      {
        title: "Printed copies and authenticity",
        body: "Commentators argue that printed reproductions sold as 'Madhubani' undercut hand painters, and that GI protection has been weakly enforced.",
        level: "interpretation",
        sources: ["dte-madhubani-authenticity"],
      },
    ],
    cases: [],
  },
  claims: [
    {
      id: "mad-region",
      text: "Madhubani (Mithila) painting comes from the Mithila region, which spans northern Bihar in India and adjoining parts of Nepal.",
      level: "documented",
      sources: ["wiki-madhubani"],
    },
    {
      id: "mad-walls",
      text: "It was traditionally painted by women on the walls and floors of homes, especially for rituals and weddings.",
      level: "documented",
      sources: ["wiki-madhubani", "tbi-archer"],
    },
    {
      id: "mad-legend",
      text: "A widely told origin story links the painting to King Janaka commissioning paintings for the wedding of his daughter Sita.",
      level: "community",
      sources: ["wiki-madhubani"],
      note: "An origin legend, recorded as tradition.",
    },
    {
      id: "mad-archer",
      text: "After the 1934 Bihar–Nepal earthquake, William G. Archer saw paintings on the inner walls of damaged houses, later photographed them, and published an article in Marg in 1949.",
      level: "documented",
      sources: ["tbi-archer", "fap-historiography"],
    },
    {
      id: "mad-archer-critique",
      text: "Archer's framing centred Brahmin and Kayastha styles and overlooked other communities' painting.",
      level: "interpretation",
      sources: ["fap-historiography"],
    },
    {
      id: "mad-paper",
      text: "During the drought of the mid-1960s the All India Handicrafts Board (called the Handloom Board in some accounts), under Pupul Jayakar and with Bhaskar Kulkarni, encouraged women to paint on paper for sale.",
      level: "documented",
      sources: ["fap-context", "tbi-archer"],
      note: "Sources differ on whether the intervention began in 1964 or 1966–68.",
    },
    {
      id: "mad-styles",
      text: "Commonly named styles include bharni, kachni, tantrik, godna and kohbar.",
      level: "interpretation",
      sources: ["wiki-madhubani"],
    },
    {
      id: "mad-padma",
      text: "Mithila painters who have received the Padma Shri include Jagdamba Devi (1975), Sita Devi (1981), Ganga Devi (1984), Mahasundari Devi (2011), Baua Devi (2017), Godawari Dutta (2019) and Dulari Devi (2021).",
      level: "documented",
      sources: ["astaguru-women-artists", "wiki-madhubani", "padma-2021"],
      note: "One outlet gives 2010 for Mahasundari Devi, and Wikipedia gives 2020 for Dulari Devi; the 2021 Padma list (announced 25 January 2021) names her.",
    },
    {
      id: "mad-gi",
      text: "'Madhubani Paintings' was registered as a geographical indication for Bihar (certificate dated 16 May 2007) on an application by Bihar's Director of Industries.",
      level: "documented",
      sources: ["gi-37"],
      note: "The record shows validity to 21 August 2025 and a 2024 renewal notice; current renewal status is not confirmed.",
    },
    {
      id: "mad-museum",
      text: "The Mithila Museum in Tokamachi, Niigata, Japan, was founded by Tokio Hasegawa and inaugurated in 1982; Hasegawa had converted an elementary school there into a centre for the collection.",
      level: "documented",
      sources: ["fap-hasegawa", "indica-hasegawa"],
      note: "Reported collection sizes vary from about 850 to over 3,000 works.",
    },
  ],
  keepAlive: {
    organizations: ["bihar-industries", "mithila-museum"],
    resources: [
      {
        title: "GI Registry record No. 37",
        url: "https://search.ipindia.gov.in/GIRPublicSearch/Application/Details/37",
        note: "The registration and its list of authorised users — painters registered to use the GI.",
        source: "gi-37",
      },
      {
        title: "Folkartopedia archive on Mithila painting",
        url: "https://www.folkartopedia.com/archive/madhubani-painting-a-historical-context-sk/",
        note: "Essays and interviews on the painting's history and its historiography.",
        source: "fap-context",
      },
    ],
    collaborationNotes: [
      "Credit the painter by name, not only the style.",
      "Say 'Mithila' as well as 'Madhubani' — the region crosses into Nepal.",
      "Don't sell printed reproductions as hand painting.",
      "The GI register lists authorised users — a starting point for finding registered painters.",
    ],
  },
  related: [
    { slug: "warli-painting", reason: "Another wall painting tradition that moved onto paper in the 1960s–70s and made individual painters famous." },
    { slug: "phulkari", reason: "Also a women's art made for weddings, and also divided by a modern border." },
  ],
  editorial: {
    lastReviewed: "2026-11-17",
    reviewedBy: "Culture Passport editorial desk (seed research)",
    notes: "Researched starter passport. Materials and process details still need practitioner review.",
    openQuestions: [
      "Accounts of Dalit painting traditions in Mithila, from practitioners themselves.",
      "Current renewal status of the GI.",
      "Practices on the Nepal side of the region.",
    ],
  },
};
