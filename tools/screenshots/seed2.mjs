// Queries, forms and modules for the screenshot database.
const BASE = 'http://localhost:3100';
let cookie = '';
async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'webaccess', Cookie: cookie },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const set = res.headers.get('set-cookie');
  if (set) cookie = set.split(';')[0];
  const text = await res.text();
  let json; try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status} ${JSON.stringify(json).slice(0, 400)}`);
  return json;
}
await call('POST', '/api/auth/login', { username: 'admin', password: process.env.SEED_PW });

// ---------- queries ----------
await call('POST', '/api/queries', { query: { name: 'Spend by Type', design: {
  totals: true,
  tables: [{ name: 'Schemes', x: 20, y: 20 }, { name: 'SchemeTypes', x: 300, y: 40 }],
  joins: [{ from: { table: 'Schemes', field: 'SchemeType' }, to: { table: 'SchemeTypes', field: 'TypeName' }, type: 'inner' }],
  columns: [
    { field: 'SchemeType', table: 'Schemes', total: 'Group By', sort: 'Ascending', show: true, criteria: [] },
    { field: 'Schemes: ID', table: 'Schemes', total: 'Count', show: true, criteria: [] },
    { field: 'Estimate', table: 'Schemes', total: 'Sum', show: true, criteria: [] },
    { field: 'Actual', table: 'Schemes', total: 'Sum', show: true, criteria: [] },
    { field: 'DesignLife', table: 'SchemeTypes', total: 'Max', show: true, criteria: [] },
  ],
} } });

await call('POST', '/api/queries', { query: { name: 'Live Schemes', design: {
  tables: [{ name: 'Schemes', x: 20, y: 20 }],
  columns: [
    { field: 'SchemeRef', table: 'Schemes', show: true, criteria: [] },
    { field: 'Road', table: 'Schemes', show: true, criteria: [] },
    { field: 'Town', table: 'Schemes', show: true, criteria: [] },
    { field: 'Status', table: 'Schemes', show: true, criteria: ['"Approved" Or "On Site"', '"Planned"'] },
    { field: 'StartDate', table: 'Schemes', sort: 'Ascending', show: true, criteria: ['>=#01/09/2026#', ''] },
    { field: 'Estimate', table: 'Schemes', show: true, criteria: [] },
    { field: 'Weeks: DateDiff("ww",[StartDate],Date())', table: '', show: true, criteria: [] },
  ],
} } });

// ---------- forms ----------
await call('POST', '/api/forms', { form: {
  name: 'Defects Sub', recordSource: 'Defects', defaultView: 'datasheet', width: 520,
  sections: { header: { height: 0 }, detail: { height: 120 }, footer: { height: 0 } },
  controls: [
    { type: 'textbox', name: 'DefectRef', x: 110, y: 4, width: 90, height: 24, controlSource: 'DefectRef' },
    { type: 'combobox', name: 'Category', x: 110, y: 32, width: 150, height: 24, controlSource: 'Category', rowSourceType: 'Value List', rowSource: 'Pothole;Crack;Edge deterioration;Gully blocked;Ironwork' },
    { type: 'textbox', name: 'Severity', x: 110, y: 60, width: 60, height: 24, controlSource: 'Severity',
      conditions: [{ type: 'value', op: '=', value1: '3', bold: true, backColor: '#f8d7da', foreColor: '#9c1c28' }] },
    { type: 'textbox', name: 'Reported', x: 110, y: 88, width: 100, height: 24, controlSource: 'Reported', format: 'Short Date' },
    { type: 'checkbox', name: 'Repaired', x: 300, y: 4, width: 20, height: 20, controlSource: 'Repaired' },
  ],
} });

const lbl = (name, caption, x, y, w = 110) => ({ type: 'label', name, caption, x, y, width: w, height: 24, foreColor: '#44546a' });
await call('POST', '/api/forms', { form: {
  name: 'Scheme Details', caption: 'Scheme Details', recordSource: 'Schemes', defaultView: 'single', width: 900,
  sections: { header: { height: 64, backColor: '#1f4e3d' }, detail: { height: 470 }, footer: { height: 44, backColor: '#eef2ef' } },
  controls: [
    { section: 'header', type: 'label', name: 'lblTitle', caption: 'Highway Scheme', x: 16, y: 10, width: 300, height: 34, fontSize: 22, bold: true, foreColor: '#ffffff' },
    { section: 'header', type: 'textbox', name: 'txtHeadRef', controlSource: 'SchemeRef', x: 330, y: 16, width: 140, height: 28, fontSize: 16, bold: true, foreColor: '#ffffff', backColor: '#1f4e3d', locked: true },
    { section: 'header', type: 'button', name: 'cmdPrev', caption: '◀ Previous', x: 640, y: 16, width: 110, height: 30, onClick: { action: 'previousRecord' } },
    { section: 'header', type: 'button', name: 'cmdNext', caption: 'Next ▶', x: 760, y: 16, width: 110, height: 30, onClick: { action: 'nextRecord' } },
    lbl('lblRoad', 'Road', 16, 16), { type: 'textbox', name: 'Road', controlSource: 'Road', x: 130, y: 16, width: 280, height: 26 },
    lbl('lblTown', 'Town', 16, 50), { type: 'textbox', name: 'Town', controlSource: 'Town', x: 130, y: 50, width: 180, height: 26 },
    lbl('lblType', 'Scheme type', 16, 84), { type: 'combobox', name: 'SchemeType', controlSource: 'SchemeType', x: 130, y: 84, width: 180, height: 26, rowSourceType: 'Table/Query', rowSource: 'SchemeTypes', boundField: 'TypeName', displayField: 'TypeName' },
    lbl('lblStart', 'Start date', 16, 118), { type: 'textbox', name: 'StartDate', controlSource: 'StartDate', x: 130, y: 118, width: 120, height: 26, format: 'Short Date' },
    { type: 'optiongroup', name: 'Status', controlSource: 'Status', caption: 'Status', x: 450, y: 10, width: 200, height: 136, optionStyle: 'option',
      options: [{ label: 'Planned', value: 'Planned' }, { label: 'Approved', value: 'Approved' }, { label: 'On Site', value: 'On Site' }, { label: 'Complete', value: 'Complete' }] },
    lbl('lblEst', 'Estimate', 680, 16, 80), { type: 'textbox', name: 'Estimate', controlSource: 'Estimate', x: 760, y: 16, width: 110, height: 26, format: 'Currency', textAlign: 'right' },
    lbl('lblAct', 'Actual', 680, 50, 80), { type: 'textbox', name: 'Actual', controlSource: 'Actual', x: 760, y: 50, width: 110, height: 26, format: 'Currency', textAlign: 'right',
      conditions: [{ type: 'expression', expression: '[Actual] > [Estimate]', bold: true, foreColor: '#b42318', backColor: '#fde7e4' }] },
    lbl('lblVar', 'Variance', 680, 84, 80), { type: 'textbox', name: 'txtVariance', controlSource: '=IIf(IsNull([Actual]),"",Format(([Actual]-[Estimate])/[Estimate],"Percent"))', x: 760, y: 84, width: 110, height: 26, textAlign: 'right', locked: true },
    lbl('lblArea', 'Area (m²)', 680, 118, 80), { type: 'textbox', name: 'txtArea', controlSource: '=[LengthM]*[WidthM]', x: 760, y: 118, width: 110, height: 26, format: 'Standard', textAlign: 'right', locked: true },
    { type: 'tabcontrol', name: 'tabMain', x: 16, y: 164, width: 856, height: 296, pages: [{ caption: 'Defects' }, { caption: 'Notes' }] },
    { type: 'subform', name: 'subDefects', sourceObject: 'Defects Sub', linkMasterFields: 'ID', linkChildFields: 'SchemeID', x: 32, y: 204, width: 824, height: 240, parent: '__TAB__', page: 0 },
    { type: 'textbox', name: 'Notes', controlSource: 'Notes', x: 32, y: 204, width: 824, height: 240, multiline: true, parent: '__TAB__', page: 1 },
    { section: 'footer', type: 'button', name: 'cmdNew', caption: 'New scheme', x: 16, y: 8, width: 120, height: 28, onClick: { action: 'newRecord' } },
    { section: 'footer', type: 'button', name: 'cmdCheck', caption: 'Check budget', x: 146, y: 8, width: 130, height: 28 },
    { section: 'footer', type: 'button', name: 'cmdClose', caption: 'Close', x: 776, y: 8, width: 96, height: 28, onClick: { action: 'closeForm' } },
  ],
} }).then(async (r) => {
  // give the tab control a stable id and point its pages' controls at it
  const f = r.form;
  const tab = f.controls.find((c) => c.type === 'tabcontrol');
  for (const c of f.controls) if (c.name === 'subDefects' || c.name === 'Notes') { c.parent = tab.id; c.page = c.name === 'Notes' ? 1 : 0; }
  await call('PUT', '/api/forms/Scheme Details', { form: f });
});

await call('POST', '/api/forms', { form: {
  name: 'Scheme List', caption: 'Scheme List', recordSource: 'Schemes', defaultView: 'continuous', width: 1060,
  allowPivotTableView: true, allowPivotChartView: true,
  pivot: {
    rows: [{ field: 'SchemeType' }], columns: [{ field: 'StartDate', group: 'year' }, { field: 'StartDate', group: 'quarter' }],
    totals: [{ field: 'Estimate', fn: 'sum' }], filters: [{ field: 'Status' }],
    chart: { type: 'column-stacked', legend: true, axisTitles: true, gridlines: true },
  },
  sections: { header: { height: 70, backColor: '#1f4e3d' }, detail: { height: 34, alternateBackColor: '#f2f6f3' }, footer: { height: 40, backColor: '#eef2ef' } },
  controls: [
    { section: 'header', type: 'label', name: 'lblTitle', caption: 'Highway Schemes 2025–27', x: 12, y: 4, width: 420, height: 30, fontSize: 18, bold: true, foreColor: '#ffffff' },
    ...[['hRef', 'Ref', 12], ['hRoad', 'Road', 112], ['hTown', 'Town', 352], ['hType', 'Type', 492], ['hStatus', 'Status', 642], ['hStart', 'Start', 752], ['hEst', 'Estimate', 852]]
      .map(([name, caption, x]) => ({ section: 'header', type: 'label', name, caption, x, y: 42, width: 100, height: 22, bold: true, foreColor: '#d6e6dc', fontSize: 13 })),
    { type: 'textbox', name: 'SchemeRef', controlSource: 'SchemeRef', x: 12, y: 5, width: 94, height: 24 },
    { type: 'textbox', name: 'Road', controlSource: 'Road', x: 112, y: 5, width: 234, height: 24 },
    { type: 'textbox', name: 'Town', controlSource: 'Town', x: 352, y: 5, width: 134, height: 24 },
    { type: 'textbox', name: 'SchemeType', controlSource: 'SchemeType', x: 492, y: 5, width: 144, height: 24 },
    { type: 'textbox', name: 'Status', controlSource: 'Status', x: 642, y: 5, width: 104, height: 24, textAlign: 'center',
      conditions: [
        { type: 'value', op: '=', value1: '"Complete"', backColor: '#d9f0e1', foreColor: '#1e6b3a' },
        { type: 'value', op: '=', value1: '"On Site"', backColor: '#fff1cc', foreColor: '#8a5a00', bold: true },
        { type: 'value', op: '=', value1: '"Planned"', backColor: '#e3ecfa', foreColor: '#24508f' },
      ] },
    { type: 'textbox', name: 'StartDate', controlSource: 'StartDate', x: 752, y: 5, width: 94, height: 24, format: 'Short Date' },
    { type: 'textbox', name: 'Estimate', controlSource: 'Estimate', x: 852, y: 5, width: 190, height: 24, format: 'Currency', textAlign: 'right',
      conditions: [{ type: 'bar', barColor: '#7fb69a', shortest: { type: 'lowest' }, longest: { type: 'highest' } }] },
    { section: 'footer', type: 'label', name: 'lblTot', caption: 'Total estimate', x: 700, y: 8, width: 140, height: 24, bold: true, textAlign: 'right' },
    { section: 'footer', type: 'textbox', name: 'txtTotal', controlSource: '=Sum([Estimate])', x: 852, y: 8, width: 190, height: 24, format: 'Currency', textAlign: 'right', bold: true, locked: true },
  ],
} });

// ---------- code ----------
await call('PUT', '/api/modules/Form_Scheme Details', { kind: 'form', form: 'Scheme Details', code: `Option Compare Database
Option Explicit

