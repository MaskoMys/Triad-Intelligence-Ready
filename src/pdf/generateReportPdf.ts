import {
  ASSESSMENT_DISCLAIMER,
  TRAIT_KEYS,
  TRAIT_LABELS,
  type AssessmentResult,
} from "@/domain/assessment";
import { safeFilenamePart } from "@/lib/download";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN = 18;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

export async function generateReportPdf(
  result: AssessmentResult,
): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const document = new jsPDF({ unit: "mm", format: "a4", compress: true });
  let y = MARGIN;

  const ensureSpace = (requiredHeight: number) => {
    if (y + requiredHeight <= PAGE_HEIGHT - MARGIN) return;
    document.addPage();
    y = MARGIN;
  };

  const heading = (text: string, size = 15) => {
    ensureSpace(12);
    document.setFont("helvetica", "bold");
    document.setFontSize(size);
    document.setTextColor(30, 41, 59);
    document.text(text, MARGIN, y);
    y += size * 0.5 + 3;
  };

  const paragraph = (
    text: string,
    options: { size?: number; gap?: number } = {},
  ) => {
    const size = options.size ?? 10;
    const lines = document.splitTextToSize(text, CONTENT_WIDTH) as string[];
    const height = lines.length * (size * 0.42 + 1.4);
    ensureSpace(height + (options.gap ?? 3));
    document.setFont("helvetica", "normal");
    document.setFontSize(size);
    document.setTextColor(71, 85, 105);
    document.text(lines, MARGIN, y);
    y += height + (options.gap ?? 3);
  };

  document.setFillColor(49, 46, 129);
  document.roundedRect(MARGIN, y, CONTENT_WIDTH, 38, 4, 4, "F");
  document.setTextColor(255, 255, 255);
  document.setFont("helvetica", "bold");
  document.setFontSize(22);
  document.text("TRI-AD", MARGIN + 8, y + 12);
  document.setFontSize(12);
  document.text("Cognitive archetype report", MARGIN + 8, y + 21);
  document.setFont("helvetica", "normal");
  document.setFontSize(9);
  document.text(
    `${result.userName} • ${new Date(result.timestamp).toLocaleDateString()}`,
    MARGIN + 8,
    y + 30,
  );
  y += 48;

  document.setTextColor(49, 46, 129);
  document.setFont("helvetica", "bold");
  document.setFontSize(24);
  document.text(result.archetype.code, MARGIN, y);
  y += 8;
  heading(result.archetype.name, 18);
  paragraph(result.archetype.tagline, { size: 11, gap: 5 });
  paragraph(result.archetype.description, { size: 10, gap: 6 });

  heading("Three broad dimensions");
  for (const [label, value] of [
    ["Imagination", result.macroScores.imagination],
    ["Intuition", result.macroScores.intuition],
    ["Judgment", result.macroScores.judgment],
  ] as const) {
    ensureSpace(10);
    document.setFont("helvetica", "bold");
    document.setFontSize(10);
    document.setTextColor(30, 41, 59);
    document.text(label, MARGIN, y);
    document.text(`${Math.round(value)}`, PAGE_WIDTH - MARGIN, y, {
      align: "right",
    });
    document.setFillColor(226, 232, 240);
    document.roundedRect(MARGIN, y + 2, CONTENT_WIDTH, 3, 1.5, 1.5, "F");
    document.setFillColor(79, 70, 229);
    document.roundedRect(
      MARGIN,
      y + 2,
      CONTENT_WIDTH * (value / 100),
      3,
      1.5,
      1.5,
      "F",
    );
    y += 10;
  }
  y += 3;

  heading("Eight trait scores");
  for (const trait of TRAIT_KEYS) {
    ensureSpace(7);
    document.setFont("helvetica", "normal");
    document.setFontSize(9.5);
    document.setTextColor(51, 65, 85);
    document.text(TRAIT_LABELS[trait], MARGIN, y);
    document.text(
      `${Math.round(result.normalizedScores[trait])}`,
      PAGE_WIDTH - MARGIN,
      y,
      {
        align: "right",
      },
    );
    y += 6;
  }

  heading("Potential strengths");
  for (const strength of result.archetype.strengths)
    paragraph(`• ${strength}`, { size: 9.5, gap: 1 });

  heading("Useful watch-outs");
  for (const challenge of result.archetype.challenges)
    paragraph(`• ${challenge}`, { size: 9.5, gap: 1 });

  heading("Exploratory pathways");
  paragraph(
    "These are prompts for reflection rather than career recommendations or suitability judgments.",
    { size: 9, gap: 3 },
  );
  for (const path of result.archetype.careerPaths)
    paragraph(`• ${path}`, { size: 9.5, gap: 1 });

  ensureSpace(24);
  document.setDrawColor(203, 213, 225);
  document.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
  y += 6;
  paragraph(ASSESSMENT_DISCLAIMER, { size: 8.5, gap: 1 });
  paragraph(
    "Scores are generated from the selected scenario responses using an expectation-centered normalization model. The model is experimental and has not been externally validated.",
    { size: 8.5, gap: 1 },
  );

  const pageCount = document.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    document.setPage(page);
    document.setFont("helvetica", "normal");
    document.setFontSize(8);
    document.setTextColor(148, 163, 184);
    document.text(
      `Tri-Ad private beta • Page ${page} of ${pageCount}`,
      PAGE_WIDTH / 2,
      PAGE_HEIGHT - 8,
      { align: "center" },
    );
  }

  document.save(
    `triad-${safeFilenamePart(result.userName)}-${result.profileCode}.pdf`,
  );
}
