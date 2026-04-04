#!/usr/bin/env python3
"""Generate a factory maintenance manual PDF for RAG ingestion."""

import fitz  # PyMuPDF

MANUAL_CONTENT = {
    "Page 1 - General Maintenance Guidelines": """
ZEN-O FACTORY MAINTENANCE MANUAL — ARM Series Industrial Robots
Version 4.2 | Revision Date: 2025-12-01

SECTION 1: GENERAL MAINTENANCE GUIDELINES

1.1 Scheduled Maintenance Intervals
- Daily: Visual inspection of all cables, connectors, and pneumatic lines.
- Weekly: Lubricate all joint bearings using ISO VG-68 grade oil. Apply 15ml per joint.
- Monthly: Full vibration analysis using accelerometer at each joint axis.
- Quarterly: Replace air filters (Part# ZEN-AF-200). Torque housing bolts to 25 Nm.

1.2 Safety Lockout Procedures
Before any maintenance, engage LOTO (Lock Out / Tag Out):
1. Press E-STOP on the robot controller.
2. Disconnect pneumatic supply at valve block (Part# ZEN-PV-100).
3. Verify zero energy state with voltmeter at terminal block TB-1.
4. Apply personal lock and danger tag.

1.3 Emergency Procedures
If vibration exceeds 0.85g RMS: Immediately halt robot. Inspect main drive bearing
(Part# ZEN-BRG-500, SKF 6205-2RS). Check torque on mounting bolts: 45 Nm.
If temperature exceeds 85°C: Check coolant flow. Inspect thermal paste on servo motor.
Replace thermal compound (Part# ZEN-TC-300) if dried. Reapply at 0.5mm thickness.
""",

    "Page 2 - Vibration Fault Troubleshooting": """
SECTION 2: VIBRATION FAULT TROUBLESHOOTING

2.1 Vibration Fault Diagnosis
Root causes ranked by frequency:
1. Bearing wear (65% of cases) — Replace bearing Part# ZEN-BRG-500. Torque: 45 Nm.
2. Belt tension loss (20%) — Adjust drive belt tension to 4.5 kgf using tension gauge.
   Belt Part# ZEN-BLT-150. Expected lifetime: 8000 operating hours.
3. Shaft misalignment (10%) — Use laser alignment tool to achieve <0.05mm offset.
   Coupling Part# ZEN-CPL-250. Tighten coupling bolts to 35 Nm.
4. Gear mesh degradation (5%) — Inspect gear teeth for pitting. Replace gearbox 
   assembly Part# ZEN-GBX-400 if wear exceeds 0.1mm on tooth profile.

2.2 Vibration Threshold Reference
- Normal operation: 0.10 – 0.50g RMS
- Warning level: 0.50 – 0.70g RMS — Schedule maintenance within 48 hours
- Alert level: 0.70 – 0.85g RMS — Schedule maintenance within 8 hours
- Critical level: >0.85g RMS — IMMEDIATE STOP. Priority: P1-Critical.
  Estimated repair time: 2-4 hours including bearing replacement.

2.3 Bearing Replacement Procedure
1. Lock out robot per Section 1.2.
2. Remove joint cover (4x M6 bolts, 10 Nm).
3. Extract old bearing using puller tool ZEN-TOOL-BP1.
4. Clean shaft seat with isopropyl alcohol.
5. Press new bearing ZEN-BRG-500 using arbor press. Max force: 2.5 kN.
6. Apply grease: Mobilux EP2, 5ml per bearing.
7. Reassemble. Torque cover bolts to 10 Nm.
8. Run calibration cycle. Verify vibration <0.30g RMS.
""",

    "Page 3 - Overheating Troubleshooting": """
SECTION 3: OVERHEATING TROUBLESHOOTING

3.1 Temperature Fault Diagnosis
Root causes ranked by frequency:
1. Coolant system failure (40%) — Check coolant pump Part# ZEN-CP-150.
   Verify flow rate: minimum 2.5 L/min. Check for air locks in coolant lines.
2. Thermal paste degradation (30%) — Replace thermal compound Part# ZEN-TC-300.
   Apply 0.5mm layer between servo motor and heatsink. Torque heatsink bolts to 8 Nm.
3. Overload condition (20%) — Check duty cycle. Maximum continuous load: 85% rated.
   Reduce cycle time or payload if temperature persists above 80°C.
4. Fan failure (10%) — Replace cooling fan Part# ZEN-FAN-100. 12V DC, 0.3A.
   Ensure fan runs at minimum 3000 RPM. Clean dust filters weekly.

3.2 Temperature Threshold Reference
- Normal: 45°C – 70°C
- Warning: 70°C – 80°C — Reduce duty cycle to 70%. Check coolant level.
- Alert: 80°C – 85°C — Immediate duty cycle reduction to 50%. Priority: P2-High.
- Critical: >85°C — EMERGENCY SHUTDOWN. Priority: P1-Critical.
  Estimated repair time: 1-3 hours. Check all thermal management components.

3.3 Servo Motor Thermal Management
- Thermal paste replacement interval: every 2000 operating hours.
- Heatsink cleaning: monthly with compressed air at 4 bar.
- Coolant replacement: every 6 months. Use ZEN-COOL-500 (propylene glycol 50%).
""",

    "Page 4 - Motor Fault and Bearing Wear": """
SECTION 4: MOTOR FAULT AND BEARING WEAR

4.1 Motor Fault Diagnosis
Signs of impending motor failure:
- Current draw spike >15% above rated — Check winding insulation.
  Use megohmmeter: minimum 10 MΩ at 500V DC.
- Audible grinding — Bearing failure imminent. Replace within 24 hours.
- Intermittent torque loss — Check encoder (Part# ZEN-ENC-200).
  Verify encoder cable connector torque: 0.5 Nm.

4.2 Bearing Wear Indicators
- Energy consumption increase >20% baseline — Primary indicator of bearing wear.
  A motor drawing 23% more power typically has bearing degradation.
- Vibration spectral peak at bearing fault frequency (BPFO/BPFI).
- Temperature rise >10°C above normal operating temperature.
- Audible noise increase. Use ultrasonic detector at 40 kHz.

4.3 Preventive Replacement Schedule
- Main axis bearings: Replace every 12,000 hours. Part# ZEN-BRG-500.
- Secondary bearings: Replace every 20,000 hours. Part# ZEN-BRG-300.
- Drive belts: Replace every 8,000 hours. Part# ZEN-BLT-150.
- Gearbox oil: Change every 5,000 hours. Use ISO VG-320 gear oil, 1.2L.

4.4 Energy Efficiency Monitoring
- Baseline energy per robot: 7.0-9.0 kW during normal operation.
- Warning threshold: >12 kW sustained — Investigate mechanical resistance.
- Critical threshold: >15 kW — Immediate inspection required.
  Root cause is typically bearing seizure or gear mesh failure.
""",

    "Page 5 - Supply Chain and Material Safety": """
SECTION 5: SUPPLY CHAIN AND MATERIAL MANAGEMENT

5.1 Critical Material Thresholds
- Steel: Reorder at 10%. Minimum order: 2400 kg. Supplier: SUP-001.
  Lead time: 48 hours. Storage: Dry rack, max humidity 60%.
- Aluminum: Reorder at 10%. Minimum order: 1800 kg. Supplier: SUP-002.
  Lead time: 72 hours. Storage: Indoor rack, avoid contact with copper.
- Copper: Reorder at 15%. Minimum order: 600 kg. Supplier: SUP-003.
  Lead time: 96 hours. Storage: Sealed containers, anti-oxidation wrap.
- Rubber: Reorder at 20%. Minimum order: 400 kg. Supplier: SUP-004.
  Lead time: 24 hours. Storage: Cool, dark area. Max temp: 25°C.

5.2 Autonomous Ordering Protocol
When material level drops below threshold:
1. System generates Purchase Order automatically.
2. PO is hash-chained to audit log for tamper evidence.
3. Supplier notification sent via API integration.
4. Expected delivery tracked in purchase_order table.
5. Upon receipt, operator marks PO as FULFILLED.

5.3 Material Consumption Rates
Normal factory operation (8 robots, 3 shifts):
- Steel: 2.1% per hour (16.8% per shift)
- Aluminum: 1.4% per hour (11.2% per shift)
- Copper: 0.8% per hour (6.4% per shift)
- Rubber: 0.5% per hour (4.0% per shift)
"""
}


def create_pdf():
    doc = fitz.open()
    for title, content in MANUAL_CONTENT.items():
        page = doc.new_page(width=595, height=842)  # A4
        # Title
        page.insert_text((50, 50), title, fontsize=14, fontname="helv", color=(0.1, 0.2, 0.5))
        # Body text — split into lines that fit
        y = 80
        for line in content.strip().split("\n"):
            if y > 800:
                page = doc.new_page(width=595, height=842)
                y = 50
            page.insert_text((50, y), line.strip(), fontsize=9, fontname="helv")
            y += 14

    output_path = "manuals/zen_o_maintenance_manual.pdf"
    doc.save(output_path)
    doc.close()
    print(f"✓ Created {output_path} ({len(MANUAL_CONTENT)} pages)")


if __name__ == "__main__":
    create_pdf()
