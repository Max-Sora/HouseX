"""Builds samples/fictional-duplex-passing.html, a made-up duplex plan set written to meet every rule HouseX checks,
for demoing a PASS. Render to PDF with headless Chrome (see the command at the bottom of this file).
Everything in it is fictional: project, parcel, people, firms, case and report numbers. Forms are stand-ins, not city forms."""
from pathlib import Path

BANNER = "FICTIONAL SAMPLE FOR SOFTWARE TESTING ONLY · NOT A REAL PROJECT, PARCEL, PERSON OR FIRM · NOT FOR CONSTRUCTION"

P = dict(
    address="200 Sample Way (fictional address), Irvine, CA",
    tract="Tract 00000 (fictional), Lot 7",
    zoning="2.3 Medium Density Residential",
    case="Master Plan MP-0000-FICT (fictional), approved",
    lot=7500, footprint=2600, coverage="34.7%", units=2, stories=2, height="28'-0\"",
    unit_area=1650, garage=440, parking="4 spaces (2-car enclosed garage per unit)",
    front="20'-0\"", side="6'-0\"", rear="15'-0\"",
    pv="4.2 kWdc",
)

CODES = [
    "2025 California Building Code (CBC), Title 24 Part 2",
    "2025 California Residential Code (CRC), Title 24 Part 2.5",
    "2025 California Electrical Code (CEC), Title 24 Part 3",
    "2025 California Mechanical Code (CMC), Title 24 Part 4",
    "2025 California Plumbing Code (CPC), Title 24 Part 5",
    "2025 California Energy Code, Title 24 Part 6",
    "2025 California Fire Code (CFC), Title 24 Part 9",
    "2025 California Green Building Standards Code (CALGreen), Title 24 Part 11",
    "City of Irvine Municipal Code, including local amendments",
]

SHEETS = [
    ("T-1", "Title Sheet 1 of 2: project data, code analysis, sheet index"),
    ("T-2", "Title Sheet 2 of 2: general notes, stormwater, WUI block"),
    ("A1.0", "Site Plan"),
    ("A2.0", "Floor Plans"),
    ("A3.0", "Exterior Elevations and Roof Plan"),
    ("A4.0", "Building Sections and Unit Separation Details"),
    ("S1.0", "Foundation Plan, Framing Plan and Shear Walls"),
    ("S-CALC", "Structural Calculations (cover and summary)"),
    ("C-1", "Precise Grading and Drainage Plan, Erosion and Sediment Control"),
    ("L-1", "Landscape and Irrigation Plan (MWELO)"),
    ("E1.0", "Electrical Plan: underground service, EV-ready, PV"),
    ("EN-1", "Title 24 Part 6 Energy Compliance (CF1R summary)"),
    ("G-1", "CALGreen Mandatory Measures Checklist"),
    ("FS-1", "Fire Sprinkler System: NFPA 13D (deferred submittal to OCFA)"),
]

DOCS = [
    "E-Submittal Checklist and Questionnaire (New Residential)",
    "Electronic/Digital Signature Disclosure",
    "Building Permit Application (Form 65-59)",
    "Building Data Sheet (Form 66-58)",
    "Construction and Demolition Waste Assessment (Form 66-122A) and Waste Management Plan",
    "OCFA Plan Submittal Criteria form",
    "OCFA Fire Master Plan (PR145), approved",
    "Developer Deposit Case Set Up",
    "Area Tabulations",
    "Address Sequence Sheet",
    "Transportation Corridor Agencies Residential Fee Determination (Form 66-92)",
    "School Facilities Fee Determination (Form 42-97)",
    "Soils / Geotechnical Report (summary)",
    "Water Quality Management Plan (WQMP) (summary)",
    "Master Plan approval and Conditions of Approval",
    "IRWD water and sewer will-serve letter",
]


def table(rows):
    return "<table>" + "".join(f"<tr><td>{a}</td><td>{b}</td></tr>" for a, b in rows) + "</table>"


def sheet(no, title, body):
    return f"""<section class="sheet"><div class="banner">{BANNER}</div><div class="main">{body}</div>
<div class="tb"><b>FICTIONAL DESIGN STUDIO</b><span>Not a real firm</span><h3>PROJECT</h3><span>New Duplex<br>{P['address']}</span>
<h3>SHEET</h3><span>{title}</span><h3>DATE</h3><span>11/07/2026</span><div class="no">{no}</div></div></section>"""


