import { redirect } from 'next/navigation';

export default function WorkerReportsRedirectPage() {
  redirect('/worker/dashboard');
}
