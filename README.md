# HouseX

> Upload an Irvine plan set. Get every missing document and code correction, with sources, before the city sees it.

**Team HouseX:** Meela A · Josh Lin · Mathew Yam · Joy Zhang · Max Tang
**Lane:** 2 Clear it · Claude Impact Lab: UCI × SoCal Affordable Housing, Nov 7, 2026
**Demo video (28 s):** [`video/housex-demo.mp4`](video/housex-demo.mp4)

## The problem

One missing document sends a permit back as incomplete. Each correction round adds weeks of loan interest and consulting fees.

**User:** builders, developers, architects and nonprofits (like Habitat for Humanity) filing new homes in Irvine.
**Before:** learn what's missing from the city, round after round.
**After:** upload the PDF, fix everything in 1 to 2 minutes, then submit.

## How it works

1. **Address** → zoning, parcel, flood and fire zones from public maps
2. **Claude reads the plans** → only what's printed, with the sheet as evidence
3. **Rule engine decides** (not the AI) → Irvine checklist, zoning, 2025 building code, state ADU/SB 9 law
4. **Report** → PASS / FAIL, every finding linked to its source
5. **Fix my plan** → Claude drafts the corrections for an architect to stamp

Also: savings and loan-interest calculator, live progress, Q&A chat.

## Try it in 1 minute

```bash
cd web && npm install
echo "ANTHROPIC_API_KEY=your-key" > .env.local
npm run dev
```

Open http://localhost:3000 and click a sample:

| Sample                                        | Result                                     |
| --------------------------------------------- | ------------------------------------------ |
| Real duplex (Fresno County public plans)      | FAIL: 23 missing documents, 12 corrections |
| Passing duplex (fictional)                    | PASS                                       |
| Failing duplex (same set, 6 planted problems) | FAIL: exactly those 6                      |

## Sources and assumptions

- **Sources:** City of Irvine submittal packet, Housing Element and GIS maps; Gov Code 65913.3 (AB 2234); HCD ADU Handbook 2026; 2025 CBC/CRC; FEMA and CAL FIRE maps. Full list: [`research/IRVINE-SOURCES.md`](research/IRVINE-SOURCES.md).
- **Assumptions (labeled and editable in the app):** 10% construction loan rate; about $1,770/home/month waiting cost (from the brief's example); AB 2234 maximum review times; 1 consultant hour saved per plan page at $200/hr.

## Honest limits

- Reads text on the plans; does not measure drawings.
- Some Irvine limits (front/side setbacks, coverage, parking) vary by planning area, so they go to a human plan checker.
- No structural, mechanical, electrical or plumbing review. Not legal advice.
- Irvine only for now; each new city is one rule file.

## How Claude is used

Claude Code built the app and researched the rules. Inside the tool, Claude (`claude-opus-5-5`) reads the PDF into a fixed schema and drafts fixes; a plain rule engine makes every decision.

---

Public data only, no personal information; nothing is filed with any city. Design pass guided by [unslop](https://github.com/heydamir/unslop) by Damir Sokolovsky (CC BY 4.0). License: MIT.
