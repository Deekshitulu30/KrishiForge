import io
import json
import logging
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

logger = logging.getLogger(__name__)

def generate_plan_pdf(plan_record, submission, plot) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=20,
        leading=24,
        textColor=colors.HexColor('#090C0E')
    )
    subtitle_style = ParagraphStyle(
        'DocSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=13,
        textColor=colors.HexColor('#475569')
    )
    section_heading = ParagraphStyle(
        'SectionHeading',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=colors.HexColor('#0F172A'),
        spaceBefore=10,
        spaceAfter=4
    )
    body_style = ParagraphStyle(
        'BodyText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#1E293B')
    )
    bold_body = ParagraphStyle(
        'BoldBodyText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=colors.HexColor('#0F172A')
    )

    elements = []

    # Title & Branding
    elements.append(Paragraph("KRISHIFORGE AI — REGENERATIVE FARMING ADVISORY", title_style))
    elements.append(Paragraph("Automated Diagnostic & Regenerative Action Plan Report", subtitle_style))
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#D4F700'), spaceAfter=12))

    # Farm Plot Metadata Table
    meta_data = [
        [
            Paragraph("<b>Crop:</b> " + (plot.crop_name if plot else "N/A"), body_style),
            Paragraph("<b>Soil Type:</b> " + (plot.soil_type if plot else "N/A"), body_style),
            Paragraph("<b>Area:</b> " + (str(plot.area_acres) if plot else "N/A") + " Acres", body_style)
        ],
        [
            Paragraph("<b>Location:</b> " + (f"{plot.latitude}, {plot.longitude}" if plot else "N/A"), body_style),
            Paragraph("<b>Soil Moisture:</b> " + (f"{submission.soil_moisture_percent}%" if submission else "N/A"), body_style),
            Paragraph("<b>Last Irrigation:</b> " + (str(submission.last_irrigation_date) if submission else "N/A"), body_style)
        ]
    ]

    meta_table = Table(meta_data, colWidths=[180, 180, 180])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#F8FAFC')),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('BOX', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 10))

    # Parse Plan Content
    try:
        plan_dict = json.loads(plan_record.plan_text)
    except Exception:
        plan_dict = {"diagnosis_summary": plan_record.plan_text}

    # 1. Diagnosis & Weather Summary
    elements.append(Paragraph("1. Field Diagnosis & Weather Risk Summary", section_heading))
    diag_text = plan_dict.get("diagnosis_summary", "N/A")
    weather_text = plan_dict.get("weather_risk_summary", "N/A")
    elements.append(Paragraph(f"<b>Leaf Diagnosis:</b> {diag_text}", body_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(f"<b>Weather & Risk Assessment:</b> {weather_text}", body_style))
    elements.append(Spacer(1, 8))

    # 2. Immediate Actions
    elements.append(Paragraph("2. Immediate 24–48 Hour Emergency Actions", section_heading))
    imm_actions = plan_dict.get("immediate_actions", [])
    if isinstance(imm_actions, list):
        for act in imm_actions:
            elements.append(Paragraph(f"• {act}", body_style))
    else:
        elements.append(Paragraph(str(imm_actions), body_style))
    elements.append(Spacer(1, 8))

    # 3. Soil Moisture Plan
    elements.append(Paragraph("3. Soil & Moisture Management Plan", section_heading))
    elements.append(Paragraph(plan_dict.get("soil_moisture_plan", "N/A"), body_style))
    elements.append(Spacer(1, 8))

    # 4. 4-Week Timeline Table
    elements.append(Paragraph("4. 4-Week Regenerative Care Timeline", section_heading))
    timeline_data = [[Paragraph("<b>Week</b>", bold_body), Paragraph("<b>Recommended Actions & Inputs</b>", bold_body)]]
    weekly_timeline = plan_dict.get("weekly_timeline", [])
    for idx, wk in enumerate(weekly_timeline):
        w_num = str(wk.get("week", idx + 1))
        w_actions = wk.get("actions", [])
        act_str = "<br/>".join([f"• {a}" for a in w_actions]) if isinstance(w_actions, list) else str(w_actions)
        timeline_data.append([
            Paragraph(f"Week {w_num}", bold_body),
            Paragraph(act_str, body_style)
        ])

    if len(timeline_data) > 1:
        timeline_table = Table(timeline_data, colWidths=[80, 460])
        timeline_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#F1F5F9')),
            ('PADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#CBD5E1')),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        elements.append(timeline_table)
    elements.append(Spacer(1, 10))

    # 5. Low-Cost Bio Inputs & Budget
    elements.append(Paragraph("5. Low-Cost Bio-Inputs & Budget Estimate", section_heading))
    bio_inputs = plan_dict.get("bio_inputs", [])
    bio_str = ", ".join(bio_inputs) if isinstance(bio_inputs, list) else str(bio_inputs)
    elements.append(Paragraph(f"<b>Sourceable Bio-Inputs:</b> {bio_str}", body_style))
    elements.append(Spacer(1, 4))
    elements.append(Paragraph(f"<b>Budget & Resource Effort:</b> {plan_dict.get('budget_estimate', 'N/A')}", body_style))
    elements.append(Spacer(1, 8))

    # 6. Confidence Note
    elements.append(Paragraph("6. Diagnostic Confidence & Limitations Note", section_heading))
    elements.append(Paragraph(f"<i>{plan_dict.get('confidence_notes', 'N/A')}</i>", body_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
