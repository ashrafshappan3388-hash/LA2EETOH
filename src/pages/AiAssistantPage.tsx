import React, { useState } from 'react';
import {
  AlertTriangle,
  Bot,
  FilePlus2,
  HelpCircle,
  Loader2,
  MapPin,
  Search,
  Send,
  ShieldCheck,
} from 'lucide-react';
import { useApp, type ReportDraftPrefill } from '../context/AppContext';
import { t } from '../lib/i18n';

interface ChatMessage {
  role: 'user' | 'assistant';
  text: string;
  suggestedAction?: string;
  searchKeywords?: string;
  draftReport?: ReportDraftPrefill;
}

export const AiAssistantPage: React.FC = () => {
  const { lang, navigate, setAiDraft } = useApp();
  const copy = t(lang);
  const isAr = lang === 'ar';

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      text: isAr
        ? 'أهلاً بك في مساعد لقيته الذكي. صف لي الغرض المفقود أو المعثور عليه، أو اسأل عن خطوات الاستعادة الآمنة في مصر.'
        : 'Welcome to the LA2EETOH Bilingual Assistant. Describe a lost or found item to draft a report, search matches, or review safe handover steps.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [configError, setConfigError] = useState<string | null>(null);

  const quickPrompts = isAr
    ? [
        'فقدت محفظة كحلي في الزمالك بالأمس، ساعدني في كتابة بلاغ',
        'عثرت على مفاتيح سيارة أمام محطة مترو الدقي',
        'ماذا أفعل عند فقدان بطاقة الرقم القومي والبطاقة البنكية؟',
      ]
    : [
        'I lost a black Samsonite backpack in Nasr City Cairo, help me draft a report',
        'I found a car key fob near Dokki Metro station',
        'What should I do immediately if I lost my Egyptian National ID and bank card?',
      ];

  const sendMessage = async (textToSend: string) => {
    const clean = textToSend.trim();
    if (!clean || loading) return;

    const nextHistory = [...messages, { role: 'user' as const, text: clean }];
    setMessages(nextHistory);
    setInput('');
    setLoading(true);
    setConfigError(null);

    try {
      const res = await fetch('/api/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: clean,
          lang,
          history: nextHistory.slice(-6).map((m) => ({ role: m.role, text: m.text })),
        }),
      });

      const data = (await res.json()) as {
        error?: string;
        message?: string;
        reply?: string;
        suggestedAction?: string;
        searchKeywords?: string;
        draftReport?: ReportDraftPrefill;
      };

      if (res.status === 503 && data.error === 'GEMINI_NOT_CONFIGURED') {
        setConfigError(
          isAr
            ? 'خدمة المساعد الذكي تتطلب ضبط متغير GEMINI_API_KEY على الخادم (Settings > Secrets). يمكنك استخدام معالج البلاغات والبحث والخريطة بشكل مباشر.'
            : 'Gemini AI Assistant requires GEMINI_API_KEY configured on the server (Settings > Secrets). Direct report creation, search, and maps remain fully functional.'
        );
        return;
      }

      if (!res.ok) {
        setConfigError(data.message || 'Assistant request failed.');
        return;
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply || (isAr ? 'كيف يمكنني مساعدتك أيضاً؟' : 'How else can I assist you?'),
          suggestedAction: data.suggestedAction,
          searchKeywords: data.searchKeywords,
          draftReport: data.draftReport,
        },
      ]);
    } catch {
      setConfigError(isAr ? 'تعذر الاتصال بخدمة المساعد حالياً.' : 'Unable to reach AI assistant service.');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptDraft = (draft: ReportDraftPrefill) => {
    setAiDraft(draft);
    navigate(draft.type === 'found' ? '/report-found' : '/report-lost');
  };

  return (
    <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-r from-[#080F24] via-[#13224F] to-[#4C1D95] rounded-2xl p-6 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-white/[0.10] shadow-xl">
        <div className="la-egypt-lattice absolute inset-0 pointer-events-none" aria-hidden="true" />
        <div className="relative flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur-sm border border-white/15 flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight">
              {isAr ? 'مساعد لقيته الذكي' : 'LA2EETOH AI Assistant'}
            </h1>
            <p className="text-xs text-slate-200">
              {isAr
                ? 'صياغة البلاغات بالعربية والإنجليزية، اقتراح البحث، وإرشادات التحقق الآمن'
                : 'Bilingual report drafting, search guidance, and safe ownership verification checklists'}
            </p>
          </div>
        </div>
        <div className="relative flex items-center gap-1.5 text-xs text-amber-200 font-medium">
          <ShieldCheck className="w-4 h-4" />
          <span>{isAr ? 'يعمل بأمان على الخادم' : 'Server-Side Protected'}</span>
        </div>
        <div className="la-gold-hairline absolute bottom-0 inset-x-0 h-[1px]" aria-hidden="true" />
      </div>

      {configError && (
        <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-sm text-amber-900 dark:text-amber-200 flex items-start gap-2.5 shadow-md">
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{configError}</span>
        </div>
      )}

      {/* Conversation Container */}
      <div className="la-card !shadow-xl overflow-hidden flex flex-col min-h-[460px]">
        <div className="px-5 py-2.5 bg-slate-50/90 dark:bg-[#080F24]/80 border-b border-slate-200/80 dark:border-white/[0.08] text-xs text-slate-600 dark:text-slate-400">
          {copy.common.aiDisclaimer}
        </div>
        <div className="flex-1 p-5 sm:p-6 space-y-4 overflow-y-auto la-scroll max-h-[520px]">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm space-y-3 shadow-sm ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-violet-600 text-white shadow-blue-600/20'
                    : 'bg-slate-100/90 dark:bg-slate-800/85 text-slate-900 dark:text-slate-100'
                }`}
              >
                <p className="whitespace-pre-line leading-relaxed">{m.text}</p>

                {/* Structured Draft Report Action */}
                {m.draftReport && m.draftReport.title && (
                  <div className="rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 p-3 text-xs text-slate-800 dark:text-slate-200 space-y-2">
                    <div className="font-bold text-blue-700 dark:text-blue-300">
                      {isAr ? 'مسودة بلاغ جاهزة للمراجعة' : 'Structured Report Draft Ready'}
                    </div>
                    <div>
                      <strong>{isAr ? 'العنوان:' : 'Title:'}</strong> {m.draftReport.title}
                    </div>
                    {m.draftReport.description && (
                      <div className="line-clamp-2 text-slate-600 dark:text-slate-400">
                        {m.draftReport.description}
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleAcceptDraft(m.draftReport!)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold"
                    >
                      <FilePlus2 className="w-3.5 h-3.5" />
                      <span>{isAr ? 'مراجعة المسودة والنشر' : 'Review & Edit Draft'}</span>
                    </button>
                  </div>
                )}

                {/* Contextual Action Links */}
                {m.role === 'assistant' && m.suggestedAction && m.suggestedAction !== 'none' && (
                  <div className="flex flex-wrap gap-2">
                    {m.suggestedAction === 'search' && (
                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            m.searchKeywords
                              ? `/search?q=${encodeURIComponent(m.searchKeywords)}`
                              : '/search'
                          )
                        }
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>{isAr ? 'ابحث في البلاغات' : 'Search Listings'}</span>
                      </button>
                    )}
                    {m.suggestedAction === 'open_map' && (
                      <button
                        type="button"
                        onClick={() => navigate('/map')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{isAr ? 'فتح الخريطة' : 'Open Map'}</span>
                      </button>
                    )}
                    {m.suggestedAction === 'open_help' && (
                      <button
                        type="button"
                        onClick={() => navigate('/support')}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-semibold"
                      >
                        <HelpCircle className="w-3.5 h-3.5" />
                        <span>{isAr ? 'مركز المساعدة' : 'Help Center'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{isAr ? 'جاري التحليل...' : 'Thinking...'}</span>
            </div>
          )}
        </div>

        {/* Quick Prompt Suggestions */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-white/[0.06] flex flex-wrap gap-2 bg-slate-50/70 dark:bg-[#080F24]/70">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => sendMessage(p)}
              className="text-start px-3 py-1.5 rounded-xl border border-slate-200 dark:border-white/[0.10] bg-white dark:bg-[#0D1529] text-xs text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:shadow-sm transition-all duration-200"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
          className="p-3.5 border-t border-slate-200/85 dark:border-white/[0.08] flex items-center gap-2.5"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              isAr ? 'اكتب وصف الغرض المفقود أو سؤالك هنا...' : 'Describe your lost/found item or ask a question...'
            }
            className="la-input flex-1"
          />
          <button
            type="submit"
            disabled={loading || input.trim().length < 2}
            className="la-btn-primary"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">{isAr ? 'إرسال' : 'Send'}</span>
          </button>
        </form>
      </div>
    </div>
  );
};
