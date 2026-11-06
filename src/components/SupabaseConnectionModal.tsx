import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  ExternalLink, 
  X, 
  ShieldCheck, 
  Server, 
  Building2, 
  Users, 
  FolderKanban, 
  Package,
  Layers,
  Sparkles,
  Copy,
  Check,
  PlusCircle,
  FileCheck2,
  Receipt,
  FileText
} from 'lucide-react';
import { 
  testSupabaseConnection, 
  ConnectionTestResult, 
  getActiveSupabaseUrl, 
  getActiveSupabaseAnonKey,
  reconnectSupabase,
  testSaveSampleProjectToSupabase,
  getSupabaseRecentProjects
} from '../lib/supabase';

interface SupabaseConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SupabaseConnectionModal: React.FC<SupabaseConnectionModalProps> = ({
  isOpen,
  onClose
}) => {
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<ConnectionTestResult | null>(null);
  const [showConfigForm, setShowConfigForm] = useState(false);
  const [customUrl, setCustomUrl] = useState('');
  const [customKey, setCustomKey] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  
  // Real-time table insert test state
  const [savingTestProject, setSavingTestProject] = useState(false);
  const [saveTestResult, setSaveTestResult] = useState<any | null>(null);
  const [recentProjects, setRecentProjects] = useState<any[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);

  const activeUrl = getActiveSupabaseUrl();
  const activeKey = getActiveSupabaseAnonKey();

  const loadRecentProjects = async () => {
    setLoadingProjects(true);
    try {
      const list = await getSupabaseRecentProjects(4);
      setRecentProjects(list);
    } catch (e) {
      console.warn('Could not load recent projects:', e);
    } finally {
      setLoadingProjects(false);
    }
  };

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const result = await testSupabaseConnection();
      setTestResult(result);
      await loadRecentProjects();
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err?.message || 'Error desconocido al probar la conexión',
        url: activeUrl,
        timestamp: new Date().toISOString()
      });
    } finally {
      setTesting(false);
    }
  };

  const handleRunSaveTest = async () => {
    setSavingTestProject(true);
    setSaveTestResult(null);
    try {
      const res = await testSaveSampleProjectToSupabase();
      setSaveTestResult(res);
      if (res.success) {
        // Refresh connection test stats & project list
        await runTest();
      }
    } catch (err: any) {
      setSaveTestResult({
        success: false,
        message: err?.message || 'Error al ejecutar la prueba de guardado'
      });
    } finally {
      setSavingTestProject(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setCustomUrl(activeUrl);
      setCustomKey(activeKey);
      runTest();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customUrl.trim() || !customKey.trim()) return;

    const res = reconnectSupabase(customUrl.trim(), customKey.trim());
    if (res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
      setShowConfigForm(false);
      runTest();
    }
  };

  const handleResetDefault = () => {
    try {
      localStorage.removeItem('colorlink_custom_supabase_url');
      localStorage.removeItem('colorlink_custom_supabase_key');
    } catch {}
    reconnectSupabase();
    setCustomUrl(getActiveSupabaseUrl());
    setCustomKey(getActiveSupabaseAnonKey());
    runTest();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="bg-[#1E216B] text-white px-5 sm:px-6 py-4 flex items-center justify-between border-b border-blue-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold tracking-tight">
                  Conexión Supabase PostgreSQL
                </h3>
                <span className="text-[10px] bg-emerald-400/20 text-emerald-300 font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-400/30">
                  COLORLINK DB
                </span>
              </div>
              <p className="text-xs text-blue-200">
                Instancia oficial PostgreSQL en Supabase conectada
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-blue-200 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 text-slate-700">
          
          {/* Main Status Banner */}
          <div className={`p-4 rounded-xl border flex items-start gap-3.5 transition-all ${
            testResult?.success 
              ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950' 
              : testResult && !testResult.success
              ? 'bg-rose-50/80 border-rose-300 text-rose-950'
              : 'bg-blue-50/80 border-blue-200 text-blue-950'
          }`}>
            {testing ? (
              <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0 mt-0.5" />
            ) : testResult?.success ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}

            <div className="flex-1 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm">
                  {testing 
                    ? 'Probando conexión con Supabase...' 
                    : testResult?.success 
                    ? '¡Conexión Activa y Operacional!' 
                    : 'Estado de Conexión'}
                </span>
                {testResult?.latencyMs && (
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-white/80 rounded-md border shadow-2xs">
                    {testResult.latencyMs} ms
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs leading-relaxed opacity-90">
                {testing 
                  ? 'Verificando comunicación con las tablas de Supabase...'
                  : testResult?.message || 'Presiona el botón para verificar la comunicación con tu base de datos.'}
              </p>
            </div>
          </div>

          {/* Diagnostic Breakdown if available */}
          {testResult?.details && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs border-b border-slate-200 pb-2">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#2E3192]" />
                  Diagnóstico de Tablas en Supabase
                </span>
                <span className="text-[11px] text-emerald-700 bg-emerald-100 font-bold px-2 py-0.5 rounded">
                  {testResult.details.tablesVerified?.length || 0} tablas conectadas
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-1">
                    <Building2 className="w-3.5 h-3.5 text-blue-600" />
                    <span>pintuco_cedis</span>
                  </div>
                  <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded self-start">
                    {testResult.details.cedisCount ?? 0} CEDIs
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-1">
                    <Users className="w-3.5 h-3.5 text-purple-600" />
                    <span>perfiles</span>
                  </div>
                  <span className="text-xs font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded self-start">
                    {testResult.details.profilesCount ?? 0} usuarios
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-1">
                    <Package className="w-3.5 h-3.5 text-amber-600" />
                    <span>pintuco_productos</span>
                  </div>
                  <span className="text-xs font-black text-amber-600 bg-amber-50 px-2 py-0.5 rounded self-start">
                    {testResult.details.productsCount ?? 0} catálogo
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-1">
                    <FolderKanban className="w-3.5 h-3.5 text-cyan-600" />
                    <span>proyectos</span>
                  </div>
                  <span className="text-xs font-black text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded self-start">
                    {testResult.details.projectsCount ?? 0} registrados
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-1">
                    <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                    <span>clientes</span>
                  </div>
                  <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded self-start">
                    {testResult.details.clientsCount ?? 0} clientes
                  </span>
                </div>

                <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold mb-1">
                    <Receipt className="w-3.5 h-3.5 text-teal-600" />
                    <span>cotizaciones</span>
                  </div>
                  <span className="text-xs font-black text-teal-600 bg-teal-50 px-2 py-0.5 rounded self-start">
                    {testResult.details.quotesCount ?? 0} cotizaciones
                  </span>
                </div>
              </div>

              {testResult.details.adminRegistered && (
                <div className="flex items-center gap-2 text-[11px] text-emerald-800 bg-emerald-50/90 border border-emerald-200 p-2 rounded-lg font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    Administrador <strong>JAIR MAGALLANES</strong> activo en tabla <code>perfiles</code> (jairmagallanes@gmail.com).
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Interactive Table Save Test (Explicit User Goal) */}
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <PlusCircle className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">
                    Prueba de Guardado en Tablas de Supabase
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    Inserta un registro completo en 5 tablas (clientes, sedes, proyectos, diagnósticos, cotizaciones)
                  </p>
                </div>
              </div>

              <button
                onClick={handleRunSaveTest}
                disabled={savingTestProject || testing}
                id="btn-probar-guardado-supabase"
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shrink-0"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${savingTestProject ? 'animate-spin' : ''}`} />
                <span>{savingTestProject ? 'Guardando...' : 'Ejecutar Guardado de Prueba'}</span>
              </button>
            </div>

            {saveTestResult && (
              <div className={`p-3 rounded-lg text-xs border ${
                saveTestResult.success 
                  ? 'bg-white border-emerald-300 text-emerald-900' 
                  : 'bg-rose-50 border-rose-300 text-rose-900'
              }`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {saveTestResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                  <span>{saveTestResult.message}</span>
                </div>

                {saveTestResult.details && (
                  <div className="grid grid-cols-2 gap-2 mt-2 font-mono text-[10px] bg-slate-50 p-2 rounded border border-slate-200 text-slate-700">
                    <div>
                      <span className="font-bold text-slate-900">Código Proyecto:</span> {saveTestResult.projectCode}
                    </div>
                    <div>
                      <span className="font-bold text-slate-900">Monto COP:</span> ${saveTestResult.details.montoCOP?.toLocaleString('es-CO')}
                    </div>
                    <div className="truncate" title={saveTestResult.details.clienteId}>
                      <span className="font-bold text-slate-900">ID Cliente:</span> {saveTestResult.details.clienteId?.slice(0, 8)}...
                    </div>
                    <div className="truncate" title={saveTestResult.details.proyectoId}>
                      <span className="font-bold text-slate-900">ID Proyecto:</span> {saveTestResult.details.proyectoId?.slice(0, 8)}...
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Real-time Records from Supabase */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                Registros Guardados en Supabase (En Vivo)
              </span>
              <button
                onClick={loadRecentProjects}
                disabled={loadingProjects}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer font-medium"
              >
                <RefreshCw className={`w-3 h-3 ${loadingProjects ? 'animate-spin' : ''}`} />
                <span>Actualizar Lista</span>
              </button>
            </div>

            {loadingProjects ? (
              <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Consultando tabla <code>proyectos</code> en Supabase...
              </div>
            ) : recentProjects.length === 0 ? (
              <div className="p-3 bg-slate-50 border border-dashed border-slate-200 rounded-lg text-center text-xs text-slate-500">
                No hay proyectos guardados en la tabla todavía. Haz clic en <strong>"Ejecutar Guardado de Prueba"</strong> arriba o formula un proyecto en la Captura Inteligente para registrar el primero.
              </div>
            ) : (
              <div className="space-y-2">
                {recentProjects.map((p: any) => (
                  <div key={p.id} className="p-2.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 rounded-lg flex items-center justify-between text-xs transition-colors">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-[#1E216B]">{p.codigo}</span>
                        <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded uppercase font-semibold">
                          {p.estado}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {p.clientes?.nombre_empresa || 'Cliente ColorLink'} • {p.area_m2} m²
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="font-bold text-slate-900 block">
                        ${Number(p.monto_total || 0).toLocaleString('es-CO')}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(p.fecha_creacion).toLocaleDateString('es-CO')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Current Configuration Summary */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5 text-slate-500" />
                URL del Proyecto Conectado
              </span>
              <button
                onClick={() => copyToClipboard(activeUrl)}
                className="text-[11px] text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer font-medium"
              >
                {copiedUrl ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                {copiedUrl ? 'Copiada' : 'Copiar URL'}
              </button>
            </div>
            <div className="font-mono text-xs bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-slate-800 break-all select-all flex items-center justify-between gap-2">
              <span>{activeUrl}</span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-sans shrink-0">
                REST /rest/v1 normalizado
              </span>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-1 text-[11px] text-slate-500 gap-1">
              <span>Clave Publishable: <code className="bg-slate-200/80 px-1 rounded font-mono text-[10px]">{activeKey ? `${activeKey.slice(0, 18)}...` : 'No detectada'}</code></span>
              <a 
                href={activeUrl ? `${activeUrl.replace('.supabase.co', '')}.supabase.com` : 'https://supabase.com/dashboard'}
                target="_blank"
                rel="noreferrer"
                className="text-[#2E3192] hover:underline font-bold inline-flex items-center gap-1"
              >
                Abrir Consola Supabase <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-1">
            <button
              onClick={runTest}
              disabled={testing}
              id="btn-probar-supabase"
              className="flex-1 py-2.5 px-4 bg-[#2E3192] hover:bg-[#1E216B] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-blue-900/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${testing ? 'animate-spin' : ''}`} />
              <span>{testing ? 'Comprobando...' : 'Volver a Probar Conexión'}</span>
            </button>

            <button
              onClick={() => setShowConfigForm(!showConfigForm)}
              className="py-2.5 px-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer"
            >
              {showConfigForm ? 'Ocultar Ajustes' : 'Modificar Credenciales'}
            </button>
          </div>

          {/* Custom Credentials Form */}
          {showConfigForm && (
            <form onSubmit={handleSaveCustom} className="p-4 bg-blue-50/60 border border-blue-200 rounded-xl space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#1E216B]">
                  Personalizar Conexión de Supabase
                </span>
                <button
                  type="button"
                  onClick={handleResetDefault}
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                >
                  Restablecer por defecto
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Project URL o REST endpoint (Ejemplo: https://jgckmiencopjyrdvkfms.supabase.co o con /rest/v1/)
                </label>
                <input
                  type="url"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://jgckmiencopjyrdvkfms.supabase.co"
                  className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E3192] focus:border-transparent outline-hidden"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  API Key (Publishable key: sb_publishable_... o JWT Anon key)
                </label>
                <textarea
                  value={customKey}
                  onChange={(e) => setCustomKey(e.target.value)}
                  placeholder="sb_publishable_..."
                  rows={2}
                  className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#2E3192] focus:border-transparent outline-hidden"
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[11px] text-slate-500">
                  Las credenciales se guardan en tu navegador y en el cliente activo.
                </span>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  Guardar y Reconectar
                </button>
              </div>
            </form>
          )}

          {savedSuccess && (
            <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>¡Nuevas credenciales guardadas y cliente de Supabase reconectado con éxito!</span>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-5 sm:px-6 py-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1.5 font-medium">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            PostgreSQL v2.7 • Sincronización bidireccional activa
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

