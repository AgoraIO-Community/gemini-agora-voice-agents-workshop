import type { Metadata, Viewport } from 'next';
import './globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: 'Talk to Ada | Gemini + Agora',
  description:
    'Live voice-agent demo from the Build Voice Agents with Gemini + Agora livestream: switch between the cascaded pipeline and Gemini Live.',
  icons: { icon: [{ url: '/favicon.ico' }] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full min-h-screen">{children}</body>
    </html>
  );
}
