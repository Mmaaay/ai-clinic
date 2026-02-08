"use server";
import { db } from "@/drizzle/db";
import { eq } from "drizzle-orm";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFPage,
  type PDFFont,
} from "pdf-lib";
import { patientAllergies } from "@/drizzle/schemas/medical-background/patient_allergies";
import { patientConditions } from "@/drizzle/schemas/medical-background/patient_conditions";
import { patientMedications } from "@/drizzle/schemas/medical-background/patient_medications";
import { patientSocialHistory } from "@/drizzle/schemas/medical-background/patient_social_history";
import { patientFollowups } from "@/drizzle/schemas/patient_follow-up";
import { patientImaging } from "@/drizzle/schemas/patient_images";
import { patientLabs } from "@/drizzle/schemas/patient_labs";
import { patientNotes } from "@/drizzle/schemas/patient_notes";
import { patients } from "@/drizzle/schemas/patient_patients";
import { patientSurgeries } from "@/drizzle/schemas/patient_surgeries";
import { patientVisits } from "@/drizzle/schemas/patient_visits";

export type backGroundDataReturnType = {
  overview: boolean;
  background: boolean;
  surgery: boolean;
  followUp: boolean;
  imaging: boolean;
  labs: boolean;
  notes: boolean;
  visits: boolean;
};

export async function backgroundDataExists(
  patientId?: string,
): Promise<backGroundDataReturnType> {
  if (typeof patientId !== "string" || patientId.trim().length === 0) {
    return {
      overview: false,
      background: false,
      surgery: false,
      followUp: false,
      imaging: false,
      labs: false,
      notes: false,
      visits: false,
    };
  }
  const [
    overview,
    allergies,
    conditions,
    medications,
    surgery,
    followUp,
    imaging,
    labs,
    notes,
    visits,
  ] = await Promise.all([
    db.select().from(patients).where(eq(patients.id, patientId)).limit(1),
    db
      .select()
      .from(patientAllergies)
      .where(eq(patientAllergies.patientId, patientId))
      .limit(1),
    db
      .select()
      .from(patientConditions)
      .where(eq(patientConditions.patientId, patientId))
      .limit(1),
    db
      .select()
      .from(patientMedications)
      .where(eq(patientMedications.patientId, patientId))
      .limit(1),
    db
      .select()
      .from(patientSurgeries)
      .where(eq(patientSurgeries.patientId, patientId))
      .limit(1),
    db
      .select()
      .from(patientFollowups)
      .where(eq(patientFollowups.patientId, patientId))
      .limit(1),
    db
      .select()
      .from(patientImaging)
      .where(eq(patientImaging.patientId, patientId))
      .limit(1),
    db
      .select()
      .from(patientLabs)
      .where(eq(patientLabs.patientId, patientId))
      .limit(1),
    db
      .select()
      .from(patientNotes)
      .where(eq(patientNotes.patientId, patientId))
      .limit(1),
    db
      .select()
      .from(patientVisits)
      .where(eq(patientVisits.patientId, patientId))
      .limit(1),
  ]);

  const backgroundExists =
    allergies.length > 0 || conditions.length > 0 || medications.length > 0;

  return {
    overview: overview.length > 0,
    background: backgroundExists,
    surgery: surgery.length > 0,
    followUp: followUp.length > 0,
    imaging: imaging.length > 0,
    labs: labs.length > 0,
    notes: notes.length > 0,
    visits: visits.length > 0,
  };
}

type ExportSectionId =
  | "overview"
  | "background"
  | "surgery"
  | "followUp"
  | "imaging"
  | "labs"
  | "notes"
  | "visits"
  | "bmi";

type ExportPatientPdfPayload = {
  patientId: string;
  sections: ExportSectionId[];
};

type ExportPatientPdfResponse =
  | { ok: true; fileName: string; base64: string }
  | { ok: false; error: string };

const sectionOrder: ExportSectionId[] = [
  "overview",
  "background",
  "surgery",
  "followUp",
  "imaging",
  "labs",
  "notes",
  "visits",
  "bmi",
];

