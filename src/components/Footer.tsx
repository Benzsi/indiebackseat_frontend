import { Link } from 'react-router-dom';
import { Gamepad2, Github, Mail, Info, Shield, HelpCircle, ExternalLink } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#473472] border-t border-[#53629E]/40 mt-auto">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 md:gap-6 mb-12">
          
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-1 flex flex-col gap-4">
            <Link to="/" className="flex items-center gap-3 no-underline group">
              <div className="w-10 h-10 bg-gradient-to-br from-[#87BAC3] to-[#53629E] rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Gamepad2 size={24} color="#D6F4ED" />
              </div>
              <span className="text-2xl font-black text-[#D6F4ED] tracking-tighter uppercase">
                indie.backseat<span className="text-[#87BAC3]">.</span>
              </span>
            </Link>
            <p className="text-[#87BAC3] text-sm font-semibold leading-relaxed opacity-80">
              A tökéletes platform backend kedvelőinek és játékfejlesztőknek. Kezeld projektjeid, oszd meg haladásod és fedezz fel új világokat.
            </p>
            <div className="flex flex-wrap gap-3 mt-2">
              <a href="https://github.com/Benzsi/Gameink_frontend" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#53629E]/30 text-[#D6F4ED] hover:bg-[#87BAC3] hover:text-[#473472] transition-all duration-300 group" title="Frontend GitHub">
                <Github size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">Frontend</span>
              </a>
              <a href="https://github.com/Benzsi/Gameink_backend" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#53629E]/30 text-[#D6F4ED] hover:bg-[#87BAC3] hover:text-[#473472] transition-all duration-300 group" title="Backend GitHub">
                <Github size={16} />
                <span className="text-[9px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">Backend</span>
              </a>
              <Link to="/contact" className="p-2 rounded-lg bg-[#53629E]/30 text-[#D6F4ED] hover:bg-[#87BAC3] hover:text-[#473472] transition-all duration-300 self-center" title="Email">
                <Mail size={18} />
              </Link>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-[#D6F4ED] text-sm font-black uppercase tracking-[0.2em] mb-6">Navigáció</h4>
            <ul className="flex flex-col gap-3 list-none p-0 m-0">
              <li>
                <Link to="/" className="text-[#87BAC3] text-sm font-bold hover:text-[#D6F4ED] transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#53629E] group-hover:bg-[#87BAC3] transition-all"></span>
                  Főoldal
                </Link>
              </li>
              <li>
                <Link to="/devlogs" className="text-[#87BAC3] text-sm font-bold hover:text-[#D6F4ED] transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#53629E] group-hover:bg-[#87BAC3] transition-all"></span>
                  Dev Logs
                </Link>
              </li>
              <li>
                <Link to="/ai-search" className="text-[#87BAC3] text-sm font-bold hover:text-[#D6F4ED] transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#53629E] group-hover:bg-[#87BAC3] transition-all"></span>
                  AI Kereső
                </Link>
              </li>
              <li>
                <Link to="/mylists" className="text-[#87BAC3] text-sm font-bold hover:text-[#D6F4ED] transition-colors flex items-center gap-2 group">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#53629E] group-hover:bg-[#87BAC3] transition-all"></span>
                  Saját listáim
                </Link>
              </li>
            </ul>
          </div>

          {/* Support Section */}
          <div>
            <h4 className="text-[#D6F4ED] text-sm font-black uppercase tracking-[0.2em] mb-6">Támogatás</h4>
            <ul className="flex flex-col gap-3 list-none p-0 m-0">
              <li>
                <Link to="/#faq" className="text-[#87BAC3] text-sm font-bold hover:text-[#D6F4ED] transition-colors flex items-center gap-2 group">
                  <HelpCircle size={14} className="text-[#53629E] group-hover:text-[#87BAC3]" />
                  Gyakori kérdések
                </Link>
              </li>
              <li>
                <Link to="/#how-it-works" className="text-[#87BAC3] text-sm font-bold hover:text-[#D6F4ED] transition-colors flex items-center gap-2 group">
                  <Info size={14} className="text-[#53629E] group-hover:text-[#87BAC3]" />
                  Hogyan működik?
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-[#87BAC3] text-sm font-bold hover:text-[#D6F4ED] transition-colors flex items-center gap-2 group">
                  <Shield size={14} className="text-[#53629E] group-hover:text-[#87BAC3]" />
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* External Section */}
          <div className="bg-[#53629E]/10 border border-[#53629E]/30 rounded-2xl p-6">
            <h4 className="text-[#D6F4ED] text-sm font-black uppercase tracking-[0.2em] mb-4">Szeretnél fejlődni?</h4>
            <p className="text-[#87BAC3] text-xs font-bold leading-relaxed mb-6">
              Csatlakozz közösségünkhöz és tanulj más fejlesztőktől!
            </p>
            <a 
              href="https://discord.com/register" 
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 rounded-xl bg-[#D6F4ED] text-[#473472] font-black text-xs hover:bg-[#87BAC3] transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#D6F4ED]/10"
            >
              Discord szerver <ExternalLink size={14} />
            </a>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#53629E]/20 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#87BAC3] text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-1.5 opacity-60">
            &copy; {currentYear} indie.backseat. Minden jog fenntartva.
          </p>
          <div className="flex items-center gap-1 text-[#87BAC3] text-[10px] sm:text-xs font-black uppercase tracking-widest opacity-60">
            Készült szakmai vizsgára
          </div>
        </div>
      </div>
    </footer>
  );
}




