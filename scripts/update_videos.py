"""Atualiza videos.json com os vídeos públicos mais recentes do canal Juju Jacaré (feed RSS do YouTube)."""
import json, urllib.request, urllib.error, urllib.parse, xml.etree.ElementTree as ET
CH = 'UCSksyiXghf-nyP821SDiJPw'
NS = {'a': 'http://www.w3.org/2005/Atom', 'yt': 'http://www.youtube.com/xml/schemas/2015'}
req = urllib.request.Request(f'https://www.youtube.com/feeds/videos.xml?channel_id={CH}', headers={'User-Agent': 'Mozilla/5.0'})
root = ET.fromstring(urllib.request.urlopen(req, timeout=20).read())
out = []
for e in root.findall('a:entry', NS):
    vid = e.find('yt:videoId', NS).text
    title = e.find('a:title', NS).text or ''
    link = e.find('a:link', NS).get('href', '')
    out.append({'id': vid, 'title': title, 'date': e.find('a:published', NS).text,
                'short': '/shorts/' in link or '#short' in title.lower()})
def existe(vid):
    # o feed RSS demora horas/dias para tirar vídeos excluídos ou privados; o oEmbed responde na hora
    u = 'https://www.youtube.com/oembed?format=json&url=' + urllib.parse.quote(f'https://www.youtube.com/watch?v={vid}')
    try:
        urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'}), timeout=15); return True
    except urllib.error.HTTPError as e:
        return e.code not in (400, 401, 403, 404)
    except Exception:
        return True
out = [v for v in out if existe(v['id'])]
if out:
    json.dump(out, open('videos.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(len(out), 'vídeos')
