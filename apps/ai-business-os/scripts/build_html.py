#!/usr/bin/env python3
"""
build_html.py — Gerador de apresentações Entrelaços em HTML Editorial Premium

Gera um único arquivo .html standalone com tema cinematográfico, glassmorphism,
fontes premium (Satoshi + Inter Tight + JetBrains Mono), navegação por teclado e
suporte a print → PDF.

Estética: Apple, Linear, Notion, dashboards futuristas, dark mode sofisticado.
"""

import argparse
import json
import sys
import html as html_mod
from pathlib import Path

SQ = "'"  # single quote helper for CSS font names

BRAND_TOKENS = {
    "entrelacOS": """
:root {
  --black: #050506;
  --graphite: #101014;
  --graphite-2: #18181F;
  --ice: #F8F7FF;
  --gray-text: #A1A1AA;
  --gray-muted: #6B6B75;
  --purple-deep: #4B1FA6;
  --purple: #7C3AED;
  --lilac: #A78BFA;
  --orange: #FF7A1A;
  --turquoise: #2DD4BF;
  --border: rgba(167, 139, 250, 0.12);
  --border-soft: rgba(248, 247, 255, 0.06);
  --glow-purple: rgba(124, 58, 237, 0.35);
  --glow-orange: rgba(255, 122, 26, 0.25);
  --glow-turquoise: rgba(45, 212, 191, 0.25);
}
""",
    "tatiRibeiro": """
:root {
  --black: #0A0A1A;
  --graphite: #0F0F20;
  --graphite-2: #16162A;
  --ice: #FFF0F7;
  --gray-text: #C4A8B8;
  --gray-muted: #7A6B75;
  --purple-deep: #831843;
  --purple: #EC4899;
  --lilac: #F9A8D4;
  --orange: #C8963C;
  --turquoise: #5EEAD4;
  --border: rgba(249, 168, 212, 0.12);
  --border-soft: rgba(255, 240, 247, 0.06);
  --glow-purple: rgba(236, 72, 153, 0.35);
  --glow-orange: rgba(200, 150, 60, 0.25);
  --glow-turquoise: rgba(94, 234, 212, 0.25);
}
""",
}

CSS_TOKENS = BRAND_TOKENS["entrelacOS"]  # fallback padrão

