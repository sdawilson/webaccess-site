// What the code video and its screenshots need in the sample that it doesn't have: a class with a
// constructor, a module using the language additions, Python and JavaScript modules, a form that
// shows a Matplotlib chart, the Orders form passing itself to Python, and the libraries ticked.
// Used by film-code.mjs and tools/screenshots/shoot.mjs (group "code").

const HEADER = 'Option Compare Database\nOption Explicit\n\n';

export const MODULES = {
  Customer: { kind: 'class', code: `${HEADER}Public Name As String
Private mLimit As Currency

Public Sub New(customerName As String, creditLimit As Currency)
    Name = customerName
    mLimit = creditLimit
End Sub

Public Function OverLimit(amount As Currency) As Boolean
    Return mLimit > 0 AndAlso amount > mLimit
End Function
` },
  ModernVBA: { kind: 'standard', code: `${HEADER}Sub OrdersSoFar()
    Dim c As New Customer("Abbey Mill Delicatessen", 400)
    Dim total As Currency = 0, orders As Long = 0
    Dim amounts As Variant = Array(120, 95, 0, 210)

    SortArray amounts, Function(a, b) b - a
    For Each amount As Variant In amounts
        If amount = 0 Then Continue For
        total += amount
        orders += 1
    Next

    Try
        Debug.Print $"{c.Name} has ordered {total:Currency}"
        Debug.Print $"Largest {amounts(0):Currency}, average {total / orders:Currency}"
    Catch When Err.Number = 11
        Debug.Print "No orders yet"
    Finally
        Debug.Print If(c.OverLimit(total), "Over the credit limit", "Within the credit limit")
    End Try
End Sub
` },
  Summary: { kind: 'py', code: `import statistics

def describe(values):
    return f"middle {statistics.median(values):.2f}, spread {statistics.stdev(values):.2f}"

def title_case(text):
    return " ".join(word.capitalize() for word in text.split())
` },
  OrderMaths: { kind: 'py', code: `import pandas as pd

def line_summary(form):
    lines = pd.DataFrame(form.controls["OrderLines"].form.rows)
    if lines.empty:
        form.lblLines.caption = "Order lines: none yet"
        return 0
    net = (lines["Unit Price"] * lines["Quantity"] * (1 - lines["Discount"])).sum()
    form.lblLines.caption = f"Order lines: {len(lines)}, {lines['Quantity'].sum()} items, net £{net:,.2f}"
    return net
` },
  Charts: { kind: 'py', code: `import matplotlib.pyplot as plt

def sales_by_category(rows):
    fig, ax = plt.subplots(figsize=(6, 3.2))
    ax.barh([r["Category Name"] for r in rows], [r["Sales"] for r in rows], color="#2f7d4f")
    ax.set_xlabel("Sales")
    ax.xaxis.set_major_formatter("£{x:,.0f}")
    ax.spines[["top", "right"]].set_visible(False)
    fig.tight_layout()
    return fig
` },
  Text: { kind: 'js', code: `export function initials(name) {
  return name.split(/\\s+/).map((word) => word[0].toUpperCase()).join('');
}
` },
};

export const CHART_FORM = {
  name: 'Python Chart', defaultView: 'single', width: 640, caption: 'Sales by category',
  sections: { header: { height: 0 }, detail: { height: 340 }, footer: { height: 0 } },
  controls: [
    { id: 'p1', type: 'image', name: 'imgChart', x: 16, y: 16, width: 600, height: 310, sizeMode: 'zoom' },
  ],
};

const CHART_CODE = `${HEADER}Private Sub Form_Load()
    Me.imgChart.PictureData = Charts.sales_by_category(CurrentDb.OpenRecordset( _
        "SELECT [Category Name], Sum([Total Sales]) AS Sales FROM [Product Sales] " & _
        "GROUP BY [Category Name] ORDER BY Sum([Total Sales])"))
End Sub
`;

export const REFERENCES = ['py-numpy', 'py-pandas', 'py-matplotlib', 'stats', 'dates', 'fuzzy'];

// Runs in the page (signed in, a database open).
export async function setupCode(page) {
  const problems = await page.evaluate(async ({ modules, chartForm, chartCode, refs }) => {
    const db = /^\/db\/(\w+)/.exec(location.pathname)?.[1];
    const H = { 'Content-Type': 'application/json', 'X-Requested-With': 'webaccess', ...(db ? { 'X-Database': db } : {}) };
    const call = async (m, u, b) => { const r = await fetch(u, { method: m, headers: H, body: b ? JSON.stringify(b) : undefined }); let j = null; try { j = await r.json(); } catch { /* none */ } return { status: r.status, body: j }; };
    const out = [];
    for (const [name, m] of Object.entries(modules)) {
      const r = await call('PUT', `/api/modules/${encodeURIComponent(name)}`, m);
      if (r.status !== 200) out.push(`${name}: ${r.status} ${JSON.stringify(r.body)}`);
    }
    const f = await call('POST', '/api/forms', { form: chartForm });
    if (f.status >= 300 && f.status !== 409) out.push(`form: ${f.status} ${JSON.stringify(f.body)}`);
    const c = await call('PUT', `/api/modules/${encodeURIComponent('Form_Python Chart')}`, { kind: 'form', form: 'Python Chart', code: chartCode });
    if (c.status !== 200) out.push(`chart code: ${c.status} ${JSON.stringify(c.body)}`);
    // the Orders form passes itself to Python as each record comes up
    const o = await call('GET', `/api/modules/${encodeURIComponent('Form_Orders')}`);
    let code = o.body?.module?.code ?? o.body?.code ?? '';
    if (!code.includes('OrderMaths.line_summary')) {
      code = code.replace(/Private Sub Form_Current\(\)\n/, 'Private Sub Form_Current()\n    OrderMaths.line_summary Me\n');
      const w = await call('PUT', `/api/modules/${encodeURIComponent('Form_Orders')}`, { kind: 'form', form: 'Orders', code });
      if (w.status !== 200) out.push(`orders code: ${w.status} ${JSON.stringify(w.body)}`);
    }
    // the label the Python writes to is sized for its own caption: give it the width of the form
    const fu = `/api/forms/${encodeURIComponent('Orders')}`;
    const fg = await call('GET', fu); const def = fg.body?.form || fg.body;
    const lbl = def?.controls?.find((x) => x.name === 'lblLines');
    if (lbl && lbl.width < 600) { lbl.width = 620; const fw = await call('PUT', fu, { form: def }); if (fw.status !== 200) out.push(`orders form: ${fw.status}`); }
    const r = await call('PUT', '/api/references', { references: refs });
    if (r.status !== 200) out.push(`references: ${r.status} ${JSON.stringify(r.body)}`);
    const s = await call('PUT', '/api/startup', { loadPython: true, additionNotes: false });
    if (s.status !== 200) out.push(`startup: ${s.status} ${JSON.stringify(s.body)}`);
    return out;
  }, { modules: MODULES, chartForm: CHART_FORM, chartCode: CHART_CODE, refs: REFERENCES });
  if (problems.length) throw new Error('code set-up: ' + problems.join('; '));
  await page.reload();
  await page.waitForSelector('.nav-item');
}
