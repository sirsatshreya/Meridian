import React, { useRef, useState, useEffect } from 'react';
import { ShieldCheck, RotateCcw, Undo2, PenTool, Type, AlertTriangle } from 'lucide-react';

interface PrototypeSignaturePadProps {
  partyRole: 'BUYER' | 'SELLER';
  companyName: string;
  representativeName: string;
  representativeTitle: string;
  agreementVersion: string;
  agreementSha256: string;
  isSubmitting?: boolean;
  onSign: (signatureData: {
    signatureMethod: 'PROTOTYPE_CANVAS' | 'PROTOTYPE_TYPED';
    signatureData: string;
    signerName: string;
    signerTitle: string;
    disclaimerText: string;
  }) => void;
}

export const PrototypeSignaturePad: React.FC<PrototypeSignaturePadProps> = ({
  partyRole,
  companyName,
  representativeName,
  representativeTitle,
  agreementVersion,
  agreementSha256,
  isSubmitting = false,
  onSign,
}) => {
  const [activeTab, setActiveTab] = useState<'CANVAS' | 'TYPED'>('CANVAS');
  const [typedName, setTypedName] = useState(representativeName);
  const [typedTitle, setTypedTitle] = useState(representativeTitle);
  const [consentChecked, setConsentChecked] = useState(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const strokesRef = useRef<Array<Array<{ x: number; y: number }>>>([]);
  const currentStrokeRef = useRef<Array<{ x: number; y: number }>>([]);

  const disclaimerStatement = `Prototype Electronic-Signature: I confirm I am an authorized legal representative of ${companyName}. This signature interaction records assent to Agreement 2 (Version ${agreementVersion}, SHA-256 Digest: ${agreementSha256.substring(0, 16)}...) in this prototype environment without claiming certified trust services provider status.`;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set high-DPI resolution
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * 2;
    canvas.height = rect.height * 2;
    ctx.scale(2, 2);

    ctx.strokeStyle = '#D7FF43'; // Meridian Electric Lime
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    const handleGlobalRelease = () => {
      if (isDrawingRef.current) {
        stopDrawing();
      }
    };

    window.addEventListener('mouseup', handleGlobalRelease);
    window.addEventListener('touchend', handleGlobalRelease);
    return () => {
      window.removeEventListener('mouseup', handleGlobalRelease);
      window.removeEventListener('touchend', handleGlobalRelease);
    };
  }, [activeTab]);

  const redrawStrokes = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#D7FF43';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (const stroke of strokesRef.current) {
      if (stroke.length === 0) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length; i++) {
        ctx.lineTo(stroke[i].x, stroke[i].y);
      }
      ctx.stroke();
    }
    setHasDrawn(strokesRef.current.length > 0);
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    currentStrokeRef.current = [{ x, y }];
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    currentStrokeRef.current.push({ x, y });
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasDrawn(true);
  };

  const stopDrawing = () => {
    if (isDrawingRef.current && currentStrokeRef.current.length > 0) {
      strokesRef.current.push(currentStrokeRef.current);
      currentStrokeRef.current = [];
    }
    isDrawingRef.current = false;
  };

  const handleUndo = () => {
    if (strokesRef.current.length === 0) return;
    strokesRef.current.pop();
    redrawStrokes();
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    strokesRef.current = [];
    currentStrokeRef.current = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasDrawn(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked) return;

    if (activeTab === 'CANVAS') {
      const canvas = canvasRef.current;
      const dataUrl = canvas ? canvas.toDataURL('image/png') : '';
      onSign({
        signatureMethod: 'PROTOTYPE_CANVAS',
        signatureData: dataUrl,
        signerName: typedName.trim(),
        signerTitle: typedTitle.trim(),
        disclaimerText: disclaimerStatement,
      });
    } else {
      onSign({
        signatureMethod: 'PROTOTYPE_TYPED',
        signatureData: typedName.trim(),
        signerName: typedName.trim(),
        signerTitle: typedTitle.trim(),
        disclaimerText: disclaimerStatement,
      });
    }
  };

  const canSubmit = consentChecked && !isSubmitting && (activeTab === 'CANVAS' ? hasDrawn : typedName.trim().length > 2);

  return (
    <div className="bg-[#111315] border border-white/10 rounded-xl p-6 text-white shadow-2xl space-y-6">
      {/* Header & Prototype Notice */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-xs font-mono font-semibold uppercase tracking-wider bg-[#D7FF43]/20 text-[#D7FF43] border border-[#D7FF43]/30">
              PROTOTYPE ELECTRONIC-SIGNATURE INTERACTION
            </span>
            <span className="px-2 py-0.5 rounded text-xs font-mono text-zinc-400 bg-zinc-800">
              {partyRole} DESK
            </span>
          </div>
          <h3 className="text-lg font-semibold text-white tracking-tight">
            Execute Agreement 2 ({companyName})
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Cryptographically bound to Agreement Version <span className="text-[#D7FF43] font-mono font-medium">v{agreementVersion}</span> and SHA-256 baseline digest.
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
          <button
            type="button"
            onClick={() => setActiveTab('CANVAS')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'CANVAS'
                ? 'bg-zinc-800 text-white shadow-sm border border-white/10'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            Canvas Signature Pad
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('TYPED')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              activeTab === 'TYPED'
                ? 'bg-zinc-800 text-white shadow-sm border border-white/10'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Type className="w-3.5 h-3.5" />
            Typed Legal Name
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Signer Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">AUTHORIZED SIGNATORY NAME</label>
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              className="w-full bg-[#171A1C] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#D7FF43]/50 font-medium"
              placeholder="e.g. Elena Vance"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-mono text-zinc-400 mb-1">LEGAL TITLE / DESIGNATION</label>
            <input
              type="text"
              value={typedTitle}
              onChange={(e) => setTypedTitle(e.target.value)}
              className="w-full bg-[#171A1C] border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#D7FF43]/50 font-medium"
              placeholder="e.g. Director of Procurement"
              required
            />
          </div>
        </div>

        {/* Input Area: Canvas or Typed */}
        {activeTab === 'CANVAS' ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-zinc-400">
              <span className="font-mono">DRAW SIGNATURE BELOW WITH MOUSE OR TOUCH</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleUndo}
                  disabled={!hasDrawn}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white disabled:opacity-40 transition-colors"
                >
                  <Undo2 className="w-3 h-3" />
                  Undo
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-red-400 transition-colors"
                >
                  <RotateCcw className="w-3 h-3" />
                  Clear Canvas
                </button>
              </div>
            </div>
            <div className="relative border-2 border-dashed border-white/15 rounded-xl bg-black/60 overflow-hidden h-40">
              <canvas
                ref={canvasRef}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                className="w-full h-full cursor-crosshair touch-none"
              />
              {!hasDrawn && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-zinc-600 text-xs italic">
                  Sign within this box using your stylus, mouse or finger
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <label className="block text-xs font-mono text-zinc-400">SIGNATURE SCRIPT PREVIEW</label>
            <div className="h-40 rounded-xl bg-black/60 border border-white/10 flex items-center justify-center p-6">
              <span className="font-serif italic text-3xl md:text-4xl text-[#D7FF43] tracking-wide select-none drop-shadow-sm">
                {typedName || 'Signatory Name'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-500 italic">
              Typed representation formatted under electronic representation standards.
            </p>
          </div>
        )}

        {/* Cryptographic Binding Notice */}
        <div className="p-3 rounded-lg bg-zinc-900/80 border border-white/5 space-y-1.5 font-mono text-[11px]">
          <div className="flex items-center gap-2 text-zinc-300">
            <ShieldCheck className="w-4 h-4 text-[#D7FF43]" />
            <span>Cryptographic Target Document Baseline:</span>
          </div>
          <div className="text-zinc-500 break-all pl-6">
            SHA-256: <span className="text-[#D7FF43]">{agreementSha256}</span>
          </div>
        </div>

        {/* Affirmative Consent Disclaimer Checkbox */}
        <label className="flex items-start gap-3 p-3.5 rounded-lg bg-[#171A1C] border border-white/10 cursor-pointer hover:border-white/20 transition-colors">
          <input
            type="checkbox"
            checked={consentChecked}
            onChange={(e) => setConsentChecked(e.target.checked)}
            className="mt-1 w-4 h-4 rounded border-zinc-700 text-[#D7FF43] focus:ring-0 focus:ring-offset-0 bg-black/40 cursor-pointer"
          />
          <span className="text-xs text-zinc-300 leading-relaxed">
            <strong className="text-white block mb-0.5">Prototype Electronic Signature Affirmation:</strong>
            I confirm I am an authorized corporate representative of <span className="text-white font-medium">{companyName}</span>. This prototype electronic-signature records binding commercial assent to Agreement 2 (v{agreementVersion}) in this prototype demonstration environment without claiming certified trust services provider status.
          </span>
        </label>

        {/* Submission Action */}
        <button
          type="submit"
          disabled={!canSubmit}
          className={`w-full py-3 px-4 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 ${
            canSubmit
              ? 'bg-[#D7FF43] text-black font-semibold hover:bg-[#cbf536] shadow-lg shadow-[#D7FF43]/20 cursor-pointer active:scale-[0.99]'
              : 'bg-zinc-800 text-zinc-500 border border-white/5 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? (
            <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
          ) : (
            <ShieldCheck className="w-4 h-4" />
          )}
          {isSubmitting
            ? 'Recording Prototype Electronic Signature...'
            : `Execute Prototype Signature as ${partyRole}`}
        </button>
      </form>
    </div>
  );
};