CSS_BASE = """
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  background: var(--black); color: var(--ice);
  font-family: 'Inter Tight', -apple-system, BlinkMacSystemFont, sans-serif;
  overflow: hidden; height: 100vh; width: 100vw;
  -webkit-font-smoothing: antialiased;
}
.deck { position: relative; width: 100vw; height: 100vh; }
.slide {
  position: absolute; inset: 0;
  display: flex; flex-direction: column;
  padding: 7vh 8vw; opacity: 0;
  transition: opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
}
.slide.active { opacity: 1; z-index: 10; }

.eyebrow {
  font: 600 13px/1 'Inter Tight', sans-serif;
  letter-spacing: 0.2em; text-transform: uppercase; color: var(--lilac);
}
.h-display {
  font-family: 'Satoshi', 'General Sans', 'Inter Tight', sans-serif;
  font-weight: 900; letter-spacing: -0.03em; line-height: 0.95; color: var(--ice);
}
.h-title {
  font-family: 'Satoshi', 'General Sans', 'Inter Tight', sans-serif;
  font-weight: 700; letter-spacing: -0.02em; line-height: 1.05; color: var(--ice);
}
.body {
  font: 400 clamp(16px, 1.4vw, 22px)/1.5 'Inter Tight', sans-serif;
  color: var(--gray-text);
}
.mono { font-family: 'JetBrains Mono', monospace; }

.grid-bg {
  position: absolute; inset: 0;
  background-image:
    linear-gradient(var(--border-soft) 1px, transparent 1px),
    linear-gradient(90deg, var(--border-soft) 1px, transparent 1px);
  background-size: 80px 80px; opacity: 0.5; pointer-events: none;
}
.vignette {
  position: absolute; inset: 0;
  background: radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 100%);
  pointer-events: none;
}
.glow-purple-radial {
  position: absolute;
  background: radial-gradient(circle, var(--glow-purple), transparent 70%);
  filter: blur(80px); pointer-events: none;
}
.grain {
  position: absolute; inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
  opacity: 0.05; pointer-events: none; mix-blend-mode: overlay;
}

.glass {
  background: rgba(248, 247, 255, 0.04);
  backdrop-filter: blur(24px); -webkit-backdrop-filter: blur(24px);
  border: 1px solid var(--border); border-radius: 20px;
}

.chip {
  font: 500 13px/1 'Inter Tight', sans-serif; color: var(--gray-text);
  background: var(--graphite-2); border: 1px solid var(--border-soft);
  padding: 8px 16px; border-radius: 100px; display: inline-block;
}

.pill {
  font: 600 11px/1 'JetBrains Mono', monospace;
  letter-spacing: 0.1em; text-transform: uppercase;
  padding: 6px 12px; border-radius: 100px;
  display: inline-flex; align-items: center; gap: 8px;
}
.pill::before {
  content: ''; width: 6px; height: 6px; border-radius: 50%;
  background: currentColor; box-shadow: 0 0 8px currentColor;
}
.pill-purple { color: var(--lilac); background: rgba(124,58,237,0.1); }
.pill-orange { color: var(--orange); background: rgba(255,122,26,0.1); }
.pill-turquoise { color: var(--turquoise); background: rgba(45,212,191,0.1); }

.btn-cta {
  display: inline-flex; align-items: center; gap: 12px;
  font: 600 18px/1 'Inter Tight', sans-serif;
  background: var(--orange); color: var(--black);
  padding: 18px 32px; border-radius: 100px; border: none; cursor: pointer;
  box-shadow: 0 0 60px var(--glow-orange);
  transition: transform 0.2s ease;
}
.btn-cta:hover { transform: translateY(-2px); }

.footer {
  margin-top: auto; padding-top: 40px;
  display: flex; justify-content: space-between; align-items: flex-end;
  font: 500 13px 'Inter Tight', sans-serif; color: var(--gray-muted);
}
.footer .pagination { font-family: 'JetBrains Mono', monospace; letter-spacing: 0.1em; }

.nav-bar {
  position: fixed; bottom: 24px; left: 50%; transform: translateX(-50%);
  display: flex; gap: 16px; align-items: center;
  background: rgba(16, 16, 20, 0.7); backdrop-filter: blur(24px);
  border: 1px solid var(--border); border-radius: 100px;
  padding: 10px 20px; z-index: 100;
}
.nav-btn {
  background: transparent; color: var(--ice); border: none;
  font-size: 18px; width: 36px; height: 36px; border-radius: 50%; cursor: pointer;
  transition: background 0.2s;
}
.nav-btn:hover { background: rgba(248,247,255,0.06); }
.counter {
  font: 500 13px 'JetBrains Mono', monospace;
  color: var(--gray-text); letter-spacing: 0.1em;
  min-width: 60px; text-align: center;
}
.progress {
  position: fixed; top: 0; left: 0; height: 2px;
  background: linear-gradient(90deg, var(--purple), var(--lilac));
  transition: width 0.4s cubic-bezier(0.4,0,0.2,1);
  z-index: 200; box-shadow: 0 0 12px var(--glow-purple);
}

@keyframes blink { 50% { opacity: 0; } }

@media print {
  .slide {
    position: relative; opacity: 1 !important;
    page-break-after: always; width: 100vw; height: 100vh; break-inside: avoid;
  }
  .nav-bar, .progress { display: none; }
  body { overflow: visible; } .deck { height: auto; }
}
@page { size: 1920px 1080px landscape; margin: 0; }
"""


def esc(s):
    if s is None:
        return ""
    return html_mod.escape(str(s))


# ---------------- RENDERERS ----------------
# Estratégia: cada renderer usa .format() ao invés de f-string — assim podemos ter
# backslashes/aspas livremente. Variáveis condicionais são preparadas antes.


def render_cinematic_poster(d, idx, total):
    tag = d.get("tag", "")
    title = d.get("title", "")
    subtitle = d.get("subtitle", "")
    author = d.get("author", "Tati Ribeiro · Entrelaços Psicologia")
    accent_word = d.get("accent_word", "")

    if accent_word and accent_word in title:
        title_html = title.replace(accent_word, '<span style="color:var(--orange)">{}</span>'.format(esc(accent_word)))
    else:
        title_html = esc(title)

    tag_html = '<span class="eyebrow">{}</span>'.format(esc(tag)) if tag else ""
    sub_html = '<p class="body" style="margin-top:24px;max-width:60ch;font-size:clamp(18px,1.6vw,26px)">{}</p>'.format(esc(subtitle)) if subtitle else ""

    return """
<section class="slide" data-layout="cinematic-poster">
  <div class="grid-bg"></div>
  <div class="vignette"></div>
  <div class="glow-purple-radial" style="top:40%;left:-10%;width:60%;height:80%"></div>
  <div class="grain"></div>
  {tag_html}
  <h1 class="h-display" style="font-size:clamp(64px,8.5vw,128px);margin-top:auto;max-width:16ch">
    {title_html}
  </h1>
  {sub_html}
  <div class="footer">
    <span>{author}</span>
    <span class="pagination">{idx:02d} / {total:02d}</span>
  </div>
</section>
""".format(tag_html=tag_html, title_html=title_html, sub_html=sub_html,
           author=esc(author), idx=idx, total=total)


