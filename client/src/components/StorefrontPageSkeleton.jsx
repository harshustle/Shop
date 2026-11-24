import React from 'react';

const Block = ({ className = '' }) => <div className={`storefront-skeleton-block ${className}`} />;

const StorefrontPageSkeleton = ({ variant = 'catalog' }) => {
  if (variant === 'detail') {
    return (
      <main className="storefront-page-skeleton storefront-page-skeleton--detail" aria-label="Loading product" aria-busy="true">
        <Block className="h-10 w-48" />
        <div className="grid gap-5 lg:grid-cols-2">
          <Block className="min-h-[320px]" />
          <div className="space-y-4">
            <Block className="h-7 w-4/5" /><Block className="h-5 w-2/5" />
            <Block className="h-24 w-full" /><Block className="h-12 w-full" /><Block className="h-12 w-full" />
          </div>
        </div>
      </main>
    );
  }

  if (variant === 'account') {
    return (
      <main className="storefront-page-skeleton" aria-label="Loading account" aria-busy="true">
        <Block className="h-32 w-full" />
        <div className="grid gap-5 lg:grid-cols-3">
          <Block className="min-h-[420px]" />
          <Block className="min-h-[420px] lg:col-span-2" />
        </div>
      </main>
    );
  }

  return (
    <main className="storefront-page-skeleton" aria-label="Loading products" aria-busy="true">
      <div className="flex items-center justify-between gap-4">
        <Block className="h-8 w-40" /><Block className="h-8 w-24" />
      </div>
      <div className="flex gap-2 overflow-hidden">
        {[...Array(7)].map((_, index) => <Block key={index} className="h-9 min-w-24" />)}
      </div>
      <div className="storefront-skeleton-grid">
        {[...Array(12)].map((_, index) => (
          <div className="storefront-skeleton-card" key={index}>
            <Block className="storefront-skeleton-card__image" />
            <Block className="h-3 w-11/12" /><Block className="h-3 w-2/3" />
            <Block className="h-8 w-full mt-auto" />
          </div>
        ))}
      </div>
    </main>
  );
};

export default StorefrontPageSkeleton;
