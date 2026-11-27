import type { Tradition } from "../../types.ts";

export const kolhapuri: Tradition = {
  id: "trad-kolhapuri",
  slug: "kolhapuri-chappal",
  passportNo: "001",
  status: "published",
  maturity: "researched",
  name: "Kolhapuri Chappal",
  displayTitle: "The Kolhapuri Chappal",
  tagline: "A craft older than the runway.",
  nativeNames: [
    { text: "कोल्हापुरी चप्पल", script: "Devanagari", lang: "Marathi" },
    { text: "ಕೊಲ್ಹಾಪುರಿ ಚಪ್ಪಲಿ", script: "Kannada", lang: "Kannada" },
  ],
  alternateNames: ["Kolhapuri", "Kolhapuris", "Kolhapuri sandal", "Pie-taan / Paytaan (said to be an early name)"],
  category: "footwear",
  techniques: ["Hand-stitched leather", "Braided leather uppers", "Leather tanning"],
  regionLabel: "Maharashtra & Karnataka, India",
  countries: ["IN"],
  collection: "IN",
  places: [
    { place: "kolhapur", role: "gi-area", note: "Gives the chappal its name" },
    { place: "sangli", role: "gi-area" },
    { place: "satara", role: "gi-area" },
    { place: "solapur", role: "gi-area" },
    { place: "belagavi", role: "gi-area" },
    { place: "dharwad", role: "gi-area" },
    { place: "bagalkot", role: "gi-area" },
    { place: "vijayapura", role: "gi-area" },
  ],
  communities: [{ community: "charmakar", role: "Makers, historically and today" }],
  summary:
    "Flat, open-toed, hand-stitched leather sandals made across eight districts of Maharashtra and Karnataka — and, in June 2025, the subject of one of fashion's most visible attribution debates.",
  intro:
    "Long before it reached a Milan runway, the Kolhapuri chappal was everyday footwear: buffalo-hide leather, hand-stitched without nails, braided across the instep and finished with a loop for the big toe. Its name belongs to a city. Its making belongs to communities of leather-workers on both sides of the Maharashtra–Karnataka border.",
  accent: "terracotta",
  motif: "kolhapuri",
  hero: "bata-chappal-445",
  gallery: ["bata-chappal-445", "kolhapur-shop-1", "kolhapur-shop-3", "bata-chappal-453"],
  periods: ["Medieval (claimed)", "Princely Kolhapur", "20th century", "2009–2019 GI", "2025 runway", "2026 collaboration"],
  origins: [
    {
      type: "p",
      text:
        "The chappal takes its name from Kolhapur, in southern Maharashtra, but it has never belonged to one town. The geographical indication registered for it covers eight districts: Kolhapur, Sangli, Satara and Solapur in Maharashtra, and Belagavi, Dharwad, Bagalkot and Vijayapura in Karnataka.",
      claims: ["kol-gi-area"],
    },
    {
      type: "p",
      text:
        "How old is it? Popular histories place its beginnings in the 12th–13th centuries, before it was called 'Kolhapuri' at all. Other accounts credit a single family with designing it in 1920. We have found no primary evidence for either date, so we show both — and mark them disputed.",
      claims: ["kol-origin-date"],
    },
    {
      type: "p",
      text:
        "Early forms are said to have gone by village names — Kapashi, Paytaan, Kachkadi, Bakkalnali, Pukri. These names survive in oral and journalistic accounts rather than in archives, and we record them as such.",
      claims: ["kol-early-names"],
    },
    {
      type: "p",
      text:
        "The trade is widely said to have flourished under royal patronage in princely Kolhapur. Accounts disagree on which ruler and when; most point to Chhatrapati Shahu Maharaj in the early 20th century, with tanning centres opened under his rule.",
      claims: ["kol-shahu"],
    },
    { type: "figure", media: "kolhapur-shop-1" },
    {
      type: "note",
      title: "On names and ownership",
      text:
        "A geographical indication protects the use of a name — 'Kolhapuri Chappal' — for goods made in the registered area. It records a place-based reputation. It is not a patent, and it does not make anyone the worldwide owner of the open-toed sandal as a form.",
      claims: ["kol-gi-dates", "kol-gi-proprietors"],
    },
  ],
  significance: [
    {
      type: "p",
      text:
        "The chappal is valued for being made to last and made by hand: leather and thread, no nails, a form refined for heat and dust. Its name carries the reputation of a region; its price, at a roadside stall, has often been a few hundred rupees.",
      claims: ["kol-materials", "kol-price-gap"],
    },
    {
      type: "pull",
      text: "The design travelled in seconds. The name, the place and the makers took a week of public argument to catch up.",
      attribution: "Culture Passport editorial",
    },
  ],
  makers: {
    intro: [
      {
        type: "p",
        text:
          "Kolhapuri chappals are predominantly made — then and now — by Charmakar leather-working communities. The craft runs through tanning, cutting, braiding and stitching, often divided between households and workshops.",
        claims: ["kol-makers"],
      },
      {
        type: "p",
        text:
          "The material story is changing. Leather was traditionally vegetable-tanned in and around Kolhapur; reporting in 2025 found that many local tanneries had closed and makers now buy leather from elsewhere, often chemically tanned.",
        claims: ["kol-tanning"],
      },
    ],
    materials: [
      {
        name: "Buffalo hide",
        detail: "The traditional leather. Cow hide has also been used, which is contested.",
        level: "documented",
        sources: ["wiki-kolhapuri"],
      },
      {
        name: "Thread",
        detail: "Uppers and soles are hand-stitched; traditionally no nails are used.",
        level: "documented",
        sources: ["wiki-kolhapuri", "open-prada-kolhapuri"],
      },
      {
        name: "Vegetable tannins",
        detail: "Plant-based tanning was traditional; much leather today comes from tanneries using chemical processes.",
        level: "documented",
        sources: ["open-prada-kolhapuri", "wiki-kolhapuri"],
      },
    ],
    process: [
      { title: "Skiving", detail: "Leather is thinned and evened for each part of the chappal.", level: "unverified", sources: ["wiki-kolhapuri"] },
      { title: "Pattern & cutting", detail: "Soles, straps and the toe loop are cut by hand from templates.", level: "unverified", sources: ["wiki-kolhapuri"] },
      { title: "Layering the sole", detail: "Sole layers and heel are built up and attached to the upper.", level: "unverified", sources: ["wiki-kolhapuri"] },
      { title: "Stitching", detail: "Parts are joined with thread — no nails.", level: "documented", sources: ["wiki-kolhapuri", "open-prada-kolhapuri"] },
      { title: "Braiding & punching", detail: "Strips are braided and punched into the decorative upper.", level: "unverified", sources: ["wiki-kolhapuri"] },
      { title: "Finishing & polish", detail: "Edges are trimmed, surfaces decorated and polished.", level: "unverified", sources: ["wiki-kolhapuri"] },
    ],
    practitioners: [],
    voicesNote:
      "We have not yet recorded interviews with Kolhapuri makers. Rather than paraphrase artisans from press coverage, this space stays empty until makers choose to speak for themselves here.",
  },
  timeline: [
    {
      id: "kol-t-origin",
      date: { year: 1200, approx: true, label: "c. 12th–13th century (claimed)" },
      title: "An origin before the name",
      body:
        "Popular histories place the chappal's beginnings here, before it was called 'Kolhapuri'. A competing account credits a single family with the design in 1920. Neither claim rests on evidence we could verify.",
      level: "disputed",
      sources: ["open-prada-kolhapuri", "wiki-kolhapuri"],
      tag: "origin",
    },
    {
      id: "kol-t-shahu",
      date: { year: 1910, approx: true, label: "Early 20th century (as recounted)" },
      title: "Royal patronage in princely Kolhapur",
      body:
        "Accounts credit the rulers of Kolhapur — most often Chhatrapati Shahu Maharaj — with encouraging the trade and opening tanning centres. Which ruler, and when, needs archival confirmation.",
      level: "interpretation",
      sources: ["open-prada-kolhapuri", "wiki-kolhapuri"],
      place: "kolhapur",
      tag: "patronage",
    },
    {
      id: "kol-t-gi-filed",
      date: { year: 2009, month: 5, day: 4, label: "4 May 2009" },
      title: "A joint GI application",
      body:
        "An application to register 'Kolhapuri Chappal' as a geographical indication is filed (No. 169), covering districts in both Maharashtra and Karnataka. Some secondary sources give 4 April 2009.",
      level: "documented",
      sources: ["gi-169"],
      tag: "recognition",
    },
    {
      id: "kol-t-bata",
      date: { year: 2013, month: 7, label: "July 2013" },
      title: "Behind museum glass in Toronto",
      body:
        "A late-20th-century chappal from Kolhapur is photographed on display at the Bata Shoe Museum — the craft named and placed in a museum, years before the runway.",
      level: "documented",
      sources: ["commons-bata-chappal"],
      place: "bata-museum",
      tag: "exhibition",
      media: "bata-chappal-453",
    },
    {
      id: "kol-t-gi-journal",
      date: { year: 2018, month: 8, day: 9, label: "9 August 2018" },
      title: "Advertised in the GI Journal",
      body: "The application is published in GI Journal No. 109, listing four districts in each state as the area of production.",
      level: "documented",
      sources: ["gi-journal-109", "gi-169"],
      tag: "recognition",
    },
    {
      id: "kol-t-gi-cert",
      date: { year: 2018, month: 12, day: 11, label: "11 December 2018" },
      title: "Registered as a geographical indication",
      body:
        "The registry records certificate No. 329 for Kolhapuri Chappal. News of the registration was widely reported in mid-2019.",
      level: "documented",
      sources: ["gi-169"],
      tag: "recognition",
    },
    {
      id: "kol-t-runway",
      date: { year: 2025, month: 6, label: "June 2025" },
      title: "The Milan runway",
      body:
        "Prada's Men's Spring/Summer 2026 show in Milan features open-toed leather sandals. Show notes call them 'leather sandals' and make no reference to India.",
      level: "documented",
      sources: ["bt-prada-admits", "khaleej-prada-debate"],
      place: "milan",
      tag: "runway",
    },
    {
      id: "kol-t-ack",
      date: { year: 2025, month: 6, day: 27, approx: true, label: "Late June 2025" },
      title: "Acknowledgement after criticism",
      body:
        "After criticism from artisans, designers and Maharashtra's chamber of commerce, Prada acknowledges in a letter that the sandals were inspired by traditional Indian handcrafted footwear.",
      level: "documented",
      sources: ["bt-prada-admits", "tribune-prada-ack", "fu-prada-maccia"],
      tag: "response",
    },
    {
      id: "kol-t-visit",
      date: { year: 2025, month: 7, day: 15, label: "15 July 2025" },
      title: "A visit to the workshops",
      body: "A Prada technical team visits Kolhapur's chappal-making cluster, observes production and meets artisans.",
      level: "documented",
      sources: ["bt-prada-visit", "week-prada-visit"],
      place: "kolhapur",
      tag: "collaboration",
    },
    {
      id: "kol-t-pil",
      date: { year: 2025, month: 7, day: 16, label: "16 July 2025" },
      title: "A court declines to decide",
      body:
        "The Bombay High Court dismisses a public interest litigation against Prada, questioning the petitioners' standing and leaving registered GI proprietors free to pursue remedies. It makes no finding on infringement.",
      level: "documented",
      sources: ["barbench-pil", "scc-pil"],
      place: "mumbai",
      tag: "legal",
    },
    {
      id: "kol-t-mou",
      date: { year: 2025, month: 12, day: 11, approx: true, label: "10–11 December 2025" },
      title: "An agreement with the GI proprietors",
      body:
        "Prada signs a memorandum of understanding in Mumbai with LIDCOM (Maharashtra) and LIDKAR (Karnataka) for a limited-edition sandal collection made in India. Reports differ on whether it was signed on 10 or 11 December.",
      level: "documented",
      sources: ["fu-prada-mou", "week-prada-mou", "outlookbiz-prada-mou"],
      place: "mumbai",
      tag: "collaboration",
    },
    {
      id: "kol-t-launch",
      date: { year: 2026, month: 4, day: 27, label: "27 April 2026" },
      title: "'Made in India x Inspired by Kolhapuri Chappals'",
      body:
        "Prada announces the collection — reported as about 2,000 pairs made by artisans in Maharashtra and Karnataka — with a three-year training programme for 180 artisans.",
      level: "documented",
      sources: ["prada-2026", "wwd-prada-2026", "brut-prada-2026"],
      tag: "collaboration",
    },
  ],
  travels: {
    intro: [
      {
        type: "p",
        text:
          "Inspiration is not the problem. Footwear has always borrowed across borders, and a sandal can be admired in Milan as easily as in Kolhapur. What this chapter documents is narrower: the moment when a recognisable design travelled and its name, place and makers did not.",
      },
    ],
    influences: [
      {
        title: "A museum object abroad",
        body: "A late-20th-century Kolhapur chappal was displayed at the Bata Shoe Museum in Toronto, labelled by place.",
        level: "documented",
        sources: ["commons-bata-chappal"],
      },
      {
        title: "Heritage pride after the runway",
        body: "In the weeks after the Prada debate, Indian brands and sellers leaned on the chappal's heritage in their own marketing.",
        level: "documented",
        sources: ["malaymail-heritage-pride"],
      },
    ],
    cases: [
      {
        id: "case-kolhapuri-prada",
        slug: "prada-2025",
        code: "001-A",
        title: "The runway, Milan, June 2025",
        kind: "acknowledged-inspiration",
        parties: ["Prada", "MACCIA", "LIDCOM", "LIDKAR", "Kolhapuri chappal makers"],
        summary:
          "Open-toed leather sandals in Prada's Men's Spring/Summer 2026 show were widely recognised as Kolhapuri in style, but presented as 'leather sandals'. After public criticism Prada acknowledged the Indian inspiration, visited Kolhapur, signed an agreement with the GI proprietors and, in 2026, released a collection made in India.",
        status: "Inspiration acknowledged (June 2025) · Collaboration launched (2026)",
        events: [
          {
            id: "c1",
            date: { year: 1200, approx: true, label: "Centuries (dates disputed)" },
            title: "A regional craft",
            body: "Hand-stitched leather chappals are made by Charmakar communities across southern Maharashtra and northern Karnataka.",
            level: "documented",
            sources: ["open-prada-kolhapuri"],
            tag: "origin",
          },
          {
            id: "c2",
            date: { year: 2018, month: 12, day: 11, label: "2018–2019" },
            title: "The name is protected",
            body: "'Kolhapuri Chappal' is registered as a geographical indication for eight districts in two states.",
            level: "documented",
            sources: ["gi-169", "gi-journal-109"],
            tag: "recognition",
          },
          {
            id: "c3",
            date: { year: 2025, month: 6, label: "June 2025" },
            title: "Shown as 'leather sandals'",
            body: "The sandals appear on the Milan runway; the show notes make no reference to India.",
            level: "documented",
            sources: ["bt-prada-admits", "khaleej-prada-debate"],
            tag: "runway",
          },
          {
            id: "c4",
            date: { year: 2025, month: 6, label: "June 2025" },
            title: "Public concern",
            body:
              "Artisans, designers and politicians in India object to the missing credit; Maharashtra's chamber of commerce writes to the company.",
            level: "documented",
            sources: ["tribune-prada-ack", "khaleej-prada-debate", "fu-prada-maccia"],
            tag: "response",
          },
          {
            id: "c5",
            date: { year: 2025, month: 6, label: "Late June 2025" },
            title: "Acknowledgement",
            body: "Prada's head of corporate social responsibility replies that the design was inspired by traditional Indian handcrafted footwear.",
            level: "documented",
            sources: ["bt-prada-admits", "tribune-prada-ack"],
            tag: "response",
          },
          {
            id: "c6",
            date: { year: 2026, month: 4, label: "July 2025 – April 2026" },
            title: "From acknowledgement to agreement",
            body:
              "A technical team visits Kolhapur; a court declines a public-interest case on standing; an MoU is signed with LIDCOM and LIDKAR; a made-in-India collection and artisan training programme follow.",
            level: "documented",
            sources: ["bt-prada-visit", "barbench-pil", "fu-prada-mou", "wwd-prada-2026"],
            tag: "collaboration",
          },
        ],
        travelled: [
          "The open-toed, flat leather silhouette",
          "The toe loop and T-strap arrangement",
          "The braided leather band across the foot",
          "The warm, tan leather finish",
        ],
        leftBehind: [
          "The name 'Kolhapuri'",
          "Eight districts across two states",
          "Charmakar makers and their workshops",
          "A registered geographical indication",
          "The difference between a roadside price and a runway price",
        ],
        questions: [
          {
            q: "What design elements travelled?",
            a: "An open-toed, flat leather sandal with a toe loop and braided upper — the features observers in India and abroad immediately read as Kolhapuri.",
            level: "documented",
            sources: ["khaleej-prada-debate", "open-prada-kolhapuri"],
          },
          {
            q: "What was the traditional cultural context?",
            a: "Hand-stitched footwear made predominantly by Charmakar leather-workers in four districts of Maharashtra and four of Karnataka, protected as a geographical indication since 2018–19.",
            level: "documented",
            sources: ["gi-169", "open-prada-kolhapuri"],
          },
          {
            q: "How was the design described commercially?",
            a: "As 'leather sandals'. The show notes did not mention India, Kolhapur or the people who make the form.",
            level: "documented",
            sources: ["bt-prada-admits", "open-prada-kolhapuri"],
          },
          {
            q: "Was cultural origin credited?",
            a: "Not at first. Prada acknowledged the inspiration in a letter only after public criticism, in late June 2025.",
            level: "documented",
            sources: ["bt-prada-admits", "tribune-prada-ack"],
          },
          {
            q: "Were artisan communities involved?",
            a: "Not in the runway design. Afterwards a Prada team visited Kolhapur's workshops (July 2025), and the 2026 collection was reported as made by artisans in Maharashtra and Karnataka under an agreement with the two state corporations.",
            level: "documented",
            sources: ["bt-prada-visit", "fu-prada-mou", "wwd-prada-2026"],
          },
          {
            q: "What changed after public criticism?",
            a: "An acknowledgement, a workshop visit, an MoU with the GI proprietors, a product named for the tradition, and a funded three-year training programme for 180 artisans with NIFT and KILT among the partners. How its benefits reach individual makers is not yet documented.",
            level: "documented",
            sources: ["fu-prada-mou", "wwd-prada-2026", "brut-prada-2026"],
          },
        ],
        legalNote: {
          text:
            "No court has ruled that Prada infringed the geographical indication. The Bombay High Court dismissed a public interest litigation because the petitioners were not the registered proprietors; it left LIDCOM and LIDKAR free to act. A GI protects the use of a name for goods from a registered area — it does not by itself grant worldwide rights over a sandal design.",
          sources: ["barbench-pil", "scc-pil", "gi-169"],
        },
        comparison: {
          traditional: {
            title: "Kolhapur chappal, late 20th century",
            media: "bata-chappal-445",
            points: ["Toe loop", "Braided band", "Flat leather sole", "Hand-stitched, no nails"],
          },
          adaptation: {
            title: "Runway interpretation, June 2025",
            points: ["Open-toed flat sandal", "Leather upper", "Described as 'leather sandals'", "No reference to India in show notes"],
            mediaNote:
              "We have not licensed runway photography, so we will not reproduce it. Editors can attach a properly licensed image from the admin. Until then, see the photo galleries in the linked press coverage.",
          },
        },
        openQuestions: [
          "How are proceeds or training places distributed among makers outside the LIDCOM and LIDKAR networks?",
          "Will future collections credit the tradition by name at the moment of first presentation?",
          "Do makers themselves consider the outcome adequate? We have not yet asked them directly.",
        ],
      },
    ],
  },
  claims: [
    {
      id: "kol-gi-area",
      text:
        "The Kolhapuri Chappal geographical indication covers Kolhapur, Sangli, Satara and Solapur districts in Maharashtra and Belagavi, Dharwad, Bagalkot and Vijayapura (Bijapur) districts in Karnataka.",
      level: "documented",
      sources: ["gi-169", "gi-journal-109", "open-prada-kolhapuri", "wiki-kolhapuri"],
    },
    {
      id: "kol-gi-dates",
      text:
        "The GI application (No. 169) was filed on 4 May 2009; the registry records certificate No. 329 dated 11 December 2018. The registration was widely reported in mid-2019.",
      level: "documented",
      sources: ["gi-169"],
      note: "Some sources give 4 April 2009 as the filing date; several date the grant to June–July 2019, when it was publicised.",
    },
    {
      id: "kol-gi-proprietors",
      text:
        "Court reporting identifies LIDCOM (Maharashtra) and LIDKAR (Karnataka) as the registered proprietors of the GI; the registry's public record names the Central Leather Research Institute as applicant.",
      level: "documented",
      sources: ["barbench-pil", "gi-169", "gi-journal-109", "dh-gi-holders"],
      note: "The two records are not necessarily in conflict (an institution may file for proprietors), but we have not seen the certificate itself.",
    },
    {
      id: "kol-origin-date",
      text: "The chappal's origins are often placed in the 12th–13th centuries; another account attributes its design to the Saudagar family in 1920.",
      level: "disputed",
      sources: ["open-prada-kolhapuri", "wiki-kolhapuri"],
      note: "Neither date is supported by a primary source we could find. Open presents the early date as belief; Wikipedia's 1920 claim is uncited.",
    },
    {
      id: "kol-early-names",
      text: "Early forms are said to have been known as Kapashi, Paytaan, Kachkadi, Bakkalnali and Pukri, after the villages where they were made.",
      level: "community",
      sources: ["open-prada-kolhapuri"],
      note: "Reported as tradition ('is said to'); meanings of the names are not recorded in our sources.",
    },
    {
      id: "kol-shahu",
      text: "Accounts credit the rulers of Kolhapur with encouraging the trade: Wikipedia names Shahu I and his successor Rajaram II and counts 29 tanning centres opened in Shahu's reign; Open Magazine places Shahu Maharaj's patronage in the early 20th century.",
      level: "interpretation",
      sources: ["open-prada-kolhapuri", "wiki-kolhapuri"],
      note: "Wikipedia links this to 'Shahu I' and successors and cites 29 tanning centres from 2019 newspaper features; Open places patronage in the early 20th century. Which ruler, and when, needs archival confirmation.",
    },
    {
      id: "kol-makers",
      text: "Kolhapuri chappals are predominantly made by Charmakar leather-working communities.",
      level: "documented",
      sources: ["open-prada-kolhapuri"],
      note: "Other community names appear in commercial sources but are not yet verified. Community self-identification will be recorded in consultation with makers.",
    },
    {
      id: "kol-materials",
      text: "Kolhapuri chappals are traditionally made from buffalo hide and thread, hand-stitched without nails.",
      level: "documented",
      sources: ["wiki-kolhapuri"],
    },
    {
      id: "kol-tanning",
      text: "Kolhapuri leather was known for local vegetable tanning; by 2025 most tanneries in the city had shut after a crackdown on effluents, and makers relied mainly on tanneries in Tamil Nadu that use chemical processes.",
      level: "documented",
      sources: ["open-prada-kolhapuri", "wiki-kolhapuri"],
      note: "Wikipedia still describes local vegetable tanning; Open's 2025 reporting is more recent.",
    },
    {
      id: "kol-price-gap",
      text: "Press coverage set a pair bargained for about ₹400 at a Delhi market against Prada's sandal at about ₹1 lakh; Prada's 2026 made-in-India edition was reported at about €750 (roughly ₹83,000).",
      level: "documented",
      sources: ["open-prada-kolhapuri", "brut-prada-2026"],
    },
  ],
  keepAlive: {
    organizations: ["lidcom", "lidkar", "maccia", "clri", "bata-shoe-museum"],
    resources: [
      {
        title: "GI Registry record No. 169",
        url: "https://search.ipindia.gov.in/GIRPublicSearch/Application/Details/169",
        note: "The primary public record of the Kolhapuri Chappal geographical indication.",
        source: "gi-169",
      },
      {
        title: "'Prada Wears Kolhapuri' — Open Magazine",
        url: "https://openthemagazine.com/feature/prada-wears-kolhapuri",
        note: "Long-form reporting from Kolhapur's workshops and markets, 2025.",
        source: "open-prada-kolhapuri",
      },
    ],
    collaborationNotes: [
      "Name the tradition — 'Kolhapuri chappal' — wherever the design is shown, from the first presentation.",
      "Only goods made in the eight registered districts can carry the Kolhapuri Chappal name.",
      "Work through the GI proprietors and makers' organisations, and agree on fair payment and credit before production.",
      "Link this passport, or its QR code, beside the product so its story travels with it.",
    ],
  },
  related: [
    { slug: "phulkari", reason: "Another tradition that met fashion — in a museum exhibition that placed phulkari beside designer garments." },
    { slug: "warli-painting", reason: "Also from Maharashtra. Its GI was pursued by an Adivasi organisation after its imagery circulated online without context." },
    { slug: "ajrakh", reason: "A hand process — block, dye, wash, repeat — whose rising demand is changing the craft that makes it." },
  ],
  editorial: {
    lastReviewed: "2026-11-17",
    reviewedBy: "Culture Passport editorial desk (seed research)",
    notes:
      "Flagship passport. Historical claims before 2009 rest on secondary accounts and are labelled accordingly. Case-study facts are drawn from court reporting, registry records and contemporaneous press.",
    openQuestions: [
      "Archival evidence for the chappal's age before the 20th century.",
      "Which Kolhapur ruler(s) supported tanning, and when.",
      "How benefits from the 2025–26 collaboration reach makers.",
      "Community self-identification, to be recorded with makers.",
    ],
  },
  translations: {
    mr: { name: "कोल्हापुरी चप्पल", reviewed: false },
  },
};
