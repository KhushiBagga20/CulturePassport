import type { Tradition } from "../../types.ts";

export const phulkari: Tradition = {
  id: "trad-phulkari",
  slug: "phulkari",
  passportNo: "003",
  status: "published",
  maturity: "starter",
  name: "Phulkari",
  displayTitle: "Phulkari",
  tagline: "Flower work, stitched from the back.",
  nativeNames: [
    { text: "ਫੁਲਕਾਰੀ", script: "Gurmukhi", lang: "Punjabi" },
    { text: "پھلکاری", script: "Shahmukhi", lang: "Punjabi" },
  ],
  alternateNames: ["Bagh (fully covered phulkari)", "Phulkari embroidery"],
  category: "embroidery",
  techniques: ["Darning stitch", "Silk floss (pat) on khaddar"],
  regionLabel: "Punjab — India & Pakistan",
  countries: ["IN", "PK"],
  collection: "IN",
  places: [
    { place: "patiala", role: "shared", note: "Punjab, India" },
    { place: "amritsar", role: "shared", note: "Punjab, India" },
    { place: "lahore", role: "shared", note: "Punjab, Pakistan" },
    { place: "haryana", role: "gi-area" },
    { place: "rajasthan-north", role: "gi-area" },
  ],
  communities: [{ community: "punjabi-women", role: "Embroiderers" }],
  summary:
    "Embroidery of undivided Punjab — silk floss darned into hand-woven cotton from the reverse — made by women for weddings and family life, on both sides of a border drawn in 1947.",
  intro:
    "Phulkari means flower work. It was made by women in Punjab, a region that since 1947 has been divided between India and Pakistan. Untwisted silk floss is darned into hand-woven cotton from the back of the cloth, so the pattern appears on the front: sometimes scattered flowers, sometimes — in a bagh, a 'garden' — the whole cloth covered.",
  accent: "mustard",
  motif: "phulkari",
  hero: "phulkari-osterley",
  gallery: ["phulkari-osterley", "phulkari-patiala-1900", "phulkari-shawl"],
  periods: ["Undated origins", "c. 1900", "1947 Partition", "2010 GI", "2017 Philadelphia"],
  origins: [
    {
      type: "p",
      text:
        "Phulkari belongs to Punjab — a region now divided between India and Pakistan. It was made on both sides of today's border, which is why this passport is filed under India but listed under Pakistan too.",
      claims: ["phk-region"],
    },
    {
      type: "p",
      text:
        "How old is it? Sources disagree, and we have not found reliable dating for its beginnings. What is well documented is how it was made and used by the late 19th and early 20th centuries.",
      claims: ["phk-dating"],
    },
    { type: "figure", media: "phulkari-patiala-1900" },
    {
      type: "p",
      text:
        "Partition in 1947 divided Punjab and scattered the households, neighbours and merchants — sellers of hand-woven khaddar and silk floss — on whom the embroidery depended.",
      claims: ["phk-partition"],
    },
  ],
  significance: [
    {
      type: "p",
      text:
        "Phulkari and bagh were made for family and ceremony, above all weddings. Some pieces were embroidered for a bride and carried with her into a new household.",
      claims: ["phk-ceremony"],
    },
  ],
  makers: {
    intro: [
      {
        type: "p",
        text:
          "Phulkari is women's work, made at home and often together. Its technique turns the cloth into a counting grid: stitches are darned on the reverse, following the weave of the khaddar, so the pattern is built thread by thread.",
        claims: ["phk-technique"],
      },
    ],
    materials: [
      { name: "Pat", detail: "Untwisted silk floss, traditionally golden, white, crimson and other bright colours.", level: "documented", sources: ["dch-phulkari"] },
      { name: "Khaddar", detail: "Hand-spun, hand-woven cotton cloth, often dyed earth-red or brown.", level: "documented", sources: ["dch-phulkari"] },
    ],
    process: [
      { title: "Count the weave", detail: "The design follows the threads of the khaddar rather than a drawn outline.", level: "unverified", sources: ["dch-phulkari"] },
      { title: "Darn from the back", detail: "Long and short darning stitches are worked on the reverse so the pattern shows on the front.", level: "documented", sources: ["dch-phulkari"] },
      { title: "Fill the garden", detail: "In a bagh, darning covers almost the whole ground of the cloth.", level: "documented", sources: ["dch-phulkari"] },
    ],
    practitioners: [],
    voicesNote:
      "We have not yet recorded embroiderers' own accounts. Museum catalogues describe many historic phulkari as made by anonymous women — a gap this passport will not fill by inventing names.",
  },
  timeline: [
    {
      id: "phk-t-undated",
      date: { year: 1800, approx: true, label: "Before 1900 (undated)" },
      title: "Origins we cannot yet date",
      body: "Claims about phulkari's age vary widely. We have not found a reliable source for when it began.",
      level: "unverified",
      sources: ["dch-phulkari"],
      tag: "origin",
    },
    {
      id: "phk-t-1900",
      date: { year: 1900, approx: true, label: "c. 1900" },
      title: "A portrait in phulkari",
      body: "A photograph from Patiala shows a woman draped in phulkari — an archival glimpse of how it was worn.",
      level: "documented",
      sources: ["commons-patiala-1900"],
      place: "patiala",
      tag: "craft",
      media: "phulkari-patiala-1900",
    },
    {
      id: "phk-t-1947",
      date: { year: 1947, label: "1947" },
      title: "Punjab divided",
      body: "Partition separates the region and disrupts the networks that sustained the embroidery.",
      level: "interpretation",
      sources: ["scroll-phulkari-partition", "pma-phulkari-2017"],
      tag: "disruption",
    },
    {
      id: "phk-t-2005",
      date: { year: 2005, month: 3, day: 14, label: "14 March 2005" },
      title: "A GI application",
      body: "Punjab Small Industries & Export Corporation applies to register Phulkari as a geographical indication for Punjab, Haryana and Rajasthan.",
      level: "documented",
      sources: ["gi-27"],
      tag: "recognition",
    },
    {
      id: "phk-t-2010",
      date: { year: 2010, month: 10, day: 22, label: "22 October 2010" },
      title: "Registered",
      body: "The registry issues certificate No. 145. Many secondary sources date this to 2011.",
      level: "documented",
      sources: ["gi-27"],
      tag: "recognition",
    },
    {
      id: "phk-t-2017",
      date: { year: 2017, month: 3, day: 12, label: "12 March – 9 July 2017" },
      title: "Philadelphia",
      body:
        "The Philadelphia Museum of Art opens what was described as the first major US exhibition of phulkari, including its losses at Partition and its use in contemporary fashion.",
      level: "documented",
      sources: ["pma-phulkari-2017"],
      place: "philadelphia",
      tag: "exhibition",
    },
  ],
  travels: {
    intro: [
      {
        type: "p",
        text:
          "Phulkari has travelled into museums and into fashion, often at the same time. Its story is also one of a border: an embroidery that belongs to a region now split between two countries.",
      },
    ],
    influences: [
      {
        title: "Museum and runway, side by side",
        body: "The 2017 Philadelphia exhibition placed historic phulkari beside contemporary garments that use the embroidery.",
        level: "documented",
        sources: ["pma-phulkari-2017"],
      },
      {
        title: "A protected name with low awareness",
        body: "Reporting found that few producers in Punjab and Haryana were aware of, or benefiting from, the GI.",
        level: "documented",
        sources: ["tribune-gi-benefits"],
      },
    ],
    cases: [],
  },
  claims: [
    {
      id: "phk-region",
      text: "Phulkari is an embroidery tradition of Punjab, a region now divided between India and Pakistan.",
      level: "documented",
      sources: ["pma-phulkari-2017", "dch-phulkari"],
    },
    {
      id: "phk-dating",
      text: "The date of phulkari's origin is not established.",
      level: "unverified",
      sources: ["dch-phulkari"],
      note: "Secondary sources variously cite medieval or 15th-century origins; we found no reliable evidence for either.",
    },
    {
      id: "phk-technique",
      text: "Phulkari is worked in untwisted silk floss (pat) on hand-woven cotton (khaddar), mainly in darning stitch from the reverse of the cloth.",
      level: "documented",
      sources: ["dch-phulkari", "pma-phulkari-2017", "scroll-phulkari-partition"],
    },
    {
      id: "phk-ceremony",
      text: "Phulkari and bagh were made for family and ceremonial use, especially weddings.",
      level: "documented",
      sources: ["dch-phulkari", "pma-phulkari-2017"],
    },
    {
      id: "phk-partition",
      text: "The 1947 Partition disrupted the communities and trade networks that sustained phulkari.",
      level: "interpretation",
      sources: ["scroll-phulkari-partition", "pma-phulkari-2017"],
    },
    {
      id: "phk-gi",
      text: "Phulkari was registered as a GI for Punjab, Haryana and Rajasthan (certificate dated 22 October 2010) on an application by the Punjab Small Industries & Export Corporation.",
      level: "documented",
      sources: ["gi-27"],
      note: "Many secondary sources give 2011.",
    },
  ],
  keepAlive: {
    organizations: ["psiec", "pma", "vam"],
    resources: [
      {
        title: "Development Commissioner (Handicrafts) — Phulkari",
        url: "https://handicrafts.gov.in/crafts/All_Crafts/Craft_Categories/Textile/Embroidery/Phulkari/Phulkariwebpage.html",
        note: "Government craft profile with technique and terminology.",
        source: "dch-phulkari",
      },
    ],
    collaborationNotes: [
      "Say 'Punjab', not only 'India' — the tradition is shared with Pakistan.",
      "Hand-embroidered and machine-printed phulkari are different products; label them honestly.",
      "Credit embroiderers by name where they wish to be named.",
    ],
  },
  related: [
    { slug: "ajrakh", reason: "Another textile tradition shared across the India–Pakistan border." },
    { slug: "madhubani-painting", reason: "Another women's art made for weddings, and another region divided by a modern border." },
    { slug: "kolhapuri-chappal", reason: "Another tradition that met global fashion — and the question of credit." },
  ],
  editorial: {
    lastReviewed: "2026-11-17",
    reviewedBy: "Culture Passport editorial desk (seed research)",
    notes: "Starter passport: technique, GI and museum history are sourced; pre-1900 history is deliberately left undated.",
    openQuestions: ["Reliable dating for early phulkari.", "Exact Rajasthan coverage of the GI.", "Practitioners' accounts from both Punjabs."],
  },
};
