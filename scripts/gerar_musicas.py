# -*- coding: utf-8 -*-
"""Gera as páginas de letra de cada música (/musicas/...), o sitemap.xml e o robots.txt — para o Google."""
import json, re, html, os, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://jujujacare.com.br'
DADOS = json.load(open(os.path.join(ROOT, 'scripts', 'musicas.json'), encoding='utf-8'))
HOJE = datetime.date.today().isoformat()


def iso_dur(s):
    m, s = divmod(int(s), 60)
    return 'PT%dM%dS' % (m, s)


def limpa_letra(t):
    out = []
    for l in t.split('\n'):
        l = l.strip()
        if re.match(r'^\[(efeitos|instrumental|som)', l, re.I):
            continue
        l = re.sub(r'^\[(Juju|THETHECO|Thetheco)\]\s*', '', l)
        m = re.match(r'^\[(.+?)\]$', l)
        if m:
            nome = m.group(1).lower()
            rot = 'Refrão' if ('chorus' in nome or 'refr' in nome) and 'pre' not in nome else ''
            out.append(('sec', rot))
            continue
        if l.startswith('(') and l.endswith(')'):
            l = l[1:-1]
        out.append(('l', l))
    blocos, cur = [], []
    for k, v in out:
        if k == 'sec' or (k == 'l' and not v):
            if cur: blocos.append(cur); cur = []
            if k == 'sec' and v: cur = [('t', v)]
        else:
            cur.append(('l', v))
    if cur: blocos.append(cur)
    h = ''
    for b in blocos:
        if not [x for x in b if x[0] == 'l']: continue
        h += '<p>' + '<br>'.join(('<b>%s</b>' % html.escape(v)) if k == 't' else html.escape(v) for k, v in b) + '</p>\n'
    return h


CSS = '''
:root{--ol:#33204a;--g:#5cc93b;--y:#ffe14d;--bg:#fffbea;--fg:#33204a;--card:#fff}
@media (prefers-color-scheme:dark){:root:not([data-theme="light"]){--bg:#1d1229;--fg:#f4ecff;--card:#2b1840}}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--fg);font:18px/1.6 'Baloo 2',system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
a{color:#2f9a37;font-weight:700}header{background:linear-gradient(160deg,#9be15d,#5cc93b);border-bottom:5px solid var(--ol)}
header .w{max-width:900px;margin:0 auto;padding:10px 16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap}
header img{height:48px}header nav{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap}
header nav a{background:#fff;color:#33204a;border:3px solid #33204a;border-radius:999px;padding:2px 14px;text-decoration:none;font-size:16px}
main{max-width:900px;margin:0 auto;padding:18px 16px 50px}h1{font-size:clamp(28px,6vw,42px);line-height:1.1;margin:8px 0 6px}
.sub{opacity:.85;margin:0 0 16px}.vid{position:relative;aspect-ratio:16/9;border:5px solid #33204a;border-radius:20px;overflow:hidden;background:#000;cursor:pointer}
.vid img{width:100%;height:100%;object-fit:cover;display:block}.vid iframe{width:100%;height:100%;border:0;display:block}
.vid .pl{position:absolute;inset:0;margin:auto;width:84px;height:60px;background:#ff2b3d;border-radius:18px;border:4px solid #fff}
.vid .pl:after{content:"";position:absolute;left:32px;top:14px;border-left:24px solid #fff;border-top:14px solid transparent;border-bottom:14px solid transparent}
.letra{background:var(--card);border:4px solid #33204a;border-radius:22px;padding:8px 20px;margin-top:20px;font-size:19px}
.letra b{color:#ff8c1a}.cta{display:flex;gap:10px;flex-wrap:wrap;margin:18px 0}
.cta a{background:#ffe14d;color:#33204a;border:4px solid #33204a;border-radius:999px;padding:6px 18px;text-decoration:none;box-shadow:0 4px 0 #33204a}
.cta a.r{background:#ff2b3d;color:#fff}.lista{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px;padding:0;list-style:none}
.lista a{display:block;background:var(--card);border:4px solid #33204a;border-radius:18px;overflow:hidden;text-decoration:none;color:var(--fg)}
.lista img{width:100%;aspect-ratio:16/9;object-fit:cover;display:block}.lista span{display:block;padding:8px 12px;font-size:17px;line-height:1.25}
footer{text-align:center;font-size:14px;opacity:.8;padding:20px}
'''
LOGO = '/jogos/img/logo.webp'
SAME = ['https://www.youtube.com/@Jujujacare', 'https://www.instagram.com/canaljujujacare/', 'https://www.tiktok.com/@canaljujujacare']


