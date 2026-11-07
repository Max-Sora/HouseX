# HouseX Pre-Check

> For a small builder or nonprofit building new homes in Irvine. Upload the plan set and get back every missing document and rule conflict, each with its source, before the city sees it, plus a drafted fix for each one.

**Team:** HouseX
**Members:** _TODO: names_
**Lane:** 2 Clear it
**Built at:** Claude Impact Lab: UCI × SoCal Affordable Housing, November 7, 2026

## The real user

A small builder or nonprofit project manager submitting a new home, ADU, duplex, triplex or mixed-use building in Irvine. Each Orange County city has its own submittal checklist, zoning standards and forms, and state housing law overrides some of them. A package missing one document comes back as incomplete, and every correction round adds weeks while loan interest, taxes and insurance keep running.

**Before:** the applicant pieces the package together from several city pages and PDFs, submits it, and learns what was missing from the completeness review and the plan-check comments.
**After:** the applicant uploads the PDF and gets a correction list in 1 to 2 minutes: missing documents, rule conflicts, values the plans don't state, and what only a licensed plan checker can decide. A city permit tech can run the same check on an incoming package.

## What we built

1. **Locate.** The project address is looked up in public map data: City of Irvine geocoder, zoning map and parcel map, FEMA flood zones and CAL FIRE fire hazard zones. This gives the zoning district, parcel number, lot area, flood zone and fire zone. Owner names are never requested.
2. **Read.** Claude reads the plan set and reports only what is printed: units, height, stories, setbacks, lot area, parking, occupancy, construction type, sprinkler system, the sheet index, which required documents are included and which code items are shown. Each value comes with the sheet and the text it was read from. Anything not printed stays empty.
3. **Check.** A plain TypeScript rule engine compares those values with Irvine's rules. Claude never decides pass or fail.
   - Completeness against Irvine's New Residential submittal checklist
   - Project types: single-family home, SFR + ADU, duplex, triplex, and mixed use (residential + commercial)
   - Zoning standards by district (residential 2.1 to 2.5, mixed-use 3.1, 4.7, 5.0, 5.1, 8.1), using the district from the city map when none is chosen
   - State ADU law (Gov Code 66310 to 66342) and mixed-occupancy separations (CBC 508)
   - Allowable height, stories and area per story by construction type (Type I-A to V-B) and sprinkler system, from 2025 CBC Tables 504.3, 504.4 and 506.2
   - Unit separation, exterior wall and sprinkler rules for a duplex (CRC, R-3) or a triplex (CBC, R-2)
   - Irvine's local amendments, 2025 Energy Code and CALGreen items
   - Outdated code editions and statute numbers printed on the plans
4. **Report.** A PASS, FAIL or INCOMPLETE stamp with counts, then the findings grouped as missing documents, corrections, not stated, needs a plan checker and passed. Each finding links to its source.
   Missing documents can be filtered by type: city forms, fees, plan sheets, reports, fire and outside agencies.
5. **Savings.** An estimate of the weeks and dollars saved by catching these problems before submittal. Every input is shown and editable: the waiting cost per home is derived from the challenge brief's mock example, review times from AB 2234 legal maximums, and the rest are labelled assumptions.
6. **Fix my plan.** Claude drafts a correction package from the findings: updated title-sheet notes and code list, the exact text for each correction, a checklist of missing documents with the city's form links, and a letter to the plan checker. Values the designer must decide stay as [designer to confirm]. Downloads as Markdown for the architect to review and stamp. The savings step then shows the estimate with the package included.
7. **Requirements.** Before uploading anything, the page lists everything Irvine requires for the chosen project type, with sources.
8. **Ask a question.** A chat popup on every page answers questions about permits, the rules and the user's own report. It answers only from HouseX's rule data and the current report, cites sources, and says when it doesn't know.

**Demo video:** _TODO_
**Live demo:** _TODO_

## Try it

Requires Node.js 20 or newer and an Anthropic API key.

```bash
cd web
npm install
echo "ANTHROPIC_API_KEY=your-key-here" > .env.local
npm run dev
```

