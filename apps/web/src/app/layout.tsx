import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GLP-1 Eligibility Screening',
  description: 'GLP-1 weight-loss medication eligibility screening',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <header className="bg-white border-b border-gray-200 py-4 px-6">
          <h1 className="text-lg font-semibold text-blue-700">GLP-1 Eligibility Screening</h1>
        </header>
        <main className="max-w-2xl mx-auto px-4 py-10">
          {children}
        </main>
      </body>
    </html>
  );
}
