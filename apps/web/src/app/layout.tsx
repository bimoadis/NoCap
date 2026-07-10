import type { Metadata } from 'next';
import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-d',
  weight: ['500', '600', '700'],
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-b',
  weight: ['400', '500', '600'],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-m',
  weight: ['400', '500', '600'],
});

export const metadata: Metadata = {
  title: 'NOCAP · Know before you ape',
  description: 'NOCAP is a real time wallet intelligence layer. It watches the first trades of every launch, traces who funded them, and returns one verdict.',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="-4 -2 22 11" shape-rendering="crispEdges"><rect x="5" y="0" width="5" height="1" fill="%23eef3fa"/><rect x="4" y="1" width="7" height="1" fill="%23eef3fa"/><rect x="3" y="2" width="9" height="1" fill="%23eef3fa"/><rect x="3" y="3" width="9" height="1" fill="%23eef3fa"/><rect x="3" y="4" width="9" height="1" fill="%23eef3fa"/><rect x="0" y="5" width="12" height="1" fill="%23eef3fa"/><rect x="0" y="6" width="12" height="1" fill="%239aa7bd"/><rect x="-2" y="-1" width="3" height="1" fill="%233ce6a4"/><rect x="0" y="0" width="3" height="1" fill="%233ce6a4"/><rect x="2" y="1" width="3" height="1" fill="%233ce6a4"/><rect x="4" y="2" width="3" height="1" fill="%233ce6a4"/><rect x="6" y="3" width="3" height="1" fill="%233ce6a4"/><rect x="8" y="4" width="3" height="1" fill="%233ce6a4"/><rect x="10" y="5" width="3" height="1" fill="%233ce6a4"/><rect x="12" y="6" width="3" height="1" fill="%233ce6a4"/></svg>',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable} min-h-full flex flex-col antialiased`}>
        {children}
      </body>
    </html>
  );
}
