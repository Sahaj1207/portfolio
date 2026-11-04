# What Recruiters and Engineering Hiring Managers Want From a (Flashy) SWE Portfolio

Context: the subject is a ~19-year-old full-stack/AI/desktop developer building a highly animated WebGL portfolio. The projects are FLOAT (a Windows "Dynamic Island" in Tauri/Rust), HARIKA (an open-source AI OS), VERITY (multimodal AI financial reconciliation), MotherTongue Books (multi-agent picture books, built at a hackathon) and PIE (an offline PDF/image editor in React Native + C++).

Evidence quality warning for the report writer: there is very little hard data on how people review *developer* portfolio websites. I found no peer-reviewed or eye-tracking study of SWE portfolio sites. The evidence falls into three tiers:
- **Data:** one small 2021 hiring-manager survey (Profy.dev, n≈60), a 2018 eye-tracking study of *resumes* (Ladders) and Google mobile page-speed data (2016–2017).
- **Practitioner opinion:** a hiring manager's article on HackerNoon, a 777-point Hacker News thread on Bruno Simon's 3D portfolio (~Dec 2025), and an interview with Bruno Simon himself.
- **Low-quality material:** many SEO or AI-written "what hiring managers want" posts. I left them out or flagged them where I used them.

## 1. How long do recruiters/hiring managers spend on a portfolio, and what do they look at first?

### Takeaway
No rigorous data exists for SWE portfolio sites. The best proxies point to a very short first pass: seconds for a resume, under a minute up to "a couple of minutes" for a portfolio. Hiring managers and panelists, more than recruiters, are the ones who open the site, and they go to the resume and GitHub to verify. The site has to deliver its core message (who you are, what you built, proof links) almost immediately.

