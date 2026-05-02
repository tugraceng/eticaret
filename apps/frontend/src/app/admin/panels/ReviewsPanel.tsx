"use client";

import { ReviewsModerator } from "../ReviewsModerator";

export function ReviewsPanel({ token }: { token: string }) {
  return <ReviewsModerator token={token} />;
}