def render_search_interface(d, idx, total):
    eyebrow = d.get("eyebrow", "A pergunta que organiza tudo")
    query = d.get("query", "")
    chips = d.get("chips", [])
    section = d.get("section", "MÓDULO")
    chips_html = "".join('<span class="chip">{}</span>'.format(esc(c)) for c in chips)
    chips_block = '<div style="margin-top:32px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap">{}</div>'.format(chips_html) if chips else ""

    return """
<section class="slide" data-layout="search-interface">
  <div class="grid-bg"></div>
  <div class="glow-purple-radial" style="top:20%;left:30%;width:40%;height:60%"></div>
  <div style="margin:auto;width:min(90%,960px);text-align:center">
    <span class="eyebrow">{eyebrow}</span>
    <div style="margin-top:48px;display:flex;align-items:center;gap:16px;
                background:var(--graphite);border:1px solid var(--border);
                border-radius:18px;padding:22px 28px;
                box-shadow:0 0 80px var(--glow-purple)">
      <span style="color:var(--lilac);font-size:24px">⌕</span>
      <span style="font:500 clamp(18px,2vw,26px)/1 'Inter Tight';color:var(--ice);text-align:left;flex:1">{query}</span>
      <span style="width:2px;height:28px;background:var(--orange);animation:blink 1s infinite"></span>
    </div>
    {chips_block}
  </div>
  <div class="footer">
    <span>Entrelaços · {section}</span>
    <span class="pagination">{idx:02d} / {total:02d}</span>
  </div>
</section>
""".format(eyebrow=esc(eyebrow), query=esc(query), chips_block=chips_block,
           section=esc(section), idx=idx, total=total)


def render_dashboard_diagnostic(d, idx, total):
    title = d.get("title", "")
    metrics = d.get("metrics", [])
    cards = []
    for m in metrics[:4]:
        color_var = {"purple": "var(--lilac)", "orange": "var(--orange)", "turquoise": "var(--turquoise)"}.get(m.get("color", "purple"), "var(--lilac)")
        change = m.get("change", "")
        change_html = '<div style="margin-top:8px;font:500 13px {sq}Inter Tight{sq};color:var(--gray-text)">{c}</div>'.format(sq=SQ, c=esc(change)) if change else ""
        cards.append("""
        <div class="glass" style="padding:28px 32px;flex:1;min-width:220px">
          <div style="font:600 11px {sq}JetBrains Mono{sq};letter-spacing:0.15em;text-transform:uppercase;color:var(--gray-muted)">{label}</div>
          <div style="font:900 clamp(40px,4vw,64px)/1 {sq}Satoshi{sq};color:{color};margin-top:12px;letter-spacing:-0.03em">{value}</div>
          {change_html}
        </div>
        """.format(sq=SQ, label=esc(m.get("label", "")), color=color_var,
                   value=esc(m.get("value", "")), change_html=change_html))

    return """
<section class="slide" data-layout="dashboard-diagnostic">
  <div class="grid-bg"></div>
  <h2 class="h-title" style="font-size:clamp(36px,4.5vw,56px);max-width:18ch">{title}</h2>
  <div style="margin-top:auto;margin-bottom:auto;display:flex;gap:20px;flex-wrap:wrap">
    {cards}
  </div>
  <div class="footer">
    <span>Diagnóstico · Entrelaços</span>
    <span class="pagination">{idx:02d} / {total:02d}</span>
  </div>
</section>
""".format(title=esc(title), cards="".join(cards), idx=idx, total=total)


def render_framework_cards(d, idx, total):
    title = d.get("title", "")
    items = d.get("items", [])
    accents = ["var(--lilac)", "var(--orange)", "var(--turquoise)", "var(--lilac)"]
    cards = []
    for k, it in enumerate(items[:4]):
        c = accents[k % len(accents)]
        cards.append("""
        <div class="glass" style="padding:32px;flex:1;min-width:240px">
          <span class="pill" style="color:{c};background:rgba(124,58,237,0.08)">{tag}</span>
          <h3 class="h-title" style="font-size:clamp(20px,2vw,28px);margin-top:24px;letter-spacing:-0.01em">{ttl}</h3>
          <p style="margin-top:12px;font:400 15px/1.6 {sq}Inter Tight{sq};color:var(--gray-text)">{body}</p>
        </div>
        """.format(c=c, sq=SQ, tag=esc(it.get("tag", "{:02d}".format(k+1))),
                   ttl=esc(it.get("title", "")), body=esc(it.get("body", ""))))

    return """
<section class="slide" data-layout="framework-cards">
  <div class="grid-bg"></div>
  <h2 class="h-title" style="font-size:clamp(36px,4vw,52px);max-width:20ch">{title}</h2>
  <div style="margin-top:48px;display:flex;gap:20px;flex-wrap:wrap;align-items:stretch">
    {cards}
  </div>
  <div class="footer">
    <span>Framework · Entrelaços</span>
    <span class="pagination">{idx:02d} / {total:02d}</span>
  </div>
</section>
""".format(title=esc(title), cards="".join(cards), idx=idx, total=total)


