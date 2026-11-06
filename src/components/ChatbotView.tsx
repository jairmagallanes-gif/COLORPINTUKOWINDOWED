import React, { useState } from 'react';
import { Bot, Send, User, Sparkles, MessageCircle, X, Minus } from 'lucide-react';

type ChatMessage = { role: 'user' | 'assistant'; text: string };

const SUGGESTED_QUESTIONS = [
  '¿Qué pintura recomiendas para una fachada?',
  '¿Cómo preparo una pared con humedad?',
  '¿Cuántos galones necesito para 50 m²?',
  '¿Cómo consulto el estado de mi proyecto?'
];

export const ChatbotView: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: '¡Hola! Soy el asistente COLORLINK. Puedo orientarte sobre pinturas Pintuco, preparación de superficies, cotizaciones y seguimiento de proyectos.' }
  ]);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);

  const sendQuestion = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || loading) return;
    setQuestion('');
    setMessages(current => [...current, { role: 'user', text }]);
    setLoading(true);
    try {
      let lastError: unknown;
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await fetch('/api/ai/chat', {
            method: 'POST',
            signal: AbortSignal.timeout(30000),
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: text })
          });
          const payload = await response.json();
          if (response.ok && payload?.reply) {
            setMessages(current => [...current, { role: 'assistant', text: payload.reply }]);
            return;
          }
          throw new Error(payload?.error || 'No se recibió respuesta.');
        } catch (error) {
          lastError = error;
          if (attempt === 0) await new Promise(resolve => setTimeout(resolve, 700));
        }
      }
      throw lastError;
    } catch (error) {
      const detail = error instanceof Error && error.name === 'TimeoutError'
        ? 'La respuesta está tardando más de lo esperado. Vuelve a intentarlo.'
        : 'No pude conectar con el servicio en este momento. Intenta de nuevo.';
      setMessages(current => [...current, { role: 'assistant', text: detail }]);
    } finally { setLoading(false); }
  };

  const send = (event: React.FormEvent) => {
    event.preventDefault();
    void sendQuestion(question);
  };

  return (
    <div className="fixed bottom-5 right-5 z-[60] flex flex-col items-end gap-3">
      {isOpen && (
        <section className="w-[min(92vw,390px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl" aria-label="Chatbot COLORLINK">
          <header className="flex items-center gap-3 bg-[#1E216B] p-4 text-white">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10"><Bot className="h-5 w-5 text-[#F7C548]" /></span>
            <div className="min-w-0 flex-1"><h2 className="text-sm font-black">Asistente COLORLINK</h2><p className="mt-0.5 text-[11px] text-blue-100">Productos, proyectos y servicios Pintuco</p></div>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-blue-100 hover:bg-white/10 hover:text-white" aria-label="Minimizar chat"><Minus className="h-4 w-4" /></button>
            <button type="button" onClick={() => setIsOpen(false)} className="rounded-lg p-2 text-blue-100 hover:bg-white/10 hover:text-white" aria-label="Cerrar chat"><X className="h-4 w-4" /></button>
          </header>

          <div className="flex h-[min(55vh,430px)] flex-col">
            <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50 p-3" aria-live="polite">
              {messages.map((message, index) => (
                <div key={index} className={`flex gap-2 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  {message.role === 'assistant' && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-800"><Sparkles className="h-3.5 w-3.5" /></span>}
                  <p className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2.5 text-xs leading-relaxed ${message.role === 'user' ? 'rounded-br-sm bg-[#2E3192] text-white' : 'rounded-bl-sm border border-slate-200 bg-white text-slate-800'}`}>{message.text}</p>
                  {message.role === 'user' && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-700"><User className="h-3.5 w-3.5" /></span>}
                </div>
              ))}
              {messages.length === 1 && (
                <div className="space-y-2 pl-9 pt-1">
                  <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Preguntas sugeridas</p>
                  {SUGGESTED_QUESTIONS.map(item => <button key={item} type="button" disabled={loading} onClick={() => void sendQuestion(item)} className="block w-full rounded-xl border border-blue-100 bg-white px-3 py-2 text-left text-[11px] font-semibold text-blue-900 transition hover:border-blue-300 hover:bg-blue-50 disabled:opacity-50">{item}</button>)}
                </div>
              )}
              {loading && <p className="pl-9 text-[11px] text-slate-500">Preparando respuesta…</p>}
            </div>
            <form onSubmit={send} className="flex gap-2 border-t border-slate-200 bg-white p-3">
              <input value={question} onChange={event => setQuestion(event.target.value)} placeholder="Escribe tu pregunta…" className="min-w-0 flex-1 rounded-xl border border-slate-300 px-3 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500" aria-label="Pregunta al chatbot" />
              <button disabled={loading || !question.trim()} className="flex items-center justify-center rounded-xl bg-[#FF6B35] px-3 text-white disabled:opacity-50" aria-label="Enviar pregunta"><Send className="h-4 w-4" /></button>
            </form>
          </div>
        </section>
      )}
      <button type="button" onClick={() => setIsOpen(open => !open)} className="flex h-14 items-center gap-2 rounded-full bg-[#2E3192] px-5 text-sm font-extrabold text-white shadow-xl ring-4 ring-white transition hover:bg-[#242775]" aria-label={isOpen ? 'Ocultar chatbot' : 'Abrir chatbot'}>
        {isOpen ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        <span>{isOpen ? 'Cerrar chat' : '¿Te ayudamos?'}</span>
        {!isOpen && <span className="-ml-1 flex h-6 w-6 items-center justify-center rounded-full bg-[#F7C548] text-[#1E216B]"><Bot className="h-4 w-4" /></span>}
      </button>
    </div>
  );
};
