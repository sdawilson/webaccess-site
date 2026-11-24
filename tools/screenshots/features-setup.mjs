// For the pictures of the Barcode control and a server module ("stored procedures" on the site):
// a Product Label form with a QR code and a Code 128 barcode, and a server module, Stock.
// Used by shoot.mjs (group "features").

const LABEL_FORM = {
  name: 'Product Label', recordSource: 'Products', defaultView: 'single', width: 620, caption: 'Product label',
  sections: { header: { height: 0 }, detail: { height: 300 }, footer: { height: 0 } },
  controls: [
    { id: 'l1', type: 'label', name: 'lblName', caption: 'Product', x: 16, y: 20, width: 90, height: 24 },
    { id: 't1', type: 'textbox', name: 'txtName', controlSource: 'Product Name', x: 110, y: 20, width: 300, height: 26 },
    { id: 'l2', type: 'label', name: 'lblUnit', caption: 'Per unit', x: 16, y: 56, width: 90, height: 24 },
    { id: 't2', type: 'textbox', name: 'txtUnit', controlSource: 'Quantity Per Unit', x: 110, y: 56, width: 300, height: 26 },
    { id: 'q1', type: 'barcode', name: 'bcLink', barcodeType: 'qr', controlSource: '="https://fieldfare.example/product/" & [Product ID]', x: 16, y: 100, width: 170, height: 170 },
    { id: 'c1', type: 'barcode', name: 'bcCode', barcodeType: 'code128', controlSource: '="FF-" & Format([Product ID], "00000")', x: 220, y: 120, width: 300, height: 110 },
  ],
};

const STOCK = `Option Compare Database
Option Explicit

' Runs on the server, as one transaction: all of it happens, or none of it.
Public Function MarkForReorder(minimum As Long) As Long
    Dim rs As DAO.Recordset, n As Long
    Set rs = CurrentDb.OpenRecordset("SELECT * FROM Products WHERE Discontinued = False")
    Do Until rs.EOF
        If rs![Units In Stock] < minimum And rs![Reorder Level] < minimum Then
            rs.Edit
            rs![Reorder Level] = minimum
            rs.Update
            n = n + 1
        End If
        rs.MoveNext
    Loop
    Debug.Print n; "products marked for reorder by "; Application.CurrentUser
    MarkForReorder = n
End Function
`;

export async function setupFeatures(page) {
  const problems = await page.evaluate(async ({ form, stock }) => {
    const db = /^\/db\/(\w+)/.exec(location.pathname)?.[1];
    const H = { 'Content-Type': 'application/json', 'X-Requested-With': 'webaccess', ...(db ? { 'X-Database': db } : {}) };
    const call = async (m, u, b) => { const r = await fetch(u, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined }); let j = null; try { j = await r.json(); } catch { /* none */ } return { status: r.status, body: j }; };
    const out = [];
    const f = await call('POST', '/api/forms', { form });
    if (f.status >= 300 && f.status !== 409) out.push(`form: ${f.status} ${JSON.stringify(f.body)}`);
    const s = await call('PUT', '/api/modules/Stock', { kind: 'server', code: stock });
    if (s.status !== 200) out.push(`server module: ${s.status} ${JSON.stringify(s.body)}`);
    return out;
  }, { form: LABEL_FORM, stock: STOCK });
  if (problems.length) throw new Error('features set-up: ' + problems.join('; '));
  await page.reload();
  await page.waitForSelector('.nav-item');
}

