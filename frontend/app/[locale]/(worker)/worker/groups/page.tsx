import { redirect } from 'next/navigation';

export default function WorkerGroupsRedirectPage() {
  redirect('/worker/dashboard');
}