def form(title, rows, note=""):
    return f"""<section class="form"><div class="banner">{BANNER}</div><p class="stand">Stand-in for testing; not an official City of Irvine form.</p>
<h1>{title}</h1>{table(rows)}{f'<p>{note}</p>' if note else ''}<p class="sig">Prepared by: A. Sample (fictional) · Signed 11/07/2026</p></section>"""


site_svg = """<svg viewBox="0 0 600 400" class="dwg">
<rect x="60" y="40" width="440" height="320" class="pl"/><text x="62" y="34">PROPERTY LINE (TYP.) · LOT 75'-0" x 100'-0" = 7,500 SF</text>
<rect x="140" y="110" width="280" height="186" class="bldg"/><text x="150" y="230">UNIT A</text><text x="300" y="230">UNIT B</text><text x="170" y="285" class="s">NEW DUPLEX · FOOTPRINT 2,600 SF</text>
<line x1="280" y1="110" x2="280" y2="296" class="sep"/><text x="284" y="130" class="s">1-HR UNIT SEPARATION</text>
<text x="230" y="80">FRONT SETBACK 20'-0"</text><text x="230" y="330">REAR SETBACK 15'-0"</text>
<text x="66" y="200">SIDE 6'-0"</text><text x="428" y="200">SIDE 6'-0"</text>
<text x="70" y="390">STREET · UNDERGROUND ELECTRICAL SERVICE IN CONDUIT TO METERS</text>
<g transform="translate(540,60)"><line x1="0" y1="30" x2="0" y2="0" class="pl"/><text x="-5" y="-4">N</text></g>
<text x="440" y="120" class="s">SOLAR ZONE (S) 250 SF</text></svg>"""

plan_svg = """<svg viewBox="0 0 600 300" class="dwg">
<rect x="40" y="30" width="520" height="240" class="bldg"/><line x1="300" y1="30" x2="300" y2="270" class="sep"/>
<text x="110" y="150">UNIT A · 1,650 SF LIVING</text><text x="370" y="150">UNIT B · 1,650 SF LIVING</text>
<text x="80" y="250" class="s">2-CAR GARAGE 440 SF</text><text x="340" y="250" class="s">2-CAR GARAGE 440 SF</text>
<text x="230" y="22" class="s">1-HR RATED UNIT SEPARATION WALL, UL DESIGN U305, CONTINUOUS FOUNDATION TO ROOF SHEATHING</text></svg>"""

pages = []
pages.append(sheet("T-1", "Title Sheet 1 of 2", f"""
<h1>NEW DUPLEX · 2 DWELLING UNITS · CITY OF IRVINE</h1><p>{P['address']} · {P['tract']}</p>
<div class="cols"><div><h2>PROJECT DATA</h2>{table([
    ("Jurisdiction", "City of Irvine"), ("Zoning", P['zoning']), ("Planning action", P['case']),
    ("Scope of work", "New two-story duplex (two-family dwelling), 2 dwelling units, on a vacant lot. No lot split."),
    ("Lot area", f"{P['lot']:,} SF"), ("Building footprint", f"{P['footprint']:,} SF"), ("Lot coverage", P['coverage']),
    ("Floor area", f"Unit A {P['unit_area']:,} SF + Unit B {P['unit_area']:,} SF living; garages {P['garage']} SF each"),
    ("Dwelling units", "2"), ("Stories / height", f"2 stories above grade plane / {P['height']} to top of ridge"),
    ("Governing code / occupancy", "2025 CRC (two-family dwelling, R101.2) · Occupancy R-3 / U (garages)"),
    ("Construction type", "V-B"), ("Fire sprinklers", "YES · NFPA 13D throughout (CRC R309), deferred submittal, separate OCFA approval"),
    ("Parking", P['parking']), ("Setbacks", f"Front {P['front']} / Side {P['side']} / Rear {P['rear']}"),
    ("Solar PV", f"{P['pv']} (2025 Energy Code 150.1(c)14); solar zone shown on A1.0"),
    ("Fire Hazard Severity Zone", "Not in a Fire Hazard Severity Zone (WUI block on T-2: not applicable)"),
    ("Soils engineer", "Sample Geotechnical (fictional) · Report # SG-0000-FICT, dated 09/15/2026"),
])}</div><div><h2>APPLICABLE CODES</h2><ul>{''.join(f'<li>{c}</li>' for c in CODES)}</ul>
<h2>SHEET INDEX</h2>{table(SHEETS)}
<h2>DEFERRED SUBMITTALS</h2><ul><li>Fire sprinkler system, NFPA 13D: separate approval through OCFA (FS-1)</li><li>Photovoltaic system {P['pv']}</li></ul></div></div>"""))

