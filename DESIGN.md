# Portfolio design direction

The portfolio uses a warm editorial identity to make Mike's engineering work approachable and credible. Preserve the design while making evidence and navigation easy to scan.

- **Audience:** recruiters, hiring managers, technical reviewers and prospective collaborators.
- **Typography:** Fraunces for editorial display headings, DM Sans for body and controls, and JetBrains Mono for technical labels. Use size and spacing to establish hierarchy.
- **Colour:** soft limestone and near-black, with a subtle mineral green tint, with blue for interactive links and green for live or shipped status. The dark theme uses warm near-black with lighter text and accents. Maintain readable contrast in both themes.
- **Layout:** a generous shared container and section rhythm; structured project rows and more detailed case studies. Preserve whitespace while keeping key evidence visible.
- **Interactions:** clear links and buttons, visible keyboard focus, touch targets of at least 44px where practical, subtle transitions, and reduced-motion support.
- **Responsive:** stack the hero and two-column content at narrow widths; keep navigation and case-study links accessible on mobile. Avoid horizontal overflow.
- **Content:** distinguish shipped work, rollout, prototypes and paused work. Support claims with specific case studies and evidence; do not invent outcomes or imply private code is public.
- **Avoid:** decorative gradients, gratuitous animation, crowded cards, weak contrast, generic claims and visual effects that compete with the work.

Review desktop and mobile in light and dark themes before release. Functional, keyboard and accessibility checks complement visual review.

## Design tokens and behaviour

| Token | Light | Dark |
| --- | --- | --- |
| Page | `#F4F4ED` | `#141210` |
| Surface | `#E8EBE1` | `#1E1B18` |
| Ink | `#1A1510` | `#F0EDE7` |
| Muted ink | `#535E55` | `#A0988F` |
| Accent | `#2B4ECC` | `#7799FF` |
| Signal | `#0F785F` | `#00C896` |

Typography: body 17px, small 15px, caption 13px, technical metadata 12px. Hero and section headings scale with viewport width; use the defined Tailwind sizes as the source of truth. The content container is capped at 1280px. Buttons use an 8px radius; cards and portrait panels use 16px. Section spacing is 80px, increasing to 112px on larger screens. Keep borders and shadows subtle. Use short, purposeful transitions and respect `prefers-reduced-motion`. Text and controls must meet WCAG AA contrast against their actual surfaces; verify badges on surfaces as well as the page.
