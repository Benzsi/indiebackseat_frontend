import { useState } from 'react';
import { Mail, Send, CheckCircle2, ArrowLeft, MessageSquare, Tag, User as UserIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Contact() {
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Szimulált küldés
    setTimeout(() => {
      setLoading(false);
      setIsSubmitted(true);
      setEmail('');
      setSubject('');
      setMessage('');
    }, 1500);
  };

  return (
    <div className="page-container flex flex-col items-center justify-center py-12 min-h-[90vh]">
      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#87BAC3]/5 rounded-full blur-3xl -mr-48 -mt-48 animate-pulse pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#53629E]/5 rounded-full blur-3xl -ml-48 -mb-48 animate-pulse pointer-events-none"></div>

      <div className="w-full max-w-2xl relative z-10 fade-in">
        <div className="mb-10 flex justify-center sm:justify-start">
          <Link to="/" className="secondary-btn-pill !px-6 !py-3">
            <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /> Vissza a kezdőlapra
          </Link>
        </div>

        <div className="glass-auth-card">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#87BAC3] via-[#D6F4ED] to-[#87BAC3]" />
          
          <div className="p-10 md:p-14">
            <div className="text-center mb-12">
              <div className="inline-flex p-5 rounded-[2rem] bg-gradient-to-br from-[#473472] to-[#53629E] border border-white/5 mb-8 shadow-xl">
                <Mail size={36} className="text-[#D6F4ED]" />
              </div>
              <h1 className="text-4xl font-black text-[#D6F4ED] tracking-tighter uppercase mb-2">
                Kapcsolat<span className="text-[#87BAC3]">felvétel</span>
              </h1>
              <p className="text-[10px] font-black text-[#87BAC3] uppercase tracking-[0.4em] opacity-60">
                Miben segíthetünk neked ma?
              </p>
            </div>

            {isSubmitted ? (
              <div className="py-12 text-center fade-in">
                <div className="inline-flex p-6 rounded-full bg-emerald-500/10 text-emerald-400 mb-8 border border-emerald-500/20 shadow-lg shadow-emerald-500/5">
                  <CheckCircle2 size={56} strokeWidth={3} />
                </div>
                <h2 className="text-3xl font-black text-[#D6F4ED] uppercase tracking-tighter mb-4">Üzenet elküldve!</h2>
                <p className="text-sm font-bold text-[#87BAC3] uppercase tracking-widest opacity-80 mb-10 max-w-sm mx-auto">
                  Köszönjük megkeresésedet. Hamarosan válaszolunk a megadott e-mail címen.
                </p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  className="px-12 py-4 rounded-xl bg-white/5 text-[#D6F4ED] font-black uppercase tracking-widest text-xs border border-white/10 hover:bg-white/10 transition-all"
                >
                  Új üzenet küldése
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-3">
                  <label className="glass-label ml-2">Email Address</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-[#87BAC3]/40 group-focus-within:text-[#D6F4ED] transition-colors" size={20} />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="pelda@email.com"
                      className="glass-input !pl-14 !py-4.5"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <label className="glass-label ml-2">Subject</label>
                  <div className="relative group">
                    <Tag className="absolute left-5 top-1/2 -translate-y-1/2 text-[#87BAC3]/40 group-focus-within:text-[#D6F4ED] transition-colors" size={20} />
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      required
                      placeholder="Miről lenne szó?"
                      className="glass-input !pl-14 !py-4.5"
                    />
                  </div>
                </div>

                <div className="space-y-3 pb-4">
                  <label className="glass-label ml-2">Message</label>
                  <div className="relative group">
                    <MessageSquare className="absolute left-5 top-6 text-[#87BAC3]/40 group-focus-within:text-[#D6F4ED] transition-colors" size={20} />
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      required
                      placeholder="Írj részletesen..."
                      rows={6}
                      className="glass-input !pl-14 !py-5 resize-none min-h-[180px]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="primary-btn-pill w-full !py-5 group"
                >
                  {loading ? (
                    <div className="w-6 h-6 border-4 border-[#473472]/30 border-t-[#473472] rounded-full animate-spin"></div>
                  ) : (
                    <>
                      Üzenet elküldése <Send size={20} className="ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-12 text-center opacity-40">
          <p className="text-[#87BAC3] text-[10px] font-black uppercase tracking-[0.4em]">
            Direct contact: backseatindie@gmail.com
          </p>
        </div>
      </div>
    </div>
  );
}




