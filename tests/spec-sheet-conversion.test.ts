import { describe, it, expect } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { SpecSheetBlock } from "@/components/editorial/extensions/SpecSheetBlock";

describe("Bidirectional Table <-> SpecSheetBlock Conversion", () => {
  const createEditor = (contentJson: any) => {
    return new Editor({
      content: contentJson,
      extensions: [
        StarterKit,
        Table.configure({ resizable: true }),
        TableRow,
        TableCell,
        TableHeader,
        SpecSheetBlock,
      ],
    });
  };

  it("converts a 3-column table into a SpecSheetBlock with smart category inheritance", () => {
    const tableDoc = {
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Category" }] }] },
                { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Spec Name" }] }] },
                { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Value" }] }] },
              ],
            },
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Display" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Type" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: '6.7" OLED' }] }] },
              ],
            },
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [{ type: "paragraph" }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Resolution" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "1440 x 3200" }] }] },
              ],
            },
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Platform" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Chipset" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Snapdragon 8 Gen 3" }] }] },
              ],
            },
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [{ type: "paragraph" }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "RAM" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "16GB" }] }] },
              ],
            },
          ],
        },
      ],
    };

    const editor = createEditor(tableDoc);

    // Set cursor inside the table
    editor.commands.setTextSelection(10);
    expect(editor.isActive("table")).toBe(true);

    // Run conversion command
    const success = (editor.chain() as any).convertTableToSpecSheet().run();
    expect(success).toBe(true);

    // Table should no longer exist, SpecSheetBlock should exist
    expect(editor.isActive("table")).toBe(false);

    // Find the specSheetBlock in the document
    let specSheetNode: any = null;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "specSheetBlock") {
        specSheetNode = node;
      }
    });

    expect(specSheetNode).not.toBeNull();
    const items = JSON.parse(specSheetNode.attrs.items);

    expect(items).toHaveLength(4);
    // Row 1
    expect(items[0]).toEqual({
      category: "Display",
      key: "Type",
      value: '6.7" OLED',
    });
    // Row 2: inherited "Display"
    expect(items[1]).toEqual({
      category: "Display",
      key: "Resolution",
      value: "1440 x 3200",
    });
    // Row 3: new category "Platform"
    expect(items[2]).toEqual({
      category: "Platform",
      key: "Chipset",
      value: "Snapdragon 8 Gen 3",
    });
    // Row 4: inherited "Platform"
    expect(items[3]).toEqual({
      category: "Platform",
      key: "RAM",
      value: "16GB",
    });
  });

  it("converts a SpecSheetBlock back into a standard 3-column table", () => {
    const initialSpecs = [
      { category: "Display", key: "Type", value: '6.7" OLED' },
      { category: "Display", key: "Resolution", value: "1440 x 3200" },
      { category: "Battery", key: "Capacity", value: "5000 mAh" },
    ];

    const specDoc = {
      type: "doc",
      content: [
        {
          type: "specSheetBlock",
          attrs: {
            items: JSON.stringify(initialSpecs),
          },
        },
      ],
    };

    const editor = createEditor(specDoc);

    // Find specSheet position
    let specPos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "specSheetBlock") {
        specPos = pos;
      }
    });

    expect(specPos).toBeGreaterThanOrEqual(0);

    // Run conversion to table
    const success = (editor.chain() as any).convertSpecSheetToTable(specPos).run();
    expect(success).toBe(true);

    // Verify a table is created
    let tableNode: any = null;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "table") {
        tableNode = node;
      }
    });

    expect(tableNode).not.toBeNull();
    expect(tableNode.childCount).toBe(3); // 3 rows for the 3 items

    const extractedRows: string[][] = [];
    tableNode.forEach((rowNode: any) => {
      const cells: string[] = [];
      rowNode.forEach((cell: any) => {
        cells.push(cell.textContent);
      });
      extractedRows.push(cells);
    });

    expect(extractedRows).toEqual([
      ["Display", "Type", '6.7" OLED'],
      ["Display", "Resolution", "1440 x 3200"],
      ["Battery", "Capacity", "5000 mAh"],
    ]);
  });

  it("completes a full roundtrip conversion (Table -> SpecSheet -> Table -> SpecSheet)", () => {
    const tableDoc = {
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Camera" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Main" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "50MP" }] }] },
              ],
            },
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [{ type: "paragraph" }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Ultrawide" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "12MP" }] }] },
              ],
            },
          ],
        },
      ],
    };

    const editor = createEditor(tableDoc);
    editor.commands.setTextSelection(5);

    // Step 1: Convert Table -> SpecSheet
    (editor.chain() as any).convertTableToSpecSheet().run();

    let specPos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "specSheetBlock") {
        specPos = pos;
      }
    });
    expect(specPos).toBeGreaterThanOrEqual(0);

    // Step 2: Convert SpecSheet -> Table
    (editor.chain() as any).convertSpecSheetToTable(specPos).run();

    let tableFound = false;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "table") tableFound = true;
    });
    expect(tableFound).toBe(true);

    // Step 3: Convert Table -> SpecSheet again
    editor.commands.setTextSelection(5);
    (editor.chain() as any).convertTableToSpecSheet().run();

    let finalSpecNode: any = null;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "specSheetBlock") finalSpecNode = node;
    });
    expect(finalSpecNode).not.toBeNull();
    const finalItems = JSON.parse(finalSpecNode.attrs.items);
    expect(finalItems).toEqual([
      { category: "Camera", key: "Main", value: "50MP" },
      { category: "Camera", key: "Ultrawide", value: "12MP" },
    ]);
  });
});
