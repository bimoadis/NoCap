'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';

export default function EmbedWidget() {
  return (
    <React.Suspense fallback={<div className="reason">Loading parameters...</div>}>
      <EmbedContent />
    </React.Suspense>
  );
}

function EmbedContent() {
  const searchParams = useSearchParams();
  const mint = searchParams.get('mint') || '';

  const [verdict, setVerdict] = useState<string>('SCANNING');
  const [confidence, setConfidence] = useState<string>('--');
  const [reason, setReason] = useState<string>('Interrogating funding graph logs...');
  const [progress, setProgress] = useState<number>(0);
  const [verdictClass, setVerdictClass] = useState<string>('loading');
  const [showProgress, setShowProgress] = useState<boolean>(true);

  useEffect(() => {
    if (!mint) {
      setVerdict('ERROR');
      setReason('Missing mint address');
      setVerdictClass('cap');
      setShowProgress(false);
      return;
    }

    const es = new EventSource(`/api/v1/scan?mint=${encodeURIComponent(mint)}&stream=true`);

    es.addEventListener('progress', (e) => {
      try {
        const data = JSON.parse(e.data);
        setProgress(data.pct);
        setReason(`Step: ${data.step} (${data.pct}%)`);
      } catch (err) {}
    });

    es.addEventListener('cluster', (e) => {
      try {
        const data = JSON.parse(e.data);
        setReason(`Cluster C114 resolved: ${data.wallets} wallets funded by parent.`);
      } catch (err) {}
    });

    es.addEventListener('verdict', (e) => {
      try {
        const data = JSON.parse(e.data);
        setShowProgress(false);
        setVerdict(data.verdict);
        setVerdictClass(data.verdict === 'CAP' ? 'cap' : 'nocap');
        setConfidence(`CAP PREDICTION ${Math.round(data.confidence * 100)}%`);
        setReason(data.reason || (data.verdict === 'CAP' ? 'Supply pattern controlled.' : 'Organic trading flow confirmed.'));
        es.close();
      } catch (err) {}
    });

    es.onerror = () => {
      setReason('Scan failed or connection closed.');
      setShowProgress(false);
      es.close();
    };

    return () => {
      es.close();
    };
  }, [mint]);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `
        :root {
          --bg: #0c1119;
          --border: rgba(148, 176, 224, 0.15);
          --ink: #eef3fa;
          --dim: #93a0b4;
          --emerald: #3ce6a4;
          --red: #ff5470;
          --cyan: #53d9ff;
        }
        body {
          background: var(--bg);
          color: var(--ink);
          font-family: system-ui, -apple-system, sans-serif;
          margin: 0;
          padding: 18px;
          border: 1px solid var(--border);
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 320px;
          box-sizing: border-box;
        }
        .verdict-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .verdict-chip {
          font-size: 28px;
          font-weight: bold;
          border: 2px solid currentColor;
          padding: 4px 14px;
          letter-spacing: 0.05em;
        }
        .verdict-chip.cap { color: var(--red); text-shadow: 0 0 10px rgba(255, 84, 112, 0.3); }
        .verdict-chip.nocap { color: var(--emerald); text-shadow: 0 0 10px rgba(60, 230, 164, 0.3); }
        .verdict-chip.loading { color: var(--cyan); border-style: dashed; }
        .reason {
          font-size: 13px;
          color: var(--dim);
          line-height: 1.4;
        }
        .progress-bar {
          height: 4px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 2px;
          overflow: hidden;
        }
        .progress-bar i {
          display: block;
          height: 100%;
          background: var(--cyan);
          transition: width 0.3s ease;
        }
      ` }} />

      <div className="verdict-header">
        <div id="verdictChip" className={`verdict-chip ${verdictClass}`}>{verdict}</div>
        <div id="confidence" style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--dim)' }}>{confidence}</div>
      </div>
      {showProgress && (
        <div id="progressBar" className="progress-bar">
          <i style={{ width: `${progress}%` }}></i>
        </div>
      )}
      <div id="reason" className="reason">{reason}</div>
    </>
  );
}
