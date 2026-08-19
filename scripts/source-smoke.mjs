import { access, readFile } from "node:fs/promises";

const required = [
  "app/page.tsx",
  "app/demo/[slug]/page.tsx",
  "components/demo-handwerk.tsx",
  "components/demo-gastro.tsx",
  "components/demo-blumen.tsx",
  "lib/admin-rpc.ts",
  "app/admin/layout.tsx",
];
for (const file of required) await access(file);

const demoRouter = await readFile("app/demo/[slug]/page.tsx", "utf8");
for (const slug of ["handwerk", "gastro", "blumen"]) {
  if (!demoRouter.includes(`slug:\"${slug}\"`) && !demoRouter.includes(`slug:"${slug}"`)) {
    throw new Error(`Missing demo route: ${slug}`);
  }
}

const envExample = await readFile(".env.example", "utf8");
for (const name of ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET", "SUPABASE_SERVICE_ROLE_KEY"]) {
  const line = envExample.split(/\r?\n/).find((value) => value.startsWith(`${name}=`));
  if (!line || line !== `${name}=`) throw new Error(`${name} must remain blank in .env.example`);
}

console.log("Source smoke: required routes and secret placeholders verified.");
