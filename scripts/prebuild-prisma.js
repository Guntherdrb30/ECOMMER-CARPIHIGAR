// Prebuild helper for Prisma migrations.
// By defecto NO corre migraciones en los builds para evitar que
// errores de conexión a la base de datos bloqueen el deploy.
// Si quieres que el build ejecute las migraciones, define
// RUN_PRISMA_MIGRATE_ON_BUILD=1 en el entorno.

/* eslint-disable no-console */

const { spawnSync } = require('node:child_process');

function run(cmd, args) {
  const result = spawnSync(cmd, args, {
    stdio: 'inherit',
    shell: true,
  });
  return result.status ?? 0;
}

async function main() {
  if (process.env.RUN_PRISMA_MIGRATE_ON_BUILD !== '1') {
    console.log(
      '[prebuild-prisma] Saltando prisma migrate en build. ' +
        'Si necesitas aplicar migraciones, ejecuta "npm run prisma:deploy" ' +
        'o define RUN_PRISMA_MIGRATE_ON_BUILD=1 en el entorno.',
    );
    return;
  }

  const cmds = [
    ['prisma', ['migrate', 'resolve', '--rolled-back', '20251031060839_payment_instructions']],
    ['prisma', ['migrate', 'resolve', '--rolled-back', '20251102_delivery_contract_payout']],
    ['prisma', ['migrate', 'resolve', '--rolled-back', '20251103_email_verification']],
    ['prisma', ['migrate', 'resolve', '--rolled-back', '20251110165452_assistant_cart_and_tokens']],
    ['prisma', ['migrate', 'resolve', '--rolled-back', '20251110170423_purchase_tokens_temp_orders']],
    ['prisma', ['migrate', 'resolve', '--rolled-back', '20251110171847_driver_models']],
    ['prisma', ['migrate', 'deploy']],
  ];

  for (const [cmd, args] of cmds) {
    const code = run(cmd, args);
    if (code !== 0) {
      console.error(
        `[prebuild-prisma] Comando "${cmd} ${args.join(
          ' ',
        )}" terminó con código ${code}. Revisa la salida anterior.`,
      );
      // No tiramos error para no bloquear el build; si quieres
      // comportamiento estricto, ejecuta "npm run prisma:deploy" aparte.
      break;
    }
  }
}

main().catch((err) => {
  console.error('[prebuild-prisma] Error inesperado:', err);
});