const sectionLabels: Record<ExportSectionId, string> = {
  overview: "Patient Snapshot",
  background: "Clinical Background",
  surgery: "Surgery Timeline",
  followUp: "Follow-Up Log",
  imaging: "Imaging Review",
  labs: "Lab Results",
  notes: "Clinical Notes",
  visits: "Visit Summary",
  bmi: "BMI Trend",
};

function formatDate(value?: Date | string | null) {
  if (!value) return "Not recorded";
  const date = typeof value === "string" ? new Date(value) : value;
  if (Number.isNaN(date.getTime())) return "Not recorded";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function formatValue(value: unknown) {
  if (value === null || value === undefined || value === "")
    return "Not recorded";
  if (value instanceof Date) return formatDate(value);
  if (typeof value === "number")
    return Number.isFinite(value) ? value.toString() : "Not recorded";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value);
  } catch {
    return "Not recorded";
  }
}

function wrapText(
  text: string,
  maxWidth: number,
  font: PDFFont,
  fontSize: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    const width = font.widthOfTextAtSize(test, fontSize);
    if (width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function sanitizeFileName(value: string) {
  return value
    .replace(/[^a-zA-Z0-9-_ ]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

type PdfRenderContext = {
  pdf: PDFDocument;
  page: PDFPage;
  font: PDFFont;
  fontBold: PDFFont;
  width: number;
  height: number;
  margin: number;
  cursorY: number;
};

type PdfColor = ReturnType<typeof rgb> | { r: number; g: number; b: number };

function normalizeColor(color?: PdfColor) {
  if (!color) return undefined;
  if ("r" in color) {
    return rgb(color.r, color.g, color.b);
  }
  return color;
}

function addNewPage(ctx: PdfRenderContext) {
  ctx.page = ctx.pdf.addPage([ctx.width, ctx.height]);
  ctx.cursorY = ctx.height - ctx.margin;
}

function ensureSpace(ctx: PdfRenderContext, minSpace: number) {
  if (ctx.cursorY < minSpace) {
    addNewPage(ctx);
  }
}

function drawTextLine(
  ctx: PdfRenderContext,
  text: string,
  size: number,
  options?: { font?: PDFFont; color?: PdfColor },
) {
  const font = options?.font ?? ctx.font;
  const color = normalizeColor(options?.color) ?? rgb(0.1, 0.1, 0.12);
  ctx.page.drawText(text, {
    x: ctx.margin,
    y: ctx.cursorY,
    size,
    font,
    color,
  });
  ctx.cursorY -= size + 6;
}

function drawWrappedText(
  ctx: PdfRenderContext,
  text: string,
  size: number,
  indent = 0,
  color: PdfColor = rgb(0.18, 0.2, 0.22),
) {
  const maxWidth = ctx.width - ctx.margin * 2 - indent;
  const lines = wrapText(text, maxWidth, ctx.font, size);
  const resolvedColor = normalizeColor(color) ?? rgb(0.18, 0.2, 0.22);
  for (const line of lines) {
    ctx.page.drawText(line, {
      x: ctx.margin + indent,
      y: ctx.cursorY,
      size,
      font: ctx.font,
      color: resolvedColor,
    });
    ctx.cursorY -= size + 4;
  }
}

function drawSectionTitle(ctx: PdfRenderContext, title: string) {
  ensureSpace(ctx, ctx.margin + 40);
  ctx.page.drawText(title, {
    x: ctx.margin,
    y: ctx.cursorY,
    size: 16,
    font: ctx.fontBold,
    color: rgb(0.05, 0.1, 0.2),
  });
  ctx.cursorY -= 22;
  ctx.page.drawLine({
    start: { x: ctx.margin, y: ctx.cursorY },
    end: { x: ctx.width - ctx.margin, y: ctx.cursorY },
    thickness: 1,
    color: rgb(0.82, 0.84, 0.86),
  });
  ctx.cursorY -= 14;
}

function drawKeyValue(ctx: PdfRenderContext, label: string, value: string) {
  ensureSpace(ctx, ctx.margin + 20);
  const labelText = `${label}:`;
  ctx.page.drawText(labelText, {
    x: ctx.margin,
    y: ctx.cursorY,
    size: 10.5,
    font: ctx.fontBold,
    color: rgb(0.15, 0.2, 0.25),
  });
  drawWrappedText(ctx, value, 10.5, 110);
}

function drawBullet(ctx: PdfRenderContext, text: string) {
  ensureSpace(ctx, ctx.margin + 16);
  ctx.page.drawText("•", {
    x: ctx.margin,
    y: ctx.cursorY,
    size: 11,
    font: ctx.fontBold,
    color: rgb(0.2, 0.25, 0.3),
  });
  drawWrappedText(ctx, text, 11, 14);
}

function drawBMIChart(
  ctx: PdfRenderContext,
  data: Array<{ bmi: number; visitDate: Date }>,
  options: { title: string; height?: number },
) {
  const chartHeight = options.height ?? 220;
  ensureSpace(ctx, ctx.margin + chartHeight + 30);
  drawTextLine(ctx, options.title, 13, {
    font: ctx.fontBold,
    color: { r: 0.08, g: 0.16, b: 0.3 },
  });

  const chartWidth = ctx.width - ctx.margin * 2;
  const chartBottom = ctx.cursorY - chartHeight;
  ctx.page.drawRectangle({
    x: ctx.margin,
    y: chartBottom,
    width: chartWidth,
    height: chartHeight,
    borderWidth: 1,
    borderColor: rgb(0.85, 0.86, 0.88),
    color: rgb(0.98, 0.985, 0.99),
  });

  if (data.length === 0) {
    ctx.page.drawText("No BMI readings available.", {
      x: ctx.margin + 16,
      y: chartBottom + chartHeight / 2,
      size: 11,
      font: ctx.font,
      color: rgb(0.4, 0.45, 0.5),
    });
    ctx.cursorY = chartBottom - 16;
    return;
  }

  const values = data.map((item) => item.bmi);
  const minValue = Math.min(18.5, ...values) - 2;
  const maxValue = Math.max(24.9, ...values) + 2;
  const padding = 28;
  const plotX = ctx.margin + padding;
  const plotY = chartBottom + padding;
  const plotWidth = chartWidth - padding * 2;
  const plotHeight = chartHeight - padding * 2;

  const scaleX = data.length > 1 ? plotWidth / (data.length - 1) : 0;
  const scaleY = plotHeight / (maxValue - minValue || 1);

  const getPoint = (index: number, bmi: number) => ({
    x: plotX + index * scaleX,
    y: plotY + (bmi - minValue) * scaleY,
  });

  const healthyMin = 18.5;
  const healthyMax = 24.9;
  const healthyBottom = plotY + (healthyMin - minValue) * scaleY;
  const healthyTop = plotY + (healthyMax - minValue) * scaleY;

  ctx.page.drawRectangle({
    x: plotX,
    y: healthyBottom,
    width: plotWidth,
    height: healthyTop - healthyBottom,
    color: rgb(0.88, 0.96, 0.9),
    borderWidth: 0,
  });

  ctx.page.drawLine({
    start: { x: plotX, y: plotY },
    end: { x: plotX + plotWidth, y: plotY },
    thickness: 1,
    color: rgb(0.7, 0.72, 0.74),
  });
  ctx.page.drawLine({
    start: { x: plotX, y: plotY },
    end: { x: plotX, y: plotY + plotHeight },
    thickness: 1,
    color: rgb(0.7, 0.72, 0.74),
  });

  for (let i = 0; i < data.length; i += 1) {
    const point = getPoint(i, data[i].bmi);
    if (i > 0) {
      const prev = getPoint(i - 1, data[i - 1].bmi);
      ctx.page.drawLine({
        start: prev,
        end: point,
        thickness: 2,
        color: rgb(0.15, 0.4, 0.8),
      });
    }
    ctx.page.drawCircle({
      x: point.x,
      y: point.y,
      size: 3,
      color: rgb(0.1, 0.3, 0.7),
    });
  }

  const firstDate = formatDate(data[0].visitDate);
  const lastDate = formatDate(data[data.length - 1].visitDate);
  ctx.page.drawText(firstDate, {
    x: plotX,
    y: plotY - 14,
    size: 9,
    font: ctx.font,
    color: rgb(0.35, 0.38, 0.42),
  });
  ctx.page.drawText(lastDate, {
    x: plotX + plotWidth - ctx.font.widthOfTextAtSize(lastDate, 9),
    y: plotY - 14,
    size: 9,
    font: ctx.font,
    color: rgb(0.35, 0.38, 0.42),
  });

  ctx.page.drawText("BMI", {
    x: plotX - 22,
    y: plotY + plotHeight - 8,
    size: 9,
    font: ctx.fontBold,
    color: rgb(0.3, 0.32, 0.35),
  });

  ctx.page.drawText("Healthy range", {
    x: plotX + 8,
    y: healthyTop - 12,
    size: 8,
    font: ctx.font,
    color: rgb(0.2, 0.55, 0.3),
  });

  ctx.cursorY = chartBottom - 18;
}

export async function exportPatientPdf(
  payload: ExportPatientPdfPayload,
): Promise<ExportPatientPdfResponse> {
  if (!payload?.patientId || typeof payload.patientId !== "string") {
    return { ok: false, error: "A valid patient id is required." };
  }

  const requestedSections = new Set(
    (payload.sections || []).filter(Boolean) as ExportSectionId[],
  );
  if (requestedSections.size === 0) {
    return { ok: false, error: "Select at least one section to export." };
  }

  const includeBackground = requestedSections.has("background");
  const includeSurgery = requestedSections.has("surgery");
  const includeFollowUp = requestedSections.has("followUp");
  const includeImaging = requestedSections.has("imaging");
  const includeLabs = requestedSections.has("labs");
  const includeNotes = requestedSections.has("notes");
  const includeVisits = requestedSections.has("visits");
  const includeBmi = requestedSections.has("bmi");

  const needsVisits = includeVisits || includeBmi;

  const [
    patientResult,
    allergies,
    conditions,
    medications,
    socialHistory,
    surgeries,
    followups,
    imaging,
    labs,
    notes,
    visits,
  ] = await Promise.all([
    db
      .select()
      .from(patients)
      .where(eq(patients.id, payload.patientId))
      .limit(1),
    includeBackground
      ? db
          .select()
          .from(patientAllergies)
          .where(eq(patientAllergies.patientId, payload.patientId))
      : Promise.resolve([]),
    includeBackground
      ? db
          .select()
          .from(patientConditions)
          .where(eq(patientConditions.patientId, payload.patientId))
      : Promise.resolve([]),
    includeBackground
      ? db
          .select()
          .from(patientMedications)
          .where(eq(patientMedications.patientId, payload.patientId))
      : Promise.resolve([]),
    includeBackground
      ? db
          .select()
          .from(patientSocialHistory)
          .where(eq(patientSocialHistory.patientId, payload.patientId))
      : Promise.resolve([]),
    includeSurgery
      ? db
          .select()
          .from(patientSurgeries)
          .where(eq(patientSurgeries.patientId, payload.patientId))
      : Promise.resolve([]),
    includeFollowUp
      ? db
          .select()
          .from(patientFollowups)
          .where(eq(patientFollowups.patientId, payload.patientId))
      : Promise.resolve([]),
    includeImaging
      ? db
          .select()
          .from(patientImaging)
          .where(eq(patientImaging.patientId, payload.patientId))
      : Promise.resolve([]),
    includeLabs
      ? db
          .select()
          .from(patientLabs)
          .where(eq(patientLabs.patientId, payload.patientId))
      : Promise.resolve([]),
    includeNotes
      ? db
          .select()
          .from(patientNotes)
          .where(eq(patientNotes.patientId, payload.patientId))
      : Promise.resolve([]),
    needsVisits
      ? db
          .select()
          .from(patientVisits)
          .where(eq(patientVisits.patientId, payload.patientId))
      : Promise.resolve([]),
  ]);

  const patient = patientResult[0];
  if (!patient) {
    return { ok: false, error: "Patient record not found." };
  }

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const ctx: PdfRenderContext = {
    pdf,
    page: pdf.addPage([612, 792]),
    font,
    fontBold,
    width: 612,
    height: 792,
    margin: 48,
    cursorY: 792 - 48,
  };

  drawTextLine(ctx, "AI Clinic", 20, {
    font: fontBold,
    color: {
      r: 0.08,
      g: 0.15,
      b: 0.3,
    },
  });
  drawTextLine(ctx, "Patient Care Export", 13, {
    font: font,
    color: { r: 0.25, g: 0.3, b: 0.35 },
  });
  ctx.cursorY -= 4;
  ctx.page.drawLine({
    start: { x: ctx.margin, y: ctx.cursorY },
    end: { x: ctx.width - ctx.margin, y: ctx.cursorY },
    thickness: 1,
    color: rgb(0.75, 0.77, 0.8),
  });
  ctx.cursorY -= 16;

  drawKeyValue(
    ctx,
    "Patient",
    patient.name || patient.nameAr || "Unnamed patient",
  );
  drawKeyValue(ctx, "Patient ID", patient.id);
  drawKeyValue(ctx, "Generated", formatDate(new Date()));

  ctx.cursorY -= 12;

  const orderedSections = sectionOrder.filter((section) =>
    requestedSections.has(section),
  );

  for (const section of orderedSections) {
    if (section === "bmi") {
      addNewPage(ctx);
      drawSectionTitle(ctx, sectionLabels[section]);
      const bmiData = visits
        .filter((visit) => visit.bmi !== null && visit.visitDate !== null)
        .map((visit) => ({
          bmi: Number(visit.bmi),
          visitDate: visit.visitDate as Date,
        }))
        .filter((item) => Number.isFinite(item.bmi))
        .sort((a, b) => a.visitDate.getTime() - b.visitDate.getTime());
      drawWrappedText(
        ctx,
        "Trend line shows recorded BMI measurements from documented visits. Use this view to discuss progress and targets.",
        10.5,
      );
      ctx.cursorY -= 8;
      drawBMIChart(ctx, bmiData, { title: "BMI Trend" });
      continue;
    }

    drawSectionTitle(ctx, sectionLabels[section]);

    if (section === "overview") {
      drawWrappedText(
        ctx,
        "Snapshot of demographics and initial measurements captured during intake.",
        10.5,
      );
      ctx.cursorY -= 6;
      drawKeyValue(ctx, "Age", formatValue(patient.age));
      drawKeyValue(ctx, "Gender", formatValue(patient.gender));
      drawKeyValue(ctx, "Date of Birth", formatDate(patient.dob));
      drawKeyValue(ctx, "Phone", formatValue(patient.phone));
      drawKeyValue(ctx, "Alternate Phone", formatValue(patient.optional_phone));
      drawKeyValue(ctx, "Height (cm)", formatValue(patient.height));
      drawKeyValue(
        ctx,
        "Initial Weight (kg)",
        formatValue(patient.initial_weight),
      );
      drawKeyValue(ctx, "Initial BMI", formatValue(patient.initial_bmi));
      drawKeyValue(ctx, "Status", formatValue(patient.status));
      drawKeyValue(ctx, "First Visit", formatDate(patient.first_visit_date));
      ctx.cursorY -= 8;
      continue;
    }

    if (section === "background") {
      drawWrappedText(
        ctx,
        "Highlights of chronic conditions, current therapies, allergies, and lifestyle notes.",
        10.5,
      );
      ctx.cursorY -= 6;

      if (conditions.length) {
        drawTextLine(ctx, "Conditions", 12, {
          font: fontBold,
          color: { r: 0.1, g: 0.2, b: 0.3 },
        });
        conditions.forEach((condition) => {
          const summary = `${formatValue(condition.conditionName)} (${formatValue(condition.conditionStatus)})`;
          drawBullet(ctx, summary);
          drawWrappedText(
            ctx,
            `Type: ${formatValue(condition.type)} | Onset: ${formatDate(condition.onsetDate as Date)}`,
            10,
            16,
            rgb(0.35, 0.38, 0.42),
          );
        });
        ctx.cursorY -= 8;
      }

      if (medications.length) {
        drawTextLine(ctx, "Medications", 12, {
          font: fontBold,
          color: { r: 0.1, g: 0.2, b: 0.3 },
        });
        medications.forEach((med) => {
          const summary = `${formatValue(med.drugName)} ${formatValue(med.dosage)} - ${formatValue(med.frequency)}`;
          drawBullet(ctx, summary);
          drawWrappedText(
            ctx,
            `Type: ${formatValue(med.type)} | Start: ${formatDate(med.startDate as Date)} | End: ${formatDate(med.endDate as Date)}`,
            10,
            16,
            rgb(0.35, 0.38, 0.42),
          );
        });
        ctx.cursorY -= 8;
      }

      if (allergies.length) {
        drawTextLine(ctx, "Allergies", 12, {
          font: fontBold,
          color: { r: 0.1, g: 0.2, b: 0.3 },
        });
        allergies.forEach((allergy) => {
          const summary = `${formatValue(allergy.allergen)} - ${formatValue(allergy.reaction)}`;
          drawBullet(ctx, summary);
          drawWrappedText(
            ctx,
            `Severity: ${formatValue(allergy.severity)}`,
            10,
            16,
            rgb(0.35, 0.38, 0.42),
          );
        });
        ctx.cursorY -= 8;
      }

      if (socialHistory.length) {
        drawTextLine(ctx, "Lifestyle", 12, {
          font: fontBold,
          color: { r: 0.1, g: 0.2, b: 0.3 },
        });
        socialHistory.forEach((item) => {
          const summary = `${formatValue(item.category)}: ${formatValue(item.value)}`;
          drawBullet(ctx, summary);
          if (item.notes) {
            drawWrappedText(
              ctx,
              `Notes: ${formatValue(item.notes)}`,
              10,
              16,
              rgb(0.35, 0.38, 0.42),
            );
          }
        });
        ctx.cursorY -= 8;
      }

      if (
        conditions.length === 0 &&
        medications.length === 0 &&
        allergies.length === 0 &&
        socialHistory.length === 0
      ) {
        drawWrappedText(ctx, "No background items recorded yet.", 10.5);
      }
      continue;
    }

    if (section === "surgery") {
      drawWrappedText(
        ctx,
        "Documented procedures and operative summaries.",
        10.5,
      );
      ctx.cursorY -= 6;
      if (surgeries.length === 0) {
        drawWrappedText(ctx, "No surgical entries recorded.", 10.5);
        continue;
      }
      surgeries.forEach((surgery) => {
        drawBullet(
          ctx,
          `${formatValue(surgery.procedureName)} (${formatValue(surgery.procedureType)})`,
        );
        drawWrappedText(
          ctx,
          `Date: ${formatDate(surgery.surgeryDate as Date)} | Hospital: ${formatValue(surgery.hospitalName)}`,
          10,
          16,
          rgb(0.35, 0.38, 0.42),
        );
        if (surgery.summaryNotes) {
          drawWrappedText(
            ctx,
            `Summary: ${formatValue(surgery.summaryNotes)}`,
            10,
            16,
            rgb(0.35, 0.38, 0.42),
          );
        }
      });
      ctx.cursorY -= 8;
      continue;
    }

    if (section === "followUp") {
      drawWrappedText(
        ctx,
        "Post-op check-ins and structured follow-up calls.",
        10.5,
      );
      ctx.cursorY -= 6;
      if (followups.length === 0) {
        drawWrappedText(ctx, "No follow-up entries recorded.", 10.5);
        continue;
      }
      followups.forEach((followup) => {
        drawBullet(ctx, `Call Date: ${formatDate(followup.callDate as Date)}`);
        drawWrappedText(
          ctx,
          `Scheduled Visit: ${formatDate(followup.scheduledVisitDate as Date)} | Activity: ${formatValue(
            followup.activityLevel,
          )}`,
          10,
          16,
          rgb(0.35, 0.38, 0.42),
        );
        drawWrappedText(
          ctx,
          `Diet Notes: ${formatValue(followup.dietNotes)} | Bowel: ${formatValue(followup.bowelMovement)}`,
          10,
          16,
          rgb(0.35, 0.38, 0.42),
        );
      });
      ctx.cursorY -= 8;
      continue;
    }

    if (section === "imaging") {
      drawWrappedText(ctx, "Key imaging studies and impressions.", 10.5);
      ctx.cursorY -= 6;
      if (imaging.length === 0) {
        drawWrappedText(ctx, "No imaging studies recorded.", 10.5);
        continue;
      }
      imaging.forEach((study) => {
        drawBullet(
          ctx,
          `${formatValue(study.studyName)} (${formatValue(study.modality)})`,
        );
        drawWrappedText(
          ctx,
          `Category: ${formatValue(study.category)} | Date: ${formatDate(study.studyDate as Date)}`,
          10,
          16,
          rgb(0.35, 0.38, 0.42),
        );
        if (study.impression) {
          drawWrappedText(
            ctx,
            `Impression: ${formatValue(study.impression)}`,
            10,
            16,
            rgb(0.35, 0.38, 0.42),
          );
        }
      });
      ctx.cursorY -= 8;
      continue;
    }

    if (section === "labs") {
      drawWrappedText(ctx, "Lab panels and flagged findings.", 10.5);
      ctx.cursorY -= 6;
      if (labs.length === 0) {
        drawWrappedText(ctx, "No lab results recorded.", 10.5);
        continue;
      }
      labs.forEach((lab) => {
        drawBullet(
          ctx,
          `${formatValue(lab.testName)} (${formatValue(lab.status)})`,
        );
        drawWrappedText(
          ctx,
          `Category: ${formatValue(lab.category)} | Date: ${formatDate(lab.labDate as Date)}`,
          10,
          16,
          rgb(0.35, 0.38, 0.42),
        );
        if (lab.notes) {
          drawWrappedText(
            ctx,
            `Notes: ${formatValue(lab.notes)}`,
            10,
            16,
            rgb(0.35, 0.38, 0.42),
          );
        }
      });
      ctx.cursorY -= 8;
      continue;
    }

    if (section === "notes") {
      drawWrappedText(ctx, "Narrative notes and team observations.", 10.5);
      ctx.cursorY -= 6;
      if (notes.length === 0) {
        drawWrappedText(ctx, "No notes recorded.", 10.5);
        continue;
      }
      notes.forEach((note) => {
        drawBullet(
          ctx,
          `${formatValue(note.title)} (${formatValue(note.category)})`,
        );
        if (note.content) {
          drawWrappedText(
            ctx,
            formatValue(note.content),
            10,
            16,
            rgb(0.35, 0.38, 0.42),
          );
        }
      });
      ctx.cursorY -= 8;
      continue;
    }

    if (section === "visits") {
      drawWrappedText(
        ctx,
        "Visit-level vitals, plans, and follow-through.",
        10.5,
      );
      ctx.cursorY -= 6;
      if (visits.length === 0) {
        drawWrappedText(ctx, "No visit records found.", 10.5);
        continue;
      }

      const sortedVisits = [...visits].sort((a, b) => {
        const left = a.visitDate ? new Date(a.visitDate).getTime() : 0;
        const right = b.visitDate ? new Date(b.visitDate).getTime() : 0;
        return left - right;
      });

      sortedVisits.forEach((visit) => {
        drawBullet(ctx, `Visit Date: ${formatDate(visit.visitDate as Date)}`);
        drawWrappedText(
          ctx,
          `Type: ${formatValue(visit.visitType)} | Weight: ${formatValue(visit.weight)} | BMI: ${formatValue(visit.bmi)}`,
          10,
          16,
          rgb(0.35, 0.38, 0.42),
        );
        if (visit.clinicalFindings) {
          drawWrappedText(
            ctx,
            `Findings: ${formatValue(visit.clinicalFindings)}`,
            10,
            16,
            rgb(0.35, 0.38, 0.42),
          );
        }
        if (visit.recommendations) {
          drawWrappedText(
            ctx,
            `Plan: ${formatValue(visit.recommendations)}`,
            10,
            16,
            rgb(0.35, 0.38, 0.42),
          );
        }
      });

      if (!includeBmi) {
        const bmiData = sortedVisits
          .filter((visit) => visit.bmi !== null && visit.visitDate !== null)
          .map((visit) => ({
            bmi: Number(visit.bmi),
            visitDate: visit.visitDate as Date,
          }))
          .filter((item) => Number.isFinite(item.bmi))
          .sort((a, b) => a.visitDate.getTime() - b.visitDate.getTime());
        ctx.cursorY -= 8;
        drawBMIChart(ctx, bmiData, {
          title: "BMI Trend (embedded)",
          height: 180,
        });
      }
      continue;
    }
  }

  const pdfBytes = await pdf.save();
  const base64 = Buffer.from(pdfBytes).toString("base64");
  const fileName = sanitizeFileName(`${patient.name || "patient"}-export.pdf`);

  return { ok: true, fileName, base64 };
}
