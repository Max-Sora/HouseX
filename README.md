# HouseX Pre-Check

> For a small builder or nonprofit putting a new duplex or triplex on a lot in Irvine. Upload the plan set and get back every missing document and rule conflict, each with its source, before the city sees it.

**Team:** HouseX
**Members:** _TODO: names_
**Lane:** 2 Clear it
**Built at:** Claude Impact Lab: UCI × SoCal Affordable Housing, November 7, 2026

## The real user

A small builder or nonprofit project manager submitting a new duplex or triplex in Irvine. Each Orange County city has its own submittal checklist, zoning standards and forms, and state housing law overrides some of them. A package missing one document comes back as incomplete, and every correction round adds weeks while loan interest, taxes and insurance keep running.

**Before:** the applicant pieces the package together from several city pages and PDFs, submits it, and learns what was missing from the completeness review and the plan-check comments.
**After:** the applicant uploads the PDF and gets a correction list in 1 to 2 minutes: missing documents, rule conflicts, values the plans don't state, and what only a licensed plan checker can decide. A city permit tech can run the same check on an incoming package.

## What we built

1. **Read.** Claude reads the plan set and reports only what is printed: units, height, stories, setbacks, lot area, parking, occupancy, construction type, sprinkler system, the sheet index, which required documents are included and which code items are shown. Each value comes with the sheet and the text it was read from. Anything not printed stays empty.
2. **Check.** A plain TypeScript rule engine compares those values with Irvine's rules. Claude never decides pass or fail.
   - Completeness against Irvine's New Residential submittal checklist
   - Zoning standards by residential district (2.2 to 2.5)
   - Allowable height, stories and area per story by construction type (Type I-A to V-B) and sprinkler system, from 2025 CBC Tables 504.3, 504.4 and 506.2
   - Unit separation, exterior wall and sprinkler rules for a duplex (CRC, R-3) or a triplex (CBC, R-2)
   - Irvine's local amendments, 2025 Energy Code and CALGreen items
   - Outdated code editions and statute numbers printed on the plans
3. **Report.** A PASS, FAIL or INCOMPLETE stamp with counts, then the findings grouped as missing documents, corrections, not stated, needs a plan checker and passed. Each finding links to its source.
4. **Requirements.** Before uploading anything, the page lists everything Irvine requires for the chosen project type, with sources.

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
