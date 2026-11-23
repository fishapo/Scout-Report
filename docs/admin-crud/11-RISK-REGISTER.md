# 11. Risk Register

| Risk | Severity | Likelihood | Mitigation |
|---|---|---|---|
| Farm deletion cascades reports | Critical | High | block deletion when referenced; consider archive state |
| Crop deletion cascades varieties | High | Medium | dependency checks and explicit confirmation |
| Read API response shape changes | Critical | Medium | preserve existing controller/routes and add contract tests |
| Scout loses access to references | Critical | Medium | regression test scout form after every CRUD phase |
| Scout gains admin mutation access | Critical | Medium | route-level `authorizeRoles("admin")` tests |
| Duplicate reference names | Medium | High | DB unique constraints + 409 mapping |
| Client-generated IDs collide | Medium | Medium | server-side ID generation |
| Pest/disease rename breaks historical interpretation | High | Medium | document current string-based history behavior |
| Two competing stores are modified | High | Medium | keep active `server/store.js` as source of truth |
| Admin UI reports false success | Medium | Medium | only update UI after confirmed server response |
| Raw SQL errors leak | Medium | Medium | centralized safe error handling |
| Cookie-based mutations lack CSRF strategy | High | Unknown | inspect deployment credential model before production |
| Performance regression | Medium | Medium | measure before optimizing |
| Schema migration breaks seed/setup | High | Low | test migration from clean DB and existing DB |
| CRUD code makes `store.js` unmaintainable | Medium | Medium | introduce repository/service boundaries |

## Highest-priority decision gates

1. Farm deletion behavior.
2. Crop deletion behavior.
3. Historical pest/disease rename behavior.
4. ID generation strategy.
5. Browser credential/CSRF strategy.
