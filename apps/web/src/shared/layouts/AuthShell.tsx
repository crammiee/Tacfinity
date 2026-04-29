import { Outlet } from 'react-router-dom';
import { Card } from '@/shared/ui/card'; // shadcn card

export function AuthShell() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Card className="w-full max-w-md p-8">
        <Outlet /> {}
      </Card>
    </div>
  );
}
