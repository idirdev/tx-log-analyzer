import chalk from "chalk";
import Table from "cli-table3";
import type { AnalysisReport } from "../parser/types.js";
import { formatDuration, truncate } from "../utils/format.js";

export class ConsoleReporter {
  render(report: AnalysisReport): void {
    this.renderHeader();
    this.renderSummary(report);
    this.renderTopPlayers(report);
    this.renderBans(report);
    this.renderCrashes(report);
    this.renderResources(report);
    this.renderHourlyChart(report);
  }

  private renderHeader(): void {
    console.log();
    console.log(chalk.hex("#f97316").bold("  TX LOG ANALYZER"));
    console.log(chalk.gray("  FiveM/RedM server log analysis\n"));
  }

  private renderSummary(report: AnalysisReport): void {
    console.log(chalk.white.bold("  SUMMARY"));
    console.log(chalk.gray("  ─".repeat(30)));

    const s = report.summary;
    const pairs = [
      ["Total Entries", s.totalEntries.toLocaleString()],
      ["Time Range", `${s.timeRange.start} → ${s.timeRange.end}`],
      ["Unique Players", s.uniquePlayers.toString()],
      ["Total Sessions", s.totalSessions.toString()],
      ["Avg Session", s.avgSessionDuration],
      ["Peak Concurrent", `${s.peakConcurrent} (${s.peakTime})`],
      ["Total Bans", chalk.red(s.totalBans.toString())],
      ["Total Kicks", chalk.yellow(s.totalKicks.toString())],
      ["Crashes", s.totalCrashes > 0 ? chalk.red(s.totalCrashes.toString()) : chalk.green("0")],
    ];

    for (const [label, value] of pairs) {
      console.log(`  ${chalk.gray(label.padEnd(18))} ${value}`);
    }
    console.log();
  }

  private renderTopPlayers(report: AnalysisReport): void {
    if (report.topPlayers.length === 0) return;

    console.log(chalk.white.bold("  TOP PLAYERS (by playtime)"));
    const table = new Table({
      head: ["Player", "Total Time", "Sessions", "Warns", "Kicks"],
      style: { head: ["cyan"], border: ["gray"] },
      chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
    });

    for (const p of report.topPlayers.slice(0, 10)) {
      table.push([
        p.name,
        p.totalTime,
        p.sessions.toString(),
        p.warnings > 0 ? chalk.yellow(p.warnings.toString()) : "0",
        p.kicks > 0 ? chalk.red(p.kicks.toString()) : "0",
      ]);
    }

    console.log(table.toString());
    console.log();
  }

  private renderBans(report: AnalysisReport): void {
    if (report.bans.length === 0) return;

    console.log(chalk.white.bold("  RECENT BANS"));
    const table = new Table({
      head: ["Time", "Player", "Admin", "Reason"],
      style: { head: ["red"], border: ["gray"] },
      colWidths: [22, 20, 16, 40],
      chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
    });

    for (const ban of report.bans.slice(0, 10)) {
      table.push([
        ban.timestamp.toISOString().substring(0, 19),
        ban.playerName,
        ban.adminName,
        truncate(ban.reason, 38),
      ]);
    }

    console.log(table.toString());
    console.log();
  }

  private renderCrashes(report: AnalysisReport): void {
    if (report.crashes.length === 0) {
      console.log(chalk.green("  No server crashes detected.\n"));
      return;
    }

    console.log(chalk.red.bold(`  SERVER CRASHES (${report.crashes.length})`));
    for (const crash of report.crashes) {
      console.log(
        `  ${chalk.gray("Time:")} ${crash.timestamp.toISOString().substring(0, 19)}`
      );
      console.log(
        `  ${chalk.gray("Uptime:")} ${formatDuration(crash.uptime)}`
      );
      if (crash.possibleCause) {
        console.log(`  ${chalk.gray("Cause:")} ${chalk.yellow(crash.possibleCause)}`);
      }
      if (crash.lastPlayers.length > 0) {
        console.log(
          `  ${chalk.gray("Players:")} ${crash.lastPlayers.join(", ")}`
        );
      }
      console.log();
    }
  }

  private renderResources(report: AnalysisReport): void {
    const problematic = report.resources.filter((r) => r.errors > 0);
    if (problematic.length === 0) return;

    console.log(chalk.white.bold("  PROBLEMATIC RESOURCES"));
    const table = new Table({
      head: ["Resource", "Starts", "Errors", "Last Error"],
      style: { head: ["yellow"], border: ["gray"] },
      colWidths: [25, 10, 10, 50],
      chars: { mid: "", "left-mid": "", "mid-mid": "", "right-mid": "" },
    });

    for (const r of problematic.slice(0, 10)) {
      table.push([
        r.name,
        r.starts.toString(),
        chalk.red(r.errors.toString()),
        truncate(r.lastError || "-", 48),
      ]);
    }

    console.log(table.toString());
    console.log();
  }

  private renderHourlyChart(report: AnalysisReport): void {
    console.log(chalk.white.bold("  HOURLY ACTIVITY"));

    const maxJoins = Math.max(...report.hourlyActivity.map((h) => h.joins), 1);
    const barWidth = 40;

    for (const bucket of report.hourlyActivity) {
      const hour = bucket.hour.toString().padStart(2, "0") + ":00";
      const barLen = Math.round((bucket.joins / maxJoins) * barWidth);
      const bar = "█".repeat(barLen) + "░".repeat(barWidth - barLen);
      const label = `${bucket.joins}j/${bucket.leaves}l`;
      console.log(`  ${chalk.gray(hour)} ${chalk.hex("#f97316")(bar)} ${chalk.gray(label)}`);
    }
    console.log();
  }
}
