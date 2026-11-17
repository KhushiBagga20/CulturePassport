import type { Tradition } from "../../types.ts";

export const warli: Tradition = {
  id: "trad-warli",
  slug: "warli-painting",
  passportNo: "004",
  status: "published",
  maturity: "editorial-draft",
  name: "Warli Painting",
  displayTitle: "Warli Painting",
  tagline: "A circle, a triangle, a community.",
  nativeNames: [{ text: "वारली चित्रकला", script: "Devanagari", lang: "Marathi" }],
  alternateNames: ["Warli art", "Varli painting"],
  category: "painting",
  techniques: ["Wall painting", "Painting on paper and canvas"],
  regionLabel: "Maharashtra–Gujarat border, India",
  countries: ["IN"],
  collection: "IN",
  places: [
    { place: "dahanu", role: "community-home" },
    { place: "palghar", role: "community-home" },
    { place: "dnh", role: "gi-area" },
  ],
  communities: [{ community: "warli", role: "Painters and custodians" }],
  summary:
    "The ritual wall painting of the Warli Adivasi community of the Maharashtra–Gujarat border — now one of India's most reproduced visual languages, and one of its least credited.",
  intro:
    "Figures made of two triangles and a circle; dancers spiralling around a musician; fields, animals and spirits on an earthen wall. Warli painting belongs to the Warli community. It is now printed on mugs and murals far from Dahanu — often without the community's name.",
  accent: "forest",
  motif: "warli",
  hero: "warli-sgnp",
  gallery: ["warli-sgnp", "warli-mashe", "warli-omr"],
  periods: ["Ritual wall painting", "1970s paper", "1989 Paris", "2014 GI"],
  origins: [
    {
      type: "p",
      text:
        "Warli painting is the wall painting of the Warli (Varli) people, an Adivasi community of the coastal and hill districts along the Maharashtra–Gujarat border. Its registered geographical area spans Maharashtra, Gujarat, Dadra & Nagar Haveli and Daman & Diu.",
      claims: ["wrl-community", "wrl-gi"],
    },
    {
      type: "p",
      text:
        "Accounts describe white paint made from rice paste on walls prepared with earth and cow dung, and a vocabulary of circles, triangles and lines. This draft has not yet been reviewed with Warli painters, so these descriptions are marked for verification.",
      claims: ["wrl-materials"],
    },
    { type: "figure", media: "warli-mashe" },
  ],
  significance: [
    {
      type: "p",
      text:
        "Ritual meaning, the names of motifs and who may paint what are questions this passport will answer only with the community. Until then, we describe what is publicly documented and leave the rest open.",
    },
  ],
  makers: {
    intro: [
      {
        type: "p",
        text:
          "The best-documented Warli painter is Jivya Soma Mashe, who took the painting onto paper and canvas and exhibited internationally. He received the Padma Shri in 2011 and died in Dahanu in 2018.",
        claims: ["wrl-mashe"],
      },
    ],
    materials: [
      { name: "Rice paste", detail: "Described as the traditional white pigment.", level: "unverified", sources: ["wiki-warli"] },
      { name: "Earthen wall", detail: "Walls prepared with mud and cow dung form the ground.", level: "unverified", sources: ["wiki-warli"] },
    ],
    process: [],
    practitioners: [
      { name: "Jivya Soma Mashe (d. 2018)", note: "Exhibited at 'Magiciens de la Terre', Paris, 1989; Padma Shri 2011.", sources: ["wiki-mashe"] },
    ],
    voicesNote: "Editorial draft. No interviews have been recorded; we will not publish process details until Warli painters have reviewed them.",
  },
  timeline: [
    {
      id: "wrl-t-ritual",
      date: { year: 1900, approx: true, label: "Undated" },
      title: "Painting for ritual",
      body: "Warli painting is described as ritual wall painting, renewed for occasions. Its age is not documented in our sources.",
      level: "unverified",
      sources: ["wiki-warli"],
      place: "dahanu",
      tag: "origin",
    },
    {
      id: "wrl-t-1989",
      date: { year: 1989, label: "1989" },
      title: "Paris",
      body: "Jivya Soma Mashe's work is shown in 'Magiciens de la Terre' at the Centre Pompidou.",
      level: "documented",
      sources: ["wiki-mashe"],
      place: "paris",
      tag: "exhibition",
    },
    {
      id: "wrl-t-2011",
      date: { year: 2011, label: "2011" },
      title: "Honour and application",
      body: "Mashe receives the Padma Shri. AYUSH, a Dahanu-based Adivasi organisation, files for a geographical indication.",
      level: "documented",
      sources: ["wiki-mashe", "gi-239"],
      tag: "recognition",
    },
    {
      id: "wrl-t-2014",
      date: { year: 2014, month: 3, day: 31, label: "31 March 2014" },
      title: "Registered as a GI",
      body: "Warli Painting is registered (certificate No. 208) for goods in classes covering paper, furniture and clothing.",
      level: "documented",
      sources: ["gi-239", "dna-warli-gi"],
      tag: "recognition",
    },
    {
      id: "wrl-t-2018",
      date: { year: 2018, month: 5, day: 15, label: "15 May 2018" },
      title: "Jivya Soma Mashe dies",
      body: "The painter dies at home in Dahanu.",
      level: "documented",
      sources: ["wiki-mashe"],
      place: "dahanu",
    },
  ],
  travels: {
    intro: [
      {
        type: "p",
        text:
          "Warli's simple geometry makes it easy to copy, and it is copied everywhere. Reporting suggests that this — images circulating online without context — is part of why a community organisation went to the trouble of registering it.",
        claims: ["wrl-gi-motive"],
      },
    ],
    influences: [
      {
        title: "Exhibited as contemporary art",
        body: "Warli painting entered international contemporary-art exhibitions through Jivya Soma Mashe, beginning with Paris in 1989.",
        level: "documented",
        sources: ["wiki-mashe"],
      },
    ],
    cases: [],
  },
  claims: [
    {
      id: "wrl-community",
      text: "Warli painting is the wall painting of the Warli Adivasi community of the Maharashtra–Gujarat border region.",
      level: "documented",
      sources: ["gi-239", "wiki-warli"],
    },
    {
      id: "wrl-materials",
      text: "Warli painting is traditionally made in white rice paste on walls prepared with earth and cow dung, using circles, triangles and lines.",
      level: "unverified",
      sources: ["wiki-warli"],
      note: "To be reviewed with Warli painters before it is marked documented.",
    },
    {
      id: "wrl-mashe",
      text: "Jivya Soma Mashe exhibited at 'Magiciens de la Terre' (Centre Pompidou, 1989), received the Padma Shri in 2011, and died in Dahanu on 15 May 2018.",
      level: "documented",
      sources: ["wiki-mashe"],
    },
    {
      id: "wrl-gi",
      text: "The Warli Painting GI (certificate dated 31 March 2014) is registered to Adivasi Yuva Seva Sangh (AYUSH), based in Dahanu, for Maharashtra, Gujarat, Dadra & Nagar Haveli and Daman & Diu.",
      level: "documented",
      sources: ["gi-239", "dna-warli-gi"],
      note: "Filing date displays as 06-07-2011 in the registry; other sources give 7 June 2011.",
    },
    {
      id: "wrl-gi-motive",
      text: "AYUSH is reported to have pursued the GI after its use of Warli images online was challenged, with members paying for the process themselves.",
      level: "community",
      sources: ["tbi-warli-ayush", "sabrang-warli"],
    },
  ],
  keepAlive: {
    organizations: ["ayush", "pompidou"],
    resources: [
      {
        title: "GI Registry record No. 239",
        url: "https://search.ipindia.gov.in/GIRPublicSearch/Application/Details/239",
        note: "The Warli Painting registration, held by an Adivasi organisation.",
        source: "gi-239",
      },
    ],
    collaborationNotes: [
      "Name the Warli community, not just 'tribal art'.",
      "Commission Warli painters rather than reproducing the style.",
      "Contact the GI proprietor before using 'Warli' commercially.",
    ],
  },
  related: [
    { slug: "madhubani-painting", reason: "Another wall painting tradition carried onto paper, with painters who became nationally known." },
    { slug: "kolhapuri-chappal", reason: "Also from Maharashtra; another tradition whose name is protected by its makers' organisations." },
  ],
  editorial: {
    lastReviewed: "2026-11-17",
    reviewedBy: "Culture Passport editorial desk (seed research)",
    notes: "Editorial draft. Only GI, exhibition and award facts are documented; meaning, materials and process await community review.",
    openQuestions: ["Ritual meanings and motif names, from Warli painters.", "Who may paint, and on what occasions.", "Documented cases of uncredited commercial use."],
  },
};
