import { writeFileSync } from "fs";
import type { AnalysisReport } from "../parser/types.js";

export class JsonReporter {
  export(report: AnalysisReport, outputPath: string): void {
    const json = JSON.stringify(report, null, 2);
    writeFileSync(outputPath, json, "utf-8");
  }

  toString(report: AnalysisReport): string {
    return JSON.stringify(report, null, 2);
  }
}
