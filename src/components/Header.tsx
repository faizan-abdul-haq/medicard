import Link from 'next/link';
import { Stethoscope } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
          <Stethoscope size={28} />
          <span>MediCard</span>
        </Link>
        <nav>
          <ul className="flex space-x-6">
            <li>
              <Link href="/" className="hover:text-accent-foreground transition-colors">
                Dashboard
              </Link>
            </li>
            <li>
              <Link href="/register" className="hover:text-accent-foreground transition-colors">
                Register Student
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
