// The Spreadsheet control's screenshots, on the demo copy's Fieldfare Traders sample (see README.md):
// a form with a workbook laid out as a template (title and figures above, formulas beside, a total
// beneath) and the products inserted at row 6. Signs in as the demo copy's admin, builds the form,
// keeps the workbook with it, then photographs it as an Admin, in Design view, in code, and as a User.
//   DEMO_URL=http://localhost:3200 SEED_PW=... OUT=shots node sheet.mjs
import { chromium } from 'playwright';
const BASE = process.env.DEMO_URL || 'http://localhost:3200';
const out = process.env.OUT || 'shots';
const NAME = 'Stock Workbook';
const USER = { username: 'mreid', displayName: 'Maya Reid', password: 'Viewer-Pass-2026!', role: 'user' };
const b = await chromium.launch();
const view = { viewport: { width: 1440, height: 900 }, deviceScaleFactor: Number(process.env.DSF || 1) };
async function signIn(user, password) {
  const page = await (await b.newContext(view)).newPage();
  page.on('dialog', (d) => d.accept());
  await page.goto(BASE + '/', { waitUntil: 'networkidle' });
  await page.fill('input[type=text], input[name=username]', user);
  await page.fill('input[type=password]', password);
  await page.keyboard.press('Enter');
  await page.waitForTimeout(2500);
  return page;
}
const ready = (page) => page.waitForFunction(() => document.querySelector('.doc-body > .doc-pane:not([hidden]) .fv-sheet')?.sheetControl?.bound, null, { timeout: 30000 });

const openForm = async (pg) => { const item = pg.locator(`.nav-item[data-kind=form][data-name="${NAME}"]:visible`).first(); await item.scrollIntoViewIfNeeded(); await item.click(); await pg.locator('.doc-tab').filter({ hasText: NAME }).first().waitFor(); };
const page = await signIn('admin', process.env.SEED_PW || 'Shot-Capture-2026!');
const api = (method, path, body) => page.evaluate(async ([m, p, d]) => {
  const r = await fetch(p, { method: m, headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'webaccess' }, body: d === undefined ? undefined : JSON.stringify(d) });
  return { status: r.status, body: await r.json().catch(() => null) };
}, [method, path, body]);
await api('POST', '/api/users', USER);
await api('DELETE', '/api/forms/' + encodeURIComponent(NAME));
const made = await api('POST', '/api/forms', { form: {
  name: NAME, caption: NAME, defaultView: 'single', recordSource: '', width: 1100, navigationButtons: false, recordSelectors: false,
  sections: { header: { height: 0 }, detail: { height: 640 }, footer: { height: 0 } },
  controls: [{ id: 'sh01', type: 'spreadsheet', name: 'Sheet1', section: 'detail', x: 8, y: 8, width: 1084, height: 624,
    recordSource: 'SELECT Products.[Product Name], Categories.[Category Name], Products.[Quantity Per Unit], Products.[Unit Price], Products.[Units In Stock], Products.[Reorder Level] FROM Products INNER JOIN Categories ON Products.[Category ID] = Categories.[Category ID] WHERE Products.Discontinued = False ORDER BY Categories.[Category Name], Products.[Product Name]',
    sheetName: 'Stock', insertRow: 6, insertColumn: 1, hasHeaderRow: true, allowEdits: true, allowInserts: false, allowDeletes: false,
    showStatusBar: false, showZoom: false }],
} });
if (made.status !== 201) throw new Error(JSON.stringify(made.body));
// the code behind it, written as it would be for Excel
const mod = await api('PUT', '/api/modules/' + encodeURIComponent('Form_' + NAME), { kind: 'form', form: NAME, code: `Option Compare Database
Option Explicit

' Runs when someone changes a cell of the workbook
Private Sub Sheet1_SheetChange(ByVal Sh As Object, ByVal Target As Range)
    Dim ws As Worksheet
    Set ws = Me.Sheet1.Object.Worksheets("Stock")

    ' Shade a stock level that has fallen to its reorder level
    If Target.Column = 5 And Target.Row > 6 Then
        If Target.Value <= ws.Cells(Target.Row, 6).Value Then
            Target.Interior.Color = RGB(253, 226, 226)
        Else
            Target.Interior.Color = xlNone
        End If
    End If
End Sub

Private Sub cmdRoundPrices_Click()
    Dim ws As Worksheet, row As ListRow, n As Long
    Set ws = Me.Sheet1.Object.ActiveSheet

    ' Round every price to the nearest 5p
    For Each row In ws.Data.ListRows
        With row.Range.Cells(1, 4)
            If .Value <> Round(.Value * 20, 0) / 20 Then
                .Value = Round(.Value * 20, 0) / 20
                n = n + 1
            End If
        End With
    Next row

    ws.Data.Update          ' write the changed rows to the Products table
    MsgBox n & " prices rounded", vbInformation
End Sub
` });
if (mod.status >= 300) throw new Error(JSON.stringify(mod.body));

