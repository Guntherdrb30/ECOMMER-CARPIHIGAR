"use client";

import { PendingButton } from '@/components/pending-button';
import SecretDeleteButton from '@/components/admin/secret-delete-button';
import { updateProductInline, createStockMovement, updateProductBarcodeByForm, deleteProductByForm, anonymizeProductByForm } from '@/server/actions/products';

type Props = { product: any; lowStock?: number; isRoot?: boolean };

export default function ProductActionsMenu({ product, lowStock = 5, isRoot = false }: Props) {
  return (
    <details className="relative">
      <summary className="cursor-pointer inline-flex items-center px-2 py-1 border rounded text-sm bg-white hover:bg-gray-50">Acciones</summary>
      <div className="absolute right-0 top-full z-50 mt-1 w-[22rem] p-3 border rounded bg-white shadow-lg space-y-3">
        <div className="text-xs text-gray-600">Edicion rapida</div>
        <form action={updateProductInline} className="flex flex-wrap gap-2 items-center text-sm">
          <input type="hidden" name="id" value={product.id} />
          <input name="priceUSD" type="number" step="0.01" defaultValue={Number(product.priceUSD)} className="w-24 border rounded px-1 py-0.5" />
          <input name="priceAllyUSD" type="number" step="0.01" defaultValue={product.priceAllyUSD != null ? Number(product.priceAllyUSD) : undefined} className="w-24 border rounded px-1 py-0.5" />
          <input name="stock" type="number" defaultValue={product.stock} className="w-20 border rounded px-1 py-0.5" />
          <label className="inline-flex items-center gap-1"><input type="checkbox" name="isNew" defaultChecked={product.isNew} /> Nuevo</label>
          <input name="image" placeholder="URL img" className="w-40 border rounded px-1 py-0.5" />
          <PendingButton className="px-2 py-1 bg-gray-800 text-white rounded" pendingText="Guardando...">Guardar</PendingButton>
        </form>

        <div className="text-xs text-gray-600">Movimiento de stock</div>
        <form action={createStockMovement} className="flex flex-wrap gap-2 items-center text-sm">
          <input type="hidden" name="productId" value={product.id} />
          <select name="type" className="border rounded px-1 py-0.5">
            <option value="ENTRADA">Entrada</option>
            <option value="SALIDA">Salida</option>
            <option value="AJUSTE">Ajuste</option>
          </select>
          <input name="quantity" type="number" min="1" placeholder="Qty" className="w-20 border rounded px-1 py-0.5" />
          <input name="reason" placeholder="Motivo" className="w-40 border rounded px-1 py-0.5" />
          <PendingButton className="px-2 py-1 border rounded" pendingText="Moviendo...">Mover</PendingButton>
        </form>

        <div className="text-xs text-gray-600">Codigo de barras</div>
        <form action={updateProductBarcodeByForm} className="flex flex-wrap gap-2 items-center text-sm">
          <input type="hidden" name="id" value={product.id} />
          <input name="barcode" defaultValue={(product as any).barcode || ''} placeholder="EAN-13" className="w-40 border rounded px-1 py-0.5" />
          <PendingButton className="px-2 py-1 bg-gray-800 text-white rounded" pendingText="Guardando...">Guardar codigo</PendingButton>
          {!(product as any).barcode && (
            <button name="generate" value="1" className="px-2 py-1 border rounded" title="Generar EAN-13">Generar</button>
          )}
        </form>

        <div className="flex items-center justify-between pt-2">
          <a className="text-blue-600 hover:underline text-sm" href={`/dashboard/admin/productos/${product.id}`}>Editar detalle</a>
          <div className="flex items-center gap-3">
            {isRoot ? (
              <SecretDeleteButton
                action={anonymizeProductByForm as any}
                hidden={{ id: product.id }}
                label="Anonimizar"
                title="Anonimizar producto"
                description="Oculta los datos del producto y conserva historicos. Requiere clave secreta."
              />
            ) : null}
            {isRoot ? (
              <SecretDeleteButton
                action={deleteProductByForm as any}
                hidden={{ id: product.id }}
                label="Eliminar"
                title="Eliminar producto"
                description="Esta accion eliminara el producto y no se puede deshacer."
              />
            ) : null}
          </div>
        </div>
      </div>
    </details>
  );
}
