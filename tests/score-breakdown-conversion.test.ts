import { describe, it, expect } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { ScoreBreakdownBlock } from "@/components/editorial/extensions/ScoreBreakdownBlock";

describe("Bidirectional Table <-> ScoreBreakdownBlock Conversion", () => {
  const createEditor = (contentJson: any) => {
    return new Editor({
      content: contentJson,
      extensions: [
        StarterKit,
        Table.configure({ resizable: true }),
        TableRow,
        TableCell,
        TableHeader,
        ScoreBreakdownBlock,
      ],
    });
  };

  it("converts a 6-column table into a ScoreBreakdownBlock with multi-level inheritance", () => {
    const tableDoc = {
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Tab Category" }] }] },
                { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Sub-Category" }] }] },
                { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Metric" }] }] },
                { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Device Score" }] }] },
                { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Top Score" }] }] },
                { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Weight" }] }] },
              ],
            },
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Camera" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Photo" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Main Lens" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "165" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "168" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "1.2" }] }] },
              ],
            },
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [{ type: "paragraph" }] }, // Empty Tab -> inherit "Camera"
                { type: "tableCell", content: [{ type: "paragraph" }] }, // Empty Sub -> inherit "Photo"
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Ultrawide" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "154" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "160" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "1.0" }] }] },
              ],
            },
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [{ type: "paragraph" }] }, // Empty Tab -> inherit "Camera"
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Video" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Stabilization" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "162" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "164" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "1.0" }] }] },
              ],
            },
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Display" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Readability" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Sunlight" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "160" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "165" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "1.0" }] }] },
              ],
            },
          ],
        },
      ],
    };

    const editor = createEditor(tableDoc);
    editor.commands.setTextSelection(5);
    expect(editor.isActive("table")).toBe(true);

    const converted = (editor.chain() as any).convertTableToScoreBreakdown().run();
    expect(converted).toBe(true);

    let scoreBlockNode: any = null;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "scoreBreakdownBlock") {
        scoreBlockNode = node;
      }
    });

    expect(scoreBlockNode).not.toBeNull();
    const items = JSON.parse(scoreBlockNode.attrs?.items);
    expect(items).toHaveLength(4);

    // Row 1
    expect(items[0]).toEqual({
      tab: "Camera",
      subCategory: "Photo",
      group: "Photo",
      metric: "Main Lens",
      score: 165,
      topScore: 168,
      weight: 1.2,
      isUseCase: false,
    });

    // Row 2 inherited "Camera" and "Photo"
    expect(items[1]).toEqual({
      tab: "Camera",
      subCategory: "Photo",
      group: "Photo",
      metric: "Ultrawide",
      score: 154,
      topScore: 160,
      weight: 1.0,
      isUseCase: false,
    });

    // Row 3 inherited "Camera" and new subCategory "Video"
    expect(items[2]).toEqual({
      tab: "Camera",
      subCategory: "Video",
      group: "Video",
      metric: "Stabilization",
      score: 162,
      topScore: 164,
      weight: 1.0,
      isUseCase: false,
    });

    // Row 4 new tab "Display" and subCategory "Readability"
    expect(items[3]).toEqual({
      tab: "Display",
      subCategory: "Readability",
      group: "Readability",
      metric: "Sunlight",
      score: 160,
      topScore: 165,
      weight: 1.0,
      isUseCase: false,
    });
  });

  it("converts a ScoreBreakdownBlock back into a 6-column table", () => {
    const blockDoc = {
      type: "doc",
      content: [
        {
          type: "scoreBreakdownBlock",
          attrs: {
            items: JSON.stringify([
              { tab: "Camera", subCategory: "Photo", metric: "Main", score: 165, topScore: 168, weight: 1.2 },
              { tab: "Camera", subCategory: "Video", metric: "Stabilization", score: 160, topScore: 162, weight: 1.0 },
            ]),
            overallScore: 163,
          },
        },
      ],
    };

    const editor = createEditor(blockDoc);

    let pos = -1;
    editor.state.doc.descendants((node, p) => {
      if (node.type.name === "scoreBreakdownBlock") pos = p;
    });

    expect(pos).toBeGreaterThanOrEqual(0);

    const converted = (editor.chain() as any).convertScoreBreakdownToTable(pos).run();
    expect(converted).toBe(true);

    let tableNode: any = null;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "table") tableNode = node;
    });

    expect(tableNode).not.toBeNull();
    expect(tableNode.childCount).toBe(2);

    const rows: string[][] = [];
    tableNode.forEach((row: any) => {
      const cells: string[] = [];
      row.forEach((cell: any) => cells.push(cell.textContent));
      rows.push(cells);
    });

    expect(rows[0]).toEqual(["Camera", "Photo", "Main", "165", "168", "1.2"]);
    expect(rows[1]).toEqual(["Camera", "Video", "Stabilization", "160", "162", "1"]);
  });
});
