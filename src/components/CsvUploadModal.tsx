import React, { useState } from 'react';
import { Upload, Download, X, AlertCircle, CheckCircle, FileSpreadsheet } from 'lucide-react';
import { parseLedgerCsv, computeFeatures } from '../lib/features';
import { saveLedgerCsv } from '../lib/runDesk';
import type { Features } from '../types';

interface CsvUploadModalProps {
  personId: string;
  personName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newFeatures: Features) => void;
}

const TEMPLATE_CSV = `date,ticker,side,qty,price,r5,volz,note
2026-08-01,TATAMOTORS,buy,20,950,0.060,1.5,breakout buy
2026-08-02,TATAMOTORS,buy,20,960,0.065,1.8,follow through add
2026-08-03,RELIANCE,buy,10,2800,0.050,1.2,chase add
2026-08-04,INFY,buy,15,1530,0.045,1.1,tech add
2026-08-05,HDFCBANK,buy,10,1650,0.040,1.0,bank add
2026-08-06,TCS,buy,5,3900,0.035,0.9,large cap buy
2026-08-07,TATAMOTORS,buy,15,970,0.055,1.4,momentum add
2026-08-08,RELIANCE,buy,10,2820,0.048,1.3,breakout
2026-08-09,INFY,buy,10,1540,0.042,1.1,add
2026-08-10,HDFCBANK,buy,10,1660,0.038,1.0,add`;

export const CsvUploadModal: React.FC<CsvUploadModalProps> = ({
  personId,
  personName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [csvText, setCsvText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [previewFeatures, setPreviewFeatures] = useState<Features | null>(null);

  if (!isOpen) return null;

  const handleDownloadTemplate = () => {
    const blob = new Blob([TEMPLATE_CSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `seconddesk_ledger_template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      setError('Please select a valid .csv file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      validateAndPreview(content);
    };
    reader.readAsText(file);
  };

  const validateAndPreview = (text: string) => {
    try {
      const rows = parseLedgerCsv(text);
      if (rows.length === 0) {
        setError('No valid trade rows found. Ensure CSV has correct header: date,ticker,side,qty,price');
        setPreviewFeatures(null);
        return;
      }
      if (rows.length > 500) {
        setError(`CSV exceeds maximum limit of 500 rows (found ${rows.length}).`);
        setPreviewFeatures(null);
        return;
      }

      const feats = computeFeatures(rows);
      setPreviewFeatures(feats);
      setError(null);
    } catch (err: any) {
      setError(`Validation failed: ${err.message || 'Malformed CSV format'}`);
      setPreviewFeatures(null);
    }
  };

  const handleSave = () => {
    if (!csvText.trim()) {
      setError('Please paste or upload CSV data first.');
      return;
    }
    const rows = parseLedgerCsv(csvText);
    if (rows.length === 0) {
      setError('Cannot save empty or invalid ledger.');
      return;
    }

    const feats = computeFeatures(rows);
    saveLedgerCsv(personId, csvText);
    onSuccess(feats);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#11141b] border border-[#273042] rounded-xl w-full max-w-lg p-5 sm:p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3.5 border-b border-[#1c2331] mb-4">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-zinc-300" />
            <h3 className="text-sm font-semibold text-[#f0ede6]">
              Upload Ledger for {personName}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-[#9aa3b2] mb-3 leading-relaxed">
          Upload custom trade history to personalize the desk's risk appetite and concentration caps.
          If <code className="text-zinc-300">r5</code> or <code className="text-zinc-300">volz</code> columns are omitted, they default to 0.0 (no chase credit).
        </p>

        {/* Template download & file input */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4 bg-[#0a0d12] p-3 rounded-lg border border-[#1b2230]">
          <label className="cursor-pointer px-3 py-1.5 rounded text-xs font-medium bg-[#1e2637] hover:bg-[#29344a] text-[#f0ede6] border border-[#33405b] transition-colors flex items-center gap-1.5">
            <Upload className="w-3.5 h-3.5" />
            <span>Select CSV File</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="text-xs text-[#8c96a7] hover:text-[#d0d6e2] flex items-center gap-1 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Template</span>
          </button>
        </div>

        {/* Text area for direct pasting */}
        <div className="mb-4">
          <label className="block text-xs font-mono-num text-[#788293] mb-1">
            Or Paste CSV Text Directly:
          </label>
          <textarea
            value={csvText}
            onChange={(e) => {
              setCsvText(e.target.value);
              validateAndPreview(e.target.value);
            }}
            placeholder="date,ticker,side,qty,price,r5,volz,note&#10;2026-08-01,TATAMOTORS,buy,20,950,0.06,1.5,chase"
            rows={5}
            className="w-full bg-[#080a0e] border border-[#1d2534] rounded-lg p-2.5 text-xs text-[#d0ccc4] font-mono-num focus:outline-none focus:border-zinc-500 transition-colors"
          />
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 bg-rose-950/40 border border-rose-800/50 p-2.5 rounded text-xs text-rose-300 flex items-center gap-2 font-mono-num">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Preview features */}
        {previewFeatures && (
          <div className="mb-5 bg-[#0e121a] border border-[#20293a] p-3 rounded-lg">
            <div className="text-[11px] font-mono-num uppercase tracking-wider text-[#828ca0] mb-2 flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Parsed Preview & Eligibility</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs font-mono-num text-[#b0a99e]">
              <div>Trades: <span className="text-[#f0ede6] font-semibold">{previewFeatures.nTrades}</span></div>
              <div>Turnover: <span className="text-[#f0ede6] font-semibold">₹{previewFeatures.turnover.toLocaleString('en-IN')}</span></div>
              <div>Eligible: <span className={previewFeatures.eligible ? "text-emerald-400 font-semibold" : "text-amber-400"}>{previewFeatures.eligible ? "YES (Personal ON)" : "NO (Need 8 trades or ₹1L)"}</span></div>
              <div>Risk Score: <span className="text-[#f0ede6] font-semibold">{previewFeatures.risk10}/10</span></div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#1c2331]">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-[#8c96a7] hover:text-[#d0d6e2] hover:bg-[#161a24] transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!previewFeatures}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#d6d9e0] hover:bg-[#eef1f6] text-zinc-950 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save & Recompute Desk
          </button>
        </div>
      </div>
    </div>
  );
};
