#!/usr/bin/env node

import { Command } from "commander";
import { glob } from "glob";
import ora from "ora";
import chalk from "chalk";
import { LogParser } from "../parser/log-parser.js";
import { SessionAnalyzer } from "../analyzers/sessions.js";
import { BanAnalyzer } from "../analyzers/bans.js";
import { CrashAnalyzer } from "../analyzers/crashes.js";
import { ResourceAnalyzer } from "../analyzers/resources.js";
import { ConsoleReporter } from "../reporters/console.js";
import { JsonReporter } from "../reporters/json.js";
import { formatDuration, formatBytes, formatDate } from "../utils/format.js";
import type { AnalysisReport, PlayerSummary } from "../parser/types.js";

const program = new Command();

program
  .name("txlog")
  .description("Analyze txAdmin logs from FiveM/RedM servers")
  .version("1.0.0");

program
  .command("analyze")
  .description("Analyze log files and generate a report")
  .argument("<path>", "Path to log file or directory containing .log files")
  .option("-o, --output <file>", "Export report to JSON file")
  .option("--top <n>", "Number of top players to show", "10")
  .option("--no-chart", "Hide hourly activity chart")
  .action(async (path: string, opts) => {
    const spinner = ora("Scanning for log files...").start();

    const files = path.endsWith(".log")
      ? [path]
      : await glob(`${path}/**/*.log`);

    if (files.length === 0) {
      spinner.fail("No log files found.");
      process.exit(1);
    }

    spinner.text = `Parsing ${files.length} log file(s)...`;

    const parser = new LogParser();
    const allEntries = [];
    let totalSize = 0;
    let totalLines = 0;

    for (const file of files) {
      const result = parser.parse(file);
      allEntries.push(...result.entries);
      totalSize += result.fileSize;
      totalLines += result.totalLines;
    }

    spinner.text = "Analyzing player sessions...";
    const sessionAnalyzer = new SessionAnalyzer();
    const playerEvents = parser.extractPlayerEvents();
    const { sessions, summaries, hourly, peakConcurrent, peakTime } =
      sessionAnalyzer.analyze(playerEvents);

    spinner.text = "Analyzing bans and kicks...";
    const banAnalyzer = new BanAnalyzer();
    const { bans, kicks, warnings } = banAnalyzer.analyze(playerEvents);

    spinner.text = "Analyzing crashes...";
    const crashAnalyzer = new CrashAnalyzer();
    const resourceEvents = parser.extractResourceEvents();
    const crashes = crashAnalyzer.analyze(allEntries as any, playerEvents, resourceEvents);

    spinner.text = "Analyzing resources...";
    const resourceAnalyzer = new ResourceAnalyzer();
    const resources = resourceAnalyzer.analyze(resourceEvents);

    spinner.succeed(
      `Parsed ${totalLines.toLocaleString()} lines (${formatBytes(totalSize)}) from ${files.length} file(s)`
    );

    const timestamps = allEntries.map((e) => e.timestamp);
    const topPlayers: PlayerSummary[] = summaries
      .slice(0, parseInt(opts.top))
      .map((s) => ({
        name: s.playerName,
        totalTime: formatDuration(s.totalTimeMs),
        sessions: s.totalSessions,
        warnings: warnings.filter((w) => w.playerName === s.playerName).length,
        kicks: kicks.filter((k) => k.playerName === s.playerName).length,
      }));

    const report: AnalysisReport = {
      summary: {
        totalEntries: allEntries.length,
        timeRange: {
          start: formatDate(new Date(Math.min(...timestamps.map((t) => t.getTime())))),
          end: formatDate(new Date(Math.max(...timestamps.map((t) => t.getTime())))),
        },
        uniquePlayers: summaries.length,
        totalSessions: sessions.length,
        totalBans: bans.length,
        totalKicks: kicks.length,
        totalCrashes: crashes.length,
        avgSessionDuration: formatDuration(
          sessions.length > 0
            ? sessions.reduce((s, x) => s + x.durationMs, 0) / sessions.length
            : 0
        ),
        peakConcurrent,
        peakTime: formatDate(peakTime),
      },
      sessions: summaries,
      bans,
      crashes,
      resources,
      hourlyActivity: hourly,
      topPlayers,
    };

    const consoleReporter = new ConsoleReporter();
    consoleReporter.render(report);

    if (opts.output) {
      const jsonReporter = new JsonReporter();
      jsonReporter.export(report, opts.output);
      console.log(chalk.green(`  Report exported to ${opts.output}\n`));
    }
  });

program
  .command("watch")
  .description("Watch a log file for new entries in real-time")
  .argument("<file>", "Path to log file")
  .option("--filter <action>", "Filter by action type (e.g., player.ban)")
  .action((file: string, opts) => {
    console.log(chalk.hex("#f97316").bold("\n  TX LOG ANALYZER — WATCH MODE\n"));
    console.log(chalk.gray(`  Watching: ${file}`));
    if (opts.filter) console.log(chalk.gray(`  Filter: ${opts.filter}`));
    console.log(chalk.gray("  Press Ctrl+C to stop.\n"));

    const { watch } = require("fs");
    let lastSize = 0;
    const parser = new LogParser();

    watch(file, () => {
      const result = parser.parse(file);
      const newEntries = result.entries.filter((_, i) => i >= lastSize);
      lastSize = result.entries.length;

      for (const entry of newEntries) {
        if (opts.filter && entry.action !== opts.filter) continue;

        const time = chalk.gray(formatDate(entry.timestamp));
        const level =
          entry.level === "error"
            ? chalk.red(entry.level)
            : entry.level === "warn"
            ? chalk.yellow(entry.level)
            : chalk.green(entry.level);
        const action = chalk.cyan(entry.action);

        console.log(`  ${time} ${level} ${action} ${entry.message}`);
      }
    });
  });

program
  .command("players")
  .description("List all unique players found in logs")
  .argument("<path>", "Path to log file or directory")
  .option("--sort <field>", "Sort by: time, sessions, name", "time")
  .action(async (path: string, opts) => {
    const files = path.endsWith(".log")
      ? [path]
      : await glob(`${path}/**/*.log`);

    const parser = new LogParser();
    for (const file of files) parser.parse(file);

    const playerEvents = parser.extractPlayerEvents();
    const sessionAnalyzer = new SessionAnalyzer();
    const { summaries } = sessionAnalyzer.analyze(playerEvents);

    const sorted = [...summaries].sort((a, b) => {
      if (opts.sort === "name") return a.playerName.localeCompare(b.playerName);
      if (opts.sort === "sessions") return b.totalSessions - a.totalSessions;
      return b.totalTimeMs - a.totalTimeMs;
    });

    console.log(chalk.hex("#f97316").bold(`\n  PLAYERS (${sorted.length})\n`));

    for (const player of sorted) {
      console.log(
        `  ${chalk.white(player.playerName.padEnd(24))} ` +
        `${chalk.gray("Time:")} ${formatDuration(player.totalTimeMs).padEnd(8)} ` +
        `${chalk.gray("Sessions:")} ${player.totalSessions.toString().padEnd(4)} ` +
        `${chalk.gray("Last seen:")} ${formatDate(player.lastSeen)}`
      );
    }
    console.log();
  });

program.parse();
