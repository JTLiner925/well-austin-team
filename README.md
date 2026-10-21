# ICT 9-month group — Team Wiring & Four Fields

A static, tabbed site (Overview · Wiring · Four Fields · Dynamics · People · Rhythms). No build step.

## Files

| Path | What it is |
|---|---|
| `index.html`, `assets/` | The page shell, styles and renderer |
| `data/assessments.json` | The seven assessments. Tallies, coverage matrix and gift grid are computed from this — edit here and the site updates |
| `data/content.json` | The written analysis: Four Fields ownership, risks, rhythms and all seven profiles |
| `data/private/` | Original data with emails and ages. **Not published** (git-ignored) |

## Preview locally

```bash
python3 -m http.server 8765
```

Then open <http://localhost:8765>. Opening `index.html` by double-click won't work; browsers block reading the data files from `file://`.

## Still open

- Field history for Sarah, Travis and Rebecca (shows as "Not yet supplied" on their profiles; set `fieldHistory` in `data/assessments.json`)
- Confirm each person's official Working Genius report (the Competency/Frustration split is read from ranked letter order)
- Confirm Rebecca's "Giving (possibly Faith)"
- Draft the JT / Travis decision-rights page (a starter table is on the Dynamics tab)
