/* @ds-bundle: {"format":4,"namespace":"SamaJamm","components":[{"name":"Button"},{"name":"Chip"},{"name":"Badge"},{"name":"TopBar"},{"name":"TabBar"},{"name":"Menu"},{"name":"PageDots"},{"name":"SectionHeader"},{"name":"ListItem"},{"name":"SearchField"},{"name":"TextField"},{"name":"Switch"},{"name":"Checkbox"},{"name":"RadioGroup"},{"name":"SegmentedControl"},{"name":"Slider"},{"name":"ProgressBar"},{"name":"Banner"},{"name":"Toast"},{"name":"Dialog"},{"name":"BottomSheet"},{"name":"EmptyState"},{"name":"Skeleton"},{"name":"ReadingCard"},{"name":"Ornament"},{"name":"VerseShareCard"},{"name":"AudioPlayer"},{"name":"DayArc"},{"name":"PrayerTimes"},{"name":"QiblaCompass"},{"name":"TasbihCounter"},{"name":"BeadThread"},{"name":"KhatmGrid"},{"name":"AmountDisplay"},{"name":"Keypad"},{"name":"Envelope"},{"name":"SavingsGoal"},{"name":"WalletCard"}]} */
(function () {
  var React = window.React;
  var h = React.createElement;

  function cx() {
    return Array.prototype.filter.call(arguments, Boolean).join(' ');
  }

  function omit(obj, keys) {
    var out = {};
    for (var k in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, k) && keys.indexOf(k) === -1) out[k] = obj[k];
    }
    return out;
  }

  function slug(s) {
    return String(s || 'x').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-');
  }

  // État contrôlé si le parent fournit la valeur et onChange, sinon état local.
  function useValue(valeur, onChange, initial) {
    var st = React.useState(valeur != null ? valeur : initial);
    var controlled = valeur != null && typeof onChange === 'function';
    var v = controlled ? valeur : st[0];
    return [v, function (n) { if (!controlled) st[1](n); if (onChange) onChange(n); }];
  }

  // Étoile à huit branches : deux carrés tournés de 45°, centrée en (c, c), rayon extérieur R.
  function starPoints(c, R, cy) {
    var y0 = cy == null ? c : cy;
    var r = R * Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8);
    var pts = [];
    for (var k = 0; k < 16; k++) {
      var a = (-90 + k * 22.5) * Math.PI / 180;
      var rad = k % 2 === 0 ? R : r;
      pts.push((c + rad * Math.cos(a)).toFixed(2) + ',' + (y0 + rad * Math.sin(a)).toFixed(2));
    }
    return pts.join(' ');
  }

  // ——— Montants ———
  // Les montants sont stockés en entiers dans la plus petite unité (voir la section Budget) ;
  // les composants reçoivent des unités principales et une devise.
  var DEVISES = {
    XOF: { code: 'XOF', nom: 'Franc CFA (UEMOA)', symbole: 'F CFA', position: 'apres', decimales: 0, sousUnites: 1 },
    MRU: { code: 'MRU', nom: 'Ouguiya', symbole: 'UM', position: 'apres', decimales: 0, sousUnites: 5 }
  };

  function grouper(n, decimales) {
    var s = Math.abs(n).toFixed(decimales || 0);
    var parts = s.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
    return (n < 0 ? '−' : '') + parts.join(',');
  }

  function formatMontant(n, devise) {
    var d = devise || DEVISES.XOF;
    var num = grouper(n || 0, d.decimales || 0);
    return d.position === 'avant' ? d.symbole + ' ' + num : num + ' ' + d.symbole;
  }

  // ——— Icônes ———
  // Tracés au trait, grille 24, trait 1,75, bouts ronds. Le retour est toujours la flèche « ← ».
  var PATHS = {
    play: function () { return h('path', { d: 'M8 5.5v13l10.5-6.5z', fill: 'currentColor', stroke: 'none' }); },
    pause: function () {
      return h(React.Fragment, null,
        h('rect', { x: 6, y: 5, width: 4, height: 14, rx: 1, fill: 'currentColor', stroke: 'none' }),
        h('rect', { x: 14, y: 5, width: 4, height: 14, rx: 1, fill: 'currentColor', stroke: 'none' }));
    },
    'skip-back': function () { return h(React.Fragment, null, h('path', { d: 'M18 6v12l-8.5-6z', fill: 'currentColor', stroke: 'none' }), h('path', { d: 'M6.5 6v12' })); },
    'skip-forward': function () { return h(React.Fragment, null, h('path', { d: 'M6 6v12l8.5-6z', fill: 'currentColor', stroke: 'none' }), h('path', { d: 'M17.5 6v12' })); },
    repeat: function () { return h('path', { d: 'M17 3.5l3 3-3 3M4 11.5v-1a4 4 0 0 1 4-4h12M7 20.5l-3-3 3-3M20 12.5v1a4 4 0 0 1-4 4H4' }); },
    bookmark: function (filled) { return h('path', { d: 'M7 4h10a1 1 0 0 1 1 1v15l-6-4-6 4V5a1 1 0 0 1 1-1z', fill: filled ? 'currentColor' : 'none' }); },
    share: function () {
      return h(React.Fragment, null,
        h('circle', { cx: 18, cy: 5, r: 2.5 }), h('circle', { cx: 6, cy: 12, r: 2.5 }), h('circle', { cx: 18, cy: 19, r: 2.5 }),
        h('path', { d: 'M8.2 10.8l7.6-4.6M8.2 13.2l7.6 4.6' }));
    },
    search: function () { return h(React.Fragment, null, h('circle', { cx: 11, cy: 11, r: 6.5 }), h('path', { d: 'M16 16l4 4' })); },
    home: function () { return h('path', { d: 'M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6h-6v6H5a1 1 0 0 1-1-1z' }); },
    book: function () {
      return h(React.Fragment, null,
        h('path', { d: 'M12 6.5c-2-1.5-5-2-8-1.5v14c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z' }),
        h('path', { d: 'M12 6.5v14' }));
    },
    headphones: function () {
      return h(React.Fragment, null,
        h('path', { d: 'M4 15v-3a8 8 0 0 1 16 0v3' }),
        h('rect', { x: 3, y: 14, width: 4, height: 6, rx: 1.5 }),
        h('rect', { x: 17, y: 14, width: 4, height: 6, rx: 1.5 }));
    },
    clock: function () { return h(React.Fragment, null, h('circle', { cx: 12, cy: 12, r: 8.5 }), h('path', { d: 'M12 7.5V12l3 2' })); },
    download: function () { return h('path', { d: 'M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19.5h14' }); },
    reset: function () { return h(React.Fragment, null, h('path', { d: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3' }), h('path', { d: 'M4.5 4.5v3.5H8' })); },
    wallet: function () {
      return h(React.Fragment, null,
        h('rect', { x: 3.5, y: 6.5, width: 17, height: 12, rx: 2 }),
        h('path', { d: 'M3.5 10h17' }),
        h('circle', { cx: 16.5, cy: 14.5, r: 1 }));
    },
    bell: function () { return h(React.Fragment, null, h('path', { d: 'M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z' }), h('path', { d: 'M10 20.5a2 2 0 0 0 4 0' })); },
    'arrow-left': function () { return h('path', { d: 'M19 12H5M11 6l-6 6 6 6' }); },
    'arrow-down': function () { return h('path', { d: 'M12 5v14M6 13l6 6 6-6' }); },
    'arrow-up': function () { return h('path', { d: 'M12 19V5M6 11l6-6 6 6' }); },
    'chevron-right': function () { return h('path', { d: 'M9.5 6l6 6-6 6' }); },
    'chevron-down': function () { return h('path', { d: 'M6 9.5l6 6 6-6' }); },
    more: function () {
      return h(React.Fragment, null,
        h('circle', { cx: 5.5, cy: 12, r: 1.4, fill: 'currentColor', stroke: 'none' }),
        h('circle', { cx: 12, cy: 12, r: 1.4, fill: 'currentColor', stroke: 'none' }),
        h('circle', { cx: 18.5, cy: 12, r: 1.4, fill: 'currentColor', stroke: 'none' }));
    },
    check: function () { return h('path', { d: 'M5 12.5l4.5 4.5L19 7.5' }); },
    close: function () { return h('path', { d: 'M6.5 6.5l11 11M17.5 6.5l-11 11' }); },
    plus: function () { return h('path', { d: 'M12 5v14M5 12h14' }); },
    minus: function () { return h('path', { d: 'M5 12h14' }); },
    backspace: function () { return h(React.Fragment, null, h('path', { d: 'M9 5.5h10a1.5 1.5 0 0 1 1.5 1.5v10a1.5 1.5 0 0 1-1.5 1.5H9L3.5 12z' }), h('path', { d: 'M11.5 9.5l5 5M16.5 9.5l-5 5' })); },
    info: function () { return h(React.Fragment, null, h('circle', { cx: 12, cy: 12, r: 8.5 }), h('path', { d: 'M12 11v5.5' }), h('circle', { cx: 12, cy: 7.75, r: 1.1, fill: 'currentColor', stroke: 'none' })); },
    alert: function () { return h(React.Fragment, null, h('path', { d: 'M12 4.5l8.5 15h-17z' }), h('path', { d: 'M12 10v4.5' }), h('circle', { cx: 12, cy: 17.1, r: 1.1, fill: 'currentColor', stroke: 'none' })); },
    offline: function () { return h(React.Fragment, null, h('path', { d: 'M7.5 18.5h10a3.5 3.5 0 0 0 .7-6.93A6 6 0 0 0 7 10a4.25 4.25 0 0 0 .5 8.5z' }), h('path', { d: 'M4 4l16 16' })); },
    moon: function () { return h('path', { d: 'M19.5 14.5A7.75 7.75 0 1 1 9.5 4.5a6.25 6.25 0 0 0 10 10z' }); },
    sun: function () { return h(React.Fragment, null, h('circle', { cx: 12, cy: 12, r: 4 }), h('path', { d: 'M12 2.75v2M12 19.25v2M2.75 12h2M19.25 12h2M5.45 5.45l1.4 1.4M17.15 17.15l1.4 1.4M5.45 18.55l1.4-1.4M17.15 6.85l1.4-1.4' })); },
    globe: function () { return h(React.Fragment, null, h('circle', { cx: 12, cy: 12, r: 8.5 }), h('path', { d: 'M3.5 12h17M12 3.5c2.4 2.4 3.5 5.4 3.5 8.5s-1.1 6.1-3.5 8.5c-2.4-2.4-3.5-5.4-3.5-8.5s1.1-6.1 3.5-8.5z' })); },
    trash: function () { return h('path', { d: 'M4.5 7h15M9.5 7V4.75h5V7M6.5 7l1 12.75h9l1-12.75M10.25 11v5M13.75 11v5' }); },
    edit: function () { return h('path', { d: 'M15 5.5l3.5 3.5L8.5 19H5v-3.5zM13 7.5l3.5 3.5' }); },
    compass: function () { return h(React.Fragment, null, h('circle', { cx: 12, cy: 12, r: 8.5 }), h('path', { d: 'M15 9l-1.75 4.25L9 15l1.75-4.25z' })); },
    pin: function () { return h(React.Fragment, null, h('path', { d: 'M12 21s-6.5-5.9-6.5-11a6.5 6.5 0 0 1 13 0c0 5.1-6.5 11-6.5 11z' }), h('circle', { cx: 12, cy: 10, r: 2.25 })); },
    settings: function () { return h(React.Fragment, null, h('path', { d: 'M4 7h9M17 7h3M4 17h3M11 17h9' }), h('circle', { cx: 15, cy: 7, r: 2 }), h('circle', { cx: 9, cy: 17, r: 2 })); },
    user: function () { return h(React.Fragment, null, h('circle', { cx: 12, cy: 8, r: 3.5 }), h('path', { d: 'M5 20c1.2-3.6 4-5.5 7-5.5s5.8 1.9 7 5.5' })); },
    users: function () { return h(React.Fragment, null, h('circle', { cx: 9, cy: 8.5, r: 3 }), h('path', { d: 'M3.5 19c.7-3 2.9-4.75 5.5-4.75s4.8 1.75 5.5 4.75' }), h('circle', { cx: 16.5, cy: 8, r: 2.5 }), h('path', { d: 'M15.75 13.6c2.4-.15 4.25 1.4 4.75 4.4' })); },
    lock: function () { return h(React.Fragment, null, h('rect', { x: 5, y: 10.5, width: 14, height: 9.5, rx: 2 }), h('path', { d: 'M8 10.5V8a4 4 0 0 1 8 0v2.5' })); },
    calendar: function () { return h(React.Fragment, null, h('rect', { x: 4, y: 5.5, width: 16, height: 14.5, rx: 2 }), h('path', { d: 'M4 10h16M8.5 3.5v4M15.5 3.5v4' })); },
    target: function () { return h(React.Fragment, null, h('circle', { cx: 12, cy: 12, r: 8.5 }), h('circle', { cx: 12, cy: 12, r: 4.75 }), h('circle', { cx: 12, cy: 12, r: 1.2, fill: 'currentColor', stroke: 'none' })); },
    heart: function () { return h('path', { d: 'M12 19.5s-7.5-4.6-7.5-10.1A4 4 0 0 1 12 7.2a4 4 0 0 1 7.5 2.2c0 5.5-7.5 10.1-7.5 10.1z' }); },
    balance: function () { return h('path', { d: 'M12 4v16M8 20h8M5 7.5h14M7.5 7.5l-3 6a3 3 0 0 0 6 0zM16.5 7.5l-3 6a3 3 0 0 0 6 0z' }); },
    list: function () {
      return h(React.Fragment, null, h('path', { d: 'M9 6.5h11M9 12h11M9 17.5h11' }),
        h('circle', { cx: 4.75, cy: 6.5, r: 1.1, fill: 'currentColor', stroke: 'none' }),
        h('circle', { cx: 4.75, cy: 12, r: 1.1, fill: 'currentColor', stroke: 'none' }),
        h('circle', { cx: 4.75, cy: 17.5, r: 1.1, fill: 'currentColor', stroke: 'none' }));
    },
    type: function () { return h('path', { d: 'M3.5 18l5-12 5 12M5.3 14h6.4M15 18l2.75-7 2.75 7M15.9 15.8h3.7' }); },
    bolt: function () { return h('path', { d: 'M13 3.5L6 13.5h5.5L11 20.5l7-10h-5.5z' }); },
    car: function () { return h(React.Fragment, null, h('path', { d: 'M5 16.5V12l2-5h10l2 5v4.5M3.5 12h17' }), h('rect', { x: 3.5, y: 12, width: 17, height: 4.5, rx: 1.5 }), h('path', { d: 'M6.5 16.5v2M17.5 16.5v2' })); },
    cart: function () { return h(React.Fragment, null, h('path', { d: 'M3.5 4.5h2.5l2 10.5h10l1.75-7.5H7' }), h('circle', { cx: 9.5, cy: 19, r: 1.4 }), h('circle', { cx: 16.5, cy: 19, r: 1.4 })); },
    copy: function () { return h(React.Fragment, null, h('rect', { x: 8.5, y: 8.5, width: 11, height: 11, rx: 2 }), h('path', { d: 'M15.5 8.5V6a1.5 1.5 0 0 0-1.5-1.5H6A1.5 1.5 0 0 0 4.5 6v8A1.5 1.5 0 0 0 6 15.5h2.5' })); },
    kaaba: function () { return h(React.Fragment, null, h('path', { d: 'M4.5 8l7.5-3.5L19.5 8v9L12 20.5 4.5 17z' }), h('path', { d: 'M4.5 8L12 11.5 19.5 8M12 11.5v9M4.5 10.75L12 14.25l7.5-3.5' })); }
  };

  // Icônes de direction : retournées en interface arabe (dir="rtl"). Jamais les icônes audio.
  var SENS = { 'arrow-left': true, 'chevron-right': true };

  function Icon(props) {
    var size = props.size || 20;
    var draw = PATHS[props.name] || PATHS.book;
    return h('svg', {
      width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor',
      strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': 'true',
      className: cx('sj-icon', SENS[props.name] && 'sj-icon--sens', props.className)
    }, draw(props.filled));
  }

  // ——— Actions ———

  function Button(props) {
    var variant = props.variant || 'principal';
    var rest = omit(props, ['variant', 'icone', 'pleineLargeur', 'children', 'className', 'type']);
    return h('button', Object.assign({}, rest, {
      type: props.type || 'button',
      className: cx('sj-btn', 'sj-btn--' + variant, props.pleineLargeur && 'sj-btn--plein', props.className)
    }),
      props.icone ? h(Icon, { name: props.icone, size: 18 }) : null,
      props.children != null ? h('span', { className: 'libelle' }, props.children) : null);
  }

  function IconButton(props) {
    var rest = omit(props, ['icone', 'label', 'actif', 'className', 'taille']);
    return h('button', Object.assign({}, rest, {
      type: 'button', 'aria-label': props.label,
      className: cx('sj-iconbtn', props.actif && 'sj-iconbtn--actif', props.className)
    }), h(Icon, { name: props.icone, size: props.taille || 20, filled: props.actif }));
  }

  function Chip(props) {
    var rest = omit(props, ['selectionne', 'compte', 'children', 'className']);
    return h('button', Object.assign({}, rest, {
      type: 'button', 'aria-pressed': props.selectionne ? 'true' : 'false',
      className: cx('sj-chip', props.selectionne && 'sj-chip--on', props.className)
    }),
      h('span', { className: 'libelle' }, props.children),
      props.compte != null ? h('span', { className: 'legende sj-chip__count' }, props.compte) : null);
  }

  function Badge(props) {
    var ton = props.ton || 'neutre';
    return h('span', { className: cx('sj-badge', 'sj-badge--' + ton, props.className) },
      props.icone ? h(Icon, { name: props.icone, size: 14 }) : null,
      h('span', null, props.children));
  }

  // ——— Navigation ———

  function TopBar(props) {
    var actions = props.actions || [];
    var retour = props.retour != null && props.retour !== false;
    var grand = !!props.grand;
    return h('header', { className: cx('sj-topbar', grand && 'sj-topbar--grand', props.transparent && 'sj-topbar--transparent') },
      h('div', { className: 'sj-topbar__row' },
        retour ? h(IconButton, { icone: 'arrow-left', taille: 22, label: typeof props.retour === 'string' ? props.retour : 'Retour', onClick: props.onRetour, className: 'sj-topbar__back' }) : null,
        grand ? h('span', { className: 'sj-spacer' }) : h('div', { className: cx('sj-topbar__titles', !retour && 'sj-topbar__titles--seul') },
          props.titre ? h('h1', { className: 'titre-3 sj-ellipsis' }, props.titre) : null,
          props.sousTitre ? h('p', { className: 'legende sj-c3 sj-ellipsis' }, props.sousTitre) : null),
        actions.length ? h('div', { className: 'sj-topbar__actions' }, actions.map(function (a) {
          return h(IconButton, { key: a.label, icone: a.icone, label: a.label, onClick: a.onClick, actif: a.actif, 'aria-pressed': a.actif != null ? String(!!a.actif) : undefined });
        })) : null),
      grand ? h('div', { className: 'sj-topbar__big' },
        h('h1', { className: 'titre-1 sj-topbar__bigtitle', lang: props.lang }, props.titre),
        props.sousTitre ? h('p', { className: 'translitteration sj-c2' }, props.sousTitre) : null) : null);
  }

  var DEFAULT_TABS = [
    { id: 'accueil', label: 'Accueil', icone: 'home' },
    { id: 'lire', label: 'Lire', icone: 'book' },
    { id: 'ecouter', label: 'Écouter', icone: 'headphones' },
    { id: 'priere', label: 'Prière', icone: 'clock' },
    { id: 'budget', label: 'Budget', icone: 'wallet' }
  ];

  function TabBar(props) {
    var onglets = props.onglets || DEFAULT_TABS;
    var s = useValue(props.actif, props.onChange, onglets[0].id);
    var actif = s[0], setActif = s[1];
    return h('nav', { className: 'sj-tabbar', 'aria-label': 'Navigation principale', style: { gridTemplateColumns: 'repeat(' + onglets.length + ', 1fr)' } },
      onglets.map(function (o) {
        var on = o.id === actif;
        return h('button', {
          key: o.id, type: 'button', className: cx('sj-tab', on && 'sj-tab--on'),
          'aria-current': on ? 'page' : undefined,
          onClick: function () { setActif(o.id); }
        },
          h('span', { className: 'sj-tab__pill' }, h(Icon, { name: o.icone, size: 22 })),
          h('span', { className: 'legende sj-tab__label' }, o.label));
      }));
  }

  function Menu(props) {
    var items = props.items || [];
    return h('div', { className: 'sj-menu', role: 'menu', 'aria-label': props.label || 'Plus' },
      items.map(function (it, i) {
        if (it.separateur) return h('div', { key: 'sep' + i, className: 'sj-menu__sep', role: 'separator' });
        return h('button', {
          key: it.label, type: 'button', role: 'menuitem', onClick: it.onClick,
          className: cx('sj-menu__item', it.danger && 'sj-menu__item--danger')
        },
          it.icone ? h(Icon, { name: it.icone, size: 20 }) : null,
          h('span', { className: 'corps sj-menu__label' }, it.label),
          it.fin ? h('span', { className: 'legende sj-c3' }, it.fin) : null);
      }));
  }

  function PageDots(props) {
    var total = props.total || 3, actif = props.actif || 0;
    var dots = [];
    for (var i = 0; i < total; i++) {
      dots.push(h('span', { key: i, className: cx('sj-dots__dot', i === actif && 'sj-dots__dot--on', i < actif && 'sj-dots__dot--fait') }));
    }
    return h('div', { className: 'sj-dots', role: 'img', 'aria-label': 'Étape ' + (actif + 1) + ' sur ' + total }, dots);
  }

  function SectionHeader(props) {
    return h('div', { className: 'sj-sh' },
      h('div', { className: 'sj-sh__titles' },
        h('h2', { className: 'titre-2 sj-sh__title', lang: props.lang }, props.titre),
        props.sousTitre ? h('p', { className: 'translitteration sj-c2' }, props.sousTitre) : null),
      props.action ? h(Button, { variant: 'discret', onClick: props.action.onClick, className: 'sj-sh__action' }, props.action.label) : null);
  }

  function ListItem(props) {
    var fin = props.fin || (props.onClick ? 'chevron' : null);
    var interactive = typeof props.onClick === 'function' || fin === 'chevron';
    var lead = props.icone
      ? h('span', { className: cx('sj-li__lead', props.ton && 'sj-li__lead--' + props.ton), 'aria-hidden': 'true' }, h(Icon, { name: props.icone, size: 20 }))
      : props.numero != null ? h(Medallion, { numero: props.numero, prefixe: props.prefixe || 'Numéro' }) : null;
    var attrs = interactive ? { type: 'button', onClick: props.onClick } : {};
    attrs.className = cx('sj-li', interactive && 'sj-li--btn', props.danger && 'sj-li--danger', props.className);
    return h(interactive ? 'button' : 'div', attrs,
      lead,
      h('span', { className: 'sj-li__text' },
        h('span', { className: 'corps sj-li__title' }, props.titre),
        props.sousTitre ? h('span', { className: 'legende sj-c3' }, props.sousTitre) : null),
      props.arabe ? h('span', { lang: 'ar', dir: 'rtl', className: 'sj-li__ar' }, props.arabe) : null,
      props.valeur != null ? h('span', { className: 'corps sj-c2 sj-li__value sj-tabnum' }, props.valeur) : null,
      props.droite != null ? props.droite : props.children != null ? h('span', { className: 'sj-li__end' }, props.children) : null,
      fin === 'chevron' ? h(Icon, { name: 'chevron-right', size: 18, className: 'sj-li__chev' }) : null,
      fin === 'coche' ? h(Icon, { name: 'check', size: 20, className: 'sj-li__check' }) : null);
  }

  function ListGroup(props) {
    return h('section', { className: 'sj-lg', 'aria-label': props.titre },
      props.titre ? h('h2', { className: 'libelle sj-lg__title' }, props.titre) : null,
      h('div', { className: 'sj-lg__card' }, props.children),
      props.note ? h('p', { className: 'legende sj-c3 sj-lg__note' }, props.note) : null);
  }

  // ——— Saisie ———

  function SearchField(props) {
    var id = props.id || 'sj-recherche';
    var rest = omit(props, ['label', 'id', 'className']);
    return h('div', { className: cx('sj-search', props.className) },
      h('label', { htmlFor: id, className: 'sj-sr' }, props.label || 'Rechercher'),
      h(Icon, { name: 'search', size: 20, className: 'sj-search__icon' }),
      h('input', Object.assign({ type: 'search', id: id, className: 'corps sj-search__input' }, rest)));
  }

  function TextField(props) {
    var id = props.id || 'sj-champ-' + slug(props.label);
    var rest = omit(props, ['label', 'aide', 'erreur', 'prefixe', 'suffixe', 'id', 'className']);
    var descId = props.erreur || props.aide ? id + '-desc' : undefined;
    return h('div', { className: cx('sj-field', props.erreur && 'sj-field--erreur', props.className) },
      h('label', { htmlFor: id, className: 'libelle sj-field__label' }, props.label),
      h('div', { className: 'sj-field__box' },
        props.prefixe ? h('span', { className: 'corps sj-c2 sj-field__affix' }, props.prefixe) : null,
        h('input', Object.assign({ id: id, className: 'corps sj-field__input', 'aria-invalid': props.erreur ? 'true' : undefined, 'aria-describedby': descId }, rest)),
        props.suffixe ? h('span', { className: 'corps sj-c2 sj-field__affix' }, props.suffixe) : null),
      props.erreur ? h('p', { id: descId, className: 'legende sj-field__err' }, h(Icon, { name: 'alert', size: 14 }), props.erreur)
        : props.aide ? h('p', { id: descId, className: 'legende sj-c3' }, props.aide) : null);
  }

  function Switch(props) {
    var s = useValue(props.active, props.onChange, false);
    var on = !!s[0];
    return h('button', {
      type: 'button', role: 'switch', 'aria-checked': on ? 'true' : 'false', 'aria-label': props.label, disabled: props.disabled,
      className: cx('sj-switch', on && 'sj-switch--on'),
      onClick: function () { s[1](!on); }
    }, h('span', { className: 'sj-switch__thumb' }, on ? h(Icon, { name: 'check', size: 14 }) : null));
  }

  function Checkbox(props) {
    var s = useValue(props.coche, props.onChange, false);
    return h('label', { className: cx('sj-check', props.disabled && 'sj-check--off') },
      h('input', { type: 'checkbox', className: 'sj-check__input', checked: !!s[0], disabled: props.disabled, onChange: function (e) { s[1](e.target.checked); } }),
      h('span', { className: 'sj-check__box', 'aria-hidden': 'true' }, h(Icon, { name: 'check', size: 16 })),
      h('span', { className: 'sj-check__text' },
        h('span', { className: 'corps' }, props.label),
        props.description ? h('span', { className: 'legende sj-c3' }, props.description) : null));
  }

  function RadioGroup(props) {
    var opts = props.options || [];
    var name = props.nom || 'sj-radio-' + slug(props.label);
    var s = useValue(props.valeur, props.onChange, null);
    return h('fieldset', { className: 'sj-radio' },
      props.label ? h('legend', { className: 'libelle sj-radio__legend' }, props.label) : null,
      opts.map(function (o) {
        var on = o.id === s[0];
        return h('label', { key: o.id, className: cx('sj-radio__opt', on && 'sj-radio__opt--on') },
          h('input', { type: 'radio', name: name, value: o.id, checked: on, className: 'sj-check__input', onChange: function () { s[1](o.id); } }),
          h('span', { className: 'sj-radio__dot', 'aria-hidden': 'true' }),
          h('span', { className: 'sj-check__text' },
            h('span', { className: 'corps' }, o.label),
            o.description ? h('span', { className: 'legende sj-c3' }, o.description) : null),
          o.fin ? h('span', { className: 'libelle sj-c2 sj-tabnum' }, o.fin) : null);
      }));
  }

  function SegmentedControl(props) {
    var opts = props.options || [];
    var s = useValue(props.valeur, props.onChange, opts[0] && opts[0].id);
    return h('div', { className: 'sj-seg', role: 'radiogroup', 'aria-label': props.label },
      opts.map(function (o) {
        var on = o.id === s[0];
        return h('button', {
          key: o.id, type: 'button', role: 'radio', 'aria-checked': on ? 'true' : 'false',
          className: cx('sj-seg__opt', on && 'sj-seg__opt--on'), onClick: function () { s[1](o.id); }
        }, o.label);
      }));
  }

  function Slider(props) {
    var min = props.min != null ? props.min : 0, max = props.max != null ? props.max : 100;
    var s = useValue(props.valeur, props.onChange, min);
    var v = s[0];
    var id = props.id || 'sj-curseur-' + slug(props.label);
    var txt = props.format ? props.format(v) : String(v);
    var p = (v - min) / (max - min) * 100;
    return h('div', { className: 'sj-slider' },
      h('div', { className: 'sj-slider__head' },
        h('label', { htmlFor: id, className: 'libelle' }, props.label),
        h('span', { className: 'corps sj-c2 sj-tabnum' }, txt)),
      h('div', { className: 'sj-slider__row' },
        props.gauche ? h('span', { className: 'sj-slider__end', 'aria-hidden': 'true' }, props.gauche) : null,
        h('input', {
          id: id, type: 'range', min: min, max: max, step: props.pas || 1, value: v, className: 'sj-slider__input',
          style: { '--p': p + '%' }, 'aria-valuetext': txt,
          onChange: function (e) { s[1](Number(e.target.value)); }
        }),
        props.droite ? h('span', { className: 'sj-slider__end sj-slider__end--grand', 'aria-hidden': 'true' }, props.droite) : null));
  }

  // ——— Retours ———

  function ProgressBar(props) {
    var v = Math.max(0, props.valeur || 0);
    var depasse = v > 1;
    var ton = depasse ? 'erreur' : (props.ton || 'emeraude');
    var pct = Math.min(v, 1) * 100;
    return h('div', { className: cx('sj-progress', props.fine && 'sj-progress--fine') },
      props.label || props.detail ? h('div', { className: 'sj-progress__head' },
        h('span', { className: 'libelle' }, props.label),
        h('span', { className: 'legende sj-c2 sj-tabnum' }, props.detail)) : null,
      h('div', {
        className: 'sj-progress__track', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100,
        'aria-valuenow': Math.round(pct), 'aria-label': props.nomAccessible || props.label || 'Progression', 'aria-valuetext': props.detail
      }, h('span', { className: 'sj-progress__fill sj-progress__fill--' + ton, style: { width: pct + '%' } })));
  }

  var BANNER_ICONS = { info: 'info', attention: 'offline', erreur: 'alert', veille: 'moon', succes: 'check' };

  function Banner(props) {
    var ton = props.ton || 'info';
    return h('div', { className: cx('sj-banner', 'sj-banner--' + ton), role: ton === 'erreur' ? 'alert' : 'status' },
      h(Icon, { name: props.icone || BANNER_ICONS[ton], size: 20, className: 'sj-banner__icon' }),
      h('div', { className: 'sj-banner__text' },
        props.titre ? h('p', { className: 'libelle sj-banner__title' }, props.titre) : null,
        props.children ? h('p', { className: 'sj-banner__body' }, props.children) : null,
        props.action ? h('button', { type: 'button', className: 'libelle sj-banner__action', onClick: props.action.onClick }, props.action.label) : null),
      props.onFermer ? h(IconButton, { icone: 'close', label: 'Fermer', onClick: props.onFermer, className: 'sj-banner__close' }) : null);
  }

  function Toast(props) {
    return h('div', { className: 'sj-toast', role: 'status', 'aria-live': 'polite' },
      props.icone ? h(Icon, { name: props.icone, size: 20, className: 'sj-toast__icon' }) : null,
      h('span', { className: 'sj-toast__text' }, props.children),
      props.action ? h('button', { type: 'button', className: 'libelle sj-toast__action', onClick: props.action.onClick }, props.action.label) : null);
  }

  function Dialog(props) {
    if (props.ouvert === false) return null;
    return h('div', { className: 'sj-scrim sj-scrim--centre' },
      h('div', { className: 'sj-dialog', role: 'alertdialog', 'aria-modal': 'true', 'aria-labelledby': 'sj-dialog-titre', 'aria-describedby': 'sj-dialog-texte' },
        props.icone ? h('span', { className: cx('sj-dialog__icon', props.danger && 'sj-dialog__icon--danger'), 'aria-hidden': 'true' }, h(Icon, { name: props.icone, size: 24 })) : null,
        h('h2', { id: 'sj-dialog-titre', className: 'titre-2 sj-dialog__title' }, props.titre),
        h('div', { id: 'sj-dialog-texte', className: 'corps sj-c2 sj-dialog__body' }, props.children),
        h('div', { className: 'sj-dialog__actions' },
          h(Button, { variant: props.danger ? 'danger' : 'principal', pleineLargeur: true, onClick: props.onConfirmer }, props.confirmer || 'Confirmer'),
          h(Button, { variant: 'discret', pleineLargeur: true, onClick: props.onAnnuler }, props.annuler || 'Annuler'))));
  }

  function BottomSheet(props) {
    if (props.ouvert === false) return null;
    return h('div', { className: 'sj-scrim sj-scrim--bas', onClick: function (e) { if (e.target === e.currentTarget && props.onFermer) props.onFermer(); } },
      h('div', { className: 'sj-sheet', role: 'dialog', 'aria-modal': 'true', 'aria-label': props.titre },
        h('span', { className: 'sj-sheet__handle', 'aria-hidden': 'true' }),
        h('div', { className: 'sj-sheet__head' },
          h('h2', { className: 'titre-3' }, props.titre),
          h(IconButton, { icone: 'close', label: 'Fermer', onClick: props.onFermer })),
        h('div', { className: 'sj-sheet__body' }, props.children)));
  }

  function EmptyState(props) {
    return h('div', { className: 'sj-empty' },
      h('span', { className: 'sj-empty__art', 'aria-hidden': 'true' },
        h('svg', { width: 72, height: 72, viewBox: '0 0 72 72' }, h('polygon', { points: starPoints(36, 33), className: 'sj-empty__star' })),
        h('span', { className: 'sj-empty__icon' }, h(Icon, { name: props.icone || 'book', size: 26 }))),
      h('h2', { className: 'titre-2 sj-empty__title', lang: props.lang || 'wo' }, props.titre),
      props.sousTitre ? h('p', { className: 'translitteration sj-c2' }, props.sousTitre) : null,
      props.texte ? h('p', { className: 'corps sj-c2 sj-empty__text' }, props.texte) : null,
      props.action ? h(Button, { variant: 'secondaire', icone: props.action.icone, onClick: props.action.onClick }, props.action.label) : null);
  }

  function Skeleton(props) {
    var forme = props.forme || 'liste';
    var n = props.lignes || 3;
    var rows = [];
    for (var i = 0; i < n; i++) {
      rows.push(forme === 'carte'
        ? h('div', { key: i, className: 'sj-skel__card' },
          h('span', { className: 'sj-skel__b sj-skel__b--ar' }),
          h('span', { className: 'sj-skel__b sj-skel__b--l' }),
          h('span', { className: 'sj-skel__b sj-skel__b--m' }))
        : h('div', { key: i, className: 'sj-skel__row' },
          h('span', { className: 'sj-skel__b sj-skel__b--rond' }),
          h('span', { className: 'sj-skel__lines' },
            h('span', { className: 'sj-skel__b sj-skel__b--m' }),
            h('span', { className: 'sj-skel__b sj-skel__b--s' }))));
    }
    return h('div', { className: 'sj-skel', role: 'status', 'aria-busy': 'true', 'aria-label': props.label || 'Chargement' }, rows);
  }

  // ——— Lecture ———

  function Medallion(props) {
    var size = props.size || 36;
    return h('span', { className: 'sj-medallion', style: { width: size, height: size }, 'aria-label': (props.prefixe || 'Verset') + ' ' + props.numero },
      h('svg', { width: size, height: size, viewBox: '0 0 36 36', 'aria-hidden': 'true' },
        h('polygon', { points: starPoints(18, 16.5), className: 'sj-medallion__star' })),
      h('span', { className: 'sj-medallion__n', 'aria-hidden': 'true' }, props.numero));
  }

  function ReadingCard(props) {
    return h('article', { className: 'sj-card sj-reading' },
      h('div', { className: 'sj-reading__head' },
        props.numero != null ? h(Medallion, { numero: props.numero }) : null,
        props.source ? h('span', { className: 'legende sj-c3' }, props.source) : null),
      h('p', { lang: 'ar', dir: 'rtl', className: cx(props.coran === false ? 'arabe' : 'coran', 'sj-arabic') }, props.arabe),
      props.translitteration ? h('p', { className: 'translitteration sj-c2 sj-reading__translit' }, props.translitteration) : null,
      props.traduction ? h('p', { className: 'lecture sj-reading__trad' }, props.traduction) : null,
      h('div', { className: 'sj-reading__actions' },
        h(Button, { variant: 'discret', icone: 'play' }, 'Écouter'),
        h('span', { className: 'sj-spacer' }),
        h(IconButton, { icone: 'bookmark', label: props.favori ? 'Retirer des favoris' : 'Ajouter aux favoris', actif: props.favori, 'aria-pressed': props.favori ? 'true' : 'false' }),
        h(IconButton, { icone: 'share', label: 'Partager' })));
  }

  function Ornament(props) {
    if (props.variante === 'medaillon') return h(Medallion, { numero: props.numero, size: props.taille });
    return h('div', { className: 'sj-ornament', role: 'separator' },
      h('span', { className: 'sj-ornament__rule' }),
      h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', 'aria-hidden': 'true' },
        h('polygon', { points: starPoints(12, 11), className: 'sj-ornament__star' })),
      h('span', { className: 'sj-ornament__rule' }));
  }

  // Image carrée à partager (1080 × 1080 à l'export). Couleurs de marque fixes, quel que soit le thème.
  function VerseShareCard(props) {
    var fond = props.fond || 'emeraude';
    var corners = [[22, 22], [298, 22], [22, 298], [298, 298]];
    return h('figure', { className: cx('sj-share', 'sj-share--' + fond), style: props.taille ? { width: props.taille, height: props.taille } : null },
      h('svg', { className: 'sj-share__frame', viewBox: '0 0 320 320', preserveAspectRatio: 'none', 'aria-hidden': 'true' },
        h('rect', { x: 12, y: 12, width: 296, height: 296, rx: 6, className: 'sj-share__rule' }),
        corners.map(function (c, i) { return h('polygon', { key: i, points: starPoints(c[0], 7, c[1]), className: 'sj-share__star' }); })),
      h('p', { lang: 'ar', dir: 'rtl', className: 'sj-share__ar' }, props.arabe),
      props.traduction ? h('p', { className: 'sj-share__tr' }, props.traduction) : null,
      h('figcaption', { className: 'sj-share__foot' },
        h('span', { className: 'sj-share__src' }, props.source),
        h('span', { className: 'sj-share__brand' },
          h('svg', { width: 14, height: 14, viewBox: '0 0 24 24', 'aria-hidden': 'true' }, h('polygon', { points: starPoints(12, 11), className: 'sj-share__star' })),
          'Sama Jàmm')));
  }

  // ——— Audio ———

  function AudioPlayer(props) {
    var st = React.useState(!!props.enLecture);
    var playing = st[0], setPlaying = st[1];
    var p = Math.max(0, Math.min(1, props.progression || 0));
    return h('div', { className: 'sj-player', role: 'region', 'aria-label': 'Lecteur audio' },
      h('div', { className: 'sj-player__bar', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-valuenow': Math.round(p * 100), 'aria-label': 'Progression' },
        h('span', { className: 'sj-player__fill', style: { width: (p * 100) + '%' } })),
      h('div', { className: 'sj-player__row' },
        h('span', { className: 'sj-player__art', 'aria-hidden': 'true' },
          h('svg', { width: 22, height: 22, viewBox: '0 0 24 24' }, h('polygon', { points: starPoints(12, 11), className: 'sj-ornament__star' }))),
        h('span', { className: 'sj-player__text' },
          h('span', { className: 'titre-3 sj-ellipsis' }, props.titre),
          h('span', { className: 'legende sj-c3 sj-ellipsis' }, props.sousTitre)),
        h('button', {
          type: 'button', className: 'sj-player__play', 'aria-label': playing ? 'Mettre en pause' : 'Lire',
          onClick: function () { setPlaying(!playing); }
        }, h(Icon, { name: playing ? 'pause' : 'play', size: 22 }))));
  }

  // ——— Prière ———

  function minutes(hhmm) {
    var p = String(hhmm).split(':');
    return Number(p[0]) * 60 + Number(p[1] || 0);
  }

  // Arc du jour : le soleil suit une demi-ellipse du lever au coucher, la nuit repasse sous l'horizon.
  function DayArc(props) {
    var W = 342, HZ = 104, X0 = 24, X1 = 318, CX = 171, RX = 147, RY = 84, NIGHT_Y = 146;
    var lever = minutes(props.lever || '06:58');
    var coucher = minutes(props.coucher || '19:05');
    var now = minutes(props.maintenant || '15:53');
    var prieres = props.prieres || [];
    function pos(m) {
      if (m >= lever && m <= coucher) {
        var a = Math.PI * (1 - (m - lever) / (coucher - lever));
        return [CX + RX * Math.cos(a), HZ - RY * Math.sin(a)];
      }
      var t = ((m - coucher + 1440) % 1440) / (1440 - (coucher - lever));
      var u = 1 - t;
      return [u * u * X1 + 2 * u * t * CX + t * t * X0, u * u * HZ + 2 * u * t * NIGHT_Y + t * t * HZ];
    }
    var sun = pos(now);
    var jour = now >= lever && now <= coucher;
    var prochaine = prieres.filter(function (p) { return p.etat === 'prochaine'; })[0];
    return h('section', { className: 'sj-arc', 'aria-label': 'Arc du jour' },
      props.dans ? h('div', { className: 'sj-arc__head' },
        h('p', { className: 'chiffre sj-tabnum' }, props.dans),
        prochaine ? h('p', { className: 'sj-arc__next' }, 'avant ', h('b', null, prochaine.nom), h('br'), 'à ' + prochaine.heure) : null) : null,
      h('svg', { width: '100%', viewBox: '0 0 ' + W + ' 124', role: 'img', 'aria-label': props.description || 'La course du soleil entre les cinq prières', className: 'sj-arc__svg' },
        h('line', { x1: 0, y1: HZ, x2: W, y2: HZ, className: 'sj-arc__horizon' }),
        h('path', { d: 'M ' + X0 + ' ' + HZ + ' A ' + RX + ' ' + RY + ' 0 0 1 ' + X1 + ' ' + HZ, className: 'sj-arc__day' }),
        jour ? h('path', { d: 'M ' + X0 + ' ' + HZ + ' A ' + RX + ' ' + RY + ' 0 0 1 ' + sun[0].toFixed(1) + ' ' + sun[1].toFixed(1), className: 'sj-arc__done' }) : null,
        h('path', { d: 'M ' + X1 + ' ' + HZ + ' Q ' + CX + ' ' + NIGHT_Y + ' ' + X0 + ' ' + HZ, className: 'sj-arc__night' }),
        prieres.map(function (p) {
          var xy = pos(minutes(p.heure));
          var next = p.etat === 'prochaine';
          return h('circle', { key: p.nom, cx: xy[0].toFixed(1), cy: xy[1].toFixed(1), r: next ? 7 : 4.5, className: 'sj-arc__dot sj-arc__dot--' + p.etat });
        }),
        h('polygon', { points: starPoints(sun[0], 9, sun[1]), className: cx('sj-arc__sun', !jour && 'sj-arc__sun--nuit') })),
      h('ol', { className: 'sj-arc__labels' }, prieres.map(function (p) {
        return h('li', { key: p.nom, className: cx('legende sj-tabnum', p.etat === 'prochaine' && 'sj-arc__label--next'), 'aria-current': p.etat === 'prochaine' ? 'true' : undefined },
          p.nom, h('br'), p.heure);
      })));
  }

  function PrayerTimes(props) {
    var prieres = props.prieres || [];
    return h('section', { className: 'sj-card sj-prayer', 'aria-label': 'Horaires de prière' },
      h('header', { className: 'sj-prayer__head' },
        h('div', null,
          h('p', { className: 'titre-3' }, props.lieu),
          h('p', { className: 'legende sj-c3' }, props.date)),
        h(IconButton, { icone: 'bell', label: 'Réglages de l’appel à la prière' })),
      h('ol', { className: 'sj-prayer__list' }, prieres.map(function (p) {
        var next = p.etat === 'prochaine';
        return h('li', { key: p.nom, className: cx('sj-prayer__row', next && 'sj-prayer__row--next', p.etat === 'passee' && 'sj-prayer__row--past'), 'aria-current': next ? 'true' : undefined },
          h('span', { className: 'sj-prayer__dot', 'aria-hidden': 'true' }),
          h('span', { className: 'sj-prayer__names' },
            h('span', { className: 'corps sj-prayer__name' }, p.nom),
            p.nomLocal ? h('span', { className: 'legende sj-prayer__local' }, p.nomLocal) : null),
          p.nomArabe ? h('span', { lang: 'ar', dir: 'rtl', className: 'sj-prayer__ar' }, p.nomArabe) : null,
          h('span', { className: 'sj-prayer__time' },
            h('span', { className: 'titre-3 sj-tabnum' }, p.heure),
            next && props.dans ? h('span', { className: 'legende sj-prayer__in' }, props.dans) : null));
      })));
  }

  // Boussole de qibla : le repère du haut est l'axe du téléphone ; le cadran tourne, l'étoile (la Kaaba) reste à son relèvement.
  function QiblaCompass(props) {
    var cap = props.cap || 0;
    var qibla = props.qibla != null ? props.qibla : 74;
    var rel = ((qibla - cap) % 360 + 360) % 360;
    var ecart = Math.min(rel, 360 - rel);
    var aligne = ecart <= (props.tolerance || 3);
    var ticks = [];
    for (var d = 0; d < 360; d += 10) {
      var major = d % 90 === 0;
      ticks.push(h('line', { key: d, x1: 120, y1: 18, x2: 120, y2: major ? 30 : 24, transform: 'rotate(' + d + ' 120 120)', className: major ? 'sj-qibla__tick sj-qibla__tick--major' : 'sj-qibla__tick' }));
    }
    var consigne = aligne ? 'Vous faites face à la qibla'
      : (ecart < 30 ? 'Encore un peu à ' : 'Tournez à ') + (rel <= 180 ? 'droite' : 'gauche');
    return h('div', { className: cx('sj-qibla', aligne && 'sj-qibla--ok') },
      h('p', { className: 'titre-2 sj-qibla__msg', 'aria-live': 'polite' }, consigne),
      h('svg', { viewBox: '0 0 240 240', className: 'sj-qibla__svg', role: 'img', 'aria-label': aligne ? consigne : 'La qibla est à ' + Math.round(ecart) + ' degrés à ' + (rel <= 180 ? 'droite' : 'gauche') },
        h('circle', { cx: 120, cy: 120, r: 108, className: 'sj-qibla__ring' }),
        h('g', { transform: 'rotate(' + (-cap) + ' 120 120)' },
          ticks,
          h('text', { x: 120, y: 46, className: 'sj-qibla__n' }, 'N'),
          h('g', { transform: 'rotate(' + qibla + ' 120 120)' },
            h('line', { x1: 120, y1: 120, x2: 120, y2: 44, className: 'sj-qibla__ray' }),
            h('polygon', { points: starPoints(120, 13, 36), className: 'sj-qibla__kaaba' }))),
        h('polygon', { points: '120,1 114,11 126,11', className: 'sj-qibla__marker' }),
        h('circle', { cx: 120, cy: 120, r: 6, className: 'sj-qibla__hub' })),
      h('p', { className: 'legende sj-c3 sj-tabnum' }, 'Qibla à ' + Math.round(qibla) + '° du nord' + (props.lieu ? ' · ' + props.lieu : '') + (aligne ? '' : ' · écart ' + Math.round(ecart) + '°')));
  }

  function TasbihCounter(props) {
    var objectif = props.objectif || 33;
    var st = React.useState(props.compte || 0);
    var compte = st[0], setCompte = st[1];
    var C = 2 * Math.PI * 88;
    var part = Math.min(compte / objectif, 1);
    var fini = compte >= objectif;
    return h('div', { className: 'sj-tasbih' },
      h('button', {
        type: 'button', className: cx('sj-tasbih__bead', fini && 'sj-tasbih__bead--done'),
        'aria-label': 'Compter : ' + compte + ' sur ' + objectif,
        onClick: function () { setCompte(compte + 1); }
      },
        h('svg', { viewBox: '0 0 200 200', className: 'sj-tasbih__ring', 'aria-hidden': 'true' },
          h('circle', { cx: 100, cy: 100, r: 88, className: 'sj-tasbih__track' }),
          h('circle', { cx: 100, cy: 100, r: 88, className: 'sj-tasbih__progress', strokeDasharray: C, strokeDashoffset: C * (1 - part), transform: 'rotate(-90 100 100)' })),
        h('span', { className: 'sj-tasbih__inner' },
          h('span', { className: 'chiffre sj-tabnum', 'aria-live': 'polite' }, compte),
          h('span', { className: 'legende sj-c3' }, fini ? 'Objectif atteint' : 'sur ' + objectif))),
      props.formuleArabe ? h('p', { lang: 'ar', dir: 'rtl', className: 'arabe sj-tasbih__ar' }, props.formuleArabe) : null,
      props.formule ? h('p', { className: 'translitteration sj-c2 sj-tasbih__tr' }, props.formule) : null,
      h(Button, { variant: 'discret', icone: 'reset', onClick: function () { setCompte(0); } }, 'Remettre à zéro'));
  }

  // ——— Ensemble ———

  // Fil de régularité : un grain par jour du mois, sans série à perdre.
  function BeadThread(props) {
    var jours = props.jours || [];
    var titre = props.titre || 'Fil de régularité';
    return h('section', { className: 'sj-beads', 'aria-label': titre },
      h('div', { className: 'sj-beads__head' },
        h('span', { className: 'libelle' }, titre),
        props.resume ? h('span', { className: 'sj-beads__sum' }, props.resume) : null),
      h('div', { className: 'sj-beads__row', role: 'img', 'aria-label': props.resume || titre },
        jours.map(function (j, i) {
          return h('span', { key: i, className: cx('sj-bead', j.fait && 'sj-bead--fait', j.aujourdhui && 'sj-bead--auj') });
        })));
  }

  var KHATM_LABELS = { lu: 'lu', 'en-cours': 'en cours', vous: 'le vôtre', libre: 'libre' };

  function KhatmGrid(props) {
    var juz = props.juz || [];
    return h('div', { className: 'sj-khatm' },
      h('ol', { className: 'sj-khatm__grid', 'aria-label': props.label || 'Les 30 juz du khatm' },
        juz.map(function (j) {
          var bouton = j.etat === 'libre' && props.onChoisir;
          return h('li', { key: j.n },
            h(bouton ? 'button' : 'span', {
              type: bouton ? 'button' : undefined, onClick: bouton ? function () { props.onChoisir(j.n); } : undefined,
              className: 'sj-khatm__cell sj-khatm__cell--' + j.etat,
              'aria-label': 'Juz ' + j.n + ', ' + KHATM_LABELS[j.etat] + (j.qui ? ', ' + j.qui : '')
            },
              h('span', { className: 'libelle sj-tabnum', 'aria-hidden': 'true' }, j.n),
              j.etat === 'lu' ? h(Icon, { name: 'check', size: 12, className: 'sj-khatm__mark' }) : null,
              j.etat === 'en-cours' ? h('span', { className: 'sj-khatm__dots', 'aria-hidden': 'true' }) : null));
        })),
      props.legende === false ? null : h('ul', { className: 'sj-khatm__legend legende sj-c2' },
        ['lu', 'en-cours', 'vous', 'libre'].map(function (k) {
          return h('li', { key: k }, h('span', { className: 'sj-khatm__key sj-khatm__cell--' + k, 'aria-hidden': 'true' }), KHATM_LABELS[k]);
        })));
  }

  // ——— Budget ———

  function AmountDisplay(props) {
    var dev = props.devise || DEVISES.XOF;
    var n = props.montant || 0;
    var sym = h('span', { className: 'sj-amount__sym' }, dev.symbole);
    return h('div', { className: cx('sj-amount', 'sj-amount--' + (props.ton || 'neutre'), props.centre && 'sj-amount--centre') },
      props.libelle ? h('p', { className: 'legende sj-c2 sj-amount__label' }, props.libelle) : null,
      h('p', { className: 'sj-amount__value', 'aria-label': (props.signe === '+' ? 'plus ' : props.signe ? 'moins ' : '') + formatMontant(n, dev) },
        props.signe ? h('span', { className: 'sj-amount__sign', 'aria-hidden': 'true' }, props.signe === '-' ? '−' : props.signe) : null,
        dev.position === 'avant' ? sym : null,
        h('span', { className: 'chiffre sj-tabnum', 'aria-hidden': 'true' }, grouper(n, dev.decimales || 0)),
        props.saisie ? h('span', { className: 'sj-amount__caret', 'aria-hidden': 'true' }) : null,
        dev.position !== 'avant' ? sym : null),
      props.detail ? h('p', { className: 'corps sj-c2' }, props.detail) : null);
  }

  var KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '000', '0', 'efface'];

  function Keypad(props) {
    return h('div', { className: 'sj-keypad', role: 'group', 'aria-label': 'Pavé numérique' },
      KEYS.map(function (k) {
        return h('button', {
          key: k, type: 'button', className: cx('sj-key', k === 'efface' && 'sj-key--fn'),
          'aria-label': k === 'efface' ? 'Effacer le dernier chiffre' : k === '000' ? 'Trois zéros' : undefined,
          onClick: function () { if (props.onTouche) props.onTouche(k); }
        }, k === 'efface' ? h(Icon, { name: 'backspace', size: 24 }) : h('span', { className: 'sj-key__n' }, k));
      }));
  }

  function Envelope(props) {
    var dev = props.devise || DEVISES.XOF;
    var dep = props.depense || 0, pl = props.plafond || 0;
    var r = pl ? dep / pl : 0;
    var etat = props.fixe && dep >= pl ? 'regle' : r > 1 ? 'depasse' : r >= 0.85 ? 'proche' : 'ok';
    var detail = etat === 'regle' ? 'Réglé pour ce cycle'
      : etat === 'depasse' ? 'Dépassé de ' + formatMontant(dep - pl, dev)
        : 'Reste ' + formatMontant(pl - dep, dev);
    var ton = etat === 'regle' ? 'emeraude' : etat === 'proche' ? 'alerte' : props.ton || 'emeraude';
    var attrs = props.onClick ? { type: 'button', onClick: props.onClick } : {};
    attrs.className = cx('sj-env', 'sj-env--' + etat, props.onClick && 'sj-env--btn');
    return h(props.onClick ? 'button' : 'div', attrs,
      h('span', { className: 'sj-env__icon', 'aria-hidden': 'true' }, h(Icon, { name: props.icone || 'wallet', size: 20 })),
      h('span', { className: 'sj-env__main' },
        h('span', { className: 'sj-env__line' },
          h('span', { className: 'corps sj-env__name' }, props.nom),
          h('span', { className: 'libelle sj-tabnum' }, formatMontant(dep, dev))),
        h(ProgressBar, { valeur: r, ton: ton, fine: true, nomAccessible: props.nom, detail: detail }),
        h('span', { className: 'sj-env__line' },
          h('span', { className: 'legende sj-env__state' },
            etat === 'depasse' ? h(Icon, { name: 'alert', size: 12 }) : etat === 'regle' ? h(Icon, { name: 'check', size: 12 }) : null,
            detail),
          h('span', { className: 'legende sj-c3 sj-tabnum' }, 'sur ' + formatMontant(pl, dev)))));
  }

  function SavingsGoal(props) {
    var dev = props.devise || DEVISES.XOF;
    var r = props.objectif ? props.epargne / props.objectif : null;
    return h('article', { className: 'sj-card sj-goal' },
      h('div', { className: 'sj-goal__head' },
        h('span', { className: 'sj-goal__icon', 'aria-hidden': 'true' }, h(Icon, { name: props.icone || 'target', size: 20 })),
        h('div', { className: 'sj-goal__titles' },
          h('h3', { className: 'titre-3' }, props.nom),
          props.intention ? h('p', { className: 'translitteration sj-c2' }, props.intention) : null),
        props.echeance ? h(Badge, { ton: 'neutre', icone: 'calendar' }, props.echeance) : null),
      h('div', { className: 'sj-goal__amounts' },
        h('span', { className: 'sj-goal__saved sj-tabnum' }, formatMontant(props.epargne, dev)),
        h('span', { className: 'corps sj-c2 sj-tabnum' }, r != null ? 'sur ' + formatMontant(props.objectif, dev) : 'sans montant fixé')),
      r != null ? h(ProgressBar, { valeur: r, ton: 'or', nomAccessible: props.nom, detail: Math.round(r * 100) + ' %' }) : null,
      props.conseil ? h('p', { className: 'legende sj-c2 sj-goal__tip' }, props.conseil) : null);
  }


  // ——— Dons ———

  // Un wallet où envoyer un don : nom, numéro à copier, titulaire. Aucun paiement dans l'app.
  function WalletCard(props) {
    var st = React.useState(false);
    var copie = st[0];
    var initiales = String(props.nom || '?').slice(0, 2);
    function copier() {
      try { if (navigator.clipboard) navigator.clipboard.writeText(String(props.numero).replace(/\s/g, '')); } catch (e) { /* aperçu */ }
      st[1](true);
      if (props.onCopie) props.onCopie();
    }
    var attrs = props.onChoisir ? { type: 'button', onClick: props.onChoisir, 'aria-pressed': props.choisi ? 'true' : 'false' } : {};
    return h('div', { className: cx('sj-wallet', props.choisi && 'sj-wallet--on') },
      h(props.onChoisir ? 'button' : 'div', Object.assign({ className: 'sj-wallet__head' }, attrs),
        h('span', { className: 'sj-wallet__mono', 'aria-hidden': 'true' }, initiales),
        h('span', { className: 'sj-wallet__names' },
          h('span', { className: 'titre-3' }, props.nom),
          props.pays ? h('span', { className: 'legende sj-c3' }, props.pays) : null),
        props.choisi ? h(Icon, { name: 'check', size: 20, className: 'sj-wallet__check' }) : null),
      props.choisi !== false ? h('div', { className: 'sj-wallet__body' },
        h('div', { className: 'sj-wallet__num' },
          h('span', { className: 'legende sj-c3' }, 'Numéro'),
          h('span', { className: 'sj-wallet__digits sj-tabnum' }, props.numero)),
        props.titulaire ? h('p', { className: 'legende sj-c2' }, 'Au nom de ' + props.titulaire) : null,
        h(Button, { variant: 'secondaire', icone: copie ? 'check' : 'copy', onClick: copier, 'aria-live': 'polite' }, copie ? 'Numéro copié' : 'Copier le numéro')) : null);
  }

  var api = {
    Button: Button, Chip: Chip, Badge: Badge,
    TopBar: TopBar, TabBar: TabBar, Menu: Menu, PageDots: PageDots, SectionHeader: SectionHeader,
    ListItem: ListItem, ListGroup: ListGroup,
    SearchField: SearchField, TextField: TextField, Switch: Switch, Checkbox: Checkbox, RadioGroup: RadioGroup,
    SegmentedControl: SegmentedControl, Slider: Slider,
    ProgressBar: ProgressBar, Banner: Banner, Toast: Toast, Dialog: Dialog, BottomSheet: BottomSheet,
    EmptyState: EmptyState, Skeleton: Skeleton,
    ReadingCard: ReadingCard, Ornament: Ornament, VerseShareCard: VerseShareCard,
    AudioPlayer: AudioPlayer,
    DayArc: DayArc, PrayerTimes: PrayerTimes, QiblaCompass: QiblaCompass, TasbihCounter: TasbihCounter,
    BeadThread: BeadThread, KhatmGrid: KhatmGrid,
    AmountDisplay: AmountDisplay, Keypad: Keypad, Envelope: Envelope, SavingsGoal: SavingsGoal,
    WalletCard: WalletCard,
    Icon: Icon, IconButton: IconButton, Medallion: Medallion,
    formatMontant: formatMontant, DEVISES: DEVISES, ICONES: Object.keys(PATHS)
  };
  window.SamaJamm = Object.assign(window.SamaJamm || {}, api);
})();
