import type { PagesFunction } from "../../src/server/cloudflare";
import { jsonResponse } from "../../src/server/http";

export const onRequestGet: PagesFunction = () =>
  jsonResponse({
    ok: true,
    service: "triad-pages-functions",
    timestamp: new Date().toISOString(),
  });
