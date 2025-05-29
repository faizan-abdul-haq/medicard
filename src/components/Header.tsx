import Link from 'next/link';
import { Stethoscope, Users, UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header() {
  return (
    <header className="bg-primary text-primary-foreground shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 text-2xl font-bold">
          <Stethoscope size={28} />
          <span>MediCard</span>
        </Link>
        <nav>
          <ul className="flex space-x-2 md:space-x-4 items-center">
            <li>
              <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary/80 hover:text-accent-foreground transition-colors px-2 md:px-3 py-1 md:py-2 text-sm md:text-base">
                <Link href="/">Dashboard</Link>
              </Button>
            </li>
            <li>
              <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary/80 hover:text-accent-foreground transition-colors px-2 md:px-3 py-1 md:py-2 text-sm md:text-base">
                <Link href="/register">Register</Link>
              </Button>
            </li>
            <li>
              <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary/80 hover:text-accent-foreground transition-colors px-2 md:px-3 py-1 md:py-2 text-sm md:text-base">
                <Link href="/students/list" className="flex items-center gap-1">
                  <Users size={18} /> Students
                </Link>
              </Button>
            </li>
            <li>
              <Button variant="ghost" asChild className="text-primary-foreground hover:bg-primary/80 hover:text-accent-foreground transition-colors px-2 md:px-3 py-1 md:py-2 text-sm md:text-base">
                <Link href="/students/bulk-upload" className="flex items-center gap-1">
                  <UploadCloud size={18} /> Bulk Upload
                </Link>
              </Button>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
