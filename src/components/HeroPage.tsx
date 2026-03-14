'use client';

import { useEffect, useState } from 'react';
import { useTheme } from '@/lib/theme';
import Link from 'next/link';
import { FiSun, FiActivity, FiCoffee, FiZap } from 'react-icons/fi';
import { IoIosArrowForward } from 'react-icons/io';
import { TerrainIcon } from './ui';

export default function HeroPage() {
  const [mounted, setMounted] = useState(false);
  const themeContext = useTheme();
  const theme = themeContext?.theme || 'dark';

  useEffect(() => {
    setMounted(true);
    document.body.classList.add('hero-mode');
    return () => document.body.classList.remove('hero-mode');
  }, []);

  if (!mounted) return null;

  return (
    <div className="hero-page">
      <div className="hero-container">
        <nav className="hero-nav">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <TerrainIcon size={36} color="var(--accent)" />
            <div className="hero-logo">PEAK</div>
          </div>
            <div className="hero-nav-links">
              <Link href="/login">Sign In</Link>
            </div>
        </nav>

        <section className="hero-section">
          <div className="hero-badge">Athletic Intelligence OS</div>
          <h1 className="hero-title">
            <span className="hero-title-line">Your Personal</span>
            <span className="hero-title-line accent">AI COACH</span>
          </h1>
          <p className="hero-subtitle">
            Cristiano Ronaldo has a team of experts. PEAK gives that to everyone.
          </p>
          <div className="hero-cta">
            <Link href="/signup" className="hero-btn-primary">
              Get Started
              <IoIosArrowForward size={24} style={{ transition: 'transform 0.2s' }} />
            </Link>
          </div>
        </section>

        <section className="hero-features">
          <div className="hero-feature">
            <div className="hero-feature-icon"><FiSun /></div>
            <h3>Dashboard</h3>
            <p>AI-generated daily recommendations based on your recovery data</p>
          </div>
          <div className="hero-feature">
            <div className="hero-feature-icon"><FiActivity /></div>
            <h3>Smart Training</h3>
            <p>Adaptive workout programs that evolve with your progress</p>
          </div>
          <div className="hero-feature">
            <div className="hero-feature-icon"><FiCoffee /></div>
            <h3>Nutrition AI</h3>
            <p>Personalized meal plans aligned with your training goals</p>
          </div>
          <div className="hero-feature">
            <div className="hero-feature-icon"><FiZap /></div>
            <h3>Recovery Tracking</h3>
            <p>Real-time insights from wearable integration</p>
          </div>
        </section>

        <section className="hero-stats">
          <div className="hero-stat">
            <span className="hero-stat-value">10K+</span>
            <span className="hero-stat-label">Athletes</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">98%</span>
            <span className="hero-stat-label">Satisfaction</span>
          </div>
          <div className="hero-stat">
            <span className="hero-stat-value">24/7</span>
            <span className="hero-stat-label">AI Support</span>
          </div>
        </section>

        <section className="hero-voice">
          <div className="hero-voice-content">
            <div className="hero-voice-label">Ask Coach PEAK</div>
            <div className="hero-voice-text">"How should I train today based on my recovery?"</div>
            <div className="hero-voice-wave">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="wave-pill" style={{ animationDelay: `${i * 0.08}s` }} />
              ))}
            </div>
          </div>
        </section>

        <footer className="hero-footer">
          <div className="hero-footer-brand">PEAK</div>
          <div className="hero-footer-tagline">Athletic Intelligence</div>
        </footer>
      </div>
    </div>
  );
}
