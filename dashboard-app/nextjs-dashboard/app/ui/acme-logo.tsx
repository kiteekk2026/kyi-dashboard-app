import { GlobeAltIcon, CodeBracketIcon } from '@heroicons/react/24/outline';
import { lusitana } from '@/app/ui/fonts';

export default function AcmeLogo() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >
      <CodeBracketIcon className="h-16 w-16 rotate-[15deg]" />
      <p className="text-[44px] ml-1">Kyi</p>
    </div>
  );
}
