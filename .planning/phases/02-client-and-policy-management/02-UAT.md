---
status: complete
phase: 02-client-and-policy-management
source: 02-01-SUMMARY.md, 02-02-SUMMARY.md, 02-03-SUMMARY.md, 02-04-SUMMARY.md, 02-05-SUMMARY.md
started: 2026-02-21T22:00:00Z
updated: 2026-02-21T22:30:00Z
---

## Current Test

[testing complete]

## Tests

### 1. Client List Page Loads
expected: Navigate to /clients. Page shows "Clients" heading, Clients/Leads tabs, a search bar, a table/card view toggle, and a list of clients (or empty state if none exist).
result: pass

### 2. Create a New Client
expected: Click "New Client" button on /clients. Fill in name, email, phone, address, province, DOB. Set status to "Client". Submit. Redirects to /clients and new client appears in the list.
result: pass

### 3. Create a Lead (Minimal Data)
expected: Click "New Client", set status to "Lead", enter just a name and email (or phone). Submit succeeds. The lead appears under the "Leads" tab, not the "Clients" tab.
result: pass

### 4. Search Clients
expected: Type a client name into the search bar. After a brief delay (~300ms), the list filters to show only matching clients. Searching by email or phone also works.
result: pass

### 5. Toggle Table/Card View
expected: Click the card icon in the view toggle. Clients display as cards in a grid. Click the list icon to switch back to table rows.
result: pass

### 6. Edit a Client
expected: From the client list, click the actions menu on a client row and choose Edit (or navigate to /clients/[id]/edit). Change a field (e.g., phone number). Save. The updated value persists after page refresh.
result: pass

### 7. Delete a Client
expected: From the client list, click the actions menu and choose Delete. A confirmation dialog appears warning about cascading deletes. Confirm. The client is removed from the list.
result: pass

### 8. Client Profile Page Loads
expected: Click a client name in the list. Profile page loads at /clients/[id] with the client's name, status badge, and 4 tabs: Overview, Policies, Timeline/Notes, Documents.
result: pass

### 9. Profile Overview Tab
expected: Overview tab shows the client's contact information (email, phone, address, province, DOB) and summary stats (policy count, next renewal date if applicable).
result: pass

### 10. Convert Lead to Client
expected: Open a lead's profile. Click the "Convert to Client" button in the header. The status badge changes from "Lead" to "Client". The lead now appears under the Clients tab on /clients.
result: pass

### 11. Add a Note
expected: On a client profile, go to the Timeline/Notes tab. Type a note in the text area and submit. The note appears in the timeline with your name and timestamp.
result: pass

### 12. Timeline Shows Activity Events
expected: After adding a note or creating a policy, the timeline shows auto-logged events (e.g., "client_created", "note_added", "policy_created") with icons and timestamps.
result: pass

### 13. Timeline Compact/Expanded Toggle
expected: Timeline defaults to compact list view with a vertical connector line. Clicking the expand toggle shows expanded cards with full timestamps and metadata.
result: pass

### 14. Create a Policy on Client Profile
expected: On a client's Policies tab, click "Add Policy". A dialog opens with fields for type, carrier, policy number, dates, premium, coverage, deductible, payment frequency, commission, and notes. Fill in and submit. The policy appears in the list.
result: pass

### 15. Auto-Convert Lead on First Policy
expected: Open a lead's profile. Create a policy. After saving, a toast confirms "Converted from lead to client". The profile header badge changes to "Client".
result: pass

### 16. Policy Status Badge Colors
expected: Policies display a colored status badge. Draft = gray/secondary, Active = primary/default, Pending Renewal = amber/yellow, Expired = red/destructive, Cancelled = outlined red.
result: pass

### 17. Edit a Policy
expected: On a client's Policies tab, click the edit action on a policy. The dialog opens pre-filled with the policy's data. Change a field and save. The updated value appears.
result: pass

### 18. Delete a Policy
expected: On a client's Policies tab, click the delete action on a policy. A confirmation dialog appears. Confirm. The policy is removed from the list.
result: pass

### 19. Policy Table/Card Toggle on Client Profile
expected: On the client Policies tab, toggle between card view (grid of summary cards with type icon, carrier, premium, expiry) and table view (sortable rows). Both display correctly.
result: pass

### 20. Standalone Policies Page Loads
expected: Navigate to /policies. Page shows "Policies" heading, status filter tabs (All, Active, Draft, Pending Renewal, Expired, Cancelled), a search bar, view toggle, and all policies across all clients.
result: pass

### 21. Search Policies by Client Name
expected: On /policies, type a client's name into the search bar. After a brief delay, only policies belonging to that client are shown.
result: pass

### 22. Search Policies by Carrier or Policy Number
expected: On /policies, search by a carrier name or policy number. Matching policies appear in the filtered results.
result: pass

### 23. Filter Policies by Status Tab
expected: On /policies, click the "Active" tab. Only active policies are shown. Click "Expired" — only expired. Click "All" to see everything again.
result: pass

### 24. Policy Table Shows Client Name
expected: On /policies in table view, a "Client" column shows the client's name. Clicking the client name navigates to that client's profile page.
result: pass

### 25. Policy Cards Show Client Name
expected: On /policies in card view, each card displays the client's name as a link. Clicking it navigates to the client profile.
result: pass

### 26. Pagination on Policies Page
expected: If more than 20 policies exist, Previous/Next pagination buttons appear below the list. Clicking Next loads the next page. Page indicator shows "Page X of Y".
result: pass

## Summary

total: 26
passed: 26
issues: 0
pending: 0
skipped: 0

## Gaps

[none]