### Cited Findings
- **Resume first pass (data, resumes not portfolios).** The 2018 Ladders eye-tracking study found an average initial resume screen of 7.4 seconds, up from about 6 seconds in 2012. Cluttered layouts and missing section or job headers slowed recruiters down. — [HR Dive](https://www.hrdive.com/news/eye-tracking-study-shows-recruiters-look-at-resumes-for-7-seconds/); [Ladders report PDF](https://csuglobal.edu/sites/default/files/blog-files/theladders-eyetracking-studyc2.pdf)
- **Criticism of that study.** It does not report how many recruiters took part or how experienced they were. Critics also say 7.4s measures the "keep reading or not" decision, not a full review. — [ERE](https://www.ere.net/articles/is-the-6-second-resume-scan-a-myth)
- **Survey (data, small and dated).** Profy.dev surveyed hiring managers and React team leads in Aug 2021, reaching out to 300+ and getting 60+ responses. The scenario was two junior applicants with GitHub and projects, one of whom also had a personal website.
  - Most respondents said they *would* look at the website. Secondary write-ups give the figure as 65% "definitely" looking.
  - 51% said a candidate *without* a site would not have lower chances.
  - The author summarised it as: managers "look at your website... but don't give a crap."
  - I could not fetch the primary profy.dev page (domain did not resolve), so the exact percentages come from secondary summaries and search snippets. — [Profy.dev survey on DEV](https://dev.to/profydev/this-survey-among-60-hiring-managers-reveals-don-t-waste-your-time-on-a-react-portfolio-website-17ge); [secondary summary](https://soychristian.pages.dev/contents/developer-portfolio-guide)
- **Resume gates the portfolio (opinion).** The same article says reviewers form their first impression from the resume, and "if it isn't good they won't even look at your website" or your GitHub. — [Profy.dev on DEV](https://dev.to/profydev/this-survey-among-60-hiring-managers-reveals-don-t-waste-your-time-on-a-react-portfolio-website-17ge)
- **Who opens the site (anecdotal).** A developer commenter argues recruiters generally don't look at portfolio sites, but hiring managers and panelists usually do. DEV commenters also say managers and panelists rarely spend more than a couple of minutes on one. — [DEV comment](https://dev.to/brian_curricular/comment/2cei3); [DEV comment](https://dev.to/j3ffjessie/comment/2cfch)
- **Commonly repeated time figures (unsourced).** Blogs repeat "under 30 seconds before deciding whether to look deeper" and "~3 minutes per portfolio." Neither figure cites a study. A design-recruiter survey found 80% of recruiters spend 3 minutes or less on a *design* portfolio, which may not transfer to SWE. — [Templifica blog](https://templifica.com/blog/how-to-build-a-developer-portfolio-that-actually-gets-you-hired); [uxdesign.cc](https://uxdesign.cc/ever-wonder-how-recruiters-look-at-your-design-portfolio-cc8dd1ecb698); [Level Up UX "30-second portfolio test"](https://level-up-ux.kit.com/posts/how-to-pass-the-30-second-portfolio-test)
- **What the first screen should carry (hiring manager opinion).** Alishah Novin, writing as a SWE hiring manager on HackerNoon in Aug 2022, says a portfolio should read like "a resume with personality." It should include:
  - a short bio and tech stack
  - prominent links to GitHub, resume and LinkedIn
  - projects with write-ups on outcomes, challenges and lessons learned
  - Novin adds that reviewers read READMEs and some code to gauge what you know, not to audit efficiency. — [HackerNoon, Novin 2022](https://hackernoon.com/faqs-for-a-software-engineering-hiring-manager-part-3-of-5-portfolios-and-githubs)
- **Verification instinct.** Recruiters and managers use GitHub to confirm you built the thing, which is why MLH says to pin hackathon projects on GitHub. — [MLH blog](https://blog.mlh.com/how-to-put-your-hackathon-project-on-your-resume-11-21-2022)

### Inferences
- Treat the first ~5–10 seconds as a resume-style scan. Above the fold, before any animation finishes, show:
  - name and role ("Full-stack / AI / desktop engineer")
  - one line of positioning
  - 2–3 flagship project names with one-line outcomes
  - Resume, GitHub and Email/LinkedIn links
- The site is mostly opened by *engineering* reviewers who already have the resume. Its job is to deepen and verify the resume, not replace it, so resume and site must agree.
- A WebGL intro that delays this information spends the scarce attention budget on something other than evidence.

### Gaps
- I found no eye-tracking or analytics study of how reviewers navigate SWE portfolio sites, and no 2023–2026 survey of engineering hiring managers specifically about portfolio websites. The Profy.dev survey is from 2021, React-focused and small, and I could not verify its primary page.
- I found no data separating recruiter behaviour from hiring-manager behaviour on portfolios.

## 2. What makes a project case study compelling for engineering roles?

### Takeaway
There is consensus, though from opinion sources rather than data. A compelling engineering case study runs problem/context → constraints → approach and architecture → key decisions and trade-offs → results/metrics → your role → what you'd do next. It links to code, a live demo or video, and a strong README. Depth on 2–4 projects beats breadth.

### Cited Findings
- **Hiring manager structure.** Each project should have a write-up of outcomes, challenges and lessons learned, the stack used, and a GitHub link. Each repo needs a README with an overview, screenshots and a changelog. Share complete projects, even small ones. Keep at most two unfinished projects and hide course assignments. — [HackerNoon, Novin 2022](https://hackernoon.com/faqs-for-a-software-engineering-hiring-manager-part-3-of-5-portfolios-and-githubs)
- **READMEs as a substitute for a site.** Profy.dev recommends detailed READMEs that explain technical decisions and point to the key code, plus blog posts or videos that show thought process. Projects that handle state, API data and forms prove more than a static site does. — [Profy.dev on DEV](https://dev.to/profydev/this-survey-among-60-hiring-managers-reveals-don-t-waste-your-time-on-a-react-portfolio-website-17ge)
- **Credibility signals (2026 guide, no named author).**
  - For open source: stars relative to the category, package downloads (npm/PyPI/crates.io), production use, and citations in blogs or talks.
  - For personal projects: technical depth, e.g. a compiler, a storage layer *with benchmarks*, a deployed ML model, or non-trivial scale.
  - Design-trade-off READMEs and blog posts count as write-ups.
  - You should be able to discuss the project in detail under interview pressure. — [techinterview.org, Apr/Jun 2026](https://www.techinterview.org/post/3233474610/side-projects-open-source-engineering-resume/)
- **Red flags (same source).**
  - tutorial, course or capstone clones
  - todo or basic CRUD apps
  - half-finished repos, stale commits, "wip" commit messages
  - bare links with no description — [techinterview.org](https://www.techinterview.org/post/3233474610/side-projects-open-source-engineering-resume/)
- **Career-blog consensus (lower quality).** Blogs recommend a problem → approach → tech choices "and why" → results → reflection structure, with metrics where possible (e.g. "reduced API latency by 30%"). They say three deep projects beat ten shallow ones and warn against linking buggy or unfinished demos. — [Dice](https://www.dice.com/career-advice/simple-ways-to-turn-finished-projects-into-portfolio-gold); [Lodely](https://www.lodely.com/blog/build-software-engineering-portfolio); [jobcannon](https://jobcannon.io/de/skills/portfolio-building)
- **Design is judged, not just content.** A portfolio "is expected to look good"; "a bad design can make you look incompetent." A broken or outdated site can hurt your chances. — [Profy.dev on DEV](https://dev.to/profydev/this-survey-among-60-hiring-managers-reveals-don-t-waste-your-time-on-a-react-portfolio-website-17ge)

### Inferences
Suggested case-study template for each project:
1. One-line hook with outcome.
2. Problem and who it's for.
3. Constraints, e.g.:
   - PIE: fully offline, C++ core under React Native, mobile memory limits
   - FLOAT: low-overhead always-on overlay on Windows, Rust/Tauri vs Electron
4. Architecture diagram.
5. 2–3 hard decisions with the trade-offs.
6. Metrics, e.g. RAM/CPU footprint, startup time, binary size, reconciliation accuracy or throughput, latency, downloads/stars/users.
7. My role (solo vs team; for the hackathon, which agents and pipeline parts were yours).
8. A 30–90s demo video or GIF.
9. Links: repo, release/download, live demo, Devpost.
10. What I'd do next.

The desktop and native projects (FLOAT, PIE) cannot be demoed in a browser, so short screen-recorded videos or GIFs are the main proof. Downloadable releases (GitHub Releases) add verifiability.

For AI projects (HARIKA, VERITY), reviewers will want to see what is model-provided vs. engineered: evals or accuracy numbers, failure handling, cost and latency. Absent metrics, say so honestly rather than inventing them.

### Gaps
- No data on which case-study elements most increase interview rates. Everything above is practitioner consensus.
- I found no source specifically on video length or format preferences of engineering reviewers.

## 3. Do heavy animations/creative portfolios help or hurt for SWE (not designer) roles?

### Takeaway
It depends on the target role and on execution. For creative-dev, WebGL or graphics roles, a spectacular 3D site *is* the portfolio and can launch a career (Bruno Simon). For general SWE roles, reviewers want information fast. Slow loads, stutter, crashes, unclear navigation and animations that get in the way are the most common complaints, and an over-engineered site can count against a candidate. The wow factor helps only if it never blocks access to the content and runs well on ordinary hardware and phones.

### Cited Findings
- **Creative portfolio as career launcher.** Bruno Simon's 3D car portfolio, built to show his students, ended up "boosting my career in crazy ways." Clients then came wanting "the same thing, but being paid." He went on to build Three.js Journey, a course his site says has 50,000+ students. He notes web 3D has "maybe like a quarter" of native power, so performance is the main constraint. — [Mux interview, Feb 2024](https://www.mux.com/blog/3d-web-development-and-beyond-a-chat-with-bruno-simon); [Three.js Journey](https://threejs-journey.com/)
- **Viral reach.** A Pastel write-up reports his portfolio drew roughly 400,000 visitors; this is a secondary source. — [usepastel](https://usepastel.com/blog/how-a-design-portfolio-got-the-attention-of-400-000-visitors)
- **HN reception of his new 3D portfolio (~Dec 2025, 777 points, 188 comments; opinion).**
  - Load time: "it takes a minute"; one user "closed the tab before seeing anything"; people complained there was no progress indicator.
  - Performance: CPU near 100% on an M3 MacBook Pro, iOS stutter, a Firefox crash on macOS, and inconsistent behaviour across browsers. Others said it ran smoothly or loaded in seconds on an iPad.
  - Usability: "very impressive as an art project, but terrible as an actual home page"; "functions poorly as a website."
  - Role fit: one commenter called it a perfect portfolio for web-game roles. Another put it as "if former then nice, if latter then unusable", i.e. art piece vs. homepage.
  - Mobile: works on phones, but long-press menus and text-selection highlights triggered on iOS. — [Hacker News thread](https://news.ycombinator.com/item?id=46206531)
- **Over-engineering can backfire (anecdotal).** A DEV commenter, jonrandy, reported rejecting candidates for over-engineered portfolio sites. One surveyed manager said websites "open the door for more interpretation and criticism." — [Profy.dev on DEV + comments](https://dev.to/profydev/this-survey-among-60-hiring-managers-reveals-don-t-waste-your-time-on-a-react-portfolio-website-17ge); [jonrandy comment](https://dev.to/jonrandy/comment/24bp6)
- **Animation speed (hiring manager opinion).** Quick visuals are fine, but anything that slows the reader down, including slow animations, is discouraged. Build only what fits the roles you're pursuing. — [HackerNoon, Novin 2022](https://hackernoon.com/faqs-for-a-software-engineering-hiring-manager-part-3-of-5-portfolios-and-githubs)
- **Peer review feedback (opinion).** A freeCodeCamp reviewer called one portfolio "too flashy" and recommended shorter animations, in line with Material Design's ~250–300ms guidance. — [freeCodeCamp forum](https://forum.freecodecamp.org/t/do-you-think-im-job-ready/486247)
- **Scroll-jacking critique.** Scroll-jacking causes stuttery scrolling from heavy handlers. It disorients or blocks users with vestibular disorders and keyboard-only users when the motion isn't optional, and it breaks back-button and deep-link behaviour. The same piece concedes guided portfolio pieces are reasonable candidates if done well. — [Red Sky Studios](https://redskystudios.co.uk/news/scroll-jacking-annoying-when-abused-delightful-when-done-right); [Frontend Checklist: scrolljacking](https://frontendchecklist.io/rules/accessibility/scrolljacking)
- **Front-end vs. back-end.** One blog suggests front-end engineers benefit from a custom, crafted site to show their skills. Back-end and systems engineers can use a template and put the effort into project descriptions and code quality (opinion). — [Lodely](https://www.lodely.com/blog/build-software-engineering-portfolio)

### Inferences
- For this developer, the WebGL "Dynamic Island" concept fits the story because it echoes FLOAT. It can be a genuine differentiator, especially for front-end, creative-dev, desktop-UI or startup roles, *if* it loads fast and never gates content.
- For back-end, AI-infra or general SWE screens, the same site must work as a fast, scannable document. The animation should feel like a demonstration of systems taste (performance, polish), not an obstacle.
- The single biggest risk, based on the HN evidence, is load time and device performance. A blank or frozen canvas reads as "broken," which is worse than no animation.

### Gaps
- No quantitative data compares interview rates for flashy vs. plain SWE portfolios.
- I found no first-hand accounts from engineering managers at specific companies (2023–2026) saying a creative portfolio tipped a SWE hire. The Bruno Simon case is freelance and creative-dev, not a SWE job hire.
- I did not find Awwwards or Codrops interviews in this pass that address hiring outcomes.

## 4. Best practices: skip-intro/fast mode, resume PDF, GitHub links, accessibility, mobile, load time

### Takeaway
Make the essentials reachable instantly and independently of WebGL:
- resume PDF, GitHub, email/LinkedIn and project summaries rendered as HTML
- a visible loading indicator, with progressive or lazy 3D loading
- a reduced-motion / "fast mode" path that respects `prefers-reduced-motion`
- native scrolling, keyboard focus and a working mobile experience

### Cited Findings
- **Load time and abandonment (data, older and general).**
  - Google's 2016 data from ~3,700 mobile sites found 53% of mobile visits are abandoned if a page takes longer than 3 seconds to load.
  - A 2017 Google/SOASTA model found that going from 1s to 7s load raises bounce probability by 113%.
  - These figures are for general/commercial sites, not portfolios, and attribution varies across write-ups. — [Think with Google benchmarks PDF](https://thinkwithgoogle.com/_qs/documents/57/mobile-page-speed-new-industry-benchmarks.pdf); [AMP blog](https://blog.amp.dev/2017/02/28/new-industry-benchmarks-for-mobile-page-speed/); [Marketing Dive](https://www.marketingdive.com/news/google-53-of-mobile-users-abandon-sites-that-take-over-3-seconds-to-load/)
- **Loading feedback.** HN users abandoned Bruno Simon's site when it showed nothing during a long load and specifically wanted a progress indicator. — [Hacker News](https://news.ycombinator.com/item?id=46206531)
- **3D asset optimisation (practitioner examples).** One 3D portfolio cut its GLB textures from 12.4MB to 4.4MB by converting them to WebP. Another lazy-mounted offscreen WebGL canvases so they don't compete with the hero scene for bandwidth and GPU. — [GitHub PR, Arham1716/3D-Portfolio](https://github.com/Arham1716/3D-Portfolio/pull/5); [GitHub PR, 2hangz/Portfolio](https://github.com/2hangz/Portfolio/pull/1)
- **Reduced motion and scroll.** If custom scrolling is essential, respect `prefers-reduced-motion`, give users a way to disable custom scroll effects, and avoid scroll-triggered animations that block continued scrolling.
  - Example portfolios gate all motion behind a single reduced-motion fallback, so a JS failure or the preference leaves a fully readable page. Some react if the setting changes mid-session.
  - One review of a portfolio flagged motion sickness from background motion plus animated text, and invisible keyboard focus. — [Frontend Checklist](https://frontendchecklist.io/rules/accessibility/scrolljacking); [example portfolio write-up](https://tebayoso.github.io/blog/2025/01/31/portfolio-website); [example](https://heartnet123.github.io/projects/portfolio-website); [DEV review comment](https://dev.to/moopet/comment/1k6bb)
- **Links and resume.**
  - Prominent links to GitHub, resume and LinkedIn.
  - Put GitHub on the resume as a plain URL, because printed links are not clickable.
  - Optionally add a "recent updates" section refreshed monthly so the site feels current. — [HackerNoon, Novin 2022](https://hackernoon.com/faqs-for-a-software-engineering-hiring-manager-part-3-of-5-portfolios-and-githubs)
- **Maintenance.** Keep it responsive and maintained, with no broken links. A broken or outdated site can hurt you. — [Profy.dev on DEV](https://dev.to/profydev/this-survey-among-60-hiring-managers-reveals-don-t-waste-your-time-on-a-react-portfolio-website-17ge)
- **Mobile.** On iOS Safari, a WebGL canvas without touch handling triggered long-press menus and whole-screen text-selection highlights. Several people browse portfolios on phones. — [Hacker News](https://news.ycombinator.com/item?id=46206531)

### Inferences
These are design recommendations derived from the findings above, not separately sourced.
- **Render HTML first, WebGL as enhancement.** Server-render or statically render the name, role, project cards and links so they are visible and indexable in under ~1–2s. Mount WebGL after first paint.
- **Never put a full-screen loader or intro in front of the content.** If there is an intro, make it a few seconds long, skippable (an "Skip intro" button plus Esc/scroll/click to skip), and remember the choice for return visits.
- **Offer a persistent "Fast mode / Plain view" toggle.** It should be auto-enabled by `prefers-reduced-motion`, on low-end GPUs (detect a failing or slow WebGL context or low FPS), on Save-Data, and as a no-WebGL fallback. Keep the same URL structure so deep links to `/projects/float` work in both modes.
- **Use native scroll.** Avoid scroll-jacking, or make it opt-out. Keep a visible focus ring, tab order and semantic headings so screen readers get the case studies.
- **Put a "Resume (PDF)" button in the fixed nav and above the fold,** with a stable URL like `/resume.pdf`, plus an HTML version. Include a mailto or copyable email, GitHub and LinkedIn in the header or footer of every page.
- **Set a performance budget** (e.g. compressed geometry/textures, Draco/KTX2/WebP, capped DPR, pausing render when off-screen or the tab is hidden) and test on a mid-range Android phone and a Windows laptop with integrated GPU.

### Gaps
- I found no survey data on how often reviewers use "skip intro" or plain-mode toggles, or whether such toggles change perception.
- I found no portfolio-specific load-time abandonment data. The Google figures are general-web and from 2016–2017.

## 5. For students/early-career devs (~19): presenting hackathon projects and open source credibly

### Takeaway
For juniors, projects are the main evidence, and credibility comes from specificity and verifiability:
- clear role ("solo" vs "team of 4 — I built X")
- concrete stack and what it does
- placement and award with context
- merged PRs, users, downloads or stars where real
- pinned repos with good READMEs and demos

Inflated or vague claims, tutorial clones and unfinished repos are the main red flags.

### Cited Findings
- **MLH on hackathon projects.**
  - Template: "Developed a [what] using [languages, frameworks, APIs] that [what it does]." Explain how you built it, what it achieved and what you learned.
  - Give awards with context, e.g. "won … Best Financial Hack out of 100 project submissions."
  - Lead with the most impressive, relevant project and pin it on GitHub so recruiters can verify you built it. — [MLH blog, 2022](https://blog.mlh.com/how-to-put-your-hackathon-project-on-your-resume-11-21-2022)
- **Hackathons for juniors.** Hackathon entries are worth listing when they include a placement and year; participation alone isn't.
  - New grads should have a dedicated Projects section with 2–3 projects, each with 2–3 bullets.
  - State your role clearly, e.g. maintainer vs. top contributor.
  - Count substantial merged PRs, a maintainer role, or a shipped feature; trivial fixes don't count, and "a big repo doesn't make a small contribution significant." — [techinterview.org, 2026](https://www.techinterview.org/post/3233474610/side-projects-open-source-engineering-resume/)
- **How many hackathons to list.** Choose the best ~1–3 hackathons rather than listing them all. Use concrete entries naming the event, your role and the stack. — [resumemate](https://www.resumemate.io/blog/how-to-list-hackathons-on-a-resume-with-examples/); [Tufts Career Center, Oct 2024](https://careers.tufts.edu/blog/2024/10/28/how-to-include-hackathons-on-your-resume/)
- **Juniors and the portfolio site.** Hiring managers look for character, creativity, dedication, passion and willingness to learn, especially in juniors. A site can show these, but so can GitHub projects. — [Profy.dev on DEV](https://dev.to/profydev/this-survey-among-60-hiring-managers-reveals-don-t-waste-your-time-on-a-react-portfolio-website-17ge)
- **Hide filler.** Hide course assignments once you have your own work, and don't showcase product-scale efforts that never got past an early screen. — [HackerNoon, Novin 2022](https://hackernoon.com/faqs-for-a-software-engineering-hiring-manager-part-3-of-5-portfolios-and-githubs)

### Inferences
- **MotherTongue Books:** label it clearly as a hackathon project with event name, date, team size, your specific contribution (e.g. orchestration or agent pipeline) and any placement. Link to Devpost, the repo and the demo video. Be honest about what's prototype-grade.
- **HARIKA ("open-source AI OS"):** the ambitious name invites scepticism. Ground it with:
  - a precise definition of what it actually is (shell/agent layer vs. kernel)
  - a scope diagram
  - repo activity, contributors, stars or releases if real
  - a demo video
  - Without that, "AI OS" may read as hype from a 19-year-old.
- **FLOAT and PIE:** systems-y projects (Rust/Tauri, C++ in React Native, offline) are strong signals for a young dev. Lead with them and quantify (memory and CPU footprint, binary size, offline capability, downloads).
- **VERITY:** financial reconciliation is a domain-credible problem. Show the accuracy or eval methodology and data-privacy handling, and state whether it was used on real or synthetic data.
- **Age:** age needn't be stated, but if it is, framing the work as "shipped X while in university" turns youth into a positive dedication signal. Avoid overclaiming titles like "founder" or "CEO" without substance.
- **Keep the resume and site consistent.** Reviewers verify via GitHub, so pinned repos should match the portfolio's featured projects and have polished READMEs.

### Gaps
- I found no data on how engineering hiring managers weigh hackathon wins vs. open-source contributions vs. solo shipped apps for ~19-year-old candidates.
- I found no sources specifically on how reviewers perceive grand project names like "AI OS" from juniors. That inference is mine.
