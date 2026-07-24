'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Prediction {
  mint: string;
  chain_id: string;
  verdict: 'CAP' | 'NO CAP';
  confidence: number;
  subclass: string;
  reasons: Array<{ code: string; text: string; severity: string }>;
  created_at: string;
}

export default function PortfolioPage() {
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPortfolio() {
      try {
        const { data, error } = await supabase
          .from('predictions')
          .select('*')
          .order('created_at', { ascending: false });

        if (!error && data) {
          setPredictions(data as Prediction[]);
        }
      } catch (err) {
        console.error('Failed to load portfolio:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPortfolio();
  }, []);

  const highRisk = predictions.filter(p => p.verdict === 'CAP');
  const lowRisk = predictions.filter(p => p.verdict === 'NO CAP');

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#070a13',
      backgroundImage: 'radial-gradient(circle at top right, rgba(83,217,255,0.05), transparent), radial-gradient(circle at bottom left, rgba(255,84,112,0.02), transparent)',
      color: '#eef3fa',
      fontFamily: 'Inter, sans-serif',
      padding: '40px 20px',
    }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '40px' }}>
          <div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '-0.5px' }}>
              AI Portfolio <span style={{ color: '#53d9ff' }}>Intelligence</span>
            </h1>
            <p style={{ color: '#8494b0', fontSize: '15px', margin: 0 }}>
              Audit and monitor your scanned tokens risk profile.
            </p>
          </div>
          <a href="/" style={{
            textDecoration: 'none',
            color: '#53d9ff',
            border: '1px solid rgba(83,217,255,0.2)',
            padding: '10px 20px',
            borderRadius: '8px',
            backgroundColor: 'rgba(83,217,255,0.05)',
            fontSize: '14px',
            fontWeight: '600',
            transition: 'all 0.2s',
          }}>
            ← Back to Scan
          </a>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px 0', color: '#8494b0' }}>
            Loading portfolio insights...
          </div>
        ) : (
          <div>
            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '40px' }}>
              <div style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '12px',
                padding: '24px',
              }}>
                <div style={{ color: '#8494b0', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Total Assets Monitored</div>
                <div style={{ fontSize: '36px', fontWeight: '800' }}>{predictions.length}</div>
              </div>
              <div style={{
                backgroundColor: 'rgba(255,84,112,0.02)',
                border: '1px solid rgba(255,84,112,0.1)',
                borderRadius: '12px',
                padding: '24px',
              }}>
                <div style={{ color: '#ff5470', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>High Risk (CAP)</div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#ff5470' }}>{highRisk.length}</div>
              </div>
              <div style={{
                backgroundColor: 'rgba(60,230,164,0.02)',
                border: '1px solid rgba(60,230,164,0.1)',
                borderRadius: '12px',
                padding: '24px',
              }}>
                <div style={{ color: '#3ce6a4', fontSize: '13px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>Safe (NO CAP)</div>
                <div style={{ fontSize: '36px', fontWeight: '800', color: '#3ce6a4' }}>{lowRisk.length}</div>
              </div>
            </div>

            {/* Lists Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
              {/* High Risk column */}
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#ff5470', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🔴 High Risk Alerts ({highRisk.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {highRisk.length === 0 ? (
                    <div style={{ color: '#8494b0', fontSize: '14px', fontStyle: 'italic', padding: '20px 0' }}>No high risk assets found.</div>
                  ) : (
                    highRisk.map((p, idx) => (
                      <div key={idx} style={{
                        backgroundColor: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(255,84,112,0.15)',
                        borderRadius: '12px',
                        padding: '20px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'monospace', color: '#ff5470' }}>
                            {p.mint.slice(0, 8)}...{p.mint.slice(-8)}
                          </span>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', color: '#8494b0' }}>
                            {p.chain_id}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#8494b0', marginBottom: '12px' }}>
                          CAP prediction: {(p.confidence * 100).toFixed(0)}% • Category: {p.subclass}
                        </div>
                        {p.reasons.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {p.reasons.map((r, rIdx) => (
                              <div key={rIdx} style={{ fontSize: '12px', color: '#ff8a9a', display: 'flex', gap: '6px' }}>
                                <span>⚠️</span>
                                <span>{r.text}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Safe column */}
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#3ce6a4', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  🟢 Verified Safe ({lowRisk.length})
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {lowRisk.length === 0 ? (
                    <div style={{ color: '#8494b0', fontSize: '14px', fontStyle: 'italic', padding: '20px 0' }}>No verified safe assets found.</div>
                  ) : (
                    lowRisk.map((p, idx) => (
                      <div key={idx} style={{
                        backgroundColor: 'rgba(255,255,255,0.01)',
                        border: '1px solid rgba(60,230,164,0.15)',
                        borderRadius: '12px',
                        padding: '20px',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                          <span style={{ fontSize: '14px', fontWeight: '700', fontFamily: 'monospace', color: '#3ce6a4' }}>
                            {p.mint.slice(0, 8)}...{p.mint.slice(-8)}
                          </span>
                          <span style={{ fontSize: '11px', textTransform: 'uppercase', backgroundColor: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: '4px', color: '#8494b0' }}>
                            {p.chain_id}
                          </span>
                        </div>
                        <div style={{ fontSize: '13px', color: '#8494b0' }}>
                          CAP prediction: {(p.confidence * 100).toFixed(0)}% • Category: {p.subclass}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
