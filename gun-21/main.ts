import { Command } from "commander";
import { syncCommand } from "./commands/sync.js";
import { listCommand } from "./commands/list.js";

const program = new Command();

program
  .name("repo-cli")
  .description("GitHub organizasyon repolarini senkronize eden ve listeleyen CLI araci")
  .version("1.0.0");

program.addCommand(syncCommand);
program.addCommand(listCommand);

program.parse();