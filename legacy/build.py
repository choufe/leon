import re, sys, os
D = os.path.dirname(os.path.abspath(__file__)) + '/'
WRAP = ['blankResto', 'mountFull', 'renderView', 'go', 'navCrumbs', 'blockHTML', 'modInfo', 'extraContext', 'hygLotRow', 'posHTML']

def last_fn(src, name):
    """Return the text of the LAST top-level declaration `function name(`."""
    pat = '\nfunction ' + name + '('
    i = src.rfind(pat)
    if i < 0:
        raise SystemExit('missing function ' + name)
    i += 1
    eol = src.index('\n', i)
    first = src[i:eol]
    if first.rstrip().endswith('}') and first.count('{') == first.count('}'):
        return first
    j = src.index('\n}\n', i)
    return src[i:j + 2]

def build(name, out, demo_patch=None):
    src = open(D + name).read()
    if demo_patch:
        src = demo_patch(src)
    copies = []
    for f in WRAP:
        t = last_fn(src, f)
        copies.append(t.replace('function ' + f + '(', 'function ' + f + '__v7(', 1))
    js = '\n'.join(open(D + p).read() for p in ['v8_core.js', 'v8_stats.js', 'v8_infos.js', 'v8_glue.js', 'v9_apps.js', 'v9_plan_data.js', 'v9_plan_view.js', 'v9_plan_act.js', 'v9_equipe.js', 'v9_demo.js', 'v10_lisible.js', 'v11_core.js', 'v11_i18n.js', 'v11_service.js', 'v11_equipe.js', 'v11_hygiene.js', 'v11_cuisine.js', 'v11_chiffres.js', 'v11_setup.js', 'v11_home.js', 'v11_demo.js'])
    js = '/* copies des versions précédentes, enveloppées par la V8 */\n' + '\n'.join(copies) + '\n' + js + '\n'
    css = open(D + 'v8.css').read() + open(D + 'v9.css').read() + open(D + 'v10.css').read() + open(D + 'v11.css').read()
    for a, b in [('const CAN=()=>{', 'let CAN=()=>{'), ("const avatar=(p,cls='')=>", "let avatar=(p,cls='')=>"), ('const prevOf=d=>', 'let prevOf=d=>'),
                 ('family=Instrument+Sans:wght@400..700&display=swap', 'family=Instrument+Sans:wght@400..700&family=Noto+Sans+Tamil:wght@400..700&family=Noto+Sans+Arabic:wght@400..700&display=swap')]:
        if src.count(a) != 1:
            raise SystemExit('patch count %d: %s' % (src.count(a), a))
        src = src.replace(a, b)
    k = src.rindex('</style>')
    src = src[:k] + css + src[k:]
    m = src.index('function mcardify(){')
    c = src.rfind('\n/* ----------', 0, m)
    src = src[:c + 1] + js + src[c + 1:]
    open(D + out, 'w').write(src)
    print('built', out, len(src))

if __name__ == '__main__':
    build('reseau.html', 'reseau_v11.html')
    if os.path.exists(D + 'demo_patch.py'):
        sys.path.insert(0, D)
        import demo_patch
        build('demo.html', 'demo_v11.html', demo_patch.patch)
    else:
        build('demo.html', 'demo_v11.html')
