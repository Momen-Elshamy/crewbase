import '@/styles/globals.css';
import { CompanyProvider } from '@/src/lib/CompanyContext';

export default function App({ Component, pageProps }) {
  const getLayout = Component.getLayout || ((page) => page);
  return <CompanyProvider>{getLayout(<Component {...pageProps} />)}</CompanyProvider>;
}
