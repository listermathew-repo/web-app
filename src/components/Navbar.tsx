export default function Navbar() {
  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-zinc-100">
      <nav className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
        <span className="font-semibold tracking-tight text-zinc-900">Mathew</span>
        <div className="flex items-center gap-6 text-sm text-zinc-500">
          <a href="#about" className="hover:text-zinc-900 transition-colors">About</a>
          <a href="#projects" className="hover:text-zinc-900 transition-colors">Projects</a>
          <a href="#contact" className="hover:text-zinc-900 transition-colors">Contact</a>
          <a
            href="mailto:lister.mathew@gmail.com"
            className="rounded-full bg-zinc-900 text-white px-4 py-1.5 text-sm font-medium hover:bg-zinc-700 transition-colors"
          >
            Hire me
          </a>
        </div>
      </nav>
    </header>
  );
}
