import { redirect } from 'next/navigation';

export default function WorkerStockRedirectPage() {
  redirect('/worker/dashboard');
}
