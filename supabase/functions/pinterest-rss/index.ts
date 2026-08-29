import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { isCatalogProduct, renderCatalogItem, xmlEscape } from "./catalog_logic.mjs";

const SITE_URL = "https://polcaro1989.github.io/Achadinhos/";

Deno.serve(async (req: Request) => {
  if (req.method !== "GET" && req.method !== "HEAD") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  if (!supabaseUrl || !anonKey) return new Response("Supabase environment unavailable", { status: 500 });

  const supabase = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
  const { data, error } = await supabase
    .from("achadinhos_produtos")
    .select("id,nome,categoria,categoria_label,imagem_url,link_afiliado,preco_atual,preco_antigo,badge,avaliacao,vendas,beneficio,criado_em,atualizado_em,ativo")
    .eq("ativo", true)
    .order("criado_em", { ascending: true })
    .limit(200);

  if (error) {
    console.error("Pinterest RSS query failed", error);
    return new Response("Unable to build feed", { status: 500 });
  }

  const validProducts = (data ?? []).filter(isCatalogProduct);
  const items = validProducts.map(renderCatalogItem).join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0" xmlns:media="http://search.yahoo.com/mrss/">\n` +
    `  <channel>\n` +
    `    <title>Nexua Achadinhos</title>\n` +
    `    <link>${xmlEscape(SITE_URL)}</link>\n` +
    `    <description>Achadinhos e ofertas selecionadas automaticamente.</description>\n` +
    (items ? `${items}\n` : "") +
    `  </channel>\n</rss>\n`;
  const headers = {
    "Content-Type": "application/rss+xml; charset=utf-8",
    "Cache-Control": "public, max-age=300",
    "Access-Control-Allow-Origin": "*"
  };

  return req.method === "HEAD"
    ? new Response(null, { status: 200, headers })
    : new Response(xml, { status: 200, headers });
});
