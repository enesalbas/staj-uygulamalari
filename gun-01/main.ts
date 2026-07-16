import { readFile } from "fs/promises";
import { User, Role } from "./types";

function filterByRole<T extends User>(users: T[], role: Role): T[] {
  return users.filter((user) => user.role === role);
}

async function main() {
  try {
    const raw = await readFile("data/users.json", "utf-8");
    const users: User[] = JSON.parse(raw);
    const filtrelenmis = filterByRole(users, "developer");
    console.log(filtrelenmis);
  } catch (err) {
    console.error("Kullanıcı listesi okunurken bir hata oluştu:", (err as Error).message);
  }
}

main();