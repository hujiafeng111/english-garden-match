"""Read user-provided .xls lists without changing the originals."""
import sys, json, re, hashlib
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '.tools/xls-reader'))
import xlrd
ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path(sys.argv[1])
POS = re.compile(r'(?:vt\.|vi\.|adj\.|adv\.|prep\.|conj\.|pron\.|num\.|int\.|aux\.|art\.|abbr\.|n\.|v\.)', re.I)
def senses(raw):
    markers=list(POS.finditer(raw)); parts=[]
    if not markers: parts=[('',raw)]
    else:
        for i,m in enumerate(markers): parts.append((m.group().lower(),raw[m.end():markers[i+1].start() if i+1<len(markers) else len(raw)]))
    result=[]
    for pos,text in parts:
        text=re.sub(r'\[[^\]]*\]','',text)
        usable=[]
        for group in re.split(r'[；;]',text):
            if '人名' in group or re.search(r'[（(][^）)]*姓氏',group): break
            usable.extend(re.split(r'[，,、]',group))
        for meaning in usable:
            meaning=meaning.strip(' /:：.。\n\t')
            meaning=re.sub(r'^\d+[.)、]\s*','',meaning)
            if not re.search(r'[\u4e00-\u9fff]',meaning) or not meaning or len(meaning)>32: continue
            if meaning.startswith(('(', '（')) and len(meaning)>20: continue
            if (pos,meaning) not in [(s['pos'],s['meaning']) for s in result]: result.append({'pos':pos,'meaning':meaning,'speechMeaning':meaning})
    return result
data={'version':'cet-user-v1','courses':{}}; report={'files':[],'courses':{},'skipped':[]}
loaded={}
for f in sorted(SOURCE.glob('*.xls')):
    level='4' if '四级' in f.name else '6' if '六级' in f.name else None
    if not level: continue
    rows=[]
    for sheet in xlrd.open_workbook(str(f)).sheets():
        for i in range(1,sheet.nrows):
            cells=sheet.row_values(i)
            if len(cells)<4: continue
            word=str(cells[1]).strip(); raw=str(cells[3]).strip(); phonetic=str(cells[2]).strip()
            if word and raw: rows.append({'word':word,'phonetic':phonetic,'definition':raw,'sourceRow':i+1})
    loaded[f.name]=rows
    report['files'].append({'name':f.name,'rows':len(rows),'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
for level in ['4','6']:
    name=next(n for n in loaded if ('四级' if level=='4' else '六级') in n and '正序' in n)
    other=next(n for n in loaded if ('四级' if level=='4' else '六级') in n and '乱序' in n)
    seen={}; entries=[]
    for row in loaded[name]:
        key=row['word'].lower().replace('’',"'")
        parsed=senses(row['definition'])
        if not re.fullmatch(r"[a-zA-Z][a-zA-Z '\-\.]*",row['word']) or not parsed:
            report['skipped'].append({'level':level,**row,'reason':'No usable Chinese sense or non-word entry'});continue
        if key in seen:
            old=seen[key]
            if row['definition'] not in old['definition'].split('\n'): old['definition']+='\n'+row['definition']
            if row['phonetic'] and row['phonetic'] not in old['phonetic']: old['phonetic']+=' '+row['phonetic']
            for sense in parsed:
                if sense not in old['senses']:old['senses'].append(sense)
            continue
        entry={'id':'cet'+level+'-'+hashlib.sha1(key.encode()).hexdigest()[:12],**row,'senses':parsed}
        seen[key]=entry;entries.append(entry)
    a={(r['word'].lower(),r['phonetic'],r['definition']) for r in loaded[name]};b={(r['word'].lower(),r['phonetic'],r['definition']) for r in loaded[other]}
    report['courses'][level]={'inputRows':len(loaded[name]),'imported':len(entries),'multisense':sum(len(e['senses'])>1 for e in entries),'orderComparisonDifferences':len(a^b),'source':name,'frequencyAvailable':False,'comparisonDifferences':[{'word':w,'phonetic':p,'definition':d,'in':'sorted' if (w,p,d) in a else 'shuffled'} for w,p,d in sorted(a^b)]}
    data['courses'][level]=entries
data['version']='cet-'+hashlib.sha256(json.dumps(data,ensure_ascii=False,sort_keys=True).encode()).hexdigest()[:12]
(ROOT/'data').mkdir(exist_ok=True)
(ROOT/'data/vocabulary.json').write_text(json.dumps(data,ensure_ascii=False,separators=(',',':')),encoding='utf8')
(ROOT/'vocabulary-data.js').write_text('window.CET_VOCABULARY='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf8')
(ROOT/'data/import-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf8')
print(json.dumps(report['courses'],ensure_ascii=False))
