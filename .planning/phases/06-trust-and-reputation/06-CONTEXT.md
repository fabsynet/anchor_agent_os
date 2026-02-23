# Phase 6: Trust & Reputation - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Agents can build and showcase their professional reputation through client testimonials and a public badge page. Includes testimonial collection via shareable link, curation (show/hide), in-app notifications for new submissions, and a public-facing agent profile page with testimonials, professional info, products offered, and embedded links. Surveys/feedback deferred from this phase.

</domain>

<decisions>
## Implementation Decisions

### Testimonial Collection
- Agent generates a generic shareable link (not per-client) — one link per agent that anyone can use
- Client enters their name/info on the form when submitting
- No system-sent emails — agent copies the link and shares however they want (email, text, WhatsApp, etc.)
- Submission form includes: 1-5 star rating, free-text testimonial area, and strength category checkboxes (e.g., responsiveness, knowledge, trustworthiness)
- Client chooses whether to display their name or submit anonymously

### Testimonial Curation
- New testimonials are auto-approved — appear on badge page immediately
- Agent can hide/show individual testimonials (toggle visibility) but cannot edit client's text
- Agent receives in-app notification (via existing Phase 5 notification bell) when a new testimonial is submitted
- Testimonials ordered most recent first on badge page

### Badge Page Presentation
- URL structure: `/agent/[name-slug]` — clean vanity URL with agent's name (e.g., `/agent/john-smith`)
- Full professional profile: photo, full name, license number, agency name, contact info, social links
- Products offered section — agent lists the types of insurance they sell
- Embeddable links — agent can add custom links (website, booking page, etc.)
- Testimonial display: 1-2 featured/highlighted testimonials at top, then a list of remaining ones below
- Light customization: agent can set a cover photo/banner and choose an accent color
- Page is publicly accessible — no authentication required to view

### Claude's Discretion
- Strength category labels (specific checkbox options for testimonial form)
- Badge page responsive layout and exact component structure
- Slug generation logic and conflict handling
- How featured testimonials are selected (manual pin or auto-select highest rated)
- Cover photo/banner dimensions and upload constraints

</decisions>

<specifics>
## Specific Ideas

- Products offered should be visible on the badge page alongside professional info
- Agent should be able to embed external links in their badge page (booking page, personal website, social profiles)
- Badge page should feel like a professional digital business card — trust-focused

</specifics>

<deferred>
## Deferred Ideas

- **Feedback surveys** — Originally in roadmap success criteria (TRST-03, TRST-04, TRST-05). User chose to defer: custom survey creation, question types (rating/text/multiple choice), template + customize flow, and survey responses on client profile. Can be added as a future phase or revisited.
- **Per-client testimonial links** — Currently using generic link; per-client links that auto-associate with client records could be added later
- **Email notifications for new testimonials** — Currently in-app only; email could be added

</deferred>

---

*Phase: 06-trust-and-reputation*
*Context gathered: 2026-02-22*
