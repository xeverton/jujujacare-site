"""Atualiza videos.json com os vídeos públicos mais recentes do canal Juju Jacaré (feed RSS do YouTube).
Também tira da lista vídeos excluídos/privados, porque o feed RSS demora horas ou dias para refletir a exclusão."""
import json, time, urllib.request, urllib.error, urllib.parse, xml.etree.ElementTree as ET
CH = 'UCSksyiXghf-nyP821SDiJPw'
NS = {'a': 'http://www.w3.org/2005/Atom', 'yt': 'http://www.youtube.com/xml/schemas/2015'}
UA = {'User-Agent': 'Mozilla/5.0'}


def baixar(url, tentativas=4):
    for i in range(tentativas):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=20).read()
        except urllib.error.HTTPError as e:
            if e.code in (400, 401, 403, 404) and 'oembed' in url:
                raise
            print('falha', url, e)
        except Exception as e:
            print('falha', url, e)
        time.sleep(5 * (i + 1))
    return None


def existe(vid):
    u = 'https://www.youtube.com/oembed?format=json&url=' + urllib.parse.quote(f'https://www.youtube.com/watch?v={vid}')
    try:
        baixar(u, 2)
        return True
    except urllib.error.HTTPError:
        return False  # 401/403/404: excluído, privado ou sem incorporação


try:
    atual = json.load(open('videos.json', encoding='utf-8'))
except Exception:
    atual = []

xml = baixar(f'https://www.youtube.com/feeds/videos.xml?channel_id={CH}')
if xml:
    out = []
    for e in ET.fromstring(xml).findall('a:entry', NS):
        vid = e.find('yt:videoId', NS).text
        title = e.find('a:title', NS).text or ''
        link = e.find('a:link', NS).get('href', '')
        out.append({'id': vid, 'title': title, 'date': e.find('a:published', NS).text,
                    'short': '/shorts/' in link or '#short' in title.lower()})
else:
    print('feed RSS indisponível; só confere os vídeos já listados')
    out = atual

out = [v for v in out if existe(v['id'])]
if out and out != atual:
    json.dump(out, open('videos.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print(len(out), 'vídeos')
