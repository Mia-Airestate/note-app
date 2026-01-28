import './globals.css';
import { UIProvider } from '@/components/providers/UIProvider';

export const metadata = {
  title: 'Note App',
  description: 'Block-based note editor',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <UIProvider>{children}</UIProvider>
      </body>
    </html>
  );
}

