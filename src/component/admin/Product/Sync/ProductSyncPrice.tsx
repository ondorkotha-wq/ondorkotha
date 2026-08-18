"use client";

import ComingSoon from "@/component/Shared/ComingSoon";

const ProductSyncPrice = () => {
  return (
    <ComingSoon
      title="Price sync isn't available yet"
      description="Syncing product prices from an external source will live here once this module ships."
      backHref="/admin/products"
      backLabel="Back to Products"
    />
  );
};

export default ProductSyncPrice;