def head(title, desc, url, img, extra_ld):
    ld = json.dumps(extra_ld, ensure_ascii=False)
    return f'''<!doctype html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{html.escape(title)}</title><meta name="description" content="{html.escape(desc)}">
<link rel="canonical" href="{url}"><link rel="icon" href="/icon-192.png"><link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:type" content="video.other"><meta property="og:site_name" content="Juju Jacaré"><meta property="og:locale" content="pt_BR">
<meta property="og:url" content="{url}"><meta property="og:title" content="{html.escape(title)}"><meta property="og:description" content="{html.escape(desc)}">
<meta property="og:image" content="{img}"><meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@500;800&display=swap" rel="stylesheet">
<style>{CSS}</style>
<script type="application/ld+json">{ld}</script></head><body>
<header><div class="w"><a href="/"><img src="{LOGO}" alt="Juju Jacaré" width="130" height="48"></a>
<nav><a href="/musicas/">🎵 Letras</a><a href="/jogos/">🎮 Jogos</a><a href="/#clipes">🎬 Clipes</a></nav></div></header>'''


FOOT = '''<footer>© 2026 Juju Jacaré · Músicas infantis animadas · <a href="/privacidade.html">Política de Privacidade</a></footer>
<script>document.querySelectorAll('.vid[data-id]').forEach(function(v){v.addEventListener('click',function(){v.innerHTML='<iframe src="https://www.youtube-nocookie.com/embed/'+v.dataset.id+'?autoplay=1&rel=0&playsinline=1" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="Clipe"></iframe>';});});</script>
</body></html>'''

for m in DADOS:
    m['letra_html'] = limpa_letra(m['letra'])
    m['letra_txt'] = '\n'.join(l for l in (re.sub(r'^\[(Juju|THETHECO|Thetheco)\]\s*', '', x.strip()) for x in m['letra'].split('\n')) if l and not l.startswith('['))
