import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  GraduationCap, ArrowRight, Zap, ShieldCheck, FileText,
  Users, LayoutDashboard, BookOpen, CheckCircle2, ChevronRight,
  Star, TrendingUp, Globe, Lock, Mail, Phone,
  Layers, Calendar, Menu, X
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'

function useCountUp(target, duration = 1800, start = false) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!start) return
    let startTime = null
    const step = (ts) => {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      setVal(Math.floor(progress * target))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [start, target, duration])
  return val
}

function StatCard({ value, suffix, label, started }) {
  const count = useCountUp(value, 1600, started)
  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-bold tracking-tight text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
        {count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs text-white/40 mt-1 tracking-wide">{label}</div>
    </div>
  )
}

function FeatureCard({ icon: Icon, title, desc, accent }) {
  return (
    <div className="group bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.06] hover:border-white/[0.12] rounded-2xl p-6 sm:p-7 transition-all duration-200 hover:-translate-y-1 cursor-default">
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center mb-5"
        style={{ background: accent + '20', border: `1px solid ${accent}30` }}
      >
        <Icon size={20} color={accent} />
      </div>
      <div className="text-sm font-semibold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>{title}</div>
      <div className="text-[13px] text-white/40 leading-relaxed">{desc}</div>
    </div>
  )
}

function Testimonial({ quote, name, role, school }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 sm:p-7">
      <div className="flex gap-0.5 mb-4">
        {[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#F59E0B" color="#F59E0B" />)}
      </div>
      <p className="text-sm text-white/55 leading-[1.75] mb-5 italic">"{quote}"</p>
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ background: 'linear-gradient(135deg, #7C6AF7, #4F46E5)' }}>
          {name[0]}
        </div>
        <div>
          <div className="text-[13px] font-semibold text-white">{name}</div>
          <div className="text-xs text-white/35">{role} · {school}</div>
        </div>
      </div>
    </div>
  )
}

