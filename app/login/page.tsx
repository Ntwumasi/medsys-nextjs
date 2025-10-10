'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@heroui/react';
import { Input } from '@heroui/react';
import { Card, CardHeader, CardBody, CardFooter } from '@heroui/react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      // Store token in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // Redirect to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="flex flex-col gap-1 items-center pb-6">
          <h1 className="text-3xl font-bold text-gray-900">MedSys EMR</h1>
          <p className="text-sm text-gray-600">Sign in to your account</p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {error && (
              <div className="p-3 rounded-lg bg-danger-50 border border-danger-200">
                <p className="text-sm text-danger-700">{error}</p>
              </div>
            )}

            <Input
              type="email"
              label="Email"
              placeholder="Enter your email"
              value={email}
              onValueChange={setEmail}
              required
              variant="bordered"
              classNames={{
                input: "text-gray-900",
                label: "text-gray-700"
              }}
            />

            <Input
              type="password"
              label="Password"
              placeholder="Enter your password"
              value={password}
              onValueChange={setPassword}
              required
              variant="bordered"
              classNames={{
                input: "text-gray-900",
                label: "text-gray-700"
              }}
            />

            <Button
              type="submit"
              color="primary"
              size="lg"
              isLoading={loading}
              className="w-full mt-2"
            >
              Sign In
            </Button>
          </form>
        </CardBody>
        <CardFooter className="flex-col items-center gap-2">
          <p className="text-xs text-gray-500">Demo credentials:</p>
          <p className="text-sm text-gray-700 font-mono">
            admin@medsys.com / admin123
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
