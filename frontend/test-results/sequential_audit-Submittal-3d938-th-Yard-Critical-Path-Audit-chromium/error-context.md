# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: sequential_audit.spec.js >> Submittal Tracker: Sequential Premium Audit >> The "11th Yard" Critical Path Audit
- Location: tests\sequential_audit.spec.js:12:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[placeholder="e.g. 24001"]')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - navigation [ref=e4]:
    - generic [ref=e5]: ST
    - button "Dashboard" [ref=e6] [cursor=pointer]:
      - img [ref=e7]
      - generic: Dashboard
    - button "Security" [ref=e12] [cursor=pointer]:
      - img [ref=e13]
      - generic: Security
    - generic [ref=e15]:
      - button "P Account" [ref=e16] [cursor=pointer]:
        - generic [ref=e17]: P
        - generic [ref=e18]: Account
      - button "Log Out" [ref=e19] [cursor=pointer]:
        - img [ref=e20]
  - generic [ref=e23]:
    - generic [ref=e24]:
      - generic [ref=e25]: Dashboard
      - generic [ref=e27] [cursor=pointer]:
        - checkbox "Show Archived" [ref=e28]
        - text: Show Archived
      - button "New Project" [ref=e29] [cursor=pointer]:
        - img [ref=e30]
        - text: New Project
    - generic [ref=e31]:
      - generic [ref=e32]:
        - heading "Submittal Tracker" [level=1] [ref=e33]
        - paragraph [ref=e34]: Know where every submittal stands, who has it, and what's next.
      - generic [ref=e35]:
        - img [ref=e37]
        - generic [ref=e41]: No projects yet
        - generic [ref=e42]: Create your first project to start tracking submittals.
        - button "New Project" [ref=e43] [cursor=pointer]:
          - img [ref=e44]
          - text: New Project
    - generic [ref=e46]:
      - generic [ref=e47]:
        - generic [ref=e48]: New Project
        - button [ref=e49] [cursor=pointer]:
          - img [ref=e50]
      - generic [ref=e53]:
        - generic [ref=e54]:
          - generic [ref=e55]:
            - generic [ref=e56]: Project Name *
            - textbox "e.g. City Center Plaza" [active] [ref=e57]
          - generic [ref=e58]:
            - generic [ref=e59]: Project Number
            - textbox "e.g. PEC-2024-001" [ref=e60]
          - generic [ref=e61]:
            - generic [ref=e62]: Project Address
            - textbox "e.g. 1234 Main St, Phoenix AZ" [ref=e63]
        - generic [ref=e64]:
          - button "Cancel" [ref=e65] [cursor=pointer]
          - button "Create Project" [ref=e66] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Submittal Tracker: Sequential Premium Audit', () => {
  4  |   
  5  |   test.beforeEach(async ({ page }) => {
  6  |     // Auth Bypass Guard
  7  |     await page.addInitScript(() => {
  8  |       window.localStorage.setItem('sb-test-mode', 'true');
  9  |     });
  10 |   });
  11 | 
  12 |   test('The "11th Yard" Critical Path Audit', async ({ page }) => {
  13 |     // 1. Dashboard Load
  14 |     await page.goto('/');
  15 |     await expect(page).toHaveTitle(/Submittal Tracker/);
  16 |     
  17 |     // Either projects-grid OR empty-state should be visible
  18 |     const grid = page.locator('.projects-grid');
  19 |     const empty = page.locator('.empty-state');
  20 |     await expect(grid.or(empty)).toBeVisible();
  21 | 
  22 |     // 2. Project Creation Guard (The Spark)
  23 |     const projectName = `Audit Master ${Date.now().toString().slice(-4)}`;
  24 |     
  25 |     // Look for New Project button in top bar OR empty state
  26 |     const newBtn = page.locator('button:has-text("New Project")').first();
  27 |     await newBtn.click();
  28 |     
  29 |     // Wait for modal
  30 |     await page.waitForSelector('.modal');
> 31 |     await page.fill('input[placeholder="e.g. 24001"]', 'AUDIT-11');
     |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  32 |     await page.fill('input[placeholder="e.g. Gotham City Hospital"]', projectName);
  33 |     await page.click('button:has-text("Create Project")');
  34 |     
  35 |     // Wait for project to appear in grid
  36 |     await expect(page.locator(`text=${projectName}`)).toBeVisible({ timeout: 10000 });
  37 | 
  38 |     // 3. Project Entry Guard
  39 |     await page.click(`text=${projectName}`);
  40 |     await expect(page.locator('.breadcrumb-active')).toHaveText(projectName);
  41 | 
  42 |     // 4. Submittal Creation Guard
  43 |     await page.click('#btn-add-submittal');
  44 |     await page.fill('#input-spec-section', '05 10 00');
  45 |     await page.fill('#input-item-name', 'Structural Steel Deck');
  46 |     await page.click('#btn-create-submittal');
  47 |     await expect(page.locator('text=Structural Steel Deck')).toBeVisible();
  48 | 
  49 |     // 5. Detail Panel & Activity Log Guard
  50 |     await page.click('text=Structural Steel Deck');
  51 |     await expect(page.locator('.detail-panel')).toHaveClass(/open/);
  52 |     
  53 |     // Check for activity log
  54 |     await expect(page.locator('.activity-feed')).toBeVisible();
  55 |     
  56 |     // 6. Panel Overlap Coordination (Premium Layout Guard)
  57 |     const container = page.locator('.floating-chat-container');
  58 |     await expect(container).toHaveClass(/shifted/);
  59 | 
  60 |     // 7. Status & Sync Guard
  61 |     await page.selectOption('#select-status', 'working');
  62 |     // Ensure the "Working" badge appears in the row
  63 |     await expect(page.locator('.submittal-row').first().locator('.badge-working')).toBeVisible();
  64 | 
  65 |     // 8. Activity Persistence Guard
  66 |     const uniqueNote = `Audit Progress Checkpoint - ${Date.now()}`;
  67 |     await page.fill('textarea[placeholder="Add a progress note..."]', uniqueNote);
  68 |     await page.click('button >> .lucide-send');
  69 |     await expect(page.locator('.activity-msg').filter({ hasText: uniqueNote })).toBeVisible();
  70 | 
  71 |     // 9. Spec Intel Hub Navigation
  72 |     await page.click('button:has-text("Spec Intel")');
  73 |     await expect(page.locator('text=Spec Intel Hub')).toBeVisible();
  74 |     await page.click('button:has-text("Back to Workbench")'); // Back to project
  75 | 
  76 |     // 10. Account Security Guard
  77 |     await page.click('.nav-btn:last-child');
  78 |     await expect(page.locator('text=Security')).toBeVisible();
  79 |     await page.click('.nav-btn[title="Projects"]'); // Back to dashboard
  80 | 
  81 |     // 11. AI Chat Resilience
  82 |     const chatFab = page.locator('.chat-fab-button');
  83 |     await chatFab.click();
  84 |     await expect(page.locator('.chat-window')).toBeVisible();
  85 |     // Verify AI greeting
  86 |     await expect(page.locator('.chat-bubble.assistant').first()).toBeVisible();
  87 | 
  88 |     console.log("Audit Complete: 11/11 Guards Verified.");
  89 |   });
  90 | 
  91 | });
  92 | 
```