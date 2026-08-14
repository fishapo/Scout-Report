# Administrator User & Role Operations

## Creating a user

1. Sign in as an administrator.
2. Open `/admin-dashboard.html`.
3. Select **User & Role Settings**.
4. Enter name, email and temporary password.
5. Select one of the four application roles.
6. Select **Add User**.

## Changing a role

1. Locate the user in the user table.
2. Select the required role.
3. Select **Save**.
4. The server validates the role and applies it to the user record.

Role changes affect subsequent authorization checks. Existing sessions may need to authenticate again before the new role is reflected everywhere.

## Deleting a user

Select **Delete** beside the account and confirm the operation.

Safety rules:

- An administrator cannot delete their own account.
- The final active administrator cannot be deleted.
- Deleting a user does not provide a way to bypass report verification history.

## Role governance

Do not use `admin` as a substitute for a supervisor or HOD. The intended chain is:

`Scout → Inter-Farm Supervisor → Head of Department → Administrator`

Each forward transition requires verification by the responsible role.
