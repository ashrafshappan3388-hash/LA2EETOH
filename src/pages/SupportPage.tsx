import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, HelpCircle, Lock, MessageSquare, Search, Send } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { HELP_ARTICLES } from '../data/seedData';
import type { SupportInternalNote, SupportMessage, SupportTicket } from '../types';
import { validateSupportTicketPayload } from '../utils/validation';

export const SupportPage: React.FC<{ ticketId?: string }> = ({ ticketId }) => {
  const {
    lang,
    user,
    isAdmin,
    supportTickets,
    createSupportTicket,
    sendSupportReply,
    updateTicketStatus,
    addInternalNote,
    loadTicketThread,
    navigate,
    signInWithGoogle,
  } = useApp();
  const isAr = lang === 'ar';

  const [faqQuery, setFaqQuery] = useState('');
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<SupportTicket['category']>('recovery');
  const [priority, setPriority] = useState<SupportTicket['priority']>('medium');
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Thread state
  const [threadMessages, setThreadMessages] = useState<SupportMessage[]>([]);
  const [internalNotes, setInternalNotes] = useState<SupportInternalNote[]>([]);
  const [replyText, setReplyText] = useState('');
  const [noteText, setNoteText] = useState('');

  const activeTicket = ticketId ? supportTickets.find((tkt) => tkt.id === ticketId) : undefined;

  useEffect(() => {
    if (!ticketId || !user) return;
    loadTicketThread(ticketId)
      .then((res) => {
        setThreadMessages(res.messages);
        setInternalNotes(res.notes);
      })
      .catch(() => {});
  }, [ticketId, user, loadTicketThread]);

  const filteredFaq = useMemo(() => {
    const q = faqQuery.trim().toLowerCase();
    if (!q) return HELP_ARTICLES;
    return HELP_ARTICLES.filter((a) =>
      `${a.titleEn} ${a.titleAr} ${a.bodyEn} ${a.bodyAr}`.toLowerCase().includes(q)
    );
  }, [faqQuery]);

  // Ticket Details View (/support/:id)
  if (ticketId) {
    return (
      <div className="max-w-[960px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-6">
        <button
          type="button"
          onClick={() => navigate('/support')}
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          <span>{isAr ? 'العودة إلى مركز المساعدة' : 'Back to Help & Support'}</span>
        </button>

        {!activeTicket ? (
          <div className="la-card p-8 text-center text-sm text-slate-500">
            {isAr ? 'التذكرة غير موجودة أو تتطلب صلاحية الوصول.' : 'Ticket not found or access restricted.'}
          </div>
        ) : (
          <div className="space-y-5">
            <div className="la-card p-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">{activeTicket.subject}</h1>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                    {activeTicket.status}
                  </span>
                  {isAdmin && (
                    <select
                      value={activeTicket.status}
                      onChange={(e) =>
                        updateTicketStatus(activeTicket.id, e.target.value as SupportTicket['status'])
                      }
                      className="la-input !w-auto !py-1 !px-2.5 !text-xs"
                    >
                      <option value="open">Open</option>
                      <option value="in_progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  )}
                </div>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-line">
                {activeTicket.initialMessage}
              </p>
            </div>

            {/* Public Thread Messages */}
            <div className="la-card p-5 sm:p-6 space-y-4">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                {isAr ? 'سجل المحادثة' : 'Ticket Conversation'}
              </h2>
              {threadMessages.length === 0 ? (
                <p className="text-xs text-slate-500">{isAr ? 'لا توجد ردود بعد.' : 'No replies yet.'}</p>
              ) : (
                <div className="space-y-3">
                  {threadMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`rounded-xl p-3.5 text-sm ${
                        msg.authorRole === 'user'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100'
                          : 'bg-blue-50 dark:bg-blue-950/50 text-blue-900 dark:text-blue-100'
                      }`}
                    >
                      <div className="text-[11px] font-bold uppercase mb-1 opacity-70">{msg.authorRole}</div>
                      <p>{msg.body}</p>
                    </div>
                  ))}
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!replyText.trim()) return;
                  await sendSupportReply(activeTicket.id, replyText);
                  setReplyText('');
                  const refreshed = await loadTicketThread(activeTicket.id);
                  setThreadMessages(refreshed.messages);
                }}
                className="flex gap-2.5 pt-3 border-t border-slate-100 dark:border-white/[0.08]"
              >
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder={isAr ? 'اكتب ردك هنا...' : 'Write a reply...'}
                  className="la-input flex-1"
                />
                <button
                  type="submit"
                  className="la-btn-primary !py-2 !text-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isAr ? 'إرسال' : 'Reply'}</span>
                </button>
              </form>
            </div>

            {/* Admin-Only Isolated Internal Staff Notes */}
            {isAdmin && (
              <div className="bg-amber-50/70 dark:bg-amber-950/20 rounded-2xl border border-amber-200 dark:border-amber-800 p-5 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-300">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isAr ? 'ملاحظات داخلية لفريق الدعم (لا يراها المستخدم)' : 'Staff Internal Notes (Isolated from User)'}</span>
                </div>
                {internalNotes.map((n) => (
                  <div key={n.id} className="text-xs bg-white dark:bg-slate-900 rounded-lg p-2.5 border border-amber-200 dark:border-amber-800">
                    {n.note}
                  </div>
                ))}
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (!noteText.trim()) return;
                    await addInternalNote(activeTicket.id, noteText);
                    setNoteText('');
                    const refreshed = await loadTicketThread(activeTicket.id);
                    setInternalNotes(refreshed.notes);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add internal staff note..."
                    className="flex-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-950 px-3 py-2 text-xs"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-amber-600 text-white text-xs font-semibold"
                  >
                    Save Note
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Main Help Center + Support Ticket Portal (/support)
  return (
    <div className="la-page-shell">
      <div className="space-y-1.5">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
          <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          <span>{isAr ? 'مركز المساعدة وتذاكر الدعم' : 'Help Center & Support Portal'}</span>
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          {isAr
            ? 'ابحث في إرشادات الأمان والخصوصية أو افتح تذكرة دعم لمتابعتها مباشرة.'
            : 'Search safety and privacy guides or open a support ticket with our team.'}
        </p>
      </div>

      {feedback && (
        <div className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/50 px-4 py-3 text-sm text-blue-900 dark:text-blue-200 shadow-md">
          {feedback}
        </div>
      )}

      {/* Searchable FAQ */}
      <div className="space-y-4">
        <div className="relative max-w-lg">
          <Search className="w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 start-3.5" />
          <input
            type="text"
            value={faqQuery}
            onChange={(e) => setFaqQuery(e.target.value)}
            placeholder={isAr ? 'ابحث في الأسئلة الشائعة...' : 'Search help articles...'}
            className="la-input !ps-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredFaq.map((art) => (
            <article
              key={art.id}
              className="la-card-interactive p-5 sm:p-6 space-y-2"
            >
              <h2 className="font-bold text-base text-slate-900 dark:text-white">
                {isAr ? art.titleAr : art.titleEn}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {isAr ? art.bodyAr : art.bodyEn}
              </p>
            </article>
          ))}
        </div>
      </div>

      {/* Support Tickets Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6 la-card p-6 space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>{isAr ? 'فتح تذكرة دعم جديدة' : 'Submit a Support Ticket'}</span>
          </h2>

          {!user ? (
            <div className="space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {isAr ? 'سجّل الدخول لفتح تذكرة دعم ومتابعة الردود.' : 'Sign in to create and track support tickets.'}
              </p>
              <button
                type="button"
                onClick={() => signInWithGoogle()}
                className="la-btn-primary"
              >
                {isAr ? 'تسجيل الدخول بجوجل' : 'Sign in with Google'}
              </button>
            </div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const check = validateSupportTicketPayload(subject, message);
                if (!check.valid) {
                  setFeedback(check.errors.join(' '));
                  return;
                }
                try {
                  const id = await createSupportTicket({
                    subject,
                    category,
                    priority,
                    initialMessage: message,
                  });
                  setSubject('');
                  setMessage('');
                  setFeedback(isAr ? 'تم فتح تذكرة الدعم بنجاح.' : 'Support ticket created.');
                  navigate(`/support/${id}`);
                } catch (err) {
                  setFeedback(err instanceof Error ? err.message : 'Unable to create ticket.');
                }
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'الموضوع *' : 'Subject *'}
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="la-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'التصنيف' : 'Category'}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SupportTicket['category'])}
                    className="la-input"
                  >
                    <option value="recovery">{isAr ? 'استعادة غرض' : 'Recovery'}</option>
                    <option value="account">{isAr ? 'الحساب' : 'Account'}</option>
                    <option value="abuse_report">{isAr ? 'إبلاغ عن إساءة' : 'Abuse Report'}</option>
                    <option value="organization">{isAr ? 'مؤسسة' : 'Organization'}</option>
                    <option value="privacy">{isAr ? 'الخصوصية' : 'Privacy'}</option>
                    <option value="technical">{isAr ? 'مشكلة تقنية' : 'Technical'}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isAr ? 'الأولوية' : 'Priority'}
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as SupportTicket['priority'])}
                    className="la-input"
                  >
                    <option value="low">{isAr ? 'منخفضة' : 'Low'}</option>
                    <option value="medium">{isAr ? 'متوسطة' : 'Medium'}</option>
                    <option value="high">{isAr ? 'عالية' : 'High'}</option>
                    <option value="urgent">{isAr ? 'عاجلة' : 'Urgent'}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isAr ? 'تفاصيل المشكلة *' : 'Message *'}
                </label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="la-input"
                />
              </div>

              <button
                type="submit"
                className="la-btn-primary"
              >
                {isAr ? 'إرسال التذكرة' : 'Submit Ticket'}
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-6 la-card p-6 space-y-4">
          <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">
            {isAr ? 'تذاكري' : 'My Support Tickets'}
          </h2>
          {!user || supportTickets.length === 0 ? (
            <p className="text-sm text-slate-500">
              {isAr ? 'لا توجد تذاكر دعم مفتوحة حالياً.' : 'No support tickets submitted yet.'}
            </p>
          ) : (
            <div className="space-y-3">
              {supportTickets.map((tkt) => (
                <button
                  key={tkt.id}
                  type="button"
                  onClick={() => navigate(`/support/${tkt.id}`)}
                  className="w-full text-start p-4 rounded-xl border border-slate-200/80 dark:border-white/[0.08] hover:border-blue-500/50 hover:shadow-md transition-all duration-200 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="font-bold text-sm text-slate-900 dark:text-white truncate">{tkt.subject}</div>
                    <div className="text-xs text-slate-500">
                      {tkt.category} · {tkt.priority}
                    </div>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                    {tkt.status}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
