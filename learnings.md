# Submittal Tracker — learnings.md
*Bug fixes, API quirks, user preferences logged here as we build.*

---

## User Preferences
- Premium, dark UI — no basic/unstyled components ever.
- Use high-contrast hierarchy for submittal lists (Bold headers, functional colors for actions).
- "Next Action" is the most important scanning field — use Full Cyan (`var(--accent)`) to distinguish it from the static Description titles.
- This project is completely separate from Submittal Architect — no shared components.

## Bug Fixes
- Fixed "Next Action" blending into the description by boosting description weight/size and color-coding the action.
