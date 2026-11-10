import com.healthmarketscience.jackcess.*;
import java.io.File;
import java.math.BigDecimal;
import java.util.*;

/** Builds "Highway Maintenance.accdb": a small, made-up highways database for the demo film's import scene. */
public class MakeHighways {
  static final Random R = new Random(2026);
  static final String[] TOWNS = { "Ashby", "Barton", "Castleford", "Denby", "Elmbridge", "Fairford", "Grantley", "Hawksworth", "Ilkley", "Kirkby" };
  static final String[] ROAD_NAMES = { "High Street", "Station Road", "Mill Lane", "Church Street", "Bridge Road", "Market Place", "London Road", "Moor Lane", "Park Avenue", "Canal Street", "Queensway", "The Avenue" };
  static final String[] DEFECT_TYPES = { "Pothole", "Crack", "Rutting", "Edge deterioration", "Sunken ironwork", "Blocked gully", "Faded markings", "Damaged kerb" };
  static final String[] SEVERITY = { "Category 1", "Category 2 High", "Category 2 Medium", "Category 2 Low" };
  static final String[] SCHEME_TYPES = { "Resurfacing", "Surface dressing", "Micro-asphalt", "Patching", "Drainage", "Footway reconstruction", "Structural maintenance" };
  static final String[] STATUS = { "Proposed", "Approved", "Programmed", "In progress", "Complete" };
  static final String[] INSPECTORS = { "A. Khan", "B. Lewis", "C. Morgan", "D. Patel", "E. Rowe" };
  static final String[][] CONTRACTORS = {
    { "Northern Surfacing Ltd", "01423 555 010", "office@northernsurfacing.example" },
    { "Dales Highways", "01756 555 020", "works@daleshighways.example" },
    { "Riverside Civils", "01977 555 030", "enquiries@riversidecivils.example" },
    { "Greenway Drainage", "01943 555 040", "jobs@greenwaydrainage.example" },
    { "Kerbline Contractors", "01132 555 050", "hello@kerbline.example" },
    { "Pennine Resurfacing", "01484 555 060", "contact@pennineresurfacing.example" } };

  static Date date(int y, int m, int d) { Calendar c = Calendar.getInstance(); c.clear(); c.set(y, m - 1, d); return c.getTime(); }
  static Date randomDate(int a, int b) { return date(a + R.nextInt(b - a + 1), 1 + R.nextInt(12), 1 + R.nextInt(28)); }
  static <T> T pick(T[] a) { return a[R.nextInt(a.length)]; }
  static BigDecimal money(double v) { return BigDecimal.valueOf(Math.round(v * 100) / 100.0); }
  static ColumnBuilder txt(String n, int len) { return new ColumnBuilder(n, DataType.TEXT).setLengthInUnits(len); }

