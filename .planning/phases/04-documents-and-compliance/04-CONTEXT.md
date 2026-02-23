# Phase 4: Documents & Compliance - Context

**Gathered:** 2026-02-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Document upload, storage, and retrieval linked to clients and policies, with predefined category tags and a folder-like browsing experience. Plus an immutable compliance activity log that auto-records key actions and supports filtered viewing at both agency-wide and per-client levels.

</domain>

<decisions>
## Implementation Decisions

### Document Organization
- Folder-like structure with auto-generated folders: each client gets a folder, each policy gets a sub-folder
- No manual folder creation — system generates the hierarchy from client/policy relationships
- Documents also carry a predefined category tag for cross-client filtering
- Category set: Policy Document, Application, ID/License, Claim Form, Proof of Insurance, Endorsement, Cancellation Notice, Correspondence

### Upload & Viewing Experience
- Drag-and-drop zone with click-to-browse fallback (both available)
- Multi-file upload supported — each file gets the same default category, individually changeable before confirming
- In-app preview for PDFs and images (modal/panel within the app), download button always available
- Word docs and unsupported types show download-only (no preview)
- No document versioning — each upload is its own document; agent deletes old version manually if needed

### Document-Entity Linking
- Every document belongs to a client (required), optionally linked to a specific policy under that client
- Documents appear as a "Documents" tab on the client profile page, grouped by policy sub-folders
- Documents also appear in a documents section on the policy detail view (only that policy's docs)
- No standalone /documents page for MVP
- When a policy is deleted, its linked documents move to the client level (lose policy link, keep document)
- Document count badges visible on client list rows and policy cards

### Compliance Log Behavior
- Auto-logged actions: policy created/updated/deleted, task completed, document uploaded/deleted, notes added
- No login events, settings changes, or client CRUD logging for MVP
- Dedicated /compliance page accessible from the sidebar for agency-wide view
- Per-client compliance section on each client's profile (filtered to that client's actions)
- Filters: client, action type, date range, user who performed action, linked policy
- Entries are strictly immutable — no editing, deleting, or annotating by anyone

### Claude's Discretion
- Supabase Storage bucket configuration and signed URL approach
- File size validation UX (10MB limit from requirements)
- Preview component implementation (embedded viewer vs library)
- Compliance log pagination and sort order
- Exact folder tree UI component and navigation pattern
- Upload progress indicator design

</decisions>

<specifics>
## Specific Ideas

- Folder structure should feel like a file manager — agents navigate into client folders, then into policy sub-folders
- Insurance-focused category set reflects real agency document types (not generic "Other" categories)
- Documents should never be lost on policy deletion — always cascade up to client level
- Compliance log is a pure audit trail — no one can tamper with it, ever

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-documents-and-compliance*
*Context gathered: 2026-02-22*
