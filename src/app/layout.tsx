import type { Metadata } from 'next';
import '@/styles/globals.css';
import { ThemeProvider } from '@/lib/theme';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: 'PEAK — Athletic Intelligence OS',
  description: 'Your personal AI athletic coach. Cristiano Ronaldo has a team of experts — PEAK gives that to everyone.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Providers>{children}</Providers>
        </ThemeProvider>
      </body>
    </html>
  );
}