pages.append(sheet("T-2", "Title Sheet 2 of 2", """
<h1>GENERAL NOTES</h1><ol>
<li>FIRE SPRINKLERS: An NFPA 13D automatic sprinkler system shall be provided throughout per CRC R309 and Irvine local amendment (sprinklers required in all new residential buildings), under separate approval through OCFA. Sprinkler note per Irvine Municipal Code 5-9-401 acknowledged; no height or area increase is used.</li>
<li>ROOFING: All new roof coverings shall be Class A (UL 790 / ASTM E108), Irvine local amendment.</li>
<li>ELECTRICAL: All outside wiring on private property shall be underground (Irvine local amendment); see A1.0 and E1.0.</li>
<li>UNIT SEPARATION: Dwelling units are separated by a 1-hour fire-resistance-rated wall assembly (UL Design U305) per CRC R302.3, continuous from foundation to underside of roof sheathing; see A4.0.</li>
<li>EXTERIOR WALLS: No exterior wall or projection is within 5 ft of a property line; no fire-rated exterior walls or opening limits apply (CRC Table R302.1(2), sprinklered).</li>
<li>EV CHARGING: Each unit's private garage has an EV-ready 208/240 V 40 A circuit and receptacle per CALGreen 4.106.4.1; see E1.0 and G-1.</li>
<li>CONSTRUCTION WASTE: 75% of concrete/asphalt and 65% of other construction and demolition debris shall be diverted; Form 66-122A and approved online Waste Management Plan attached; bond posted before permit.</li>
<li>ENERGY: Project complies with the 2025 California Energy Code; CF1R summary on EN-1; PV 4.2 kWdc.</li>
</ol>
<h2>STORM WATER POLLUTION PREVENTION NOTES</h2><p>City of Irvine standard storm water pollution prevention notes apply (Irvine Municipal Code Title 6, Division 8, Chapter 3). Erosion and sediment control BMPs: perimeter fiber rolls, stabilized construction entrance, covered stockpiles, inlet protection; see C-1.</p>
<h2>FIRE HAZARD SEVERITY ZONE / WILDLAND-URBAN INTERFACE (CWUIC Ch. 5, CBC Chapter 7A, CRC R327)</h2><p>☐ Applies &nbsp; ☒ <b>Not applicable</b>: the site is not within a mapped Fire Hazard Severity Zone.</p>"""))

pages.append(sheet("A1.0", "Site Plan", f"<h1>SITE PLAN</h1>{site_svg}<p>Lot coverage {P['coverage']} (2,600 / 7,500 SF). Density: 2 units on 0.172 ac = 11.6 du/ac. Parking: {P['parking']}. Solar zone orientation from true north shown. Underground electrical service. Distances from all walls and eaves to property lines are 6'-0\" or more.</p>"))
pages.append(sheet("A2.0", "Floor Plans", f"<h1>FLOOR PLANS</h1>{plan_svg}<p>Two dwelling units side by side, each with private entrance and separate means of egress. Unit separation wall: 1-hour, UL Design U305.</p>"))
pages.append(sheet("A3.0", "Exterior Elevations and Roof Plan", "<h1>EXTERIOR ELEVATIONS AND ROOF PLAN</h1><p>Overall height 28'-0\" to top of ridge, 2 stories above grade plane. Roof: Class A concrete tile (UL 790). Roof slope 4:12. PV array 4.2 kWdc within the solar zone.</p>"))
pages.append(sheet("A4.0", "Building Sections and Unit Separation Details", "<h1>BUILDING SECTIONS AND DETAILS</h1><p>Section A: unit separation wall, 1-hour rated (UL Design U305, 2x4 studs, 5/8\" Type X gypsum board both sides), continuous from foundation to roof sheathing. Floor/ceiling assemblies are within each unit (no floor between units).</p>"))
pages.append(sheet("S1.0", "Foundation Plan, Framing Plan and Shear Walls", "<h1>STRUCTURAL: FOUNDATION PLAN, FRAMING PLAN, SHEAR WALL SCHEDULE</h1><p>Conventional slab-on-grade foundation per soils report SG-0000-FICT. Wood framing; shear walls per schedule. Allowable soil pressure per the soils report.</p>"))
pages.append(sheet("S-CALC", "Structural Calculations", "<h1>STRUCTURAL CALCULATIONS (COVER AND SUMMARY)</h1><p>Lateral and gravity calculations prepared to the 2025 CBC/CRC by Sample Structural (fictional). 42 pages on file; summary: wind 95 mph Exposure C, Seismic Design Category D.</p>"))
pages.append(sheet("C-1", "Precise Grading and Drainage Plan", "<h1>PRECISE GRADING AND DRAINAGE PLAN · EROSION AND SEDIMENT CONTROL</h1><p>Finish grade (FG) and finish surface (FS) elevations; 2% minimum slope away from foundation; drainage to street. Erosion and sediment control BMPs and storm water pollution prevention per T-2.</p>"))
pages.append(sheet("L-1", "Landscape and Irrigation Plan", "<h1>LANDSCAPE AND IRRIGATION PLAN</h1><p>Planting plan and drip irrigation complying with the Model Water Efficient Landscape Ordinance (MWELO).</p>"))
pages.append(sheet("E1.0", "Electrical Plan", "<h1>ELECTRICAL PLAN</h1><p>Underground service lateral in conduit to two meters. EV-ready 208/240 V 40 A branch circuit and receptacle in each garage (CALGreen 4.106.4.1). PV system 4.2 kWdc with rapid shutdown.</p>"))
pages.append(sheet("EN-1", "Title 24 Energy Compliance", "<h1>TITLE 24 PART 6 ENERGY COMPLIANCE · CF1R SUMMARY</h1><p>Performance compliance (CBECC-Res) for 2025 California Energy Code. Climate Zone 8. Required PV 4.2 kWdc. Compliance margin: passes (fictional summary).</p>"))
pages.append(sheet("G-1", "CALGreen Mandatory Measures", "<h1>CALGREEN (TITLE 24 PART 11) MANDATORY MEASURES CHECKLIST</h1><p>Residential mandatory measures checklist completed: 4.106.4.1 EV ready (each private garage), 4.408 construction waste reduction (65% minimum), water-conserving fixtures, indoor air quality measures.</p>"))
pages.append(sheet("FS-1", "Fire Sprinkler System", "<h1>FIRE SPRINKLER SYSTEM · NFPA 13D</h1><p>NFPA 13D automatic fire sprinkler system throughout both dwelling units per CRC R309. Deferred submittal: shop drawings under separate approval through OCFA.</p>"))

