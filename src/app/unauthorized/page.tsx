'use client';

import UnauthorizedComp from '@/component/Unauthorized';
import Link from 'next/link';

export default function Unauthorized() {
  return (
    <div>
      <UnauthorizedComp></UnauthorizedComp>
    </div>
  );
}