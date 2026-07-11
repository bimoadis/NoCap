'use client';

import React, { useState, useEffect, useRef } from 'react';

// Design color constant matching visual CSS tokens
const COLOR_MAP: Record<string, string> = {
  cyan: '83,217,255',
  emerald: '60,230,164',
  red: '255,84,112',
  amber: '242,181,68',
  dim: '132,148,176',
  ink: '238,243,250',
};

interface StepItem {
  text: string;
  status: 'idle' | 'active' | 'done';
}

interface LogItem {
  cls: 'k' | 'g' | 'r' | 'a' | 'f';
  text: string;
}

export default function Home() {
  // Scenario Selection (0: Bundled launch, 1: Organic launch)
  const [currentScenario, setCurrentScenario] = useState<number>(0);
  const [customMint, setCustomMint] = useState<string>('');
  
  // Terminal State
  const [scanLabel, setScanLabel] = useState<string>('IDLE');
  const [progressPct, setProgressPct] = useState<number>(0);
  const [logs, setLogs] = useState<LogItem[]>([]);
  const [steps, setSteps] = useState<StepItem[]>([
    { text: 'Deployer located', status: 'idle' },
    { text: 'First 20 buyers buffered', status: 'idle' },
    { text: 'Funding graph built', status: 'idle' },
    { text: 'Wallet clusters resolved', status: 'idle' },
    { text: 'Behavior similarity scored', status: 'idle' },
    { text: 'Known wallets cross referenced', status: 'idle' },
    { text: 'Deployer history pulled', status: 'idle' },
    { text: 'Bundle detection', status: 'idle' },
    { text: 'Verdict generated', status: 'idle' },
  ]);

  // Verdict UI Card State
  const [verdictVisible, setVerdictVisible] = useState<boolean>(false);
  const [verdictIn, setVerdictIn] = useState<boolean>(false);
  const [verdictType, setVerdictType] = useState<'cap' | 'nocap' | 'coordinated'>('cap');
  const [verdictMint, setVerdictMint] = useState<string>('');
  const [verdictTime, setVerdictTime] = useState<string>('');
  const [verdictConf, setVerdictConf] = useState<number>(0);
  const [verdictSentence, setVerdictSentence] = useState<string>('');
  const [verdictExps, setVerdictExps] = useState<React.ReactNode[]>([null, null, '', '']);
  const [verdictLevel, setVerdictLevel] = useState<string>('FINAL');

  // UI Interactive States
  const [openAccordion, setOpenAccordion] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<string>('csharp');
  const [activeWalletIdx, setActiveWalletIdx] = useState<number | null>(null);
  const [walletMousePos, setWalletMousePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeESRef = useRef<EventSource | null>(null);
  const timersRef = useRef<NodeJS.Timeout[]>([]);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Wallet & Gating States
  const [walletAddr, setWalletAddr] = useState<string | null>(null);
  const [walletStatus, setWalletStatus] = useState<any>(null);
  const [showGateModal, setShowGateModal] = useState<boolean>(false);
  const [anonScans, setAnonScans] = useState<number>(0);
  const [detectedClusters, setDetectedClusters] = useState<any[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedWallet = localStorage.getItem('nocap_connected_wallet');
      if (savedWallet) {
        setWalletAddr(savedWallet);
        fetchWalletStatus(savedWallet);
        const walletScansKey = `nocap_wallet_scans_${savedWallet}`;
        const walletScans = parseInt(localStorage.getItem(walletScansKey) || '0', 10);
        setAnonScans(walletScans);
      } else {
        setAnonScans(0);
      }
    }
  }, []);

  const fetchWalletStatus = async (addr: string) => {
    try {
      const res = await fetch(`/v1/wallet/${addr}/status`);
      if (res.ok) {
        const data = await res.json();
        setWalletStatus(data);
        if (data.freeScans !== undefined) {
          setAnonScans(3 - data.freeScans);
        }
      }
    } catch (err) {
      console.error('Error fetching wallet status:', err);
    }
  };

  const connectWallet = async () => {
    try {
      const provider = (window as any).solana;
      if (provider?.isPhantom) {
        const response = await provider.connect();
        const addr = response.publicKey.toString();
        console.log('[NOCAP Client] Wallet connected successfully:', addr);
        setWalletAddr(addr);
        localStorage.setItem('nocap_connected_wallet', addr);
        await fetchWalletStatus(addr);
        const walletScansKey = `nocap_wallet_scans_${addr}`;
        const walletScans = parseInt(localStorage.getItem(walletScansKey) || '0', 10);
        setAnonScans(walletScans);
      } else {
        alert('Phantom Wallet not found. Please install the Phantom Extension.');
      }
    } catch (err) {
      console.error('[NOCAP Client] Wallet connection failed:', err);
    }
  };

  const disconnectWallet = () => {
    console.log('[NOCAP Client] Wallet disconnected.');
    setWalletAddr(null);
    setWalletStatus(null);
    setAnonScans(0);
    localStorage.removeItem('nocap_connected_wallet');
  };

  // Pre-defined scenarios mock data
  const fgBundle = () => (
    <div className="flex flex-col gap-2">
      <svg viewBox="0 0 360 140" width="100%" height="140">
        <circle cx="30" cy="70" r="6" fill="#ff5470" />
        {Array.from({ length: 14 }).map((_, i) => {
          const y = 12 + i * 8.6;
          return (
            <React.Fragment key={`b-${i}`}>
              <line x1="36" y1="70" x2="250" y2={y} stroke="rgba(255,84,112,0.5)" strokeWidth="1" />
              <circle cx="250" cy={y} r="3" fill="#ff5470" />
            </React.Fragment>
          );
        })}
        {Array.from({ length: 6 }).map((_, i) => {
          const y = 20 + i * 18;
          return (
            <React.Fragment key={`i-${i}`}>
              <line x1="330" y1={y - 10} x2="316" y2={y} stroke="rgba(132,148,176,0.5)" strokeWidth="1" />
              <circle cx="316" cy={y} r="3" fill="#5b677d" />
            </React.Fragment>
          );
        })}
      </svg>
      <div>one parent <span className="r font-semibold text-red">7xKp…9fQ2</span> funds 14 of 20 buyers · 6 min before launch<br />6 buyers independent</div>
    </div>
  );

  const fgOrganic = () => (
    <div className="flex flex-col gap-2">
      <svg viewBox="0 0 360 140" width="100%" height="140">
        {Array.from({ length: 17 }).map((_, i) => {
          const sx = 14 + (i % 6) * 22 + (i % 3) * 4;
          const sy = 12 + (i % 4) * 34;
          const bx = 230 + (i % 5) * 26;
          const by = 14 + (i * 7.2) % 112;
          return (
            <React.Fragment key={`o-${i}`}>
              <line x1={sx} y1={sy} x2={bx} y2={by} stroke="rgba(60,230,164,0.32)" strokeWidth="1" />
              <circle cx={sx} cy={sy} r="2.4" fill="#3a4457" />
              <circle cx={bx} cy={by} r="3" fill="#3ce6a4" />
            </React.Fragment>
          );
        })}
      </svg>
      <div><span className="g font-semibold text-emerald">17 independent sources</span> · largest shared source funds 2 wallets (CEX hot wallet)</div>
    </div>
  );

  const barsFor = (kind: 'cap' | 'nocap') => {
    if (kind === 'cap') {
      return (
        <div className="flex flex-col gap-2">
          <div className="tbars">
            {Array.from({ length: 14 }).map((_, i) => (
              <i key={`r-${i}`} className="r" style={{ height: '78%', animationDelay: `${i * 40}ms` }}></i>
            ))}
            {[34, 58, 22, 46, 30, 52].map((h, i) => (
              <i key={`o-${i}`} style={{ height: `${h}%`, animationDelay: `${(14 + i) * 40}ms` }}></i>
            ))}
          </div>
          <div>14 uniform buys inside two blocks, then organic dust. Uniformity is the tell.</div>
        </div>
      );
    } else {
      const hs = [22, 64, 31, 80, 12, 55, 38, 71, 26, 48, 60, 18, 44, 75, 33, 52, 29, 66, 40, 57];
      const cls = ['g', 'g', '', 'g', '', 'g', 'g', 'a', 'g', '', 'g', 'g', '', 'g', 'a', 'g', 'g', '', 'g', 'g'];
      return (
        <div className="flex flex-col gap-2">
          <div className="tbars">
            {hs.map((h, i) => (
              <i key={`hs-${i}`} className={cls[i]} style={{ height: `${h}%`, animationDelay: `${i * 40}ms` }}></i>
            ))}
          </div>
          <div>Random sizes, random timing. Two sniper exits <span className="a font-semibold text-amber">absorbed</span> by real demand.</div>
        </div>
      );
    }
  };

  const presetScenarios = [
    {
      name: 'BUNDLED',
      mint: '9xUw…pump',
      time: '8.2s',
      kind: 'cap' as const,
      conf: 96,
      sentence: '14 of the first 20 buyers were funded by one parent wallet, 6 minutes before launch. This supply is one decision away from dumping on you.',
      logs: [
        { cls: 'k' as const, text: 'scan 9xUw…pump · stream open' },
        { cls: 'f' as const, text: 'deployer 7xKp…9fQ2 · 48 prior launches' },
        { cls: 'f' as const, text: '20 trades buffered in 41s' },
        { cls: 'f' as const, text: '312 transfers traced · 3 hops' },
        { cls: 'a' as const, text: 'cluster C114 · 14 wallets · one parent' },
        { cls: 'a' as const, text: 'buy sizes uniform · sigma 0.03 SOL' },
        { cls: 'r' as const, text: '9 wallets seen in 31 prior rugs' },
        { cls: 'r' as const, text: '46 of 48 launches dead under 10 min' },
        { cls: 'r' as const, text: 'BUNDLE CONFIRMED' },
        { cls: 'k' as const, text: 'confidence 0.96 · verdict ready' },
      ],
      exps: [
        fgBundle(),
        barsFor('cap'),
        '47 launches · 44 dead under 10 min\nmedian lifespan 6m 41s\ntotal extracted 1,204 SOL\nlast rug 11 hours ago',
        'C114 · 14 wallets · parent 7xKp…9fQ2\nfunded in one burst, 6 min before launch\n9 members seen in 31 prior rugs',
      ],
    },
    {
      name: 'ORGANIC',
      mint: 'Gv3k…p11M',
      time: '7.6s',
      kind: 'nocap' as const,
      conf: 88,
      sentence: 'Buyers trace back to 17 unrelated funding sources. Sizes look human, the deployer is holding, and nothing matches a known extraction pattern.',
      logs: [
        { cls: 'k' as const, text: 'scan Gv3k…p11M · stream open' },
        { cls: 'f' as const, text: 'deployer Gv3k…p11M · first launch' },
        { cls: 'f' as const, text: '20 trades buffered in 3m 12s' },
        { cls: 'f' as const, text: '289 transfers traced · 3 hops' },
        { cls: 'g' as const, text: '17 independent funding sources' },
        { cls: 'g' as const, text: 'buy sizes human · 0.2 to 4.1 SOL' },
        { cls: 'a' as const, text: '2 known snipers · exited, absorbed' },
        { cls: 'g' as const, text: 'deployer holding · socials live before mint' },
        { cls: 'g' as const, text: 'no bundle pattern found' },
        { cls: 'k' as const, text: 'confidence 0.88 · verdict ready' },
      ],
      exps: [
        fgOrganic(),
        barsFor('nocap'),
        'first launch from this deployer\ndev buy 2.1 SOL · still holding\nTelegram and X live before mint\nno linked rug history',
        'no cluster above threshold\nlargest shared source: 2 wallets\nsource type: CEX hot wallet · benign',
      ],
    },
  ];

  // Helper Timers Management
  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  const later = (ms: number, fn: () => void) => {
    timersRef.current.push(setTimeout(fn, ms));
  };

  const addLog = (cls: 'k' | 'g' | 'r' | 'a' | 'f', text: string) => {
    setLogs((prev) => [...prev, { cls, text }]);
  };

  const resetUI = () => {
    clearTimers();
    setLogs([]);
    setDetectedClusters([]);
    setSteps((prev) => prev.map((s) => ({ ...s, status: 'idle' })));
    setProgressPct(0);
    setScanLabel('IDLE');
    setVerdictVisible(false);
    setVerdictIn(false);
    if (activeESRef.current) {
      activeESRef.current.close();
      activeESRef.current = null;
    }
  };

  const showVerdict = (scenario: typeof presetScenarios[0] | any) => {
    setVerdictVisible(true);

    let displayType: 'cap' | 'nocap' | 'coordinated' = 'nocap';
    let displayWord = 'NO CAP (Organic)';

    if (scenario.subclass === 'extraction' || scenario.kind === 'cap') {
      displayType = 'cap';
      displayWord = 'CAP (Extraction)';
    } else if (scenario.subclass === 'coordinated') {
      displayType = 'coordinated';
      displayWord = 'NO CAP (Coordinated)';
    } else {
      displayType = 'nocap';
      displayWord = 'NO CAP (Organic)';
    }

    setVerdictType(displayType);
    setVerdictWord(displayWord);
    setVerdictSentence(scenario.sentence);
    setVerdictMint(scenario.mint);
    setVerdictTime(scenario.time);
    setVerdictExps(scenario.exps);
    setVerdictConf(scenario.conf);
    setVerdictLevel(scenario.verdictLevel || 'FINAL');

    requestAnimationFrame(() => {
      setVerdictIn(true);
      setTimeout(() => {
        const reportEl = document.getElementById('verdict-report');
        if (reportEl) {
          reportEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    });
  };

  const [verdictWord, setVerdictWord] = useState<string>('CAP');

  // Triggering the Scan execution
  const runScan = () => {
    const mintStr = customMint.trim();
    resetUI();

    // Check Gating Limits on Client Side
    if (!walletAddr) {
      alert('Please connect your Phantom wallet first to unlock your 3 free scans.');
      connectWallet();
      return;
    }

    if (anonScans >= 3 && (!walletStatus || !walletStatus.access)) {
      setShowGateModal(true);
      return;
    }

    if (mintStr !== '') {
      console.log('[NOCAP Client] Initiating live scan for Mint:', mintStr);
      console.log('[NOCAP Client] Active connected wallet:', walletAddr);
      // Connect to Live Next.js SSE Endpoint
      setScanLabel('SCANNING · LIVE API STREAM');
      addLog('k', `scan ${mintStr.substring(0, 8)}… · stream open`);
      
      setSteps((prev) => {
        const next = [...prev];
        next[0] = { ...next[0], status: 'active' };
        return next;
      });

      const url = `/v1/scan?mint=${encodeURIComponent(mintStr)}&stream=true${walletAddr ? `&userWallet=${walletAddr}` : ''}`;
      const es = new EventSource(url);
      activeESRef.current = es;

      const startTime = Date.now();

      es.addEventListener('progress', (e) => {
        try {
          const data = JSON.parse(e.data);
          const step = data.step;
          console.log('[NOCAP Client] Progress step:', step, 'pct:', data.pct);
          if (step === 'deployer') {
            addLog('f', 'deployer identified');
            setProgressPct(10);
          } else if (step === 'buyers') {
            setSteps((prev) => {
              const next = [...prev];
              next[0] = { ...next[0], status: 'done' };
              next[1] = { ...next[1], status: 'active' };
              return next;
            });
            addLog('f', '20 trades buffered');
            setScanLabel('SCANNING · TRADE 20/20');
            setProgressPct(20);
          } else if (step === 'funding_graph') {
            setSteps((prev) => {
              const next = [...prev];
              next[1] = { ...next[1], status: 'done' };
              next[2] = { ...next[2], status: 'active' };
              return next;
            });
            addLog('f', 'funding graph connections traced');
            setProgressPct(40);
          } else if (step === 'clustering') {
            setSteps((prev) => {
              const next = [...prev];
              next[2] = { ...next[2], status: 'done' };
              next[3] = { ...next[3], status: 'active' };
              return next;
            });
            setProgressPct(60);
          } else if (step === 'scoring') {
            setSteps((prev) => {
              const next = [...prev];
              next[3] = { ...next[3], status: 'done' };
              next[4] = { ...next[4], status: 'active' };
              next[5] = { ...next[5], status: 'active' };
              next[6] = { ...next[6], status: 'active' };
              next[7] = { ...next[7], status: 'active' };
              return next;
            });
            setScanLabel('SCORING');
            addLog('f', 'calculating behaviors similarity');
            setProgressPct(80);
          }
        } catch (err) {}
      });

      es.addEventListener('cluster', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('[NOCAP Client] Cluster resolved:', data);
          setDetectedClusters((prev) => [...prev, data]);
          if (data.isCex) {
            addLog('g', `cluster resolved: ${data.wallets} wallets linked to CEX parent (benign)`);
          } else {
            addLog('a', `cluster resolved: ${data.wallets} wallets linked to single parent`);
          }
        } catch (err) {}
      });

      es.addEventListener('verdict', (e) => {
        try {
          const data = JSON.parse(e.data);
          console.log('[NOCAP Client] Verdict payload received:', data);
          
          setSteps((prev) => prev.map((s) => ({ ...s, status: 'done' })));
          setProgressPct(100);
          
          const durationS = ((Date.now() - startTime) / 1000).toFixed(1) + 's';
          setScanLabel(`DONE · ${durationS}`);

          if (data.verdict === 'CAP') {
            addLog('r', 'rug / extraction pattern confirmed');
            addLog('k', `confidence ${data.confidence} · verdict ready`);
          } else {
            addLog('g', 'no bundle / extraction patterns matched');
            addLog('k', `confidence ${data.confidence} · verdict ready`);
          }

          // Increment scan count on successful client-side validation
          if (walletAddr) {
            const walletScansKey = `nocap_wallet_scans_${walletAddr}`;
            const walletScans = parseInt(localStorage.getItem(walletScansKey) || '0', 10);
            const nextScans = walletScans + 1;
            localStorage.setItem(walletScansKey, nextScans.toString());
            setAnonScans(nextScans);
            fetchWalletStatus(walletAddr);
          }

          const liveScenario = {
            mint: mintStr.substring(0, 6) + '…' + mintStr.substring(mintStr.length - 4),
            time: durationS,
            kind: data.verdict === 'CAP' ? 'cap' : 'nocap',
            subclass: data.subclass,
            conf: Math.round(data.confidence * 100),
            verdictLevel: data.verdictLevel || 'FINAL',
            sentence: data.reasons?.[0]?.text || (data.verdict === 'CAP' ? 'Supply pattern controlled.' : 'Organic trading flow confirmed.'),
            exps: [
              data.verdict === 'CAP' ? fgBundle() : fgOrganic(),
              barsFor(data.verdict === 'CAP' ? 'cap' : 'nocap'),
              data.verdict === 'CAP' 
                ? 'live scan detection\nhigh wallet similarity\nsupply concentration detected'
                : 'live scan detection\norganic transfer sources\nbenign trading distribution',
              data.reasons?.[0]?.text || (data.verdict === 'CAP' ? 'Typical extraction cluster.' : 'Organic wallet profile.')
            ]
          };

          showVerdict(liveScenario);
          es.close();
          activeESRef.current = null;
        } catch (err) {}
      });

      es.onerror = () => {
        addLog('r', 'connection error or scanner offline');
        setScanLabel('FAILED');
        es.close();
        activeESRef.current = null;
      };

      return;
    }

    // Run Mock Sandbox Scenario Replay
    const S = presetScenarios[currentScenario];
    setScanLabel(`SCANNING · ${S.name} PATTERN`);
    
    addLog(S.logs[0].cls, S.logs[0].text);
    const stepDur = 620;
    
    presetScenarios[currentScenario].logs.forEach((logItem, logIdx) => {
      if (logIdx === 0) return;
      later(300 + (logIdx - 1) * stepDur, () => {
        addLog(logItem.cls, logItem.text);
      });
    });

    steps.forEach((_, i) => {
      later(300 + i * stepDur, () => {
        setSteps((prev) => {
          const next = [...prev];
          next[i] = { ...next[i], status: 'active' };
          if (i > 0) {
            next[i - 1] = { ...next[i - 1], status: 'done' };
          }
          return next;
        });
        setProgressPct(Math.round(((i + 1) / 9) * 100));
        if (i === 1) setScanLabel('SCANNING · TRADE 20/20');
        if (i === 6) setScanLabel('SCORING');
      });
    });

    later(300 + 9 * stepDur, () => {
      setSteps((prev) => {
        const next = [...prev];
        next[8] = { ...next[8], status: 'done' };
        return next;
      });
      setScanLabel(`DONE · ${S.time}`);
      showVerdict(S);
    });
  };

  const selectScenario = (idx: number) => {
    setCurrentScenario(idx);
    setCustomMint('');
    resetUI();
  };

  useEffect(() => {
    if (logs.length > 0) {
      const logEl = document.getElementById('log');
      if (logEl) {
        logEl.scrollTop = logEl.scrollHeight;
      }
    }
  }, [logs]);

  // Hook for reveal system, ladder lighting, and counts up
  useEffect(() => {
    // 1. Reveal system
    const rvIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          rvIO.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.rv').forEach((el) => rvIO.observe(el));

    // 2. Ladder Lighting
    const lio = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        lio.unobserve(e.target);
        const words = e.target.querySelectorAll('.lw');
        words.forEach((w, i) => {
          setTimeout(() => {
            w.classList.add('lit');
          }, 400 + i * 380);
        });
      });
    }, { threshold: 0.4 });
    document.querySelectorAll('[data-ladder]').forEach((el) => lio.observe(el));

    // 3. Count Up
    const fmtVal = (v: number, kind: string | null) => {
      if (kind === 'pct') return v.toFixed(1) + '%';
      if (kind === 'sec') return v.toFixed(1) + 's';
      return Math.round(v).toLocaleString('en-US');
    };
    const countIO = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        countIO.unobserve(e.target);
        const el = e.target as HTMLElement;
        const target = parseFloat(el.getAttribute('data-count') || '0');
        const kind = el.getAttribute('data-fmt');
        let t0: number | null = null;
        const stepAnim = (ts: number) => {
          if (!t0) t0 = ts;
          let p = Math.min((ts - t0) / 1100, 1);
          p = 1 - Math.pow(1 - p, 3);
          el.textContent = fmtVal(target * p, kind);
          if (p < 1) requestAnimationFrame(stepAnim);
        };
        requestAnimationFrame(stepAnim);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-count]').forEach((el) => countIO.observe(el));

    return () => {
      rvIO.disconnect();
      lio.disconnect();
      countIO.disconnect();
    };
  }, []);

  // Canvas Particle/Graph Simulator (Hero section)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const stage = canvas.parentElement;
    if (!stage) return;

    let W = 0, H = 0, DPR = 1;
    let nodes: any[] = [];
    let links: any[] = [];
    let pulses: any[] = [];
    let buyers: any[] = [];
    let sources: any[] = [];
    let parentNode: any = null;
    let token: any = null;
    let phase = 0;
    let t = 0;
    let spawnAcc = 0;
    let linkAcc = 0;
    let linkIdx = 0;
    let scenario = 0;
    let fade = 1;
    let clusterDone = false;
    let mx = -9999, my = -9999;
    let animationId: number;

    const C = {
      cyan: '83,217,255',
      emerald: '60,230,164',
      red: '255,84,112',
      amber: '242,181,68',
      dim: '132,148,176',
      ink: '238,243,250',
    };

    const resize = () => {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = stage.clientWidth;
      H = stage.clientHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
    };

    const createNode = (x: number, y: number, r: number, c: string) => {
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 3,
        vy: (Math.random() - 0.5) * 3,
        r,
        c,
      };
    };

    const resetSim = () => {
      nodes = [];
      links = [];
      pulses = [];
      buyers = [];
      sources = [];
      parentNode = null;
      phase = 0;
      t = 0;
      spawnAcc = 0;
      linkAcc = 0;
      linkIdx = 0;
      fade = 1;
      clusterDone = false;
      token = createNode(W * 0.6, H * 0.5, 7, 'cyan');
      token.vx = 0;
      token.vy = 0;
      nodes.push(token);
    };

    const addSimBuyer = () => {
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.min(W, H) * (0.24 + Math.random() * 0.2);
      const n = createNode(token.x + Math.cos(ang) * rad, token.y + Math.sin(ang) * rad, 3.4, 'dim');
      nodes.push(n);
      buyers.push(n);
      links.push({ a: n, b: token, p: 0, sp: 2.6, c: 'dim', al: 0.3, w: 1 });
    };

    const initSimTrace = () => {
      if (scenario === 0) {
        parentNode = createNode(W * 0.16, H * 0.3, 6.5, 'cyan');
        nodes.push(parentNode);
      } else {
        for (let i = 0; i < 12; i++) {
          const edge = Math.random();
          const sx = edge < 0.5 ? W * (0.06 + Math.random() * 0.22) : W * (0.06 + Math.random() * 0.88);
          const sy = edge < 0.5 ? H * (0.08 + Math.random() * 0.84) : Math.random() < 0.5 ? H * 0.08 : H * 0.92;
          const s = createNode(sx, sy, 2.8, 'cyan');
          nodes.push(s);
          sources.push(s);
        }
      }
    };

    const traceSimLinks = () => {
      if (scenario === 0) {
        if (linkIdx < 14) {
          const b = buyers[linkIdx];
          links.push({
            a: parentNode,
            b,
            p: 0,
            sp: 1.8,
            c: 'cyan',
            al: 0.75,
            w: 1.4,
            done: () => {
              b.c = 'amber';
            },
          });
          linkIdx++;
          return true;
        }
      } else {
        if (linkIdx < 20) {
          const b2 = buyers[linkIdx];
          const s2 = sources[linkIdx % sources.length];
          links.push({
            a: s2,
            b: b2,
            p: 0,
            sp: 1.8,
            c: 'cyan',
            al: 0.55,
            w: 1.1,
            done: () => {
              b2.c = 'emerald';
            },
          });
          linkIdx++;
          return true;
        }
      }
      return false;
    };

    const allSimTraced = () => {
      for (let i = 0; i < links.length; i++) {
        if (links[i].p < 1) return false;
      }
      return true;
    };

    const updateSim = (dt: number) => {
      t += dt;
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        if (n !== token) {
          n.x += n.vx * dt;
          n.y += n.vy * dt;
          const dxm = mx - n.x, dym = my - n.y, dm = Math.sqrt(dxm * dxm + dym * dym);
          if (dm < 150 && dm > 1) {
            n.x += (dxm / dm) * 4 * dt;
            n.y += (dym / dm) * 4 * dt;
          }
        }
      }
      for (let j = 0; j < links.length; j++) {
        const l = links[j];
        if (l.p < 1) {
          l.p = Math.min(1, l.p + l.sp * dt);
          if (l.p >= 1 && l.done) {
            l.done();
            l.done = null;
          }
        }
      }
      for (let k = pulses.length - 1; k >= 0; k--) {
        const p = pulses[k];
        p.r += 60 * dt;
        p.al -= 1.1 * dt;
        if (p.al <= 0) pulses.splice(k, 1);
      }
      
      if (phase === 0) {
        spawnAcc += dt;
        while (spawnAcc > 0.13 && buyers.length < 20) {
          spawnAcc -= 0.13;
          addSimBuyer();
        }
        if (buyers.length >= 20 && t > 3.4) {
          initSimTrace();
          phase = 1;
          t = 0;
        }
      } else if (phase === 1) {
        linkAcc += dt;
        while (linkAcc > 0.11) {
          linkAcc -= 0.11;
          if (!traceSimLinks()) break;
        }
        if (!clusterDone && allSimTraced() && t > 2.2) {
          clusterDone = true;
          t = 0;
          if (scenario === 0) {
            for (let b = 0; b < 14; b++) {
              buyers[b].c = 'red';
            }
            parentNode.c = 'red';
            pulses.push({ x: parentNode.x, y: parentNode.y, r: 8, al: 0.9, c: 'red' });
            pulses.push({ x: parentNode.x, y: parentNode.y, r: 2, al: 0.9, c: 'red' });
          }
        }
        if (clusterDone && t > 1.0) {
          phase = 2;
          t = 0;
          pulses.push({ x: token.x, y: token.y, r: 10, al: 0.8, c: scenario === 0 ? 'red' : 'emerald' });
        }
      } else if (phase === 2) {
        if (t > 3.0) {
          phase = 3;
          t = 0;
        }
      } else if (phase === 3) {
        fade -= dt / 0.7;
        if (fade <= 0) {
          scenario = 1 - scenario;
          resetSim();
        }
      }
    };

    const drawSimNode = (n: any) => {
      let boost = 0;
      const dxm = mx - n.x, dym = my - n.y, dm = Math.sqrt(dxm * dxm + dym * dym);
      if (dm < 140) boost = (1 - dm / 140) * 0.5;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r * 3, 0, 6.284);
      ctx.fillStyle = `rgba(${C[n.c as keyof typeof C]}, ${(0.07 + boost * 0.15) * fade})`;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r, 0, 6.284);
      ctx.fillStyle = `rgba(${C[n.c as keyof typeof C]}, ${(0.9 + boost) * fade})`;
      ctx.fill();
    };

    const drawSim = () => {
      ctx.clearRect(0, 0, W, H);
      for (let j = 0; j < links.length; j++) {
        const l = links[j];
        const tx = l.a.x + (l.b.x - l.a.x) * l.p;
        const ty = l.a.y + (l.b.y - l.a.y) * l.p;
        ctx.beginPath();
        ctx.moveTo(l.a.x, l.a.y);
        ctx.lineTo(tx, ty);
        let col = l.c;
        if (l.a === parentNode && parentNode && parentNode.c === 'red') col = 'red';
        ctx.strokeStyle = `rgba(${C[col as keyof typeof C]}, ${l.al * fade})`;
        ctx.lineWidth = l.w;
        ctx.stroke();
      }
      for (let i = 0; i < nodes.length; i++) drawSimNode(nodes[i]);
      if (token) {
        ctx.beginPath();
        ctx.arc(token.x, token.y, 13, 0, 6.284);
        ctx.strokeStyle = `rgba(${C.cyan}, ${0.5 * fade})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      for (let k = 0; k < pulses.length; k++) {
        const p = pulses[k];
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 6.284);
        ctx.strokeStyle = `rgba(${C[p.c as keyof typeof C]}, ${p.al * fade})`;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }
    };

    let last = 0;
    const loop = (ts: number) => {
      if (!last) last = ts;
      const dt = Math.min((ts - last) / 1000, 0.05);
      last = ts;
      updateSim(dt);
      drawSim();
      animationId = requestAnimationFrame(loop);
    };

    resize();
    resetSim();
    animationId = requestAnimationFrame(loop);

    const handlePointerMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      mx = e.clientX - rect.left;
      my = e.clientY - rect.top;
    };

    const handlePointerLeave = () => {
      mx = -9999;
      my = -9999;
    };

    const handleResize = () => {
      resize();
      resetSim();
    };

    stage.addEventListener('pointermove', handlePointerMove);
    stage.addEventListener('pointerleave', handlePointerLeave);
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationId);
      stage.removeEventListener('pointermove', handlePointerMove);
      stage.removeEventListener('pointerleave', handlePointerLeave);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Static Data
  const wallets = [
    { addr: '7xKp…9fQ2', tag: 'RUGGER', trust: 5, r: 31, l: 48, c: 'C114', cls: 'red' },
    { addr: '3mVc…pYpW', tag: 'BENIGN', trust: 92, r: 0, l: 1, c: 'none', cls: 'green' },
    { addr: 'Fh2s…NuXy', tag: 'BENIGN', trust: 86, r: 0, l: 0, c: 'none', cls: 'green' },
    { addr: 'Gv3k…11Mp', tag: 'BENIGN', trust: 95, r: 0, l: 0, c: 'none', cls: 'green' },
  ];

  const handleWalletHover = (e: React.MouseEvent, idx: number | null) => {
    setActiveWalletIdx(idx);
    if (idx !== null) {
      const rect = e.currentTarget.getBoundingClientRect();
      setWalletMousePos({
        x: rect.left + window.scrollX,
        y: rect.top + rect.height + 8 + window.scrollY,
      });
    }
  };

  return (
    <>
      <a className="skip" href="#demo">Skip to the live demo</a>

      <nav className="nav" aria-label="Main">
        <div className="wrap navin">
          <a href="#top" className="brand">
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="11" viewBox="-4 -2 22 11" shapeRendering="crispEdges">
              <rect x="5" y="0" width="5" height="1" fill="#eef3fa" />
              <rect x="4" y="1" width="7" height="1" fill="#eef3fa" />
              <rect x="3" y="2" width="9" height="1" fill="#eef3fa" />
              <rect x="3" y="3" width="9" height="1" fill="#eef3fa" />
              <rect x="3" y="4" width="9" height="1" fill="#eef3fa" />
              <rect x="0" y="5" width="12" height="1" fill="#eef3fa" />
              <rect x="0" y="6" width="12" height="1" fill="#9aa7bd" />
              <g fill="#3ce6a4">
                <rect x="-2" y="-1" width="3" height="1" />
                <rect x="0" y="0" width="3" height="1" />
                <rect x="2" y="1" width="3" height="1" />
                <rect x="4" y="2" width="3" height="1" />
                <rect x="6" y="3" width="3" height="1" />
                <rect x="8" y="4" width="3" height="1" />
                <rect x="10" y="5" width="3" height="1" />
                <rect x="12" y="6" width="3" height="1" />
              </g>
            </svg>
            NOCAP
          </a>
          <div className="nav-links">
            <a href="#demo">Demo</a>
            <a href="#wallets">Wallets</a>
            <a href="#integrate">Integrate</a>
            <a href="#api">API</a>
          </div>
          {walletAddr ? (
            <button className="btn btn-ghost btn-nav font-mono text-[11px] border border-line" onClick={disconnectWallet} style={{ textTransform: 'none' }}>
              {walletAddr.substring(0, 4)}...{walletAddr.substring(walletAddr.length - 4)} (DISCONNECT)
            </button>
          ) : (
            <button className="btn btn-primary btn-nav" onClick={connectWallet}>
              CONNECT PHANTOM
            </button>
          )}
        </div>
      </nav>

      <main id="top">
        {/* ================= HERO ================= */}
        <section className="hero" aria-label="Intro">
          <div className="wrap hero-grid">
            <div className="hero-copy">
              <span className="eyebrow rv" style={{ '--i': 0 } as React.CSSProperties}>Real time wallet intelligence</span>
              <h1 className="leading-none rv" style={{ '--i': 1 } as React.CSSProperties}>
                Know before<br />
                <span className="accent text-emerald">you ape.</span>
              </h1>
              <p className="sub text-dim rv" style={{ '--i': 2 } as React.CSSProperties}>
                NOCAP watches the first trades of every launch, traces who funded every buyer, and returns one verdict in seconds. No charts. No noise. One answer.
              </p>
              <div className="btn-row rv" style={{ '--i': 3 } as React.CSSProperties}>
                <a className="btn btn-primary" href="#demo">Run the live demo</a>
                <a className="btn btn-ghost" href="#api">Get API access</a>
              </div>
              <div className="hero-stats rv" style={{ '--i': 4 } as React.CSSProperties}>
                <span>
                  <span className="livedot" aria-hidden="true"></span>ENGINE LIVE
                </span>
                <span>VERDICTS TODAY <b data-count="41208" data-fmt="int">41,208</b></span>
                <span>MEDIAN <b data-count="8.4" data-fmt="sec">8.4s</b></span>
              </div>
            </div>
            <div className="hero-stage border border-line rv" style={{ '--i': 1 } as React.CSSProperties} aria-label="Live funding graph simulation">
              <canvas id="net" ref={canvasRef}></canvas>
              <span className="stage-tag">STAGE · LIVE FUNDING GRAPH</span>
              <div className="scanline" aria-live="polite">
                &gt; tracing funding graph... <span className="cursor" aria-hidden="true"></span>
              </div>
            </div>
          </div>
        </section>

        {/* ================= PHILOSOPHY ================= */}
        <section className="philo" aria-label="Philosophy">
          <div className="wrap">
            <div className="philo-lines">
              <p className="rv">Raw chain data is <b>weather physics.</b></p>
              <p className="rv" style={{ '--i': 1 } as React.CSSProperties}>Terminals hand you the <b>equations.</b></p>
              <p className="rv" style={{ '--i': 2 } as React.CSSProperties}>NOCAP hands you <span className="em"><b>bring an umbrella.</b></span></p>
            </div>
            <div className="weather rv" style={{ '--i': 3 } as React.CSSProperties}>
              <div className="wx-card" aria-label="Raw data example">
                precip 43.2mm · pressure 968hPa<br />
                wind 31kt gusting 44 · humidity 96%<br />
                cape 2400 j/kg · lifted index &minus;6
              </div>
              <div className="wx-arrow" aria-hidden="true">&rarr;</div>
              <div className="wx-card right">
                <span className="chip-dot" aria-hidden="true"></span>Bring an umbrella.
              </div>
            </div>
            <p className="wx-cap rv" style={{ '--i': 4 } as React.CSSProperties}>SAME ENERGY · NOCAP READS 300 TRANSFERS SO YOUR USERS READ ONE LINE</p>
          </div>
        </section>

        {/* ================= DEMO ================= */}
        <section id="demo" aria-label="Interactive demo">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow rv">Live demo</span>
              <h2 className="rv" style={{ '--i': 1 } as React.CSSProperties}>Paste a mint.<br />Watch it get interrogated.</h2>
              <p className="sub rv" style={{ '--i': 2 } as React.CSSProperties}>
                Two real launch patterns, replayed. The engine buffers the first 20 trades, traces the money behind them, and speaks only when it is sure.
              </p>
            </div>

            <div className="term border border-line rv" style={{ '--i': 3 } as React.CSSProperties}>
              <div className="term-head">
                <div className="dots" aria-hidden="true">
                  <span></span><span></span><span></span>
                </div>
                <span className="term-title">nocap scan · engine v1</span>
                <div className="term-actions">
                  <div className="flex flex-col md:flex-row items-center gap-2" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="text"
                      id="caInput"
                      placeholder="Paste Mint Address..."
                      className="ca-input"
                      value={customMint}
                      onChange={(e) => {
                        setCustomMint(e.target.value);
                        if (e.target.value.trim() !== '') {
                          // Clear active styling of presets
                          setCurrentScenario(-1);
                        }
                      }}
                    />
                    <div className="text-[10px] font-mono text-[#8494b0] mr-2" style={{ fontSize: '10px', color: '#8494b0', whiteSpace: 'nowrap' }}>
                      {walletAddr ? (
                        <span>
                          {walletStatus?.access ? (
                            <span className="text-[#3ce6a4]" style={{ color: '#3ce6a4', fontWeight: 'bold' }}>UNLIMITED ACCESS</span>
                          ) : (
                            <span>TRIAL: <span className="text-[#f2b544]" style={{ color: '#f2b544', fontWeight: 'bold' }}>{Math.max(0, 3 - anonScans)}/3 SCANS</span> LEFT</span>
                          )}
                        </span>
                      ) : (
                        <span className="text-[#ff5472]" style={{ color: '#ff5472', fontWeight: 'bold' }}>CONNECT WALLET TO SCAN</span>
                      )}
                    </div>
                  </div>
                  <button className="run" onClick={runScan} type="button">
                    RUN SCAN
                  </button>
                </div>
              </div>
              <div className="term-body">
                <div className="steps" id="steps">
                  {steps.map((st, idx) => (
                    <div key={`step-${idx}`} className={`step ${st.status}`}>
                      <span className="sdot"></span>
                      {st.text}
                      <span className="tick">&#10003;</span>
                    </div>
                  ))}
                  <div className="progress">
                    <div className="pbar">
                      <i style={{ transform: `scaleX(${progressPct / 100})`, transition: 'transform 0.3s ease' }}></i>
                    </div>
                    <div className="plabel font-mono">{scanLabel}</div>
                  </div>
                </div>
                <div className="log" id="log">
                  {logs.map((logItem, idx) => (
                    <div key={`log-${idx}`} className={`ln ${logItem.cls}`}>
                      &gt; {logItem.text}
                    </div>
                  ))}
                  <div ref={logEndRef}></div>
                </div>
              </div>
            </div>

            {/* Verdict Card Output */}
            {verdictVisible && (
              <div className="verdict-wrap show" id="verdict-report">
                <div className={`vcard in is-${verdictType}`}>
                  <div className="v-left">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="eyebrow">SCAN REPORT</span>
                      {verdictLevel && (
                        <span className={`px-2 py-0.5 text-[9px] tracking-widest font-mono rounded uppercase ${
                          verdictLevel === 'PRELIMINARY' ? 'bg-amber/20 text-amber border border-amber/30' :
                          verdictLevel === 'PROVISIONAL' ? 'bg-cyan/20 text-cyan border border-cyan/30' :
                          'bg-emerald/20 text-emerald border border-emerald/30'
                        }`}>
                          {verdictLevel}
                        </span>
                      )}
                    </div>
                    <div className="v-chip font-bold">
                      <span className="chip-dot"></span>
                      <span id="vword">{verdictWord}</span>
                    </div>
                    <p className="v-sentence" id="vsent">{verdictSentence}</p>
                    <div className="v-meta">
                      <div className="ring">
                        <svg width="92" height="92" viewBox="0 0 92 92">
                          <circle cx="46" cy="46" r="40" strokeWidth="6" fill="none" className="track" />
                          <circle
                            cx="46"
                            cy="46"
                            r="40"
                            strokeWidth="6"
                            fill="none"
                            className="arc"
                            strokeDasharray="251.2"
                            strokeDashoffset={251.2 * (1 - verdictConf / 100)}
                          />
                        </svg>
                        <b id="vconf">{verdictConf}%</b>
                      </div>
                      <div className="vm">
                        RISK <b id="vrisk">{verdictConf}%</b><br />
                        MINT <b id="vmint">{verdictMint}</b><br />
                        SPEED <b id="vtime">{verdictTime}</b><br />
                        REGIME <b>REGIME W14</b>
                      </div>
                    </div>
                  </div>
                  <div className="v-right">
                    <div className={`exp ${openAccordion === 0 ? 'open' : ''}`}>
                      <button className="exp-btn" onClick={() => setOpenAccordion(openAccordion === 0 ? null : 0)}>
                        FUNDING RELATION GRAPH
                        <span className="plus">+</span>
                      </button>
                      <div className="exp-panel">
                        <div className="exp-inner">
                          <div className="exp-content" id="xg">
                            {currentScenario === -1 ? (
                              <div className="flex flex-col gap-2">
                                {detectedClusters.length > 0 ? (
                                  <div>
                                    <svg viewBox="0 0 360 140" width="100%" height="140">
                                      {detectedClusters.map((c, idx) => {
                                        const cx = 40 + idx * 70;
                                        const cy = 70;
                                        const color = c.isCex ? '#3ce6a4' : '#ff5470';
                                        const strokeColor = c.isCex ? 'rgba(60,230,164,0.4)' : 'rgba(255,84,112,0.4)';
                                        return (
                                          <g key={`dc-svg-${idx}`}>
                                            <circle cx={cx} cy={cy} r="6" fill={color} />
                                            {Array.from({ length: Math.min(10, c.wallets) }).map((_, i) => {
                                              const y = 12 + i * 12;
                                              return (
                                                <React.Fragment key={`dc-svg-l-${i}`}>
                                                  <line x1={cx} y1={cy} x2="250" y2={y} stroke={strokeColor} strokeWidth="1" />
                                                  <circle cx="250" cy={y} r="2.5" fill={color} />
                                                </React.Fragment>
                                              );
                                            })}
                                          </g>
                                        );
                                      })}
                                    </svg>
                                    <div className="text-xs text-[#8494b0] mt-2">
                                      {detectedClusters.map((c, i) => (
                                        <div key={`dctxt-${i}`} className="mt-1" style={{ fontSize: '11px' }}>
                                          • Cluster resolved: <span className="font-bold" style={{ color: c.isCex ? '#3ce6a4' : '#ff5470' }}>{c.wallets} wallets</span> linked to parent <span className="font-mono text-[#83d9ff]" style={{ color: '#83d9ff' }}>{c.parent.substring(0, 6)}...{c.parent.substring(c.parent.length - 4)}</span> {c.isCex && <span className="text-[#3ce6a4] font-semibold">(CEX hot wallet - benign)</span>}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : (
                                  fgOrganic()
                                )}
                              </div>
                            ) : (
                              verdictExps[0]
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className={`exp ${openAccordion === 1 ? 'open' : ''}`}>
                      <button className="exp-btn" onClick={() => setOpenAccordion(openAccordion === 1 ? null : 1)}>
                        LAUNCH BUY UNIFORMITY
                        <span className="plus">+</span>
                      </button>
                      <div className="exp-panel">
                        <div className="exp-inner">
                          <div className="exp-content" id="xt">{verdictExps[1]}</div>
                        </div>
                      </div>
                    </div>
                    <div className={`exp ${openAccordion === 2 ? 'open' : ''}`}>
                      <button className="exp-btn" onClick={() => setOpenAccordion(openAccordion === 2 ? null : 2)}>
                        DEPLOYER PROFILE HISTORY
                        <span className="plus">+</span>
                      </button>
                      <div className="exp-panel">
                        <div className="exp-inner">
                          <div className="exp-content whitespace-pre-line" id="xd">{verdictExps[2]}</div>
                        </div>
                      </div>
                    </div>
                    <div className={`exp ${openAccordion === 3 ? 'open' : ''}`}>
                      <button className="exp-btn" onClick={() => setOpenAccordion(openAccordion === 3 ? null : 3)}>
                        BEHAVIOR ANALYSIS VERDICT
                        <span className="plus">+</span>
                      </button>
                      <div className="exp-panel">
                        <div className="exp-inner">
                          <div className="exp-content whitespace-pre-line" id="xc">{verdictExps[3]}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* ================= WALLETS ================= */}
        <section id="wallets" aria-label="Wallet reputations">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow rv">Reputations</span>
              <h2 className="rv" style={{ '--i': 1 } as React.CSSProperties}>Known entity tags.</h2>
              <p className="sub rv" style={{ '--i': 2 } as React.CSSProperties}>
                NOCAP tags entities based on their historical profiles. Every address that participates in a launch is resolved against our memory of prior rugs.
              </p>
            </div>
            <div className="wallet-zone rv" style={{ '--i': 3 } as React.CSSProperties}>
              <div className="wallet-grid">
                {wallets.map((w, idx) => (
                  <button
                    key={`w-${idx}`}
                    className={`wchip ${activeWalletIdx === idx ? 'on' : ''}`}
                    onMouseEnter={(e) => handleWalletHover(e, idx)}
                    onMouseLeave={() => setActiveWalletIdx(null)}
                  >
                    <span className="addr">{w.addr}</span>
                    <span className="tagrow">
                      <span className={`tdot rounded-full ${w.cls}`}></span>
                      {w.tag}
                    </span>
                  </button>
                ))}
              </div>

              {activeWalletIdx !== null && (
                <div
                  className="wcard show"
                  style={{
                    position: 'absolute',
                    left: `${Math.min(walletMousePos.x - 20, 800)}px`,
                    top: `${walletMousePos.y - 120}px`,
                  }}
                >
                  <div className="w-addr">{wallets[activeWalletIdx].addr}</div>
                  <div className={`w-tag font-bold ${wallets[activeWalletIdx].cls}`}>
                    {wallets[activeWalletIdx].tag}
                  </div>
                  <ul>
                    <li>Prior Launches <b>{wallets[activeWalletIdx].l}</b></li>
                    <li>Prior Rugs <b>{wallets[activeWalletIdx].r}</b></li>
                    <li>
                      Trust Score <b>{wallets[activeWalletIdx].trust}%</b>
                    </li>
                  </ul>
                  <div className="trust">
                    <div
                      className={`h-full ${wallets[activeWalletIdx].cls === 'red' ? 'bg-red' : 'bg-emerald'}`}
                      style={{ width: `${wallets[activeWalletIdx].trust}%` }}
                    ></div>
                  </div>
                  <div className="w-cluster">
                    CLUSTER ID <b>{wallets[activeWalletIdx].c}</b>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ================= INTEGRATE ================= */}
        <section id="integrate" aria-label="Integration workflow">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow rv">Integrate</span>
              <h2 className="rv" style={{ '--i': 1 } as React.CSSProperties}>Embed verdict engines.</h2>
              <p className="sub rv" style={{ '--i': 2 } as React.CSSProperties}>
                Consume SSE progress feeds inside your app or embed our verdict card iframe. Simple endpoints, low-latency payloads.
              </p>
            </div>
            <div className="diagram border border-line rounded-lg rv" style={{ '--i': 3 } as React.CSSProperties}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 760 170">
                <rect x="14" y="24" width="160" height="74" rx="4" className="d-box" />
                <text x="32" y="54" className="d-label">Solana RPC</text>
                <text x="32" y="76" className="d-sub">WSS Transaction Feed</text>
                <path d="M174 61h86" className="d-line" />
                <path d="M174 61h86" className="d-flow" />
                <circle cx="260" cy="61" r="5" className="d-pulse" />
                
                <rect x="274" y="24" width="200" height="120" rx="4" className="d-box" />
                <text x="292" y="54" className="d-label">NOCAP Engine</text>
                <text x="292" y="76" className="d-sub">1. Ingestion Queue</text>
                <text x="292" y="96" className="d-step">2. Graph Tracing (Hop 3)</text>
                <text x="292" y="116" className="d-step">3. Similarity Scorer</text>
                
                <path d="M474 84h86" className="d-line" />
                <path d="M474 84h86" className="d-flow g" />
                <circle cx="560" cy="84" r="5" className="d-pulse g" />
                
                <rect x="574" y="24" width="170" height="74" rx="4" className="d-box" />
                <text x="592" y="54" className="d-label">Your Client</text>
                <text x="592" y="76" className="d-sub">SSE stream Verdict</text>
              </svg>
            </div>
            <div className="term-chips rv" style={{ '--i': 4 } as React.CSSProperties}>
              <div className="tchip"><span className="chip-dot"></span>React hook</div>
              <div className="tchip"><span className="chip-dot"></span>Typescript SDK</div>
              <div className="tchip"><span className="chip-dot"></span>HTML Iframe Embed</div>
              <div className="tchip"><span className="chip-dot"></span>JSON REST Endpoint</div>
            </div>
            <div className="surfaces">
              <div className="surf rv">
                <span className="mono-tag">01 · LIVE FEED</span>
                <h3>Server-Sent Events</h3>
                <p>Subscribe to realtime launch progress. Receive notifications at every step of our evaluation chain.</p>
              </div>
              <div className="surf rv" style={{ '--i': 1 } as React.CSSProperties}>
                <span className="mono-tag">02 · DIRECT FETCH</span>
                <h3>JSON REST API</h3>
                <p>Query any mint address or search wallet history. Complete index of prediction historical data.</p>
              </div>
              <div className="surf rv" style={{ '--i': 2 } as React.CSSProperties}>
                <span className="mono-tag">03 · EMBED CARD</span>
                <h3>Iframe Embeds</h3>
                <p>Render a fully functional, animated NOCAP verdict box in your application with one line of HTML code.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= API ================= */}
        <section id="api" aria-label="API reference docs">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow rv">API Spec</span>
              <h2 className="rv" style={{ '--i': 1 } as React.CSSProperties}>Production endpoints.</h2>
              <p className="sub rv" style={{ '--i': 2 } as React.CSSProperties}>
                Our HTTP API runs on low-latency global edges. Integrate transaction-level wallet insights directly into your terminal or trading bot.
              </p>
            </div>
            <div className="api-card border border-line rv" style={{ '--i': 3 } as React.CSSProperties}>
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'csharp' ? 'active' : ''}`}
                  onClick={() => setActiveTab('csharp')}
                  type="button"
                >
                  GET /v1/token/:mint
                </button>
                <button
                  className={`tab ${activeTab === 'json' ? 'active' : ''}`}
                  onClick={() => setActiveTab('json')}
                  type="button"
                >
                  GET /v1/wallet/:address
                </button>
                <button
                  className={`tab ${activeTab === 'embed' ? 'active' : ''}`}
                  onClick={() => setActiveTab('embed')}
                  type="button"
                >
                  Iframe Embed Code
                </button>
              </div>
              
              {activeTab === 'csharp' && (
                <div className="pane active font-mono">
                  <span className="c-dim">// Request Token Scan Verdict</span><br />
                  &gt; GET http://localhost:3000/v1/token/AGcs1vpXXJ3d2wATCA31WC915NTqQzgtpx3FvwkXpump<br />
                  <br />
                  <span className="c-dim">// Response Body</span><br />
                  {`{`}<br />
                  &nbsp;&nbsp;&quot;mint&quot;: <span className="c-str">&quot;AGcs1vpXXJ3d2wATCA31WC915NTqQzgtpx3FvwkXpump&quot;</span>,<br />
                  &nbsp;&nbsp;&quot;verdict&quot;: <span className="c-str">&quot;CAP&quot;</span>,<br />
                  &nbsp;&nbsp;&quot;confidence&quot;: <span className="c-num">0.96</span>,<br />
                  &nbsp;&nbsp;&quot;subclass&quot;: <span className="c-str">&quot;extraction&quot;</span>,<br />
                  &nbsp;&nbsp;&quot;reasons&quot;: [<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;{`{`}<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&quot;code&quot;: <span className="c-str">&quot;SHARED_FUNDING_PARENT&quot;</span>,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&quot;text&quot;: <span className="c-str">&quot;14 of the first 20 buyers share a single funding parent.&quot;</span>,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&quot;severity&quot;: <span className="c-red">&quot;high&quot;</span><br />
                  &nbsp;&nbsp;&nbsp;&nbsp;{`}`}<br />
                  &nbsp;&nbsp;]<br />
                  {`}`}
                </div>
              )}

              {activeTab === 'json' && (
                <div className="pane active font-mono">
                  <span className="c-dim">// Request Wallet Reputation Profile</span><br />
                  &gt; GET http://localhost:3000/v1/wallet/7xKpA2q93oWpL4sKmZrT5eYpWqFvNuXyL7zK9aA71<br />
                  <br />
                  <span className="c-dim">// Response Body</span><br />
                  {`{`}<br />
                  &nbsp;&nbsp;&quot;address&quot;: <span className="c-str">&quot;7xKpA2q93oWpL4sKmZrT5eYpWqFvNuXyL7zK9aA71&quot;</span>,<br />
                  &nbsp;&nbsp;&quot;tag&quot;: <span className="c-red">&quot;RUGGER&quot;</span>,<br />
                  &nbsp;&nbsp;&quot;trustScore&quot;: <span className="c-num">0.05</span>,<br />
                  &nbsp;&nbsp;&quot;stats&quot;: {`{`}<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&quot;priorRugs&quot;: <span className="c-num">31</span>,<br />
                  &nbsp;&nbsp;&nbsp;&nbsp;&quot;priorLaunches&quot;: <span className="c-num">48</span><br />
                  &nbsp;&nbsp;{`}`},<br />
                  &nbsp;&nbsp;&quot;clusterId&quot;: <span className="c-str">&quot;C114&quot;</span><br />
                  {`}`}
                </div>
              )}

              {activeTab === 'embed' && (
                <div className="pane active font-mono">
                  <span className="c-dim">// Verdict chip renders inline · updates over SSE</span><br />
                  &lt;<span className="c-key">iframe</span><br />
                  &nbsp;&nbsp;<span className="c-key">src</span>=<span className="c-str">&quot;http://localhost:3000/embed?mint=9xUw…pump&quot;</span><br />
                  &nbsp;&nbsp;<span className="c-key">width</span>=<span className="c-num">&quot;360&quot;</span> <span className="c-key">height</span>=<span className="c-num">&quot;180&quot;</span>&gt;<br />
                  &lt;/<span className="c-key">iframe</span>&gt;
                </div>
              )}
              <div className="api-note border-t border-line pt-4">
                BASE URL: <b>http://localhost:3000</b> · RATE LIMIT: 120 REQ / MIN
              </div>
            </div>
          </div>
        </section>

        {/* ================= STORY ================= */}
        <section aria-label="Why NOCAP">
          <div className="wrap">
            <div className="sec-head">
              <span className="eyebrow rv">Why NOCAP</span>
              <h2 className="rv" style={{ '--i': 1 } as React.CSSProperties}>Terminals show data.<br />NOCAP concludes.</h2>
            </div>
            <div className="story-grid">
              <div className="ladder rv" data-ladder>
                <span className="lw">Data</span><span className="la">&darr;</span>
                <span className="lw">Intelligence</span><span className="la">&darr;</span>
                <span className="lw final">Verdict</span>
                <p className="cap-line">Everything starts as raw transfers. The engine turns them into one answer.</p>
              </div>
              <div className="ladder rv" data-ladder style={{ '--i': 1 } as React.CSSProperties}>
                <span className="lw">Terminal</span><span className="la">&darr;</span>
                <span className="lw">NOCAP layer</span><span className="la">&darr;</span>
                <span className="lw final">Decision</span>
                <p className="cap-line">Your interface stays the same. Your users stop guessing.</p>
              </div>
              <div className="ladder rv" data-ladder style={{ '--i': 2 } as React.CSSProperties}>
                <span className="lw">Wallet</span><span className="la">&darr;</span>
                <span className="lw">Relationships</span><span className="la">&darr;</span>
                <span className="lw final">Truth</span>
                <p className="cap-line">A wallet alone says nothing. Its funding graph says everything.</p>
              </div>
            </div>
          </div>
        </section>

        {/* ================= STATS BAND / TRACK RECORD ================= */}
        <section className="stats-band text-center" id="track" aria-label="Track record">
          <div className="wrap">
            <div className="sec-head" style={{ marginTop: '64px' }}>
              <span className="eyebrow rv">Track record</span>
              <h2 className="rv" style={{ '--i': 1 } as React.CSSProperties}>Accuracy is the product.</h2>
              <p className="sub rv" style={{ '--i': 2 } as React.CSSProperties}>
                Every verdict is logged before the outcome resolves. The loop retrains on its own misses, and the numbers stay public.
              </p>
            </div>
            <div className="stats-grid">
              <div className="stat rv">
                <div className="n"><span data-count="94.2" data-fmt="pct">0</span></div>
                <div className="l">Precision on CAP calls</div>
              </div>
              <div className="stat rv" style={{ '--i': 1 } as React.CSSProperties}>
                <div className="n"><span data-count="1284902" data-fmt="int">0</span></div>
                <div className="l">Verdicts issued</div>
              </div>
              <div className="stat rv" style={{ '--i': 2 } as React.CSSProperties}>
                <div className="n"><span data-count="8.4" data-fmt="sec">0</span></div>
                <div className="l">Median verdict time</div>
              </div>
              <div className="stat rv" style={{ '--i': 3 } as React.CSSProperties}>
                <div className="n"><span data-count="312" data-fmt="int">0</span></div>
                <div className="l">Clusters flagged today</div>
              </div>
            </div>
            <div className="stats-note">
              SAMPLE METRICS FOR THIS CONCEPT BUILD · PRODUCTION NUMBERS PUBLISH WEEKLY, MISSES INCLUDED
            </div>
          </div>
        </section>

        {/* ================= CTA ================= */}
        <section className="cta" aria-label="Action prompt">
          <div className="wrap">
            <span className="eyebrow justify-center rv">Integrate</span>
            <h2 className="rv" style={{ '--i': 1 } as React.CSSProperties}>Put a verdict next to every ticker.</h2>
            <p className="sub text-dim rv" style={{ '--i': 2 } as React.CSSProperties}>
              One API call. One iframe. Your users know before they ape.
            </p>
            <div className="btn-row justify-center rv" style={{ '--i': 3 } as React.CSSProperties}>
              <a className="btn btn-primary" href="#api">Get API Access</a>
              <a className="btn btn-ghost" href="#integrate">Read the integration docs</a>
            </div>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="foot">
            <span className="brand">
              <svg width="22" height="12" viewBox="-4 -2 22 11" shapeRendering="crispEdges" aria-hidden="true">
                <g fill="#eef3fa">
                  <rect x="5" y="0" width="5" height="1" /><rect x="4" y="1" width="7" height="1" />
                  <rect x="3" y="2" width="9" height="1" /><rect x="3" y="3" width="9" height="1" />
                  <rect x="3" y="4" width="9" height="1" /><rect x="0" y="5" width="12" height="1" />
                </g>
                <rect x="0" y="6" width="12" height="1" fill="#9aa7bd" />
                <g fill="#3ce6a4">
                  <rect x="-2" y="-1" width="3" height="1" /><rect x="0" y="0" width="3" height="1" />
                  <rect x="2" y="1" width="3" height="1" /><rect x="4" y="2" width="3" height="1" />
                  <rect x="6" y="3" width="3" height="1" /><rect x="8" y="4" width="3" height="1" />
                  <rect x="10" y="5" width="3" height="1" /><rect x="12" y="6" width="3" height="1" />
                </g>
              </svg>
              NOCAP
            </span>
            <div className="foot-links">
              <a href="#api">Docs</a>
              <a href="#track">API status</a>
              <a href="#" aria-disabled="true">Telegram</a>
              <a href="#" aria-disabled="true">X</a>
              <a href="#integrate">Extension</a>
            </div>
          </div>
          <p className="foot-note">&copy; 2026 NOCAP · KNOW BEFORE YOU APE · CONCEPT BUILD, NOT FINANCIAL ADVICE</p>
        </div>
      </footer>

      {showGateModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.85)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '24px',
        }}>
          <div style={{
            backgroundColor: '#070a13',
            border: '1px solid rgba(132, 148, 176, 0.2)',
            borderRadius: '12px',
            maxWidth: '440px',
            width: '100%',
            padding: '32px',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
            position: 'relative',
            overflow: 'hidden',
          }}>
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0,
              height: '3px',
              background: 'linear-gradient(90deg, #ff5470 0%, #f2b544 50%, #83d9ff 100%)',
            }}></div>
            <h3 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: '#eef3fa',
              marginBottom: '12px',
              letterSpacing: '1px',
            }}>ACCESS RESTRICTED</h3>
            <p style={{
              fontSize: '14px',
              color: '#8494b0',
              lineHeight: '1.6',
              marginBottom: '24px',
            }}>
              You have used all <b>3 free trial scans</b>. To continue running real-time blockchain investigations, connect a Phantom wallet holding at least <b>1,000 $NOCAP</b>.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                className="btn btn-primary"
                onClick={() => {
                  connectWallet();
                  setShowGateModal(false);
                }}
                style={{ width: '100%', padding: '12px', borderRadius: '6px', fontWeight: 'bold' }}
              >
                CONNECT PHANTOM WALLET
              </button>
              <button
                className="btn btn-ghost"
                onClick={() => setShowGateModal(false)}
                style={{ width: '100%', padding: '12px', borderRadius: '6px', color: '#8494b0' }}
              >
                DISMISS
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