os.makedirs(os.path.join(ROOT, 'musicas'), exist_ok=True)
urls = [(SITE + '/', '1.0'), (SITE + '/jogos/', '0.9'), (SITE + '/musicas/', '0.9'), (SITE + '/privacidade.html', '0.2')]
for m in DADOS:
    url = f"{SITE}/musicas/{m['slug']}/"
    thumb = f"https://i.ytimg.com/vi/{m['id']}/maxresdefault.jpg"
    titulo = f"{m['nome']} – Letra e Clipe | Música Infantil do Juju Jacaré"
    desc = m['desc']
    ld = {"@context": "https://schema.org", "@graph": [
        {"@type": "VideoObject", "name": m['titulo_yt'], "description": desc, "thumbnailUrl": [thumb, f"https://i.ytimg.com/vi/{m['id']}/hqdefault.jpg"],
         "uploadDate": m['upload'], "duration": iso_dur(m['dur']), "embedUrl": f"https://www.youtube.com/embed/{m['id']}",
         "contentUrl": f"https://www.youtube.com/watch?v={m['id']}", "inLanguage": "pt-BR", "isFamilyFriendly": True,
         "publisher": {"@type": "Organization", "name": "Juju Jacaré", "url": SITE, "logo": {"@type": "ImageObject", "url": SITE + "/icon-512.png"}}},
        {"@type": "MusicComposition", "name": m['nome'], "inLanguage": "pt-BR", "lyrics": {"@type": "CreativeWork", "text": m['letra_txt'][:4000]},
         "composer": {"@type": "Organization", "name": "Juju Jacaré"}},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Juju Jacaré", "item": SITE + "/"},
            {"@type": "ListItem", "position": 2, "name": "Letras das músicas", "item": SITE + "/musicas/"},
            {"@type": "ListItem", "position": 3, "name": m['nome'], "item": url}]}]}
    outras = ''.join(f'<li><a href="/musicas/{o["slug"]}/"><img loading="lazy" src="https://i.ytimg.com/vi/{o["id"]}/mqdefault.jpg" alt="{html.escape(o["nome"])}"><span>{html.escape(o["nome"])}</span></a></li>'
                     for o in DADOS if o is not m)
    pg = head(titulo, desc, url, thumb, ld) + f'''
<main><h1>{html.escape(m['nome'])} 🐊</h1><p class="sub">{html.escape(desc)}</p>
<div class="vid" data-id="{m['id']}" role="button" aria-label="Assistir ao clipe {html.escape(m['nome'])}"><img src="https://i.ytimg.com/vi/{m['id']}/hqdefault.jpg" alt="Clipe {html.escape(m['nome'])} do Juju Jacaré"><span class="pl"></span></div>
<div class="cta"><a class="r" href="https://www.youtube.com/watch?v={m['id']}" target="_blank" rel="noopener">▶ Ver no YouTube</a><a href="/jogos/">🎮 Jogos grátis do Juju</a><a href="/musicas/">🎵 Todas as letras</a></div>
<h2>Letra de “{html.escape(m['nome'])}”</h2><div class="letra">{m['letra_html']}</div>
<h2>Outras músicas do Juju Jacaré</h2><ul class="lista">{outras}</ul></main>''' + FOOT
    os.makedirs(os.path.join(ROOT, 'musicas', m['slug']), exist_ok=True)
    open(os.path.join(ROOT, 'musicas', m['slug'], 'index.html'), 'w', encoding='utf-8').write(pg)
    urls.append((url, '0.8'))

# índice das letras
ld = {"@context": "https://schema.org", "@type": "ItemList", "name": "Letras das músicas do Juju Jacaré",
      "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f"{SITE}/musicas/{m['slug']}/", "name": m['nome']} for i, m in enumerate(DADOS)]}
lista = ''.join(f'<li><a href="/musicas/{m["slug"]}/"><img loading="lazy" src="https://i.ytimg.com/vi/{m["id"]}/mqdefault.jpg" alt="{html.escape(m["nome"])}"><span>{html.escape(m["nome"])}</span></a></li>' for m in DADOS)
pg = head('Letras das Músicas Infantis do Juju Jacaré 🎵 Clipes para Cantar Junto',
          'Todas as letras das músicas infantis do Juju Jacaré com os clipes: cores, hora do banho, escovar os dentes, comer, reciclagem, somar, palavrinhas mágicas e mais.',
          SITE + '/musicas/', SITE + '/og-juju.jpg', ld) + f'''
<main><h1>Letras das músicas do Juju Jacaré 🎵</h1><p class="sub">Escolha uma música para ver a letra e cantar junto com o clipe!</p>
<ul class="lista">{lista}</ul></main>''' + FOOT
open(os.path.join(ROOT, 'musicas', 'index.html'), 'w', encoding='utf-8').write(pg)

sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + ''.join(
    f'  <url><loc>{u}</loc><lastmod>{HOJE}</lastmod><priority>{p}</priority></url>\n' for u, p in urls) + '</urlset>\n'
open(os.path.join(ROOT, 'sitemap.xml'), 'w').write(sm)
open(os.path.join(ROOT, 'robots.txt'), 'w').write(f'User-agent: *\nAllow: /\n\nSitemap: {SITE}/sitemap.xml\n')
print(len(DADOS), 'músicas;', len(urls), 'urls no sitemap')
