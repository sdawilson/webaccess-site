// A "Scheme Explorer" form for the screenshots: an ImageList, a TreeView of scheme types and
// schemes, and a ListView (Report view) of the chosen type's schemes, filled by VBA as an Access
// developer would. Run after seed.mjs and seed2.mjs.
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

const svg = (body) => 'data:image/svg+xml;base64,' + Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16">${body}</svg>`).toString('base64');
const images = [
  { key: 'folder', picture: svg('<path d="M1 4.5a1 1 0 0 1 1-1h4l1.5 1.5H14a1 1 0 0 1 1 1V12a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z" fill="#e9b520" stroke="#8a6a00" stroke-width=".8"/>') },
  { key: 'open', picture: svg('<path d="M1 4.5a1 1 0 0 1 1-1h4l1.5 1.5H13a1 1 0 0 1 1 1V7H4.2L2.2 12.5H2a1 1 0 0 1-1-1z" fill="#d9a514" stroke="#8a6a00" stroke-width=".8"/><path d="M4.2 7H15l-2 5.5H2.2z" fill="#f2c94c" stroke="#8a6a00" stroke-width=".8"/>') },
  { key: 'road', picture: svg('<path d="M5.5 1h5l3 14h-11z" fill="#4c5e55"/><path d="M8 2.5v2.5M8 7v2.5M8 11.5V14" stroke="#fff" stroke-width="1.2"/>') },
  { key: 'all', picture: svg('<rect x="1.5" y="2" width="13" height="12" rx="1.5" fill="#1f4e3d"/><path d="M4 5.5h8M4 8h8M4 10.5h5" stroke="#fff" stroke-width="1.2"/>') },
];

await call('DELETE', '/api/forms/Scheme Explorer').catch(() => {});
await call('POST', '/api/forms', { form: {
  name: 'Scheme Explorer', caption: 'Scheme Explorer', recordSource: '', defaultView: 'single', width: 1060,
  navigationButtons: false, recordSelectors: false,
  sections: { header: { height: 64, backColor: '#1f4e3d' }, detail: { height: 470 }, footer: { height: 0 } },
  controls: [
    { section: 'header', type: 'label', name: 'lblTitle', caption: 'Scheme Explorer', x: 16, y: 12, width: 400, height: 36, fontSize: 22, bold: true, foreColor: '#ffffff' },
    { type: 'imagelist', name: 'imgIcons', x: 16, y: 440, width: 32, height: 32, imageWidth: 16, imageHeight: 16, images },
    { type: 'label', name: 'lblTree', caption: 'Scheme types', x: 16, y: 12, width: 300, height: 22, bold: true, foreColor: '#4c5e55' },
    { type: 'treeview', name: 'tvSchemes', x: 16, y: 38, width: 330, height: 396, style: 7, lineStyle: 1, imageList: 'imgIcons', hideSelection: false, fullRowSelect: false },
    { type: 'label', name: 'lblList', caption: 'Schemes', x: 366, y: 12, width: 400, height: 22, bold: true, foreColor: '#4c5e55' },
    { type: 'listview', name: 'lvSchemes', x: 366, y: 38, width: 678, height: 396, view: 3, fullRowSelect: true, gridLines: true, hideSelection: false, smallIcons: 'imgIcons',
      columns: [
        { text: 'Ref', key: 'ref', width: 110 },
        { text: 'Road', key: 'road', width: 210 },
        { text: 'Town', key: 'town', width: 120 },
        { text: 'Status', key: 'status', width: 90 },
        { text: 'Estimate', key: 'est', width: 120, alignment: 1 },
      ] },
  ],
} });

await call('PUT', '/api/modules/Form_Scheme Explorer', { kind: 'form', form: 'Scheme Explorer', code: `Option Compare Database
Option Explicit

Private Sub Form_Load()
    Dim rs As DAO.Recordset, nd As Object
    With Me.tvSchemes.Nodes
        .Clear
        .Add , , "ALL", "All scheme types", "all"
        Set rs = CurrentDb.OpenRecordset("SELECT TypeName FROM SchemeTypes ORDER BY TypeName")
        Do While Not rs.EOF
            Set nd = .Add("ALL", tvwChild, "T " & rs!TypeName, rs!TypeName, "folder")
            nd.ExpandedImage = "open"
            nd.Tag = rs!TypeName
            rs.MoveNext
        Loop
        rs.Close
        Set rs = CurrentDb.OpenRecordset("SELECT ID, SchemeRef, Road, SchemeType FROM Schemes ORDER BY SchemeRef")
        Do While Not rs.EOF
            .Add "T " & rs!SchemeType, tvwChild, "S" & rs!ID, rs!SchemeRef & "  " & rs!Road, "road"
            rs.MoveNext
        Loop
        rs.Close
        .Item("ALL").Expanded = True
        .Item("T Resurfacing").Expanded = True
        .Item("T Resurfacing").Selected = True
    End With
    ShowSchemes "Resurfacing"
End Sub

' Lists one type's schemes in the ListView
Private Sub ShowSchemes(SchemeType As String)
    Dim rs As DAO.Recordset, itm As Object
    Me.lvSchemes.ListItems.Clear
    Set rs = CurrentDb.OpenRecordset("SELECT * FROM Schemes WHERE SchemeType = '" & SchemeType & "' ORDER BY StartDate")
    Do While Not rs.EOF
        Set itm = Me.lvSchemes.ListItems.Add(, "S" & rs!ID, rs!SchemeRef, , "road")
        itm.SubItems(1) = rs!Road
        itm.SubItems(2) = rs!Town
        itm.SubItems(3) = rs!Status
        itm.SubItems(4) = Format(rs!Estimate, "Currency")
        If rs!Status = "Planned" Then itm.Bold = True
        rs.MoveNext
    Loop
    rs.Close
    Me.lblList.Caption = SchemeType & " schemes (" & Me.lvSchemes.ListItems.Count & ")"
End Sub

Private Sub tvSchemes_NodeClick(ByVal Node As Object)
    If Node.Tag <> "" Then ShowSchemes Node.Tag
End Sub
` });
console.log('scheme explorer done');
