"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button className="primary-button" type="submit" disabled={pending}>
      {pending ? "Spremanje u sirovi sloj..." : "Spremi ručni unos"}
    </button>
  );
}
