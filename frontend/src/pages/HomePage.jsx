import React from 'react';
import Navbar from '../components/Navbar';
import HeroSection from '../components/HeroSection';
import FeaturePreview from '../components/FeaturePreview';
import HowItWorks from '../components/HowItWorks';
import WellnessCTA from '../components/WellnessCTA';
import Footer from '../components/Footer';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#FAFAF9] flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Sticky Frosted Navigation Bar */}
      <Navbar />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Hero Section with AI Companion */}
        <HeroSection />

        {/* Feature Preview Cards */}
        <FeaturePreview />

        {/* How Zaiqo Helps You (3-Step Guide) */}
        <HowItWorks />

        {/* Bottom Wellness Conversion Banner */}
        <WellnessCTA />
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
