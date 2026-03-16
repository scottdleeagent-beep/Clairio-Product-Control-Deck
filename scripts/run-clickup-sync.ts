import { runClickUpSync } from "../lib/clickup/sync";

async function main() {
  const result = await runClickUpSync();
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
