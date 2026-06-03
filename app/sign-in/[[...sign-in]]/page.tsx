import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center',
      backgroundColor: '#0a0a0a'
    }}>
      <SignIn 
        forceRedirectUrl="/dashboard"
        routing="path"
        path="/sign-in"
      />
    </div>
  );
}