import { save } from "@tauri-apps/api/dialog";
import { writeBinaryFile } from "@tauri-apps/api/fs";
import jsPDF from "jspdf";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from "docx";
import { FormTemplate } from "../types";

// Функция для загрузки шрифта для PDF (для поддержки кириллицы)
const loadFont = () => {
  // В продакшене нужно добавить шрифт, поддерживающий кириллицу
  // Здесь используем базовую поддержку
};

export async function exportToPDF(template: FormTemplate, data: any) {
  try {
    const doc = new jsPDF();

    // Настройка шрифта (базовая поддержка, для кириллицы нужен кастомный шрифт)
    doc.setFont("helvetica");

    let yPosition = 20;

    // Заголовок
    doc.setFontSize(18);
    doc.text(template.name, 105, yPosition, { align: "center" });
    yPosition += 15;

    // Информация о сотруднике
    doc.setFontSize(12);
    const employee = data.employee;

    if (employee) {
      doc.text(`FIO: ${employee.fullName}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Dolzhnost': ${employee.position}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Podrazdelenie: ${employee.department}`, 20, yPosition);
      yPosition += 7;
      doc.text(`Upravlenie: ${employee.division}`, 20, yPosition);
      yPosition += 12;
    }

    // Разделитель
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 10;

    // Поля формы
    doc.setFontSize(11);
    template.fields.forEach((field) => {
      const value = data[field.name];
      if (value) {
        doc.text(`${field.label}:`, 20, yPosition);
        yPosition += 6;

        // Обработка многострочного текста
        const lines = doc.splitTextToSize(String(value), 170);
        lines.forEach((line: string) => {
          if (yPosition > 280) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(line, 20, yPosition);
          yPosition += 6;
        });

        yPosition += 4;
      }
    });

    // Дата
    yPosition += 10;
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 8;
    doc.setFontSize(10);
    doc.text(`Data: ${data.date}`, 20, yPosition);

    // Сохранение файла
    const pdfBytes = doc.output("arraybuffer");
    const uint8Array = new Uint8Array(pdfBytes);

    const filePath = await save({
      defaultPath: `${template.name}.pdf`,
      filters: [
        {
          name: "PDF",
          extensions: ["pdf"],
        },
      ],
    });

    if (filePath) {
      await writeBinaryFile(filePath, uint8Array);
    }
  } catch (error) {
    console.error("PDF export error:", error);
    throw error;
  }
}

export async function exportToDOCX(template: FormTemplate, data: any) {
  try {
    const children: Paragraph[] = [];

    // Заголовок
    children.push(
      new Paragraph({
        text: template.name,
        heading: HeadingLevel.HEADING_1,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400 },
      })
    );

    // Информация о сотруднике
    const employee = data.employee;
    if (employee) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: "ФИО: ", bold: true }),
            new TextRun(employee.fullName),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Должность: ", bold: true }),
            new TextRun(employee.position),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Подразделение: ", bold: true }),
            new TextRun(employee.department),
          ],
          spacing: { after: 200 },
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Управление: ", bold: true }),
            new TextRun(employee.division),
          ],
          spacing: { after: 400 },
        })
      );
    }

    // Поля формы
    template.fields.forEach((field) => {
      const value = data[field.name];
      if (value) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${field.label}: `, bold: true }),
              new TextRun(String(value)),
            ],
            spacing: { after: 200 },
          })
        );
      }
    });

    // Дата
    children.push(
      new Paragraph({
        text: "",
        spacing: { before: 400 },
      }),
      new Paragraph({
        children: [
          new TextRun({ text: "Дата: ", bold: true }),
          new TextRun(data.date),
        ],
      })
    );

    const doc = new Document({
      sections: [
        {
          properties: {},
          children,
        },
      ],
    });

    const blob = await Packer.toBlob(doc);
    const arrayBuffer = await blob.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);

    const filePath = await save({
      defaultPath: `${template.name}.docx`,
      filters: [
        {
          name: "Word Document",
          extensions: ["docx"],
        },
      ],
    });

    if (filePath) {
      await writeBinaryFile(filePath, uint8Array);
    }
  } catch (error) {
    console.error("DOCX export error:", error);
    throw error;
  }
}
