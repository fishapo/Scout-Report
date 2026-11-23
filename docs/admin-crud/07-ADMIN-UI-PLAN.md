# 7. Admin Dashboard CRUD UI Plan

## Current state

`previews/admin-dashboard.html` already has a Reference Data section that loads four reference groups.

The next stage should turn it into a management workspace.

## Recommended layout

Use four management panels:

1. Farms
2. Crop Types + Varieties
3. Pests
4. Diseases

Each panel should have:

- title
- count
- search/filter if useful
- add button
- records table/list
- edit action
- delete/archive action
- loading state
- empty state
- error state

## Farm UI

```text
Farms                          [+ Add Farm]

Name                 Location             Actions
----------------------------------------------------
Green Valley Farm    East County          Edit Delete
Sunset Ridge Farm    North Valley         Edit Delete
```

## Crop UI

Use expandable parent records:

```text
Tomato                     [Edit] [Delete]
  Cherry Tomato            [Edit] [Delete]
  Beefsteak Tomato         [Edit] [Delete]
  Roma Tomato              [Edit] [Delete]

                         [+ Add Variety]
```

## Pest/Disease UI

Display:

- name
- description
- actions

## Modal forms

Prefer reusable modal infrastructure:

- Add
- Edit
- Delete confirmation

Do not create separate HTML pages for each reference type in this phase.

## UX rules

Every mutation should show:

- disabled submit button during request
- success feedback
- clear error feedback
- refresh/update of affected list
- no duplicate submissions

## Delete UX

Before deletion:

```text
Are you sure?
```

If server returns a dependency conflict:

```text
This record cannot be deleted because it is
used by existing operational records.
```

Never claim deletion succeeded until the server confirms it.

## Security UX

If the page is somehow rendered for a non-admin:

- hide management controls
- do not attempt admin calls

But server-side 403 remains mandatory.

## API client

Centralize admin API requests rather than scattering `fetch()` calls across rendering functions.

Recommended conceptual helper:

```text
adminApi.request(method, endpoint, body)
```

It should:

- attach credentials/token as currently used by the project
- parse JSON
- normalize errors
- handle 401
- handle 403
- handle 409
- handle network errors

## Preserve existing dashboard functionality

Do not break:

- statistics
- report filters
- report table
- report view
- report deletion
- export
- logout
- new report navigation