export function LandingPage() {
  const statsRef = useRef(null)
  const [statsStarted, setStatsStarted] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [inquiry, setInquiry] = useState({ name: '', email: '', message: '' })
  const [sending, setSending] = useState(false)

  async function handleSendInquiry(e) {
    e.preventDefault()
    if (!inquiry.name || !inquiry.email || !inquiry.message) return toast.error('Please fill all fields')
    setSending(true)
    try {
      const res = await api('/public/inquiry', { method: 'POST', body: JSON.stringify(inquiry) })
      toast.success(res.message)
      setInquiry({ name: '', email: '', message: '' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    const fonts = document.createElement('link')
    fonts.rel = 'stylesheet'
    fonts.href = 'https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap'
    document.head.appendChild(fonts)
    return () => document.head.removeChild(fonts)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!statsRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setStatsStarted(true) },
      { threshold: 0.3 }
    )
    observer.observe(statsRef.current)
    return () => observer.disconnect()
  }, [])

  const features = [
    { icon: ShieldCheck, title: 'Multi-tenant isolation', desc: 'Each institution gets its own secure DB context, private branding, and custom subdomain. Complete data isolation by design.', accent: '#7C6AF7' },
    { icon: Zap, title: 'Real-time ledger', desc: 'Edit entire class results live with no page reloads. Instant autosave, conflict-free concurrent editing.', accent: '#34D399' },
    { icon: FileText, title: 'Pro PDF generation', desc: 'One-click branded report cards with your logo, principal signature, and grade rubric. Print-ready in seconds.', accent: '#F59E0B' },
    { icon: LayoutDashboard, title: 'Institutional branding', desc: 'Fully white-labeled portals. Upload your crest, set your palette, and make GradeX invisible to end users.', accent: '#60A5FA' },
    { icon: Users, title: 'Role-based access', desc: 'Granular permissions for Principals, HODs, Teachers, and Admins. Privacy-first architecture throughout.', accent: '#F472B6' },
    { icon: BookOpen, title: 'Smart grading rules', desc: 'Configure GPA, percentile, letter grades, or custom rubrics once. The engine handles all computation.', accent: '#A78BFA' },
  ]

  const testimonials = [
    { quote: "GradeX cut our end-of-term reporting from 3 weeks to 2 days. The PDF quality alone sold our board.", name: "Sunita Rawat", role: "Principal", school: "DPS Kathmandu" },
    { quote: "Finally a platform built for how schools actually work. The multi-tenant setup was live in an afternoon.", name: "Arjun Thapa", role: "IT Director", school: "Budhanilkantha School" },
    { quote: "Our teachers went from dreading results day to finishing before lunch. Remarkable difference.", name: "Meera Joshi", role: "Academic Head", school: "St. Xavier's Lalitpur" },
  ]

  const navScrolled = scrollY > 40

  return (
    <div className="bg-[#080812] min-h-screen overflow-x-hidden text-white" style={{ fontFamily: "'DM Sans', sans-serif" }}>

      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -top-48 left-[10%] w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(124,106,247,0.12) 0%, transparent 70%)' }} />
        <div className="absolute top-48 -right-[5%] w-[450px] h-[450px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.07) 0%, transparent 70%)' }} />
        <div className="absolute bottom-[20%] left-[30%] w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 70%)' }} />
      </div>

      {/* ── NAV ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${navScrolled ? 'bg-[rgba(8,8,18,0.92)] backdrop-blur-xl border-b border-white/[0.06]' : 'bg-transparent'}`}>
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
              style={{ background: 'linear-gradient(135deg, #7C6AF7, #4F46E5)' }}>
              <GraduationCap size={16} color="#fff" />
            </div>
            <span className="text-[17px] font-bold tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>GradeX</span>
          </div>

          {/* Desktop nav links — centered */}
          <div className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {['About', 'Features', 'Pricing', 'Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                className="text-[13px] font-medium text-white/40 hover:text-white transition-colors duration-150 tracking-wide">
                {item}
              </a>
            ))}
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <Link to="/demo/login" className="hidden sm:block">
              <button className="px-5 py-2 rounded-lg text-[13px] font-semibold text-white transition-all duration-150 hover:-translate-y-px"
                style={{ background: 'linear-gradient(135deg, #7C6AF7, #4F46E5)', boxShadow: '0 0 20px rgba(124,106,247,0.35)' }}>
                Live demo →
              </button>
            </Link>
            {/* Mobile hamburger */}
            <button className="md:hidden p-2 text-white/50 hover:text-white transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#0d0d1f] border-t border-white/[0.06] px-4 py-4 flex flex-col gap-1">
            {['About', 'Features', 'Pricing', 'Contact'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                onClick={() => setMobileMenuOpen(false)}
                className="text-sm text-white/50 hover:text-white py-2.5 px-3 rounded-lg hover:bg-white/[0.04] transition-all">
                {item}
              </a>
            ))}
            <Link to="/demo/login" className="mt-2">
              <button className="w-full py-2.5 rounded-lg text-[13px] font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #7C6AF7, #4F46E5)' }}>
                Live demo →
              </button>
            </Link>
          </div>
        )}
      </nav>

      {/* ── HERO ── */}
      <section className="relative z-[1] pt-28 sm:pt-36 pb-16 sm:pb-24 text-center">
        <div className="max-w-[820px] mx-auto px-5 sm:px-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[rgba(124,106,247,0.1)] border border-[rgba(124,106,247,0.25)] text-[11px] font-medium text-[#A78BFA] mb-7 tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-[#7C6AF7] inline-block" />
            Next-generation academic management
          </div>

          {/* Headline */}
          <h1 className="font-extrabold leading-[1.05] tracking-[-2.5px] mb-5 text-[clamp(40px,6vw,72px)]"
            style={{ fontFamily: "'Syne', sans-serif" }}>
            The grade book your<br />
            school{' '}
            <span style={{
              background: 'linear-gradient(135deg, #7C6AF7 0%, #A78BFA 50%, #60A5FA 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            }}>deserves.</span>
          </h1>

          <p className="text-base sm:text-lg text-white/40 leading-relaxed max-w-[520px] mx-auto mb-9 font-light">
            Automate marks entry, generate branded PDF report cards, and run every campus from one intelligent multi-tenant platform.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <a href="#contact">
              <button className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 w-full sm:w-auto justify-center"
                style={{ background: 'linear-gradient(135deg, #7C6AF7, #4F46E5)', boxShadow: '0 4px 40px rgba(124,106,247,0.4)' }}>
                Launch your school <ArrowRight size={16} />
              </button>
            </a>
            <Link to="/demo/login">
              <button className="flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-medium text-white/65 hover:text-white bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 transition-all duration-200 w-full sm:w-auto justify-center">
                Watch a demo <ChevronRight size={16} />
              </button>
            </Link>
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex items-center justify-center gap-3 flex-wrap">
            {['500+ schools', 'SOC 2 compliant', '99.9% uptime', 'GDPR ready'].map((t, i) => (
              <span key={t} className="flex items-center gap-1.5">
                {i > 0 && <span className="text-white/15 text-sm">·</span>}
                <CheckCircle2 size={13} color="#34D399" />
                <span className="text-[12px] text-white/35 font-medium">{t}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Dashboard mock */}
        <div className="max-w-[1000px] mx-auto mt-14 px-4 sm:px-6 relative">
          <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 w-4/5 h-28 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(124,106,247,0.2) 0%, transparent 70%)' }} />
          <div className="rounded-[20px] border border-white/[0.08] bg-white/[0.02] backdrop-blur-xl overflow-hidden"
            style={{ boxShadow: '0 40px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)' }}>
            {/* Titlebar */}
            <div className="h-11 bg-white/[0.03] border-b border-white/[0.06] flex items-center px-4 gap-2">
              <div className="flex gap-1.5">
                {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
                  <div key={c} className="w-2.5 h-2.5 rounded-full opacity-80" style={{ background: c }} />
                ))}
              </div>
              <div className="flex-1 max-w-[200px] mx-auto h-5 bg-white/[0.06] rounded flex items-center justify-center">
                <span className="text-[10px] text-white/25">gradex.io</span>
              </div>
            </div>

            <div className="grid bg-[#0a0c12]" style={{ gridTemplateColumns: '220px 1fr', minHeight: 520 }}>
              {/* Sidebar */}
              <div className="border-r border-white/[0.03] py-5 flex flex-col hidden sm:flex">
                <div className="flex items-center justify-between px-5 mb-8">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black text-black shrink-0"
                      style={{ background: 'linear-gradient(135deg, #FFD700, #FFA500)', boxShadow: '0 4px 12px rgba(255,215,0,0.2)' }}>🏫</div>
                    <div>
                      <div className="text-[12px] font-bold text-white truncate max-w-[110px]">St. Marys Intern...</div>
                      <div className="text-[9px] text-white/25 font-semibold tracking-wide">KATHMANDU, NEPAL</div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col gap-7">
                  {[
                    { label: 'SCHOOL SETUP', items: [{ icon: Layers, label: 'Classes' }, { icon: BookOpen, label: 'Subjects' }, { icon: GraduationCap, label: 'Students' }] },
                    { label: 'STAFF', items: [{ icon: Users, label: 'Teachers' }] },
                    { label: 'ASSESSMENTS', items: [{ icon: Calendar, label: 'Exams' }, { icon: ShieldCheck, label: 'Grading Rules' }, { icon: BookOpen, label: 'Result Ledger' }, { icon: FileText, label: 'Report Cards' }] }
                  ].map(section => (
                    <div key={section.label} className="px-3">
                      <div className="text-[9px] text-white/20 tracking-[0.08em] font-black mb-3 pl-2">{section.label}</div>
                      <div className="flex flex-col gap-0.5">
                        {section.items.map((item, idx) => {
                          const isActive = section.label === 'SCHOOL SETUP' && idx === 0
                          return (
                            <div key={item.label}
                              className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer border ${isActive ? 'bg-white/[0.04] border-white/[0.03]' : 'border-transparent'}`}>
                              <item.icon size={14} color={isActive ? '#fff' : 'rgba(255,255,255,0.22)'} />
                              <span className={`text-[12px] font-medium ${isActive ? 'text-white' : 'text-white/35'}`}>{item.label}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main */}
              <div className="flex flex-col">
                <div className="h-16 border-b border-white/[0.03] px-6 sm:px-8 flex items-center justify-between">
                  <div>
                    <div className="text-[13px] font-bold text-white">Dr. Sarah Wilson</div>
                    <div className="text-[10px] text-white/25 font-medium">Principal</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-white/25 text-sm">☀️</span>
                    <div className="px-3 py-1.5 rounded-lg border border-white/[0.05] bg-white/[0.02] text-[11px] font-semibold text-white/35 cursor-pointer">
                      🔓 Sign out
                    </div>
                  </div>
                </div>

                <div className="p-5 sm:p-8">
                  <div className="bg-[rgba(10,12,18,0.5)] border border-white/[0.04] rounded-2xl p-6 sm:p-8 mb-6 text-left">
                    <div className="flex gap-2 mb-4">
                      <span className="px-3 py-1 rounded-full bg-white/[0.06] text-white/55 text-[9px] font-black uppercase tracking-wide">Principal console</span>
                      <span className="px-3 py-1 rounded-full bg-[rgba(124,106,247,0.1)] text-[#A78BFA] text-[9px] font-black uppercase tracking-wide border border-[rgba(124,106,247,0.1)]">Live</span>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>School result operations</h2>
                    <p className="text-sm text-white/30 max-w-md leading-relaxed">School overview, progress tracking, and quick counts live here.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { label: 'Students', value: '5', icon: GraduationCap },
                      { label: 'Teachers', value: '2', icon: Users },
                      { label: 'Classes', value: '1', icon: Layers },
                      { label: 'Subjects', value: '4', icon: BookOpen },
                      { label: 'Exams', value: '1', icon: Calendar },
                    ].map(card => (
                      <div key={card.label} className="bg-white/[0.02] border border-white/[0.04] rounded-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[120px]">
                        <div className="flex justify-between items-start">
                          <span className="text-[11px] text-white/30 font-semibold">{card.label}</span>
                          <card.icon size={15} color="rgba(255,255,255,0.13)" />
                        </div>
                        <div className="text-3xl sm:text-4xl font-bold text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>{card.value}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      <section ref={statsRef} className="relative z-[1] py-10 px-4 sm:px-6">
        <div className="max-w-[900px] mx-auto">
          <div className="rounded-2xl px-6 sm:px-12 py-8 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10"
            style={{ background: 'linear-gradient(135deg, rgba(124,106,247,0.15), rgba(79,70,229,0.1))', border: '1px solid rgba(124,106,247,0.2)' }}>
            <StatCard value={500} suffix="+" label="Schools onboarded" started={statsStarted} />
            <StatCard value={2000000} suffix="+" label="Reports generated" started={statsStarted} />
            <StatCard value={99} suffix=".9%" label="Uptime SLA" started={statsStarted} />
            <StatCard value={40} suffix="%" label="Admin time saved" started={statsStarted} />
          </div>
        </div>
      </section>

      {/* ── ABOUT ── */}
      <section id="about" className="relative z-[1] py-16 sm:py-24 px-4 sm:px-6 bg-white/[0.015]">
        <div className="max-w-[1100px] mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 sm:gap-20 items-center">
          <div>
            <div className="text-xs font-bold text-[#34D399] tracking-[0.15em] uppercase mb-4">Our Mission</div>
            <h2 className="text-[clamp(26px,3.5vw,38px)] font-bold text-white mb-6 leading-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Built by educators,<br />for modern institutions.
            </h2>
            <p className="text-base text-white/45 leading-[1.85] mb-8">
              GradeX was born out of a simple observation: most school management systems are too complex, too slow, and lack the privacy modern schools demand.
              <br /><br />
              Our multi-tenant architecture ensures your school's data is never mixed with others, while our high-performance ledger makes marks entry feel like a local spreadsheet.
            </p>
            <div className="grid grid-cols-2 gap-6">
              {[
                { label: 'Security First', desc: 'End-to-end data isolation' },
                { label: 'Cloud Native', desc: '99.9% uptime guaranteed' },
                { label: 'Built for Nepal', desc: 'Nepali school workflows' },
                { label: 'Open to Scale', desc: 'From 50 to 50,000 students' },
              ].map(item => (
                <div key={item.label}>
                  <div className="text-sm font-bold text-white mb-1">{item.label}</div>
                  <div className="text-xs text-white/30">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="aspect-[4/3] rounded-3xl flex items-center justify-center overflow-hidden"
              style={{ background: 'linear-gradient(135deg, #7C6AF7, #4F46E5)', boxShadow: '0 40px 80px rgba(0,0,0,0.4)' }}>
              <Globe size={110} color="rgba(255,255,255,0.18)" />
            </div>
            <div className="absolute -bottom-5 -left-4 sm:-left-5 bg-white/10 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-4"
              style={{ boxShadow: '0 20px 40px rgba(0,0,0,0.3)' }}>
              <div className="text-2xl font-bold text-white">2M+</div>
              <div className="text-[10px] text-white/40 font-bold uppercase tracking-wider mt-0.5">Results Processed</div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="relative z-[1] py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-12 sm:mb-16">
            <div className="text-xs text-[#7C6AF7] font-semibold tracking-[0.1em] mb-4 uppercase">Platform Features</div>
            <h2 className="font-bold tracking-tight text-white mb-4 text-[clamp(28px,4vw,46px)]"
              style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-1.5px' }}>
              Engineered for academic<br />excellence
            </h2>
            <p className="text-base text-white/40 max-w-md mx-auto leading-relaxed">
              Every feature was shaped by real schools and refined through real workflows.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map(f => <FeatureCard key={f.title} {...f} />)}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section className="relative z-[1] py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-[1100px] mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs text-[#34D399] font-semibold tracking-[0.1em] uppercase mb-3">Trusted by Schools</div>
            <h2 className="font-bold text-white tracking-tight text-[clamp(26px,3.5vw,40px)]"
              style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-1px' }}>
              What educators say
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map(t => <Testimonial key={t.name} {...t} />)}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="relative z-[1] py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[680px] mx-auto text-center">
          <div className="text-xs font-bold text-[#A78BFA] tracking-[0.15em] uppercase mb-4">Simple Pricing</div>
          <h2 className="text-[clamp(28px,4vw,40px)] font-bold text-white mb-4 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
            One plan. Everything included.
          </h2>
          <p className="text-white/40 mb-12 leading-relaxed max-w-md mx-auto">
            No tiers, no hidden fees, no surprises. Full power of GradeX for your institution.
          </p>

          {/* Single pricing card */}
          <div className="relative rounded-3xl p-8 sm:p-12 text-left overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(124,106,247,0.15), rgba(79,70,229,0.08))', border: '1px solid rgba(124,106,247,0.35)' }}>
            {/* Popular tag */}
            <div className="absolute top-6 right-6 px-3 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-widest"
              style={{ background: 'linear-gradient(135deg, #7C6AF7, #4F46E5)' }}>
              ALL FEATURES
            </div>

            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-8">
              <div>
                <div className="text-lg font-bold text-white mb-1" style={{ fontFamily: "'Syne', sans-serif" }}>GradeX Pro</div>
                <p className="text-sm text-white/40">For schools of any size — ready in one afternoon.</p>
              </div>
              <div className="flex items-baseline gap-1 shrink-0">
                <span className="text-sm text-white/40 font-medium">NPR</span>
                <span className="text-5xl font-black text-white tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>49,999</span>
                <span className="text-sm text-white/35">/yr</span>
              </div>
            </div>

            <div className="h-px bg-white/[0.08] mb-8" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
              {[
                'Unlimited students & teachers',
                'Real-time result ledger',
                'Branded PDF report cards',
                'Multi-role access control',
                'Custom school subdomain',
                'Daily automated backups',
                'SOC 2 compliant infrastructure',
                'Priority support (24/7)',
                'Smart grading rule engine',
                'White-labeled portal',
              ].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <CheckCircle2 size={16} color="#34D399" className="shrink-0" />
                  <span className="text-[13px] text-white/60">{f}</span>
                </div>
              ))}
            </div>

            <a href="#contact">
              <button className="w-full py-4 rounded-xl text-[15px] font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #7C6AF7, #4F46E5)', boxShadow: '0 8px 30px rgba(124,106,247,0.35)' }}>
                Get started today →
              </button>
            </a>

            <p className="text-center text-xs text-white/25 mt-4">Contact us for multi-campus or NGO pricing.</p>
          </div>
        </div>
      </section>



      {/* ── SECURITY ── */}
      <section className="relative z-[1] py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-[900px] mx-auto">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-10">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start lg:items-center">
              <div className="lg:w-64 shrink-0">
                <Lock size={26} color="#A78BFA" className="mb-4" />
                <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Syne', sans-serif" }}>Built for compliance</h3>
                <p className="text-sm text-white/40 leading-relaxed">
                  Enterprise-grade security baked in from day one. Not an afterthought.
                </p>
              </div>
              <div className="hidden lg:block w-px bg-white/[0.07] self-stretch" />
              <div className="grid grid-cols-3 gap-6 sm:gap-10 flex-1 w-full">
                {[
                  { icon: ShieldCheck, label: 'SOC 2 Type II', sub: 'Annually audited' },
                  { icon: Globe, label: 'GDPR compliant', sub: 'EU data residency' },
                  { icon: TrendingUp, label: '99.9% uptime', sub: 'SLA guaranteed' },
                ].map(({ icon: Icon, label, sub }) => (
                  <div key={label} className="text-center">
                    <Icon size={20} color="#7C6AF7" className="mx-auto mb-2.5" />
                    <div className="text-[13px] font-semibold text-white mb-1">{label}</div>
                    <div className="text-[11px] text-white/30">{sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="relative z-[1] py-16 sm:py-24 px-4 sm:px-6 text-center">
        <div className="max-w-[600px] mx-auto">
          <h2 className="font-extrabold leading-tight text-white mb-5 tracking-tight text-[clamp(32px,5vw,58px)]"
            style={{ fontFamily: "'Syne', sans-serif", letterSpacing: '-2px' }}>
            Ready to transform<br />your school?
          </h2>
          <p className="text-white/40 leading-relaxed mb-10 text-base sm:text-lg">
            Join 500+ institutions already running on GradeX. Setup takes one afternoon.
          </p>
          <Link to="/demo/login">
            <button className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl text-[15px] font-bold text-white transition-all duration-200 hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #7C6AF7, #4F46E5)', boxShadow: '0 4px 50px rgba(124,106,247,0.45)' }}>
              Start for free <ArrowRight size={16} />
            </button>
          </Link>
        </div>
      </section>

      {/* ── CONTACT ── */}
      <section id="contact" className="relative z-[1] py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-[720px] mx-auto">
          <div className="text-center mb-10">
            <div className="text-xs font-bold text-[#60A5FA] tracking-[0.15em] uppercase mb-4">Ready to Launch?</div>
            <h2 className="text-[clamp(26px,4vw,38px)] font-bold text-white mb-3 tracking-tight" style={{ fontFamily: "'Syne', sans-serif" }}>
              Get in touch with us
            </h2>
            <p className="text-white/40 text-sm sm:text-base">Whether you're a single campus or a national network, we'd love to help.</p>
          </div>

          <form onSubmit={handleSendInquiry} className="bg-white/[0.03] border border-white/[0.06] rounded-3xl p-6 sm:p-12">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Name</label>
                <input
                  className="bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[rgba(124,106,247,0.4)] transition-colors"
                  placeholder="Your name"
                  value={inquiry.name}
                  onChange={e => setInquiry({ ...inquiry, name: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Email</label>
                <input
                  className="bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-[rgba(124,106,247,0.4)] transition-colors"
                  placeholder="school@edu.com"
                  type="email"
                  value={inquiry.email}
                  onChange={e => setInquiry({ ...inquiry, email: e.target.value })}
                />
              </div>
            </div>
            <div className="flex flex-col gap-2 mb-8">
              <label className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Message</label>
              <textarea
                className="bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 min-h-[130px] resize-y focus:outline-none focus:border-[rgba(124,106,247,0.4)] transition-colors"
                placeholder="Tell us about your institution..."
                value={inquiry.message}
                onChange={e => setInquiry({ ...inquiry, message: e.target.value })}
              />
            </div>
            <button
              type="submit"
              disabled={sending}
              className="w-full py-4 rounded-xl text-[15px] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-wait"
              style={{ background: sending ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg, #7C6AF7, #4F46E5)', boxShadow: '0 10px 30px rgba(124,106,247,0.2)' }}
            >
              {sending ? 'Sending...' : 'Send Inquiry →'}
            </button>
          </form>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="relative z-[1] border-t border-white/[0.06] pt-14 pb-8 px-4 sm:px-6">
        <div className="max-w-[1100px] mx-auto">
          {/* Top row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
                  style={{ background: 'linear-gradient(135deg, #7C6AF7, #4F46E5)' }}>
                  <GraduationCap size={16} color="#fff" />
                </div>
                <span className="text-[16px] font-bold" style={{ fontFamily: "'Syne', sans-serif" }}>GradeX</span>
              </div>
              <p className="text-xs text-white/30 leading-relaxed max-w-[200px]">
                The modern academic management platform built for South Asian schools.
              </p>
            </div>

            {/* Product */}
            <div>
              <div className="text-[10px] font-bold text-white/25 uppercase tracking-[0.1em] mb-4">Product</div>
              <div className="flex flex-col gap-2.5">
                {['Features', 'Pricing', 'Live Demo', 'Changelog'].map(l => (
                  <a key={l} href="#" className="text-[13px] text-white/40 hover:text-white/75 transition-colors">{l}</a>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <div className="text-[10px] font-bold text-white/25 uppercase tracking-[0.1em] mb-4">Company</div>
              <div className="flex flex-col gap-2.5">
                {['About', 'Blog', 'Careers', 'Privacy Policy'].map(l => (
                  <a key={l} href="#" className="text-[13px] text-white/40 hover:text-white/75 transition-colors">{l}</a>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <div className="text-[10px] font-bold text-white/25 uppercase tracking-[0.1em] mb-4">Contact</div>
              <div className="flex flex-col gap-3">
                <a href="mailto:infocodewithniraj@gmail.com"
                  className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/75 transition-colors">
                  <Mail size={13} className="shrink-0" /> infocodewithniraj@gmail.com
                </a>
                <a href="tel:+9779761200543"
                  className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/75 transition-colors">
                  <Phone size={13} className="shrink-0" /> +977 9761200543
                </a>
              </div>
              <div className="flex gap-3 mt-5">
                {['Twitter', 'Docs'].map(s => (
                  <a key={s} href="#"
                    className="px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] text-[11px] text-white/40 hover:text-white/70 transition-all">
                    {s}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-white/[0.05]">
            <p className="text-[11px] text-white/20">© 2026 GradeX Systems. All rights reserved.</p>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#34D399] animate-pulse" />
              <span className="text-[11px] text-white/25">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}