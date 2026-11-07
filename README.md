# HouseX Pre-Check

> For a small builder or nonprofit putting a duplex or triplex on a vacant lot in Irvine: upload the plan set, and get back every missing document and rule conflict, each with its source, before the city sees it.

**Team:** HouseX
**Members:** _TODO: names_
**Lane:** 2 Clear it
**Built at:** Claude Impact Lab: UCI × SoCal Affordable Housing, November 7, 2026

## The real user

A small builder or nonprofit project manager submitting a new duplex or triplex in Irvine. Every Orange County city has its own submittal checklist, zoning standards and forms, and state housing law overrides some of them. An application that is missing one document is sent back as incomplete, and each correction round adds weeks, while loan interest, taxes and insurance keep running.

**Before:** the applicant assembles the package from several city pages and PDFs, submits it, and waits for the city's completeness review and plan-check comments to learn what was missing or wrong.
**After:** the applicant uploads the PDF to HouseX and gets a correction list in about a minute: missing documents, rule conflicts, values the plans don't state, and the items only a licensed plan checker can decide. The city's plan checker can run the same check on an incoming package.

## What we built

1. **Read:** Claude reads the plan set PDF and reports only what it states: project data (units, height, setbacks, lot area, parking, occupancy), the sheet index, which required documents are included, and which code items are shown. Every value carries the sheet and quoted text it came from; anything not printed is `null`.
2. **Check:** a plain TypeScript rule engine (no AI) compares those values with Irvine's rules in [`web/data/irvine-rules.json`](web/data/irvine-rules.json). Every rule carries its source URL and a VERIFIED or UNVERIFIED label.
3. **Report:** PASS, FAIL or INCOMPLETE, grouped into missing documents, corrections needed, not stated or not checked, needs a human plan checker, and passed.

**Demo video:** _TODO_
**Live demo:** _TODO_

## How Claude is used

- **Building it:** we used Claude Code to research Irvine's public requirements, write the rule file and build the app.
- **Inside the tool:** Claude (`claude-opus-5-5`) reads the PDF and fills a fixed JSON schema (structured outputs). It never decides pass or fail; the rule engine does. A person checks every finding against the linked source, and structural and MEP (mechanical, electrical, plumbing) design are always left to a licensed plan checker.

## Try it

Requires Node.js 20 or newer and an Anthropic API key.

```bash
cd web
npm install
echo "ANTHROPIC_API_KEY=your-key-here" > .env.local
npm run dev
```

Open http://localhost:3000 and upload a plan set PDF. Sample public plan sheets go in [`samples/`](samples/).

## Sources and assumptions

See [`research/IRVINE-SOURCES.md`](research/IRVINE-SOURCES.md) for every URL read and its status. Rules that could not be confirmed are stored as `null` and reported as "not checked" rather than guessed.

| Item                                    | Source or assumption                                                                                                                                                                  | Date checked |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| Irvine submittal, zoning and code rules | [`web/data/irvine-rules.json`](web/data/irvine-rules.json), each with a source URL                                                                                                    | 2026-11-07   |
| Sample plan sheets                      | City of Merced public pre-approved duplex and triplex cover sheets ([page](https://www.cityofmerced.gov/business-and-development/building-permits/pre-approved-duplex-triplex-plans)) | 2026-11-07   |

## What is real and what is mocked

| Part                    | Status                                                                     |
| ----------------------- | -------------------------------------------------------------------------- |
| PDF reading with Claude | working                                                                    |
| Rule engine and report  | working                                                                    |
| Irvine rules            | partly working: covers the rules we could confirm today, labelled per item |
| Other cities            | not built: adding a city means adding one rule file                        |

## Where it gets things wrong

- It only checks what a plan set states in text. It does not measure scaled drawings.
- Irvine has many planning-area specific standards; the district list covers only what we confirmed.
- It does not review structural, mechanical, electrical or plumbing design.

## Next steps

Confirm the rule file with an Irvine permit technician, add the remaining OC cities as rule files, and let city staff mark findings right or wrong so the rules improve.

## Data and privacy

This project uses only public or provided data. It contains no personal information about real tenants, buyers or residents. It does not file applications or contact any city or person. Not legal advice.

## License

MIT, see [LICENSE](LICENSE).
