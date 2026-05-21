import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Navbar from '@/components/Navbar';

describe('Navbar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders navbar header', () => {
    const { container } = render(<Navbar />);
    const header = container.querySelector('header');
    expect(header).toBeInTheDocument();
  });

  it('displays brand name "Mathew"', () => {
    render(<Navbar />);
    expect(screen.getByText('Mathew')).toBeInTheDocument();
  });

  it('renders navigation menu', () => {
    const { container } = render(<Navbar />);
    const nav = container.querySelector('nav');
    expect(nav).toBeInTheDocument();
  });

  it('displays About link', () => {
    render(<Navbar />);
    const aboutLink = screen.getByText('About');
    expect(aboutLink).toBeInTheDocument();
    expect(aboutLink.getAttribute('href')).toBe('#about');
  });

  it('displays Projects link', () => {
    render(<Navbar />);
    const projectsLink = screen.getByText('Projects');
    expect(projectsLink).toBeInTheDocument();
    expect(projectsLink.getAttribute('href')).toBe('#projects');
  });

  it('displays Contact link', () => {
    render(<Navbar />);
    const contactLink = screen.getByText('Contact');
    expect(contactLink).toBeInTheDocument();
    expect(contactLink.getAttribute('href')).toBe('#contact');
  });

  it('displays Hire me button as mailto link', () => {
    render(<Navbar />);
    const hireLink = screen.getByText('Hire me');
    expect(hireLink).toBeInTheDocument();
    expect(hireLink.getAttribute('href')).toBe('mailto:lister.mathew@gmail.com');
  });

  it('has correct styling classes for fixed positioning', () => {
    const { container } = render(<Navbar />);
    const header = container.querySelector('header');
    expect(header?.className).toContain('fixed');
    expect(header?.className).toContain('top-0');
    expect(header?.className).toContain('z-50');
  });

  it('has backdrop blur effect', () => {
    const { container } = render(<Navbar />);
    const header = container.querySelector('header');
    expect(header?.className).toContain('backdrop-blur');
  });

  it('brand name has correct typography', () => {
    const { container } = render(<Navbar />);
    const brand = container.querySelector('span.font-semibold');
    expect(brand?.textContent).toBe('Mathew');
  });

  it('navigation links have hover transition', () => {
    const { container } = render(<Navbar />);
    const aboutLink = container.querySelector('a[href="#about"]');
    expect(aboutLink?.className).toContain('hover:text-zinc-900');
    expect(aboutLink?.className).toContain('transition-colors');
  });

  it('hire me button has correct styling', () => {
    const { container } = render(<Navbar />);
    const hireButton = container.querySelector('a[href="mailto:lister.mathew@gmail.com"]');
    expect(hireButton?.className).toContain('rounded-full');
    expect(hireButton?.className).toContain('bg-zinc-900');
    expect(hireButton?.className).toContain('text-white');
  });

  it('hire me button has hover effect', () => {
    const { container } = render(<Navbar />);
    const hireButton = container.querySelector('a[href="mailto:lister.mathew@gmail.com"]');
    expect(hireButton?.className).toContain('hover:bg-zinc-700');
  });

  it('all navigation items are properly spaced', () => {
    const { container } = render(<Navbar />);
    const nav = container.querySelector('nav');
    expect(nav?.className).toContain('flex');
    expect(nav?.className).toContain('justify-between');
  });

  it('header has border bottom', () => {
    const { container } = render(<Navbar />);
    const header = container.querySelector('header');
    expect(header?.className).toContain('border-b');
  });

  it('header has white background with transparency', () => {
    const { container } = render(<Navbar />);
    const header = container.querySelector('header');
    expect(header?.className).toContain('bg-white/80');
  });

  it('navigation container has max width constraint', () => {
    const { container } = render(<Navbar />);
    const navContainer = container.querySelector('nav');
    expect(navContainer?.className).toContain('max-w-4xl');
  });

  it('renders all 4 navigation items', () => {
    const { container } = render(<Navbar />);
    const links = container.querySelectorAll('a');
    expect(links.length).toBe(4);
  });

  it('navigation items have consistent text styling', () => {
    const { container } = render(<Navbar />);
    const navDiv = container.querySelector('div.flex.items-center.gap-6');
    expect(navDiv?.className).toContain('text-sm');
    expect(navDiv?.className).toContain('text-zinc-500');
  });
});