Private Sub Form_Current()
    ' Lock completed schemes so the outturn can't be changed by accident
    Me.AllowEdits = (Me.Status <> "Complete")
    Me.lblTitle.Caption = "Highway Scheme  " & Nz(Me.Town, "")
End Sub

Private Sub cmdCheck_Click()
    Dim variance As Currency

    If IsNull(Me.Actual) Then
        MsgBox "No outturn cost yet for " & Me.SchemeRef, vbInformation, "Budget check"
        Exit Sub
    End If

    variance = Me.Actual - Me.Estimate
    If variance > 0 Then
        MsgBox "Over budget by " & Format(variance, "Currency") & _
               " (" & Format(variance / Me.Estimate, "0.0%") & ")", vbExclamation, "Budget check"
    Else
        MsgBox "Within budget. Saving: " & Format(-variance, "Currency"), vbInformation, "Budget check"
    End If
End Sub

Private Sub Estimate_AfterUpdate()
    Me.txtArea.Requery
End Sub
` });

await call('PUT', '/api/modules/Module1', { kind: 'standard', code: `Option Compare Database
Option Explicit

' Re-rates every planned scheme from the current SchemeTypes rates
Public Function RerateSchemes() As Long
    Dim db As DAO.Database
    Dim rs As DAO.Recordset
    Dim rate As Currency
    Dim n As Long

    Set db = CurrentDb
    Set rs = db.OpenRecordset("SELECT * FROM Schemes WHERE Status = 'Planned'")

    Do While Not rs.EOF
        rate = DLookup("RatePerSqM", "SchemeTypes", "TypeName = '" & rs!SchemeType & "'")
        rs.Edit
        rs!Estimate = Round(rs!LengthM * rs!WidthM * rate, -2)
        rs.Update
        n = n + 1
        rs.MoveNext
    Loop

    rs.Close
    RerateSchemes = n
End Function

Public Function DefectsOpen(SchemeID As Long) As Long
    DefectsOpen = DCount("*", "Defects", "SchemeID = " & SchemeID & " And Repaired = False")
End Function
` });

console.log('queries, forms and modules done');
