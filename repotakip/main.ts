import { Command } from "commander";
import { fetchCommand } from "./commands/fetch.js";
import { listCommand } from "./commands/list.js";
import { statsCommand } from "./commands/stats.js";
import { exportCommand } from "./commands/export.js";


const program = new Command();

program
  .name("repotakip")
  .description("GitHub organizasyon repolarini senkronize eden ve listeleyen CLI araci")
  .version("1.0.0");

program.addCommand(fetchCommand);
program.addCommand(listCommand);
program.addCommand(statsCommand);
program.addCommand(exportCommand);
program.parse();