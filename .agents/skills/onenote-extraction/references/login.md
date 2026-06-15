# OneNote Login (QLD Education SSO)

The target tenant is QLD Department of Education (`eq.edu.au`). Credentials
are stored in 1Password under the entry "Department of Education and Training"
in vault "Lem".

## Credential retrieval

The 1Password service account token does not support `op run` with secret
references. Retrieve credentials directly:

```bash
export ONENOTE_USER="tgrim43"
export ONENOTE_PASS="$(op item get --vault Lem 'Department of Education and Training' --fields password --reveal)"
```

Username: `tgrim43` (bare, no `@eq.edu.au` suffix).
Password: stored in the `password` field of the 1Password entry.

## Login flow

1. Navigate to `https://onenote.cloud.microsoft/notebooks`
2. At the Microsoft login page, enter `tgrim43@eq.edu.au` (WITH domain)
3. Microsoft detects the federated domain → redirects to QLD Education SSO
4. At the SSO page (`fed.education.qld.gov.au`), enter BARE username (`tgrim43`)
5. Enter password
6. Microsoft "Stay signed in?" prompt → click Yes

## SSO form quirks

The QLD Education SSO form has non-standard validation that breaks
`agent-browser fill`:

- **Username** must NOT contain `@` or `\` or start with a digit.
  Use the bare username `tgrim43`.
- **Checkbox** (`#sso-cou`): must be checked AND have a non-empty `value`
  attribute. Set value to `"on"`.
- **Form validation**: uses `addEventListener('input', …)` rather than inline
  handlers. `agent-browser fill` alone does not trigger validation. You must
  dispatch `input` and `change` events after filling.

## agent-browser login script

```javascript
// Step 1: Navigate to OneNote
// agent-browser open https://onenote.cloud.microsoft/notebooks --session-name onenote

// Step 2: At Microsoft login, enter email with domain
// agent-browser fill <username-input-ref> "tgrim43@eq.edu.au"
// agent-browser click <next-button-ref>

// Step 3: At QLD SSO page, fill username (BARE, no domain)
// agent-browser eval --session-name onenote "
//   const u = document.querySelector('#userNameInput, input[name=pf.username]');
//   if (!u) throw new Error('username input not found');
//   u.value = 'tgrim43';
//   u.dispatchEvent(new Event('input', { bubbles: true }));
//   u.dispatchEvent(new Event('change', { bubbles: true }));
//   document.querySelector('#sso-cou').checked = true;
//   document.querySelector('#sso-cou').value = 'on';
// "

// Step 4: Fill password
// agent-browser eval --session-name onenote "
//   const p = document.querySelector('#password, input[type=password]');
//   p.value = process.env.ONENOTE_PASS;
//   p.dispatchEvent(new Event('input', { bubbles: true }));
//   p.dispatchEvent(new Event('change', { bubbles: true }));
// "

// Step 5: Submit
// agent-browser click <submit-button-ref>
```

## Session file

After successful login, the session cookies are stored at
`~/.agent-browser/sessions/onenote-default.json`. This file is in Playwright's
`storageState` format (an object with `cookies` and `origins` arrays). Load it
into Playwright with:

```typescript
const storageState = JSON.parse(readFileSync(sessionPath, "utf-8"));
const context = await browser.newContext({ storageState });
```
