# Funnel Page Builder - Project Context

## Current Project State
- **Status**: Core functionality working ✅
- **Tech Stack**: Next.js 15.5.4, React 19, TypeScript, Tailwind v3.4.17, ShadCN UI
- **Features Completed**:
  - URL-to-funnel generation with Playwright screenshots
  - Desktop (1440x900) & Mobile (iPhone 14 Pro) screenshot capture
  - Static HTML funnel page generation
  - GitHub Pages deployment via Octokit
  - ZIP download functionality
  - Light/dark mode toggle
  - Top navigation with profile dropdown
  - Settings and profile pages

## Active Goals
**🎨 Modernize Splash Page Design (In Progress)**
- Add modern animations and interactions
- Enhance CTA buttons for better conversion
- Implement 2025 design trends

## Recent Decisions

### Splash Page Enhancement Research (2025-10-10)
**Goal**: Create more modern, conversion-optimized splash pages with animations

**Research Findings - 2025 Design Trends:**
1. **Intentional Micro-Animations**
   - Scroll-triggered animations
   - Hover effects and micro-interactions
   - "Less is more" philosophy - purposeful animations only

2. **Full-Screen Immersive Experiences**
   - Large hero sections with high-quality visuals
   - Interactive elements to engage users

3. **Bold Typography**
   - Large, eye-catching fonts
   - Typography-first designs replacing generic backgrounds

4. **Gradients & Glassmorphism**
   - Vibrant gradients making a comeback
   - Frosted glass-like effects for modern feel

5. **Mobile-First & Performance**
   - Strategic use of animation (not excessive)
   - Performance optimization is critical

**CTA Button Best Practices (Data-Backed):**
- Specific CTAs increase conversions by 161%
- Personalized CTAs perform 202% better
- Adding urgency increases conversions by 332%
- Larger button sizes boost CTR by 90%
- High-contrast colors are critical (Microsoft earned $80M from color optimization)
- Strong action verbs (e.g., "Get Started", "Try Free", "Start Building")
- Clear value proposition: "Why should I click this?"
- Placement at end of content increases conversions by 70%

**Animation Library Decision:**
- **Chosen**: Framer Motion (now "Motion") v12.x
- **Reason**: Production-grade, works perfectly with Next.js 15 + React 19
- **Alternative**: Tailwind CSS animations (for simpler effects)
- **Compatibility**: Fully compatible with our stack

## Implementation Plan - Modern Splash Pages

### Phase 1: Setup Animation Libraries
1. Install Framer Motion
2. Set up animation utilities
3. Create reusable animation components

### Phase 2: Enhance Generated HTML Template
1. Add scroll-triggered animations
2. Implement glassmorphism effects
3. Add gradient overlays
4. Create animated CTA buttons with hover effects
5. Add micro-interactions for engagement

### Phase 3: CTA Optimization
1. Redesign primary CTA with high-contrast colors
2. Add secondary CTA with different style
3. Implement urgency elements
4. Add value proposition text near CTAs

### Phase 4: Mobile Optimization
1. Test all animations on mobile
2. Ensure touch-friendly button sizes
3. Optimize performance

## Known Issues
- ✅ FIXED: 404 error on preview (changed to `/funnels/${slug}/index.html`)
- ESLint configuration pending (Next.js asking for setup)

## Architecture Notes
- Generated funnels are static HTML files in `public/funnels/${slug}/`
- Preview uses iframe to display generated pages
- Playwright runs in both local (dev) and serverless (Vercel) environments
- GitHub deployment creates separate repos for each funnel

## Next Steps
1. Install Framer Motion
2. Create animation component library
3. Update generated HTML template with modern design
4. Test performance impact
5. A/B test CTA variations

## Resources
- [2025 Design Trends - Framer Blog](https://www.framer.com/blog/web-design-trends/)
- [Hero Section Best Practices](https://detachless.com/blog/hero-section-web-design-ideas)
- [CTA Button Design Guide](https://www.designstudiouiux.com/blog/cta-button-design-best-practices/)
- [Motion Documentation](https://motion.dev/)
