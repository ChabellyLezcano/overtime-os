// src/components/desktop/ShutdownSuccessModal.tsx
'use client';

import React from 'react';
import { useWindowManager } from '@/context/WindowManagerContext';

const ShutdownSuccessModal: React.FC = () => {
  const { hideShutdownModal, openWindow } = useWindowManager();

  const handleOk = () => {
    hideShutdownModal();
    openWindow('power');
  };

  return (
    <div className="fixed inset-0 z-9999 flex items-center justify-center bg-slate-950/90 backdrop-blur-xl">
      <div className="w-[90%] max-w-sm space-y-3 rounded-3xl border border-emerald-400/60 bg-linear-to-br from-slate-950 via-slate-900 to-slate-950 p-5 text-center text-slate-100 shadow-[0_0_40px_rgba(16,185,129,0.55)]">
        <div className="flex flex-col items-center gap-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-400/80 bg-slate-900 shadow-[0_0_20px_rgba(16,185,129,0.8)]">
            <span className="text-2xl">✓</span>
          </div>
          <p className="text-[11px] font-semibold tracking-[0.18em] text-emerald-300 uppercase">
            overtime daemon terminated
          </p>
        </div>

        <p className="text-sm font-semibold">Ya puedes irte a casa.</p>
        <p className="text-[11px] text-slate-300">
          Has reunido todos los fragmentos del kill code, armado el firewall y ejecutado
          el comando final. El daemon de horas extra ha sido eliminado de la secuencia de
          apagado.
        </p>
        <p className="text-[11px] text-slate-400">
          Usa el botón de apagado de OvertimeOS para cerrar todo y ver la pantalla de “The
          End”.
        </p>

        <button
          type="button"
          onClick={handleOk}
          className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-1.5 text-[11px] font-semibold text-slate-950 shadow-lg shadow-emerald-500/40 transition hover:bg-emerald-400"
        >
          Vale, voy a apagar ⏻
        </button>
      </div>
    </div>
  );
};

export default ShutdownSuccessModal;