await page.reload(); await page.waitForSelector('.nav-item');
await openForm(page);
await ready(page); await page.waitForTimeout(2500);
// The template, laid out as its designer would with the toolbar.
const block = await page.evaluate(async () => {
  const s = document.querySelector('.doc-body > .doc-pane:not([hidden]) .fv-sheet').sheetControl; const ws = s.workbook.getActiveSheet();
  const first = s.block.first + 1, last = s.block.last + 1, tot = last + 2;   // sheet rows, counted from 1
  const spare = s.workbook.getSheets().find((x) => x.getSheetName() !== ws.getSheetName()); if (spare) s.workbook.deleteSheet(spare);
  const GREEN = '#1f5c4a', TINT = '#e6f0ec', MONEY = '"£"#,##0.00', R = (a) => ws.getRange(a);
  R('A1').setValue('Fieldfare Traders: stock and reorder'); R('A1').setFontSize(16).setFontWeight('bold').setFontColor(GREEN);
  R('A2').setValue('Change a price or a stock level here and the product is saved at once.'); R('A2').setFontColor('#5b6660');
  [['A', 'Products', `=COUNTA(A${first}:A${last})`, '0'], ['C', 'Stock value', `=SUM(G${first}:G${last})`, '"£"#,##0'], ['E', 'To reorder', `=COUNTIF(H${first}:H${last},"Reorder")`, '0'], ['G', 'Average price', `=AVERAGE(D${first}:D${last})`, MONEY]]
    .forEach(([c, label, f, fmt]) => { R(`${c}3`).setValue(label); R(`${c}3`).setFontColor('#5b6660').setFontSize(9); R(`${c}4`).setValue(f); R(`${c}4`).setNumberFormat(fmt).setFontSize(14).setFontWeight('bold'); });
  R('G6').setValue('Stock value'); R('H6').setValue('Reorder?');
  R('A6:H6').setBackgroundColor(GREEN).setFontColor('#ffffff').setFontWeight('bold');
  for (let r = first; r <= last; r++) { R(`G${r}`).setValue(`=D${r}*E${r}`); R(`H${r}`).setValue(`=IF(E${r}<=F${r},"Reorder","")`); }
  R(`D${first}:D${last}`).setNumberFormat(MONEY); R(`G${first}:G${last}`).setNumberFormat(MONEY);
  R(`G${first}:H${last}`).setBackgroundColor(TINT);
  R(`A${tot}`).setValue('Total'); R(`E${tot}`).setValue(`=SUM(E${first}:E${last})`); R(`G${tot}`).setValue(`=SUM(G${first}:G${last})`);
  R(`A${tot}:H${tot}`).setFontWeight('bold').setBackgroundColor(TINT); R(`G${tot}`).setNumberFormat(MONEY);
  [[0, 210], [1, 120], [2, 140], [3, 90], [4, 118], [5, 112], [6, 110], [7, 90]].forEach(([c, w]) => ws.setColumnWidth(c, w));
  try { s.workbook.setActiveRange(ws.getRange('E9')); } catch { ws.getRange('E9').activate(); }
  await s.settle();
  return { ...s.block, summary: ws.getRange('A4:G4').getRawValues()[0] };
});
await page.waitForTimeout(800);
await page.locator('.fv-sheet-keep').click();      // keep the workbook with the form, as an Admin does
await page.waitForTimeout(1500);
console.log(`"${NAME}": ${block.count} products from row ${block.first + 1}; figures ${JSON.stringify(block.summary)}`);

// 1. As an Admin
await page.reload(); await page.waitForSelector('.nav-item');
await openForm(page);
await ready(page); await page.waitForTimeout(3000);
await page.screenshot({ path: `${out}/spreadsheet.png` });
// 2. Design view, with the control's properties
await page.getByText('Design', { exact: true }).first().click(); await page.waitForTimeout(1500);
await page.locator('.fd-control, [data-id=sh01]').first().click().catch(() => {}); await page.waitForTimeout(1200);
await page.screenshot({ path: `${out}/spreadsheet-design.png` });
// 3. The code behind it
await page.locator("button[title^='Open the code behind this form']").first().click(); await page.waitForTimeout(2000);
await page.screenshot({ path: `${out}/spreadsheet-code.png` });
// 4. As a User, in the runtime
// A User has no Navigation Pane: the workbook opens as the database's Display Form (put back afterwards).
const startup = (await api('GET', '/api/startup')).body;
await api('PUT', '/api/startup', { ...startup, displayForm: NAME });
const user = await signIn(USER.username, USER.password);
await ready(user); await user.waitForTimeout(3500);
await user.screenshot({ path: `${out}/spreadsheet-runtime.png` });
await api('PUT', '/api/startup', startup);
await b.close();
