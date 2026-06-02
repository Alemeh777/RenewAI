'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';

const plans = [
  {
    id: 'starter',
    name: 'Starter',
    price: '€19',
    description: 'Perfect for small teams',
    features: [
      '50 AI email generations/month',
      'Up to 100 customers',
      'Web intelligence (Tavily)',
      'Email approval queue',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '€49',
    description: 'For growing businesses',
    features: [
      '200 AI email generations/month',
      'Up to 500 customers',
      'Web intelligence (Tavily)',
      'Email approval queue',
      'HubSpot integration',
      'Monthly proactive scheduler',
    ],
    popular: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '€99',
    description: 'For large teams',
    features: [
      'Unlimited AI email generations',
      'Unlimited customers',
      'Web intelligence (Tavily)',
      'Email approval queue',
      'HubSpot + Salesforce integration',
      'Monthly proactive scheduler',
      'Priority support',
    ],
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (planId: string) => {
  setLoading(planId);
  if (!isSignedIn) {
  router.push('/sign-in');
  return;
}
  try {
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: planId }),
    });

    const text = await res.text();
    console.log('Response:', text);

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      console.error('Not JSON:', text);
      alert('Server error. Please try again.');
      return;
    }

    if (data.url) {
      window.location.href = data.url;
    } else if (data.error === 'Unauthorized') {
      window.location.href = '/sign-in';
    } else {
      alert(data.error || 'Something went wrong');
    }
  } catch (err) {
    console.error(err);
  } finally {
    setLoading(null);
  }
};

  return (
    <main className="min-h-screen bg-gray-950 text-white py-20 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center mb-4">Simple Pricing</h1>
        <p className="text-center text-gray-400 mb-16">
          Choose the plan that fits your team
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl p-8 border ${
                plan.popular
                  ? 'border-yellow-500 bg-gray-900'
                  : 'border-gray-800 bg-gray-900'
              }`}
            >
              {plan.popular && (
                <span className="bg-yellow-500 text-black text-xs font-bold px-3 py-1 rounded-full mb-4 inline-block">
                  MOST POPULAR
                </span>
              )}
              <h2 className="text-2xl font-bold mb-1">{plan.name}</h2>
              <p className="text-gray-400 text-sm mb-4">{plan.description}</p>
              <p className="text-4xl font-bold mb-8">
                {plan.price}
                <span className="text-lg text-gray-400">/mo</span>
              </p>

              <ul className="space-y-3 mb-8">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <span className="text-yellow-500">✓</span> {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(plan.id)}
                disabled={loading === plan.id}
                className={`w-full py-3 rounded-xl font-semibold transition ${
                  plan.popular
                    ? 'bg-yellow-500 text-black hover:bg-yellow-400'
                    : 'bg-gray-700 text-white hover:bg-gray-600'
                }`}
              >
                {loading === plan.id ? 'Redirecting...' : 'Get Started'}
              </button>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}