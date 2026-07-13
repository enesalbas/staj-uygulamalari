"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
function filterByRole(users, role) {
    return users.filter((user) => user.role == role);
}
async function main() {
    const raw = await (0, promises_1.readFile)("data/users.json", "utf-8");
    console.log(raw);
}
main();
