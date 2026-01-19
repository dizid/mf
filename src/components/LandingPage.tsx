import Link from 'next/link'
import { Card } from '@/components/ui/Card'

export function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="px-4 pt-12 pb-16 text-center">
        <div className="max-w-lg mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Stop Guessing,<br />
            <span className="text-primary">Start Deciding</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Too many side projects, not enough time? App Rater helps you evaluate what to keep, kill, or double down on.
          </p>
          <Link
            href="/auth/signin"
            className="block mx-auto text-center font-semibold rounded-xl bg-primary text-white min-h-[64px] leading-[64px] px-8 text-lg max-w-xs"
          >
            Get Started Free
          </Link>
          <p className="text-sm text-gray-500 mt-3">
            No credit card required
          </p>
        </div>
      </section>

      {/* Problem Section */}
      <section className="px-4 py-12 bg-gray-50">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Sound familiar?
          </h2>
          <div className="space-y-4">
            {[
              '😩 You have 5+ side projects collecting dust',
              '🤔 You can\'t decide which one deserves your time',
              '😬 You feel guilty about abandoning projects',
              '📊 You wish you had data to make decisions',
            ].map((item, i) => (
              <Card key={i} className="text-body">
                {item}
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="px-4 py-12">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            How It Works
          </h2>
          <div className="space-y-6">
            {[
              {
                step: '1',
                title: 'Add Your Projects',
                desc: 'List all your side projects, apps, and ideas in one place.',
              },
              {
                step: '2',
                title: 'Rate Each One',
                desc: 'Score across 12 metrics: product quality, business potential, and personal satisfaction.',
              },
              {
                step: '3',
                title: 'Get Recommendations',
                desc: 'See data-driven advice: Invest, Keep, Pivot, Pause, or Drop.',
              },
            ].map((item) => (
              <div key={item.step} className="flex gap-4">
                <div className="w-10 h-10 bg-primary text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-body text-gray-600">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring System */}
      <section className="px-4 py-12 bg-gray-50">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Smart Scoring System
          </h2>
          <div className="grid gap-4">
            <Card>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">🎯</span>
                <h3 className="font-semibold text-gray-900">Product Quality</h3>
              </div>
              <p className="text-sm text-gray-600">
                Usability, value, features, polish, competition
              </p>
            </Card>
            <Card>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">💰</span>
                <h3 className="font-semibold text-gray-900">Business Viability</h3>
              </div>
              <p className="text-sm text-gray-600">
                Market size, monetization, maintenance, growth
              </p>
            </Card>
            <Card>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-2xl">❤️</span>
                <h3 className="font-semibold text-gray-900">Personal Investment</h3>
              </div>
              <p className="text-sm text-gray-600">
                Passion, learning value, portfolio pride
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Recommendations Preview */}
      <section className="px-4 py-12">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Clear Recommendations
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { emoji: '🚀', label: 'Invest', color: 'bg-green-50 text-green-700' },
              { emoji: '✅', label: 'Keep', color: 'bg-blue-50 text-blue-700' },
              { emoji: '🔄', label: 'Pivot', color: 'bg-purple-50 text-purple-700' },
              { emoji: '⏸️', label: 'Pause', color: 'bg-yellow-50 text-yellow-700' },
              { emoji: '🗑️', label: 'Drop', color: 'bg-red-50 text-red-700', full: true },
            ].map((rec) => (
              <Card
                key={rec.label}
                className={`${rec.color} text-center ${rec.full ? 'col-span-2' : ''}`}
              >
                <span className="text-2xl">{rec.emoji}</span>
                <div className="font-semibold mt-1">{rec.label}</div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Preview */}
      <section className="px-4 py-12 bg-gray-50">
        <div className="max-w-lg mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Simple Pricing
          </h2>
          <p className="text-center text-gray-600 mb-6">
            Start free, upgrade when you need more
          </p>
          <div className="space-y-4">
            <Card className="border-2 border-primary">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">Free</h3>
                  <p className="text-sm text-gray-500">Up to 3 projects</p>
                </div>
                <div className="text-2xl font-bold text-gray-900">$0</div>
              </div>
            </Card>
            <Card>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">Pro</h3>
                  <p className="text-sm text-gray-500">Up to 25 projects</p>
                </div>
                <div className="text-2xl font-bold text-gray-900">$9<span className="text-sm font-normal text-gray-500">/mo</span></div>
              </div>
            </Card>
            <Card>
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">Team</h3>
                  <p className="text-sm text-gray-500">Unlimited projects</p>
                </div>
                <div className="text-2xl font-bold text-gray-900">$29<span className="text-sm font-normal text-gray-500">/mo</span></div>
              </div>
            </Card>
          </div>
          <div className="text-center mt-6">
            <Link href="/pricing" className="text-primary font-medium">
              View full pricing details →
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to focus on what matters?
          </h2>
          <p className="text-gray-600 mb-8">
            Join indie developers who use App Rater to make better portfolio decisions.
          </p>
          <Link
            href="/auth/signin"
            className="block mx-auto text-center font-semibold rounded-xl bg-primary text-white min-h-[64px] leading-[64px] px-8 text-lg max-w-xs"
          >
            Start Rating Your Projects
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 border-t border-gray-200">
        <div className="max-w-lg mx-auto text-center text-sm text-gray-500">
          <p className="mb-4">© {new Date().getFullYear()} App Rater. All rights reserved.</p>
          <div className="flex justify-center gap-6">
            <Link href="/pricing" className="hover:text-gray-700">Pricing</Link>
            <Link href="/auth/signin" className="hover:text-gray-700">Sign In</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
