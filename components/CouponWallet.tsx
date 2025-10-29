
import React from 'react';
import Placeholder from './Placeholder';

const IconCoupon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-brand-accent"><path d="M2 9a3 3 0 0 1 0 6v1a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-1a3 3 0 0 1 0-6V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"></path><path d="M13 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"></path></svg>
);

const CouponWallet: React.FC = () => {
  return (
    <Placeholder 
      title="Cuponera Digital Próximamente"
      description="Gestiona descuentos y promociones especiales para tus clientes. Crea cupones por evento, referidos o anticipos y adminístralos desde un solo lugar."
      icon={<IconCoupon />}
    />
  );
};

export default CouponWallet;
