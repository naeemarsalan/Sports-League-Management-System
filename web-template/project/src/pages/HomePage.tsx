import { Trophy, Users, Calendar, Target, Shield, Bell, ArrowRight, Download } from 'lucide-react';

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-24 relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold leading-tight mb-6">
                Run Your Snooker League{' '}
                <span className="bg-gradient-to-r from-[#34d9c3] to-[#2ab3a0] bg-clip-text text-transparent">
                  Like a Pro
                </span>
              </h1>
              <p className="text-xl text-gray-400 mb-8 leading-relaxed">
                Create leagues, schedule matches, track standings, and challenge players — all from your phone.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <button className="group bg-[#34d9c3] hover:bg-[#2ab3a0] text-[#0a0e14] font-semibold px-8 py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#34d9c3]/20 hover:shadow-xl hover:shadow-[#34d9c3]/30 hover:scale-105">
                  <Download className="w-5 h-5" />
                  Download on App Store
                </button>
                <button className="group bg-[#141922] hover:bg-[#1f2937] border-2 border-[#34d9c3]/30 hover:border-[#34d9c3] font-semibold px-8 py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105">
                  <Download className="w-5 h-5" />
                  Get it on Google Play
                </button>
              </div>
            </div>
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-[#34d9c3] to-[#2ab3a0] rounded-[3rem] blur-3xl opacity-20"></div>
                <div className="relative bg-[#141922] rounded-[3rem] p-4 border border-[#34d9c3]/20 shadow-2xl">
                  <div className="w-64 h-[520px] rounded-3xl border-4 border-gray-800 shadow-2xl overflow-hidden">
                    <img
                      src="/screenshots/leaderboard.png"
                      alt="Leaderboard screen"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Everything You Need to{' '}
              <span className="bg-gradient-to-r from-[#34d9c3] to-[#2ab3a0] bg-clip-text text-transparent">
                Manage Your League
              </span>
            </h2>
            <p className="text-xl text-gray-400">Powerful features designed for competitive play</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              <div
                key={index}
                className="group bg-[#141922] border border-[#34d9c3]/10 hover:border-[#34d9c3]/40 rounded-2xl p-8 transition-all duration-300 hover:transform hover:scale-105 hover:shadow-xl hover:shadow-[#34d9c3]/10"
              >
                <div className="bg-gradient-to-br from-[#34d9c3] to-[#2ab3a0] w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="w-7 h-7 text-[#0a0e14]" />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-400 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-[#141922]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-gray-400">Get started in three simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
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
              <div key={index} className="relative">
                <div className="bg-[#141922] border border-[#34d9c3]/20 rounded-2xl p-8 h-full hover:border-[#34d9c3]/40 transition-all duration-300">
                  <div className="text-6xl font-bold bg-gradient-to-br from-[#34d9c3] to-[#2ab3a0] bg-clip-text text-transparent mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  <p className="text-gray-400 leading-relaxed">{item.description}</p>
                </div>
                {index < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2">
                    <ArrowRight className="w-8 h-8 text-[#34d9c3]" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Screenshot/App Preview Section */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">
              Beautiful Dark UI{' '}
              <span className="bg-gradient-to-r from-[#34d9c3] to-[#2ab3a0] bg-clip-text text-transparent">
                Designed for Focus
              </span>
            </h2>
            <p className="text-xl text-gray-400">A seamless experience across all features</p>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {screenshots.map((screen, index) => (
              <div key={index} className="group">
                <div className="relative bg-gradient-to-b from-[#141922] to-[#0a0e14] rounded-3xl border-4 border-gray-800 overflow-hidden aspect-[9/16] hover:scale-105 transition-transform duration-300 shadow-xl">
                  <img
                    src={screen.src}
                    alt={`${screen.name} screen`}
                    className="w-full h-full object-cover"
                  />
                </div>
                <p className="text-center text-[#34d9c3] font-semibold mt-3">{screen.name}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 bg-[#141922]/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold mb-4">Built for Real Leagues</h2>
            <p className="text-xl text-gray-400">Whether you play at a club, pub, or community centre</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
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
              <div
                key={index}
                className="bg-[#141922] border border-[#34d9c3]/20 rounded-2xl p-8 hover:border-[#34d9c3]/40 transition-all duration-300"
              >
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-gray-400 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#34d9c3]/20 via-[#2ab3a0]/10 to-transparent"></div>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative">
          <h2 className="text-4xl sm:text-5xl font-bold mb-6">Ready to Start Your League?</h2>
          <p className="text-xl text-gray-400 mb-8">
            Start organizing your league today — create, invite, and compete from your phone.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="group bg-[#34d9c3] hover:bg-[#2ab3a0] text-[#0a0e14] font-semibold px-8 py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-[#34d9c3]/20 hover:shadow-xl hover:shadow-[#34d9c3]/30 hover:scale-105">
              <Download className="w-5 h-5" />
              Download on App Store
            </button>
            <button className="group bg-[#141922] hover:bg-[#1f2937] border-2 border-[#34d9c3]/30 hover:border-[#34d9c3] font-semibold px-8 py-4 rounded-xl transition-all duration-300 flex items-center justify-center gap-2 hover:scale-105">
              <Download className="w-5 h-5" />
              Get it on Google Play
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
