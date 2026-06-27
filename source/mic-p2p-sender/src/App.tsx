import { useState, useEffect, useRef } from 'react';

const Icon = {
  Mic: (p: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" x2="12" y1="19" y2="22"/></svg>,
  MicOff: (p: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="2" x2="22" y1="2" y2="22"/><path d="M18.89 13.23A7.12 7.12 0 0 0 19 12v-2"/><path d="M5 10v2a7 7 0 0 0 12 5"/><path d="M15 9.34V5a3 3 0 0 0-5.68-1.33"/><path d="M9 9v3a3 3 0 0 0 5.12 2.12"/><line x1="12" x2="12" y1="19" y2="22"/></svg>,
  Wifi: (p: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>,
  WifiOff: (p: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><line x1="1" x2="23" y1="1" y2="23"/><path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/><path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/><path d="M10.71 5.05A16 16 0 0 1 22.56 9"/><path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" x2="12.01" y1="20" y2="20"/></svg>,
  Shield: (p: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>,
  Terminal: (p: any) => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg>,
};

export default function App() {
  const [p2pId, setP2pId] = useState('');
  const [p2pPassword, setP2pPassword] = useState('');
  const [status, setStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [errMessage, setErrMessage] = useState('');
  const [logs, setLogs] = useState<string[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [signalServerUrl, setSignalServerUrl] = useState('wss://api.cloudgime.my.id/mic-signaling');

  const pcRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addLog = (msg: string) => {
    const ts = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${ts}] ${msg}`]);
  };

  const handleDeeplink = (urlString: string) => {
    try {
      const qi = urlString.indexOf('?');
      if (qi === -1) return;
      const qs = urlString.substring(qi);
      const p = new URLSearchParams(qs);
      const id = p.get('p2p_id') || p.get('id') || '';
      const pw = p.get('p2p_password') || p.get('pw') || p.get('password') || '';
      const sig = p.get('sig') || '';
      if (id) setP2pId(id);
      if (pw) setP2pPassword(pw);
      if (sig) {
        try { localStorage.setItem('sentinel.p2p.sender.signalingUrl', sig); } catch {}
      }
      if (id && pw) {
        setTimeout(() => { void connect(id, pw, sig); }, 200);
      }
    } catch {}
  };

  useEffect(() => {
    if (window.location.hash || window.location.search) {
      const s = window.location.search || window.location.hash.split('?')[1];
      if (s && (s.includes('p2p_id') || s.includes('id='))) handleDeeplink(`sentinel-micp2p://connect?${s}`);
    }
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem('sentinel.p2p.sender.signalingUrl') || '';
      if (saved) setSignalServerUrl(saved);
    } catch {}
  }, []);

  const toggleConnection = () => {
    if (status === 'connected' || status === 'connecting') {
      disconnect();
    } else {
      void connect();
    }
  };

  const connect = async (overrideId?: string, overridePw?: string, overrideSig?: string) => {
    const activeId = (overrideId !== undefined ? overrideId : p2pId).trim();
    const activePw = (overridePw !== undefined ? overridePw : p2pPassword).trim();
    const savedSig = (() => { try { return localStorage.getItem('sentinel.p2p.sender.signalingUrl') || ''; } catch { return ''; } })();
    const wsUrl = overrideSig || savedSig || signalServerUrl;

    if (!activeId || !activePw) { setStatus('error'); setErrMessage('P2P ID dan Password diperlukan.'); return; }

    setStatus('connecting');
    setErrMessage('');
    setLogs([]);
    addLog(`Mode: P2P Cloud`);
    addLog(`ID: ${activeId}`);
    addLog(`PW: ${activePw.replace(/./g, '*')}`);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } }).catch(err => { throw new Error(`Gagal akses mikrofon: ${err.message}`); });
      streamRef.current = stream;
      addLog(`Mikrofon aktif: ${stream.getTracks().map(t => t.label).join(', ')}`);

      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }], iceCandidatePoolSize: 2 });
      pcRef.current = pc;
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      pc.onsignalingstatechange = () => addLog(`Signaling: ${pc.signalingState}`);
      pc.oniceconnectionstatechange = () => addLog(`ICE: ${pc.iceConnectionState}`);
      pc.onicegatheringstatechange = () => addLog(`Gathering: ${pc.iceGatheringState}`);
      pc.onconnectionstatechange = () => {
        addLog(`State: ${pc.connectionState}`);
        if (pc.connectionState === 'connected') { setStatus('connected'); addLog('WebRTC koneksi berhasil!'); }
        else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          addLog('Koneksi terputus.');
          disconnect('connection_failed');
          setStatus('error');
          setErrMessage('Koneksi WebRTC terputus.');
        }
      };
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          const c = event.candidate.candidate;
          if (!c.toLowerCase().includes('udp') || c.toLowerCase().includes('tcp') || c.includes(':') || c.toLowerCase().includes('.local') || c.includes('169.254')) return;
          wsRef.current.send(JSON.stringify({ WebRtc: { AddIceCandidate: { candidate: c, sdp_mid: event.candidate.sdpMid, sdp_mline_index: event.candidate.sdpMLineIndex, username_fragment: event.candidate.usernameFragment || null } } }));
        }
      };

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;
      let ping: any = null;

      ws.onopen = () => {
        addLog(`Signaling terhubung.`);
        ws.send(JSON.stringify({ Init: { role: 'p2p_sender', p2p_id: activeId, p2p_password: activePw } }));
        ping = setInterval(() => { if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify({ Heartbeat: { ts_ms: Date.now() } })); }, 15000);
      };

      ws.onmessage = async (event) => {
        try {
          const msg = JSON.parse(event.data);
          if (msg.Setup && Array.isArray(msg.Setup.ice_servers)) {
            const ice = msg.Setup.ice_servers.map((s: any) => ({ urls: s.urls, username: s.username || undefined, credential: s.credential || undefined }));
            pc.close();
            const newPc = new RTCPeerConnection({ iceServers: ice, iceCandidatePoolSize: 2 });
            pcRef.current = newPc;
            newPc.addTrack(stream.getAudioTracks()[0], stream);
            newPc.onsignalingstatechange = () => addLog(`Signaling: ${newPc.signalingState}`);
            newPc.oniceconnectionstatechange = () => addLog(`ICE: ${newPc.iceConnectionState}`);
            newPc.onconnectionstatechange = () => {
              addLog(`State: ${newPc.connectionState}`);
              if (newPc.connectionState === 'connected') { setStatus('connected'); addLog('WebRTC koneksi berhasil!'); }
              else if (newPc.connectionState === 'disconnected' || newPc.connectionState === 'failed') {
                disconnect('connection_failed');
                setStatus('error');
                setErrMessage('Koneksi WebRTC terputus.');
              }
            };
            newPc.onicecandidate = (e) => {
              if (e.candidate && ws.readyState === WebSocket.OPEN) {
                const c = e.candidate.candidate;
                const isIPv6 = (c.match(/:/g) || []).length > 1;
                if (!c.toLowerCase().includes('udp') || c.toLowerCase().includes('tcp') || isIPv6 || c.toLowerCase().includes('.local') || c.includes('169.254')) return;
                ws.send(JSON.stringify({ WebRtc: { AddIceCandidate: { candidate: c, sdp_mid: e.candidate.sdpMid, sdp_mline_index: e.candidate.sdpMLineIndex, username_fragment: e.candidate.usernameFragment || null } } }));
              }
            };
            const offer = await newPc.createOffer();
            await newPc.setLocalDescription(offer);
            addLog(`Waiting for ICE gathering...`);
            await new Promise<void>((resolve) => {
              if (newPc.iceGatheringState === 'complete') resolve();
              else {
                const check = () => { if (newPc.iceGatheringState === 'complete') { newPc.removeEventListener('icegatheringstatechange', check); resolve(); } };
                newPc.addEventListener('icegatheringstatechange', check);
                setTimeout(() => { newPc.removeEventListener('icegatheringstatechange', check); resolve(); }, 5000);
              }
            });
            addLog(`ICE gathering done.`);
            ws.send(JSON.stringify({ WebRtc: { Description: { ty: newPc.localDescription?.type, sdp: newPc.localDescription?.sdp } } }));
          } else if (msg.WebRtc?.Description?.ty === 'answer') {
            const activePc = pcRef.current;
            if (!activePc) return;
            await activePc.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: msg.WebRtc.Description.sdp }));
            addLog('SDP Answer diterima.');
          } else if (msg.WebRtc?.AddIceCandidate) {
            const activePc = pcRef.current;
            if (!activePc) return;
            const a = msg.WebRtc.AddIceCandidate;
            await activePc.addIceCandidate(new RTCIceCandidate({ candidate: a.candidate, sdpMid: a.sdp_mid, sdpMLineIndex: a.sdp_mline_index, usernameFragment: a.username_fragment })).catch(() => {});
          } else if (msg.Error) {
            addLog(`Error: ${typeof msg.Error === 'string' ? msg.Error : JSON.stringify(msg.Error)}`);
            setStatus('error');
            setErrMessage(typeof msg.Error === 'string' ? msg.Error : 'Gagal terhubung. Cek ID/Password.');
            disconnect('server_error');
          }
        } catch (err: any) { addLog(`Error: ${err.message}`); }
      };

      ws.onclose = () => {
        if (ping) clearInterval(ping);
        if (status !== 'connected') {
          setStatus('disconnected');
          setTimeout(() => { if (!wsRef.current) connect(activeId, activePw); }, 5000);
        }
      };

      ws.onerror = () => {
        if (ping) clearInterval(ping);
        setStatus('error');
        setErrMessage('Gagal koneksi signaling server.');
      };
    } catch (err: any) {
      addLog(`Fatal: ${err.message}`);
      setStatus('error');
      setErrMessage(err.message);
      disconnect('fatal');
    }
  };

  const disconnect = (reason?: string) => {
    addLog(`Disconnect: ${reason || 'user'}`);
    if (wsRef.current) { try { wsRef.current.close(); } catch {} wsRef.current = null; }
    if (pcRef.current) { try { pcRef.current.close(); } catch {} pcRef.current = null; }
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setStatus('disconnected');
  };

  return (
    <div className="flex-1 flex flex-col justify-between py-6 max-h-screen">
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/5 text-[11px] font-semibold text-sky-400 uppercase tracking-widest">
          <Icon.Shield className="w-3.5 h-3.5" />
          P2P Pairing Mode
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white uppercase mt-2">
          P2P Mic <span className="bg-gradient-to-r from-sky-400 to-indigo-500 bg-clip-text text-transparent">Sender</span>
        </h1>
        <p className="text-xs text-zinc-500 max-w-[280px] mx-auto leading-relaxed">
          Masukkan ID dan Password dari Receiver PC. Hubungkan mikrofon Anda.
        </p>
      </div>

      <div className="space-y-3 my-2">
        <div className="glass-card flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-mono">P2P ID (6 digit)</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="e.g. 582910"
            value={p2pId}
            onChange={e => setP2pId(e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={status === 'connected' || status === 'connecting'}
            className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/10 transition-all placeholder-zinc-600"
          />
        </div>
        <div className="glass-card flex flex-col gap-1.5">
          <label className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 font-mono">Password (6 digit)</label>
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            placeholder="e.g. 334921"
            value={p2pPassword}
            onChange={e => setP2pPassword(e.target.value.replace(/\D/g, '').slice(0, 6))}
            disabled={status === 'connected' || status === 'connecting'}
            className="w-full bg-white/[0.02] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white font-mono outline-none focus:border-sky-500/40 focus:ring-1 focus:ring-sky-500/10 transition-all placeholder-zinc-600"
          />
        </div>
      </div>

      <div className="flex flex-col items-center gap-5 my-4">
        <div className="relative">
          {status === 'connecting' && <div className="absolute inset-0 rounded-full bg-amber-500/20 blur-xl scale-125 animate-pulse-ring-blue" />}
          <button
            onClick={toggleConnection}
            disabled={(!p2pId || !p2pPassword) && status !== 'connected' && status !== 'connecting'}
            className={`relative w-28 h-28 rounded-full flex flex-col items-center justify-center gap-1 border transition-all duration-300 shadow-2xl cursor-pointer ${status === 'connected' ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/20' : status === 'connecting' ? 'bg-amber-500/10 border-amber-500/40 text-amber-400' : 'bg-sky-500/10 border-sky-500/40 text-sky-400 hover:bg-sky-500/20'}`}
          >
            {status === 'connected' ? <><Icon.MicOff className="w-8 h-8" /><span className="text-[10px] font-black uppercase tracking-widest mt-1">Disconnect</span></> : status === 'connecting' ? <><div className="w-8 h-8 rounded-full border-2 border-t-transparent border-amber-400 animate-spin" /><span className="text-[10px] font-black uppercase tracking-widest mt-1">Connecting</span></> : <><Icon.Mic className="w-8 h-8" /><span className="text-[10px] font-black uppercase tracking-widest mt-1">Connect</span></>}
          </button>
        </div>
        <div className="flex items-center gap-2">
          {status === 'connected' ? <><Icon.Wifi className="w-4 h-4 text-emerald-400 animate-bounce" /><span className="text-xs text-emerald-400 font-medium">Connected P2P</span></> : status === 'connecting' ? <><div className="w-4 h-4 rounded-full border-2 border-t-transparent border-amber-400 animate-spin" /><span className="text-xs text-amber-400 font-medium animate-pulse">Menghubungkan...</span></> : <><Icon.WifiOff className="w-4 h-4 text-zinc-500" /><span className="text-xs text-zinc-500 font-medium">Disconnected</span></>}
        </div>
      </div>

      {status === 'error' && errMessage && (
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
              {logs.length === 0 ? <div className="text-zinc-600 italic">Belum ada logs. Tekan Connect.</div> : logs.map((log, i) => <div key={i} className="whitespace-pre-wrap">{log}</div>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
