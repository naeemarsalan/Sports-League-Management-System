'use client';

import { motion } from 'framer-motion';
import { Trophy, Users, Calendar, Target, Shield, Bell, ArrowRight, Download } from 'lucide-react';
import SnookerBreak from '@/src/components/SnookerBreak';
import FloatingBalls from '@/src/components/FloatingBalls';
import { FadeInSection, StaggerContainer, StaggerItem } from '@/src/components/AnimatedSection';
import StatsSection from '@/src/components/StatsSection';

const screenshots = [
  { name: 'Dashboard', src: '/screenshots/dashboard.png' },
  { name: 'Matches', src: '/screenshots/matches.png' },
  { name: 'Leaderboard', src: '/screenshots/leaderboard.png' },
  { name: 'Profile', src: '/screenshots/profile.png' },
];

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#34d9c3]/10 via-transparent to-transparent"></div>
        <FloatingBalls />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <motion.h1
                className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
              >
                Run Your Snooker League{' '}
                <motion.span
                  className="bg-gradient-to-r from-[#34d9c3] to-[#2ab3a0] bg-clip-text text-transparent inline-block"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.4 }}
                >
                  Like a Pro
                </motion.span>
              </motion.h1>
              <motion.p
                className="text-xl text-gray-400 mb-8 leading-relaxed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                Create leagues, schedule matches, track standings, and challenge players — all from your phone.
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
              >
                <motion.button
                  className="group bg-[#34d9c3] hover:bg-[#2ab3a0] text-[#0a0e14] font-semibold px-8 py-4 rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#34d9c3]/20"
                  whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(52,217,195,0.3)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Download className="w-5 h-5" />
                  Download on App Store
                </motion.button>
                <motion.button
                  className="group bg-[#141922] hover:bg-[#1f2937] border-2 border-[#34d9c3]/30 hover:border-[#34d9c3] font-semibold px-8 py-4 rounded-xl transition-colors duration-300 flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Download className="w-5 h-5" />
                  Get it on Google Play
                </motion.button>
              </motion.div>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <div className="hidden lg:block">
                <motion.div
                  initial={{ opacity: 0, x: 40 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                >
                  <SnookerBreak />
                </motion.div>
              </div>
              <motion.div
                className="relative lg:hidden"
                initial={{ opacity: 0, x: 60 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-[#34d9c3] to-[#2ab3a0] rounded-[3rem] blur-3xl opacity-20"></div>
                <motion.div
                  className="relative bg-[#141922] rounded-[3rem] p-4 border border-[#34d9c3]/20 shadow-2xl"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <div className="w-64 h-[520px] rounded-3xl border-4 border-gray-800 shadow-2xl overflow-hidden">
                    <img
                      src="/screenshots/leaderboard.png"
                      alt="Leaderboard screen"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <StatsSection />

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-[#34d9c3] to-[#2ab3a0] bg-clip-text text-transparent">
                Manage Your League
              </span>
            </h2>
            <p className="text-xl text-gray-400">Powerful features designed for competitive play</p>
          </FadeInSection>
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Trophy,
                title: 'Create & Join Leagues',
                description: 'Start your own league or join with a 6-character invite code',
              },
              {
                icon: Calendar,
                title: 'Match Scheduling',
                description: 'Schedule matches, record scores, and track results in real time',
              },
              {
                icon: Target,
                title: 'Live Leaderboards',
                description: 'Automatic standings with points (3 for win, 1 for draw) and rankings with gold/silver/bronze badges',
              },
              {
                icon: Users,
                title: 'Challenge Players',
                description: 'Send challenges to any player in your league',
              },
              {
                icon: Shield,
                title: 'Role-Based Management',
                description: 'Owner, Admin, Mod, and Player roles with granular permissions',
              },
              {
                icon: Bell,
                title: 'Push Notifications',
                description: 'Get notified about challenges, match updates, and league activity',
              },
            ].map((feature, index) => (
              <StaggerItem key={index}>
                <motion.div
                  className="group bg-[#141922] border border-[#34d9c3]/10 hover:border-[#34d9c3]/40 rounded-2xl p-8 transition-colors duration-300 h-full"
                  whileHover={{ scale: 1.04, y: -4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <motion.div
                    className="bg-gradient-to-br from-[#34d9c3] to-[#2ab3a0] w-14 h-14 rounded-xl flex items-center justify-center mb-6"
                    whileHover={{ rotate: 8, scale: 1.1 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <feature.icon className="w-7 h-7 text-[#0a0e14]" />
                  </motion.div>
                  <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{feature.description}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-[#141922]/50 relative overflow-hidden">
        <motion.div
          className="absolute top-1/2 -left-32 w-[500px] h-[3px] bg-gradient-to-r from-transparent via-[#c49a6c] to-[#8b6f47] rounded-full -rotate-12 opacity-20"
          initial={{ x: -200 }}
          whileInView={{ x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <FadeInSection className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-400">Get started in three simple steps</p>
          </FadeInSection>
          <StaggerContainer className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Create a League',
                description: 'Set up your league and share the invite code with your players',
              },
              {
                step: '02',
                title: 'Add Players',
                description: 'Members join with the code and get approved by league admins',
              },
              {
                step: '03',
                title: 'Play & Compete',
                description: 'Schedule matches, record results, and climb the leaderboard',
              },
            ].map((item, index) => (
              <StaggerItem key={index}>
                <div className="relative h-full">
                  <motion.div
                    className="bg-[#141922] border border-[#34d9c3]/20 rounded-2xl p-8 h-full hover:border-[#34d9c3]/40 transition-colors duration-300"
                    whileHover={{ y: -6 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    <motion.div
                      className="text-6xl font-bold bg-gradient-to-br from-[#34d9c3] to-[#2ab3a0] bg-clip-text text-transparent mb-4 inline-block"
                      initial={{ scale: 0.5, opacity: 0 }}
                      whileInView={{ scale: 1, opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.5, delay: 0.2 + index * 0.15, type: 'spring', stiffness: 200 }}
                    >
                      {item.step}
                    </motion.div>
                    <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                    <p className="text-gray-400 leading-relaxed">{item.description}</p>
                  </motion.div>
                  {index < 2 && (
                    <motion.div
                      className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2"
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.6 + index * 0.2, duration: 0.4 }}
                    >
                      <motion.div
                        animate={{ x: [0, 6, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                      >
                        <ArrowRight className="w-8 h-8 text-[#34d9c3]" />
                      </motion.div>
                    </motion.div>
                  )}
                </div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Screenshot/App Preview Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeInSection className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Beautiful Dark UI{' '}
              <span className="bg-gradient-to-r from-[#34d9c3] to-[#2ab3a0] bg-clip-text text-transparent">
                Designed for Focus
              </span>
            </h2>
            <p className="text-xl text-gray-400">A seamless experience across all features</p>
          </FadeInSection>
          <StaggerContainer className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {screenshots.map((screen, index) => (
              <StaggerItem key={index}>
                <motion.div
                  className="group"
                  whileHover={{ y: -8 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <div className="relative bg-gradient-to-b from-[#141922] to-[#0a0e14] rounded-3xl border-4 border-gray-800 overflow-hidden aspect-[9/16] shadow-xl group-hover:shadow-2xl group-hover:shadow-[#34d9c3]/10 transition-shadow duration-300">
                    <img
                      src={screen.src}
                      alt={`${screen.name} screen`}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out" />
                  </div>
                  <p className="text-center text-[#34d9c3] font-semibold mt-3">{screen.name}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 bg-[#141922]/50 relative overflow-hidden">
        <FloatingBalls />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <FadeInSection className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Built for Real Leagues</h2>
            <p className="text-xl text-gray-400">Whether you play at a club, pub, or community centre</p>
          </FadeInSection>
          <StaggerContainer className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: 'Club Leagues',
                description: 'Perfect for snooker and pool clubs running weekly or seasonal leagues with formal standings.',
              },
              {
                title: 'Pub & Social Leagues',
                description: 'Casual leagues between friends or regulars — set up in minutes, no spreadsheets needed.',
              },
              {
                title: 'Tournament Play',
                description: 'Use the challenge system and leaderboard to run round-robin style competitions with automatic rankings.',
              },
            ].map((item, index) => (
              <StaggerItem key={index}>
                <motion.div
                  className="bg-[#141922] border border-[#34d9c3]/20 rounded-2xl p-8 hover:border-[#34d9c3]/40 transition-colors duration-300 h-full"
                  whileHover={{ scale: 1.03, y: -4 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                >
                  <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{item.description}</p>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#34d9c3]/20 via-[#2ab3a0]/10 to-transparent"></div>

        <motion.div
          className="absolute top-12 pointer-events-none"
          initial={{ x: '-5vw' }}
          whileInView={{ x: '105vw' }}
          viewport={{ once: true }}
          transition={{ duration: 3, delay: 0.5, ease: 'easeInOut' }}
        >
          <motion.div
            animate={{ rotate: 1080 }}
            transition={{ duration: 3, delay: 0.5, ease: 'easeInOut' }}
          >
            <svg width="28" height="28" viewBox="0 0 28 28">
              <defs>
                <radialGradient id="cue-shine" cx="35%" cy="30%" r="65%">
                  <stop offset="0%" stopColor="rgba(255,255,255,0.7)" />
                  <stop offset="50%" stopColor="rgba(255,255,255,0)" />
                  <stop offset="100%" stopColor="rgba(0,0,0,0.2)" />
                </radialGradient>
              </defs>
              <circle cx="14" cy="14" r="13" fill="#f5f5f0" />
              <circle cx="14" cy="14" r="13" fill="url(#cue-shine)" />
            </svg>
          </motion.div>
        </motion.div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <FadeInSection>
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">Ready to Start Your League?</h2>
            <p className="text-xl text-gray-400 mb-8">
              Start organizing your league today — create, invite, and compete from your phone.
            </p>
          </FadeInSection>
          <motion.div
            className="flex flex-col sm:flex-row gap-4 justify-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <motion.button
              className="group bg-[#34d9c3] hover:bg-[#2ab3a0] text-[#0a0e14] font-semibold px-8 py-4 rounded-xl transition-colors duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#34d9c3]/20"
              whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(52,217,195,0.3)' }}
              whileTap={{ scale: 0.97 }}
            >
              <Download className="w-5 h-5" />
              Download on App Store
            </motion.button>
            <motion.button
              className="group bg-[#141922] hover:bg-[#1f2937] border-2 border-[#34d9c3]/30 hover:border-[#34d9c3] font-semibold px-8 py-4 rounded-xl transition-colors duration-300 flex items-center justify-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <Download className="w-5 h-5" />
              Get it on Google Play
            </motion.button>
          </motion.div>
        </div>
      </section>
    </>
  );
}
