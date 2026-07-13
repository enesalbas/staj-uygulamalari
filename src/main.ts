import { User, Role } from "./types";

import { readFile } from "fs/promises";

function filterByRole<T extends User>(users: T[], role: Role): T[] {
    return users.filter((user) => user.role==role);
}

async function main() {
  const raw = await readFile("data/users.json", "utf-8");
   const users = JSON.parse(raw);
   const yeniDeger = filterByRole(users, "developer")
   console.log (yeniDeger)
}

main();
