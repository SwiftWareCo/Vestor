'use client';

import { UserButton } from '@neondatabase/auth/react';
import { cn } from '@/lib/utils';

interface UserButtonNavProps {
  className?: string;
}

export function UserButtonNav({ className }: UserButtonNavProps) {
  return (
    <div className={cn('flex items-center', className)}>
      <UserButton size='icon' className='cursor-pointer' />
    </div>
  );
}
