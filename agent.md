    1.Always use python for backend with UV as package managemnt + Fastapi + Langchain and Langgraph + Pydantic v2 models
    2.Always use React application built with Vite, styled using Tailwind CSS, utilizing Lucide-React for icons, Framer Motion for subtle fade-in animations, and Google Fonts such as Inter or Manrope.
    3.Don't Hardcode strings, Always do L10N
    4.Always use Firebase for Authentication, accounts, database for users
    5.if needed use chroma as vectordb
    6.if needed use openai gpt 4.1 model for llm application needed
    7.Always GDPR Compliance (Mandatory)
     + Privacy Policy (Mandatory)
     + Cookie Consent Banner (Mandatory)
     + Cookie Policy (Mandatory)
     + Legal Notice / Imprint (Impressum)
     + Terms & Conditions (Mandatory for E-Commerce)
     + Consumer Rights (Mandatory for Online Shops)
     + Accessibility (Increasingly Mandatory)
     + HTTPS (SSL Certificate)
    8.

**Design System & Aesthetics:**

- **Theme:** "Enterprise AI" aesthetic. Clean, trustworthy, technical.
- **Color Palette:**
  - Primary Background: Deep Navy/Black (#0B1221)
  - Secondary Background: Lighter Navy (#161F32)
  - Text: White (Headings), Light Gray (#94A3B8 for body)
  - Accents: Electric Cyan/Blue (#38BDF8) for buttons and highlights.
- **Typography:** Sans-serif, high readability, tight tracking for headings.

**Required Sections (Vertical Layout):**

1.  **Sticky Navbar:**

    - Logo on left (Text: "PROGREZZ" in bold white).
    - Links: Platform, Solutions, Resources, Company.
    - Right side: "Login" (Ghost button) and "Start for Free" (Cyan primary button).
    - Effect: Glassmorphism background (backdrop-blur) on scroll.

    2.  **Hero Section:**

    - Alignment: Centered text.
    - Headline: Large H1, bold, white. "Synthetic Data for Everyone".
    - Subheadline: "Generate high-fidelity, privacy-safe synthetic data to accelerate AI and analytics."
    - CTA Row: Two buttons. 1. "Start for free" (Solid Cyan). 2. "Book a Demo" (Outline/Ghost).
    - Visual: Subtle background gradient or abstract node-network SVG pattern behind the text.

    5.  **Footer:**

    - Simple 4-column layout with links.

    **Implementation Constraints:**

- Ensure the layout is fully responsive (mobile-first).
- Use semantic HTML tags (<nav>, <header>, <section>, <footer>).
- Do not use placeholder images; use CSS gradients or colored divs where an image would be.
- Write clean, modular code with separate components for the Navbar, Hero, and FeatureGrid.
