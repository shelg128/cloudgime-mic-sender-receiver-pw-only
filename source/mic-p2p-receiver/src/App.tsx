import { useState, useEffect, useRef } from 'react';

const Icon = {
  Radio: (p: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="12" r="2"/><path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.83a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"/></svg>,
  Copy: (p: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>,
  Refresh: (p: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>,
  Shield: (p: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>,
  Volume: (p: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/></svg>,
  VolX: (p: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M23 7 7 17"/><path d="M17 7h10"/></svg>,
  Terminal: (p: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
};

export default function App() {
  const [pairing, setPairing] = useState<{ p2pId: string; p2pPassword: string } | null>(null);
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errMessage, setErrMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [outputDevices, setOutputDevices] = useState<MediaDeviceInfo[]>([]);
  const [signalServerUrl, setSignalServerUrl] = useState('wss://api.cloudgime.my.id/mic-signaling');

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${ts}] ${msg}`]);
  };

  const isElectron = window.navigator.userAgent.toLowerCase().includes('electron');
  let ipcRenderer: any = null;
  if (isElectron) {
    try { ipcRenderer = (window as any).require('electron').ipcRenderer; } catch {}
  }

  useEffect(() => {
    (async () => {
      if (isElectron && ipcRenderer) {
        try { setPairing(await ipcRenderer.invoke('get-pairing')); } catch {}
      }
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true }).then(s => s.getTracks().forEach(t => t.stop())).catch(() => {});
        const devices = await navigator.mediaDevices.enumerateDevices();
        setOutputDevices(devices.filter(d => d.kind === 'audiooutput'));
        const saved = localStorage.getItem('sentinel.p2p.receiver.deviceId');
        const exists = devices.some(d => d.deviceId === saved);
        if (saved && exists) setSelectedDeviceId(saved);
        else setSelectedDeviceId(devices[0]?.deviceId || 'default');
      } catch {}
    })();
  }, []);

  useEffect(() => {
    if (!pairing) return;
    setStatus('connecting');
    addLog(`=== P2P Receiver Active ===`);
    addLog(`ID: ${pairing.p2pId} | PW: ${pairing.p2pPassword}`);
    connect();
    return () => { cleanupWs(); cleanupPeer(); };
  }, [pairing]);

  const updateOutputDevices = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true }).then(s => s.getTracks().forEach(t => t.stop())).catch(() => {});
      const devices = await navigator.mediaDevices.enumerateDevices();
      setOutputDevices(devices.filter(d => d.kind === 'audiooutput'));
    } catch {}
  };

  const handleDeviceChange = async (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    try {
      localStorage.setItem('sentinel.p2p.receiver.deviceId', deviceId);
      if (audioElRef.current && (audioElRef.current as any).setSinkId) {
        await (audioElRef.current as any).setSinkId(deviceId);
      }
    } catch {}
  };

  const setupPeerEvents = (pc: RTCPeerConnection) => {
    pc.oniceconnectionstatechange = () => {
      addLog(`ICE: ${pc.iceConnectionState}`);
      if (pc.iceConnectionState === 'connected') setStatus('connected');
    };
    pc.onconnectionstatechange = () => {
      addLog(`State: ${pc.connectionState}`);
      if (pc.connectionState === 'connected') { setStatus('connected'); addLog('Koneksi WebRTC sukses!'); }
      else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        addLog('Koneksi terputus.');
        disconnect('webrtc_failed');
        setStatus('connecting');
      }
    };
    pc.ontrack = (event) => {
      addLog(`Track diterima: ${event.track.kind}`);
      const stream = event.streams[0] || new MediaStream([event.track]);
      if (audioElRef.current) {
        audioElRef.current.srcObject = stream;
        if (selectedDeviceId && (audioElRef.current as any).setSinkId) {
          (audioElRef.current as any).setSinkId(selectedDeviceId).catch(() => {});
        }
        audioElRef.current.play().catch(() => {});
      }
    };
  };

  const connect = () => {
    try {
      cleanupPeer();
      cleanupWs();
      const ws = new WebSocket(signalServerUrl);
      wsRef.current = ws;
      let ping: any = null;

      ws.onopen = () => {
        addLog(`Signaling terhubung.`);
        if (!pairing) return;
        ws.send(JSON.stringify({ Init: { role: 'p2p_receiver', p2p_id: pairing.p2pId, p2p_password: pairing.p2pPassword } }));
        ping = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ Heartbeat: { ts_ms: Date.now() } })); }, 15000);
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.Setup && Array.isArray(msg.Setup.ice_servers)) {
            if (pcRef.current) pcRef.current.close();
            const ice = msg.Setup.ice_servers.map((s: any) => ({ urls: s.urls, username: s.username || undefined, credential: s.credential || undefined }));
            const pc = new RTCPeerConnection({ iceServers: ice, iceCandidatePoolSize: 2 });
            pcRef.current = pc;
            pc.addTransceiver('audio', { direction: 'recvonly' });
            setupPeerEvents(pc);
            pc.onicecandidate = (e) => {
              if (e.candidate && ws.readyState === WebSocket.OPEN) {
                const c = e.candidate.candidate;
                if (!c.toLowerCase().includes('udp') || c.toLowerCase().includes('tcp') || c.includes(':') || c.toLowerCase().includes('.local') || c.includes('169.254')) return;
                ws.send(JSON.stringify({ WebRtc: { AddIceCandidate: { candidate: c, sdp_mid: e.candidate.sdpMid, sdp_mline_index: e.candidate.sdpMLineIndex, username_fragment: e.candidate.usernameFragment || null } } }));
              }
            };
          } else if (msg.WebRtc?.Description?.ty === 'offer') {
            const pc = pcRef.current;
            if (!pc) return;
            await pc.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: msg.WebRtc.Description.sdp }));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ WebRtc: { Description: { ty: pc.localDescription?.type, sdp: pc.localDescription?.sdp } } }));
          } else if (msg.WebRtc?.AddIceCandidate) {
            const pc = pcRef.current;
            if (!pc) return;
            const a = msg.WebRtc.AddIceCandidate;
            await pc.addIceCandidate(new RTCIceCandidate({ candidate: a.candidate, sdpMid: a.sdp_mid, sdpMLineIndex: a.sdp_mline_index, usernameFragment: a.username_fragment })).catch(() => {});
          } else if (msg.Error) {
            addLog(`Error: ${typeof msg.Error === 'string' ? msg.Error : JSON.stringify(msg.Error)}`);
            setStatus('error');
            setErrMessage(typeof msg.Error === 'string' ? msg.Error : 'Server error');
          }
        } catch (err: any) { addLog(`Error: ${err.message}`); }
      };

      ws.onclose = () => {
        if (ping) clearInterval(ping);
        if (status !== 'connected') {
          setStatus('disconnected');
          setTimeout(() => { if (wsRef.current === null) connect(); }, 5000);
        }
      };

      ws.onerror = () => {
        if (ping) clearInterval(ping);
        setStatus('error');
        setErrMessage('Gagal koneksi signaling.');
      };
    } catch (err: any) {
      setStatus('error');
      setErrMessage(err.message || 'Unknown error');
    }
  };

  const disconnect = (reason?: string) => {
    cleanupWs();
    cleanupPeer();
    setStatus('connecting');
  };

  const cleanupPeer = () => {
    if (pcRef.current) { try { pcRef.current.close(); } catch {} pcRef.current = null; }
    if (audioElRef.current) audioElRef.current.srcObject = null;
  };

  const cleanupWs = () => {
    if (wsRef.current) { try { wsRef.current.close(); } catch {} wsRef.current = null; }
  };

  const regeneratePassword = async () => {
    if (!isElectron || !ipcRenderer) return;
    const updated = await ipcRenderer.invoke('regenerate-password');
    setPairing(updated);
    addLog(`Password baru: ${updated.p2pPassword}`);
    setTimeout(() => { disconnect('pw_change'); connect(); }, 500);
  };

  const regenerateId = async () => {
    if (!isElectron || !ipcRenderer) return;
    if (!confirm('Buat ID baru? Password juga akan direset.')) return;
    const updated = await ipcRenderer.invoke('regenerate-id');
    setPairing(updated);
    addLog(`ID baru: ${updated.p2pId}`);
    setTimeout(() => { disconnect('id_change'); connect(); }, 500);
  };

  if (!pairing) {
    return <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">Memuat...</div>;
  }

  return (
    <div className="flex-1 flex flex-col justify-between py-6 max-h-screen">
      <audio ref={audioElRef} id="receiver-audio" autoPlay style={{ display: 'none' }} />

      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-[11px] font-semibold text-emerald-400 uppercase tracking-widest">
          <Icon.Shield className="w-3.5 h-3.5" />
          P2P Pairing
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white uppercase mt-2">
          P2P Mic <span className="bg-gradient-to-r from-emerald-400 to-cyan-500 bg-clip-text text-transparent">Receiver</span>
        </h1>
        <p className="text-xs text-zinc-500 max-w-[300px] mx-auto leading-relaxed">
          Bagikan ID dan Password ke pengirim. Ganti password untuk memutus koneksi lama.
        </p>
      </div>

      <div className="glass-card flex flex-col gap-4 p-4 border border-white/10 rounded-2xl bg-white/[0.02] mt-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">P2P ID</span>
            <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2.5">
              <span className="text-lg font-black text-white font-mono tracking-[0.2em]">{pairing.p2pId}</span>
              <button onClick={() => { navigator.clipboard.writeText(pairing.p2pId); addLog('ID disalin'); }} className="p-1 hover:bg-white/5 rounded text-zinc-400 hover:text-white cursor-pointer"><Icon.Copy className="w-3.5 h-3.5" /></button>
            </div>
            <button onClick={regenerateId} className="text-[9px] text-amber-400 hover:text-amber-300 cursor-pointer flex items-center gap-1"><Icon.Refresh className="w-3 h-3" /> Ganti ID</button>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[9px] text-zinc-500 font-mono uppercase tracking-wider">Password</span>
            <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2.5">
              <span className="text-lg font-black text-emerald-400 font-mono tracking-[0.2em]">{pairing.p2pPassword}</span>
              <button onClick={() => { navigator.clipboard.writeText(pairing.p2pPassword); addLog('PW disalin'); }} className="p-1 hover:bg-white/5 rounded text-zinc-400 hover:text-white cursor-pointer"><Icon.Copy className="w-3.5 h-3.5" /></button>
            </div>
            <button onClick={regeneratePassword} className="text-[9px] text-emerald-400 hover:text-emerald-300 cursor-pointer flex items-center gap-1"><Icon.Refresh className="w-3 h-3" /> Ganti Password</button>
          </div>
        </div>
      </div>

      <div className="space-y-3 my-2">
        <div className="glass-card flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-mono">Output Audio Device</label>
          <div className="relative flex items-center">
            {selectedDeviceId ? <Icon.Volume className="absolute left-3 w-4 h-4 text-zinc-400" /> : <Icon.VolX className="absolute left-3 w-4 h-4 text-zinc-500" />}
            <select value={selectedDeviceId} onChange={e => handleDeviceChange(e.target.value)} className="w-full bg-white/[0.02] border border-white/5 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/10 transition-all cursor-pointer appearance-none font-mono">
              {outputDevices.length === 0 ? <option value="default">Default System Output</option> : outputDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label || `Speaker (${d.deviceId.substring(0, 5)}...)`}</option>)}
            </select>
            <div className="pointer-events-none absolute right-3 flex items-center text-zinc-400"><svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg></div>
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 my-2">
        <div className="relative">
          {status === 'connected' && <div className="absolute inset-0 rounded-full bg-emerald-500/20 blur-xl scale-125 animate-pulse-ring" />}
          <div className={`relative w-24 h-24 rounded-full flex flex-col items-center justify-center gap-1 border transition-all duration-300 shadow-2xl ${status === 'connected' ? 'bg-emerald-950/40 border-emerald-500/60 text-emerald-400' : 'bg-indigo-950/40 border-indigo-500/60 text-indigo-400 animate-pulse'}`}>
            {status === 'connected' ? <><Icon.Volume className="w-7 h-7" /><span className="text-[9px] font-black uppercase tracking-widest">Streaming</span></> : <><Icon.Radio className="w-7 h-7" /><span className="text-[9px] font-black uppercase tracking-widest">Listening</span></>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500 animate-pulse'}`} />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{status === 'connected' ? 'Terhubung & Memutar Suara' : 'Menunggu Koneksi P2P...'}</span>
        </div>
      </div>

      {errMessage && (
        <div className="p-3 bg-rose-950/20 border border-rose-500/20 rounded-2xl flex items-start gap-2 my-2">
          <Icon.Shield className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <div className="text-xs text-rose-300/80 leading-relaxed">{errMessage}</div>
        </div>
      )}

      <div className="mt-2">
        <button onClick={() => setShowLogs(!showLogs)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/[0.02] border border-white/5 text-[10px] font-mono text-zinc-400 hover:text-white transition-all cursor-pointer">
          <Icon.Terminal className="w-3.5 h-3.5" />
          {showLogs ? 'Sembunyikan Log' : 'Tampilkan Log'}
        </button>
        {showLogs && (
          <div className="glass-card mt-2 p-3 bg-black/60 rounded-xl border border-white/5">
            <div className="flex justify-between items-center mb-1.5 border-b border-white/5 pb-1">
              <span className="text-[9px] uppercase font-bold tracking-widest text-zinc-400 font-mono">Console Logs</span>
              <button onClick={() => setLogs([])} className="text-[9px] text-zinc-500 hover:text-zinc-300 font-mono cursor-pointer">Clear</button>
            </div>
            <div className="h-28 overflow-y-auto text-[9.5px] font-mono text-zinc-300 space-y-1 custom-scrollbar pr-1 select-text break-all">
              {logs.length === 0 ? <div className="text-zinc-600">Belum ada aktivitas...</div> : logs.map((log, i) => <div key={i} className="whitespace-pre-wrap">{log}</div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
