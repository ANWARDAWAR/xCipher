import { describe, it, expect } from "vitest";
import { Editor } from "@tiptap/core";
import StarterKit from "@tiptap/starter-kit";
import { Table } from "@tiptap/extension-table";
import { TableRow } from "@tiptap/extension-table-row";
import { TableCell } from "@tiptap/extension-table-cell";
import { TableHeader } from "@tiptap/extension-table-header";
import { ProsConsBlock } from "@/components/editorial/extensions/ProsConsBlock";

describe("Bidirectional Table <-> ProsConsBlock Conversion", () => {
  const createEditor = (contentJson: any) => {
    return new Editor({
      content: contentJson,
      extensions: [
        StarterKit,
        Table.configure({ resizable: true }),
        TableRow,
        TableCell,
        TableHeader,
        ProsConsBlock,
      ],
    });
  };

  it("converts a 2-column table into a ProsConsBlock, skipping headers and empty strings", () => {
    const tableDoc = {
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Pros" }] }] },
                { type: "tableHeader", content: [{ type: "paragraph", content: [{ type: "text", text: "Cons" }] }] },
              ],
            },
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Stunning 120Hz display" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "High starting price" }] }] },
              ],
            },
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Exceptional battery life" }] }] },
                { type: "tableCell", content: [{ type: "paragraph" }] }, // empty con
              ],
            },
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [{ type: "paragraph" }] }, // empty pro
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "No charger in box" }] }] },
              ],
            },
          ],
        },
      ],
    };

    const editor = createEditor(tableDoc);
    editor.commands.setTextSelection(5);
    expect(editor.isActive("table")).toBe(true);

    const success = (editor.chain() as any).convertTableToProsCons().run();
    expect(success).toBe(true);

    // Table should no longer exist
    expect(editor.isActive("table")).toBe(false);

    let prosConsNode: any = null;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "prosConsBlock") {
        prosConsNode = node;
      }
    });

    expect(prosConsNode).not.toBeNull();
    const pros = JSON.parse(prosConsNode.attrs.pros);
    const cons = JSON.parse(prosConsNode.attrs.cons);

    expect(pros).toEqual([
      "Stunning 120Hz display",
      "Exceptional battery life",
    ]);

    expect(cons).toEqual([
      "High starting price",
      "No charger in box",
    ]);
  });

  it("converts a ProsConsBlock back into a standard 2-column table with max length alignment", () => {
    const pros = ["Great cameras", "Fast charging", "Clean software"];
    const cons = ["No microSD slot"]; // shorter than pros

    const doc = {
      type: "doc",
      content: [
        {
          type: "prosConsBlock",
          attrs: {
            pros: JSON.stringify(pros),
            cons: JSON.stringify(cons),
          },
        },
      ],
    };

    const editor = createEditor(doc);

    let pos = -1;
    editor.state.doc.descendants((node, p) => {
      if (node.type.name === "prosConsBlock") pos = p;
    });

    expect(pos).toBeGreaterThanOrEqual(0);

    const success = (editor.chain() as any).convertProsConsToTable(pos).run();
    expect(success).toBe(true);

    let tableNode: any = null;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "table") tableNode = node;
    });

    expect(tableNode).not.toBeNull();
    expect(tableNode.childCount).toBe(3); // Math.max(3, 1) = 3 rows

    const rows: string[][] = [];
    tableNode.forEach((row: any) => {
      const cells: string[] = [];
      row.forEach((cell: any) => cells.push(cell.textContent));
      rows.push(cells);
    });

    expect(rows).toEqual([
      ["Great cameras", "No microSD slot"],
      ["Fast charging", ""],
      ["Clean software", ""],
    ]);
  });

  it("completes a full roundtrip conversion (Table -> ProsCons -> Table -> ProsCons)", () => {
    const tableDoc = {
      type: "doc",
      content: [
        {
          type: "table",
          content: [
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Pro 1" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Con 1" }] }] },
              ],
            },
            {
              type: "tableRow",
              content: [
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Pro 2" }] }] },
                { type: "tableCell", content: [{ type: "paragraph", content: [{ type: "text", text: "Con 2" }] }] },
              ],
            },
          ],
        },
      ],
    };

    const editor = createEditor(tableDoc);
    editor.commands.setTextSelection(5);

    // Step 1: Convert Table -> ProsCons
    (editor.chain() as any).convertTableToProsCons().run();

    let pcPos = -1;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "prosConsBlock") pcPos = pos;
    });
    expect(pcPos).toBeGreaterThanOrEqual(0);

    // Step 2: Convert ProsCons -> Table
    (editor.chain() as any).convertProsConsToTable(pcPos).run();

    let tableFound = false;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "table") tableFound = true;
    });
    expect(tableFound).toBe(true);

    // Step 3: Convert Table -> ProsCons again
    editor.commands.setTextSelection(5);
    (editor.chain() as any).convertTableToProsCons().run();

    let finalNode: any = null;
    editor.state.doc.descendants((node) => {
      if (node.type.name === "prosConsBlock") finalNode = node;
    });
    expect(finalNode).not.toBeNull();
    const finalPros = JSON.parse(finalNode.attrs.pros);
    const finalCons = JSON.parse(finalNode.attrs.cons);
    expect(finalPros).toEqual(["Pro 1", "Pro 2"]);
    expect(finalCons).toEqual(["Con 1", "Con 2"]);
  });
});