forms = [
    ("E-Submittal Checklist and Questionnaire (New Residential Models/Production/Condominiums/Apartments)",
     [("Project", "New duplex, 2 units"), ("Model homes", "No"), ("PV panels", f"Yes, {P['pv']} (kW(DC))"),
      ("Documents included", "All documents listed in this package")]),
    ("Electronic/Digital Signature Disclosure", [("Statement", "Applicant agrees electronic signatures on City submittals are legally binding."), ("Signed", "A. Sample (fictional)")]),
    ("Building Permit Application (Form 65-59)", [("Project address", P['address']), ("Tract/lot", P['tract']),
      ("Description of work", "New two-story duplex, 2 dwelling units"), ("Occupancy group(s)", "R-3 / U"), ("Construction type", "V-B"),
      ("Number of stories", "2"), ("Sprinklers", "Yes, NFPA 13D"), ("Total number of dwelling units", "2"), ("Total dwelling sq ft", "3,300 SF")]),
    ("Building Data Sheet (Form 66-58)", [("No. of buildings", "1"), ("No. of dwelling units per bldg", "2"), ("Stories", "2"),
      ("Occupancy group(s)", "R-3 / U"), ("Construction type", "V-B"), ("Sprinklers", "Yes, NFPA 13D"), ("PV panels / PV system wattage", f"Yes / {P['pv']}")]),
    ("Construction and Demolition Waste Assessment 2.0 (Form 66-122A) and Waste Management Plan", [("Project type", "New residential, subject to recycling/diversion (IMC 6-7-900)"),
      ("Diversion", "75% concrete/asphalt, 65% other debris"), ("Online Waste Management Plan", "Submitted and approved (fictional confirmation WMP-0000)"), ("Bond", "To be posted at permit issuance")]),
    ("Orange County Fire Authority (OCFA) Plan Submittal Criteria", [("Q1 New building", "Yes, Fire Master Plan PR145 attached"), ("Q5 3+ units and 3+ stories", "No"), ("Fire sprinklers", "NFPA 13D, deferred submittal"), ("Fire Hazard Severity Zone", "No")]),
    ("OCFA Fire Master Plan (PR145), approved", [("Service request", "PR145 (fictional SR-0000)"), ("Status", "Approved"), ("Fire access and water supply", "Approved as shown")]),
    ("Developer Deposit Case Set Up", [("Applicant", "Sample Builders (fictional)"), ("Deposit account", "Set up (fictional account DD-0000)")]),
    ("Area Tabulations", [("Unit A living", "1,650 SQ. FT."), ("Unit B living", "1,650 SQ. FT."), ("Garages", "440 SQ. FT. each"), ("Footprint", "2,600 SQ. FT."), ("Lot", "7,500 SQ. FT.")]),
    ("Address Sequence Sheet", [("Unit A", "200 Sample Way, Unit A (fictional)"), ("Unit B", "200 Sample Way, Unit B (fictional)")]),
    ("Transportation Corridor Agencies Residential Fee Determination (Form 66-92)", [("Lot", "7"), ("Separate lot", "No"), ("Detached", "No"), ("Unit sq ft ≥ 1,500 (garage excluded)", "Yes, both units"), ("Determination", "Per TCA Interpretation 92-1")]),
    ("School Facilities Fee Determination (Form 42-97)", [("School district", "IUSD"), ("Assessable area", "3,300 SQ. FT."), ("Certificate of Compliance", "To be obtained before permit issuance")]),
    ("Soils / Geotechnical Report (summary)", [("Soils engineer", "Sample Geotechnical (fictional)"), ("Report #", "SG-0000-FICT, 09/15/2026"), ("Recommendations", "Slab-on-grade foundation; recommendations incorporated on S1.0")]),
    ("Water Quality Management Plan (WQMP) (summary)", [("Project", "New duplex"), ("LID BMPs", "Downspouts to landscaped areas, permeable driveway strips"), ("Status", "Prepared (fictional WQMP-0000)")]),
    ("Master Plan approval and Conditions of Approval", [("Planning action / case no.", P['case']), ("Zoning", P['zoning']), ("Conditions of approval", "Incorporated on T-2")]),
    ("Irvine Ranch Water District (IRWD) will-serve letter", [("Service", "Water and sewer available"), ("Status", "Will serve (fictional letter IRWD-0000)")]),
]
pages += [form(t, rows) for t, rows in forms]

