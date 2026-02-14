
import React, { useState, useEffect } from 'react';
import { 
  Lock, ShieldCheck, Info, AlignLeft, Image as ImageIcon, 
  CloudUpload, ArrowLeft, Eye, Trash2, Printer, Sparkles
} from 'lucide-react';
// Importing Gemini API for AI features
import { GoogleGenAI } from "@google/genai";
// Centralized Firebase imports from our local config file
import { 
  auth, 
  getReportsCollection, 
  getReportDoc, 
  onAuthStateChanged, 
  signInAnonymously,
  onSnapshot, 
  addDoc, 
  deleteDoc 
} from './firebase';
import { Report, ViewState, ConnectionStatus } from './types';

export default function App() {
  const [view, setView] = useState<ViewState>('dashboard');
  const [reports, setReports] = useState<Report[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>('pending');
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // AI Insights State
  const [aiSummary, setAiSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Form states
  const [namaProgram, setNamaProgram] = useState('');
  const [tarikh, setTarikh] = useState('');
  const [hari, setHari] = useState('ISNIN');
  const [tempat, setTempat] = useState('');
  const [masa, setMasa] = useState('');
  const [objektif, setObjektif] = useState('');
  const [aktiviti, setAktiviti] = useState('');
  const [base64Images, setBase64Images] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessingImages, setIsProcessingImages] = useState(false);

  // Login states
  const [adminIdInput, setAdminIdInput] = useState('');
  const [adminPwInput, setAdminPwInput] = useState('');

  const SCHOOL_LOGO = "https://i.postimg.cc/SNmZtXqv/photo-2026-01-21-21-49-29.jpg";

  // Effect to handle auth lifecycle and real-time report updates
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        setStatus('online');
      } else {
        signInAnonymously(auth).catch(() => setStatus('offline'));
      }
    });

    const unsubscribeReports = onSnapshot(getReportsCollection(), (snapshot) => {
      const reportsList: Report[] = [];
      snapshot.forEach(doc => reportsList.push({ id: doc.id, ...doc.data() } as Report));
      setReports(reportsList.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || "")));
    }, () => {
      setStatus('offline');
    });

    return () => {
      unsubscribeAuth();
      unsubscribeReports();
    };
  }, []);

  const handleLogin = () => {
    if (adminIdInput.toLowerCase() === 'admin' && adminPwInput === 'sekolah2024') {
      setIsAdmin(true);
      setIsLoginModalOpen(false);
      setView('admin');
      setAdminIdInput('');
      setAdminPwInput('');
    } else {
      alert("ID atau Kata Laluan Salah!");
    }
  };

  // Logic to generate summary of activities using Gemini AI
  const handleAiSummary = async () => {
    if (reports.length === 0) return;
    setIsSummarizing(true);
    setAiSummary('');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const activityTitles = reports.map(r => r.nama).join(', ');
      const prompt = `Berikut adalah senarai tajuk aktiviti kokurikulum sekolah: ${activityTitles}. 
      Tolong berikan satu perenggan rumusan profesional dalam Bahasa Melayu yang menghuraikan kepelbagaian aktiviti ini dan bagaimana ia membantu pembentukan sahsiah pelajar.`;
      
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setAiSummary(response.text || "Tiada rumusan dijana.");
    } catch (err) {
      console.error(err);
      setAiSummary("Maaf, sistem AI tidak dapat menjana rumusan buat masa ini.");
    } finally {
      setIsSummarizing(false);
    }
  };

  const compressImage = async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const MAX_WIDTH = 800;
          if (width > MAX_WIDTH) {
            height = (MAX_WIDTH / width) * height;
            width = MAX_WIDTH;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.6));
          }
        };
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setIsProcessingImages(true);
    const files = (Array.from(e.target.files) as File[]).slice(0, 4);
    const processed: string[] = [];
    for (const file of files) {
      const compressed = await compressImage(file);
      processed.push(compressed);
    }
    setBase64Images(processed);
    setIsProcessingImages(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return alert("Sila tunggu sambungan sistem...");
    setIsSubmitting(true);

    try {
      await addDoc(getReportsCollection(), {
        nama: namaProgram.toUpperCase(),
        tarikh,
        hari: hari.toUpperCase(),
        tempat: tempat.toUpperCase(),
        masa: masa.toUpperCase(),
        objektif: objektif.toUpperCase(),
        aktiviti: aktiviti.toUpperCase(),
        imej: base64Images,
        timestamp: new Date().toISOString()
      });

      alert("Laporan berjaya disimpan!");
      setNamaProgram('');
      setTarikh('');
      setHari('ISNIN');
      setTempat('');
      setMasa('');
      setObjektif('');
      setAktiviti('');
      setBase64Images([]);
      window.scrollTo(0, 0);
    } catch (err: any) {
      console.error(err);
      alert("Gagal menyimpan laporan. Sila cuba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteReport = async (id: string) => {
    if (confirm("Padam laporan ini secara kekal?")) {
      try {
        await deleteDoc(getReportDoc(id));
      } catch (e) {
        alert("Ralat memadam.");
      }
    }
  };

  const viewReport = (report: Report) => {
    setSelectedReport(report);
    setIsPrintModalOpen(true);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900 pb-10">
      {/* Navigation Bar */}
      <nav className="glass-nav text-white shadow-xl sticky top-0 z-40 no-print">
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4 cursor-pointer" onClick={() => window.location.reload()}>
            <img 
              src={SCHOOL_LOGO} 
              alt="Logo Sekolah" 
              className="w-12 h-12 object-contain bg-white rounded-full p-1 shadow-md"
            />
            <div className="leading-tight">
              <span className="font-bold text-xl tracking-wide block text-white uppercase">SMA AL-MAHADUL ISLAMI</span>
              <span className="text-xs text-blue-100 opacity-80 uppercase tracking-widest font-medium">TASEK JUNJUNG</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <div className="flex items-center space-x-6 mb-1">
              <button 
                onClick={() => setView('dashboard')} 
                className={`text-sm font-bold hover:text-blue-200 transition uppercase tracking-wider ${view === 'dashboard' ? 'text-blue-200' : ''}`}
              >
                UTAMA
              </button>
              <button 
                onClick={() => setIsLoginModalOpen(true)} 
                className="bg-white/10 border border-white/20 px-5 py-2 rounded-xl hover:bg-white/20 transition flex items-center space-x-2"
              >
                <Lock className="w-4 h-4 text-blue-200" />
                <span className="text-sm font-bold uppercase">PENTADBIR</span>
              </button>
            </div>
            <div className="flex items-center opacity-70">
              <span className={`status-dot status-${status}`}></span>
              <span className={`text-[9px] font-bold uppercase tracking-tighter ${status === 'online' ? 'text-green-400' : status === 'pending' ? 'text-yellow-300' : 'text-red-300'}`}>
                {status === 'online' ? 'SISTEM ONLINE' : status === 'pending' ? 'MENYAMBUNG...' : 'TIADA SAMBUNGAN'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      {/* Admin Login Modal */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex items-center justify-center z-[100] p-4 no-print">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 modal-enter">
            <div className="p-8">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <ShieldCheck className="w-8 h-8 text-blue-800" />
              </div>
              <h3 className="text-center text-xl font-black text-slate-900 mb-2 uppercase">LOG MASUK ADMIN</h3>
              <p className="text-center text-xs text-slate-500 mb-8 font-bold uppercase tracking-widest">Sila masukkan ID & Kata Laluan</p>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">ID Pengguna</label>
                  <input 
                    type="text" 
                    value={adminIdInput}
                    onChange={(e) => setAdminIdInput(e.target.value)}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition uppercase text-sm font-bold" 
                    placeholder="ID ANDA"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase mb-1 ml-1">Kata Laluan</label>
                  <input 
                    type="password" 
                    value={adminPwInput}
                    onChange={(e) => setAdminPwInput(e.target.value)}
                    className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition text-sm font-bold" 
                    placeholder="••••••••"
                  />
                </div>
                <button 
                  onClick={handleLogin}
                  className="w-full bg-blue-800 text-white font-black py-4 rounded-xl shadow-lg hover:bg-blue-900 transition mt-4 uppercase tracking-wider"
                >
                  MASUK SISTEM
                </button>
                <button 
                  onClick={() => setIsLoginModalOpen(false)} 
                  className="w-full text-slate-400 font-bold py-2 text-xs uppercase hover:text-slate-600 transition"
                >
                  BATAL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Areas */}
      <div className="container mx-auto px-4 py-10 no-print">
        {view === 'dashboard' && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-black text-slate-900 mb-2 tracking-tight uppercase">LAPORAN PROGRAM KO-KURIKULUM</h1>
              <p className="text-slate-500 font-medium uppercase text-xs tracking-[0.2em]">Borang Digital Pengurusan Aktiviti</p>
            </div>

            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="bg-blue-800 h-2"></div>
              <div className="p-8 md:p-12">
                <form onSubmit={handleSubmit} className="space-y-8">
                  <div className="space-y-6">
                    <div className="flex items-center space-x-2 text-blue-800 font-bold uppercase text-xs tracking-wider">
                      <Info className="w-4 h-4" />
                      <span>MAKLUMAT ASAS PROGRAM</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Nama Program / Unit</label>
                        <input 
                          type="text" 
                          required
                          value={namaProgram}
                          onChange={(e) => setNamaProgram(e.target.value)}
                          placeholder="CONTOH: KELAB ROBOTIK" 
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none uppercase text-sm focus:ring-2 focus:ring-blue-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Tarikh</label>
                        <input 
                          type="date" 
                          required 
                          value={tarikh}
                          onChange={(e) => setTarikh(e.target.value)}
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Hari</label>
                        <select 
                          value={hari}
                          onChange={(e) => setHari(e.target.value)}
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase focus:ring-2 focus:ring-blue-500 transition"
                        >
                          {['ISNIN', 'SELASA', 'RABU', 'KHAMIS', 'JUMAAT', 'SABTU', 'AHAD'].map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Tempat</label>
                        <input 
                          type="text" 
                          required
                          value={tempat}
                          onChange={(e) => setTempat(e.target.value)}
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl uppercase text-sm focus:ring-2 focus:ring-blue-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Masa</label>
                        <input 
                          type="text" 
                          required
                          value={masa}
                          onChange={(e) => setMasa(e.target.value)}
                          placeholder="CONTOH: 2.00 - 4.00 PETANG" 
                          className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl uppercase text-sm focus:ring-2 focus:ring-blue-500 transition"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 pt-4">
                    <div className="flex items-center space-x-2 text-blue-800 font-bold uppercase text-xs tracking-wider">
                      <AlignLeft className="w-4 h-4" />
                      <span>PERINCIAN AKTIVITI</span>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Objektif</label>
                      <textarea 
                        rows={2} 
                        value={objektif}
                        onChange={(e) => setObjektif(e.target.value)}
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase focus:ring-2 focus:ring-blue-500 transition" 
                        placeholder="NYATAKAN OBJEKTIF PROGRAM..."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Laporan Aktiviti</label>
                      <textarea 
                        rows={5} 
                        value={aktiviti}
                        onChange={(e) => setAktiviti(e.target.value)}
                        placeholder="NYATAKAN RINGKASAN AKTIVITI YANG DIJALANKAN..." 
                        className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm uppercase focus:ring-2 focus:ring-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2 uppercase">Gambar (Maksimum 4)</label>
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-200 border-dashed rounded-xl bg-slate-50 hover:bg-slate-100 transition cursor-pointer relative">
                        <div className="space-y-1 text-center">
                          <ImageIcon className="mx-auto h-12 w-12 text-slate-400" />
                          <div className="flex text-sm text-slate-600 justify-center">
                            <label className="relative cursor-pointer font-bold text-blue-700 uppercase">
                              <span>Muat naik fail</span>
                              <input 
                                type="file" 
                                className="sr-only" 
                                accept="image/*" 
                                multiple 
                                onChange={handleImageUpload}
                              />
                            </label>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">Gambar akan dimampatkan secara automatik</p>
                        </div>
                      </div>
                      {isProcessingImages && (
                        <div className="text-center py-4 text-xs font-bold text-blue-600 animate-pulse">
                          MEMPROSES GAMBAR...
                        </div>
                      )}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {base64Images.map((img, idx) => (
                          <div key={idx} className="relative group">
                            <img src={img} className="w-full aspect-square object-cover rounded-xl border-2 border-slate-200 shadow-sm" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="w-full bg-blue-800 text-white font-black py-5 rounded-xl shadow-lg flex justify-center items-center text-xl uppercase tracking-wide hover:bg-blue-900 transition active:scale-[0.98]"
                  >
                    {isSubmitting ? (
                      <div className="loader mr-3"></div>
                    ) : (
                      <CloudUpload className="mr-3 w-7 h-7" />
                    )}
                    {isSubmitting ? 'MENYIMPAN...' : 'Simpan Laporan'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {view === 'admin' && (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden">
              <div className="p-8 border-b flex flex-col md:flex-row justify-between items-center bg-slate-50/50 gap-4">
                <div>
                  <h2 className="text-2xl font-black text-slate-900 uppercase">ARKIB LAPORAN DIGITAL</h2>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Senarai semua aktiviti yang telah direkodkan</p>
                </div>
                <div className="flex space-x-2">
                  <button 
                    onClick={handleAiSummary}
                    disabled={isSummarizing || reports.length === 0}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-bold uppercase text-xs hover:bg-indigo-700 transition flex items-center shadow-lg disabled:opacity-50"
                  >
                    <Sparkles className="w-4 h-4 mr-2" /> {isSummarizing ? 'Menjana...' : 'Rumusan AI'}
                  </button>
                  <button 
                    onClick={() => setView('dashboard')} 
                    className="px-5 py-2.5 bg-white border rounded-lg font-bold uppercase text-xs hover:bg-slate-100 transition flex items-center"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                  </button>
                </div>
              </div>

              {/* AI Insight Bar */}
              {aiSummary && (
                <div className="p-6 bg-indigo-50 border-b border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-500">
                  <div className="flex items-start space-x-3">
                    <Sparkles className="w-5 h-5 text-indigo-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="text-[10px] font-black text-indigo-900 uppercase tracking-widest mb-1">Rumusan Eksekutif AI</h4>
                      <p className="text-sm text-indigo-800 leading-relaxed italic">"{aiSummary}"</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase tracking-widest font-black text-slate-500">
                      <th className="p-6">Tarikh</th>
                      <th className="p-6">Program</th>
                      <th className="p-6">Tempat</th>
                      <th className="p-6 text-center">Tindakan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {reports.map(item => (
                      <tr key={item.id} className="hover:bg-slate-50 transition border-b border-slate-100">
                        <td className="p-6 text-sm font-bold text-slate-700">{item.tarikh}</td>
                        <td className="p-6 text-sm font-black text-blue-900 uppercase leading-tight">{item.nama}</td>
                        <td className="p-6 text-xs text-slate-500 uppercase">{item.tempat}</td>
                        <td className="p-6">
                          <div className="flex justify-center space-x-2">
                            <button 
                              onClick={() => viewReport(item)} 
                              className="p-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteReport(item.id!)} 
                              className="p-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {reports.length === 0 && (
                <div className="text-center py-20 flex flex-col items-center justify-center space-y-3">
                  <div className="loader"></div>
                  <span className="uppercase text-xs font-bold text-slate-400 tracking-widest">Memuatkan data...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Official Report Print Template */}
      {isPrintModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-0 md:p-4 z-50 print-wrapper">
          <div className="bg-white w-full max-w-5xl md:max-h-[90vh] md:overflow-y-auto md:rounded-3xl p-0 border border-slate-200 shadow-2xl">
            {/* Modal Header for Screen View */}
            <div className="p-4 border-b flex justify-between items-center bg-slate-50 md:rounded-t-3xl sticky top-0 z-20 no-print">
               <h3 className="font-bold text-slate-700 uppercase text-xs tracking-widest flex items-center">
                 <Printer className="w-4 h-4 mr-2" /> Previu Laporan
               </h3>
               <div className="flex space-x-3">
                 <button 
                   onClick={() => setIsPrintModalOpen(false)} 
                   className="px-4 py-2 bg-white border border-slate-200 text-slate-500 rounded-lg text-xs font-bold uppercase hover:bg-slate-100 transition"
                 >
                   Batal
                 </button>
                 <button 
                   onClick={handlePrint} 
                   className="px-6 py-2 bg-blue-800 text-white rounded-lg text-xs font-black uppercase tracking-wide shadow-md hover:bg-blue-900 transition flex items-center"
                 >
                   <Printer className="w-4 h-4 mr-2" /> Cetak Laporan
                 </button>
               </div>
            </div>

            {/* Print Content Area */}
            <div className="bg-white p-8 md:p-16 text-slate-900 printable-card" id="printable-area">
              <div className="flex items-center border-b-2 border-slate-900 pb-6 mb-8 gap-6">
                <img src={SCHOOL_LOGO} className="w-24 h-24 object-contain" alt="School Logo" />
                <div className="flex-1">
                  <h1 className="text-2xl font-black text-slate-900 uppercase leading-none">SMA AL-MAHADUL ISLAMI</h1>
                  <p className="text-sm font-bold text-slate-600 mt-1 uppercase tracking-tight">TASEK JUNJUNG, 14120 SIMPANG AMPAT, PULAU PINANG</p>
                  <p className="text-xs font-medium text-slate-500 uppercase mt-0.5">Telefon: 04-588 7226 | Kod Sekolah: PFT4001</p>
                  <div className="h-1 bg-slate-900 mt-4"></div>
                  <div className="h-0.5 bg-slate-900 mt-0.5"></div>
                </div>
              </div>

              <div className="text-center mb-8">
                <h2 className="text-xl font-black uppercase underline decoration-2 underline-offset-4 tracking-wider">LAPORAN AKTIVITI KOKURIKULUM</h2>
              </div>

              <div className="grid grid-cols-2 border border-slate-400 mb-8 uppercase text-xs">
                <div className="p-4 border-r border-slate-400 space-y-2">
                  <div className="flex items-start">
                    <span className="font-black w-24 flex-shrink-0">UNIT/KELAB:</span>
                    <span className="font-bold text-blue-900">{selectedReport.nama}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-black w-24">TARIKH:</span>
                    <span>{selectedReport.tarikh}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-black w-24">HARI:</span>
                    <span>{selectedReport.hari}</span>
                  </div>
                </div>
                <div className="p-4 space-y-2">
                  <div className="flex items-start">
                    <span className="font-black w-24 flex-shrink-0">TEMPAT:</span>
                    <span>{selectedReport.tempat}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="font-black w-24">MASA:</span>
                    <span>{selectedReport.masa}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-8 uppercase">
                <section>
                  <h3 className="font-black bg-slate-100 p-2 text-sm border-l-4 border-slate-900 mb-3 tracking-wide">1.0 OBJEKTIF AKTIVITI</h3>
                  <div className="pl-6 text-sm leading-relaxed text-justify">
                    {selectedReport.objektif || 'TIADA OBJEKTIF DINYATAKAN'}
                  </div>
                </section>

                <section>
                  <h3 className="font-black bg-slate-100 p-2 text-sm border-l-4 border-slate-900 mb-3 tracking-wide">2.0 RINGKASAN AKTIVITI</h3>
                  <div className="pl-6 text-sm leading-relaxed text-justify whitespace-pre-wrap">
                    {selectedReport.aktiviti}
                  </div>
                </section>

                <section className="break-inside-avoid">
                  <h3 className="font-black bg-slate-100 p-2 text-sm border-l-4 border-slate-900 mb-3 tracking-wide">3.0 DOKUMENTASI GAMBAR</h3>
                  <div className="grid grid-cols-2 gap-6 mt-6">
                    {(selectedReport.imej || []).map((img, i) => (
                      <div key={i} className="flex flex-col items-center">
                        <img src={img} className="w-full h-72 object-cover rounded shadow-sm border border-slate-300" alt={`Dokumentasi ${i+1}`} />
                        <span className="text-[10px] mt-2 font-bold text-slate-500 italic">Gambar Aktiviti {i+1}</span>
                      </div>
                    ))}
                  </div>
                </section>
              </div>

              <div className="mt-20 grid grid-cols-2 gap-32 break-inside-avoid">
                <div className="text-center">
                  <div className="h-20"></div>
                  <div className="h-px bg-slate-900 w-full mb-2"></div>
                  <p className="text-xs font-black uppercase">Disediakan Oleh,</p>
                  <p className="text-[10px] mt-1 text-slate-500 uppercase">(Guru Penasihat / Penyelaras)</p>
                </div>
                <div className="text-center">
                  <div className="h-20"></div>
                  <div className="h-px bg-slate-900 w-full mb-2"></div>
                  <p className="text-xs font-black uppercase">Disahkan Oleh,</p>
                  <p className="text-[10px] mt-1 text-slate-500 uppercase">(Pengetua / PK Kokurikulum)</p>
                </div>
              </div>

              <div className="mt-16 pt-4 border-t border-slate-200 text-center no-print-visible">
                <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest">Laporan ini dijana melalui Sistem Laporan Kokurikulum Digital SMAMI pada {new Date().toLocaleDateString('ms-MY')} jam {new Date().toLocaleTimeString('ms-MY')}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Page Footer */}
      <footer className="mt-10 py-6 text-center no-print">
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">© 2024 SMA AL-MAHADUL ISLAMI - SISTEM LAPORAN DIGITAL</p>
      </footer>
    </div>
  );
}