The app walks the user through five steps, one page each, with a single Continue button at the bottom of every page: `/` Check → `/report` → `/savings` → `/fix` → `/savings-after-fix`. Two standalone pages are linked from the Check page: `/cost-benefit` (the savings calculator, which works with or without a report) and `/requirements`. Results stay available across pages and reloads within the browser tab.

The cost-benefit page is a calculator: enter the amount tied up in construction and the number of pages in the plan set. It estimates interest saved on an interest-only construction loan (amount × rate ÷ 12 × months saved; the 10% default rate is a team assumption) and consultant time saved (pages × hours per page × hourly rate; 1 hour per page is an assumption, $200 an hour the default from a typical $100 to $250 range).

Open http://localhost:3000 and upload a plan set PDF, or use one of the two samples on the page. A check takes 1 to 2 minutes.

- **Real duplex.** Sheets 1 to 7 of Fresno County's free pre-approved Duplex Option #1 ([program page](https://www.fresnocountyca.gov/Departments/Public-Works-and-Planning/divisions-of-public-works-and-planning/community-development-division/Duplex-Plans)). The plans were approved in Fresno County under the 2022 codes, so in Irvine they come back FAIL: 2022 code editions where Irvine now applies the 2025 codes, no Irvine local amendments, and no lot or setback data to check zoning against.
- **Fictional triplex.** A made-up cover sheet ([source](samples/fictional-triplex-cover-sheet.html)) with deliberate errors in height, rear setback, lot coverage, density, parking, sprinklers, occupancy and code editions.

The full Fresno County triplex (sheets 1 to 8) is in [`samples/public/`](samples/public/) too.

## How Claude is used

- **Building it.** Claude Code researched Irvine's public requirements and the 2025 code tables, wrote the rule files and built the app.
- **Inside the tool.** Claude (`claude-opus-5-5`) reads the PDF into a fixed JSON schema using structured outputs. The rule engine makes every decision, and a person checks each finding against its linked source.

## Sources and assumptions

Every rule carries its source URL and a VERIFIED or UNVERIFIED label. A rule we could not confirm is stored empty and reported as "not checked", never guessed. Every URL read is listed in [`research/IRVINE-SOURCES.md`](research/IRVINE-SOURCES.md).

| Item                                                                            | Source                                                                                            | Date checked |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------ |
| Irvine submittal, zoning and local code rules (52 of 68 verified)               | [`web/data/irvine-rules.json`](web/data/irvine-rules.json)                                        | 2026-11-07   |
| Construction type limits and unit separation rules (2025 CBC/CRC, all verified) | [`web/data/construction-types.json`](web/data/construction-types.json)                            | 2026-11-07   |
| Sample plan sets                                                                | County of Fresno pre-approved plans, see [`samples/public/SOURCES.md`](samples/public/SOURCES.md) | 2026-11-07   |

## What is real and what is mocked

| Part                                      | Status                                                                |
| ----------------------------------------- | --------------------------------------------------------------------- |
| PDF reading with Claude                   | working                                                               |
| Rule engine, report and requirements list | working                                                               |
| Irvine rules                              | partly working: covers what we could confirm today, labelled per item |
| Construction type tables                  | working for the 2025 CBC tables, read from one source (UpCodes)       |
| Other cities                              | not built: a new city is one new rule file                            |

## Where it gets things wrong

- It reads what the plans state in text and does not measure scaled drawings.
- Irvine's front and side setbacks vary by sub-district and planning area, so they are reported as not checked.
- It can flag a citation as outdated when the section still exists in the 2025 code under the same number.
- It does not review structural, mechanical, electrical or plumbing design.

## Next steps

Confirm the rule file with an Irvine permit technician, add the other 33 Orange County cities as rule files, and let city staff mark findings right or wrong so the rules improve.

## Data and privacy

This project uses only public or provided data. It contains no personal information about real tenants, buyers or residents. It does not file applications or contact any city or person. Not legal advice.

## Credits

Interface design pass guided by [unslop](https://github.com/heydamir/unslop) by Damir Sokolovsky ([@heydamir](https://x.com/heydamir)), CC BY 4.0.

## License

MIT, see [LICENSE](LICENSE).