  public static void main(String[] args) throws Exception {
    File out = new File(args[0]);
    out.delete();
    Database db = DatabaseBuilder.create(Database.FileFormat.V2010, out);

    Table contractors = new TableBuilder("Contractors")
      .addColumn(new ColumnBuilder("Contractor ID", DataType.LONG).setAutoNumber(true))
      .addColumn(txt("Contractor", 100)).addColumn(txt("Phone", 30)).addColumn(txt("Email", 100))
      .addColumn(new ColumnBuilder("Framework", DataType.BOOLEAN))
      .setPrimaryKey("Contractor ID").toTable(db);
    for (String[] c : CONTRACTORS) contractors.addRow(Column.AUTO_NUMBER, c[0], c[1], c[2], R.nextInt(3) > 0);

    Table roads = new TableBuilder("Roads")
      .addColumn(new ColumnBuilder("Road ID", DataType.LONG).setAutoNumber(true))
      .addColumn(txt("Road Number", 10)).addColumn(txt("Road Name", 80)).addColumn(txt("Town", 50)).addColumn(txt("Class", 20))
      .addColumn(new ColumnBuilder("Length (km)", DataType.DOUBLE))
      .addColumn(txt("Hierarchy", 30))
      .addColumn(new ColumnBuilder("Last Resurfaced", DataType.SHORT_DATE_TIME))
      .setPrimaryKey("Road ID").toTable(db);
    int nRoads = 48;
    for (int i = 0; i < nRoads; i++) {
      String cls; String num; int k = R.nextInt(10);
      if (k < 2) { cls = "A"; num = "A" + (600 + R.nextInt(80)); }
      else if (k < 5) { cls = "B"; num = "B" + (6100 + R.nextInt(300)); }
      else if (k < 7) { cls = "C"; num = "C" + (100 + R.nextInt(400)); }
      else { cls = "Unclassified"; num = "U" + (1000 + R.nextInt(800)); }
      String hier = cls.equals("A") ? "Strategic route" : cls.equals("B") ? "Main distributor" : cls.equals("C") ? "Secondary distributor" : (R.nextBoolean() ? "Link road" : "Local access road");
      roads.addRow(Column.AUTO_NUMBER, num, pick(ROAD_NAMES), pick(TOWNS), cls, Math.round((0.3 + R.nextDouble() * 6.5) * 100) / 100.0, hier, randomDate(2012, 2025));
    }

    Table schemes = new TableBuilder("Schemes")
      .addColumn(new ColumnBuilder("Scheme ID", DataType.LONG).setAutoNumber(true))
      .addColumn(txt("Scheme", 120))
      .addColumn(new ColumnBuilder("Road ID", DataType.LONG))
      .addColumn(txt("Treatment", 40))
      .addColumn(new ColumnBuilder("Length (m)", DataType.LONG))
      .addColumn(new ColumnBuilder("Estimate", DataType.MONEY))
      .addColumn(new ColumnBuilder("Start Date", DataType.SHORT_DATE_TIME))
      .addColumn(txt("Status", 20))
      .addColumn(new ColumnBuilder("Contractor ID", DataType.LONG))
      .addColumn(new ColumnBuilder("Notes", DataType.MEMO))
      .setPrimaryKey("Scheme ID").toTable(db);
    for (int i = 0; i < 72; i++) {
      String t = pick(SCHEME_TYPES); int len = 80 + R.nextInt(1900);
      double rate = t.equals("Resurfacing") ? 95 : t.equals("Surface dressing") ? 14 : t.equals("Micro-asphalt") ? 22 : t.equals("Patching") ? 60 : t.equals("Drainage") ? 40 : t.equals("Footway reconstruction") ? 70 : 150;
      schemes.addRow(Column.AUTO_NUMBER, t + ", " + pick(ROAD_NAMES) + ", " + pick(TOWNS), 1 + R.nextInt(nRoads), t, len, money(len * rate * (0.8 + R.nextDouble() * 0.5)), randomDate(2025, 2027), pick(STATUS), 1 + R.nextInt(CONTRACTORS.length), R.nextInt(4) == 0 ? "Night working agreed with residents. Diversion via " + pick(ROAD_NAMES) + "." : null);
    }

    Table defects = new TableBuilder("Defects")
      .addColumn(new ColumnBuilder("Defect ID", DataType.LONG).setAutoNumber(true))
      .addColumn(new ColumnBuilder("Road ID", DataType.LONG))
      .addColumn(txt("Location", 120)).addColumn(txt("Defect Type", 40)).addColumn(txt("Severity", 30))
      .addColumn(new ColumnBuilder("Reported", DataType.SHORT_DATE_TIME))
      .addColumn(new ColumnBuilder("Repaired", DataType.BOOLEAN))
      .addColumn(new ColumnBuilder("Repair Cost", DataType.MONEY))
      .addColumn(txt("Inspector", 40))
      .setPrimaryKey("Defect ID").toTable(db);
    for (int i = 0; i < 420; i++) {
      boolean rep = R.nextInt(10) < 7; String type = pick(DEFECT_TYPES);
      double cost = type.equals("Pothole") ? 60 + R.nextInt(140) : type.equals("Blocked gully") ? 40 + R.nextInt(60) : 90 + R.nextInt(600);
      defects.addRow(Column.AUTO_NUMBER, 1 + R.nextInt(nRoads), "Outside no. " + (1 + R.nextInt(140)) + ", " + (R.nextBoolean() ? "nearside" : "offside") + " lane", type, pick(SEVERITY), randomDate(2025, 2026), rep, rep ? money(cost) : null, pick(INSPECTORS));
    }

    Table inspections = new TableBuilder("Inspections")
      .addColumn(new ColumnBuilder("Inspection ID", DataType.LONG).setAutoNumber(true))
      .addColumn(new ColumnBuilder("Road ID", DataType.LONG))
      .addColumn(new ColumnBuilder("Inspected", DataType.SHORT_DATE_TIME))
      .addColumn(txt("Inspector", 40))
      .addColumn(new ColumnBuilder("Condition Score", DataType.LONG))
      .addColumn(new ColumnBuilder("Skid Resistance", DataType.DOUBLE))
      .addColumn(new ColumnBuilder("Comments", DataType.MEMO))
      .setPrimaryKey("Inspection ID").toTable(db);
    for (int i = 0; i < 240; i++)
      inspections.addRow(Column.AUTO_NUMBER, 1 + R.nextInt(nRoads), randomDate(2024, 2026), pick(INSPECTORS), 1 + R.nextInt(5), Math.round((0.35 + R.nextDouble() * 0.3) * 100) / 100.0, R.nextInt(3) == 0 ? "Standing water at the low point after rain." : null);

    new RelationshipBuilder(roads, schemes).addColumns(roads.getColumn("Road ID"), schemes.getColumn("Road ID")).setReferentialIntegrity().toRelationship(db);
    new RelationshipBuilder(roads, defects).addColumns(roads.getColumn("Road ID"), defects.getColumn("Road ID")).setReferentialIntegrity().toRelationship(db);
    new RelationshipBuilder(roads, inspections).addColumns(roads.getColumn("Road ID"), inspections.getColumn("Road ID")).setReferentialIntegrity().toRelationship(db);
    new RelationshipBuilder(contractors, schemes).addColumns(contractors.getColumn("Contractor ID"), schemes.getColumn("Contractor ID")).setReferentialIntegrity().toRelationship(db);
    db.close();
    System.out.println("Wrote " + out + " (" + out.length() + " bytes)");
  }
}
