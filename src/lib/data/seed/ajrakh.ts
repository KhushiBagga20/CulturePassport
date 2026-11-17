import type { Tradition } from "../../types.ts";

export const ajrakh: Tradition = {
  id: "trad-ajrakh",
  slug: "ajrakh",
  passportNo: "005",
  status: "published",
  maturity: "editorial-draft",
  name: "Ajrakh",
  displayTitle: "Ajrakh · Ajrak",
  tagline: "Indigo and madder, printed on both sides of a border.",
  nativeNames: [
    { text: "અજરખ", script: "Gujarati", lang: "Gujarati / Kutchi" },
    { text: "اجرڪ", script: "Arabic (Sindhi)", lang: "Sindhi" },
  ],
  alternateNames: ["Ajrak", "Ajarakh", "Kutch Ajrakh"],
  category: "textile",
  techniques: ["Hand block printing", "Resist printing", "Natural dyeing"],
  regionLabel: "Kutch & Barmer, India · Sindh, Pakistan",
  countries: ["IN", "PK"],
  collection: "IN",
  places: [
    { place: "sindh", role: "shared", note: "Sindh, Pakistan" },
    { place: "kutch", role: "gi-area", note: "Kutch, Gujarat" },
    { place: "ajrakhpur", role: "production" },
    { place: "dhamadka", role: "historic-centre" },
    { place: "barmer", role: "shared", note: "Rajasthan" },
  ],
  communities: [{ community: "khatri", role: "Dyers and block-printers" }],
  summary:
    "A resist-printed, naturally dyed cloth shared by Sindh in Pakistan and Kutch and Barmer in India, carried across the region by Khatri printing families.",
  intro:
    "Ajrakh is printed, washed, dyed, printed again — in indigo, madder red, black and white, in repeating stars and lattices. It is worn in Sindh, printed in Kutch and Barmer, and claimed by many origin stories at once. This passport is an editorial draft: it records what is documented and marks the rest.",
  accent: "indigo",
  motif: "ajrakh",
  hero: "ajrak-sindh",
  gallery: ["ajrak-sindh", "ajrak-print-4", "ajrak-print-1"],
  periods: ["Indus (claimed)", "16th-century migration (cited)", "2001 earthquake", "2024 GI"],
  origins: [
    {
      type: "p",
      text:
        "Ajrakh is shared. It is made and worn in Sindh, in Pakistan, and printed in Kutch in Gujarat and in Barmer in Rajasthan. The geographical indication registered in India in 2024 covers Kutch Ajrakh only; it says nothing about ajrak from Sindh.",
      claims: ["ajk-shared", "ajk-gi"],
    },
    {
      type: "p",
      text:
        "It is associated with Khatri dyer-printer families. Many Kutch families trace their roots to Sindh, though accounts disagree on when they moved — the 16th century is cited most often.",
      claims: ["ajk-khatri", "ajk-migration"],
    },
    {
      type: "note",
      title: "Similarity is not ancestry",
      text:
        "Ajrakh is often called '5,000 years old', linking it to the trefoil-patterned robe of the Mohenjo-daro 'priest-king' sculpture. That link rests on visual similarity alone. No textile evidence connects the two, and this archive does not present resemblance as proof of descent.",
      claims: ["ajk-indus"],
    },
    {
      type: "p",
      text:
        "Even the name is contested: printers explain it as 'aaj rakh' — keep it today — while others connect it to the Arabic azraq, blue.",
      claims: ["ajk-name"],
    },
  ],
  significance: [
    {
      type: "p",
      text:
        "In Sindh, ajrak is described as a marker of identity, worn and given as a gift. This draft has not yet sourced that from Sindhi cultural institutions, so it is marked for verification.",
      claims: ["ajk-sindh"],
    },
  ],
  makers: {
    intro: [
      {
        type: "p",
        text:
          "After the 2001 Kutch earthquake, many printing families moved from Dhamadka to a new settlement near Bhuj — Ajrakhpur — which now holds the registered proprietor of the GI.",
        claims: ["ajk-2001"],
      },
      {
        type: "p",
        text:
          "An oral-history interview with master printer Dr Ismail Mohammad Khatri, recorded for the University of Warwick, is the best first-person account we can point to. We link to it rather than paraphrase him.",
      },
    ],
    materials: [
      { name: "Indigo", detail: "The blue; traditionally natural indigo.", level: "unverified", sources: ["lhi-ajrakh", "khamir-ajrakh"] },
      { name: "Madder / alizarin", detail: "The red, fixed with mordants.", level: "unverified", sources: ["lhi-ajrakh", "khamir-ajrakh"] },
      { name: "Iron", detail: "Used for black.", level: "unverified", sources: ["lhi-ajrakh"] },
      { name: "Carved wooden blocks", detail: "Matching blocks register the pattern on each side.", level: "unverified", sources: ["khamir-ajrakh"] },
    ],
    process: [
      { title: "Prepare the cloth", detail: "Cotton is washed and treated before printing.", level: "unverified", sources: ["khamir-ajrakh"] },
      { title: "Print the resist", detail: "Resist pastes protect areas that will stay white.", level: "unverified", sources: ["khamir-ajrakh", "lhi-ajrakh"] },
      { title: "Dye, wash, repeat", detail: "Indigo and madder dyeing alternate with printing across many stages.", level: "unverified", sources: ["khamir-ajrakh", "lhi-ajrakh"] },
    ],
    practitioners: [
      { name: "Dr Ismail Mohammad Khatri", note: "Master printer, Ajrakhpur. Oral-history interview recorded by the University of Warwick.", sources: ["warwick-khatri"] },
    ],
    voicesNote: "Editorial draft. Process steps are summarised from secondary sources and await review by printers in Ajrakhpur and Sindh.",
  },
  timeline: [
    {
      id: "ajk-t-indus",
      date: { year: -2500, approx: true, label: "c. 2500 BCE (claimed)" },
      title: "A resemblance, not a record",
      body: "The trefoil robe on Mohenjo-daro's 'priest-king' is often cited as ajrakh's ancestor. Visual similarity is the only evidence offered.",
      level: "disputed",
      sources: ["gs-ajrakh-5000"],
      place: "mohenjo-daro",
      tag: "origin",
    },
    {
      id: "ajk-t-migration",
      date: { year: 1550, approx: true, label: "16th century (most often cited)" },
      title: "From Sindh to Kutch",
      body: "Khatri families are said to have moved from Sindh to Kutch, settling in places such as Dhamadka. Accounts of when and why differ.",
      level: "disputed",
      sources: ["lhi-ajrakh", "warwick-khatri"],
      place: "dhamadka",
      tag: "migration",
    },
    {
      id: "ajk-t-2001",
      date: { year: 2001, month: 1, day: 26, label: "26 January 2001" },
      title: "The earthquake and Ajrakhpur",
      body: "The Kutch earthquake — and water problems in Dhamadka — push many printing families to a new settlement, Ajrakhpur, near Bhuj.",
      level: "documented",
      sources: ["wire-ajrakh", "lhi-ajrakh"],
      place: "ajrakhpur",
      tag: "disruption",
    },
    {
      id: "ajk-t-2023",
      date: { year: 2023, month: 1, day: 31, label: "31 January 2023" },
      title: "A GI application from Ajrakhpur",
      body: "Ajarakhpur Hastkala Vikas Sangathan applies to register 'Kutch Ajrakh Print of Gujarat'.",
      level: "documented",
      sources: ["gi-1050"],
      tag: "recognition",
    },
    {
      id: "ajk-t-2024",
      date: { year: 2024, month: 4, day: 22, label: "April 2024" },
      title: "Kutch Ajrakh registered",
      body: "The certificate is handed to artisans; coverage frames it as recognition of a centuries-old craft.",
      level: "documented",
      sources: ["gi-1050", "ot-ajrakh-gi"],
      tag: "recognition",
    },
  ],
  travels: {
    intro: [
      {
        type: "p",
        text:
          "Ajrakh's patterns now appear in fashion far from Kutch and Sindh, both hand-printed and digitally imitated. Reporting from Kutch describes how rising demand is changing the craft's economics.",
        claims: ["ajk-demand"],
      },
    ],
    influences: [
      {
        title: "Demand and imitation",
        body: "Growing demand has changed the dynamics of the tradition behind the art, according to reporting from Bhuj.",
        level: "interpretation",
        sources: ["wire-ajrakh"],
      },
    ],
    cases: [],
  },
  claims: [
    {
      id: "ajk-shared",
      text: "Ajrakh is a resist-printed, naturally dyed textile shared by Sindh (Pakistan) and Kutch and Barmer (India).",
      level: "documented",
      sources: ["lhi-ajrakh", "khamir-ajrakh", "gi-1050"],
    },
    {
      id: "ajk-khatri",
      text: "Ajrakh is associated with Khatri dyer-printer families, many of whom trace their origins to Sindh.",
      level: "community",
      sources: ["warwick-khatri", "lhi-ajrakh"],
    },
    {
      id: "ajk-migration",
      text: "Khatri families moved from Sindh to Kutch, most often dated to the 16th century.",
      level: "disputed",
      sources: ["lhi-ajrakh"],
      note: "Accounts differ on the date and on the reasons for the move.",
    },
    {
      id: "ajk-name",
      text: "The name is explained as 'aaj rakh' ('keep it today') or linked to the Arabic azraq ('blue').",
      level: "disputed",
      sources: ["lhi-ajrakh"],
      note: "Both are folk or popular etymologies; neither is established.",
    },
    {
      id: "ajk-indus",
      text: "Ajrakh descends from the textile depicted on Mohenjo-daro's 'priest-king' sculpture.",
      level: "disputed",
      sources: ["gs-ajrakh-5000"],
      note: "A popular claim based on visual similarity. Culture Passport does not treat resemblance as evidence of historical continuity.",
    },
    {
      id: "ajk-2001",
      text: "After the 2001 Kutch earthquake, many printing families moved from Dhamadka to Ajrakhpur, near Bhuj.",
      level: "documented",
      sources: ["wire-ajrakh", "lhi-ajrakh"],
      note: "Sources also cite rising iron content in Dhamadka's water.",
    },
    {
      id: "ajk-gi",
      text: "'Kutch Ajrakh Print of Gujarat' was registered as a GI on an application by Ajarakhpur Hastkala Vikas Sangathan filed on 31 January 2023, with the certificate issued in April 2024.",
      level: "documented",
      sources: ["gi-1050", "ot-ajrakh-gi"],
    },
    {
      id: "ajk-sindh",
      text: "In Sindh, ajrak is worn and gifted as a marker of Sindhi identity.",
      level: "unverified",
      sources: ["lhi-ajrakh"],
      note: "To be sourced from Sindhi cultural institutions.",
    },
    {
      id: "ajk-demand",
      text: "Rising demand has changed the dynamics of the craft in Kutch.",
      level: "interpretation",
      sources: ["wire-ajrakh"],
    },
  ],
  keepAlive: {
    organizations: ["ahvs", "khamir"],
    resources: [
      {
        title: "Oral history: Dr Ismail Mohammad Khatri",
        url: "https://warwick.ac.uk/fac/arts/history/ghcc/eac/oralhistoryproject/resources/drismailkhatri",
        note: "A master printer's own account, recorded by the University of Warwick.",
        source: "warwick-khatri",
      },
      {
        title: "Khamir — Art of Ajrakh",
        url: "https://exhibitions-khamir.org/ajrakh/art-of-ajrakh",
        note: "A Kutch craft organisation's exhibition on the making of ajrakh.",
        source: "khamir-ajrakh",
      },
    ],
    collaborationNotes: [
      "Say where it was printed — Kutch, Barmer or Sindh — and by whom.",
      "Digital prints of ajrakh patterns are not ajrakh; label them as inspired by it.",
      "The Kutch GI does not cover Sindhi ajrak; credit both traditions.",
    ],
  },
  related: [
    { slug: "phulkari", reason: "Another textile tradition shared across the India–Pakistan border." },
    { slug: "al-sadu", reason: "Another textile whose geometry carries community identity — across the Arabian Sea." },
  ],
  editorial: {
    lastReviewed: "2026-11-17",
    reviewedBy: "Culture Passport editorial desk (seed research)",
    notes: "Editorial draft. GI and relocation facts are documented; process, meaning and early history await practitioner review on both sides of the border.",
    openQuestions: ["Process steps, from printers.", "Sindhi institutions' account of ajrak.", "Documented cases of uncredited commercial use."],
  },
};
