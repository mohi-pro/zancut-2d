// The owner's hub setup from the terminal (no plain password is ever stored: scrypt hashes in data/hub/):
//   npm run hub-owner -- set-password "<owner password>"     (or set ZANCUT_OWNER_PASSPHRASE for the vault master key)
import { setOwnerPassword } from "../server/central-hub.mjs";
const [cmd, arg] = process.argv.slice(2);
if (cmd === "set-password" && arg) { setOwnerPassword(arg); console.log("owner password set (data/hub/owner.json, scrypt). Open http://127.0.0.1:4500/hub.html to manage users and approve learnings."); }
else { console.error('usage: npm run hub-owner -- set-password "<at least 10 characters>"'); process.exit(2); }
