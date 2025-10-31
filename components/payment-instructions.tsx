'use client';

import { useEffect, useMemo, useState } from 'react';

type Method = 'PAGO_MOVIL' | 'TRANSFERENCIA' | 'ZELLE';
type Currency = 'USD' | 'VES';

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="ml-2 px-2 py-1 text-xs border border-blue-300 text-blue-800 rounded hover:bg-blue-100"
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch {}
      }}
    >
      {copied ? 'Copiado' : `Copiar ${label}`}
    </button>
  );
}

export default function PaymentInstructions({ method, currency }: { method: Method; currency: Currency }) {
  const [s, setS] = useState<any>(null);
  const [selectedBank, setSelectedBank] = useState<string>('');
  const [open, setOpen] = useState(true);
  const [lsKey, setLsKey] = useState<string>('checkout.paymentInstructions.open');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try { const r = await fetch('/api/settings/payment', { cache: 'no-store' }); if (!r.ok) return; const j = await r.json(); if (!cancelled) setS(j); } catch {}
    })();
    return () => { cancelled = true };
  }, []);

  // Resolve per-user key (by userId) to persist open/closed state per account
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch('/api/me/location', { credentials: 'include' });
        if (!r.ok) return;
        const j = await r.json();
        if (cancelled) return;
        const uid = String(j?.userId || '').trim();
        if (uid) setLsKey(`checkout.paymentInstructions.open:${uid}`);
      } catch {}
    })();
    return () => { cancelled = true };
  }, []);
  // Load and save using the resolved lsKey
  useEffect(() => {
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw != null) setOpen(raw === '1' || raw === 'true');
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lsKey]);
  useEffect(() => {
    try { localStorage.setItem(lsKey, open ? '1' : '0'); } catch {}
  }, [open, lsKey]);

  // Cleanup: remove legacy keys (global or email-based) once we have a per-user key
  useEffect(() => {
    try {
      // remove old global key
      if (lsKey !== 'checkout.paymentInstructions.open') {
        localStorage.removeItem('checkout.paymentInstructions.open');
      }
      // remove any email-based keys
      const toDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || '';
        if (k.startsWith('checkout.paymentInstructions.open:') && k.includes('@') && k !== lsKey) {
          toDelete.push(k);
        }
      }
      for (const k of toDelete) localStorage.removeItem(k);
    } catch {}
  }, [lsKey]);

  // Observe bank selects if present
  useEffect(() => {
    const pick = () => {
      const el = (document.getElementById('deposit_bank') as HTMLSelectElement | null) || (document.getElementById('transfer_bank') as HTMLSelectElement | null);
      const v = (el?.value || '').toUpperCase();
      setSelectedBank(v);
    };
    pick();
    const handler = () => pick();
    const dep = document.getElementById('deposit_bank');
    const trn = document.getElementById('transfer_bank');
    dep?.addEventListener('change', handler);
    trn?.addEventListener('change', handler);
    return () => { dep?.removeEventListener('change', handler); trn?.removeEventListener('change', handler); };
  }, [method, currency]);

  const show = Boolean(method && currency);
  if (!show || !s) return null;

  const Box = ({ children }: { children: any }) => (
    <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 shadow-sm">{children}</div>
  );

  if (currency === 'USD' && method === 'ZELLE') {
    const email = String(s.paymentZelleEmail || '').trim();
    if (!email) return null;
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-semibold text-gray-700">Instrucciones de pago</div>
          <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs text-blue-700 hover:text-blue-900 underline">
            {open ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {open && (
          <Box>
            <div className="font-semibold mb-1">Paga por Zelle</div>
            <div className="flex items-center">Correo: <span className="ml-1 font-mono">{email}</span> <CopyBtn text={email} label="correo" /></div>
          </Box>
        )}
      </div>
    );
  }

  if (method === 'PAGO_MOVIL' && currency === 'VES') {
    const phone = String(s.paymentPmPhone || '').trim();
    const rif = String(s.paymentPmRif || '').trim();
    const bank = String(s.paymentPmBank || '').trim();
    if (!phone && !rif && !bank) return null;
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-semibold text-gray-700">Instrucciones de pago</div>
          <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs text-blue-700 hover:text-blue-900 underline">
            {open ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {open && (
          <Box>
            <div className="font-semibold mb-1">Pago Movil</div>
            {phone ? (<div className="flex items-center">Telefono: <span className="ml-1 font-mono">{phone}</span> <CopyBtn text={phone} label="telefono" /></div>) : null}
            {rif ? (<div className="flex items-center">RIF: <span className="ml-1 font-mono">{rif}</span> <CopyBtn text={rif} label="RIF" /></div>) : null}
            {bank ? (<div className="flex items-center">Banco: <span className="ml-1 font-mono">{bank}</span> <CopyBtn text={bank} label="banco" /></div>) : null}
          </Box>
        )}
      </div>
    );
  }

  if (method === 'TRANSFERENCIA') {
    const bank = (selectedBank || '').toUpperCase();
    if (!['BANESCO','MERCANTIL'].includes(bank)) return null;
    const map: Record<string, { name: string; acc: string; rif: string }> = {
      BANESCO: {
        name: String(s.paymentBanescoName || ''),
        acc: String(s.paymentBanescoAccount || ''),
        rif: String(s.paymentBanescoRif || ''),
      },
      MERCANTIL: {
        name: String(s.paymentMercantilName || ''),
        acc: String(s.paymentMercantilAccount || ''),
        rif: String(s.paymentMercantilRif || ''),
      },
    };
    const info = map[bank];
    if (!info.name && !info.acc && !info.rif) return null;
    return (
      <div>
        <div className="flex items-center justify-between mb-1">
          <div className="text-sm font-semibold text-gray-700">Instrucciones de pago</div>
          <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs text-blue-700 hover:text-blue-900 underline">
            {open ? 'Ocultar' : 'Mostrar'}
          </button>
        </div>
        {open && (
          <Box>
            <div className="font-semibold mb-1">Transferencia bancaria {bank}</div>
            {info.name ? (<div className="flex items-center">Titular: <span className="ml-1 font-mono">{info.name}</span> <CopyBtn text={info.name} label="titular" /></div>) : null}
            {info.acc ? (<div className="flex items-center">Cuenta: <span className="ml-1 font-mono">{info.acc}</span> <CopyBtn text={info.acc} label="cuenta" /></div>) : null}
            {info.rif ? (<div className="flex items-center">RIF: <span className="ml-1 font-mono">{info.rif}</span> <CopyBtn text={info.rif} label="RIF" /></div>) : null}
          </Box>
        )}
      </div>
    );
  }

  return null;
}
