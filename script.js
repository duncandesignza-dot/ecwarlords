(function(){
  "use strict";

  window.addEventListener('load', function(){ document.body.classList.add('loaded'); });

  /* ---------- ACTIVE NAV LINK ---------- */
  var current = document.body.getAttribute('data-page');
  document.querySelectorAll('.navlinks a[data-page]').forEach(function(a){
    if(a.getAttribute('data-page') === current){
      a.classList.add('active');
      // "page" when this IS the nav page; "true" for sub-pages (e.g. a tool under Tools)
      var file = (location.pathname.split('/').pop() || 'index').replace(/\.html$/,'');
      var target = (a.getAttribute('href') || '').replace(/^\.\//,'') || 'index';
      a.setAttribute('aria-current', file === target ? 'page' : 'true');
    }
  });

  /* ---------- ACCESSIBILITY HELPERS ---------- */
  // Keep aria-pressed in sync with the visual "on"/"active" state of every
  // toggle chip and filter button, whichever page script flips the class.
  function syncPressed(el){
    if(el.classList.contains('chip') || el.classList.contains('filter-btn')){
      el.setAttribute('aria-pressed', (el.classList.contains('on') || el.classList.contains('active')) ? 'true' : 'false');
    }
  }
  document.querySelectorAll('button.chip, button.filter-btn').forEach(syncPressed);
  if('MutationObserver' in window){
    new MutationObserver(function(muts){
      muts.forEach(function(m){ if(m.target.tagName === 'BUTTON') syncPressed(m.target); });
    }).observe(document.body, {attributes:true, attributeFilter:['class'], subtree:true});
  }

  // Modal dialog behaviour: focus moves in on open, Tab stays inside,
  // focus returns to whatever opened it on close.
  function makeDialog(el, closeBtn){
    var lastFocus = null;
    el.addEventListener('keydown', function(e){
      if(e.key !== 'Tab') return;
      var f = el.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
      if(!f.length) return;
      var first = f[0], last = f[f.length-1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); }
      else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    });
    return {
      open: function(){
        lastFocus = document.activeElement; el.classList.add('open');
        // the dialog fades in from visibility:hidden, so focus once it's focusable
        if(closeBtn){
          setTimeout(function(){ closeBtn.focus(); }, 40);
          // second attempt once the fade-in has finished, in case the first
          // landed while the dialog was still visibility:hidden
          setTimeout(function(){ if(el.classList.contains('open') && !el.contains(document.activeElement)) closeBtn.focus(); }, 320);
        }
      },
      close: function(){
        if(!el.classList.contains('open')) return;
        el.classList.remove('open');
        if(lastFocus && lastFocus.focus) lastFocus.focus();
      }
    };
  }

  // Make a non-button card open with Enter/Space like a button would
  function makeActivatable(el, label){
    el.setAttribute('tabindex','0');
    el.setAttribute('role','button');
    if(label) el.setAttribute('aria-label', label);
    el.addEventListener('keydown', function(e){
      if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); el.click(); }
    });
  }

  /* ---------- MOBILE NAV ---------- */
  var burgerBtn = document.getElementById('burgerBtn');
  var navlinks = document.getElementById('navlinks');
  var topnav = document.querySelector('.topnav');

  // The menu panel is sized from the real header height rather than a
  // hardcoded value, so it never overlaps or leaves a gap on any device.
  function setNavHeight(){
    if(!topnav) return;
    document.documentElement.style.setProperty('--nav-h', topnav.offsetHeight + 'px');
  }
  setNavHeight();
  window.addEventListener('resize', setNavHeight);
  window.addEventListener('orientationchange', function(){ setTimeout(setNavHeight, 150); });
  window.addEventListener('load', setNavHeight);

  if(burgerBtn && navlinks){
    burgerBtn.setAttribute('aria-controls','navlinks');
    var closeMenu = function(){
      navlinks.classList.remove('open');
      burgerBtn.setAttribute('aria-expanded','false');
      document.body.style.overflow = '';
    };
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape' && navlinks.classList.contains('open')){
        closeMenu();
        burgerBtn.focus();
      }
    });
    burgerBtn.addEventListener('click', function(){
      var open = navlinks.classList.toggle('open');
      burgerBtn.setAttribute('aria-expanded', open ? 'true':'false');
      document.body.style.overflow = open ? 'hidden' : '';
      // The menu comes before the burger in the markup, so move focus into it
      // once the slide-in has made it visible (hidden elements can't take focus)
      if(open){
        setTimeout(function(){
          var first = navlinks.querySelector('a');
          if(first && navlinks.classList.contains('open')) first.focus({preventScroll:true});
        }, 320);
      }
    });
    // Close the menu (and restore scrolling) when a link is tapped
    navlinks.addEventListener('click', function(e){
      if(e.target.closest('a')) closeMenu();
    });
    // Close when keyboard focus leaves both the menu and the burger
    var onMenuFocusOut = function(e){
      if(navlinks.classList.contains('open') && e.relatedTarget &&
         !navlinks.contains(e.relatedTarget) && e.relatedTarget !== burgerBtn) closeMenu();
    };
    navlinks.addEventListener('focusout', onMenuFocusOut);
    burgerBtn.addEventListener('focusout', onMenuFocusOut);
    // Widening past the burger breakpoint would otherwise leave scrolling locked
    var desktopNav = window.matchMedia('(min-width:881px)');
    var onDesktopNav = function(){ if(desktopNav.matches && navlinks.classList.contains('open')) closeMenu(); };
    if(desktopNav.addEventListener) desktopNav.addEventListener('change', onDesktopNav);
    else desktopNav.addListener(onDesktopNav);
  }

  /* ---------- EMBERS ---------- */
  var emberHost = document.getElementById('emberHost');
  if(emberHost){
    var EMBER_COUNT = 26;
    for (var i=0;i<EMBER_COUNT;i++){
      var e = document.createElement('span');
      e.className = 'ember';
      var size = 2 + Math.random()*5;
      e.style.width = size+'px';
      e.style.height = size+'px';
      e.style.left = (Math.random()*100)+'%';
      e.style.setProperty('--drift', (Math.random()*80-40)+'px');
      var dur = 7 + Math.random()*9;
      e.style.animationDuration = dur+'s';
      e.style.animationDelay = (Math.random()*dur)+'s';
      emberHost.appendChild(e);
    }
  }

  /* ---------- GALLERY DATA (used on gallery.html) ---------- */
  var ARMY_DATA = [
    {faction:'chaos', label:'CHAOS SPACE MARINES', title:'Abaddon the Despoiler', painter:'Matthew Carslake', img:'assets/abaddon-despoiler.webp', desc:'Warmaster Abaddon himself, Drach\'nyen alight and a fallen foe underfoot, painted in deep Black Legion blue with molten-orange flame licking up his cloak.'},
    {faction:'marines', label:'SPACE MARINES', title:'Leviathan Siege Dreadnought', painter:'Matthew Carslake', img:'assets/leviathan-dreadnought.webp', desc:'A Leviathan Pattern Dreadnought armed with a storm cannon array and siege claw, painted in bold Ultramarine blue with crisp edge highlighting and a suitably grim basing scene.'},
    {faction:'chaos', label:'DISCIPLES OF TZEENTCH', title:'Tzaangor Enlightened', painter:'Matthew Carslake', img:'assets/tzaangor-enlightened.webp', desc:'A Tzaangor Enlightened riding its Disc of Tzeentch, painted in rich purples and teal with contrasting bronze weaponry and a lava-cracked stone base.'},
    {faction:'chaos', label:'CHAOS KNIGHTS', title:'Knight Abominant', painter:'Matthew Carslake', img:'assets/knight-abominant-i.webp', desc:'The first knight of Matthew\'s traitor household, painted in bone, black, and acid-green flame, with rust and blood weathering worked into every panel line and chain-hung trophy skull.'},
    {faction:'chaos', label:'CHAOS KNIGHTS', title:'Knight Abominant II', painter:'Matthew Carslake', img:'assets/knight-abominant-ii.webp', desc:'The household\'s second knight, armed with twin rainbow-glazed cannons and standing on a cracked lava base that matches the rest of the force.'},
    {faction:'chaos', label:'CHAOS KNIGHTS', title:'Knight Abominant III', painter:'Matthew Carslake', img:'assets/knight-abominant-iii.webp', desc:'Household knight the third, wielding a heavy conversion beamer and chain-flail, marked with the household\'s numeral sigil across shield and banner alike.'},
    {faction:'chaos', label:'CHAOS KNIGHTS', title:'Knight Abominant IV, "Iratus"', painter:'Matthew Carslake', img:'assets/knight-abominant-iv.webp', desc:'The named champion of the household, "Iratus" - twin havoc launchers, a blood-stained banner, and daemon familiars perched across its carapace.'},
    {faction:'chaos', label:'CHAOS DAEMONS', title:'Kairos Fateweaver', painter:'Matthew Carslake', img:'assets/kairos-fateweaver.webp', desc:'The two-headed Lord of Change himself, painted in Tzeentchian teal and bronze with a wet-blend across every feather of his vast wings.'},
    {faction:'chaos', label:'CHAOS SPACE MARINES', title:'Dark Apostle', painter:'Matthew Carslake', img:'assets/dark-apostle.webp', desc:'A Word Bearers Dark Apostle mid-sermon, tome ablaze and crozius raised, finished in deep blues with hand-lettered scripture running down his stole.'},
    {faction:'chaos', label:'CHAOS DAEMONS', title:'Kytan Ravager', painter:'Matthew Carslake', img:'assets/kytan-ravager.webp', desc:'A brass-and-shadow engine of Khorne, painted with cold, industrial blues to make its furnace-red details burn even brighter by contrast.'},
    {faction:'marines', label:'SPACE WOLVES', title:'Logan Grimnar, Great Wolf', painter:'Steven John Ovens', img:'assets/logan-grimnar.webp', desc:'Steven\'s competition entry - Logan Grimnar flanked by Fenrisian wolves, with freehand frost effects on the axe, layered fur work, and a fully sculpted rocky base. Painted ahead of Leman Russ\'s long-awaited return to 40k.'},
    {faction:'marines', label:'SPACE WOLVES', title:'Bjorn the Fell-Handed', painter:'Steven John Ovens', img:'assets/bjorn-fell-handed.webp', desc:'The legendary Dreadnought of the Space Wolves, painted by Steven in the chapter\'s icy blue and gold, with a hand-painted wolf pelt drape and cracked-ice basing to match the rest of his Fenrisian force.'},
    {faction:'marines', label:'SPACE WOLVES', title:'The Great Company Assembles', painter:'Steven John Ovens', img:'assets/space-wolves-army.webp', desc:'Steven\'s full Space Wolves force on parade - three Dreadnoughts, a full pack of Fenrisian wolves, and squad after squad of Blood Claws and Grey Hunters, all painted to a single, cohesive icy palette.'},
    {faction:'marines', label:'SPACE WOLVES', title:'Redemptor Dreadnought', painter:'Steven John Ovens', img:'assets/redemptor-dreadnought.webp', desc:'A heavy-hitting Redemptor, finished in the pack\'s signature blue and gold with a hand-painted wolf-head icon and warning chevrons picked out in red and yellow.'},
    {faction:'marines', label:'SPACE WOLVES', title:'Venerable Dreadnought', painter:'Steven John Ovens', img:'assets/venerable-dreadnought.webp', desc:'An ancient Venerable Dreadnought armed with a frost axe and storm shield, its armour hung with trophies and painted runes, standing on cracked permafrost basing.'},
    {faction:'marines', label:'SPACE WOLVES', title:'Chaplain on Bike', painter:'Steven John Ovens', img:'assets/chaplain-on-bike.webp', desc:'A Primaris Chaplain riding out on his war-bike, crozius raised and a wolf-pelt trophy lashed to the front - a dark, cathedral-grey scheme with gold reliquary trim.'},
    {faction:'marines', label:'SPACE MARINES', title:'Chaplain with Jump Pack', painter:'Steven John Ovens', img:'assets/chaplain-jumppack.webp', desc:'A dynamic jump-pack Chaplain caught mid-leap, with hand-painted black wings, skull iconography, and copper trim built up in thin glazes for real metallic depth.'},
    {faction:'custodes', label:'ADEPTUS CUSTODES', title:'Shield-Captain and Custodian Guard', painter:'Steven John Ovens', img:'assets/custodes-guard.webp', desc:'A Shield-Captain and Custodian Guard, painted in deep red and green with a rainbow-gradient effect freehanded onto every energy blade - now something of a signature technique for Steven.'},
    {faction:'custodes', label:'ADEPTUS CUSTODES', title:'Custodes Vexilla Detachment', painter:'Steven John Ovens', img:'assets/custodes-vexilla.webp', desc:'Twin Custodian Guards flanking a vexilla bearer, its feathered standard picked out in the same prismatic gradient as the rest of the detachment\'s weapons.'},
    {faction:'custodes', label:'ADEPTUS CUSTODES', title:'Custodes Grav-Cavalry', painter:'Steven John Ovens', img:'assets/custodes-jetbike.webp', desc:'A Custodian outrider on grav-cavalry, lance held high and glowing with the same rainbow energy effect Steven\'s carried across his entire Custodes force.'},
    {faction:'custodes', label:'SISTERS OF SILENCE', title:'Sisters of Silence', painter:'Steven John Ovens', img:'assets/sisters-of-silence.webp', desc:'A squad of the Emperor\'s null-maidens: Vigilators with executioner greatblades, Prosecutors with boltguns and a Witchseeker with her flamer. Burnished gold armour over deep purple cloaks and tabards, pale grey plumes and turquoise gem details, all standing on grey rubble bases with bright green tufts and skulls.'},
    {faction:'seraphon', label:'SERAPHON', title:'Saurus Oldblood on Carnosaur', painter:'Devin Du Plessis', img:'assets/saurus-oldblood-carnosaur.webp', desc:'A Saurus Oldblood riding to war on his Carnosaur, painted in deep crimson scales with black striping and a fully scratch-built jungle base, complete with hand-painted foliage and celestite crystals.'},
    {faction:'seraphon', label:'SERAPHON', title:'Slann Starmaster', painter:'Devin Du Plessis', img:'assets/slann-starmaster.webp', desc:'The Starmaster on his palanquin, attended by skink retainers, painted in vivid jungle greens and golds with an intricate celestial-blue glow worked into every rune and crystal.'},
    {faction:'chaos', label:'DEATH GUARD', title:'Mortarion, Daemon Primarch of Nurgle', painter:'Sjoerd Leister', img:'assets/mortarion.webp', desc:'The Death Guard\'s Primarch in his full daemonic ascension, painted in muted decaying greens and bone, with his scythe\'s inner flame picked out in a hot, glowing orange for contrast against the rot.'},
    {faction:'chaos', label:'CHAOS DAEMONS', title:'Be\'lakor, the Dark Master', painter:'Devin Du Plessis', img:'assets/belakor.webp', desc:'Be\'lakor, the first Daemon Prince, raised to power by the four Chaos Gods and later cursed to rule only from the shadows. Devin\'s version pairs violet-to-amber wings with a molten lava base and a spectral green blade.'},
    {faction:'orks', label:'ORKS', title:'Beastboss', painter:'Oliver Bilson', img:'assets/beastboss.webp', desc:'A Beastboss with his squighound in tow, painted in classic Ork green with rusted metal plating and a desert-red basing scheme finished off with a scattering of purple tufts and cacti.'},
    {faction:'tyranids', label:'TYRANIDS', title:'Winged Hive Tyrant', painter:'Gabriel Goddard', img:'assets/hive-tyrant.webp', desc:'A Winged Hive Tyrant finished in bronze and gold carapace over a bone-white underbelly, with a striking electric-blue glow carried through every talon and bio-weapon tip.'}
  ];

  function escAttr(s){
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
  }

  // Armoury lightbox (gallery.html and the homepage Armoury picks). Wired up
  // on first use so pages without #lightbox pay nothing.
  var armoryDialog = null;
  function openArmoryItem(item){
    var lightbox = document.getElementById('lightbox');
    if(!lightbox) return;
    if(!armoryDialog){
      var lbClose = document.getElementById('lbClose');
      armoryDialog = makeDialog(lightbox, lbClose);
      lightbox.setAttribute('aria-labelledby','lbTitle');
      if(lbClose) lbClose.addEventListener('click', armoryDialog.close);
      lightbox.addEventListener('click', function(e){ if(e.target === lightbox) armoryDialog.close(); });
      document.addEventListener('keydown', function(e){ if(e.key === 'Escape') armoryDialog.close(); });
    }
    var lbArt = document.getElementById('lbArt');
    lbArt.className = 'art has-photo';
    lbArt.innerHTML = '<img src="'+escAttr(item.img)+'" alt="'+escAttr(item.title + ' painted by ' + item.painter)+'">';
    document.getElementById('lbFaction').textContent = item.label;
    document.getElementById('lbTitle').textContent = item.title;
    document.getElementById('lbDesc').textContent = item.desc;
    document.getElementById('lbPainter').textContent = 'Painted by ' + item.painter;
    armoryDialog.open();
  }

  var galleryGrid = document.getElementById('galleryGrid');
  if(galleryGrid){
    ARMY_DATA.forEach(function(item, idx){
      var card = document.createElement('div');
      card.className = 'gcard show';
      card.dataset.faction = item.faction;
      card.dataset.idx = idx;
      var altText = escAttr(item.title + ' painted by ' + item.painter);
      card.innerHTML =
        '<div class="art has-photo"><img src="'+item.img+'" alt="'+altText+'" loading="lazy"></div>' +
        '<div class="meta">'+
          '<div class="faction">'+item.label+'</div>'+
          '<h3>'+item.title+'</h3>'+
          '<div class="painter">by '+item.painter+'</div>'+
        '</div>';
      makeActivatable(card, 'View ' + item.title + ', painted by ' + item.painter);
      galleryGrid.appendChild(card);
    });

    var filterRow = document.getElementById('filterRow');
    if(filterRow){
      filterRow.addEventListener('click', function(e){
        var btn = e.target.closest('.filter-btn');
        if(!btn) return;
        filterRow.querySelectorAll('.filter-btn').forEach(function(b){b.classList.remove('active');});
        btn.classList.add('active');
        var f = btn.dataset.filter;
        galleryGrid.querySelectorAll('.gcard').forEach(function(c){
          c.classList.toggle('show', f==='all' || c.dataset.faction===f);
        });
      });
    }

    galleryGrid.addEventListener('click', function(e){
      var card = e.target.closest('.gcard');
      if(card) openArmoryItem(ARMY_DATA[+card.dataset.idx]);
    });
  }

  /* ---------- HOME PHOTO GALLERY LIGHTBOX ---------- */
  var photoGrid = document.getElementById('photoGrid');
  var photoLightbox = document.getElementById('photoLightbox');
  if(photoGrid && photoLightbox){
    var plbImg = document.getElementById('plbImg');
    var plbCap = document.getElementById('plbCap');
    var plbClose = document.getElementById('plbClose');
    var plbDialog = makeDialog(photoLightbox, plbClose);
    photoGrid.querySelectorAll('.photo-card').forEach(function(card){
      var im = card.querySelector('img');
      makeActivatable(card, 'Enlarge photo: ' + (card.dataset.caption || (im && im.alt) || ''));
    });
    photoGrid.addEventListener('click', function(e){
      var card = e.target.closest('.photo-card');
      if(!card) return;
      var img = card.querySelector('img');
      plbImg.src = img.src;
      plbImg.alt = img.alt;
      plbCap.textContent = card.dataset.caption || img.alt || '';
      plbDialog.open();
    });
    if(plbClose) plbClose.addEventListener('click', plbDialog.close);
    photoLightbox.addEventListener('click', function(e){ if(e.target===photoLightbox) plbDialog.close(); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape') plbDialog.close(); });
  }

  /* ---------- HOME: FROM THE ARMOURY ---------- */
  // Hand-picked pieces shown on the homepage, by exact ARMY_DATA title.
  // Edit this list to change the showcase; unknown titles are skipped.
  var HOME_ARMORY_PICKS = [
    'Knight Abominant III',
    'Venerable Dreadnought',
    'Custodes Vexilla Detachment',
    'Mortarion, Daemon Primarch of Nurgle',
    'Beastboss',
    'Abaddon the Despoiler',
    'Dark Apostle',
    'Slann Starmaster',
    'Kairos Fateweaver'
  ];
  var homeArmory = document.getElementById('homeArmory');
  if(homeArmory){
    HOME_ARMORY_PICKS.forEach(function(title){
      var item = ARMY_DATA.filter(function(i){ return i.title === title; })[0];
      if(!item) return;
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ha-card';
      b.setAttribute('aria-label', 'View ' + item.title + ', painted by ' + item.painter);
      b.innerHTML =
        '<img src="'+escAttr(item.img)+'" alt="" loading="lazy">'+
        '<span class="ha-info">'+
          '<span class="ha-label">'+escAttr(item.label)+'</span>'+
          '<span class="ha-title">'+escAttr(item.title)+'</span>'+
          '<span class="ha-painter">by '+escAttr(item.painter)+'</span>'+
        '</span>';
      b.addEventListener('click', function(){ openArmoryItem(item); });
      homeArmory.appendChild(b);
    });
  }

  /* ---------- HOME: LATEST FROM THE DISPATCH ---------- */
  // index.html ships with the three newest posts baked in; this refreshes them
  // from news.html so new Dispatch posts appear on the homepage on their own.
  var homeDispatch = document.getElementById('homeDispatch');
  if(homeDispatch && window.fetch && window.DOMParser){
    var MONTHS = {january:0,february:1,march:2,april:3,may:4,june:5,july:6,august:7,september:8,october:9,november:10,december:11};
    var parseNewsDate = function(s){
      var m = /([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/.exec(s || '');
      if(!m || !(m[1].toLowerCase() in MONTHS)) return 0;
      return new Date(+m[3], MONTHS[m[1].toLowerCase()], +m[2]).getTime();
    };
    fetch('news.html').then(function(r){ return r.ok ? r.text() : Promise.reject(); }).then(function(txt){
      var doc = new DOMParser().parseFromString(txt, 'text/html');
      var items = [].map.call(doc.querySelectorAll('.news-item'), function(it){
        var q = function(sel){ var el = it.querySelector(sel); return el ? el.textContent.trim() : ''; };
        var img = it.querySelector('.news-media img');
        var date = q('.news-date');
        return { date:date, t:parseNewsDate(date), title:q('h3'), tag:q('.news-tag'),
                 img: img ? img.getAttribute('src') : '', alt: img ? img.getAttribute('alt') : '' };
      }).filter(function(x){ return x.title; });
      if(!items.length) return;
      items.sort(function(a,b){ return b.t - a.t; });
      homeDispatch.innerHTML = items.slice(0,3).map(function(x){
        var media = x.img
          ? '<img src="'+escAttr(x.img)+'" alt="'+escAttr(x.alt)+'" loading="lazy">'
          : '<img class="hd-logo" src="assets/logo.webp" alt="" loading="lazy">';
        return '<a class="hd-card" href="news">'+
          '<div class="hd-media">'+media+'</div>'+
          '<div class="hd-body">'+
            '<div class="hd-meta"><span>'+escAttr(x.date)+'</span>'+(x.tag ? '<span>'+escAttr(x.tag)+'</span>' : '')+'</div>'+
            '<h3>'+escAttr(x.title)+'</h3>'+
          '</div></a>';
      }).join('');
    }).catch(function(){ /* keep the baked-in cards */ });
  }

  /* ---------- FAQ ACCORDION ---------- */
  var faqList = document.getElementById('faqList');
  if(faqList){
    faqList.querySelectorAll('.faq-item').forEach(function(fi, i){
      var q = fi.querySelector('.faq-q'), a = fi.querySelector('.faq-a');
      if(!q || !a) return;
      a.id = a.id || ('faq-a-' + (i+1));
      q.setAttribute('aria-controls', a.id);
      q.setAttribute('aria-expanded', fi.classList.contains('open') ? 'true' : 'false');
      var plus = q.querySelector('.plus'); if(plus) plus.setAttribute('aria-hidden','true');
    });
    faqList.addEventListener('click', function(e){
      var q = e.target.closest('.faq-q');
      if(!q) return;
      var item = q.parentElement;
      var wasOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.faq-item').forEach(function(fi){
        fi.classList.remove('open');
        fi.querySelector('.faq-a').style.maxHeight = null;
        var fq = fi.querySelector('.faq-q'); if(fq) fq.setAttribute('aria-expanded','false');
      });
      if(!wasOpen){
        item.classList.add('open');
        q.setAttribute('aria-expanded','true');
        var a = item.querySelector('.faq-a');
        a.style.maxHeight = a.scrollHeight + 'px';
      }
    });
  }

  /* ---------- JOIN FORM → WHATSAPP ---------- */
  // No backend: the form composes a message and opens WhatsApp (app on
  // phones, WhatsApp Web on desktop) addressed to the club's number.
  var CLUB_WHATSAPP = '27724749572';   // +27 72 474 9572, international format, digits only
  var joinForm = document.getElementById('joinForm');
  if(joinForm){
    joinForm.addEventListener('submit', function(e){
      e.preventDefault();
      var val = function(id){ var el = document.getElementById(id); return el ? el.value.trim() : ''; };
      var note = document.getElementById('formNote');
      if(!val('jf-name')){   // `required` lets a name of only spaces through
        document.getElementById('jf-name').focus();
        note.textContent = 'Please enter your name.';
        return;
      }
      var lines = [
        'Hi Eastern Cape Warlords! I\'d like to join the club.',
        '',
        'Name: ' + val('jf-name'),
        'Experience: ' + val('jf-exp'),
        'Faction I\'m eyeing: ' + val('jf-faction')
      ];
      var msg = val('jf-msg');
      if(msg) lines.push('', msg);
      var url = 'https://wa.me/' + CLUB_WHATSAPP + '?text=' + encodeURIComponent(lines.join('\n'));
      // (no 'noopener' feature here: with it window.open always returns null,
      // which would make the blocked-popup fallback fire every time)
      var w = window.open(url, '_blank');
      if(w){ try{ w.opener = null; }catch(err){} }
      else { location.href = url; }   // popup blocked: open in this tab instead
      note.textContent = 'Opening WhatsApp with your message. Just press send there. If nothing opened, message us on WhatsApp at +27 72 474 9572.';
    });
  }

  /* ---------- NAV: gains weight once scrolled ---------- */
  if(topnav){
    var lastScrolled = null;
    var onScroll = function(){
      var scrolled = window.scrollY > 24;
      if(scrolled !== lastScrolled){
        topnav.classList.toggle('scrolled', scrolled);
        lastScrolled = scrolled;
      }
    };
    // rAF-throttled so the scroll handler never blocks the main thread
    var ticking = false;
    window.addEventListener('scroll', function(){
      if(!ticking){
        window.requestAnimationFrame(function(){ onScroll(); ticking = false; });
        ticking = true;
      }
    }, {passive:true});
    onScroll();
  }

  /* ---------- Stagger grid children on reveal ---------- */
  // The gallery grid is excluded: its cards are
  // display-toggled by a filter/search, which conflicts with opacity-based
  // staggering. Those get the cardIn keyframe animation in CSS instead.
  [
    '.teaser-grid', '.photo-grid', '.pillars', '.officer-row',
    '.member-grid', '.steps', '.game-grid', '.news-feed'
  ].forEach(function(sel){
    document.querySelectorAll(sel).forEach(function(el){
      el.classList.add('stagger');
    });
  });

  /* ---------- SCROLL REVEAL ---------- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function(entries){
    entries.forEach(function(en){
      if(en.isIntersecting){ en.target.classList.add('in-view'); io.unobserve(en.target); }
    });
  }, {threshold:0, rootMargin:'0px 0px -40px 0px'}) : null;

  document.querySelectorAll('.reveal').forEach(function(el){
    if(io){ io.observe(el); } else { el.classList.add('in-view'); }
  });

  // Safety net: if any .reveal element still hasn't appeared after a couple
  // of seconds (e.g. a browser quirk that never fires the intersection
  // callback for a very tall element), force it visible rather than leaving
  // the page looking blank.
  setTimeout(function(){
    document.querySelectorAll('.reveal:not(.in-view)').forEach(function(el){
      el.classList.add('in-view');
    });
  }, 2000);

})();
