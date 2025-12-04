// Prebuild helper for Prisma migrations.
// Por defecto NO corre migraciones en los builds para evitar que
// errores de conexión a la base de datos bloqueen el deploy.
// Si quieres que el build ejecute las migraciones, define
// RUN_PRISMA_MIGRATE_ON_BUILD=1 en el entorno.

/* eslint-disable no-console */

const { spawnSync } = require("node:child_process");

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: "inherit",
    shell: true,
  });
  return result.status ?? 0;
}

async function main() {
  if (process.env.RUN_PRISMA_MIGRATE_ON_BUILD !== "1") {
    console.log(
      "[prebuild-prisma] Saltando prisma migrate en build. " +
        'Si necesitas aplicar migraciones, ejecuta "npm run prisma:deploy" ' +
        'o define RUN_PRISMA_MIGRATE_ON_BUILD=1 en el entorno.',
    );
    return;
  }

  console.log(
    '[prebuild-prisma] Ejecutando "prisma migrate deploy" en build...',
  );
  const code = run("prisma", ["migrate", "deploy"]);
  if (code !== 0) {
    console.error(
      "[prebuild-prisma] prisma migrate deploy terminó con código " +
        code +
        ". Revisa la salida anterior. (El build continuará, pero las migraciones pueden no haberse aplicado).",
    );
  } else {
    console.log("[prebuild-prisma] Migraciones aplicadas correctamente.");
  }
}

main().catch((err) => {
  console.error("[prebuild-prisma] Error inesperado:", err);
});

