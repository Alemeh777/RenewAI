'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@clerk/nextjs';
const plans = [
  {
    id: 'free',
    name: 'Free',
    price: '€0',
    description: 'Try it out',
    features: [
      'Up to 5 customers',
      '1 user',
      'Unlimited email generations',
      'Renewal timeline',
      'Approval inbox',
    ],
  },
  {
    id: 'starter',
    name: 'Starter',
    price: '€19',
    description: 'For individual CSMs',
    features: [
      'Up to 50 customers',
      'Up to 2 users',
      'Unlimited email generations',
      'Renewal timeline',
      'Approval inbox',
      'Upsell signal detector',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    price: '€49',
    description: 'For growing CS teams',
    features: [
      'Up to 100 customers',
      'Up to 5 users',
      'Unlimited email generations',
      'Everything in Starter',
      'Proactive scheduler',
      'HubSpot integration',
    ],
    popular: true,
  },
  {
    id: 'scale',
    name: 'Scale',
    price: '€99',
    description: 'For larger teams',
    features: [
      'Unlimited customers',
      'Unlimited users',
      'Unlimited email generations',
      'Everything in Growth',
      'Dynamics 365 integration',
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
    const res = await fetch(`${window.location.origin}/api/stripe/checkout`, {
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
        <h1 className="text-4xl font-bold text-center mb-4">Pricing</h1>
<p className="text-center text-gray-400 mb-16">
  No annual contracts. No setup fees. Cancel anytime.
</p>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
                onClick={() => plan.id === 'free' ? router.push('/sign-in') : handleSubscribe(plan.id)}
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