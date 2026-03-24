import { redirect } from 'next/navigation';

export default function WorkerProfileRedirectPage() {
  redirect('/worker/dashboard');
}
