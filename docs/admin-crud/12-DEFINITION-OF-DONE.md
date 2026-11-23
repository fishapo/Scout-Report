# 12. Definition of Done

## Architecture

- [ ] Admin CRUD is isolated from scout-facing read routes.
- [ ] Existing `/api/reference/*` routes remain compatible.
- [ ] Active PostgreSQL store remains authoritative.
- [ ] No duplicate reference model is introduced.

## Security

- [ ] Anonymous requests return 401.
- [ ] Scouts return 403.
- [ ] Admins are allowed.
- [ ] Browser controls do not substitute for API authorization.
- [ ] Mutation credential strategy is documented.

## Farms

- [ ] Create
- [ ] Read
- [ ] Update
- [ ] Delete/archive
- [ ] validation
- [ ] duplicate protection
- [ ] dependency protection

## Crop types

- [ ] Create
- [ ] Read
- [ ] Update
- [ ] Delete/archive
- [ ] validation
- [ ] duplicate protection
- [ ] variety dependency protection

## Varieties

- [ ] Create
- [ ] Read
- [ ] Update
- [ ] Delete
- [ ] parent validation
- [ ] scoped duplicate protection

## Pests

- [ ] Create
- [ ] Read
- [ ] Update
- [ ] Delete/archive
- [ ] validation
- [ ] duplicate protection
- [ ] historical behavior documented

## Diseases

- [ ] Create
- [ ] Read
- [ ] Update
- [ ] Delete/archive
- [ ] validation
- [ ] duplicate protection
- [ ] historical behavior documented

## Scout compatibility

- [ ] Scout form loads all references.
- [ ] Crop variety selection still works.
- [ ] Report creation still validates references.
- [ ] Existing reports remain readable.
- [ ] Existing reference API response shapes are unchanged.

## UI

- [ ] Add
- [ ] Edit
- [ ] Delete confirmation
- [ ] Loading
- [ ] Empty
- [ ] Error
- [ ] Success
- [ ] 401/403/409 handling
- [ ] responsive layout

## Testing

- [ ] unit/store tests
- [ ] route tests
- [ ] security tests
- [ ] regression tests
- [ ] UI verification
- [ ] clean database test
- [ ] existing database migration test if schema changes

## Documentation

- [ ] API docs
- [ ] schema/dependency docs
- [ ] security docs
- [ ] migration notes
- [ ] operator instructions
- [ ] Git commits documented
