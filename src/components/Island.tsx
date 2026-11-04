import Link from "next/link";

/**
 * The island. In Plain view it is a static capsule with section links.
 * Phase 2 springs it between section "slots"; phase 3 hands rendering to the SDF shader.
 */
export function Island() {
  return (
    <header className="island" data-island>
      <Link href="/" className="island-mark" aria-label="Sahaj Alatage — home">
        S
      </Link>
      <nav className="island-nav" aria-label="Primary">
        <Link href="/#work">Work</Link>
        <Link href="/#about">About</Link>
        <Link href="/#contact">Contact</Link>
      </nav>
    </header>
  );
}
