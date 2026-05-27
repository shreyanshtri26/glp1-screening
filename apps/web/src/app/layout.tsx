import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

export const metadata: Metadata = {
  title: 'GLP-1 Eligibility Screening | PhoenixLabs',
  description: 'GLP-1 weight-loss medication eligibility screening',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakarta.className} min-h-screen bg-gradient-to-br from-[#FFF6DE]/60 via-slate-50 to-[#FFE394]/30 text-gray-800 antialiased`} suppressHydrationWarning>
        <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-gray-100/80 py-4 px-6 md:px-12 flex items-center justify-between">
          <div className="flex items-center gap-3" suppressHydrationWarning>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-brand-coral to-brand-gold flex items-center justify-center shadow-md shadow-brand-coral/20" suppressHydrationWarning>
              <span className="text-white font-black text-xl">P</span>
            </div>
            <div suppressHydrationWarning>
              <span className="text-sm font-semibold tracking-wider text-brand-coral block uppercase">PhoenixLabs</span>
              <span className="text-xs text-gray-400 font-medium">Wellness Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-2" suppressHydrationWarning>
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-brand-teal animate-pulse" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-widest">Medical Assessment</span>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-12 md:py-16">
          {children}
        </main>
      </body>
    </html>
  );
}
