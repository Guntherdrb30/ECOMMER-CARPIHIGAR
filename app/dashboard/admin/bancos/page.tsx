import { getBankAccounts, getBankTransactions, createBankAccount } from "@/server/actions/banking";
import { PendingButton } from "@/components/pending-button";

export default async function BancosPage() {
  const [accounts, transactions] = await Promise.all([
    getBankAccounts().catch(() => [] as any[]),
    getBankTransactions().catch(() => [] as any[]),
  ]);

  return (
    <div className="container mx-auto p-4 space-y-4">
      <h1 className="text-2xl font-bold">Bancos y cuentas</h1>

      <div className="form-card">
        <h2 className="text-lg font-semibold mb-2">Crear cuenta bancaria</h2>
        <form
          action={async (formData) => {
            "use server";
            await createBankAccount(formData);
          }}
          className="form-grid"
        >
          <div>
            <label className="form-label" htmlFor="name">Nombre interno</label>
            <input id="name" name="name" className="form-input" placeholder="Banco Mercantil USD" required />
          </div>
          <div>
            <label className="form-label" htmlFor="bankName">Banco</label>
            <input id="bankName" name="bankName" className="form-input" placeholder="Nombre del banco (opcional)" />
          </div>
          <div>
            <label className="form-label" htmlFor="accountNumber">N° de cuenta / wallet</label>
            <input id="accountNumber" name="accountNumber" className="form-input" placeholder="0000-0000-00-0000000000" />
          </div>
          <div>
            <label className="form-label" htmlFor="currency">Moneda</label>
            <select id="currency" name="currency" className="form-select" defaultValue="USD">
              <option value="USD">USD</option>
              <option value="VES">Bs</option>
              <option value="USDT">Binance / USDT</option>
            </select>
          </div>
          <div>
            <label className="form-label" htmlFor="initialBalance">Saldo inicial</label>
            <input id="initialBalance" name="initialBalance" type="number" step={0.01} min={0} className="form-input" defaultValue={0} />
          </div>
          <div className="md:col-span-3 flex justify-end">
            <PendingButton className="bg-green-600 text-white px-3 py-1 rounded" pendingText="Creando…">
              Guardar cuenta
            </PendingButton>
          </div>
        </form>
      </div>

      <div className="form-card">
        <h2 className="text-lg font-semibold mb-2">Cuentas registradas</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left">Nombre</th>
                <th className="px-3 py-2">Banco</th>
                <th className="px-3 py-2">N° cuenta / wallet</th>
                <th className="px-3 py-2">Moneda</th>
                <th className="px-3 py-2">Saldo inicial</th>
                <th className="px-3 py-2">Activa</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((a: any) => (
                <tr key={a.id}>
                  <td className="border px-3 py-2">{a.name}</td>
                  <td className="border px-3 py-2 text-center">{a.bankName || '—'}</td>
                  <td className="border px-3 py-2 text-center">{a.accountNumber || '—'}</td>
                  <td className="border px-3 py-2 text-center">{a.currency}</td>
                  <td className="border px-3 py-2 text-right">
                    {Number(a.initialBalance || 0).toFixed(2)}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    {a.isActive ? 'Sí' : 'No'}
                  </td>
                </tr>
              ))}
              {accounts.length === 0 && (
                <tr>
                  <td className="px-3 py-2 text-sm text-gray-500" colSpan={6}>
                    No hay cuentas registradas todavía.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="form-card">
        <h2 className="text-lg font-semibold mb-2">Últimos movimientos</h2>
        <div className="overflow-x-auto">
          <table className="w-full table-auto text-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2">Cuenta</th>
                <th className="px-3 py-2">Tipo</th>
                <th className="px-3 py-2">Monto</th>
                <th className="px-3 py-2">Moneda</th>
                <th className="px-3 py-2">Referencia</th>
                <th className="px-3 py-2">Compra ligada</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t: any) => (
                <tr key={t.id}>
                  <td className="border px-3 py-2">
                    {new Date(t.createdAt).toLocaleString()}
                  </td>
                  <td className="border px-3 py-2">
                    {t.bankAccount?.name || '—'}
                  </td>
                  <td className="border px-3 py-2 text-center">{t.type}</td>
                  <td className="border px-3 py-2 text-right">
                    {Number(t.amount || 0).toFixed(2)}
                  </td>
                  <td className="border px-3 py-2 text-center">{t.currency}</td>
                  <td className="border px-3 py-2 text-center">
                    {t.reference || '—'}
                  </td>
                  <td className="border px-3 py-2 text-center">
                    {t.purchaseId ? (
                      <a
                        href="/dashboard/admin/compras"
                        className="text-blue-600 hover:underline"
                      >
                        Compra {String(t.purchaseId).slice(-6)}
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td className="px-3 py-2 text-sm text-gray-500" colSpan={7}>
                    Aún no hay movimientos bancarios registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

