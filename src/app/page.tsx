import Navbar from "@/components/Navbar";

const projects = [
  {
    title: "Project One",
    description: "A short description of what this project does and the problem it solves.",
    tags: ["Next.js", "TypeScript", "Tailwind"],
    href: "#",
  },
  {
    title: "Project Two",
    description: "Another project showcasing your skills and the technologies you used.",
    tags: ["React", "Node.js", "PostgreSQL"],
    href: "#",
  },
  {
    title: "Project Three",
    description: "A third project that highlights your range and creativity as a developer.",
    tags: ["Python", "FastAPI", "Docker"],
    href: "#",
  },
];

const skills = [
  "TypeScript", "React", "Next.js", "Node.js",
  "Tailwind CSS", "PostgreSQL", "Git", "Docker",
];

export default function Home() {
  return (
    <>
      <Navbar />

      <main className="max-w-4xl mx-auto px-6 pt-32 pb-24 space-y-32">

        {/* Hero */}
        <section className="space-y-6">
          <p className="text-sm font-medium text-zinc-400 uppercase tracking-widest">
            Available for work
          </p>
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900 leading-tight">
            Hi, I&apos;m Mathew. <br />
            I build things for the web.
          </h1>
          <p className="max-w-xl text-lg text-zinc-500 leading-relaxed">
            I&apos;m a full-stack developer focused on crafting clean, performant,
            and user-friendly digital experiences. I love turning ideas into
            polished products.
          </p>
          <div className="flex items-center gap-4 pt-2">
            <a
              href="#projects"
              className="rounded-full bg-zinc-900 text-white px-6 py-2.5 font-medium hover:bg-zinc-700 transition-colors"
            >
              View my work
            </a>
            <a
              href="#contact"
              className="rounded-full border border-zinc-200 text-zinc-700 px-6 py-2.5 font-medium hover:bg-zinc-50 transition-colors"
            >
              Get in touch
            </a>
          </div>
        </section>

        {/* About */}
        <section id="about" className="space-y-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">About me</h2>
          <div className="grid md:grid-cols-2 gap-10">
            <p className="text-zinc-500 leading-relaxed">
              I&apos;m a developer who cares deeply about the details — from smooth
              animations to accessible, semantic HTML. I&apos;ve worked on projects
              ranging from small startups to large-scale platforms.
            </p>
            <div className="space-y-3">
              <p className="text-sm font-medium text-zinc-900">Technologies I work with</p>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-sm text-zinc-600"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Projects */}
        <section id="projects" className="space-y-8">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Selected projects</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {projects.map((project) => (
              <a
                key={project.title}
                href={project.href}
                className="group flex flex-col gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 hover:border-zinc-300 hover:bg-white transition-all"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-zinc-900 group-hover:text-zinc-700">
                    {project.title}
                  </h3>
                  <span className="text-zinc-300 group-hover:text-zinc-500 transition-colors">↗</span>
                </div>
                <p className="text-sm text-zinc-500 leading-relaxed flex-1">
                  {project.description}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {project.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-zinc-200 px-2.5 py-0.5 text-xs text-zinc-600"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Contact */}
        <section id="contact" className="space-y-6">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Get in touch</h2>
          <p className="max-w-md text-zinc-500 leading-relaxed">
            Whether you have a project in mind, a question, or just want to say hi
            — my inbox is always open.
          </p>
          <a
            href="mailto:lister.mathew@gmail.com"
            className="inline-flex items-center gap-2 rounded-full bg-zinc-900 text-white px-6 py-2.5 font-medium hover:bg-zinc-700 transition-colors"
          >
            Say hello →
          </a>
        </section>

      </main>

      <footer className="border-t border-zinc-100">
        <div className="max-w-4xl mx-auto px-6 py-6 flex items-center justify-between text-sm text-zinc-400">
          <span>© {new Date().getFullYear()} Mathew</span>
          <span>Built with Next.js & Tailwind</span>
        </div>
      </footer>
    </>
  );
}
