# Microsoft Graph API for OneNote Extraction

Alternative to DOM scraping. Returns structured OneNote page HTML with
preserved formatting.

## Prerequisites

Register an Azure AD application in the Azure Portal:

1. Go to **Azure Portal → Microsoft Entra ID → App registrations → New registration**
2. Name: "StudyBub OneNote Extraction"
3. Supported account types: "Accounts in any organizational directory"
4. Redirect URI: `http://localhost:3000` (for device code flow, not strictly needed)
5. Under **API permissions → Add a permission → Microsoft Graph → Delegated permissions**:
   - `Notes.Read` — read OneNote notebooks, sections, pages
   - `Files.Read.All` — read SharePoint document libraries (optional, for file access)
   - `Sites.Read.All` — discover SharePoint sites (optional)
   - `User.Read` — user identity (usually granted by default)
6. Under **Authentication → Advanced settings → Allow public client flows**: set to "Yes"

Note the **Application (client) ID** and **Directory (tenant) ID**.

## Token acquisition

Use the OAuth 2.0 device code flow:

```bash
# Step 1: Get device code
curl -s -X POST "https://login.microsoftonline.com/common/oauth2/v2.0/devicecode" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "scope=Notes.Read Files.Read.All Sites.Read.All User.Read"

# Step 2: Complete device activation in browser
# Open https://login.microsoft.com/device and enter the user_code

# Step 3: Poll for token
curl -s -X POST "https://login.microsoftonline.com/common/oauth2/v2.0/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=urn:ietf:params:oauth:grant-type:device_code" \
  -d "client_id=YOUR_CLIENT_ID" \
  -d "device_code=DEVICE_CODE_FROM_STEP_1"
```

The device activation step can be automated with agent-browser
(`agent-browser open https://login.microsoft.com/device`,
`agent-browser fill …`, `agent-browser click …`).

The QLD Education tenant already has the user authenticated in the browser, so
selecting the pre-authenticated account completes activation immediately.

## Graph API endpoints

```bash
BASE="https://graph.microsoft.com/v1.0"
TOKEN="eyJ..."  # from the token endpoint above

# List notebooks
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/me/onenote/notebooks"

# List sections in a notebook
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE/me/onenote/notebooks/{notebook-id}/sections"

# List pages in a section
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE/me/onenote/sections/{section-id}/pages"

# Get page content (HTML)
curl -s -H "Authorization: Bearer $TOKEN" \
  "$BASE/me/onenote/pages/{page-id}/content"
```

## Page HTML format

Graph API returns OneNote page content as HTML with custom data attributes:

```html
<html>
  <head>
    <title>Page Title</title>
  </head>
  <body>
    <div data-id="outline" style="position:absolute;left:48px;top:96px;width:624px">
      <p>Page content with <span style="font-weight:bold">formatting</span>.</p>
      <img data-src-type="image/png" src="https://.../image.png" />
    </div>
  </body>
</html>
```

Key elements:
- `data-id` attributes identify rich content blocks
- `style` attributes carry positioning and formatting
- `<img>` elements reference image resources with absolute URLs
- Maths notation rendered as images (OneNote does not export as MathML/TeX)

## Known issue: Azure CLI client ID

The Azure CLI well-known client ID (`04b07795-8ddb-461a-bbee-02f9e1bf7b46`)
is a first-party Microsoft app. Adding scopes beyond its pre-configured set
(e.g., `Notes.Read`) fails with AADSTS65002: "Consent between first party
applications must be configured via preauthorization."

A custom (non-first-party) app registration is required for production use.

The bundled script `scripts/pocGraphApi.ts` demonstrates the full pipeline.
