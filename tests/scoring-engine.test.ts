import { describe, it, expect } from "vitest";
import { calculateXSypherScore } from "@/lib/scoringEngine";

describe("xSypher Tabbed Scoring Engine", () => {
  it("handles empty or invalid inputs gracefully", () => {
    const res = calculateXSypherScore([]);
    expect(res.overallScore).toBe(0);
    expect(res.scaleMax).toBe(100);
    expect(res.groups).toHaveLength(0);
    expect(res.useCases).toHaveLength(0);
  });

  it("calculates weighted group scores and master score accurately", () => {
    const items = [
      { group: "Photo", metric: "Exposure", score: 150, topScore: 160, weight: 2.0 },
      { group: "Photo", metric: "Color", score: 100, topScore: 120, weight: 1.0 },
      // Photo score = (150*2 + 100*1) / (2+1) = 400 / 3 = 133.333 -> 133
      { group: "Video", metric: "Autofocus", score: 160, topScore: 170, weight: 1.0 },
      { group: "Video", metric: "Stabilization", score: 140, topScore: 150, weight: 1.0 },
      // Video score = (160*1 + 140*1) / 2 = 150
      // Video topScore = (170*1 + 150*1) / 2 = 160
    ];

    const result = calculateXSypherScore(items);
    expect(result.groups).toHaveLength(2);

    const photoGroup = result.groups.find(g => g.group === "Photo");
    expect(photoGroup).toBeDefined();
    expect(photoGroup?.score).toBe(133);

    const videoGroup = result.groups.find(g => g.group === "Video");
    expect(videoGroup).toBeDefined();
    expect(videoGroup?.score).toBe(150);
    expect(videoGroup?.topScore).toBe(160);

    // Photo weight = (2+1)/2 = 1.5. Video weight = (1+1)/2 = 1.0.
    // Overall = (133 * 1.5 + 150 * 1.0) / 2.5 = (199.5 + 150) / 2.5 = 349.5 / 2.5 = 139.8 -> 140
    expect(result.overallScore).toBe(140);
    expect(result.scaleMax).toBe(200);
  });

  it("extracts and evaluates Use Cases into dedicated badges with descriptions", () => {
    const items = [
      { group: "Display", metric: "Brightness", score: 120, topScore: 140, weight: 1.0 },
      { group: "Use Cases", metric: "Lowlight", score: 135, topScore: 140, isUseCase: true },
      { group: "Use Cases", metric: "Portrait", score: 145, topScore: 150, isUseCase: true },
    ];

    const result = calculateXSypherScore(items);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].group).toBe("Display");
    expect(result.useCases).toHaveLength(2);
    expect(result.useCases[0].label).toBe("Lowlight");
    expect(result.useCases[0].score).toBe(135);
    expect(result.useCases[0].topScore).toBe(140);
    expect(result.useCases[0].description).toContain("low-light");

    expect(result.useCases[1].label).toBe("Portrait");
    expect(result.useCases[1].score).toBe(145);
    expect(result.useCases[1].topScore).toBe(150);
    expect(result.useCases[1].description).toContain("skin tone");
  });

  it("dynamically isolates score and top score when switching active tabs", () => {
    const multiTabItems = [
      // Camera Tab
      { tab: "Camera", subCategory: "Photo", metric: "Main", score: 160, topScore: 165, weight: 1.0 },
      { tab: "Camera", subCategory: "Video", metric: "Exposure", score: 150, topScore: 155, weight: 1.0 },
      // Display Tab
      { tab: "Display", subCategory: "Readability", metric: "Sunlight", score: 140, topScore: 145, weight: 1.0 },
      { tab: "Display", subCategory: "Color", metric: "Accuracy", score: 130, topScore: 135, weight: 1.0 },
    ];

    const cameraRes = calculateXSypherScore(multiTabItems, "Camera");
    expect(cameraRes.activeTab).toBe("Camera");
    expect(cameraRes.overallScore).toBe(155); // (160 + 150) / 2
    expect(cameraRes.overallTopScore).toBe(160); // (165 + 155) / 2
    expect(cameraRes.subCategories).toHaveLength(2);
    expect(cameraRes.subCategories[0].name).toBe("Photo");
    expect(cameraRes.subCategories[1].name).toBe("Video");

    const displayRes = calculateXSypherScore(multiTabItems, "Display");
    expect(displayRes.activeTab).toBe("Display");
    expect(displayRes.overallScore).toBe(135); // (140 + 130) / 2
    expect(displayRes.overallTopScore).toBe(140); // (145 + 135) / 2
    expect(displayRes.subCategories).toHaveLength(2);
    expect(displayRes.subCategories[0].name).toBe("Readability");
    expect(displayRes.subCategories[1].name).toBe("Color");
  });

  it("dynamically adjusts scaleMax based on peak benchmark values", () => {
    const legacyItems = [
      { label: "Design", score: 8.5 },
      { label: "Performance", score: 9.0 },
    ];
    const legacyRes = calculateXSypherScore(legacyItems);
    expect(legacyRes.scaleMax).toBe(10);

    const midItems = [
      { group: "General", metric: "Productivity", score: 85, topScore: 95 },
    ];
    const midRes = calculateXSypherScore(midItems);
    expect(midRes.scaleMax).toBe(100);

    const flagshipItems = [
      { group: "Camera", metric: "Zoom", score: 175, topScore: 185 },
    ];
    const flagshipRes = calculateXSypherScore(flagshipItems);
    expect(flagshipRes.scaleMax).toBe(200);

    const ultraItems = [
      { group: "Compute", metric: "Ray Tracing", score: 245, topScore: 260 },
    ];
    const ultraRes = calculateXSypherScore(ultraItems);
    expect(ultraRes.scaleMax).toBe(260);
  });
});