// For the pictures of event procedures in Python and JavaScript: a Restock form on Products whose
// Current runs VBA, whose Load, BeforeUpdate and a button's Click run Python, and whose other
// button and Key Down run JavaScript. Used by shoot.mjs (group "events").
const RESTOCK_FORM = {
  name: 'Restock', recordSource: 'Products', defaultView: 'single', width: 640, caption: 'Restock',
  sections: { header: { height: 0 }, detail: { height: 250 }, footer: { height: 0 } },
  controls: [
    { id: 'r1', type: 'label', name: 'lblProduct', caption: 'Product', x: 16, y: 18, width: 110, height: 24 },
    { id: 'r2', type: 'textbox', name: 'txtProduct', controlSource: 'Product Name', x: 130, y: 16, width: 300, height: 26 },
    { id: 'r3', type: 'label', name: 'lblStock', caption: 'In stock', x: 16, y: 54, width: 110, height: 24 },
    { id: 'r4', type: 'textbox', name: 'txtStock', controlSource: 'Units In Stock', x: 130, y: 52, width: 100, height: 26 },
    { id: 'r5', type: 'label', name: 'lblLevel', caption: 'Reorder level', x: 16, y: 90, width: 110, height: 24 },
    { id: 'r6', type: 'textbox', name: 'txtLevel', controlSource: 'Reorder Level', x: 130, y: 88, width: 100, height: 26 },
    { id: 'r7', type: 'button', name: 'cmdReorder', caption: 'Reorder', x: 130, y: 132, width: 120, height: 30 },
    { id: 'r8', type: 'button', name: 'cmdSupplier', caption: 'Who supplies it?', x: 262, y: 132, width: 168, height: 30 },
    { id: 'r9', type: 'label', name: 'lblNote', caption: '', x: 130, y: 178, width: 480, height: 24 },
  ],
};

const RESTOCK_VBA = `Option Compare Database
Option Explicit

Private Sub Form_Current()
    Me.lblNote.Caption = ""
End Sub
`;

const RESTOCK_PY = `def Form_Load(form):
    form.Caption = f"Restock: {DCount('*', 'Products', 'Discontinued = False')} products"

def txtStock_BeforeUpdate(form, event):
    if form.txtStock.Value is not None and form.txtStock.Value < 0:
        form.lblNote.Caption = "Stock can't go below zero"
        event.Cancel = True

def cmdReorder_Click(form):
    need = max((form.txtLevel.Value or 10) * 2 - (form.txtStock.Value or 0), 0)
    sold = DSum("Quantity", "[Order Details]", f"[Product ID] = {form.record['Product ID']}") or 0
    answer = MsgBox(f"Order {need} more {form.txtProduct.Value}? {sold} sold so far.",
                    vbYesNo + vbQuestion, "Restock")
    if answer == vbYes:
        form.txtStock.Value = form.txtStock.Value + need
        form.lblNote.Caption = f"Ordered {need}"
`;

const RESTOCK_JS = `export async function cmdSupplier_Click(form) {
  const id = form.record['Supplier ID'];
  const name = await DLookup('Company', 'Suppliers', \`[Supplier ID] = \${id}\`);
  form.controls.lblNote.Caption = \`Supplied by \${name}\`;
}

export function Form_KeyDown(form, event) {
  if (event.KeyCode === 113) event.KeyCode = 0;   // F2 does nothing here
}
`;

export async function setupEvents(page) {
  const problems = await page.evaluate(async ({ form, vba, py, js }) => {
    const db = /^\/db\/(\w+)/.exec(location.pathname)?.[1];
    const H = { 'Content-Type': 'application/json', 'X-Requested-With': 'webaccess', ...(db ? { 'X-Database': db } : {}) };
    const call = async (m, u, b) => { const r = await fetch(u, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined }); let j = null; try { j = await r.json(); } catch { /* none */ } return { status: r.status, body: j }; };
    const out = [];
    const f = await call('POST', '/api/forms', { form });
    if (f.status >= 300 && f.status !== 409) out.push(`form: ${f.status} ${JSON.stringify(f.body)}`);
    for (const [name, code, language] of [['Form_Restock', vba, null], ['Form_Restock.py', py, 'py'], ['Form_Restock.js', js, 'js']]) {
      const r = await call('PUT', `/api/modules/${encodeURIComponent(name)}`, { kind: 'form', form: 'Restock', code, ...(language ? { language } : {}) });
      if (r.status !== 200) out.push(`${name}: ${r.status} ${JSON.stringify(r.body)}`);
    }
    return out;
  }, { form: RESTOCK_FORM, vba: RESTOCK_VBA, py: RESTOCK_PY, js: RESTOCK_JS });
  if (problems.length) throw new Error('events set-up: ' + problems.join('; '));
  await page.reload();
  await page.waitForSelector('.nav-item');
}