def render_terminal_command(d, idx, total):
    eyebrow = d.get("eyebrow", "Execute uma ideia")
    command = d.get("command", "")
    output = d.get("output", "")
    output_block = '<div style="margin-top:20px;color:var(--gray-text);white-space:pre-wrap">{}</div>'.format(esc(output)) if output else ""

    return """
<section class="slide" data-layout="terminal-command">
  <div class="vignette"></div>
  <div style="margin:auto;width:min(95%,1100px)">
    <span class="eyebrow">{eyebrow}</span>
    <div style="margin-top:32px;background:var(--black);border:1px solid var(--border);
                border-radius:16px;box-shadow:0 0 80px var(--glow-purple);overflow:hidden">
      <div style="padding:14px 20px;border-bottom:1px solid var(--border);display:flex;gap:8px;align-items:center">
        <span style="width:12px;height:12px;border-radius:50%;background:#FF5F56"></span>
        <span style="width:12px;height:12px;border-radius:50%;background:#FFBD2E"></span>
        <span style="width:12px;height:12px;border-radius:50%;background:#27C93F"></span>
        <span class="mono" style="margin-left:16px;font-size:13px;color:var(--gray-muted)">entrelacos · psicologia · zsh</span>
      </div>
      <div style="padding:32px 28px;font-family:{sq}JetBrains Mono{sq},monospace;font-size:clamp(16px,1.6vw,22px);line-height:1.6">
        <div>
          <span style="color:var(--orange)">entrelacos</span><span style="color:var(--gray-muted)">@psi</span> <span style="color:var(--turquoise)">~</span> <span style="color:var(--ice)">$</span> <span style="color:var(--ice)">{command}</span><span style="background:var(--orange);width:10px;height:18px;display:inline-block;animation:blink 1s infinite;vertical-align:middle"></span>
        </div>
        {output_block}
      </div>
    </div>
  </div>
  <div class="footer">
    <span>Terminal · Entrelaços</span>
    <span class="pagination">{idx:02d} / {total:02d}</span>
  </div>
</section>
""".format(sq=SQ, eyebrow=esc(eyebrow), command=esc(command),
           output_block=output_block, idx=idx, total=total)


