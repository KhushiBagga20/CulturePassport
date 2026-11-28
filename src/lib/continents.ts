/** Continents by ISO 3166-1 alpha-2 code, for grouping countries in lists. */
const LISTS: Record<string, string> = {
  Asia:
    "AF AM AZ BH BD BT BN KH CN CY GE HK IN ID IR IQ IL JP JO KZ KW KG LA LB MO MY MV MN MM NP KP OM PK PS PH QA SA SG KR LK SY TW TJ TH TL TR TM AE UZ VN YE",
  Africa:
    "DZ AO BJ BW BF BI CV CM CF TD KM CG CD CI DJ EG GQ ER SZ ET GA GM GH GN GW KE LS LR LY MG MW ML MR MU YT MA MZ NA NE NG RE RW SH ST SN SC SL SO ZA SS SD TZ TG TN UG EH ZM ZW",
  Europe:
    "AL AD AT BY BE BA BG HR CZ DK EE FO FI FR DE GI GR HU IS IE IT XK LV LI LT LU MT MD MC ME NL MK NO PL PT RO RU SM RS SK SI ES SE CH UA GB VA",
  Americas:
    "AG AR BS BB BZ BO BR CA CL CO CR CU DM DO EC SV GD GT GY HT HN JM MX NI PA PY PE PR KN LC VC SR TT US UY VE",
  Oceania: "AU FJ KI MH FM NR NZ PW PG WS SB TO TV VU",
};
const BY_ISO = new Map(Object.entries(LISTS).flatMap(([name, codes]) => codes.split(" ").map((c) => [c, name] as const)));

export const CONTINENTS = Object.keys(LISTS);
export const continentOf = (iso2: string) => BY_ISO.get(iso2.toUpperCase()) ?? "Elsewhere";
