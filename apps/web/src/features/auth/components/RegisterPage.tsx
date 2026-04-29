import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Loader2 } from 'lucide-react';
import { useRegisterMutation } from '../api';

export function RegisterPage() {
  const mutation = useRegisterMutation();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({ username, email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        disabled={mutation.isPending}
        required
      />
      <Input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        disabled={mutation.isPending}
        required
      />
      <Input
        type="password"
        placeholder="Password (min 8 chars)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        disabled={mutation.isPending}
        required
      />
      {mutation.error && <p className="text-sm text-red-500">{mutation.error.message}</p>}
      <Button type="submit" className="w-full" disabled={mutation.isPending}>
        {mutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registering...
          </>
        ) : (
          'Register'
        )}
      </Button>
      <p className="mt-4 text-sm text-center">
        Already have an account?{' '}
        <Link to="/login" className="text-blue-600 hover:underline">
          Login
        </Link>
      </p>
    </form>
  );
}