def render_journey_map(d, idx, total):
    title = d.get("title", "")
    nodes = d.get("nodes")
    if not nodes:
        # fallback: build from "steps" (list of strings)
        steps = d.get("steps", [])
        nodes = [{"label": s, "status": "current" if i == len(steps)//2 else ("done" if i < len(steps)//2 else "next")} for i, s in enumerate(steps)]

    nodes_html = []
    for n in nodes:
        status = n.get("status", "next")
        if status == "done":
            color, opacity = "var(--lilac)", "0.5"
        elif status == "current":
            color, opacity = "var(--orange)", "1"
        else:
            color, opacity = "var(--gray-muted)", "0.6"
        status_chip = '<span style="margin-top:6px;font:600 10px {sq}JetBrains Mono{sq};letter-spacing:0.15em;text-transform:uppercase;color:{c}">{s}</span>'.format(sq=SQ, c=color, s=esc(status)) if status == "current" else ""
        nodes_html.append("""
        <div style="display:flex;flex-direction:column;align-items:center;flex:1;opacity:{op};position:relative">
          <div style="width:24px;height:24px;border-radius:50%;background:{c};box-shadow:0 0 24px {c};border:2px solid var(--black)"></div>
          <span style="margin-top:20px;font:500 13px/1.4 {sq}Inter Tight{sq};color:var(--ice);text-align:center;max-width:14ch">{label}</span>
          {status_chip}
        </div>
        """.format(sq=SQ, c=color, op=opacity, label=esc(n.get("label", "")), status_chip=status_chip))

    return """
<section class="slide" data-layout="journey-map">
  <div class="grid-bg"></div>
  <h2 class="h-title" style="font-size:clamp(36px,4vw,52px);max-width:22ch">{title}</h2>
  <div style="margin-top:auto;margin-bottom:auto;position:relative;display:flex;justify-content:space-between;align-items:flex-start">
    <div style="position:absolute;top:11px;left:5%;right:5%;height:2px;background:linear-gradient(90deg,var(--lilac),var(--orange) 50%,var(--gray-muted));opacity:0.3;z-index:-1"></div>
    {nodes}
  </div>
  <div class="footer">
    <span>Mapa · Entrelaços</span>
    <span class="pagination">{idx:02d} / {total:02d}</span>
  </div>
</section>
""".format(title=esc(title), nodes="".join(nodes_html), idx=idx, total=total)


def render_before_after(d, idx, total):
    title = d.get("title", "")
    before = d.get("before") or d.get("left", {})
    after = d.get("after") or d.get("right", {})

    # Aceita formato two-column do PPTX (left/right com items[]) ou before/after com title/body
    def _normalize(blk):
        if "body" in blk:
            return blk.get("title", ""), blk.get("body", "")
        items = blk.get("items", [])
        return blk.get("title", ""), " · ".join(items)

    btitle, bbody = _normalize(before)
    atitle, abody = _normalize(after)

    return """
<section class="slide" data-layout="before-after">
  <h2 class="h-title" style="font-size:clamp(32px,3.5vw,48px);max-width:22ch">{title}</h2>
  <div style="margin-top:48px;display:grid;grid-template-columns:1fr 1fr;gap:24px;flex:1;align-items:stretch">
    <div style="padding:40px;background:var(--graphite);border:1px solid var(--border-soft);border-radius:20px;display:flex;flex-direction:column">
      <span class="pill" style="color:var(--gray-muted);background:rgba(255,255,255,0.04);align-self:flex-start">Antes</span>
      <h3 class="h-title" style="font-size:clamp(24px,2.5vw,36px);margin-top:24px;color:var(--gray-text)">{btitle}</h3>
      <p style="margin-top:16px;font:400 17px/1.6 {sq}Inter Tight{sq};color:var(--gray-muted)">{bbody}</p>
    </div>
    <div class="glass" style="padding:40px;display:flex;flex-direction:column;box-shadow:0 0 60px var(--glow-purple)">
      <span class="pill pill-orange" style="align-self:flex-start">Depois</span>
      <h3 class="h-title" style="font-size:clamp(24px,2.5vw,36px);margin-top:24px;color:var(--ice)">{atitle}</h3>
      <p style="margin-top:16px;font:400 17px/1.6 {sq}Inter Tight{sq};color:var(--gray-text)">{abody}</p>
    </div>
  </div>
  <div class="footer">
    <span>Comparação · Entrelaços</span>
    <span class="pagination">{idx:02d} / {total:02d}</span>
  </div>
</section>
""".format(sq=SQ, title=esc(title), btitle=esc(btitle), bbody=esc(bbody),
           atitle=esc(atitle), abody=esc(abody), idx=idx, total=total)


def render_myth_truth(d, idx, total):
    myth = d.get("myth", "")
    truth = d.get("truth", "")
    return """
<section class="slide" data-layout="myth-truth">
  <div class="vignette"></div>
  <div style="margin:auto;width:min(90%,900px);display:flex;flex-direction:column;gap:32px">
    <div style="padding:32px 36px;border:1px solid rgba(255,80,80,0.2);border-radius:20px;background:rgba(255,80,80,0.04)">
      <span class="pill" style="color:#FF6B6B;background:rgba(255,107,107,0.08)">Mito</span>
      <p style="margin-top:20px;font:600 clamp(22px,2.4vw,32px)/1.3 {sq}Satoshi{sq};color:var(--gray-text);text-decoration:line-through;text-decoration-color:rgba(255,107,107,0.6);text-decoration-thickness:2px">{myth}</p>
    </div>
    <div class="glass" style="padding:36px 40px;box-shadow:0 0 80px var(--glow-orange)">
      <span class="pill pill-orange">Verdade</span>
      <p style="margin-top:20px;font:700 clamp(26px,2.8vw,40px)/1.25 {sq}Satoshi{sq};color:var(--ice);letter-spacing:-0.02em">{truth}</p>
    </div>
  </div>
  <div class="footer">
    <span>Reposicionamento · Entrelaços</span>
    <span class="pagination">{idx:02d} / {total:02d}</span>
  </div>
</section>
""".format(sq=SQ, myth=esc(myth), truth=esc(truth), idx=idx, total=total)


def render_saveable_summary(d, idx, total):
    eyebrow = d.get("eyebrow", "Salve este slide")
    title = d.get("title", "")
    points = d.get("points") or d.get("items") or []
    bullets = []
    for k, p in enumerate(points[:5]):
        bullets.append("""
        <li style="display:flex;gap:20px;align-items:flex-start;padding:16px 0;border-bottom:1px solid var(--border-soft)">
          <span style="font:900 22px/1 {sq}Satoshi{sq};color:var(--lilac);min-width:32px;letter-spacing:-0.02em">{n:02d}</span>
          <span style="font:500 clamp(17px,1.6vw,22px)/1.4 {sq}Inter Tight{sq};color:var(--ice);flex:1">{txt}</span>
        </li>
        """.format(sq=SQ, n=k+1, txt=esc(p)))

    return """
<section class="slide" data-layout="saveable-summary">
  <div class="grid-bg"></div>
  <div class="glow-purple-radial" style="top:-10%;right:-10%;width:50%;height:60%"></div>
  <span class="eyebrow">{eyebrow}</span>
  <h2 class="h-title" style="font-size:clamp(36px,4vw,56px);margin-top:16px;max-width:18ch">{title}</h2>
  <ul style="margin-top:40px;list-style:none;max-width:80ch">
    {bullets}
  </ul>
  <div class="footer">
    <span>@entrelacos.psi</span>
    <span class="pagination">{idx:02d} / {total:02d}</span>
  </div>
</section>
""".format(eyebrow=esc(eyebrow), title=esc(title), bullets="".join(bullets),
           idx=idx, total=total)


def render_system_cta(d, idx, total):
    title = d.get("title", "")
    subtitle = d.get("subtitle", "")
    cta_label = d.get("cta_label", "Quero fazer parte")
    url = d.get("url", "entrelacospsicologia.com.br")
    pill_text = d.get("pill_text", "ABERTO AGORA")
    sub_html = '<p class="body" style="margin-top:20px;font-size:clamp(18px,1.6vw,24px);max-width:60ch">{}</p>'.format(esc(subtitle)) if subtitle else ""

    return """
<section class="slide" data-layout="system-cta">
  <div class="grid-bg"></div>
  <div class="glow-purple-radial" style="top:30%;left:20%;width:60%;height:60%"></div>
  <div style="margin:auto;width:min(95%,900px);text-align:left">
    <span class="pill pill-turquoise">{pill}</span>
    <h2 class="h-display" style="font-size:clamp(48px,6vw,88px);margin-top:32px;max-width:18ch">{title}</h2>
    {sub_html}
    <div style="margin-top:48px;display:flex;align-items:center;gap:24px;flex-wrap:wrap">
      <button class="btn-cta">{cta} <span style="font-size:22px">→</span></button>
      <span class="mono" style="color:var(--gray-text);font-size:14px;letter-spacing:0.05em">{url}</span>
    </div>
  </div>
  <div class="footer">
    <span>Entrelaços Psicologia</span>
    <span class="pagination">{idx:02d} / {total:02d}</span>
  </div>
</section>
""".format(pill=esc(pill_text), title=esc(title), sub_html=sub_html,
           cta=esc(cta_label), url=esc(url), idx=idx, total=total)


def render_manifesto_fullscreen(d, idx, total):
    text = d.get("text", "")
    signature = d.get("signature", "")
    sig_html = '<p style="margin-top:32px;font:500 16px {sq}Inter Tight{sq};color:var(--lilac);font-style:italic">— {s}</p>'.format(sq=SQ, s=esc(signature)) if signature else ""
    return """
<section class="slide" data-layout="manifesto-fullscreen">
  <div class="grain"></div>
  <div class="vignette"></div>
  <div class="glow-purple-radial" style="top:20%;left:25%;width:50%;height:60%;filter:blur(120px);opacity:0.6"></div>
  <div style="margin:auto;width:min(90%,1100px)">
    <p class="h-display" style="font-size:clamp(48px,6.5vw,104px);line-height:1.05;letter-spacing:-0.03em">{text}</p>
    {sig_html}
  </div>
  <div class="footer">
    <span>Manifesto · Entrelaços</span>
    <span class="pagination">{idx:02d} / {total:02d}</span>
  </div>
</section>
""".format(text=esc(text), sig_html=sig_html, idx=idx, total=total)


def render_concept(d, idx, total):
    title = d.get("title", "")
    body = d.get("body", "")
    body_html = '<p class="body" style="margin-top:32px;max-width:65ch;font-size:clamp(18px,1.7vw,26px)">{}</p>'.format(esc(body)) if body else ""
    return """
<section class="slide" data-layout="concept">
  <div class="grid-bg"></div>
  <div class="glow-purple-radial" style="top:30%;right:-10%;width:50%;height:60%"></div>
  <h2 class="h-title" style="font-size:clamp(40px,5vw,72px);margin-top:auto;max-width:18ch">{title}</h2>
  {body_html}
  <div class="footer" style="margin-top:auto">
    <span>Entrelaços</span>
    <span class="pagination">{idx:02d} / {total:02d}</span>
  </div>
</section>
""".format(title=esc(title), body_html=body_html, idx=idx, total=total)


def render_quote(d, idx, total):
    quote = d.get("quote") or d.get("question", "")
    attribution = d.get("attribution", "")
    attr_html = '<p style="margin-top:32px;font:500 18px {sq}Inter Tight{sq};color:var(--lilac)">— {a}</p>'.format(sq=SQ, a=esc(attribution)) if attribution else ""
    return """
<section class="slide" data-layout="quote">
  <div class="vignette"></div>
  <div style="margin:auto;width:min(90%,1000px)">
    <span style="font:900 200px/0.5 {sq}Satoshi{sq};color:var(--purple);opacity:0.4;display:block">"</span>
    <p style="font:700 italic clamp(32px,3.8vw,56px)/1.2 {sq}Satoshi{sq};color:var(--ice);letter-spacing:-0.02em;margin-top:-40px">{quote}</p>
    {attr_html}
  </div>
  <div class="footer">
    <span>Entrelaços</span>
    <span class="pagination">{idx:02d} / {total:02d}</span>
  </div>
</section>
""".format(sq=SQ, quote=esc(quote), attr_html=attr_html, idx=idx, total=total)


def render_agenda(d, idx, total):
    title = d.get("title", "O que vamos atravessar")
    items = d.get("items", [])
    items_html = []
    for k, it in enumerate(items):
        items_html.append("""
        <div style="display:flex;gap:24px;padding:20px 0;border-bottom:1px solid var(--border-soft);align-items:center">
          <span class="mono" style="font-size:14px;color:var(--lilac);letter-spacing:0.1em;min-width:48px">{n:02d}</span>
          <span style="font:500 clamp(18px,1.8vw,24px) {sq}Inter Tight{sq};color:var(--ice);flex:1">{txt}</span>
        </div>
        """.format(sq=SQ, n=k+1, txt=esc(it)))
    return """
<section class="slide" data-layout="agenda">
  <div class="grid-bg"></div>
  <span class="eyebrow">Roteiro</span>
  <h2 class="h-title" style="font-size:clamp(40px,4.5vw,64px);margin-top:12px;max-width:18ch">{title}</h2>
  <div style="margin-top:32px;max-width:80ch">
    {items}
  </div>
  <div class="footer">
    <span>Agenda · Entrelaços</span>
    <span class="pagination">{idx:02d} / {total:02d}</span>
  </div>
</section>
""".format(title=esc(title), items="".join(items_html), idx=idx, total=total)


def render_big_stat(d, idx, total):
    stat = d.get("stat", "")
    label = d.get("label", "")
    subline = d.get("subline", "")
    source = d.get("source", "")
    label_html = '<p style="margin-top:32px;font:600 clamp(22px,2.4vw,32px) {sq}Satoshi{sq};color:var(--ice);max-width:50ch;margin-left:auto;margin-right:auto">{l}</p>'.format(sq=SQ, l=esc(label)) if label else ""
    sub_html = '<p style="margin-top:12px;font:400 16px/1.5 {sq}Inter Tight{sq};color:var(--gray-text);max-width:65ch;margin-left:auto;margin-right:auto">{s}</p>'.format(sq=SQ, s=esc(subline)) if subline else ""
    src_html = '<p style="margin-top:32px;font:400 13px italic {sq}Inter Tight{sq};color:var(--gray-muted)">— {s}</p>'.format(sq=SQ, s=esc(source)) if source else ""
    return """
<section class="slide" data-layout="big-stat">
  <div class="grid-bg"></div>
  <div class="glow-purple-radial" style="top:10%;left:25%;width:50%;height:60%"></div>
  <div style="margin:auto;text-align:center;width:min(95%,1100px)">
    <span class="h-display" style="font-size:clamp(120px,18vw,240px);background:linear-gradient(180deg,var(--lilac),var(--purple));-webkit-background-clip:text;-webkit-text-fill-color:transparent;letter-spacing:-0.04em">{stat}</span>
    {label_html}
    {sub_html}
    {src_html}
  </div>
  <div class="footer">
    <span>Dado · Entrelaços</span>
    <span class="pagination">{idx:02d} / {total:02d}</span>
  </div>
</section>
""".format(stat=esc(stat), label_html=label_html, sub_html=sub_html,
           src_html=src_html, idx=idx, total=total)


def render_closing(d, idx, total):
    text = d.get("text", "Obrigada.")
    subtext = d.get("subtext", "")
    signature = d.get("signature", "Tati Ribeiro · Entrelaços Psicologia")
    socials = d.get("socials", "")
    sub_html = '<p class="body" style="margin-top:32px;font-size:clamp(18px,1.8vw,26px)">{}</p>'.format(esc(subtext)) if subtext else ""
    soc_html = '<p style="margin-top:8px;font:400 13px {sq}Inter Tight{sq};color:var(--gray-muted)">{s}</p>'.format(sq=SQ, s=esc(socials)) if socials else ""
    return """
<section class="slide" data-layout="closing">
  <div class="grain"></div>
  <div class="vignette"></div>
  <div class="glow-purple-radial" style="top:30%;left:25%;width:50%;height:60%;filter:blur(120px)"></div>
  <div style="margin:auto;text-align:center;width:min(90%,900px)">
    <h2 class="h-display" style="font-size:clamp(56px,7vw,112px)">{text}</h2>
    {sub_html}
  </div>
  <div style="margin-top:auto;text-align:center">
    <p style="font:500 14px {sq}Inter Tight{sq};color:var(--lilac);letter-spacing:0.1em;text-transform:uppercase">{sig}</p>
    {soc_html}
  </div>
</section>
""".format(sq=SQ, text=esc(text), sub_html=sub_html, sig=esc(signature),
           soc_html=soc_html)


RENDERERS = {
    "cinematic-poster": render_cinematic_poster,
    "cover": render_cinematic_poster,
    "search-interface": render_search_interface,
    "dashboard-diagnostic": render_dashboard_diagnostic,
    "framework-cards": render_framework_cards,
    "three-grid": render_framework_cards,
    "four-grid": render_framework_cards,
    "terminal-command": render_terminal_command,
    "journey-map": render_journey_map,
    "step-flow": render_journey_map,
    "before-after": render_before_after,
    "two-column": render_before_after,
    "myth-truth": render_myth_truth,
    "saveable-summary": render_saveable_summary,
    "bullets": render_saveable_summary,
    "system-cta": render_system_cta,
    "cta": render_system_cta,
    "manifesto-fullscreen": render_manifesto_fullscreen,
    "manifesto": render_manifesto_fullscreen,
    "concept": render_concept,
    "quote": render_quote,
    "exercise": render_quote,
    "agenda": render_agenda,
    "big-stat": render_big_stat,
    "closing": render_closing,
}


HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{title} · Entrelaços Psicologia</title>
  <link rel="preconnect" href="https://api.fontshare.com">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&f[]=general-sans@400,500,600,700&display=swap" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
{tokens}
{base}
  </style>
</head>
<body>
  <div class="progress" id="progress"></div>
  <div class="deck" id="deck">
{slides_html}
  </div>
  <nav class="nav-bar">
    <button class="nav-btn" id="prev" aria-label="Anterior">←</button>
    <span class="counter"><span id="cur">01</span> / <span id="total">{total:02d}</span></span>
    <button class="nav-btn" id="next" aria-label="Próximo">→</button>
  </nav>
  <script>
    (function() {{
      const slides = document.querySelectorAll('.slide');
      const total = slides.length;
      let i = 0;
      slides[0].classList.add('active');
      function show(n) {{
        slides[i].classList.remove('active');
        i = ((n % total) + total) % total;
        slides[i].classList.add('active');
        document.getElementById('cur').textContent = String(i+1).padStart(2, '0');
        document.getElementById('progress').style.width = ((i+1)/total*100) + '%';
      }}
      document.getElementById('next').addEventListener('click', function(){{ show(i+1); }});
      document.getElementById('prev').addEventListener('click', function(){{ show(i-1); }});
      document.addEventListener('keydown', function(e) {{
        if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {{ e.preventDefault(); show(i+1); }}
        if (e.key === 'ArrowLeft' || e.key === 'PageUp') {{ e.preventDefault(); show(i-1); }}
        if (e.key === 'Home') {{ e.preventDefault(); show(0); }}
        if (e.key === 'End') {{ e.preventDefault(); show(total-1); }}
      }});
      document.getElementById('progress').style.width = (1/total*100) + '%';
    }})();
  </script>
</body>
</html>
"""


def build_html(deck_data, output_path, brand="entrelacOS"):
    meta = deck_data.get("meta", {})
    title = meta.get("title", "Apresentação Entrelaços")
    slides_data = deck_data.get("slides", [])
    total = len(slides_data)

    tokens = BRAND_TOKENS.get(brand, BRAND_TOKENS["entrelacOS"])

    rendered = []
    for idx, sd in enumerate(slides_data):
        layout = sd.get("layout", "concept").lower()
        renderer = RENDERERS.get(layout, render_concept)
        try:
            rendered.append(renderer(sd, idx + 1, total))
        except Exception as e:
            print("⚠️ Erro slide {} (layout={}): {}".format(idx+1, layout, e))
            rendered.append(render_concept({"title": "Erro", "body": "{}: {}".format(layout, e)}, idx+1, total))

    out = HTML_TEMPLATE.format(
        title=esc(title), tokens=tokens, base=CSS_BASE,
        slides_html="\n".join(rendered), total=total,
    )
    Path(output_path).write_text(out, encoding="utf-8")
    print("✅ HTML salvo em: {}".format(output_path))
    print("   {} slides · brand: {}".format(total, brand))
    print("   Abra no navegador. Setas ←/→ ou espaço para navegar.")
    print("   Cmd+P → Save as PDF para exportar.")


def main():
    parser = argparse.ArgumentParser(description="Gera HTML editorial premium Entrelaços")
    parser.add_argument("--input", "-i", required=True)
    parser.add_argument("--output", "-o", required=True)
    parser.add_argument("--brand", "-b", default="entrelacOS",
                        choices=list(BRAND_TOKENS.keys()),
                        help="Design system brand (default: entrelacOS)")
    parser.add_argument("--theme", "-t", default="dark")  # mantido por compatibilidade
    args = parser.parse_args()
    with open(args.input, "r", encoding="utf-8") as f:
        data = json.load(f)
    build_html(data, args.output, brand=args.brand)


if __name__ == "__main__":
    main()
