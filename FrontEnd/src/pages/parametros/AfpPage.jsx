// archivo: src/pages/AfpPage.jsx
import React, { useState } from "react";
import AfpCabecera from "./AfpCabecera";
import AfpPeriodo from "./AfpPeriodo";

export default function AfpPage() {
  const [selectedAfp, setSelectedAfp] = useState(null);

  return (
    <div style={{ padding: 16 }}>
      <AfpCabecera onSelectAfp={setSelectedAfp} />
      <div style={{ marginTop: 30 }}>
        <AfpPeriodo selectedAfp={selectedAfp} />
      </div>
    </div>
  );
}
