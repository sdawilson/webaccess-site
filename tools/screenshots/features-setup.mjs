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