CSS = """
@page { size: 17in 11in; margin: 0.4in; }
@page formpage { size: 8.5in 11in; margin: 0.6in; }
body { font-family: Arial, Helvetica, sans-serif; color: #000; margin: 0; }
.banner { border: 2px dashed #000; padding: 6px; font-weight: bold; text-align: center; font-size: 11px; margin-bottom: 10px; }
.sheet { box-sizing: border-box; height: 10in; border: 3px solid #000; display: grid; grid-template-columns: 1fr 2.8in; grid-template-rows: auto 1fr; page-break-after: always; break-inside: avoid; font-size: 12px; }
.sheet .main { padding: 14px; overflow: hidden; }
.sheet .banner { grid-column: 1 / -1; margin: 10px 10px 0; }
.tb { border-left: 3px solid #000; padding: 12px; display: flex; flex-direction: column; gap: 6px; grid-row: 2; grid-column: 2; }
.sheet .main { grid-row: 2; grid-column: 1; }
.tb h3 { font-size: 12px; border-bottom: 2px solid #000; margin: 6px 0 0; }
.no { font-size: 36px; font-weight: bold; text-align: center; border: 2px solid #000; padding: 6px; margin-top: auto; }
h1 { font-size: 20px; margin: 0 0 6px; } h2 { font-size: 13px; border-bottom: 2px solid #000; margin: 10px 0 4px; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
table { border-collapse: collapse; width: 100%; } td { border: 1px solid #000; padding: 3px 6px; vertical-align: top; }
td:first-child { width: 34%; }
ul, ol { margin: 4px 0 4px 18px; padding: 0; } li { margin: 2px 0; }
.dwg { width: 100%; max-height: 6.4in; } .dwg rect, .dwg line { fill: none; stroke: #000; stroke-width: 2; }
.dwg .pl { stroke-dasharray: 10 6; } .dwg .sep { stroke-width: 5; } .dwg text { font-size: 12px; } .dwg .s { font-size: 10px; }
.form { page: formpage; page-break-after: always; font-size: 13px; }
.form h1 { font-size: 18px; margin: 10px 0; } .stand { font-style: italic; } .sig { margin-top: 16px; }
"""

html = f"<!doctype html><html><head><meta charset='utf-8'><title>FICTIONAL SAMPLE - Passing duplex plan set</title><style>{CSS}</style></head><body>{''.join(pages)}</body></html>"
out = Path(__file__).with_name("fictional-duplex-passing.html")
out.write_text(html)
print(out, len(pages), "pages")
# Render:
# "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=new --no-pdf-header-footer \
#   --print-to-pdf=samples/fictional-duplex-passing.pdf "file://$PWD/samples/fictional-duplex-passing.html"
