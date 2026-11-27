import type { Tradition } from "../../types.ts";

export const sadu: Tradition = {
  id: "trad-sadu",
  slug: "al-sadu",
  passportNo: "006",
  status: "published",
  maturity: "starter",
  name: "Al Sadu",
  displayTitle: "Al Sadu",
  tagline: "Bands of black, white and red, woven on the ground.",
  nativeNames: [{ text: "السدو", script: "Arabic", lang: "Arabic" }],
  alternateNames: ["Sadu weaving", "Al Sadu, traditional weaving skills in the United Arab Emirates"],
  category: "weaving",
  techniques: ["Drop-spindle spinning", "Floor-loom weaving", "Warp-faced plain weave"],
  regionLabel: "Rural communities, United Arab Emirates",
  countries: ["AE"],
  collection: "AE",
  places: [
    { place: "al-ain", role: "community-home", note: "Rural communities of the UAE" },
    { place: "abu-dhabi", role: "community-home" },
  ],
  communities: [{ community: "bedouin-women-uae", role: "Spinners, dyers and weavers" }],
  summary:
    "A traditional weaving of Bedouin women in the UAE's rural communities — spun on a drop spindle, woven on a floor loom, in narrow geometric bands — inscribed by UNESCO in 2011 and moved to its Representative List in New Delhi in 2025.",
  intro:
    "Al Sadu is the first passport in the UAE collection, and the archive's bridge. Everything here comes from UNESCO's own decisions and from government heritage records, because an introduction should begin on firm ground.",
  accent: "teal",
  motif: "sadu",
  hero: "sadu-majlis",
  gallery: ["sadu-majlis"],
  periods: ["2011 urgent safeguarding", "2020 report", "2025 New Delhi"],
  origins: [
    {
      type: "p",
      text:
        "UNESCO describes Al Sadu as a traditional form of weaving practised by Bedouin women in rural communities of the United Arab Emirates. Men shear the sheep, camels and goats; women clean and prepare the wool, spin it, dye it and weave it.",
      claims: ["sadu-what", "sadu-fibres"],
    },
    {
      type: "p",
      text:
        "Its colours are black, white, brown, beige and red, in narrow bands of geometric design. Woven pieces furnish homes and tents and dress camels and horses.",
      claims: ["sadu-colours", "sadu-uses"],
    },
  ],
  significance: [
    {
      type: "p",
      text:
        "Weaving was also a social occasion. Gatherings of weavers are the traditional means of passing the skill on: girls learn by watching, then by sorting wool, before they are trusted with the loom.",
      claims: ["sadu-transmission"],
    },
  ],
  makers: {
    intro: [
      {
        type: "p",
        text:
          "In 2011 UNESCO judged the skill to be at risk — its know-how kept by a dwindling number of older women. Fourteen years of safeguarding later, it was moved to the Representative List and the UAE's programme was selected as a good practice for others to learn from.",
        claims: ["sadu-2011", "sadu-2025"],
      },
    ],
    materials: [
      { name: "Sheep, camel and goat hair", detail: "Shorn by men, cleaned and prepared by women.", level: "documented", sources: ["unesco-20com-sadu"] },
      { name: "Plant dyes", detail: "Colours extracted from plants; access to natural dyes has been a safeguarding concern.", level: "documented", sources: ["unesco-20com-sadu", "unesco-15com-sadu"] },
    ],
    process: [
      { title: "Shear", detail: "Men shear sheep, camels and goats.", level: "documented", sources: ["unesco-20com-sadu"] },
      { title: "Clean & prepare", detail: "Women clean and prepare the wool.", level: "documented", sources: ["unesco-20com-sadu"] },
      { title: "Spin", detail: "Yarn is spun on a drop spindle.", level: "documented", sources: ["unesco-20com-sadu"] },
      { title: "Dye", detail: "Yarn is dyed with colours extracted from plants.", level: "documented", sources: ["unesco-20com-sadu"] },
      { title: "Weave", detail: "Weaving on a floor loom in a warp-faced plain weave, in narrow geometric bands.", level: "documented", sources: ["unesco-20com-sadu"] },
    ],
    practitioners: [],
    voicesNote: "No weavers' accounts are published here yet. The UAE collection will add them only with consent and verification.",
  },
  timeline: [
    {
      id: "sadu-t-2011",
      date: { year: 2011, label: "2011" },
      title: "Urgent safeguarding",
      body: "UNESCO inscribes Al Sadu on the List of Intangible Cultural Heritage in Need of Urgent Safeguarding.",
      level: "documented",
      sources: ["unesco-20com-sadu"],
      tag: "recognition",
    },
    {
      id: "sadu-t-2020",
      date: { year: 2020, month: 12, label: "December 2020" },
      title: "A report, and advice",
      body: "UNESCO's committee invites the UAE to teach Al Sadu in schools, secure raw materials and natural dyeing, and watch for over-commercialisation.",
      level: "documented",
      sources: ["unesco-15com-sadu"],
      tag: "recognition",
    },
    {
      id: "sadu-t-2022",
      date: { year: 2022, label: "2022" },
      title: "A sister craft inscribed",
      body: "Al Talli, the UAE's traditional braided embroidery, joins UNESCO's Representative List.",
      level: "documented",
      sources: ["unesco-talli"],
      tag: "recognition",
    },
    {
      id: "sadu-t-2025",
      date: { year: 2025, month: 12, label: "December 2025" },
      title: "New Delhi",
      body: "Meeting in New Delhi, UNESCO's committee transfers Al Sadu to the Representative List and selects the UAE's safeguarding programme for the Register of Good Safeguarding Practices.",
      level: "documented",
      sources: ["unesco-20com-sadu", "national-ahalla-2025"],
      place: "new-delhi",
      tag: "recognition",
    },
  ],
  travels: {
    intro: [
      {
        type: "p",
        text:
          "UNESCO itself has warned about over-commercialisation: Sadu patterns are now printed on goods far from the loom. As the UAE collection grows, this chapter will document how those patterns travel.",
        claims: ["sadu-2020"],
      },
    ],
    influences: [
      {
        title: "India and the UAE, in one decision",
        body: "The decision moving Al Sadu to the Representative List was taken at UNESCO's 20th committee session, held in New Delhi in December 2025.",
        level: "documented",
        sources: ["unesco-20com-sadu"],
      },
    ],
    cases: [],
  },
  claims: [
    { id: "sadu-what", text: "Al Sadu is a traditional weaving practised by Bedouin women in rural communities of the UAE.", level: "documented", sources: ["unesco-20com-sadu"] },
    {
      id: "sadu-fibres",
      text: "Men shear sheep, camels and goats; women clean and prepare the wool, spin it on a drop spindle, dye it and weave it on a floor loom in a warp-faced plain weave.",
      level: "documented",
      sources: ["unesco-20com-sadu"],
    },
    { id: "sadu-colours", text: "Traditional colours are black, white, brown, beige and red, in narrow bands of geometric design.", level: "documented", sources: ["unesco-20com-sadu"] },
    { id: "sadu-uses", text: "Al Sadu is used for soft furnishings and for decorative accessories for camels and horses.", level: "documented", sources: ["unesco-20com-sadu"] },
    {
      id: "sadu-transmission",
      text: "Girls learn by watching and by tasks such as sorting wool; gatherings of weavers are the traditional means of transmission.",
      level: "documented",
      sources: ["unesco-20com-sadu"],
    },
    { id: "sadu-2011", text: "UNESCO inscribed Al Sadu on the Urgent Safeguarding List in 2011.", level: "documented", sources: ["unesco-20com-sadu", "unesco-15com-sadu"] },
    {
      id: "sadu-2020",
      text: "In 2020 UNESCO invited the UAE to integrate Al Sadu into school teaching, address access to raw materials and natural dyeing, and heed the risk of over-commercialisation.",
      level: "documented",
      sources: ["unesco-15com-sadu"],
    },
    {
      id: "sadu-2025",
      text: "In December 2025, in New Delhi, UNESCO transferred Al Sadu to the Representative List and selected the UAE's safeguarding programme for the Register of Good Safeguarding Practices.",
      level: "documented",
      sources: ["unesco-20com-sadu", "national-ahalla-2025"],
      note: "Some Abu Dhabi heritage pages still describe the earlier listing.",
    },
  ],
  keepAlive: {
    organizations: [],
    resources: [
      {
        title: "UNESCO decision 20.COM 7.C.1",
        url: "https://ich.unesco.org/en/decisions/20.COM/7.C.1",
        note: "The full text of the 2025 decision, with the element's description.",
        source: "unesco-20com-sadu",
      },
    ],
    collaborationNotes: [
      "Credit 'Al Sadu, UAE' — and the weavers — when using Sadu patterns.",
      "Printed Sadu-style goods are not woven Sadu; say so.",
      "UNESCO has flagged over-commercialisation as a risk; partner with safeguarding programmes rather than around them.",
    ],
  },
  related: [
    { slug: "ajrakh", reason: "Another textile whose geometry carries identity — across the Arabian Sea in Sindh and Kutch." },
    { slug: "phulkari", reason: "Another women's textile skill passed on by watching, together." },
  ],
  editorial: {
    lastReviewed: "2026-11-17",
    reviewedBy: "Culture Passport editorial desk (seed research)",
    notes: "Introductory passport for the UAE bridge collection, built only from UNESCO and government records.",
    openQuestions: ["Weavers' own accounts, with consent.", "Pattern names and their meanings.", "Records for sadu traditions in neighbouring countries."],
  },
};
