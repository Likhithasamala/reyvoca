# Backup — the ember-ramp palette (2026-11-19)

The state of the palette before it was returned to orange / black / cream.

What it contained, and why it was replaced:

- `.ember-ground` in `app/globals.css` — a dark-orange ramp
  (#160e09 -> #3d1505 -> #5e2006 -> #822b06) used as the full ground of
  How it works, Industries and Languages.
- `.footer-ground` — the same idea run to #bf3e06.

The mid stops of that ramp are dark desaturated orange, which reads as
maroon however carefully the hue is held at 17-20deg. Dark orange cannot be
a large fill; it is a signal colour. That is the rule this backup broke.

To restore, copy these files back over their counterparts:

    cp -r parked/ember-palette-backup/app/globals.css app/
    cp -r parked/ember-palette-backup/components/marketing/*.tsx components/marketing/
    cp -r parked/ember-palette-backup/components/layout/footer.tsx components/layout/
    cp -r parked/ember-palette-backup/config/site.ts config/
