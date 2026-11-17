import Image from 'next/image';

export function WorkshopPartners() {
  return (
    <div className="demo-partners" aria-label="Agora and Google DeepMind">
      <Image className="demo-agora-logo" src="/assets/agora-logo-rgb-blue.svg" alt="Agora" width={85} height={25} priority />
      <span aria-hidden="true">×</span>
      <Image className="demo-google-logo" src="/assets/google-deepmind-lockup.png" alt="Google DeepMind" width={124} height={24} priority />
    </div>
  );
}
